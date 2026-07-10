// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { getDeliverablePaths } from '@redcube/runtime-protocol';

import { mkUserScopedTestWorkspace } from './helpers/test-workspace.ts';
import {
  readJson,
  runNativePlanningChain,
  withMockNativePptRuntime,
} from './helpers/ppt-native-ppt-runtime-fixtures.ts';
import { buildOplRouteAttemptIndexForTest } from './helpers/route-attempt-test-api.ts';
import { invokeProductEntry } from './product-domain-action-test-api.ts';
import { createNativePptPlanPreflightParts } from '../packages/redcube-runtime/dist/families/ppt/ppt-deck-runtime-family-parts/native-ppt-plan-preflight.js';
import { createNativePptShapePlanNormalizeParts } from '../packages/redcube-runtime/dist/families/ppt/ppt-deck-runtime-family-parts/native-ppt-shape-plan-normalize.js';
import {
  createNativePptSampleAuthoringParts,
  nativePptSampleLayoutProfile,
} from '../packages/redcube-runtime/dist/families/ppt/ppt-deck-runtime-family-parts/native-ppt-sample-authoring.js';
import { buildNativeSampleShapePlanOutputContract } from '../packages/redcube-runtime/dist/families/ppt/ppt-deck-runtime-family-parts/native-ppt-shape-plan-contract.js';

const safeArray = (value) => (Array.isArray(value) ? value : []);
const safeText = (value, fallback = '') => String(value || fallback || '').trim();

function assertTemplateLayoutBinding(slide) {
  const binding = slide.template_layout_binding || {};
  const zones = Array.isArray(binding.zones) ? binding.zones : [];
  const zoneIds = new Set(zones.map((zone) => zone.zone_id));
  assert.equal(typeof binding.selected_archetype, 'string');
  assert.equal(zones.length >= 3, true);
  assert.equal(zones.every((zone) => Number(zone.bounds?.width_in) > 0 && Number(zone.bounds?.height_in) > 0), true);
  assert.equal(slide.native_shapes.every((shape) => (
    shape.quality_role === 'decorative'
    || ['page_number', 'page_no', 'footer', 'cover_meta'].includes(shape.role)
    || zoneIds.has(shape.layout_zone_id)
  )), true);
}

test('native PPT compact sample contract keeps AI-owned safe-zone and capacity boundaries', () => {
  const sampleProfile = nativePptSampleLayoutProfile({
    delivery_request: { constraints: { native_visual_sample: true, expected_slide_count: 1 } },
  });
  const contract = buildNativeSampleShapePlanOutputContract({
    aiFirstEditingContract: { owner: 'llm_agent' },
    route: 'author_pptx_native',
    sampleProfile,
  }).editable_shape_plan;
  const grammar = contract.template_layout_grammar;
  const sampleStatus = grammar.archetype_catalog.find(
    (archetype) => archetype.archetype_id === 'sample_status_proof_board',
  );
  assert.deepEqual(
    {
      required: contract.professional_design_pack_contract.required,
      owner: contract.professional_design_pack_contract.creative_owner,
      materializerCanSelectLayout: contract.professional_design_pack_contract.materializer_can_select_layout,
    },
    { required: true, owner: 'llm_agent', materializerCanSelectLayout: false },
  );
  assert.equal(contract.sample_capacity_contract.safe_zone_blueprints_required_before_coordinates, true);
  assert.match(grammar.safe_zone_blueprints.tuple_contract, /sample_status_proof_board/);
  assert.match(grammar.safe_zone_blueprints.tuple_contract, /proof_zone:proof/);
  assert.match(grammar.safe_zone_blueprints.tuple_contract, /kind=connector/);
  assert.deepEqual(grammar.native_shape_style_schema.required_text_fields, ['editable_text', 'font_size']);
  assert.deepEqual(
    {
      statusZoneHeight: sampleStatus.content_schema.status_zone_height_in_min,
      pointTextChars: sampleStatus.content_schema.status_card_point_text_min_cjk_chars,
      inputHubWidth: sampleStatus.content_schema.input_hub_width_in_min,
      connectorThickness: sampleStatus.content_schema.connector_thickness_in_min,
      horizontalBusAllowed: sampleStatus.content_schema.horizontal_connector_bus_allowed,
    },
    { statusZoneHeight: 3.45, pointTextChars: 12, inputHubWidth: 10.4, connectorThickness: 0.03, horizontalBusAllowed: false },
  );
  assert.deepEqual(sampleProfile.capacity_rules.title_font_pt_range, [40, 44]);
  assert.equal(sampleProfile.capacity_rules.input_hub_card_flow_geometry_required, true);
  assert.equal(sampleProfile.capacity_rules.connector_direction_required, true);
  assert.match(sampleProfile.safe_zone_blueprints.tuple_contract, /no_horizontal_bus/);
});

test('native PPT compact retry carries canonical exact and structural fixes without validator bloat', () => {
  const sampleProfile = nativePptSampleLayoutProfile({
    delivery_request: { constraints: { native_visual_sample: true, expected_slide_count: 1 } },
  });
  const baseContract = buildNativeSampleShapePlanOutputContract({
    aiFirstEditingContract: { owner: 'llm_agent' },
    route: 'author_pptx_native',
    sampleProfile,
  });
  const preflight = createNativePptPlanPreflightParts({
    nativeShapePlanOutputContract: () => baseContract,
    safeArray,
    safeText,
  });
  const validationFeedback = preflight.buildNativeValidationFeedback({
    validation: {
      payload: {
        ok: false,
        stage: 'ai_first_shape_plan_preflight',
        failure_count: 2,
        slide_count: 1,
        failures: [{
          slide_id: 'S01',
          failures: [
            {
              reason: 'ai_first_text_box_height_below_readability_floor',
              shape_id: 'S01_input_label',
              height_in: 0.52,
              minimum_height_in: 0.54,
            },
            { reason: 'ai_first_page_number_missing' },
          ],
        }],
        omitted_debug_blob: 'x'.repeat(12000),
      },
    },
    attemptIndex: 1,
    attemptArtifactRefs: ['attempt-01-validation.json'],
  });
  const sampleParts = createNativePptSampleAuthoringParts({
    aiFirstEditingContract: { owner: 'llm_agent' },
    safeArray,
    safeText,
  });
  const context = sampleParts.compactNativeSampleContext({
    contract: { delivery_request: { constraints: { native_visual_sample: true, expected_slide_count: 1 } } },
    baseAuthoringContext: { goal: 'make an editable visual sample' },
    blueprintArtifact: { slide_blueprint: { slides: [{ slide_id: 'S01', title: 'One slide' }] } },
    visualArtifact: { visual_direction: { design_thesis: 'clear proof board' } },
    unitRepairScope: { target_slide_ids: ['S01'] },
    repairFeedback: [],
    validationFeedback,
    attemptIndex: 2,
  });
  const compactFeedback = context.native_shape_plan_validation_feedback;
  const requiredHeight = validationFeedback.required_shape_fixes[0].required_height_in;
  assert.equal(compactFeedback.feedback_kind, 'native_pptx_compact_sample_retry_feedback_v1');
  assert.equal(compactFeedback.validator.full_validator_payload_omitted, true);
  assert.equal(requiredHeight > 0.54, true);
  assert.equal(compactFeedback.required_shape_fixes[0].required_height_in, requiredHeight);
  assert.equal(compactFeedback.required_structural_fixes[0].reason, 'ai_first_page_number_missing');
  assert.equal(JSON.stringify(compactFeedback).includes('omitted_debug_blob'), false);

  const retryContract = preflight.nativeShapePlanOutputContractForAttempt(
    'author_pptx_native',
    validationFeedback,
    baseContract,
  );
  assert.equal(
    retryContract.native_shape_plan_validation_feedback_contract.contract_kind,
    'native_pptx_compact_sample_retry_exact_fixes_v1',
  );
  assert.equal(retryContract.native_shape_plan_validation_feedback_contract.exact_shape_fixes[0].shape_id, 'S01_input_label');
  assert.equal(
    retryContract.native_shape_plan_structural_retry_contract.contract_kind,
    'native_pptx_compact_sample_structural_retry_v1',
  );
  assert.equal(retryContract.editable_shape_plan.validation_retry_contract.required, true);
});

test('native PPT compact structural retry repairs an incomplete archetype catalog in place', () => {
  const normalize = createNativePptShapePlanNormalizeParts({ safeArray, safeText });
  const feedback = normalize.structuralFeedbackFromPlanError({
    route: 'author_pptx_native',
    error: new Error(
      'Native PPT author_pptx_native requires editable_shape_plan.template_layout_grammar with llm_agent owner, archetype catalog, and execute-selected-zones materializer boundary: '
      + JSON.stringify([{
        reason: 'template_layout_grammar.archetype_catalog_count',
        actual: 1,
        minimum: 2,
        required_archetype_ids: ['sample_status_proof_board', 'sample_decision_proof_split'],
      }]),
    ),
    attemptIndex: 2,
    attemptArtifactRefs: ['attempt-02-structural-validation.json'],
  });
  const fix = feedback.required_structural_fixes[0];
  assert.equal(fix.reason, 'native_shape_plan_template_layout_grammar_missing');
  assert.equal(fix.grammar_failures[0].reason, 'template_layout_grammar.archetype_catalog_count');
  assert.match(fix.repair_instruction, /Repair the existing AI-authored template_layout_grammar/);
  assert.match(fix.repair_instruction, /sample_decision_proof_split/);
});

test('native PPT product-entry enters compact visual sample authoring with AI shape-plan authority', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-sample-compact-');
    const deliverableId = 'deck-sample-compact-invocation';
    await runNativePlanningChain({ workspaceRoot, deliverableId });
    const productEntry = await invokeProductEntry({
      workspace_locator: { workspace_root: workspaceRoot },
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
        constraints: { native_visual_sample: true, expected_slide_count: 1, max_slides: 1 },
        cross_provider_attempt_index: buildOplRouteAttemptIndexForTest({
          route: 'author_pptx_native',
          runId: `${deliverableId}/author_pptx_native`,
          topicId: 'topic-a',
          deliverableId,
        }),
      },
    });
    const authorResult = productEntry.domain_entry_surface.result_surface;
    assert.equal(authorResult.ok, true);
    const deliverablePaths = getDeliverablePaths(workspaceRoot, 'topic-a', deliverableId);
    const hydratedContract = readJson(path.join(deliverablePaths.deliverableDir, 'contracts/hydrated-deliverable.json'));
    assert.equal(hydratedContract.delivery_request.constraints.native_visual_sample, true);
    const authored = readJson(authorResult.artifactFile);
    const runtime = authored.creative_execution.generation_runtime;
    assert.equal(runtime.native_ppt_compact_sample_invocation, true);
    assert.equal(runtime.prompt_pack_file, 'prompts/ppt_deck/author_pptx_native_sample.md');
    assert.deepEqual(runtime.slide_scope.slide_ids, ['S01']);
    assert.equal(runtime.context_bytes < 16000, true, `context_bytes=${runtime.context_bytes}`);

    const contract = authored.native_ppt_bundle.ai_first_shape_plan_output_contract.editable_shape_plan;
    assert.equal(contract.authoring_mode, 'native_visual_sample_compact');
    assert.equal(contract.structural_contract.ai_authoring_owner, 'llm_agent');
    assert.equal(contract.materializer.helper_template_layout_allowed, false);
    assert.deepEqual(
      contract.template_layout_grammar.archetype_catalog.map((archetype) => archetype.archetype_id),
      ['sample_status_proof_board', 'sample_decision_proof_split'],
    );
    const editableShapePlan = readJson(authored.native_ppt_bundle.editable_shape_plan_file);
    assert.equal(editableShapePlan.slides.length, 1);
    assert.equal(editableShapePlan.design_spec_lock.owner, 'llm_agent');
    assertTemplateLayoutBinding(editableShapePlan.slides[0]);
  });
});
