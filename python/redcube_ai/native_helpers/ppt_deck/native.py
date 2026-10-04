#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.common import safe_list, safe_text
from redcube_ai.native_helpers.ppt_deck.native_layout_grammar import (
    allowed_template_archetypes,
    archetype_contracts,
    validate_template_layout_grammar,
)
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.materializer import build_deck
from redcube_ai.native_helpers.ppt_deck.native_quality import evaluate_native_slide_quality
from redcube_ai.native_helpers.ppt_deck.native_sample_layout import sample_layout_profile_failures
from redcube_ai.native_helpers.renderer_dependencies import libreoffice_probe, poppler_probe
from redcube_ai.native_helpers.ppt_deck.native_render_proof import (
    attach_rendered_previews,
    clean_render_outputs,
    command_version,
    file_sha256,
    image_dimensions,
    missing_renderer_reasons,
    platform_provenance,
    render_png_from_pdf,
    render_pptx,
    render_pptx_to_pdf,
    resolve_probed_renderer,
    resolve_renderer,
    renderer_dependency_blocker,
    renderer_probe,
)
from redcube_ai.native_helpers.ppt_deck.native_shape_plan import (
    DEFAULT_ENGINE_CONTRACT_FILE,
    ENGINE_CAPABILITIES,
    OFFICECLI_MATERIALIZER_POLICY,
    REQUIRED_DESIGN_SPEC_DISCIPLINE,
    REQUIRED_DESIGN_SPEC_QA_GATES,
    REPO_ROOT,
    RENDERER_KIND,
    RENDERER_PIPELINE,
    fail,
    load_engine_contract,
    missing_design_spec_lock_fields,
    normalize_slide_data,
    normalize_slide_data_failures,
    validate_ai_first_shape_plan,
    validate_shape_plan_validator,
)

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
    parser.add_argument('--allow-quality-debt', action='store_true')
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
    slides = normalize_slide_data(
        payload,
        engine_contract.get('shape_plan_validator') or {},
        allow_quality_debt=args.allow_quality_debt,
    )
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
        editable_shape_plan = payload.get('editable_shape_plan') if isinstance(payload.get('editable_shape_plan'), dict) else {}
        template_intake = (
            payload.get('template_intake')
            if isinstance(payload.get('template_intake'), dict)
            else editable_shape_plan.get('template_intake')
            if isinstance(editable_shape_plan.get('template_intake'), dict)
            else None
        )
        deck_build = build_deck(
            slides,
            output_pptx,
            svg_ir_dir,
            repaired_slide_ids,
            evaluate_native_slide_quality,
            template_intake=template_intake,
            allow_quality_debt=args.allow_quality_debt,
        )
    except (RuntimeError, ValueError) as exc:
        fail(str(exc))
    manifest_slides = deck_build['slides']
    officecli_gate = deck_build['officecli_gate']
    package_readback = deck_build['package_readback']
    template_preservation = deck_build['template_preservation']
    output_pdf = Path(args.output_pdf).resolve() if args.output_pdf else None
    render_quality_debt = None
    try:
        render_proof = render_pptx(output_pptx, preview_dir, output_pdf, renderer_name=args.renderer)
        manifest_slides = attach_rendered_previews(manifest_slides, render_proof)
    except SystemExit as exc:
        if not args.allow_quality_debt:
            raise
        render_quality_debt = {
            'reason': 'native_true_render_proof_unavailable',
            'message': safe_text(exc),
            'blocks_stage_transition': False,
            'blocks_visual_ready_claim': True,
            'blocks_export_ready_claim': True,
        }
        render_proof = {
            'status': 'unavailable_with_quality_debt',
            'source_surface_kind': 'native_pptx',
            'renderer_kind': None,
            'renderer_pipeline': None,
            'synthetic_preview': False,
            'pptx_file': str(output_pptx),
            'pdf_file': None,
            'source_pptx_sha256': file_sha256(output_pptx),
            'preview_screenshots': [],
            'preview_png_hashes': [],
            'quality_debt': render_quality_debt,
        }
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
                'text_card_internal_padding_ok',
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
        'package_readback': package_readback,
        'template_preservation': template_preservation,
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
        'page_count': int(package_readback.get('slide_count') or len(slides)),
        'screenshot_dimensions': image_dimensions(Path(preview_files[0])) if preview_files else None,
        'preview_screenshots': preview_files,
        'slides': manifest_slides,
        'repair_log': repair_log,
        'quality_debt': {
            **(deck_build.get('quality_debt') or {}),
            **({'render_proof': render_quality_debt} if render_quality_debt else {}),
        } if deck_build.get('quality_debt') or render_quality_debt else None,
    }
    shape_manifest.parent.mkdir(parents=True, exist_ok=True)
    shape_manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    result = {
        'status': 'completed_with_quality_debt' if manifest.get('quality_debt') else 'completed',
        'builder': manifest['builder'],
        'capability': manifest['capability'],
        'engine_contract': engine_contract,
        'engine_contract_file': str(engine_contract_file),
        'engine_capabilities': ENGINE_CAPABILITIES,
        'officecli_materializer_policy': OFFICECLI_MATERIALIZER_POLICY,
        'officecli_gate': officecli_gate,
        'package_readback': package_readback,
        'template_preservation': template_preservation,
        'shape_manifest_schema_version': manifest['schema_version'],
        'mode': args.mode,
        'page_count': int(package_readback.get('slide_count') or len(slides)),
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
        'quality_debt': manifest.get('quality_debt'),
    }
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
