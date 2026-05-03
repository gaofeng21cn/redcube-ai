#!/usr/bin/env python3
import argparse
import hashlib
import json
import math
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

from redcube_ai.native_helpers.ppt_deck.native_layouts import build_deck, safe_list, safe_text


CANVAS_PX = (1152, 648)
FRAME_AREA = float(CANVAS_PX[0] * CANVAS_PX[1])
MIN_NATIVE_DENSITY = 0.18
MAX_NATIVE_DENSITY = 0.82
MIN_NATIVE_EDGE_CLEARANCE = 24.0
MAX_NATIVE_PRIMARY_POINTS = 5
ENGINE_CAPABILITIES = {
    'authoring_ir': 'redcube_svg_ir',
    'authoring_ir_version': 1,
    'pptx_writer': 'redcube_drawingml_writer',
    'editable_pptx': True,
    'strict_svg_preflight': True,
    'true_render_proof_required': True,
    'true_render_proof_renderer': 'powerpoint_applescript',
    'screenshot_packaging': False,
}
DEFAULT_ENGINE_CONTRACT_FILE = (
    Path(__file__).resolve().parents[4]
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


def evaluate_native_slide_quality(native_shapes: list, primary_points: int) -> dict:
    content_shapes = [shape for shape in native_shapes if shape.get('quality_role') == 'content']
    overlap_shapes = [shape for shape in content_shapes if shape.get('kind') == 'text_box']
    title_shapes = [
        shape for shape in native_shapes
        if shape.get('role') == 'title' and shape.get('kind') == 'text_box' and safe_text(shape.get('text'))
    ]
    title_font_size = max((float(shape.get('font_size') or 0) for shape in title_shapes), default=0.0)
    page_number_shapes = [
        shape for shape in native_shapes
        if shape.get('role') == 'page_number' and safe_text(shape.get('text'))
    ]
    occupied_area = sum(float(shape['bounds']['width']) * float(shape['bounds']['height']) for shape in content_shapes)
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
    text_char_count = sum(len(safe_text(shape.get('text'))) for shape in content_shapes)
    clipped_nodes = len(block_content_failures)
    title_typography_ok = bool(title_shapes) and title_font_size >= 28.0
    page_number_consistency_ok = bool(page_number_shapes)
    checks = {
        'overflow_free': clipped_nodes == 0,
        'occlusion_free': len(overlap_pairs) == 0,
        'visual_density_ok': MIN_NATIVE_DENSITY <= occupied_ratio <= MAX_NATIVE_DENSITY and primary_points <= MAX_NATIVE_PRIMARY_POINTS,
        'speaker_fit_ok': text_char_count <= 950,
        'edge_clearance_ok': min(edge_clearance.values()) >= MIN_NATIVE_EDGE_CLEARANCE,
        'block_content_fit_ok': clipped_nodes == 0,
        'title_typography_ok': title_typography_ok,
        'page_number_consistency_ok': page_number_consistency_ok,
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
    return {
        'checks': checks,
        'issues': issues,
        'metrics': {
            'title_font_size': round(title_font_size, 2),
            'text_char_count': text_char_count,
            'block_count': len(content_shapes),
            'shape_count': len(native_shapes),
            'overlap_pairs': len(overlap_pairs),
            'overlaps': overlap_pairs,
            'clipped_nodes': clipped_nodes,
            'occupied_ratio': round(occupied_ratio, 4),
            'primary_points': primary_points,
            'edge_clearance': {key: round(value, 2) for key, value in edge_clearance.items()},
            'block_content_failures': block_content_failures,
            'bounds': [shape['bounds'] for shape in content_shapes],
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


def apple_script_text(value: Path | str) -> str:
    return str(value).replace('\\', '\\\\').replace('"', '\\"')


def render_powerpoint_pptx(output_pptx: Path, preview_dir: Path, output_pdf: Path | None) -> dict:
    if not Path('/Applications/Microsoft PowerPoint.app').exists():
        fail('true PPTX render proof requires Microsoft PowerPoint at /Applications/Microsoft PowerPoint.app')
    preview_dir.mkdir(parents=True, exist_ok=True)
    for stale in preview_dir.glob('*'):
        if stale.is_file() and stale.suffix.lower() in {'.png', '.pdf'}:
            stale.unlink()
    pdf_target = output_pdf or (preview_dir / 'render-proof.pdf')
    pdf_target.parent.mkdir(parents=True, exist_ok=True)
    script = f'''
set pptxPath to POSIX file "{apple_script_text(output_pptx)}"
set pngDir to POSIX file "{apple_script_text(preview_dir)}"
set pdfPath to POSIX file "{apple_script_text(pdf_target)}"
tell application id "com.microsoft.Powerpoint"
    launch
    open pptxPath
    set deckRef to active presentation
    save deckRef in pngDir as save as PNG
    save deckRef in pdfPath as save as PDF
    close deckRef saving no
end tell
'''
    completed = subprocess.run(
        ['osascript', '-e', script],
        text=True,
        capture_output=True,
        check=False,
    )
    if completed.returncode != 0:
        stderr = safe_text(completed.stderr) or safe_text(completed.stdout) or 'unknown osascript error'
        fail(f'true PPTX render proof failed via PowerPoint AppleScript: {stderr}')
    png_files = sorted(path for path in preview_dir.glob('*.png') if path.is_file())
    if not png_files:
        png_files = render_png_from_pdf(pdf_target, preview_dir)
    if not png_files:
        fail(f'true PPTX render proof produced no PNG previews in {preview_dir}')
    if output_pdf and not output_pdf.exists() and pdf_target.exists():
        shutil.copyfile(pdf_target, output_pdf)
    return {
        'source_surface_kind': 'native_pptx',
        'renderer_kind': 'powerpoint_applescript',
        'synthetic_preview': False,
        'required': True,
        'pptx_file': str(output_pptx),
        'pdf_file': str(output_pdf or pdf_target),
        'preview_screenshots': [str(path) for path in png_files],
    }


def render_png_from_pdf(pdf_file: Path, preview_dir: Path) -> list[Path]:
    if not pdf_file.exists():
        return []
    pdftoppm = shutil.which('pdftoppm')
    if pdftoppm:
        prefix = preview_dir / 'slide'
        completed = subprocess.run(
            [pdftoppm, '-png', '-r', '144', str(pdf_file), str(prefix)],
            text=True,
            capture_output=True,
            check=False,
        )
        if completed.returncode != 0:
            stderr = safe_text(completed.stderr) or safe_text(completed.stdout)
            fail(f'PDF-to-PNG render proof conversion failed with pdftoppm: {stderr}')
        return sorted(path for path in preview_dir.glob('slide-*.png') if path.is_file())
    magick = shutil.which('magick') or shutil.which('convert')
    if magick:
        output_pattern = str(preview_dir / 'slide-%02d.png')
        completed = subprocess.run(
            [magick, '-density', '144', str(pdf_file), output_pattern],
            text=True,
            capture_output=True,
            check=False,
        )
        if completed.returncode != 0:
            stderr = safe_text(completed.stderr) or safe_text(completed.stdout)
            fail(f'PDF-to-PNG render proof conversion failed with ImageMagick: {stderr}')
        return sorted(path for path in preview_dir.glob('slide-*.png') if path.is_file())
    fail('PowerPoint PDF render succeeded, but no PDF-to-PNG converter is available for preview screenshots')


def attach_rendered_previews(manifest_slides: list, render_proof: dict) -> list:
    preview_files = [Path(path) for path in safe_list(render_proof.get('preview_screenshots'))]
    if len(preview_files) != len(manifest_slides):
        fail(
            'true PPTX render proof slide count mismatch: '
            f'{len(preview_files)} previews for {len(manifest_slides)} manifest slides'
        )
    attached = []
    for slide, preview_file in zip(manifest_slides, preview_files):
        if not preview_file.exists():
            fail(f'true PPTX render proof screenshot missing: {preview_file}')
        attached.append({
            **slide,
            'preview_screenshot_file': str(preview_file),
            'preview_screenshot_sha256': file_sha256(preview_file),
            'preview_screenshot_dimensions': image_dimensions(preview_file),
            'render_proof_source': 'true_pptx_render',
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
    render_proof = render_powerpoint_pptx(output_pptx, preview_dir, output_pdf)
    manifest_slides = attach_rendered_previews(manifest_slides, render_proof)
    preview_files = safe_list(render_proof.get('preview_screenshots'))
    repair_log_file = Path(args.repair_log).resolve() if args.repair_log else None
    repair_log = {
        'mode': args.mode,
        'consumed_review_stage': 'screenshot_review' if args.mode == 'repair' else None,
        'target_slide_ids': sorted(repaired_slide_ids),
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
