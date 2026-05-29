// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';

import { withEnv } from './mock-codex-cli.ts';
import { mkUserScopedTestWorkspace } from './helpers/test-workspace.ts';
import {
  patchDeliverableConstraints,
  readJson,
  runNativePlanningChain,
  withMockNativePptRuntime,
} from './helpers/ppt-native-ppt-runtime-fixtures.ts';
import { runDeliverableRoute } from './product-domain-action-test-api.ts';
import { createNativePptPlanPreflightParts } from '../packages/redcube-runtime-family-ppt/dist/ppt-deck-runtime-family-parts/native-ppt-plan-preflight.js';
import { createNativePptShapePlanNormalizeParts } from '../packages/redcube-runtime-family-ppt/dist/ppt-deck-runtime-family-parts/native-ppt-shape-plan-normalize.js';

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

test('native PPT retry feedback carries earlier exact fixes when a later attempt introduces new failures', () => {
  const preflightParts = createNativePptPlanPreflightParts({
    nativeShapePlanOutputContract: () => ({ editable_shape_plan: {} }),
    safeArray: (value) => (Array.isArray(value) ? value : []),
    safeText: (value, fallback = '') => String(value || fallback || '').trim(),
  });
  const firstFeedback = preflightParts.buildNativeValidationFeedback({
    validation: {
      payload: {
        failures: [{
          slide_id: 'S01',
          failures: [{
            reason: 'ai_first_text_box_height_below_readability_floor',
            shape_id: 'S01-evidence-text',
            role: 'evidence_item',
            font_size: 18,
            height_in: 0.66,
            minimum_height_in: 0.84,
          }],
        }],
      },
    },
    attemptIndex: 1,
    attemptArtifactRefs: ['attempt-01-validation.json'],
  });
  const secondFeedback = preflightParts.buildNativeValidationFeedback({
    validation: {
      payload: {
        failures: [{
          slide_id: 'S01',
          failures: [{
            reason: 'ai_first_structural_text_collision',
            shape_id: 'S01-point-2-text',
            other_shape_id: 'S01-flow-rail',
            role: 'point_text',
            overlap_area_in2: 0.15,
          }],
        }],
      },
    },
    attemptIndex: 2,
    attemptArtifactRefs: ['attempt-02-validation.json'],
    previousValidationFeedback: firstFeedback,
  });
  const fixIds = secondFeedback.required_shape_fixes.map((fix) => fix.shape_id);
  assert.equal(fixIds.includes('S01-evidence-text'), true);
  assert.equal(fixIds.includes('S01-point-2-text'), true);
  const outputContract = preflightParts.nativeShapePlanOutputContractForAttempt('author_pptx_native', secondFeedback);
  assert.equal(
    JSON.stringify(outputContract).includes('S01-evidence-text'),
    true,
  );
});

test('native PPT structural plan treats auxiliary speaker metadata as non-zone content while keeping content shapes zone-bound', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-speaker-aux-zone-');
    const deliverableId = 'deck-speaker-aux-zone';
    await runNativePlanningChain({ workspaceRoot, deliverableId });
    const restoreSpeakerRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'drop_speaker_layout_zone',
    });
    try {
      const accepted = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId,
        route: 'author_pptx_native',
      });
      assert.equal(accepted.ok, true);
      const editableShapePlan = readJson(readJson(accepted.artifactFile).native_ppt_bundle.editable_shape_plan_file);
      assert.equal(
        editableShapePlan.slides.some((slide) => slide.native_shapes.some((shape) => (
          shape.role === 'speaker_identity'
          && shape.quality_role === 'auxiliary'
          && !shape.layout_zone_id
        ))),
        true,
      );
    } finally {
      restoreSpeakerRoute();
    }

    const rejectedDeliverableId = 'deck-content-zone-required';
    await runNativePlanningChain({ workspaceRoot, deliverableId: rejectedDeliverableId });
    const restoreContentRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'always_drop_content_layout_zone',
      REDCUBE_NATIVE_PPT_PLAN_MAX_ATTEMPTS: '1',
    });
    try {
      const rejected = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: rejectedDeliverableId,
        route: 'author_pptx_native',
      });
      assert.equal(rejected.ok, false);
      assert.match(
        String(rejected.error?.message || rejected.error || ''),
        /layout_zone_id/i,
      );
    } finally {
      restoreContentRoute();
    }
  });
});

test('native PPT retry feedback turns zone containment and short-label wrap into exact executable fixes', () => {
  const preflightParts = createNativePptPlanPreflightParts({
    nativeShapePlanOutputContract: () => ({ editable_shape_plan: {} }),
    safeArray: (value) => (Array.isArray(value) ? value : []),
    safeText: (value, fallback = '') => String(value || fallback || '').trim(),
  });
  const feedback = preflightParts.buildNativeValidationFeedback({
    validation: {
      payload: {
        failures: [{
          slide_id: 'S01',
          failures: [
            {
              reason: 'ai_first_shape_outside_template_layout_zone',
              shape_id: 'S01-core',
              role: 'core_sentence',
              layout_zone_id: 'claim_zone',
              zone_bounds: {
                left_in: 0.78,
                top_in: 1.62,
                width_in: 14.44,
                height_in: 1.18,
              },
              zone_safe_bounds: {
                left_in: 0.8,
                top_in: 1.64,
                right_in: 15.2,
                bottom_in: 2.78,
              },
              shape_bounds: {
                left_in: 0.96,
                top_in: 1.72,
                width_in: 13.85,
                height_in: 1.1,
              },
              required_delta_in: {
                left: 0,
                top: 0,
                right: 0.61,
                bottom: 0.04,
              },
            },
            {
              reason: 'ai_first_route_label_unbalanced_wrap',
              shape_id: 'S01-gate-text',
              role: 'gate_card',
              text_char_count: 19,
              estimated_lines: 2,
              width_in: 3.54,
              minimum_width_in: 4.2,
            },
          ],
        }],
      },
    },
    attemptIndex: 1,
    attemptArtifactRefs: ['attempt-01-validation.json'],
  });
  const zoneFix = feedback.required_shape_fixes
    .find((fix) => fix.reason === 'ai_first_shape_outside_template_layout_zone');
  assert.equal(zoneFix.shape_id, 'S01-core');
  assert.equal(zoneFix.layout_zone_id, 'claim_zone');
  assert.equal(zoneFix.required_inside_zone, true);
  assert.equal(zoneFix.required_zone_inset_in, 0.02);
  assert.equal(zoneFix.zone_bounds.width_in, 14.44);
  assert.equal(zoneFix.zone_safe_bounds.right_in, 15.2);
  assert.equal(zoneFix.required_delta_in.right, 0.61);
  assert.match(zoneFix.geometry_repair_instruction, /zone_bounds/);
  const labelFix = feedback.required_shape_fixes
    .find((fix) => fix.reason === 'ai_first_route_label_unbalanced_wrap');
  assert.equal(labelFix.shape_id, 'S01-gate-text');
  assert.equal(labelFix.required_width_in, 4.2);
  assert.match(labelFix.text_repair_instruction, /Shorten/);
  const outputContract = preflightParts.nativeShapePlanOutputContractForAttempt('author_pptx_native', feedback);
  assert.equal(JSON.stringify(outputContract).includes('required_inside_zone'), true);
  assert.equal(JSON.stringify(outputContract).includes('zone_safe_bounds'), true);
  assert.equal(JSON.stringify(outputContract).includes('required_delta_in'), true);
  assert.equal(JSON.stringify(outputContract).includes('required_width_in'), true);
});

test('native PPT retry feedback turns invalid quality_role into exact shape fixes', () => {
  const preflightParts = createNativePptPlanPreflightParts({
    nativeShapePlanOutputContract: () => ({ editable_shape_plan: {} }),
    safeArray: (value) => (Array.isArray(value) ? value : []),
    safeText: (value, fallback = '') => String(value || fallback || '').trim(),
  });
  const feedback = preflightParts.buildNativeValidationFeedback({
    validation: {
      payload: {
        failures: [{
          slide_id: 'S01',
          failures: [
            {
              reason: 'ai_first_quality_role_missing_or_invalid',
              shape_id: 'S01-title',
              role: 'title',
              kind: 'text_box',
              layout_zone_id: 'title_zone',
              actual: 'primary',
              allowed: ['content', 'decorative', 'auxiliary', 'structural'],
              required_quality_role: 'content',
            },
            {
              reason: 'ai_first_quality_role_missing_or_invalid',
              shape_id: 'S01-proof-band',
              role: 'proof_band',
              kind: 'rounded_rect',
              layout_zone_id: 'proof_zone',
              actual: 'visual',
              allowed: ['content', 'decorative', 'auxiliary', 'structural'],
            },
          ],
        }],
      },
    },
    attemptIndex: 8,
    attemptArtifactRefs: ['attempt-08-validation.json'],
  });
  const titleFix = feedback.required_shape_fixes
    .find((fix) => fix.shape_id === 'S01-title');
  assert.equal(titleFix.reason, 'ai_first_quality_role_missing_or_invalid');
  assert.equal(titleFix.actual_quality_role, 'primary');
  assert.equal(titleFix.required_quality_role, 'content');
  assert.deepEqual(titleFix.allowed_quality_roles, ['content', 'decorative', 'auxiliary', 'structural']);
  assert.match(titleFix.geometry_repair_instruction, /quality_role to content/);
  const structuralFix = feedback.required_shape_fixes
    .find((fix) => fix.shape_id === 'S01-proof-band');
  assert.equal(structuralFix.required_quality_role, 'structural');
  const outputContract = preflightParts.nativeShapePlanOutputContractForAttempt('author_pptx_native', feedback);
  const serialized = JSON.stringify(outputContract);
  assert.equal(serialized.includes('required_quality_role'), true);
  assert.equal(serialized.includes('allowed_quality_roles'), true);
  assert.equal(serialized.includes('quality_role equals required_quality_role'), true);
  assert.equal(serialized.includes('primary'), true);
});

test('native PPT retry feedback turns filled text-card padding failures into exact margin fixes', () => {
  const preflightParts = createNativePptPlanPreflightParts({
    nativeShapePlanOutputContract: () => ({ editable_shape_plan: {} }),
    safeArray: (value) => (Array.isArray(value) ? value : []),
    safeText: (value, fallback = '') => String(value || fallback || '').trim(),
  });
  const feedback = preflightParts.buildNativeValidationFeedback({
    validation: {
      payload: {
        failures: [{
          slide_id: 'S01',
          failures: [{
            reason: 'ai_first_text_card_internal_padding_too_small',
            shape_id: 'S01-card-text',
            role: 'point_text',
            current_margin_in: 0.02,
            required_inset_in: 0.15,
            shape_bounds: {
              left_in: 1.2,
              top_in: 4.02,
              width_in: 3.45,
              height_in: 1.24,
            },
          }],
        }],
      },
    },
    attemptIndex: 1,
    attemptArtifactRefs: ['attempt-01-validation.json'],
  });
  const cardFix = feedback.required_shape_fixes
    .find((fix) => fix.reason === 'ai_first_text_card_internal_padding_too_small');
  assert.equal(cardFix.shape_id, 'S01-card-text');
  assert.equal(cardFix.required_inset_in, 0.15);
  assert.match(cardFix.geometry_repair_instruction, /margin/);
  assert.equal(
    feedback.global_shape_class_fixes.some((fix) => fix.rule_id === 'native_filled_text_card_internal_padding'),
    true,
  );
  const outputContract = preflightParts.nativeShapePlanOutputContractForAttempt('author_pptx_native', feedback);
  assert.equal(JSON.stringify(outputContract).includes('native_filled_text_card_internal_padding'), true);
  assert.equal(JSON.stringify(outputContract).includes('required_inset_in'), true);
});

test('native PPT retry feedback turns mechanical card layouts into structural redesign fixes', () => {
  const preflightParts = createNativePptPlanPreflightParts({
    nativeShapePlanOutputContract: () => ({ editable_shape_plan: {} }),
    safeArray: (value) => (Array.isArray(value) ? value : []),
    safeText: (value, fallback = '') => String(value || fallback || '').trim(),
  });
  const feedback = preflightParts.buildNativeValidationFeedback({
    validation: {
      payload: {
        failures: [{
          slide_id: 'S01',
          failures: [
            {
              reason: 'ai_first_visual_support_shape_count_too_low',
              actual: 0,
              minimum: 2,
              structural_count: 0,
              decorative_count: 0,
            },
            {
              reason: 'ai_first_visual_structure_missing',
              structural_visual_count: 0,
            },
            {
              reason: 'ai_first_mechanical_card_template_detected',
              panel_count: 5,
              audience_content_slot_count: 5,
            },
          ],
        }],
      },
    },
    attemptIndex: 2,
    attemptArtifactRefs: ['attempt-02-validation.json'],
  });
  const structuralReasons = feedback.required_structural_fixes.map((fix) => fix.reason);
  assert.equal(structuralReasons.includes('ai_first_visual_structure_missing'), true);
  assert.equal(structuralReasons.includes('ai_first_visual_support_shape_count_too_low'), true);
  assert.equal(structuralReasons.includes('ai_first_mechanical_card_template_detected'), true);
  assert.match(feedback.repair_request, /mechanical_card_template_detected/);
  assert.match(feedback.repair_request, /quality_role=structural/);
  assert.equal(
    feedback.global_shape_class_fixes.some((fix) => (
      fix.rule_id === 'native_non_mechanical_visual_skeleton'
      && fix.required_visual_support_shape_count_min === 2
      && fix.required_structural_visual_count_min === 1
      && fix.mechanical_equal_card_grid_allowed === false
    )),
    true,
  );
  const outputContract = preflightParts.nativeShapePlanOutputContractForAttempt('author_pptx_native', feedback);
  assert.equal(JSON.stringify(outputContract).includes('native_shape_plan_structural_retry_contract'), true);
  assert.equal(JSON.stringify(outputContract).includes('non_mechanical_composition_skeleton'), true);
});

test('native PPT retry feedback turns native visual sample overload into sample layout redesign fixes', () => {
  const preflightParts = createNativePptPlanPreflightParts({
    nativeShapePlanOutputContract: () => ({ editable_shape_plan: {} }),
    safeArray: (value) => (Array.isArray(value) ? value : []),
    safeText: (value, fallback = '') => String(value || fallback || '').trim(),
  });
  const feedback = preflightParts.buildNativeValidationFeedback({
    validation: {
      payload: {
        failures: [{
          slide_id: 'S01',
          failures: [
            {
              reason: 'ai_first_native_sample_archetype_not_capacity_safe',
              selected_archetype: 'executive_status_board',
            },
            {
              reason: 'ai_first_native_sample_status_board_overloaded_with_takeaway',
              selected_archetype: 'sample_status_proof_board',
            },
            {
              reason: 'ai_first_native_sample_zone_too_short',
              selected_archetype: 'sample_status_proof_board',
              zone_id: 'proof_zone',
              height_in: 1.15,
              minimum_height_in: 1.35,
            },
            {
              reason: 'ai_first_native_sample_status_slots_not_exact',
              selected_archetype: 'sample_status_proof_board',
              content_panel_count: 3,
              point_text_count: 4,
              expected_count: 3,
            },
            {
              reason: 'ai_first_structural_role_not_specific',
              shape_id: 'S01-evidence-band',
              role: 'content_panel',
              kind: 'rounded_rect',
            },
          ],
        }],
      },
    },
    attemptIndex: 3,
    attemptArtifactRefs: ['attempt-03-validation.json'],
  });
  const structuralReasons = feedback.required_structural_fixes.map((fix) => fix.reason);
  assert.equal(structuralReasons.includes('ai_first_native_sample_archetype_not_capacity_safe'), true);
  assert.equal(structuralReasons.includes('ai_first_native_sample_status_board_overloaded_with_takeaway'), true);
  assert.equal(structuralReasons.includes('ai_first_native_sample_zone_too_short'), true);
  assert.equal(structuralReasons.includes('ai_first_native_sample_status_slots_not_exact'), true);
  assert.equal(structuralReasons.includes('ai_first_structural_role_not_specific'), true);
  assert.match(feedback.repair_request, /sample_status_proof_board/);
  assert.match(feedback.repair_request, /exactly three status_zone point_text/);
  assert.match(feedback.repair_request, /not a fourth status point_text/);
  const zoneFix = feedback.required_structural_fixes
    .find((fix) => fix.reason === 'ai_first_native_sample_zone_too_short');
  assert.equal(zoneFix.selected_archetype, 'sample_status_proof_board');
  assert.equal(zoneFix.zone_id, 'proof_zone');
  assert.equal(zoneFix.required_height_in, 1.6);
  assert.match(zoneFix.repair_instruction, /proof_zone/);
  const slotFix = feedback.required_structural_fixes
    .find((fix) => fix.reason === 'ai_first_native_sample_status_slots_not_exact');
  assert.equal(slotFix.content_panel_count, 3);
  assert.equal(slotFix.point_text_count, 4);
  assert.equal(slotFix.expected_count, 3);
  assert.equal(slotFix.excess_point_text_count, 1);
  assert.match(slotFix.repair_instruction, /Merge that sentence into the single proof_zone evidence_item|merge that sentence into the single proof_zone evidence_item/i);
  assert.match(slotFix.required_fields.join(' '), /exactly three point_text/);
  assert.equal(
    feedback.global_shape_class_fixes.some((fix) => (
      fix.rule_id === 'native_non_mechanical_visual_skeleton'
      && fix.recommended_one_slide_structures.includes('sample_status_proof_board')
    )),
    true,
  );
  const outputContract = preflightParts.nativeShapePlanOutputContractForAttempt('author_pptx_native', feedback);
  const serialized = JSON.stringify(outputContract);
  assert.equal(['sample_decision_proof_split', 'native_shape_plan_structural_retry_contract', 'selected_archetype', 'required_height_in'].every((needle) => serialized.includes(needle)), true);
});

test('native PPT retry feedback turns normalization failures into structural retry fixes', () => {
  const preflightParts = createNativePptPlanPreflightParts({
    nativeShapePlanOutputContract: () => ({ editable_shape_plan: {} }),
    safeArray: (value) => (Array.isArray(value) ? value : []),
    safeText: (value, fallback = '') => String(value || fallback || '').trim(),
  });
  const feedback = preflightParts.buildNativeValidationFeedback({
    validation: {
      payload: {
        ok: false,
        stage: 'normalize_slide_data',
        failures: [
          {
            reason: 'ai_first_design_spec_lock_missing',
            missing_fields: [
              'borrowed_principles.template_profile',
              'borrowed_principles.semantic_layout_selection',
              'borrowed_principles.reference_deck_analysis',
              'professional_design_brief.design_register',
            ],
          },
          {
            reason: 'ai_first_template_layout_grammar_missing',
            grammar_failures: [{
              reason: 'ai_first_template_layout_archetype_catalog_too_few',
              actual: 2,
              minimum: 3,
            }],
          },
        ],
      },
    },
    attemptIndex: 2,
    attemptArtifactRefs: ['attempt-02-validation.json'],
  });
  const designFix = feedback.required_structural_fixes
    .find((fix) => fix.reason === 'ai_first_design_spec_lock_missing');
  assert.equal(designFix.scope, 'deck');
  assert.equal(
    designFix.missing_fields.includes('editable_shape_plan.design_spec_lock.borrowed_principles.template_profile'),
    true,
  );
  assert.equal(
    designFix.missing_fields.includes('editable_shape_plan.design_spec_lock.professional_design_brief.design_register'),
    true,
  );
  assert.match(designFix.repair_instruction, /template_profile/);
  const grammarFix = feedback.required_structural_fixes
    .find((fix) => fix.reason === 'ai_first_template_layout_grammar_missing');
  assert.equal(grammarFix.scope, 'deck');
  assert.equal(
    grammarFix.required_fields.includes('template_layout_grammar.archetype_catalog>=3 or compact sample mode with exactly the two sample archetypes'),
    true,
  );
  assert.equal(
    grammarFix.required_fields.includes('template_layout_grammar.reference_discipline.action_title_required=true'),
    true,
  );
  const outputContract = preflightParts.nativeShapePlanOutputContractForAttempt('author_pptx_native', feedback);
  const serialized = JSON.stringify(outputContract);
  assert.equal(serialized.includes('borrowed_principles.template_profile'), true);
  assert.equal(serialized.includes('editable_shape_plan.template_layout_grammar.reference_discipline'), true);
  assert.equal(serialized.includes('compact sample mode'), true);
  assert.equal(serialized.includes('native_shape_plan_structural_retry_contract'), true);
});

test('native PPT structural retry contract preserves template grammar and requires canonical bounds schema', () => {
  const preflightParts = createNativePptPlanPreflightParts({
    nativeShapePlanOutputContract: () => ({ editable_shape_plan: {} }),
    safeArray: (value) => (Array.isArray(value) ? value : []),
    safeText: (value, fallback = '') => String(value || fallback || '').trim(),
  });
  const feedback = {
    previous_attempt: 2,
    required_structural_fixes: [{
      scope: 'slide',
      slide_id: 'S01',
      reason: 'native_shape_plan_structural_fields_missing',
      missing_fields: [
        'native_shapes[S01-title].bounds_schema_error',
      ],
      required_fields: [
        'template_layout_binding.zones[].bounds.left_in',
        'native_shapes[].bounds.left_in',
      ],
      invalid_template_zones: [{
        zone_id: 'title_zone',
        invalid_fields: ['bounds', 'bounds_schema_error'],
        actual_bounds_keys: ['x', 'y', 'w', 'h'],
        forbidden_bounds_keys: ['x', 'y', 'w', 'h'],
      }],
      invalid_shapes: [{
        shape_id: 'S01-title',
        bounds_schema_error: true,
        actual_bounds_keys: ['x', 'y', 'w', 'h'],
        forbidden_bounds_keys: ['x', 'y', 'w', 'h'],
      }],
      repair_instruction: 'Replace alias bounds with canonical bounds.',
    }],
    passed_structure_preservation_contract: {
      preserve_fields: [
        'editable_shape_plan.template_layout_grammar',
        'editable_shape_plan.slides[].template_layout_binding',
      ],
    },
  };
  const outputContract = preflightParts.nativeShapePlanOutputContractForAttempt('author_pptx_native', feedback);
  const structural = outputContract.native_shape_plan_structural_retry_contract;
  assert.equal(structural.canonical_bounds_schema.required_object, '{ left_in, top_in, width_in, height_in }');
  assert.deepEqual(
    structural.canonical_bounds_schema.forbidden_alias_keys.slice(0, 4),
    ['x', 'y', 'w', 'h'],
  );
  assert.match(structural.instruction, /Preserve the complete already accepted structure/);
  assert.match(structural.instruction, /Do not use x\/y\/w\/h/);
  assert.equal(
    outputContract.editable_shape_plan.structural_retry_contract.canonical_bounds_schema
      .canonical_keys.includes('left_in'),
    true,
  );
  assert.match(
    outputContract.editable_shape_plan.structural_retry_contract.structure_preservation_rule,
    /template_layout_grammar/,
  );
  assert.equal(
    structural.required_structural_fixes[0].invalid_template_zones[0].forbidden_bounds_keys.includes('w'),
    true,
  );
  assert.equal(
    structural.required_structural_fixes[0].invalid_shapes[0].bounds_schema_error,
    true,
  );
});

test('native PPT AI shape plan records template layout grammar and per-slide zone bindings', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-template-layout-');
    const deliverableId = 'deck-template-layout-grammar';
    await runNativePlanningChain({ workspaceRoot, deliverableId });

    const authorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
      route: 'author_pptx_native',
    });
    assert.equal(authorResult.ok, true, String(authorResult.error?.message || authorResult.error || 'native sample authoring failed'));
    const authored = readJson(authorResult.artifactFile);
    const editableShapePlan = readJson(authored.native_ppt_bundle.editable_shape_plan_file);

    assert.equal(editableShapePlan.deck_layout_rhythm_plan?.owner, 'llm_agent');
    assert.equal(editableShapePlan.deck_layout_rhythm_plan?.required, true);
    assert.equal(editableShapePlan.deck_layout_rhythm_plan?.slides.length, editableShapePlan.slides.length);
    assert.equal(
      editableShapePlan.deck_layout_rhythm_plan.slides.every((slide) => (
        typeof slide.rhetorical_role === 'string'
        && typeof slide.selected_archetype === 'string'
        && typeof slide.primary_grid === 'string'
        && typeof slide.composition_signature_budget === 'string'
        && typeof slide.proof_object === 'string'
      )),
      true,
    );
    assert.equal(editableShapePlan.template_layout_grammar?.owner, 'llm_agent');
    assert.equal(editableShapePlan.template_layout_grammar?.required, true);
    assert.equal(editableShapePlan.template_layout_grammar?.materializer_role, 'execute_selected_archetype_zones_only');
    assert.equal(editableShapePlan.template_layout_grammar?.helper_template_layout_allowed, false);
    assert.equal(editableShapePlan.template_layout_grammar?.reference_discipline?.template_profile_required, true);
    assert.equal(editableShapePlan.template_layout_grammar?.reference_discipline?.semantic_layout_selection_required, true);
    assert.equal(editableShapePlan.template_layout_grammar?.reference_discipline?.placeholder_capacity_required, true);
    assert.equal(editableShapePlan.template_layout_grammar?.reference_discipline?.reference_deck_analysis_required, true);
    assert.equal(editableShapePlan.template_layout_grammar?.reference_discipline?.action_title_required, true);
    assert.equal(
      ['ppt-master', 'PPTAgent', 'officecli-pptx', 'presenton', 'ppt-agent-skills']
        .every((project) => editableShapePlan.template_layout_grammar.reference_discipline.source_projects.includes(project)),
      true,
    );
    assert.equal(editableShapePlan.template_layout_grammar?.archetype_catalog.length >= 5, true);
    assert.equal(
      editableShapePlan.template_layout_grammar.archetype_catalog
        .every((archetype) => (
          typeof archetype.use_when === 'string'
          && typeof archetype.layout_description === 'string'
          && Array.isArray(archetype.required_zones)
          && archetype.required_zones.length >= 3
          && Array.isArray(archetype.prohibited)
          && archetype.prohibited.length >= 1
          && Array.isArray(archetype.content_schema?.required_shape_roles)
          && archetype.content_schema.required_shape_roles.length >= 1
          && Array.isArray(archetype.content_schema?.required_shape_role_groups)
          && archetype.content_schema.required_shape_role_groups.length >= 1
        )),
      true,
    );
    assert.equal(
      editableShapePlan.template_layout_grammar.archetype_catalog
        .some((archetype) => archetype.archetype_id === 'professional_system_map'),
      true,
    );
    editableShapePlan.slides.forEach(assertTemplateLayoutBinding);
  });
});

test('native PPT AI shape plan rejects missing deck-level layout rhythm before materialization', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-missing-rhythm-');
    await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-missing-layout-rhythm' });
    const restoreRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'remove_deck_layout_rhythm_plan',
    });
    try {
      const nativeResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-missing-layout-rhythm',
        route: 'author_pptx_native',
      });
      assert.equal(nativeResult.ok, false);
      assert.match(
        String(nativeResult.error?.message || nativeResult.error || ''),
        /deck_layout_rhythm_plan/i,
      );
    } finally {
      restoreRoute();
    }
  });
});

test('native PPT AI shape plan rejects repeated deck layout rhythm before officecli materialization', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-repeated-rhythm-');
    await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-repeated-layout-rhythm' });
    const restoreRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'repeat_native_deck_layout_rhythm',
    });
    try {
      const nativeResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-repeated-layout-rhythm',
        route: 'author_pptx_native',
      });
      assert.equal(nativeResult.ok, false);
      assert.match(
        String(nativeResult.error?.message || nativeResult.error || ''),
        /deck-level layout rhythm|consecutive_selected_archetype|distinct_composition/i,
      );
    } finally {
      restoreRoute();
    }
  });
});

test('native PPT AI shape plan retries missing template layout grammar before materialization', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-missing-layout-grammar-');
    await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-missing-layout-grammar' });
    const restoreRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'remove_template_layout_grammar',
    });
    try {
      const nativeResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-missing-layout-grammar',
        route: 'author_pptx_native',
      });
      assert.equal(nativeResult.ok, true);
      const authored = readJson(nativeResult.artifactFile);
      assert.equal(authored.native_ppt_bundle.ai_first_shape_plan_preflight.attempts, 2);
      assert.equal(authored.native_ppt_bundle.ai_first_shape_plan_preflight.self_repair_used, true);
      assert.equal(
        authored.native_ppt_bundle.ai_first_shape_plan_preflight.attempt_artifact_refs
          .some((file) => file.includes('plan-validation-input-attempt-01-structural-validation.json')),
        true,
      );
      const editableShapePlan = readJson(authored.native_ppt_bundle.editable_shape_plan_file);
      editableShapePlan.slides.forEach(assertTemplateLayoutBinding);
    } finally {
      restoreRoute();
    }
  });
});

test('native PPT AI shape plan retries missing design spec lock motif before materialization', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-missing-motif-');
    const deliverableId = 'deck-missing-design-motif';
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
    const restoreRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'drop_design_spec_lock_motif_once',
    });
    try {
      const nativeResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId,
        route: 'author_pptx_native',
      });
      assert.equal(nativeResult.ok, true);
      const authored = readJson(nativeResult.artifactFile);
      const preflight = authored.native_ppt_bundle.ai_first_shape_plan_preflight;
      assert.equal(preflight.attempts, 2);
      assert.equal(preflight.self_repair_used, true);
      const structuralRefs = preflight.attempt_artifact_refs
        .filter((file) => file.endsWith('-structural-validation.json'));
      assert.equal(structuralRefs.length >= 1, true);
      const firstFeedback = readJson(structuralRefs[0]);
      assert.equal(firstFeedback.validator.reason, 'native_shape_plan_design_spec_lock_missing_fields');
      assert.equal(
        firstFeedback.required_structural_fixes
          .some((fix) => fix.missing_fields.includes('editable_shape_plan.design_spec_lock.motif')),
        true,
      );
      const contract = authored.native_ppt_bundle.ai_first_shape_plan_output_contract?.editable_shape_plan || {};
      assert.equal(contract.design_spec_lock.motif, '<one sample visual motif used without title underlines>');
      assert.equal(contract.design_spec_lock.professional_design_brief.design_register, 'executive proof board');
      const editableShapePlan = readJson(authored.native_ppt_bundle.editable_shape_plan_file);
      assert.equal(typeof editableShapePlan.design_spec_lock.motif, 'string');
      assert.notEqual(editableShapePlan.design_spec_lock.motif.trim(), '');
    } finally {
      restoreRoute();
    }
  });
});

test('native PPT AI shape plan records structural-failure candidates for live blocker audit', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-structural-candidate-');
    const deliverableId = 'deck-structural-candidate';
    await runNativePlanningChain({ workspaceRoot, deliverableId });
    const restoreRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'always_remove_template_layout_binding',
      REDCUBE_NATIVE_PPT_PLAN_MAX_ATTEMPTS: '2',
    });
    try {
      const nativeResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId,
        route: 'author_pptx_native',
      });
      assert.equal(nativeResult.ok, false);
      assert.match(
        String(nativeResult.error?.message || nativeResult.error || ''),
        /template_layout_binding/i,
      );
      const candidateRefs = nativeResult.run.artifact_refs
        .filter((file) => file.includes('plan-validation-input-attempt-') && file.endsWith('-candidate.json'));
      assert.equal(candidateRefs.length >= 1, true);
      const firstCandidate = readJson(candidateRefs[0]);
      assert.equal(Boolean(firstCandidate.editable_shape_plan), true);
      assert.equal(firstCandidate.editable_shape_plan.slides.some((slide) => !slide.template_layout_binding), true);
      const structuralRefs = nativeResult.run.artifact_refs
        .filter((file) => file.endsWith('-structural-validation.json'));
      assert.equal(structuralRefs.length >= 1, true);
      const firstFeedback = readJson(structuralRefs[0]);
      assert.equal(
        firstFeedback.required_structural_fixes
          .some((fix) => fix.missing_fields.includes('template_layout_binding')),
        true,
      );
    } finally {
      restoreRoute();
    }
  });
});

test('native PPT AI shape plan reports invalid template zones separately from missing binding', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-invalid-zone-');
    const deliverableId = 'deck-invalid-zone';
    await runNativePlanningChain({ workspaceRoot, deliverableId });
    const restoreRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'always_invalid_template_zone_safe_inset',
      REDCUBE_NATIVE_PPT_PLAN_MAX_ATTEMPTS: '2',
    });
    try {
      const nativeResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId,
        route: 'author_pptx_native',
      });
      assert.equal(nativeResult.ok, false);
      const structuralRefs = nativeResult.run.artifact_refs
        .filter((file) => file.endsWith('-structural-validation.json'));
      assert.equal(structuralRefs.length >= 1, true);
      const firstFeedback = readJson(structuralRefs[0]);
      const invalidZoneFix = firstFeedback.required_structural_fixes
        .find((fix) => fix.reason === 'native_shape_plan_template_layout_binding_invalid');
      assert.equal(Boolean(invalidZoneFix), true);
      assert.equal(
        invalidZoneFix.missing_fields.includes('template_layout_binding'),
        false,
      );
      assert.equal(
        invalidZoneFix.invalid_template_zones
          .some((zone) => (
            zone.zone_id === 'title_zone'
            && zone.invalid_fields.includes('safe_inset_in')
            && zone.required_fields.includes('safe_inset_in>=0.15')
          )),
        true,
      );
    } finally {
      restoreRoute();
    }
  });
});

test('native PPT AI shape plan reports x/y/w/h bounds aliases as schema errors before materialization', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-alias-bounds-');
    const deliverableId = 'deck-alias-bounds';
    await runNativePlanningChain({ workspaceRoot, deliverableId });
    const restoreRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'always_alias_template_and_shape_bounds',
      REDCUBE_NATIVE_PPT_PLAN_MAX_ATTEMPTS: '1',
    });
    try {
      const nativeResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId,
        route: 'author_pptx_native',
      });
      assert.equal(nativeResult.ok, false);
      const structuralRefs = nativeResult.run.artifact_refs
        .filter((file) => file.endsWith('-structural-validation.json'));
      assert.equal(structuralRefs.length >= 1, true);
      const firstFeedback = readJson(structuralRefs[0]);
      const invalidZone = firstFeedback.required_structural_fixes
        .flatMap((fix) => fix.invalid_template_zones || [])
        .find((zone) => (zone.invalid_fields || []).includes('bounds_schema_error'));
      assert.equal(Boolean(invalidZone), true);
      assert.deepEqual(invalidZone.forbidden_bounds_keys.slice(0, 4), ['x', 'y', 'w', 'h']);
      assert.match(invalidZone.bounds_contract.instruction, /left_in/);
      const invalidShape = firstFeedback.required_structural_fixes
        .flatMap((fix) => fix.invalid_shapes || [])
        .find((shape) => shape.bounds_schema_error === true);
      assert.equal(Boolean(invalidShape), true);
      assert.equal(invalidShape.actual_bounds_keys.includes('x'), true);
      assert.equal(
        firstFeedback.required_structural_fixes
          .some((fix) => fix.missing_fields.some((field) => field.includes('bounds_schema_error'))),
        true,
      );
      assert.match(firstFeedback.required_structural_fixes[0].repair_instruction, /x\/y\/w\/h/);
    } finally {
      restoreRoute();
    }
  });
});
