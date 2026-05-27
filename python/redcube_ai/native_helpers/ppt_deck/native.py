#!/usr/bin/env python3
import argparse
import hashlib
import json
import math
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

from redcube_ai.native_helpers.renderer_dependencies import (
    NATIVE_PPT_DEPENDENCY_INSTALL_COMMAND,
    install_commands,
    libreoffice_probe,
    platform_install_hint,
    poppler_probe,
)
from redcube_ai.native_helpers.ppt_deck.native_layouts import build_deck, safe_list, safe_text


CANVAS_PX = (1152, 648)
FRAME_AREA = float(CANVAS_PX[0] * CANVAS_PX[1])
MIN_NATIVE_DENSITY = 0.18
MAX_NATIVE_DENSITY = 0.82
MIN_NATIVE_EDGE_CLEARANCE = 24.0
MAX_NATIVE_PRIMARY_POINTS = 5
MIN_NATIVE_LAYOUT_RICHNESS = 0.68
TITLE_SAFE_ZONE_BOTTOM = 128.0
MIN_TABLE_BODY_FONT_PT = 11.0
MAX_TABLE_CELL_BLANK_RATIO = 0.38
OPERATOR_LANGUAGE_FRAGMENTS = [
    '汇报讨论用途',
    '客观专业版',
    '本次汇报边界',
    '不在展示页暴露',
    '本地原始文件名',
    '清洗脚本名',
    'RCA',
    'RedCube',
    'source intake',
    'author_pptx_native',
    'slide_blueprint',
    'visual_direction',
]
ENGINE_CAPABILITIES = {
    'authoring_ir': 'redcube_svg_ir',
    'authoring_ir_version': 1,
    'pptx_writer': 'redcube_drawingml_writer',
    'editable_pptx': True,
    'strict_svg_preflight': True,
    'true_render_proof_required': True,
    'true_render_proof_renderer': 'libreoffice_headless',
    'cross_platform_render_required': True,
    'screenshot_packaging': False,
}
RENDERER_PIPELINE = 'libreoffice_headless_pdf_png_v1'
RENDERER_KIND = 'libreoffice_headless'
REPO_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_ENGINE_CONTRACT_FILE = (
    REPO_ROOT
    / 'contracts'
    / 'runtime-program'
    / 'ppt-native-python-engine-contract.json'
)


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def rect_overlap_area(rect_a: dict, rect_b: dict) -> float:
    overlap_w = max(0.0, min(rect_a['right'], rect_b['right']) - max(rect_a['left'], rect_b['left']))
    overlap_h = max(0.0, min(rect_a['bottom'], rect_b['bottom']) - max(rect_a['top'], rect_b['top']))
    return overlap_w * overlap_h


def rect_union_area(rects: list[dict]) -> float:
    if not rects:
        return 0.0
    x_edges = sorted({
        float(rect[key])
        for rect in rects
        for key in ('left', 'right')
    })
    y_edges = sorted({
        float(rect[key])
        for rect in rects
        for key in ('top', 'bottom')
    })
    area = 0.0
    for x_index, left in enumerate(x_edges[:-1]):
        right = x_edges[x_index + 1]
        if right <= left:
            continue
        for y_index, top in enumerate(y_edges[:-1]):
            bottom = y_edges[y_index + 1]
            if bottom <= top:
                continue
            center_x = (left + right) / 2.0
            center_y = (top + bottom) / 2.0
            if any(
                float(rect['left']) <= center_x <= float(rect['right'])
                and float(rect['top']) <= center_y <= float(rect['bottom'])
                for rect in rects
            ):
                area += (right - left) * (bottom - top)
    return area


def file_sha256(file: Path) -> str:
    if not file.exists():
        return ''
    digest = hashlib.sha256()
    with file.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def image_dimensions(file: Path) -> dict:
    with Image.open(file) as image:
        return {'width': int(image.width), 'height': int(image.height)}


def text_capacity_failure(shape: dict) -> dict | None:
    if shape.get('kind') in {'chart', 'table', 'metric_grid'}:
        return None
    text = safe_text(shape.get('text'))
    if not text:
        return None
    rect = shape.get('bounds') or {}
    width = float(rect.get('width') or 0)
    height = float(rect.get('height') or 0)
    font_size = float(shape.get('font_size') or 14)
    chars_per_line = max(8, int(width / max(font_size * 0.52, 1)))
    estimated_lines = max(1, math.ceil(len(text) / chars_per_line))
    max_lines = max(1, int(height / max(font_size * 1.05, 1))) + 2
    if estimated_lines <= max_lines:
        return None
    return {
        'shape_id': shape.get('shape_id'),
        'overflow_reason': 'native_text_capacity_exceeded',
        'text_char_count': len(text),
        'estimated_lines': estimated_lines,
        'max_lines': max_lines,
    }


def operator_language_fragments(native_shapes: list[dict]) -> list[str]:
    visible_text = '\n'.join(
        safe_text(shape.get('text'))
        for shape in native_shapes
        if shape.get('quality_role') == 'content'
    )
    return sorted({fragment for fragment in OPERATOR_LANGUAGE_FRAGMENTS if fragment in visible_text})


def title_safe_zone_shape(shape: dict) -> bool:
    if shape.get('quality_role') != 'content':
        return False
    if shape.get('role') in {'title', 'core_sentence'}:
        return False
    if safe_text(shape.get('text')):
        return True
    return shape.get('kind') in {'chart', 'table', 'metric_grid'}


def title_safe_zone_failures(native_shapes: list[dict]) -> list[dict]:
    failures = []
    for shape in native_shapes:
        if not title_safe_zone_shape(shape):
            continue
        rect = shape.get('bounds') or {}
        top = float(rect.get('top') or 0.0)
        if top < TITLE_SAFE_ZONE_BOTTOM:
            failures.append({
                'shape_id': shape.get('shape_id'),
                'role': shape.get('role'),
                'top': round(top, 2),
                'safe_zone_bottom': TITLE_SAFE_ZONE_BOTTOM,
            })
    return failures


def table_legibility_failures(table_metrics: list[dict]) -> list[dict]:
    failures = []
    for metrics in table_metrics:
        min_font_pt = float(metrics.get('min_font_pt') or 0.0)
        max_blank_ratio = float(metrics.get('max_cell_blank_ratio') or 0.0)
        if min_font_pt < MIN_TABLE_BODY_FONT_PT:
            failures.append({
                'shape_id': metrics.get('shape_id'),
                'reason': 'table_font_below_minimum',
                'value': round(min_font_pt, 2),
                'threshold': MIN_TABLE_BODY_FONT_PT,
            })
        if max_blank_ratio > MAX_TABLE_CELL_BLANK_RATIO:
            failures.append({
                'shape_id': metrics.get('shape_id'),
                'reason': 'table_cell_blank_ratio_too_high',
                'value': round(max_blank_ratio, 4),
                'threshold': MAX_TABLE_CELL_BLANK_RATIO,
            })
        failures.extend(metrics.get('cell_fit_failures') or [])
    return failures


def evaluate_native_slide_quality(native_shapes: list, primary_points: int) -> dict:
    content_shapes = [shape for shape in native_shapes if shape.get('quality_role') == 'content']
    decorative_shapes = [shape for shape in native_shapes if shape.get('quality_role') == 'decorative']
    overlap_shapes = [shape for shape in content_shapes if shape.get('kind') == 'text_box']
    shape_kinds = {safe_text(shape.get('kind')) for shape in native_shapes if safe_text(shape.get('kind'))}
    shape_roles = {safe_text(shape.get('role')) for shape in native_shapes if safe_text(shape.get('role'))}
    title_shapes = [
        shape for shape in native_shapes
        if shape.get('role') == 'title' and shape.get('kind') == 'text_box' and safe_text(shape.get('text'))
    ]
    title_font_size = max((float(shape.get('font_size') or 0) for shape in title_shapes), default=0.0)
    page_number_shapes = [
        shape for shape in native_shapes
        if shape.get('role') == 'page_number' and safe_text(shape.get('text'))
    ]
    occupied_area = rect_union_area([shape['bounds'] for shape in content_shapes])
    occupied_ratio = clamp(occupied_area / FRAME_AREA, 0.0, 1.0)
    if content_shapes:
        edge_clearance = {
            'left': min(float(shape['bounds']['left']) for shape in content_shapes),
            'top': min(float(shape['bounds']['top']) for shape in content_shapes),
            'right': min(CANVAS_PX[0] - float(shape['bounds']['right']) for shape in content_shapes),
            'bottom': min(CANVAS_PX[1] - float(shape['bounds']['bottom']) for shape in content_shapes),
        }
    else:
        edge_clearance = {'left': 0.0, 'top': 0.0, 'right': 0.0, 'bottom': 0.0}
    overlap_pairs = []
    for left_index, shape_a in enumerate(overlap_shapes):
        for shape_b in overlap_shapes[left_index + 1:]:
            overlap_area = rect_overlap_area(shape_a['bounds'], shape_b['bounds'])
            if overlap_area > 12.0:
                overlap_pairs.append({
                    'a': shape_a.get('shape_id'),
                    'b': shape_b.get('shape_id'),
                    'overlap_area': round(overlap_area, 2),
                })
    block_content_failures = [
        failure for failure in (text_capacity_failure(shape) for shape in content_shapes)
        if failure
    ]
    chart_shapes = [shape for shape in native_shapes if shape.get('kind') == 'chart']
    table_shapes = [shape for shape in native_shapes if shape.get('kind') == 'table']
    metric_grid_shapes = [shape for shape in native_shapes if shape.get('kind') == 'metric_grid']
    chart_metrics = []
    table_metrics = []
    metric_grid_metrics = []
    numeric_label_overflows = []
    table_cell_fit_failures = []
    for shape in chart_shapes:
        metrics = dict(shape.get('metrics') or {})
        metrics['shape_id'] = shape.get('shape_id')
        metrics['bounds'] = shape.get('bounds')
        chart_metrics.append(metrics)
        numeric_label_overflows.extend(metrics.get('numeric_label_overflows') or [])
    for shape in table_shapes:
        metrics = dict(shape.get('metrics') or {})
        metrics['shape_id'] = shape.get('shape_id')
        metrics['bounds'] = shape.get('bounds')
        table_metrics.append(metrics)
        table_cell_fit_failures.extend(metrics.get('cell_fit_failures') or [])
    for shape in metric_grid_shapes:
        metrics = dict(shape.get('metrics') or {})
        metrics['shape_id'] = shape.get('shape_id')
        metrics['bounds'] = shape.get('bounds')
        metric_grid_metrics.append(metrics)
        numeric_label_overflows.extend(metrics.get('numeric_label_overflows') or [])
    language_fragments = operator_language_fragments(content_shapes)
    title_zone_failures = title_safe_zone_failures(content_shapes)
    table_failures = table_legibility_failures(table_metrics)
    coordinate_payload = [
        {
            'shape_id': shape.get('shape_id'),
            'kind': shape.get('kind'),
            'role': shape.get('role'),
            'bounds': shape.get('bounds'),
        }
        for shape in native_shapes
    ]
    coordinate_determinism_hash = hashlib.sha256(
        json.dumps(coordinate_payload, ensure_ascii=False, sort_keys=True).encode('utf-8')
    ).hexdigest()
    text_char_count = sum(len(safe_text(shape.get('text'))) for shape in content_shapes)
    clipped_nodes = len(block_content_failures)
    title_typography_ok = bool(title_shapes) and title_font_size >= 28.0
    page_number_consistency_ok = bool(page_number_shapes)
    table_min_font_pt = min(
        (float(metrics.get('min_font_pt') or MIN_TABLE_BODY_FONT_PT) for metrics in table_metrics),
        default=MIN_TABLE_BODY_FONT_PT,
    )
    card_blank_ratio = max(
        (float(metrics.get('max_cell_blank_ratio') or 0.0) for metrics in table_metrics),
        default=0.24,
    )
    layout_richness_score = round(clamp(
        (min(len(native_shapes), 20) / 20.0 * 0.34)
        + (min(len(shape_kinds), 4) / 4.0 * 0.22)
        + (min(len(shape_roles), 10) / 10.0 * 0.22)
        + (min(len(decorative_shapes), 7) / 7.0 * 0.22),
        0.0,
        1.0,
    ), 4)
    checks = {
        'overflow_free': clipped_nodes == 0,
        'occlusion_free': len(overlap_pairs) == 0,
        'visual_density_ok': MIN_NATIVE_DENSITY <= occupied_ratio <= MAX_NATIVE_DENSITY and primary_points <= MAX_NATIVE_PRIMARY_POINTS,
        'speaker_fit_ok': text_char_count <= 950,
        'edge_clearance_ok': min(edge_clearance.values()) >= MIN_NATIVE_EDGE_CLEARANCE,
        'block_content_fit_ok': clipped_nodes == 0,
        'title_typography_ok': title_typography_ok,
        'page_number_consistency_ok': page_number_consistency_ok,
        'layout_richness_ok': layout_richness_score >= MIN_NATIVE_LAYOUT_RICHNESS,
        'external_audience_language_ok': len(language_fragments) == 0,
        'title_safe_zone_clear': len(title_zone_failures) == 0,
        'table_legibility_ok': len(table_failures) == 0,
        'layout_density_ok': MIN_NATIVE_DENSITY <= occupied_ratio <= MAX_NATIVE_DENSITY and card_blank_ratio <= MAX_TABLE_CELL_BLANK_RATIO,
    }
    issues = []
    if not checks['visual_density_ok']:
        issues.append('visual_density_out_of_range')
    if not checks['edge_clearance_ok']:
        issues.append('edge_clearance_out_of_range')
    if not checks['occlusion_free']:
        issues.append('occlusion_detected')
    if not checks['block_content_fit_ok']:
        issues.append('block_content_overflow_detected')
    if not checks['speaker_fit_ok']:
        issues.append('speaker_fit_exceeded')
    if not checks['title_typography_ok']:
        issues.append('title_typography_missing_or_too_small')
    if not checks['page_number_consistency_ok']:
        issues.append('page_number_missing')
    if not checks['layout_richness_ok']:
        issues.append('layout_richness_below_threshold')
    if not checks['external_audience_language_ok']:
        issues.append('operator_language_leak_detected')
    if not checks['title_safe_zone_clear']:
        issues.append('title_safe_zone_obstructed')
    if any(failure.get('reason') == 'table_font_below_minimum' for failure in table_failures):
        issues.append('table_font_below_minimum')
    if table_failures and 'table_font_below_minimum' not in issues:
        issues.append('table_cell_fit_failed')
    if not checks['layout_density_ok']:
        issues.append('layout_density_too_sparse')
    return {
        'checks': checks,
        'issues': issues,
        'metrics': {
            'title_font_size': round(title_font_size, 2),
            'text_char_count': text_char_count,
            'block_count': len(content_shapes),
            'decorative_shape_count': len(decorative_shapes),
            'shape_count': len(native_shapes),
            'shape_kind_count': len(shape_kinds),
            'role_count': len(shape_roles),
            'layout_richness_score': layout_richness_score,
            'overlap_pairs': len(overlap_pairs),
            'overlaps': overlap_pairs,
            'clipped_nodes': clipped_nodes,
            'occupied_ratio': round(occupied_ratio, 4),
            'primary_points': primary_points,
            'edge_clearance': {key: round(value, 2) for key, value in edge_clearance.items()},
            'block_content_failures': block_content_failures,
            'bounds': [shape['bounds'] for shape in content_shapes],
            'chart_count': len(chart_shapes),
            'table_count': len(table_shapes),
            'metric_grid_count': len(metric_grid_shapes),
            'chart_metrics': chart_metrics,
            'table_metrics': table_metrics,
            'metric_grid_metrics': metric_grid_metrics,
            'operator_language_fragments': language_fragments,
            'title_safe_zone_failures': title_zone_failures,
            'title_safe_zone_clearance_ok': len(title_zone_failures) == 0,
            'table_min_font_pt': round(table_min_font_pt, 2),
            'table_legibility_failures': table_failures,
            'card_blank_ratio': round(card_blank_ratio, 4),
            'chart_bounds': [shape['bounds'] for shape in chart_shapes],
            'table_bounds': [shape['bounds'] for shape in table_shapes],
            'metric_grid_bounds': [shape['bounds'] for shape in metric_grid_shapes],
            'axis_label_count': sum(int(metrics.get('axis_label_count') or 0) for metrics in chart_metrics),
            'legend_label_count': sum(int(metrics.get('legend_label_count') or 0) for metrics in chart_metrics),
            'table_cell_fit_ok': len(table_cell_fit_failures) == 0,
            'table_cell_fit_failures': table_cell_fit_failures,
            'numeric_label_overflow_count': len(numeric_label_overflows),
            'numeric_label_overflows': numeric_label_overflows,
            'coordinate_determinism_hash': coordinate_determinism_hash,
        },
    }


def load_engine_contract(contract_file: Path) -> dict:
    if not contract_file.exists():
        fail(f'engine contract not found: {contract_file}')
    contract = json.loads(contract_file.read_text(encoding='utf-8'))
    required = {
        'kind': 'redcube_native_ppt_python_engine',
        'language': 'python',
        'contract_version': 1,
        'input_boundary': 'slide_blueprint_plus_visual_direction_json',
        'review_boundary': 'rendered_pptx_screenshots',
    }
    for key, expected in required.items():
        if contract.get(key) != expected:
            fail(f'engine contract field mismatch: {key}')
    routes = contract.get('owned_routes')
    if routes != ['author_pptx_native', 'repair_pptx_native']:
        fail('engine contract owned_routes mismatch')
    capabilities = contract.get('engine_capabilities') or {}
    for key, expected in ENGINE_CAPABILITIES.items():
        if capabilities.get(key) != expected:
            fail(f'engine contract capability mismatch: {key}')
    render_proof = contract.get('true_render_proof') or {}
    if render_proof.get('required') is not True:
        fail('engine contract true_render_proof.required mismatch')
    if render_proof.get('renderer_kind') != RENDERER_KIND:
        fail('engine contract true_render_proof.renderer_kind mismatch')
    if render_proof.get('renderer_pipeline') != RENDERER_PIPELINE:
        fail('engine contract true_render_proof.renderer_pipeline mismatch')
    if render_proof.get('cross_platform_render_required') is not True:
        fail('engine contract true_render_proof.cross_platform_render_required mismatch')
    return contract


def normalize_slide_data(payload: dict) -> list:
    plan = payload.get('editable_shape_plan') or {}
    plan_slides = safe_list(plan.get('slides'))
    blueprint = payload.get('blueprint') or {}
    blueprint_slides = safe_list(blueprint.get('slides'))
    blueprint_by_id = {
        safe_text(slide.get('slide_id'), f'S{index + 1:02d}'): slide
        for index, slide in enumerate(blueprint_slides)
        if isinstance(slide, dict)
    }
    source_slides = plan_slides or blueprint_slides
    if not source_slides:
        fail('native PPT authoring requires editable_shape_plan.slides or slide_blueprint.slides')
    slides = []
    for index, raw_slide in enumerate(source_slides, 1):
        if not isinstance(raw_slide, dict):
            continue
        slide_id = safe_text(raw_slide.get('slide_id'), f'S{index:02d}')
        blueprint_slide = blueprint_by_id.get(slide_id, {})
        merged = {**blueprint_slide, **raw_slide}
        plan_shapes = [
            shape for shape in safe_list(raw_slide.get('native_shapes'))
            if isinstance(shape, dict)
        ]
        merged['_editable_native_shapes'] = plan_shapes
        slides.append(merged)
    if not slides:
        fail('native PPT authoring requires at least one valid slide object')
    return slides


def command_version(command: list[str]) -> str:
    completed = subprocess.run(
        command,
        text=True,
        capture_output=True,
        check=False,
    )
    return safe_text(completed.stdout) or safe_text(completed.stderr) or 'unknown'


def platform_provenance() -> dict:
    uname = platform.uname()
    return {
        'system': uname.system,
        'release': uname.release,
        'version': uname.version,
        'machine': uname.machine,
        'python': platform.python_version(),
    }


def renderer_dependency_blocker(
    message: str,
    *,
    probes: list[dict] | None = None,
    bootstrap: dict | None = None,
) -> str:
    payload = {
        'error_kind': 'missing_renderer_dependency',
        'typed_blocker_kind': 'missing_renderer_dependency',
        'renderer_selection': 'capability_probe_auto',
        'required_surface': 'native_pptx_true_render_proof',
        'supported_renderers': [
            {
                'renderer_kind': RENDERER_KIND,
                'renderer_pipeline': RENDERER_PIPELINE,
                'runtime': RENDERER_KIND,
                'requires': ['LibreOffice headless', 'Poppler pdftoppm'],
            }
        ],
        'synthetic_preview_allowed': False,
        'fail_closed_when_missing': True,
        'bootstrap_policy': 'auto_install_then_probe',
        'dependency_install_commands': install_commands(),
        'message': message,
        'probes': probes or [],
        'bootstrap': bootstrap or {},
    }
    return json.dumps(payload, ensure_ascii=False, sort_keys=True)


def missing_renderer_reasons(*probes: dict) -> list[str]:
    return [
        safe_text(probe.get('blocked_reason'))
        for probe in probes
        if not probe.get('available') and safe_text(probe.get('blocked_reason'))
    ]


def renderer_probe() -> dict:
    soffice_probe = libreoffice_probe()
    pdftoppm_probe = poppler_probe('pdftoppm')
    return {
        'soffice_probe': soffice_probe,
        'pdftoppm_probe': pdftoppm_probe,
        'soffice': safe_text(soffice_probe.get('path')),
        'pdftoppm': safe_text(pdftoppm_probe.get('path')),
    }


def should_bootstrap_renderer(requested: str) -> bool:
    if requested != 'auto':
        return False
    return safe_text(os.environ.get('REDCUBE_NATIVE_PPT_RENDERER_AUTO_INSTALL'), '1') != '0'


def run_renderer_dependency_bootstrap() -> dict:
    installer = NATIVE_PPT_DEPENDENCY_INSTALL_COMMAND
    completed = subprocess.run(
        [installer],
        text=True,
        capture_output=True,
        check=False,
        cwd=str(REPO_ROOT),
    )
    return {
        'attempted': True,
        'command': installer,
        'returncode': completed.returncode,
        'stdout': safe_text(completed.stdout),
        'stderr': safe_text(completed.stderr),
    }


def resolve_probed_renderer(probe: dict, bootstrap: dict | None = None) -> dict | None:
    soffice = safe_text(probe.get('soffice'))
    pdftoppm = safe_text(probe.get('pdftoppm'))
    if not soffice or not pdftoppm:
        return None
    return {
        'kind': RENDERER_KIND,
        'pipeline': RENDERER_PIPELINE,
        'runtime': RENDERER_KIND,
        'selection_policy': 'capability_probe_auto',
        'bootstrap_policy': 'auto_install_then_probe',
        'bootstrap_attempted': bool(bootstrap and bootstrap.get('attempted')),
        'bootstrap_command': safe_text((bootstrap or {}).get('command')),
        'soffice': soffice,
        'pdftoppm': pdftoppm,
        'dependency_install_commands': install_commands(),
        'libreoffice_version': command_version([soffice, '--version']),
        'poppler_version': command_version([pdftoppm, '-v']),
    }


def resolve_renderer(renderer_name: str) -> dict:
    requested = safe_text(renderer_name, 'auto')
    if requested not in {'auto', RENDERER_KIND}:
        fail(f'unsupported native PPT renderer: {requested}; expected auto or {RENDERER_KIND}')
    initial_probe = renderer_probe()
    renderer = resolve_probed_renderer(initial_probe)
    if renderer:
        return renderer

    bootstrap = None
    if should_bootstrap_renderer(requested):
        bootstrap = run_renderer_dependency_bootstrap()
        reprobe = renderer_probe()
        renderer = resolve_probed_renderer(reprobe, bootstrap)
        if renderer:
            return renderer
        probes = [reprobe['soffice_probe'], reprobe['pdftoppm_probe']]
    else:
        probes = [initial_probe['soffice_probe'], initial_probe['pdftoppm_probe']]

    reasons = missing_renderer_reasons(*probes)
    if bootstrap and bootstrap.get('returncode') != 0:
        reasons.append(
            safe_text(bootstrap.get('stderr'))
            or safe_text(bootstrap.get('stdout'))
            or f"installer exited {bootstrap.get('returncode')}"
        )
    install_hint = platform_install_hint()
    fail(renderer_dependency_blocker(
        'native PPT true render proof requires a supported renderer capability; '
        f'current supported pipeline is {RENDERER_PIPELINE}; run {install_hint} or use Docker',
        probes=probes,
        bootstrap=bootstrap or {'attempted': False, 'command': NATIVE_PPT_DEPENDENCY_INSTALL_COMMAND},
    ) if requested == 'auto' else renderer_dependency_blocker(
        'native PPT true render proof requires LibreOffice headless and Poppler for '
        f'{RENDERER_PIPELINE}: {"; ".join(reasons)}; run {install_hint} or use Docker',
        probes=probes,
        bootstrap=bootstrap or {'attempted': False, 'command': NATIVE_PPT_DEPENDENCY_INSTALL_COMMAND},
    ))


def clean_render_outputs(preview_dir: Path, pdf_target: Path) -> None:
    preview_dir.mkdir(parents=True, exist_ok=True)
    for stale in preview_dir.glob('*'):
        if stale.is_file() and stale.suffix.lower() in {'.png', '.pdf'}:
            stale.unlink()
    if pdf_target.exists():
        pdf_target.unlink()


def render_pptx_to_pdf(output_pptx: Path, pdf_target: Path, renderer: dict) -> None:
    pdf_target.parent.mkdir(parents=True, exist_ok=True)
    convert_dir = pdf_target.parent
    completed = subprocess.run(
        [
            renderer['soffice'],
            '--headless',
            '--convert-to',
            'pdf',
            '--outdir',
            str(convert_dir),
            str(output_pptx),
        ],
        text=True,
        capture_output=True,
        check=False,
    )
    if completed.returncode != 0:
        stderr = safe_text(completed.stderr) or safe_text(completed.stdout) or 'unknown LibreOffice error'
        fail(f'true PPTX render proof failed via LibreOffice headless: {stderr}')
    converted_pdf = convert_dir / f'{output_pptx.stem}.pdf'
    if not converted_pdf.exists():
        fail(f'LibreOffice headless did not produce expected PDF: {converted_pdf}')
    if converted_pdf.resolve() != pdf_target.resolve():
        if pdf_target.exists():
            pdf_target.unlink()
        shutil.move(str(converted_pdf), str(pdf_target))


def render_png_from_pdf(pdf_file: Path, preview_dir: Path, renderer: dict) -> list[Path]:
    if not pdf_file.exists():
        fail(f'LibreOffice PDF render output missing before Poppler conversion: {pdf_file}')
    prefix = preview_dir / 'slide'
    completed = subprocess.run(
        [renderer['pdftoppm'], '-png', '-r', '144', str(pdf_file), str(prefix)],
        text=True,
        capture_output=True,
        check=False,
    )
    if completed.returncode != 0:
        stderr = safe_text(completed.stderr) or safe_text(completed.stdout) or 'unknown Poppler error'
        fail(f'PDF-to-PNG render proof conversion failed with Poppler pdftoppm: {stderr}')
    return sorted(path for path in preview_dir.glob('slide-*.png') if path.is_file())


def render_pptx(
    output_pptx: Path,
    preview_dir: Path,
    output_pdf: Path | None,
    renderer_name: str = 'auto',
) -> dict:
    renderer = resolve_renderer(renderer_name)
    pdf_target = output_pdf or (preview_dir / 'render-proof.pdf')
    clean_render_outputs(preview_dir, pdf_target)
    render_pptx_to_pdf(output_pptx, pdf_target, renderer)
    png_files = render_png_from_pdf(pdf_target, preview_dir, renderer)
    if not png_files:
        fail(f'true PPTX render proof produced no Poppler PNG previews in {preview_dir}')
    preview_hashes = [
        {
            'file': str(path),
            'sha256': file_sha256(path),
        }
        for path in png_files
    ]
    return {
        'source_surface_kind': 'native_pptx',
        'renderer_kind': renderer['kind'],
        'renderer_pipeline': renderer['pipeline'],
        'runtime': RENDERER_KIND,
        'command_family': 'soffice --headless',
        'cross_platform_render_required': True,
        'synthetic_preview': False,
        'required': True,
        'pptx_file': str(output_pptx),
        'pdf_file': str(pdf_target),
        'libreoffice_version': renderer['libreoffice_version'],
        'poppler_version': renderer['poppler_version'],
        'platform': platform_provenance(),
        'source_pptx_sha256': file_sha256(output_pptx),
        'pdf_sha256': file_sha256(pdf_target),
        'preview_png_hashes': preview_hashes,
        'slide_count': len(png_files),
        'preview_screenshots': [str(path) for path in png_files],
    }


def attach_rendered_previews(manifest_slides: list, render_proof: dict) -> list:
    preview_files = [Path(path) for path in safe_list(render_proof.get('preview_screenshots'))]
    if len(preview_files) != len(manifest_slides):
        fail(
            'true PPTX render proof slide count mismatch: '
            f'{len(preview_files)} previews for {len(manifest_slides)} manifest slides'
        )
    attached = []
    preview_hashes = safe_list(render_proof.get('preview_png_hashes'))
    for index, (slide, preview_file) in enumerate(zip(manifest_slides, preview_files)):
        if not preview_file.exists():
            fail(f'true PPTX render proof screenshot missing: {preview_file}')
        preview_sha256 = file_sha256(preview_file)
        if index < len(preview_hashes) and preview_hashes[index].get('sha256') != preview_sha256:
            fail(f'true PPTX render proof screenshot hash mismatch: {preview_file}')
        preview_dimensions = image_dimensions(preview_file)
        render_provenance = {
            'renderer_kind': render_proof.get('renderer_kind'),
            'renderer_pipeline': render_proof.get('renderer_pipeline'),
            'source_surface_kind': render_proof.get('source_surface_kind'),
            'source_pptx_sha256': render_proof.get('source_pptx_sha256'),
            'pdf_sha256': render_proof.get('pdf_sha256'),
            'preview_screenshot_sha256': preview_sha256,
            'preview_screenshot_file': str(preview_file),
            'preview_screenshot_dimensions': preview_dimensions,
            'synthetic_preview': False,
        }
        attached.append({
            **slide,
            'preview_screenshot_file': str(preview_file),
            'preview_screenshot_sha256': preview_sha256,
            'preview_screenshot_dimensions': preview_dimensions,
            'render_proof_source': safe_text(render_proof.get('renderer_kind')),
            'renderer_kind': render_proof.get('renderer_kind'),
            'renderer_pipeline': render_proof.get('renderer_pipeline'),
            'render_provenance': render_provenance,
            'synthetic_preview': False,
        })
    return attached


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Build editable native PPTX artifacts for ppt_deck.')
    parser.add_argument('--input-json', required=True)
    parser.add_argument('--mode', choices=['author', 'repair'], required=True)
    parser.add_argument('--output-pptx', required=True)
    parser.add_argument('--shape-manifest', required=True)
    parser.add_argument('--preview-dir', required=True)
    parser.add_argument('--output-pdf')
    parser.add_argument('--renderer', choices=['auto', RENDERER_KIND], default='auto')
    parser.add_argument('--repair-log')
    parser.add_argument('--engine-contract', default=str(DEFAULT_ENGINE_CONTRACT_FILE))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    payload = json.loads(Path(args.input_json).read_text(encoding='utf-8'))
    engine_contract_file = Path(args.engine_contract).resolve()
    engine_contract = load_engine_contract(engine_contract_file)
    slides = normalize_slide_data(payload)
    repair_feedback = safe_list(payload.get('repair_feedback'))
    repaired_slide_ids = {
        safe_text(item.get('slide_id'))
        for item in repair_feedback
        if isinstance(item, dict) and safe_text(item.get('slide_id'))
    }
    output_pptx = Path(args.output_pptx).resolve()
    shape_manifest = Path(args.shape_manifest).resolve()
    preview_dir = Path(args.preview_dir).resolve()
    svg_ir_dir = preview_dir.parent / f'{preview_dir.name}-redcube-svg-ir'
    try:
        manifest_slides = build_deck(slides, output_pptx, svg_ir_dir, repaired_slide_ids, evaluate_native_slide_quality)
    except RuntimeError as exc:
        fail(str(exc))
    output_pdf = Path(args.output_pdf).resolve() if args.output_pdf else None
    render_proof = render_pptx(output_pptx, preview_dir, output_pdf, renderer_name=args.renderer)
    manifest_slides = attach_rendered_previews(manifest_slides, render_proof)
    preview_files = safe_list(render_proof.get('preview_screenshots'))
    repair_log_file = Path(args.repair_log).resolve() if args.repair_log else None
    repair_log = {
        'mode': args.mode,
        'consumed_review_stage': 'screenshot_review' if args.mode == 'repair' else None,
        'target_slide_ids': sorted(repaired_slide_ids),
        'preserved_slide_ids': [
            safe_text(slide.get('slide_id'))
            for slide in manifest_slides
            if safe_text(slide.get('slide_id')) and safe_text(slide.get('slide_id')) not in repaired_slide_ids
        ],
        'blocked_slide_ids_source': 'screenshot_review.slide_reviews.status_block' if args.mode == 'repair' else None,
        'scope': 'page' if args.mode == 'repair' else 'deck',
        'feedback_count': len(repair_feedback),
        'repair_log_file': str(repair_log_file) if repair_log_file else None,
    }
    if repair_log_file:
        repair_log_file.parent.mkdir(parents=True, exist_ok=True)
        repair_log_file.write_text(json.dumps(repair_log, ensure_ascii=False, indent=2), encoding='utf-8')
    manifest = {
        'schema_version': 1,
        'artifact_kind': 'ppt_deck_native_shape_manifest',
        'engine_contract': engine_contract,
        'engine_contract_file': str(engine_contract_file),
        'builder': {
            'kind': 'redcube_drawingml_writer',
            'implementation': 'python_pptx_native_shapes',
            'surface': 'editable_native_pptx',
            'screenshot_packaging': False,
        },
        'capability': {
            'kind': 'RedCube DrawingML writer',
            'editable_artifact': True,
            'native_shapes': True,
            'redcube_svg_ir': True,
            'strict_svg_preflight': True,
            'render_proof_required': True,
        },
        'native_quality_model': 'shape_manifest_layout_metrics_v1',
        'native_quality_surface': {
            'quality_model': 'shape_manifest_layout_metrics_v1',
            'source_surface_kind': 'native_pptx',
            'required_per_slide_metrics': [
                'bounds',
                'text_char_count',
                'primary_points',
                'occupied_ratio',
                'edge_clearance',
                'overlap_pairs',
                'chart_bounds',
                'table_bounds',
                'axis_label_count',
                'legend_label_count',
                'table_cell_fit_ok',
                'table_min_font_pt',
                'title_safe_zone_clearance_ok',
                'operator_language_fragments',
                'numeric_label_overflow_count',
                'coordinate_determinism_hash',
                'preview_screenshot_sha256',
                'preview_screenshot_dimensions',
            ],
            'fail_closed_when_missing': True,
        },
        'engine_capabilities': ENGINE_CAPABILITIES,
        'render_proof': render_proof,
        'redcube_svg_ir': {
            'kind': 'redcube_svg_ir',
            'version': 1,
            'strict_preflight': True,
            'dir': str(svg_ir_dir),
            'files': [slide['redcube_svg_ir_file'] for slide in manifest_slides],
        },
        'mode': args.mode,
        'editable_artifact': True,
        'pptx_file': str(output_pptx),
        'pdf_file': str(output_pdf) if output_pdf else None,
        'page_count': len(slides),
        'screenshot_dimensions': image_dimensions(Path(preview_files[0])) if preview_files else None,
        'preview_screenshots': preview_files,
        'slides': manifest_slides,
        'repair_log': repair_log,
    }
    shape_manifest.parent.mkdir(parents=True, exist_ok=True)
    shape_manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    result = {
        'status': 'completed',
        'builder': manifest['builder'],
        'capability': manifest['capability'],
        'engine_contract': engine_contract,
        'engine_contract_file': str(engine_contract_file),
        'engine_capabilities': ENGINE_CAPABILITIES,
        'shape_manifest_schema_version': manifest['schema_version'],
        'mode': args.mode,
        'page_count': len(slides),
        'pptx_file': str(output_pptx),
        'pdf_file': str(output_pdf) if output_pdf else None,
        'shape_manifest_file': str(shape_manifest),
        'native_quality_model': manifest['native_quality_model'],
        'native_quality_surface': manifest['native_quality_surface'],
        'render_proof': render_proof,
        'redcube_svg_ir': manifest['redcube_svg_ir'],
        'preview_screenshots': preview_files,
        'screenshot_dimensions': manifest['screenshot_dimensions'],
        'slides': manifest_slides,
        'repair_log_file': str(repair_log_file) if repair_log_file else None,
        'repair_log': repair_log,
    }
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
