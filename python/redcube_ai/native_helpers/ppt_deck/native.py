#!/usr/bin/env python3
import argparse
import hashlib
import json
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
from redcube_ai.native_helpers.ppt_deck.native_quality import evaluate_native_slide_quality


ENGINE_CAPABILITIES = {
    'authoring_ir': 'redcube_svg_ir',
    'authoring_ir_version': 1,
    'pptx_writer': 'officecli_pptx_materializer',
    'editable_pptx': True,
    'strict_svg_preflight': True,
    'true_render_proof_required': True,
    'true_render_proof_renderer': 'libreoffice_headless',
    'cross_platform_render_required': True,
    'screenshot_packaging': False,
}
OFFICECLI_MATERIALIZER_POLICY = {
    'policy_id': 'ppt_native_officecli_materializer_quality_gate_v1',
    'adoption_status': 'qa_materializer_discipline_only',
    'rca_main_workflow_owner': 'redcube_stage_review_export',
    'skill_authoring_loop_adopted': False,
    'materializer_role': 'default_editable_pptx_materializer_and_qa_gate',
    'current_pptx_writer': 'officecli_pptx_materializer',
    'officecli_writer_adapter_default_enabled': True,
    'required_gate_refs': [
        'officecli_save_before_close',
        'officecli_validate',
        'officecli_view_issues',
        'officecli_view_text',
    ],
    'save_before_close_required': True,
    'validate_required': True,
    'view_issues_required': True,
    'view_text_required': True,
    'true_render_proof_required_after_officecli_gate': True,
    'true_render_proof_substitute_allowed': False,
    'deterministic_cjk_font_family': 'Noto Sans CJK SC',
    'default_visual_route_changed': False,
    'default_executor_changed': False,
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
    officecli_policy = contract.get('officecli_materializer_policy') or {}
    for key, expected in OFFICECLI_MATERIALIZER_POLICY.items():
        if officecli_policy.get(key) != expected:
            fail(f'engine contract officecli_materializer_policy mismatch: {key}')
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
    design_spec_lock = plan.get('design_spec_lock') if isinstance(plan.get('design_spec_lock'), dict) else {}
    if (
        not safe_text(design_spec_lock.get('spec_id'))
        or not safe_text(design_spec_lock.get('owner'))
        or not safe_text(design_spec_lock.get('motif'))
        or len(safe_list(design_spec_lock.get('layout_archetypes'))) < 3
    ):
        fail('ai_first_design_spec_lock_missing: editable_shape_plan.design_spec_lock requires spec_id, owner, motif, and at least three layout_archetypes')
    plan_slides = safe_list(plan.get('slides'))
    blueprint = payload.get('blueprint') or {}
    blueprint_slides = safe_list(blueprint.get('slides'))
    visual_direction = payload.get('visual_direction') if isinstance(payload.get('visual_direction'), dict) else {}
    typography_plan = (
        visual_direction.get('typography_plan')
        if isinstance(visual_direction.get('typography_plan'), dict)
        else {}
    )
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
        merged['_typography_plan'] = typography_plan
        slides.append(merged)
    if not slides:
        fail('native PPT authoring requires at least one valid slide object')
    return slides


def validate_ai_first_shape_plan(input_json: Path, engine_contract_file: Path) -> dict:
    payload = json.loads(input_json.read_text(encoding='utf-8'))
    load_engine_contract(engine_contract_file)
    try:
        slides = normalize_slide_data(payload)
    except SystemExit as exc:
        return {
            'ok': False,
            'stage': 'normalize_slide_data',
            'exit_code': int(exc.code or 1) if isinstance(exc.code, int) else 1,
            'failures': [{'reason': 'ai_first_shape_plan_normalization_failed'}],
        }
    from redcube_ai.native_helpers.ppt_deck.native_layouts import validate_ai_first_design_plan
    failures = []
    for slide in slides:
        slide_id = safe_text(slide.get('slide_id'))
        slide_failures = validate_ai_first_design_plan(slide)
        if slide_failures:
            failures.append({
                'slide_id': slide_id,
                'title': safe_text(slide.get('title')),
                'failures': slide_failures,
            })
    return {
        'ok': len(failures) == 0,
        'stage': 'ai_first_shape_plan_preflight',
        'slide_count': len(slides),
        'failure_count': sum(len(slide.get('failures') or []) for slide in failures),
        'failures': failures,
    }


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
    parser.add_argument('--mode', choices=['author', 'repair', 'validate_plan'], required=True)
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
    if args.mode == 'validate_plan':
        validation = validate_ai_first_shape_plan(
            Path(args.input_json),
            Path(args.engine_contract).resolve(),
        )
        print(json.dumps(validation, ensure_ascii=False))
        return
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
        deck_build = build_deck(slides, output_pptx, svg_ir_dir, repaired_slide_ids, evaluate_native_slide_quality)
    except RuntimeError as exc:
        fail(str(exc))
    manifest_slides = deck_build['slides']
    officecli_gate = deck_build['officecli_gate']
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
            'kind': 'officecli_pptx_materializer',
            'implementation': 'officecli_batch_from_ai_spatial_plan',
            'surface': 'editable_native_pptx',
            'screenshot_packaging': False,
        },
        'capability': {
            'kind': 'officecli materializer adapter',
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
                'min_body_font_pt',
                'body_text_readability_ok',
                'typography_hierarchy_ratio',
                'typography_hierarchy_ok',
                'title_core_overlap_count',
                'layout_variant',
                'expected_slot_count',
                'filled_slot_count',
                'slot_fill_ok',
                'audience_label_readability_ok',
                'content_depth_ok',
                'grid_balance_ok',
                'visual_structure_present',
                'non_text_visual_specific_ok',
                'mechanical_card_template_absent',
                'panel_text_safe_area_ok',
                'short_label_wrap_ok',
                'composition_signature',
                'title_underline_absent_ok',
                'occupied_ratio',
                'edge_clearance',
                'overlap_pairs',
                'structural_text_collision_count',
                'structural_text_collisions',
                'decorative_shape_count',
                'visual_support_shape_count',
                'audience_content_slot_count',
                'shape_kind_count',
                'role_count',
                'layout_richness_score',
                'chart_bounds',
                'table_bounds',
                'metric_grid_bounds',
                'chart_metrics',
                'table_metrics',
                'metric_grid_metrics',
                'axis_label_count',
                'legend_label_count',
                'table_cell_fit_ok',
                'table_cell_fit_failures',
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
        'officecli_materializer_policy': OFFICECLI_MATERIALIZER_POLICY,
        'officecli_gate': officecli_gate,
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
        'officecli_materializer_policy': OFFICECLI_MATERIALIZER_POLICY,
        'officecli_gate': officecli_gate,
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
