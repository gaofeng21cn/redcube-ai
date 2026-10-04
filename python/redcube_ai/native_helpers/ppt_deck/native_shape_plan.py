#!/usr/bin/env python3
import json
import sys
from pathlib import Path

from redcube_ai.native_helpers.ppt_deck.native_layout_grammar import (
    allowed_template_archetypes,
    archetype_contracts,
    validate_template_layout_grammar,
)
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.common import safe_list, safe_text
from redcube_ai.native_helpers.ppt_deck.native_sample_layout import sample_layout_profile_failures
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.validation import validate_ai_first_design_plan

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
    'native_object_families': [
        'text_box',
        'shape',
        'connector',
        'picture',
        'group',
        'path',
        'chart',
        'table',
    ],
    'package_readback': True,
    'template_intake': True,
    'speaker_notes': True,
    'slide_transitions': True,
    'timing_and_animation': True,
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
    'quality_issue_policy': 'record_and_continue_with_ready_claims_closed_when_allow_quality_debt_otherwise_reject',
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
REQUIRED_DESIGN_SPEC_DISCIPLINE = {
    'ppt_master_style_spec_lock',
    'template_layout_grammar',
    'template_profile',
    'semantic_layout_selection',
    'reference_deck_analysis',
    'per_page_visual_plan',
    'layout_rhythm',
    'rendered_quality_gate',
}
REQUIRED_DESIGN_SPEC_QA_GATES = {
    'bounds',
    'font_floor',
    'text_fit',
    'structural_visual',
    'layout_variety',
}

def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)



def missing_design_spec_lock_fields(
    design_spec_lock: dict,
    minimum_layout_archetypes: int = 3,
    validator_contract: dict | None = None,
) -> list[str]:
    validator = validator_contract or {}
    palette = design_spec_lock.get('palette') if isinstance(design_spec_lock.get('palette'), dict) else {}
    typography = design_spec_lock.get('typography') if isinstance(design_spec_lock.get('typography'), dict) else {}
    grid = design_spec_lock.get('grid') if isinstance(design_spec_lock.get('grid'), dict) else {}
    layout_rhythm = design_spec_lock.get('layout_rhythm') if isinstance(design_spec_lock.get('layout_rhythm'), dict) else {}
    professional_design_brief = (
        design_spec_lock.get('professional_design_brief')
        if isinstance(design_spec_lock.get('professional_design_brief'), dict)
        else {}
    )
    borrowed_principles = {
        safe_text(item)
        for item in safe_list(design_spec_lock.get('borrowed_principles'))
        if safe_text(item)
    }
    qa_gates = {
        safe_text(item)
        for item in safe_list(design_spec_lock.get('qa_gates'))
        if safe_text(item)
    }
    missing = []
    if not safe_text(design_spec_lock.get('spec_id')):
        missing.append('spec_id')
    required_owner = safe_text(validator.get('required_owner')) or 'llm_agent'
    if safe_text(design_spec_lock.get('owner')) != required_owner:
        missing.append(f'owner={required_owner}')
    if not safe_text(design_spec_lock.get('motif')):
        missing.append('motif')
    if len(safe_list(design_spec_lock.get('layout_archetypes'))) < minimum_layout_archetypes:
        missing.append(f'layout_archetypes>={minimum_layout_archetypes}')
    if (
        not safe_text(palette.get('background') or palette.get('canvas'))
        or not safe_text(palette.get('ink'))
        or not safe_text(palette.get('accent'))
    ):
        missing.append('palette.background_or_canvas+ink+accent')
    try:
        title_pt_min = float(typography.get('title_pt_min') or typography.get('title_min_pt') or 0)
    except (TypeError, ValueError):
        title_pt_min = 0
    minimum_title_pt = float(validator.get('minimum_title_pt') or 34)
    if title_pt_min < minimum_title_pt:
        missing.append(f'typography.title_pt_min>={minimum_title_pt:g}')
    try:
        body_pt_min = float(typography.get('body_pt_min') or typography.get('body_min_pt') or 0)
    except (TypeError, ValueError):
        body_pt_min = 0
    minimum_body_pt = float(validator.get('minimum_body_pt') or 18)
    if body_pt_min < minimum_body_pt:
        missing.append(f'typography.body_pt_min>={minimum_body_pt:g}')
    try:
        edge_margin = float(grid.get('edge_margin_in_min') or 0)
    except (TypeError, ValueError):
        edge_margin = 0
    minimum_edge_margin = float(validator.get('minimum_edge_margin_in') or 0.6)
    if edge_margin < minimum_edge_margin:
        missing.append(f'grid.edge_margin_in_min>={minimum_edge_margin:g}')
    try:
        inter_block_gap = float(grid.get('inter_block_gap_in_min') or 0)
    except (TypeError, ValueError):
        inter_block_gap = 0
    minimum_inter_block_gap = float(validator.get('minimum_inter_block_gap_in') or 0.32)
    if inter_block_gap < minimum_inter_block_gap:
        missing.append(f'grid.inter_block_gap_in_min>={minimum_inter_block_gap:g}')
    try:
        repetition_limit = float(layout_rhythm.get('repeated_concrete_composition_limit') or 0)
    except (TypeError, ValueError):
        repetition_limit = 0
    minimum_repetition_limit = float(validator.get('minimum_repeated_concrete_composition_limit') or 1)
    if repetition_limit < minimum_repetition_limit:
        missing.append('layout_rhythm.repeated_concrete_composition_limit')
    try:
        distinct_share = float(layout_rhythm.get('required_distinct_composition_share') or 0)
    except (TypeError, ValueError):
        distinct_share = 0
    minimum_distinct_share = float(validator.get('minimum_distinct_composition_share') or 0.75)
    if distinct_share < minimum_distinct_share:
        missing.append(f'layout_rhythm.required_distinct_composition_share>={minimum_distinct_share:g}')
    professional_brief_fields = validator.get('professional_design_brief_required_fields') or [
        'design_register',
        'reference_style_family',
        'first_glance_hierarchy',
        'template_profile_strategy',
        'capacity_strategy',
    ]
    for field in professional_brief_fields:
        if not safe_text(professional_design_brief.get(field)):
            missing.append(f'professional_design_brief.{field}')
    if validator.get('professional_design_brief_forbidden_patterns_required', True) is True \
        and len(safe_list(professional_design_brief.get('forbidden_amateur_patterns'))) == 0:
        missing.append('professional_design_brief.forbidden_amateur_patterns')
    required_borrowed_principles = validator.get('required_borrowed_principles') or sorted(REQUIRED_DESIGN_SPEC_DISCIPLINE)
    for principle in required_borrowed_principles:
        if principle not in borrowed_principles:
            missing.append(f'borrowed_principles.{principle}')
    required_qa_gates = validator.get('required_qa_gates') or sorted(REQUIRED_DESIGN_SPEC_QA_GATES)
    for gate in required_qa_gates:
        if gate not in qa_gates:
            missing.append(f'qa_gates.{gate}')
    return missing



def validate_shape_plan_validator(contract: dict) -> dict:
    validator = contract.get('shape_plan_validator')
    if not isinstance(validator, dict):
        fail('engine contract shape_plan_validator missing')
    numeric_fields = [
        'minimum_layout_archetypes',
        'sample_minimum_layout_archetypes',
        'minimum_title_pt',
        'minimum_body_pt',
        'minimum_edge_margin_in',
        'minimum_inter_block_gap_in',
        'minimum_repeated_concrete_composition_limit',
        'minimum_distinct_composition_share',
    ]
    for field in numeric_fields:
        try:
            value = float(validator.get(field))
        except (TypeError, ValueError):
            fail(f'engine contract shape_plan_validator numeric field invalid: {field}')
        if value <= 0:
            fail(f'engine contract shape_plan_validator numeric field invalid: {field}')
    for field in [
        'professional_design_brief_required_fields',
        'required_borrowed_principles',
        'required_qa_gates',
    ]:
        values = validator.get(field)
        if not isinstance(values, list) or not values or any(not safe_text(value) for value in values):
            fail(f'engine contract shape_plan_validator string array invalid: {field}')
    if not safe_text(validator.get('required_owner')):
        fail('engine contract shape_plan_validator required_owner invalid')
    if validator.get('professional_design_brief_forbidden_patterns_required') is not True:
        fail('engine contract shape_plan_validator professional brief policy invalid')
    return validator


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
    validate_shape_plan_validator(contract)
    return contract


def normalize_slide_data(
    payload: dict,
    validator_contract: dict | None = None,
    *,
    allow_quality_debt: bool = False,
) -> list:
    plan = payload.get('editable_shape_plan') or {}
    sample_layout_profile = (
        payload.get('native_ppt_sample_layout_profile')
        if isinstance(payload.get('native_ppt_sample_layout_profile'), dict)
        else {}
    )
    design_spec_lock = plan.get('design_spec_lock') if isinstance(plan.get('design_spec_lock'), dict) else {}
    minimum_layout_archetypes = (
        int((validator_contract or {}).get('sample_minimum_layout_archetypes') or 2)
        if safe_text(plan.get('authoring_mode')) == 'native_visual_sample_compact'
        else int((validator_contract or {}).get('minimum_layout_archetypes') or 3)
    )
    missing_design_spec_lock = missing_design_spec_lock_fields(
        design_spec_lock,
        minimum_layout_archetypes,
        validator_contract,
    )
    plan_quality_debt = []
    if missing_design_spec_lock and not allow_quality_debt:
        fail(
            'ai_first_design_spec_lock_missing: editable_shape_plan.design_spec_lock requires '
            'AI-authored design system, grid, typography, palette, layout rhythm, borrowed design discipline, '
            'and QA gates before shape coordinates: '
            + json.dumps(missing_design_spec_lock, ensure_ascii=False, sort_keys=True)
        )
    if missing_design_spec_lock:
        plan_quality_debt.append({
            'reason': 'ai_first_design_spec_lock_missing',
            'missing_fields': missing_design_spec_lock,
        })
    grammar_failures = validate_template_layout_grammar(plan)
    if grammar_failures and not allow_quality_debt:
        fail(
            'ai_first_template_layout_grammar_missing: editable_shape_plan.template_layout_grammar '
            'requires llm_agent owner, required=true, archetype catalog, and execute-selected-zones materializer boundary: '
            + json.dumps(grammar_failures, ensure_ascii=False, sort_keys=True)
        )
    allowed_archetypes = allowed_template_archetypes(plan)
    archetypes_by_id = archetype_contracts(plan)
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
    source_slides = plan_slides
    if not source_slides:
        fail('native PPT authoring requires editable_shape_plan.slides; slide_blueprint.slides is context only and cannot substitute for AI-authored native shapes')
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
        template_binding = (
            raw_slide.get('template_layout_binding')
            if isinstance(raw_slide.get('template_layout_binding'), dict)
            else {}
        )
        selected_archetype = safe_text(template_binding.get('selected_archetype'))
        if selected_archetype and allowed_archetypes and selected_archetype not in allowed_archetypes and not allow_quality_debt:
            fail(
                'ai_first_template_layout_binding_invalid: '
                f'slide {slide_id} selected_archetype is not in editable_shape_plan.template_layout_grammar.archetype_catalog'
            )
        merged['template_layout_binding'] = template_binding
        merged['_native_ppt_sample_layout_profile'] = sample_layout_profile
        merged['_template_archetype_contract'] = archetypes_by_id.get(selected_archetype) or {}
        merged['_editable_native_shapes'] = plan_shapes
        merged['_typography_plan'] = typography_plan
        merged['_deck_layout_rhythm'] = design_spec_lock.get('layout_rhythm') if isinstance(design_spec_lock.get('layout_rhythm'), dict) else {}
        merged['_plan_quality_debt'] = [
            *plan_quality_debt,
            *([{
                'reason': 'ai_first_template_layout_grammar_missing',
                'grammar_failures': grammar_failures,
            }] if grammar_failures else []),
            *([{
                'reason': 'ai_first_template_layout_binding_invalid',
                'selected_archetype': selected_archetype,
            }] if selected_archetype and allowed_archetypes and selected_archetype not in allowed_archetypes else []),
        ]
        slides.append(merged)
    if not slides:
        fail('native PPT authoring requires at least one valid slide object')
    return slides


def normalize_slide_data_failures(payload: dict, validator_contract: dict | None = None) -> list[dict]:
    plan = payload.get('editable_shape_plan') if isinstance(payload.get('editable_shape_plan'), dict) else {}
    failures = []
    design_spec_lock = plan.get('design_spec_lock') if isinstance(plan.get('design_spec_lock'), dict) else {}
    minimum_layout_archetypes = (
        int((validator_contract or {}).get('sample_minimum_layout_archetypes') or 2)
        if safe_text(plan.get('authoring_mode')) == 'native_visual_sample_compact'
        else int((validator_contract or {}).get('minimum_layout_archetypes') or 3)
    )
    missing_design_spec_lock = missing_design_spec_lock_fields(
        design_spec_lock,
        minimum_layout_archetypes,
        validator_contract,
    )
    if missing_design_spec_lock:
        failures.append({
            'reason': 'ai_first_design_spec_lock_missing',
            'missing_fields': missing_design_spec_lock,
        })
    grammar_failures = validate_template_layout_grammar(plan)
    if grammar_failures:
        failures.append({
            'reason': 'ai_first_template_layout_grammar_missing',
            'grammar_failures': grammar_failures,
        })
    return failures or [{'reason': 'ai_first_shape_plan_normalization_failed'}]


def validate_ai_first_shape_plan(input_json: Path, engine_contract_file: Path) -> dict:
    payload = json.loads(input_json.read_text(encoding='utf-8'))
    engine_contract = load_engine_contract(engine_contract_file)
    validator_contract = engine_contract.get('shape_plan_validator') or {}
    try:
        slides = normalize_slide_data(payload, validator_contract)
    except SystemExit as exc:
        return {
            'ok': False,
            'stage': 'normalize_slide_data',
            'exit_code': int(exc.code or 1) if isinstance(exc.code, int) else 1,
            'failures': normalize_slide_data_failures(payload, validator_contract),
        }
    from redcube_ai.native_helpers.ppt_deck.native_layouts import validate_ai_first_design_plan
    failures = []
    for slide in slides:
        slide_id = safe_text(slide.get('slide_id'))
        slide_failures = [
            *sample_layout_profile_failures(slide),
            *validate_ai_first_design_plan(slide),
        ]
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
