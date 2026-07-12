import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { existsSync, readFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  createDeliverable,
  runDeliverableRoute,
} from './product-domain-action-test-api.js';
import { withEnv, withMockCodexRuntime } from './mock-codex-cli.js';
import { mkUserScopedTestWorkspace } from './helpers/test-workspace.js';

const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  fileURLToPath(new URL('./helpers/mock-redcube-python-with-playwright.js', import.meta.url)),
]);
const QUALITY_CONTRACT_REF = 'contracts/runtime-program/ppt-native-pptx-quality-nonregression.json';
const DESIGN_PACK_CONTRACT_REF = 'contracts/runtime-program/ppt-native-ai-first-design-pack.json';
const PRESERVED_GATES = ['visual_director_review', 'screenshot_review', 'export_pptx'];
const NATIVE_ROUTES = ['author_pptx_native', 'repair_pptx_native'];

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

function assertRefsOnly(value, label) {
  assert.equal(value?.refs_only, true, `${label}.refs_only`);
  assert.equal(value?.read_only, true, `${label}.read_only`);
  assert.equal(value?.body_included, false, `${label}.body_included`);
}

function assertIncludesAll(values, required, label) {
  for (const item of required) {
    assert.equal(values.includes(item), true, `${label}: ${item}`);
  }
}

function assertNoVerdictAuthority(authority) {
  for (const key of [
    'opl_agent_lab_score_is_rca_visual_verdict',
    'opl_agent_lab_can_write_rca_visual_truth',
    'opl_agent_lab_can_write_artifact_blob',
    'opl_agent_lab_can_write_memory_body',
    'opl_agent_lab_can_authorize_quality_verdict',
    'opl_agent_lab_can_authorize_exportable',
    'opl_agent_lab_can_claim_visual_ready',
    'python_helper_can_replace_ai_creative_owner',
    'officecli_skill_can_replace_rca_workflow',
    'officecli_validate_can_replace_true_render_proof',
    'officecli_authoring_loop_adopted',
    'default_executor_changed',
  ]) {
    assert.equal(authority[key], false, key);
  }
}

function assertOfficecliPolicy(policy) {
  assert.equal(policy.policy_id, 'ppt_native_officecli_materializer_quality_gate_v1');
  assert.equal(policy.rca_main_workflow_owner, 'redcube_stage_review_export');
  assert.equal(policy.current_pptx_writer, 'officecli_pptx_materializer');
  assertIncludesAll(policy.required_gate_refs, [
    'officecli_save_before_close',
    'officecli_validate',
    'officecli_view_issues',
    'officecli_view_text',
  ], 'officecli.required_gate_refs');
  assert.equal(policy.true_render_proof_substitute_allowed, false);
  assert.equal(policy.default_executor_changed, false);
}

function assertQualityContract(contract) {
  assert.equal(contract.surface_kind, 'ppt_native_pptx_quality_nonregression');
  assert.equal(contract.owner, 'redcube_ai');
  assert.equal(contract.consumer, 'opl_agent_lab');
  assertRefsOnly(contract, 'contract');
  assert.equal(contract.professional_design_pack_contract_ref, DESIGN_PACK_CONTRACT_REF);
  assert.equal(contract.route_policy.default_visual_route, 'author_image_pages');
  assert.deepEqual(contract.route_policy.runnable_native_routes, NATIVE_ROUTES);
  assert.deepEqual(contract.route_policy.preserved_review_export_gates, PRESERVED_GATES);
  assert.equal(contract.agent_lab_suite_input.agent_lab_score_is_rca_visual_verdict, false);
  assert.equal(contract.agent_lab_suite_input.claims_visual_ready, false);

  assertIncludesAll(contract.shape_manifest_contract.required_per_slide_metrics, [
    'bounds',
    'occupied_ratio',
    'overlap_pairs',
    'structural_text_collision_count',
    'slot_fill_ok',
    'content_depth_ok',
    'grid_balance_ok',
    'panel_text_safe_area_ok',
    'composition_signature',
    'preview_screenshot_sha256',
  ], 'shape_manifest.required_per_slide_metrics');
  assert.equal(contract.shape_manifest_contract.quality_debt_when_missing, true);
  assert.match(contract.shape_manifest_contract.review_behavior, /block ready claims but not stage transition/);
  assert.equal(contract.editable_shape_plan_contract.creative_owner, 'llm_agent');
  assert.equal(contract.editable_shape_plan_contract.python_helper_role, 'execute_validate_export_only');
  assert.equal(contract.editable_shape_plan_contract.template_substitution_allowed, false);
  assertIncludesAll(contract.editable_shape_plan_contract.required_design_pack_sections, [
    'layout_archetype_taxonomy',
    'capacity_budgets',
    'connector_semantics',
    'layout_rhythm',
    'reference_discipline',
  ], 'editable_shape_plan.required_design_pack_sections');
  assert.equal(contract.professional_design_pack_contract.materializer_can_select_layout, false);
  assert.equal(contract.visual_sample_claim_boundary.display_test_double_as_native_ppt_visual_sample_allowed, false);
  assert.equal(contract.true_render_proof.required, true);
  assert.equal(contract.true_render_proof.synthetic_preview_allowed, false);
  assert.equal(contract.true_render_proof.renderer_pipeline, 'libreoffice_headless_pdf_png_v1');
  assert.equal(contract.repair_policy.blocked_page_only, true);
  assertOfficecliPolicy(contract.officecli_materializer_policy);
  assertNoVerdictAuthority(contract.authority_boundary);
}

function assertDesignPack(contract) {
  assert.equal(contract.surface_kind, 'ppt_native_ai_first_design_pack');
  assert.equal(contract.owner, 'redcube_ai');
  assert.equal(contract.claims_visual_ready, false);
  assert.equal(contract.design_pack_boundary.creative_owner, 'llm_agent');
  assert.equal(contract.design_pack_boundary.helper_template_layout_allowed, false);
  assert.equal(contract.design_pack_boundary.helper_can_select_layout_archetype, false);
  const archetypeIds = contract.layout_archetype_taxonomy.archetype_catalog.map((entry) => entry.archetype_id);
  assertIncludesAll(archetypeIds, [
    'professional_system_map',
    'executive_status_board',
    'sample_status_proof_board',
    'sample_decision_proof_split',
  ], 'design_pack.archetypes');
  assert.equal(contract.connector_semantics.connector_crosses_readable_text_allowed, false);
  assert.equal(contract.layout_rhythm.no_three_consecutive_same_archetype, true);
  assert.equal(contract.reference_discipline.runtime_dependency_adoption_allowed, false);
}

async function runNativeAuthoring(workspaceRoot) {
  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-native-quality',
    deliverableId: 'deck-native-quality',
    title: 'Native PPTX quality nonregression deck',
    goal: '验证 native editable PPTX 质量非回归 surface',
  });
  for (const route of ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'author_pptx_native']) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-native-quality',
      deliverableId: 'deck-native-quality',
      route,
    });
    assert.equal(result.ok, true, route);
    if (route === 'author_pptx_native') return readJson(result.artifactFile);
  }
}

test('native PPTX quality non-regression contract is refs-only and non-authoritative', () => {
  const contract = readJson(QUALITY_CONTRACT_REF);
  assertQualityContract(contract);
  assertDesignPack(readJson(DESIGN_PACK_CONTRACT_REF));

  const proofLane = readJson('contracts/runtime-program/ppt-native-authoring-proof-lane.json');
  const engineContract = readJson('contracts/runtime-program/ppt-native-python-engine-contract.json');
  assert.equal(proofLane.professional_design_pack_contract_ref, DESIGN_PACK_CONTRACT_REF);
  assert.equal(engineContract.professional_design_pack_contract_ref, DESIGN_PACK_CONTRACT_REF);
  assert.deepEqual(contract.route_policy.preserved_review_export_gates, proofLane.scope.preserved_gate_routes);
  assert.deepEqual(
    contract.shape_manifest_contract.required_per_slide_metrics,
    engineContract.native_ppt_quality_surface.required_per_slide_metrics,
  );
  assertOfficecliPolicy(engineContract.officecli_materializer_policy);
});

test('native PPTX authoring artifact exposes refs without visual verdict authority', async () => {
  const restoreEnv = withEnv({ REDCUBE_PYTHON_COMMAND: MOCK_REDCUBE_PYTHON_COMMAND });
  try {
    await withMockCodexRuntime(async () => {
      const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-pptx-quality-nonregression-');
      const artifact = await runNativeAuthoring(workspaceRoot);
      const readModel = artifact.native_quality_nonregression_read_model;

      assert.equal(readModel.surface_kind, 'ppt_native_pptx_quality_nonregression_read_model');
      assertRefsOnly(readModel, 'readModel');
      assert.equal(readModel.contract_ref, QUALITY_CONTRACT_REF);
      assert.equal(readModel.route, 'author_pptx_native');
      assert.equal(readModel.agent_lab_suite_input.agent_lab_score_is_rca_visual_verdict, false);
      assert.equal(readModel.agent_lab_suite_input.claims_visual_ready, false);
      assert.equal(readModel.true_render_proof_ref.renderer_pipeline, 'libreoffice_headless_pdf_png_v1');
      assertOfficecliPolicy(readModel.officecli_quality_gate);
      assert.equal(existsSync(readModel.shape_manifest_ref.file), true);
      assert.equal(existsSync(readModel.editable_shape_plan_ref.file), true);
      assert.equal(readModel.editable_shape_plan_ref.design_spec_lock_required, true);
      assert.equal(readModel.editable_shape_plan_ref.template_layout_grammar_required, true);
      assert.equal(readModel.professional_design_pack_ref.creative_owner, 'llm_agent');
      assert.equal(readModel.professional_design_pack_ref.materializer_can_select_layout, false);
      assert.equal(readModel.visual_sample_claim_boundary.test_double_detected, true);
      assert.equal(readModel.visual_sample_claim_boundary.proves_artifact_export_chain, true);
      assert.equal(readModel.visual_sample_claim_boundary.proves_visual_design_quality, false);
      assert.equal(readModel.repair_policy.blocked_page_only, true);
      assertIncludesAll(readModel.quality_gate_refs, [
        'agent/quality_gates/screenshot_review.md',
        'officecli_view_issues',
        'workspace-runtime-ref:export_pptx:<run-id>#/operator_proof_summary',
      ], 'readModel.quality_gate_refs');
      assertNoVerdictAuthority(readModel.authority_boundary);
      assert.equal(artifact.native_ppt_bundle.quality_nonregression_read_model_ref, 'native_quality_nonregression_read_model');
      assert.equal(artifact.native_ppt_bundle.test_double_boundary.proves_visual_design_quality, false);
      assert.equal(artifact.native_ppt_bundle.visual_sample_claim.display_as_visual_sample_allowed, false);
    });
  } finally {
    restoreEnv();
  }
});
