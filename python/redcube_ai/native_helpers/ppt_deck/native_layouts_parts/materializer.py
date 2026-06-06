import json
import shutil
import subprocess
from pathlib import Path

from redcube_ai.native_helpers.ppt_deck.native_layout_constants import SLIDE_HEIGHT_IN, SLIDE_WIDTH_IN
from redcube_ai.native_helpers.ppt_deck.native_manifest_qa import fail_closed_on_manifest_qa
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.common import native_ai_design_shapes, safe_text
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.geometry import ai_shape_bounds_in, pptx_geometry_audit, shape_rect_from_ai_bounds
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.officecli import officecli_command_for_ai_shape, native_shape_manifest_record
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.slide_metadata import layout_family, primary_point_count, slide_title
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.style import resolve_color
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.svg_ir import render_slide_svg_ir
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.validation import validate_ai_first_design_plan

__all__ = [
    'parse_json_output',
    'issue_count',
    'build_deck',
]


def parse_json_output(completed: subprocess.CompletedProcess, fallback):
    text = safe_text(completed.stdout)
    if not text:
        return fallback
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {'raw_stdout': text}


def issue_count(payload: dict) -> int:
    raw = (payload.get('data') or {}).get('count') if isinstance(payload.get('data'), dict) else None
    if raw is None:
        raw = payload.get('count')
    try:
        return int(raw or 0)
    except (TypeError, ValueError):
        return 0


def build_deck(slides, output_pptx: Path, svg_ir_dir: Path, repaired_slide_ids, evaluate_native_slide_quality):
    officecli = shutil.which('officecli')
    if not officecli:
        raise RuntimeError('native PPT officecli materializer requires officecli on PATH')

    manifest_slides = []
    output_pptx.parent.mkdir(parents=True, exist_ok=True)
    output_pptx.unlink(missing_ok=True)
    officecli_commands = []
    officecli_text_probe = []
    for index, slide_data in enumerate(slides, 1):
        slide_id = safe_text(slide_data.get('slide_id'), f'S{index:02d}')
        failures = validate_ai_first_design_plan(slide_data)
        if failures:
            raise RuntimeError(
                'native PPT AI-first editable_shape_plan failed: '
                + json.dumps(failures, ensure_ascii=False, sort_keys=True)
            )
        try:
            svg_ir = render_slide_svg_ir(slide_data, index, len(slides), svg_ir_dir, slide_id in repaired_slide_ids)
        except ValueError as exc:
            raise RuntimeError(str(exc)) from exc

        ai_shapes = native_ai_design_shapes(slide_data)
        native_shapes = []
        officecli_commands.append({
            'command': 'add',
            'parent': '/',
            'type': 'slide',
            'props': {
                'layout': 'blank',
                'background': resolve_color(slide_data.get('background'), 'bg'),
            },
        })
        for shape_spec in ai_shapes:
            bounds_in = ai_shape_bounds_in(shape_spec)
            bounds_px = shape_rect_from_ai_bounds(shape_spec)
            officecli_commands.append(officecli_command_for_ai_shape(shape_spec, index, bounds_in, bounds_px))
            native_shape = native_shape_manifest_record(shape_spec)
            native_shapes.append(native_shape)
            if native_shape['text']:
                officecli_text_probe.append(native_shape['text'])

        quality = evaluate_native_slide_quality(native_shapes, primary_point_count(ai_shapes))
        title_sizes = [
            shape['font_size'] for shape in native_shapes
            if shape['role'] == 'title' and shape['font_size'] > 0
        ]
        manifest_slides.append({
            'slide_id': slide_id,
            '_deck_layout_rhythm': slide_data.get('_deck_layout_rhythm') if isinstance(slide_data.get('_deck_layout_rhythm'), dict) else {},
            'title': slide_title(slide_data, index),
            'layout_family': layout_family(slide_data),
            'layout_writer': 'officecli_pptx_materializer',
            'ai_first_spatial_plan': {
                'required': True,
                'materialized': True,
                'helper_template_layout_used': False,
                'materializer': 'officecli_pptx_materializer',
                'shape_count': len(ai_shapes),
            },
            'title_font_size': max(title_sizes, default=0),
            'shape_count': len(native_shapes),
            'text_box_count': sum(1 for shape in native_shapes if shape['kind'] == 'text_box'),
            'redcube_svg_ir_file': svg_ir['file'],
            'redcube_svg_ir_sha256': svg_ir['sha256'],
            'redcube_svg_ir_preflight': svg_ir['preflight'],
            'redcube_svg_ir': svg_ir,
            'preview_screenshot_file': '',
            'preview_screenshot_sha256': '',
            'preview_screenshot_dimensions': None,
            'render_proof_source': '',
            'synthetic_preview': False,
            'native_shapes': native_shapes,
            'checks': quality['checks'],
            'metrics': quality['metrics'],
            'issues': quality['issues'],
            'repaired': slide_id in repaired_slide_ids,
        })

    fail_closed_on_manifest_qa(manifest_slides)
    for slide in manifest_slides:
        slide.pop('_deck_layout_rhythm', None)

    def run_officecli(args, *, input_text: str | None = None) -> subprocess.CompletedProcess:
        completed = subprocess.run(
            [officecli, *args],
            text=True,
            input=input_text,
            capture_output=True,
            check=False,
        )
        if completed.returncode != 0:
            raise RuntimeError(
                'officecli materializer command failed: '
                + json.dumps({
                    'args': args,
                    'stdout': completed.stdout,
                    'stderr': completed.stderr,
                    'returncode': completed.returncode,
                }, ensure_ascii=False, sort_keys=True)
            )
        return completed

    run_officecli(['create', str(output_pptx)])
    run_officecli(['open', str(output_pptx)])
    try:
        run_officecli([
            'set',
            str(output_pptx),
            '/',
            '--prop',
            f'slideWidth={SLIDE_WIDTH_IN:g}in',
            '--prop',
            f'slideHeight={SLIDE_HEIGHT_IN:g}in',
        ])
        run_officecli(['batch', str(output_pptx)], input_text=json.dumps(officecli_commands, ensure_ascii=False))
        run_officecli(['save', str(output_pptx)])
        validate = run_officecli(['validate', str(output_pptx), '--json'])
        issues = run_officecli(['view', str(output_pptx), 'issues', '--json'])
        text = run_officecli(['view', str(output_pptx), 'text', '--json'])
    finally:
        run_officecli(['close', str(output_pptx)])
    validate_payload = parse_json_output(validate, {})
    issues_payload = parse_json_output(issues, {})
    text_payload = parse_json_output(text, {})
    validate_count = issue_count(validate_payload)
    issues_count = issue_count(issues_payload)
    if validate_count > 0 or issues_count > 0:
        raise RuntimeError(
            'native PPTX officecli quality gate failed: '
            + json.dumps({
                'validate_count': validate_count,
                'issues_count': issues_count,
                'validate': validate_payload,
                'view_issues': issues_payload,
            }, ensure_ascii=False, sort_keys=True)
        )
    geometry_audit = pptx_geometry_audit(output_pptx)
    if not geometry_audit['ok']:
        raise RuntimeError(
            'native PPTX geometry audit failed: '
            + json.dumps(geometry_audit, ensure_ascii=False, sort_keys=True)
        )

    return {
        'slides': manifest_slides,
        'officecli_gate': {
            'materializer': 'officecli_pptx_materializer',
            'command_count': len(officecli_commands),
            'save_before_close': True,
            'validate': validate_payload,
            'view_issues': issues_payload,
            'view_text': text_payload,
            'expected_text_fragments': officecli_text_probe,
            'geometry_audit': geometry_audit,
        },
    }
