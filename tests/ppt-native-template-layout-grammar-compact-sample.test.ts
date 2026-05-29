// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { getDeliverablePaths } from '@redcube/runtime-protocol';

import { mkUserScopedTestWorkspace } from './helpers/test-workspace.ts';
import {
  patchDeliverableConstraints,
  readJson,
  runNativePlanningChain,
  withMockNativePptRuntime,
} from './helpers/ppt-native-ppt-runtime-fixtures.ts';
import { invokeProductEntry, runDeliverableRoute } from './product-domain-action-test-api.ts';
import { createNativePptPlanPreflightParts } from '../packages/redcube-runtime-family-ppt/dist/ppt-deck-runtime-family-parts/native-ppt-plan-preflight.js';
import { createNativePptShapePlanNormalizeParts } from '../packages/redcube-runtime-family-ppt/dist/ppt-deck-runtime-family-parts/native-ppt-shape-plan-normalize.js';
import {
  createNativePptSampleAuthoringParts,
  nativePptSampleLayoutProfile,
} from '../packages/redcube-runtime-family-ppt/dist/ppt-deck-runtime-family-parts/native-ppt-sample-authoring.js';
import { buildNativeSampleShapePlanOutputContract } from '../packages/redcube-runtime-family-ppt/dist/ppt-deck-runtime-family-parts/native-ppt-shape-plan-contract.js';

function meaningfulChars(text) {
  return String(text || '').replace(/[\p{P}\p{S}\s_]+/gu, '').length;
}

function assertTemplateLayoutBinding(slide) {
  const grammarBinding = slide.template_layout_binding || {};
  const zones = Array.isArray(grammarBinding.zones) ? grammarBinding.zones : [];
  const zoneIds = new Set(zones.map((zone) => zone.zone_id).filter(Boolean));
  assert.equal(typeof grammarBinding.selected_archetype, 'string');
  assert.equal(typeof grammarBinding.archetype_instance_id, 'string');
  assert.equal(typeof grammarBinding.rhythm_role, 'string');
  assert.equal(grammarBinding.zone_gap_in_min >= 0.32, true);
  assert.equal(grammarBinding.zone_inset_in_min >= 0.15, true);
  assert.equal(zones.length >= 3, true);
  assert.equal(
    zones.every((zone) => (
      typeof zone.zone_id === 'string'
      && typeof zone.semantic_role === 'string'
      && zone.bounds
      && Number(zone.bounds.width_in) > 0
      && Number(zone.bounds.height_in) > 0
    )),
    true,
  );
  assert.equal(
    slide.native_shapes.every((shape) => (
      shape.quality_role === 'decorative'
      || ['page_number', 'page_no', 'footer', 'cover_meta'].includes(shape.role)
      || zoneIds.has(shape.layout_zone_id)
    )),
    true,
  );
}

test('native PPT compact sample output contract carries safe zone blueprints for AI coordinates', () => {
  const sampleProfile = nativePptSampleLayoutProfile({
    delivery_request: {
      constraints: {
        native_visual_sample: true,
        expected_slide_count: 1,
      },
    },
  });
  const contract = buildNativeSampleShapePlanOutputContract({
    aiFirstEditingContract: { owner: 'llm_agent' },
    route: 'author_pptx_native',
    sampleProfile,
  }).editable_shape_plan;
  const grammar = contract.template_layout_grammar;
  assert.equal(contract.professional_design_pack_contract.required, true);
  assert.equal(contract.professional_design_pack_contract.creative_owner, 'llm_agent');
  assert.equal(contract.professional_design_pack_contract.materializer_can_select_layout, false);
  assert.equal(
    contract.professional_design_pack_contract.layout_archetype_taxonomy
      .some((archetype) => archetype.archetype_id === 'flow_hub_to_cards_proof_band'),
    true,
  );
  assert.equal(contract.professional_design_pack_contract.capacity_budgets.body_font_pt_min, 18);
  assert.equal(contract.professional_design_pack_contract.connector_semantics.real_ppt_connector_required, true);
  assert.equal(contract.professional_design_pack_contract.connector_semantics.horizontal_bus_for_route_cards_allowed, false);
  assert.equal(contract.professional_design_pack_contract.design_reference_discipline.source_projects.includes('presenton'), true);
  assert.equal(contract.professional_design_pack_contract.design_reference_discipline.source_projects.includes('ppt-agent-skills'), true);
  assert.equal(grammar.global_rules.safe_zone_blueprint_must_be_used_before_coordinates, true);
  assert.equal(contract.sample_capacity_contract.safe_zone_blueprints_required_before_coordinates, true);
  assert.match(grammar.safe_zone_blueprints.tuple_contract, /sample_status_proof_board/);
  assert.match(grammar.safe_zone_blueprints.tuple_contract, /title_zone:title:0\.85,0\.45,14\.3,1\.15,0\.15/);
  assert.match(grammar.safe_zone_blueprints.tuple_contract, /proof_zone:proof/);
  assert.match(grammar.safe_zone_blueprints.tuple_contract, /title:title_zone:0\.95,0\.58,13\.6,0\.9/);
  assert.match(grammar.safe_zone_blueprints.tuple_contract, /core_sentence:claim_zone:0\.95,1\.86,13\.6,0\.95/);
  assert.match(grammar.safe_zone_blueprints.tuple_contract, /point_text:status_zone:1\.25\|6\.0\|10\.75,4\.9,4\.0,1\.05/);
  assert.match(grammar.safe_zone_blueprints.tuple_contract, /proof_text:proof_zone:1\.25,6\.88,12\.9,1\.05/);
  assert.match(grammar.safe_zone_blueprints.tuple_contract, /no_route_label/);
  assert.equal(grammar.safe_zone_blueprint_rule.includes('Copy tuple zones'), true);
  assert.match(grammar.safe_zone_blueprints.tuple_contract, /kind=connector/);
  assert.deepEqual(
    grammar.native_shape_style_schema.required_text_fields,
    ['editable_text', 'font_size'],
  );
  assert.equal(
    grammar.native_shape_style_schema.forbidden_nested_style_fields.includes('font.size_pt'),
    true,
  );
  assert.match(grammar.native_shape_style_schema.rule, /top-level/);
  assert.match(grammar.native_shape_style_schema.rule, /font_size/);
  assert.deepEqual(
    contract.slides[0].native_shapes.text_shape_required_fields,
    ['editable_text', 'font_size'],
  );
  assert.match(contract.slides[0].native_shapes.style_schema_rule, /font_size/);
});

test('native PPT compact sample output contract exposes capacity budgets from live blocker feedback', () => {
  const sampleProfile = nativePptSampleLayoutProfile({
    delivery_request: {
      constraints: {
        native_visual_sample: true,
        expected_slide_count: 1,
      },
    },
  });
  const contract = buildNativeSampleShapePlanOutputContract({
    aiFirstEditingContract: { owner: 'llm_agent' },
    route: 'author_pptx_native',
    sampleProfile,
  }).editable_shape_plan;
  const sampleStatus = contract.template_layout_grammar.archetype_catalog.find(
    (archetype) => archetype.archetype_id === 'sample_status_proof_board',
  );
  assert.equal(sampleStatus.content_schema.status_zone_height_in_min, 3.45);
  assert.equal(sampleStatus.content_schema.status_card_quality_role_required, 'content');
  assert.equal(sampleStatus.content_schema.proof_zone_height_in_min, 1.35);
  assert.equal(sampleStatus.content_schema.core_sentence_height_in_min, 0.95);
  assert.equal(sampleStatus.content_schema.evidence_item_height_in_min, 0.84);
  assert.equal(sampleStatus.content_schema.status_card_point_text_min_cjk_chars, 12);
  assert.equal(sampleStatus.content_schema.status_card_separate_route_label_allowed, false);
  assert.equal(sampleStatus.content_schema.status_card_single_point_text_required, true);
  assert.equal(sampleStatus.content_schema.input_hub_label_height_in_min, 0.54);
  assert.equal(sampleStatus.content_schema.input_hub_label_width_in_min, 10.4);
  assert.equal(sampleStatus.content_schema.input_hub_width_in_min, 10.4);
  assert.equal(sampleStatus.content_schema.input_hub_height_in_min, 0.82);
  assert.equal(sampleStatus.content_schema.input_hub_font_pt_min, 22);
  assert.equal(sampleStatus.content_schema.input_hub_spans_route_card_centers_required, true);
  assert.equal(sampleStatus.content_schema.connector_vertical_width_in_max, 0.04);
  assert.equal(sampleStatus.content_schema.connector_vertical_height_in_min, 0.66);
  assert.equal(sampleStatus.content_schema.connector_hub_gap_in_max, 0.12);
  assert.equal(sampleStatus.content_schema.horizontal_connector_bus_allowed, false);
  assert.equal(sampleStatus.content_schema.route_card_connector_kind_required, 'connector');
  assert.equal(sampleStatus.content_schema.input_hub_label_min_cjk_chars, 12);
  assert.equal(sampleStatus.content_schema.input_hub_label_max_cjk_chars, 16);
  assert.equal(sampleStatus.content_schema.input_hub_label_min_cjk_chars_when_content, 12);
  assert.equal(sampleStatus.content_schema.connector_thickness_in_min, 0.03);
  assert.equal(sampleStatus.content_schema.connector_text_clearance_in_min, 0.12);
  assert.match(contract.sample_capacity_contract.evidence_text_rule, /compact sentence/);
  assert.match(sampleStatus.layout_description, /proof band/);
  assert.equal(contract.design_spec_lock.borrowed_principles.includes('semantic_layout_selection'), true);
  assert.equal(contract.design_spec_lock.borrowed_principles.includes('per_page_visual_plan'), true);
  assert.equal(contract.design_spec_lock.borrowed_principles.includes('ppt_master_style_spec_lock'), true);
  assert.equal(contract.design_spec_lock.borrowed_principles.includes('template_layout_grammar'), true);
  assert.equal(contract.design_spec_lock.borrowed_principles.includes('template_profile'), true);
  assert.equal(contract.design_spec_lock.borrowed_principles.includes('reference_deck_analysis'), true);
  assert.equal(contract.design_spec_lock.borrowed_principles.includes('layout_rhythm'), true);
  assert.equal(contract.design_spec_lock.borrowed_principles.includes('rendered_quality_gate'), true);
  assert.equal(contract.design_spec_lock.qa_gates.includes('layout_variety'), true);
  const profile = nativePptSampleLayoutProfile({
    delivery_request: {
      constraints: {
        native_visual_sample: true,
        expected_slide_count: 1,
      },
    },
  });
  assert.equal(profile.capacity_rules.input_hub_label_width_in_min, 10.4);
  assert.equal(profile.capacity_rules.input_hub_width_in_min, 10.4);
  assert.equal(profile.capacity_rules.input_hub_height_in_min, 0.82);
  assert.equal(profile.capacity_rules.input_hub_font_pt_min, 22);
  assert.equal(profile.capacity_rules.input_hub_label_min_cjk_chars, 12);
  assert.equal(profile.capacity_rules.input_hub_label_max_cjk_chars, 16);
  assert.deepEqual(profile.capacity_rules.title_font_pt_range, [40, 44]);
  assert.equal(profile.capacity_rules.status_card_point_text_min_cjk_chars, 12);
  assert.equal(profile.capacity_rules.status_card_separate_route_label_allowed, false);
  assert.equal(profile.capacity_rules.status_card_single_point_text_required, true);
  assert.equal(profile.capacity_rules.connector_thickness_in_min, 0.03);
  assert.equal(profile.capacity_rules.connector_text_clearance_in_min, 0.12);
  assert.equal(profile.capacity_rules.status_card_quality_role_required, 'content');
  assert.equal(profile.capacity_rules.input_hub_card_flow_geometry_required, true);
  assert.equal(profile.capacity_rules.input_hub_spans_route_card_centers_required, true);
  assert.equal(profile.capacity_rules.connector_vertical_width_in_max, 0.04);
  assert.equal(profile.capacity_rules.connector_vertical_height_in_min, 0.66);
  assert.equal(profile.capacity_rules.connector_hub_gap_in_max, 0.12);
  assert.equal(profile.capacity_rules.horizontal_connector_bus_allowed, false);
  assert.equal(profile.capacity_rules.connector_direction_required, true);
  assert.equal(profile.capacity_rules.route_card_connector_kind_required, 'connector');
  assert.match(profile.required_design_decision, /0\.04in/);
  assert.match(profile.required_design_decision, /0\.12in/);
  assert.match(profile.required_design_decision, /10\.4/);
  assert.match(profile.required_design_decision, /40-44pt/);
  assert.match(profile.required_design_decision, />=2\.0x/);
  assert.match(profile.required_design_decision, /vertical arrow|vertical connector/);
  assert.match(profile.required_design_decision, /同一材料同步进入三条路线验证/);
  assert.equal(meaningfulChars('同一材料同步进入三条路线验证'), 14);
  assert.equal(profile.required_design_decision.includes('同一材料进入三路验证'), false);
  assert.match(profile.safe_zone_blueprints.tuple_contract, /input_hub:status_zone:2\.8,3\.08,10\.4,0\.86/);
  assert.match(profile.safe_zone_blueprints.tuple_contract, /flow_drop:status_zone:card_center,3\.94,0\.03,0\.74/);
  assert.match(profile.safe_zone_blueprints.tuple_contract, /centers=3\.25\|8\.0\|12\.75/);
  assert.match(profile.safe_zone_blueprints.tuple_contract, /kind=connector/);
  assert.match(profile.safe_zone_blueprints.tuple_contract, /tailEnd=triangle/);
  assert.match(profile.safe_zone_blueprints.tuple_contract, /no_horizontal_bus/);
});

test('native PPT compact sample retry context carries exact fixes without full validator payload bloat', () => {
  const sampleParts = createNativePptSampleAuthoringParts({
    aiFirstEditingContract: { owner: 'llm_agent' },
    safeArray: (value) => (Array.isArray(value) ? value : []),
    safeText: (value, fallback = '') => String(value || fallback || '').trim(),
  });
  const validationFeedback = {
    previous_attempt: 1,
    repair_request: 'very long generic retry instructions '.repeat(80),
    validator: {
      ok: false,
      stage: 'ai_first_shape_plan_preflight',
      failure_count: 3,
      slide_count: 1,
      failures: [{
        slide_id: 'S01',
        failures: [
          { reason: 'ai_first_page_number_missing' },
          {
            reason: 'ai_first_text_box_height_below_readability_floor',
            shape_id: 'S01_input_label',
            role: 'input_hub_label',
            current_height_in: 0.52,
            required_height_in: 0.54,
            minimum_height_in: 0.54,
            text_repair_instruction: 'raise the exact label height',
          },
          {
            reason: 'ai_first_content_depth_too_low',
            shape_id: 'S01_POINT_C',
            role: 'point_text',
            text_char_count: 10,
            threshold: 12,
          },
        ],
      }],
      omitted_debug_blob: 'x'.repeat(12000),
    },
    required_shape_fixes: [{
      slide_id: 'S01',
      shape_id: 'S01_input_label',
      reason: 'ai_first_text_box_height_below_readability_floor',
      role: 'input_hub_label',
      current_height_in: 0.52,
      required_height_in: 0.54,
      minimum_height_in: 0.54,
      text_repair_instruction: 'raise the exact label height',
      raw_validator_dump: 'y'.repeat(12000),
    }],
    required_structural_fixes: [{
      scope: 'slide',
      slide_id: 'S01',
      reason: 'ai_first_page_number_missing',
      missing_fields: ['native_shapes[role=page_number]'],
      repair_instruction: 'add an auxiliary page_number shape',
    }],
    global_shape_class_fixes: [{
      rule_id: 'native_panel_text_safe_area_inset',
      repair_instruction: 'z'.repeat(2000),
      applies_to_roles: ['point_text'],
      required_inset_in: 0.15,
    }],
    passed_structure_preservation_contract: {
      contract_kind: 'native_pptx_retry_preserve_passed_layout_structure_v1',
      required: true,
      preserve_fields: ['editable_shape_plan.template_layout_grammar'],
      page_number_missing_rule: 'add page number without dropping bindings',
    },
    attempt_artifact_refs: ['/tmp/attempt-01.json', '/tmp/attempt-01-validation.json'],
  };
  const context = sampleParts.compactNativeSampleContext({
    contract: {
      title: 'Native sample',
      delivery_request: {
        constraints: { native_visual_sample: true, expected_slide_count: 1 },
      },
    },
    baseAuthoringContext: { goal: 'make an editable visual sample' },
    blueprintArtifact: {
      slide_blueprint: {
        slides: [{
          slide_id: 'S01',
          title: 'One slide',
          core_sentence: 'Core claim',
          page_core_content: ['A', 'B', 'C', 'D'],
          evidence_and_sources: ['E1', 'E2', 'E3', 'E4'],
        }],
      },
    },
    visualArtifact: { visual_direction: { design_thesis: 'clear proof board' } },
    unitRepairScope: { target_slide_ids: ['S01'] },
    repairFeedback: [],
    validationFeedback,
    attemptIndex: 2,
  });
  const feedback = context.native_shape_plan_validation_feedback;
  assert.equal(feedback.feedback_kind, 'native_pptx_compact_sample_retry_feedback_v1');
  assert.equal(feedback.validator.full_validator_payload_omitted, true);
  assert.equal(feedback.required_shape_fixes[0].shape_id, 'S01_input_label');
  assert.equal(feedback.required_shape_fixes[0].required_height_in, 0.54);
  const compactPointTextFailure = feedback.validator.failures[0].failures.find((fix) => fix.shape_id === 'S01_POINT_C');
  assert.equal(compactPointTextFailure.text_char_count, 10);
  assert.equal(compactPointTextFailure.required_text_char_count, 12);
  assert.equal(feedback.required_shape_fixes[0].raw_validator_dump, undefined);
  assert.equal(JSON.stringify(feedback).includes('omitted_debug_blob'), false);
  assert.equal(JSON.stringify(feedback).includes('raw_validator_dump'), false);
  assert.equal(JSON.stringify(feedback).length < 6500, true, JSON.stringify(feedback).length);
});

test('native PPT compact sample retry output contract stays focused on exact fixes', () => {
  const sampleProfile = nativePptSampleLayoutProfile({
    delivery_request: {
      constraints: {
        native_visual_sample: true,
        expected_slide_count: 1,
      },
    },
  });
  const baseContract = buildNativeSampleShapePlanOutputContract({
    aiFirstEditingContract: { owner: 'llm_agent' },
    route: 'author_pptx_native',
    sampleProfile,
  });
  const preflightParts = createNativePptPlanPreflightParts({
    nativeShapePlanOutputContract: () => baseContract,
    safeArray: (value) => (Array.isArray(value) ? value : []),
    safeText: (value, fallback = '') => String(value || fallback || '').trim(),
  });
  const outputContract = preflightParts.nativeShapePlanOutputContractForAttempt('author_pptx_native', {
    previous_attempt: 1,
    validator: {
      ok: false,
      stage: 'ai_first_shape_plan_preflight',
      failure_count: 2,
      failures: [{
        slide_id: 'S01',
        failures: [
          { reason: 'ai_first_page_number_missing' },
          {
            reason: 'ai_first_text_box_height_below_readability_floor',
            shape_id: 'S01_input_label',
            role: 'input_hub_label',
            height_in: 0.52,
            minimum_height_in: 0.54,
            suggested_height_in: 0.54,
          },
          {
            reason: 'ai_first_content_depth_too_low',
            shape_id: 'S01_POINT_C',
            role: 'point_text',
            text_char_count: 10,
            threshold: 12,
          },
        ],
      }],
    },
    required_shape_fixes: [{
      slide_id: 'S01',
      shape_id: 'S01_input_label',
      reason: 'ai_first_text_box_height_below_readability_floor',
      role: 'input_hub_label',
      current_height_in: 0.52,
      required_height_in: 0.54,
      minimum_height_in: 0.54,
    }, {
      slide_id: 'S01',
      shape_id: 'S01_POINT_C',
      reason: 'ai_first_content_depth_too_low',
      role: 'point_text',
      current_text_char_count: 10,
      threshold: 12,
    }],
    required_structural_fixes: [{
      scope: 'slide',
      slide_id: 'S01',
      reason: 'ai_first_page_number_missing',
      missing_fields: ['native_shapes[role=page_number]'],
      repair_instruction: 'add a page number',
    }],
    global_shape_class_fixes: [],
  }, baseContract);
  assert.equal(
    outputContract.native_shape_plan_validation_feedback_contract.contract_kind,
    'native_pptx_compact_sample_retry_exact_fixes_v1',
  );
  assert.equal(
    outputContract.native_shape_plan_validation_feedback_contract.exact_shape_fixes[0].shape_id,
    'S01_input_label',
  );
  assert.equal(
    outputContract.native_shape_plan_validation_feedback_contract.exact_shape_fixes
      .some((fix) => fix.shape_id === 'S01_POINT_C' && fix.required_text_char_count === 12),
    true,
  );
  assert.equal(
    outputContract.native_shape_plan_structural_retry_contract.contract_kind,
    'native_pptx_compact_sample_structural_retry_v1',
  );
  assert.equal(outputContract.editable_shape_plan.validation_retry_contract.required, true);
  assert.equal(JSON.stringify(outputContract).length < 45000, true, JSON.stringify(outputContract).length);
});

test('native PPT structural feedback treats compact sample one-archetype catalog as incomplete grammar, not absent grammar', () => {
  const normalizeParts = createNativePptShapePlanNormalizeParts({
    safeArray: (value) => (Array.isArray(value) ? value : []),
    safeText: (value, fallback = '') => String(value || fallback || '').trim(),
  });
  const error = new Error(
    'Native PPT author_pptx_native requires editable_shape_plan.template_layout_grammar with llm_agent owner, archetype catalog, and execute-selected-zones materializer boundary: '
    + JSON.stringify([{
      reason: 'template_layout_grammar.archetype_catalog_count',
      actual: 1,
      minimum: 2,
      required_archetype_ids: ['sample_status_proof_board', 'sample_decision_proof_split'],
    }]),
  );
  const feedback = normalizeParts.structuralFeedbackFromPlanError({
    route: 'author_pptx_native',
    error,
    attemptIndex: 3,
    attemptArtifactRefs: ['attempt-03-structural-validation.json'],
    previousValidationFeedback: {
      passed_structure_preservation_contract: {
        preserve_fields: ['editable_shape_plan.template_layout_grammar'],
      },
    },
  });
  assert.equal(Boolean(feedback), true);
  const fix = feedback.required_structural_fixes[0];
  assert.equal(fix.reason, 'native_shape_plan_template_layout_grammar_missing');
  assert.equal(fix.grammar_failures[0].reason, 'template_layout_grammar.archetype_catalog_count');
  assert.match(fix.repair_instruction, /Repair the existing AI-authored template_layout_grammar/);
  assert.match(fix.repair_instruction, /sample_decision_proof_split/);
  assert.equal(
    feedback.validator.failures[0].grammar_failures[0].required_archetype_ids.includes('sample_status_proof_board'),
    true,
  );
  const preflightParts = createNativePptPlanPreflightParts({
    nativeShapePlanOutputContract: () => ({ editable_shape_plan: {} }),
    safeArray: (value) => (Array.isArray(value) ? value : []),
    safeText: (value, fallback = '') => String(value || fallback || '').trim(),
  });
  const outputContract = preflightParts.nativeShapePlanOutputContractForAttempt('author_pptx_native', feedback);
  assert.match(
    outputContract.native_shape_plan_structural_retry_contract.required_structural_fixes[0].repair_instruction,
    /sample_decision_proof_split/,
  );
  assert.match(
    outputContract.native_shape_plan_structural_retry_contract.instruction,
    /Preserve the complete already accepted structure/,
  );
});

test('native PPT structural feedback tells compact sample retry to remove partial proof-band archetype', () => {
  const normalizeParts = createNativePptShapePlanNormalizeParts({
    safeArray: (value) => (Array.isArray(value) ? value : []),
    safeText: (value, fallback = '') => String(value || fallback || '').trim(),
  });
  const error = new Error(
    'Native PPT author_pptx_native compact sample grammar must contain exactly the two complete sample archetype contracts, not partial component archetypes: '
    + JSON.stringify({
      actual_archetype_ids: [
        'sample_status_proof_board',
        'sample_decision_proof_split',
        'sample_proof_band',
      ],
      required_archetype_ids: ['sample_status_proof_board', 'sample_decision_proof_split'],
      forbidden_examples: ['sample_proof_band', 'partial_component_archetype'],
    }),
  );
  const feedback = normalizeParts.structuralFeedbackFromPlanError({
    route: 'author_pptx_native',
    error,
    attemptIndex: 2,
    attemptArtifactRefs: ['attempt-02-candidate.json'],
    previousValidationFeedback: {
      passed_structure_preservation_contract: {
        preserve_fields: [
          'editable_shape_plan.template_layout_grammar',
          'editable_shape_plan.slides[].template_layout_binding',
          'editable_shape_plan.slides[].native_shapes[].layout_zone_id',
        ],
      },
    },
  });
  assert.equal(Boolean(feedback), true);
  assert.equal(
    feedback.validator.reason,
    'native_shape_plan_compact_sample_catalog_contains_component_archetype',
  );
  const fix = feedback.required_structural_fixes[0];
  assert.equal(fix.reason, 'native_shape_plan_compact_sample_catalog_contains_component_archetype');
  assert.deepEqual(fix.required_archetype_ids, ['sample_status_proof_board', 'sample_decision_proof_split']);
  assert.deepEqual(fix.forbidden_catalog_archetypes, ['sample_proof_band']);
  assert.match(fix.repair_instruction, /remove sample_proof_band/);
  assert.match(fix.repair_instruction, /proof_band as a native_shapes\[\]\.role/);
  assert.match(fix.repair_instruction, /safe_zone_blueprints\.tuple_contract/);
  assert.equal(
    fix.required_fields.includes('native_shapes[].layout_zone_id bound to selected archetype zones'),
    true,
  );
  const preflightParts = createNativePptPlanPreflightParts({
    nativeShapePlanOutputContract: () => ({ editable_shape_plan: {} }),
    safeArray: (value) => (Array.isArray(value) ? value : []),
    safeText: (value, fallback = '') => String(value || fallback || '').trim(),
  });
  const outputContract = preflightParts.nativeShapePlanOutputContractForAttempt('author_pptx_native', feedback);
  const serialized = JSON.stringify(outputContract);
  assert.equal(serialized.includes('native_shape_plan_compact_sample_catalog_contains_component_archetype'), true);
  assert.equal(serialized.includes('remove sample_proof_band'), true);
  assert.equal(serialized.includes('proof_band is native_shapes[].role'), true);
  assert.equal(serialized.includes('safe_zone_blueprints.tuple_contract'), true);
});

test('native PPT one-slide visual sample uses compact Codex invocation while preserving AI-first shape plan authority', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-sample-compact-');
    const deliverableId = 'deck-sample-compact-invocation';
    await runNativePlanningChain({ workspaceRoot, deliverableId });
    patchDeliverableConstraints({
      workspaceRoot,
      deliverableId,
      constraints: {
        native_visual_sample: true,
        expected_slide_count: 1,
        max_slides: 1,
      },
    });

    const authorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
      route: 'author_pptx_native',
    });
    assert.equal(authorResult.ok, true);
    const authored = readJson(authorResult.artifactFile);
    const runtime = authored.creative_execution.generation_runtime;
    assert.equal(runtime.native_ppt_compact_sample_invocation, true);
    assert.equal(runtime.prompt_pack_file, 'prompts/ppt_deck/author_pptx_native_sample.md');
    assert.deepEqual(runtime.slide_scope.slide_ids, ['S01']);
    assert.equal(runtime.context_bytes < 16000, true, `context_bytes=${runtime.context_bytes}`);
    assert.equal(runtime.prompt_bytes < 31000, true, `prompt_bytes=${runtime.prompt_bytes}`);

    const contract = authored.native_ppt_bundle.ai_first_shape_plan_output_contract?.editable_shape_plan || {};
    assert.equal(contract.contract_kind, 'redcube_ai_first_native_ppt_shape_plan');
    assert.equal(contract.authoring_mode, 'native_visual_sample_compact');
    assert.equal(contract.structural_contract.ai_authoring_owner, 'llm_agent');
    assert.equal(contract.structural_contract.materializer_inference_allowed, false);
    assert.equal(contract.materializer.helper_template_layout_allowed, false);
    assert.deepEqual(
      contract.template_layout_grammar.archetype_catalog.map((archetype) => archetype.archetype_id),
      ['sample_status_proof_board', 'sample_decision_proof_split'],
    );

    const editableShapePlan = readJson(authored.native_ppt_bundle.editable_shape_plan_file);
    assert.equal(editableShapePlan.slides.length, 1);
    assert.equal(editableShapePlan.design_spec_lock.owner, 'llm_agent');
    assert.equal(typeof editableShapePlan.design_spec_lock.professional_design_brief.design_register, 'string');
    assert.equal(editableShapePlan.template_layout_grammar.owner, 'llm_agent');
    assert.equal(editableShapePlan.template_layout_grammar.helper_template_layout_allowed, false);
    assert.equal(editableShapePlan.template_layout_grammar.reference_discipline.action_title_required, true);
    assert.equal(
      ['ppt-master', 'PPTAgent', 'officecli-pptx', 'presenton', 'ppt-agent-skills']
        .every((project) => editableShapePlan.template_layout_grammar.reference_discipline.source_projects.includes(project)),
      true,
    );
    assert.equal(
      ['sample_status_proof_board', 'sample_decision_proof_split']
        .includes(editableShapePlan.slides[0].template_layout_binding.selected_archetype),
      true,
    );
    assertTemplateLayoutBinding(editableShapePlan.slides[0]);
  });
});

test('native PPT product-entry constraints rehydrate existing deliverable before compact sample authoring', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-sample-product-entry-');
    const deliverableId = 'deck-sample-product-entry';
    await runNativePlanningChain({ workspaceRoot, deliverableId });

    const productEntry = await invokeProductEntry({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      entry_session_contract: {
        entry_session_id: `session-native-sample-product-entry-${randomUUID()}`,
      },
      task_intent: 'run_deliverable_route',
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: deliverableId,
        profile_id: 'lecture_student',
        title: 'Native PPT 探索 deck',
        goal: '验证 product-entry constraints 进入 native compact sample authoring',
        route: 'author_pptx_native',
        constraints: {
          native_visual_sample: true,
          expected_slide_count: 1,
          max_slides: 1,
        },
      },
    });

    const routeResult = productEntry.domain_entry_surface.result_surface;
    assert.equal(routeResult.ok, true);
    const deliverablePaths = getDeliverablePaths(workspaceRoot, 'topic-a', deliverableId);
    const hydratedContract = readJson(
      `${deliverablePaths.deliverableDir}/contracts/hydrated-deliverable.json`,
    );
    assert.equal(hydratedContract.delivery_request.constraints.native_visual_sample, true);

    const authored = readJson(routeResult.artifactFile);
    assert.equal(
      authored.creative_execution.generation_runtime.prompt_pack_file,
      'prompts/ppt_deck/author_pptx_native_sample.md',
    );
    assert.equal(
      authored.native_ppt_bundle.ai_first_shape_plan_output_contract.editable_shape_plan.authoring_mode,
      'native_visual_sample_compact',
    );
    const validationInput = readJson(
      `${deliverablePaths.artifactsDir}/native_ppt/${deliverableId}-author_pptx_native-plan-validation-input.json`,
    );
    assert.equal(validationInput.native_ppt_sample_layout_profile.required, true);
    assert.equal(
      validationInput.native_ppt_sample_layout_profile.source,
      'delivery_request.constraints.native_visual_sample',
    );
    assert.equal(
      validationInput.native_ppt_sample_layout_profile.forbidden_archetypes.includes('executive_status_board'),
      true,
    );
  });
});
