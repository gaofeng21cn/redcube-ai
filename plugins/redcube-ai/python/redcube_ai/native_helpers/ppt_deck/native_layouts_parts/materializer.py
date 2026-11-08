import json
from pathlib import Path

from redcube_ai.native_helpers.ppt_deck.native_manifest_qa import fail_closed_on_manifest_qa, manifest_qa_failures
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.common import native_ai_design_shapes, safe_list, safe_text
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.slide_metadata import layout_family, primary_point_count, slide_title
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.officecli import native_shape_manifest_record
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.svg_ir import render_slide_svg_ir
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.validation import validate_ai_first_design_plan
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.materializer_commands import (
    _animation_object_kind,
    _animation_target_failures,
    _apply_groups,
    _apply_hyperlinks,
    _apply_notes_and_motion,
    _apply_paragraph_and_run_formatting,
    _apply_table_formatting,
    _assert_animation_targets,
    _children_for_group,
    _collect_object_commands,
    _fill_existing_slide_indices,
    _object_path,
    _prop_args,
    _run_officecli,
    _speaker_notes,
    SUPPORTED_ANIMATION_TARGET_KINDS,
    _template_mode,
    _transition_props,
    issue_count,
    materialize_native_pptx,
    parse_json_output,
)
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.materializer_readback import (
    _assert_package_object_evidence,
    _bind_manifest_to_package,
    _expected_materialized_kinds,
)

__all__ = [
    'parse_json_output',
    'issue_count',
    'materialize_native_pptx',
    'build_deck',
]

def build_deck(
    slides,
    output_pptx: Path,
    svg_ir_dir: Path,
    repaired_slide_ids,
    evaluate_native_slide_quality,
    template_intake=None,
    allow_quality_debt: bool = False,
):
    _assert_animation_targets(slides)
    manifest_slides = []
    for index, slide_data in enumerate(slides, 1):
        slide_id = safe_text(slide_data.get('slide_id'), f'S{index:02d}')
        failures = validate_ai_first_design_plan(slide_data)
        if failures and not allow_quality_debt:
            raise RuntimeError(
                'native PPT AI-first editable_shape_plan failed: '
                + json.dumps(failures, ensure_ascii=False, sort_keys=True)
            )
        try:
            svg_ir = render_slide_svg_ir(slide_data, index, len(slides), svg_ir_dir, slide_id in repaired_slide_ids)
        except ValueError as exc:
            raise RuntimeError(str(exc)) from exc
        ai_shapes = native_ai_design_shapes(slide_data)
        native_shapes = [native_shape_manifest_record(shape_spec) for shape_spec in ai_shapes]
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
            'shape_plan_quality_debt': [
                *safe_list(slide_data.get('_plan_quality_debt')),
                *failures,
            ],
            'repaired': slide_id in repaired_slide_ids,
        })
    qa_failures = manifest_qa_failures(manifest_slides)
    if not allow_quality_debt:
        fail_closed_on_manifest_qa(manifest_slides)
    for slide in manifest_slides:
        slide.pop('_deck_layout_rhythm', None)
    officecli_gate = materialize_native_pptx(
        slides, output_pptx, template_intake=template_intake,
        allow_quality_debt=allow_quality_debt,
    )
    _bind_manifest_to_package(
        manifest_slides,
        officecli_gate['package_readback'],
        officecli_gate['plan_slide_indices'],
    )
    return {
        'slides': manifest_slides,
        'officecli_gate': officecli_gate,
        'package_readback': officecli_gate['package_readback'],
        'template_preservation': officecli_gate['template_preservation'],
        'quality_debt': {
            'status': 'recorded_non_blocking',
            'shape_plan_failures': [
                {
                    'slide_id': slide.get('slide_id'),
                    'failures': slide.get('shape_plan_quality_debt'),
                }
                for slide in manifest_slides
                if slide.get('shape_plan_quality_debt')
            ],
            'manifest_qa_failures': qa_failures,
            'officecli_quality_debt': officecli_gate.get('quality_debt'),
            'blocks_materialization': False,
            'blocks_visual_ready_claim': True,
            'blocks_export_ready_claim': True,
        } if allow_quality_debt and (
            qa_failures or officecli_gate.get('quality_debt') or any(slide.get('shape_plan_quality_debt') for slide in manifest_slides)
        ) else None,
    }
