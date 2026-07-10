// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';

import { mkUserScopedTestWorkspace } from './helpers/test-workspace.ts';
import {
  patchDeliverableConstraints,
  readJson,
  runNativePlanningChain,
  withMockNativePptRuntime,
} from './helpers/ppt-native-ppt-runtime-fixtures.ts';
import { runDeliverableRoute } from './product-domain-action-test-api.ts';
import { nativePptSampleLayoutProfile } from '../packages/redcube-runtime/dist/families/ppt/ppt-deck-runtime-family-parts/native-ppt-sample-authoring.js';
import { buildNativeSampleShapePlanOutputContract } from '../packages/redcube-runtime/dist/families/ppt/ppt-deck-runtime-family-parts/native-ppt-shape-plan-contract.js';

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

test('native PPT one-slide visual sample uses compact Codex invocation with AI shape-plan authority', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-sample-compact-');
    const deliverableId = 'deck-sample-compact-invocation';
    await runNativePlanningChain({ workspaceRoot, deliverableId });
    patchDeliverableConstraints({
      workspaceRoot,
      deliverableId,
      constraints: { native_visual_sample: true, expected_slide_count: 1, max_slides: 1 },
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
