// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  createDeliverable,
  getProductEntryManifest,
  runDeliverableRoute,
} from './product-domain-action-test-api.ts';
import { withEnv, withMockCodexRuntime } from './mock-codex-cli.ts';
import { mkUserScopedTestWorkspace } from './helpers/test-workspace.ts';

const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  fileURLToPath(new URL('./helpers/mock-redcube-python-with-playwright.ts', import.meta.url)),
]);

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

function assertRefsOnly(value, label) {
  assert.equal(value?.refs_only, true, `${label}.refs_only`);
  assert.equal(value?.read_only, true, `${label}.read_only`);
  assert.equal(value?.body_included, false, `${label}.body_included`);
}

function assertNoForbiddenAuthority(authority) {
  assert.equal(authority.opl_agent_lab_can_store_suite_input_refs, true);
  assert.equal(authority.opl_agent_lab_can_compare_quality_refs, true);
  assert.equal(authority.opl_agent_lab_can_score_nonregression_refs, true);
  assert.equal(authority.opl_agent_lab_score_is_rca_visual_verdict, false);
  assert.equal(authority.opl_agent_lab_can_write_rca_visual_truth, false);
  assert.equal(authority.opl_agent_lab_can_write_artifact_blob, false);
  assert.equal(authority.opl_agent_lab_can_write_memory_body, false);
  assert.equal(authority.opl_agent_lab_can_authorize_quality_verdict, false);
  assert.equal(authority.opl_agent_lab_can_authorize_exportable, false);
  assert.equal(authority.opl_agent_lab_can_claim_visual_ready, false);
  assert.equal(authority.python_helper_can_replace_ai_creative_owner, false);
  assert.equal(authority.officecli_skill_can_replace_rca_workflow, false);
  assert.equal(authority.officecli_validate_can_replace_true_render_proof, false);
  assert.equal(authority.officecli_authoring_loop_adopted, false);
  assert.equal(authority.default_executor_changed, false);
}

function assertOfficecliMaterializerPolicy(policy) {
  assert.equal(policy.policy_id, 'ppt_native_officecli_materializer_quality_gate_v1');
  assert.equal(policy.adoption_status, 'qa_materializer_discipline_only');
  assert.equal(policy.rca_main_workflow_owner, 'redcube_stage_review_export');
  assert.equal(policy.skill_authoring_loop_adopted, false);
  assert.equal(policy.materializer_role, 'default_editable_pptx_materializer_and_qa_gate');
  assert.equal(policy.current_pptx_writer, 'officecli_pptx_materializer');
  assert.equal(policy.officecli_writer_adapter_default_enabled, true);
  assert.deepEqual(policy.required_gate_refs, [
    'officecli_save_before_close',
    'officecli_validate',
    'officecli_view_issues',
    'officecli_view_text',
  ]);
  assert.equal(policy.save_before_close_required, true);
  assert.equal(policy.validate_required, true);
  assert.equal(policy.view_issues_required, true);
  assert.equal(policy.view_text_required, true);
  assert.equal(policy.true_render_proof_required_after_officecli_gate, true);
  assert.equal(policy.true_render_proof_substitute_allowed, false);
  assert.equal(policy.deterministic_cjk_font_family, 'Noto Sans CJK SC');
  assert.equal(policy.default_visual_route_changed, false);
  assert.equal(policy.default_executor_changed, false);
}

function assertQualityContractShape(contract) {
  assert.equal(contract.surface_kind, 'ppt_native_pptx_quality_nonregression');
  assert.equal(contract.owner, 'redcube_ai');
  assert.equal(contract.consumer, 'opl_agent_lab');
  assertRefsOnly(contract, 'contract');
  assert.equal(contract.route_policy.explicit_optional_route, true);
  assert.equal(contract.route_policy.default_visual_route, 'author_image_pages');
  assert.equal(contract.route_policy.default_visual_route_changed, false);
  assert.deepEqual(contract.route_policy.runnable_native_routes, ['author_pptx_native', 'repair_pptx_native']);
  assert.deepEqual(contract.route_policy.preserved_review_export_gates, [
    'visual_director_review',
    'screenshot_review',
    'export_pptx',
  ]);

  assert.equal(contract.agent_lab_suite_input.refs_only, true);
  assert.equal(contract.agent_lab_suite_input.input_mode, 'refs_only_handoff');
  assert.equal(contract.agent_lab_suite_input.agent_lab_score_is_rca_visual_verdict, false);
  assert.equal(contract.agent_lab_suite_input.claims_visual_ready, false);
  assert.equal(contract.agent_lab_suite_input.claims_exportable, false);
  assert.equal(contract.agent_lab_suite_input.claims_handoffable, false);

  const metrics = contract.shape_manifest_contract.required_per_slide_metrics;
  for (const metric of [
    'bounds',
    'text_char_count',
    'primary_points',
    'occupied_ratio',
    'edge_clearance',
    'overlap_pairs',
    'shape_kind_count',
    'role_count',
    'layout_richness_score',
    'layout_variant',
    'expected_slot_count',
    'filled_slot_count',
    'slot_fill_ok',
    'audience_label_readability_ok',
    'content_depth_ok',
    'grid_balance_ok',
    'composition_signature',
    'title_underline_absent_ok',
    'chart_metrics',
    'table_metrics',
    'metric_grid_metrics',
    'coordinate_determinism_hash',
    'preview_screenshot_sha256',
    'preview_screenshot_dimensions',
  ]) {
    assert.equal(metrics.includes(metric), true, `missing metric ${metric}`);
  }
  assert.equal(contract.shape_manifest_contract.fail_closed_when_missing, true);
  assert.equal(contract.editable_shape_plan_contract.required, true);
  assert.equal(contract.editable_shape_plan_contract.creative_owner, 'llm_agent');
  assert.equal(contract.editable_shape_plan_contract.python_helper_role, 'execute_validate_export_only');
  assert.equal(contract.editable_shape_plan_contract.template_substitution_allowed, false);
  assert.equal(contract.editable_shape_plan_contract.layout_intent_required, true);
  assert.equal(contract.editable_shape_plan_contract.composition_signature_required, true);
  assert.equal(contract.editable_shape_plan_contract.title_underline_motif_allowed, false);
  assert.equal(contract.editable_shape_plan_contract.concrete_layout_variant_repetition_limit, 2);
  assertOfficecliMaterializerPolicy(contract.officecli_materializer_policy);
  assert.equal(contract.officecli_materializer_policy.officecli_skill_can_replace_rca_workflow, false);
  assert.equal(contract.officecli_materializer_policy.officecli_validate_can_replace_true_render_proof, false);
  assert.equal(contract.true_render_proof.required, true);
  assert.equal(contract.true_render_proof.fail_closed_when_missing, true);
  assert.equal(contract.true_render_proof.synthetic_preview_allowed, false);
  assert.equal(contract.true_render_proof.renderer_pipeline, 'libreoffice_headless_pdf_png_v1');
  assert.equal(contract.repair_policy.blocked_page_only, true);
  assert.equal(contract.repair_policy.repair_route, 'repair_pptx_native');
  assert.equal(contract.repair_policy.target_source, 'screenshot_review.blocked_slide_ids');
  assert.equal(contract.export_proof_summary.required, true);
  assert.equal(contract.export_proof_summary.summary_surface, 'native_export_bundle_operator_proof_summary_v1');
  assert.equal(contract.quality_gate_refs.includes('officecli_save_before_close'), true);
  assert.equal(contract.quality_gate_refs.includes('officecli_validate'), true);
  assert.equal(contract.quality_gate_refs.includes('officecli_view_issues'), true);
  assert.equal(contract.quality_gate_refs.includes('officecli_view_text'), true);
  assertNoForbiddenAuthority(contract.authority_boundary);
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

  for (const route of ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction']) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-native-quality',
      deliverableId: 'deck-native-quality',
      route,
    });
    assert.equal(result.ok, true, route);
  }

  const result = await runDeliverableRoute({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-native-quality',
    deliverableId: 'deck-native-quality',
    route: 'author_pptx_native',
  });
  assert.equal(result.ok, true);
  return readJson(result.artifactFile);
}

test('native PPTX quality non-regression contract is refs-only and keeps Agent Lab non-authoritative', () => {
  const contract = readJson('contracts/runtime-program/ppt-native-pptx-quality-nonregression.json');
  assertQualityContractShape(contract);

  const proofLane = readJson('contracts/runtime-program/ppt-native-authoring-proof-lane.json');
  const engineContract = readJson('contracts/runtime-program/ppt-native-python-engine-contract.json');
  assert.deepEqual(
    contract.route_policy.preserved_review_export_gates,
    proofLane.scope.preserved_gate_routes,
  );
  assert.deepEqual(
    contract.shape_manifest_contract.required_per_slide_metrics,
    engineContract.native_ppt_quality_surface.required_per_slide_metrics,
  );
  assert.equal(
    contract.true_render_proof.renderer_pipeline,
    engineContract.true_render_proof.renderer_pipeline,
  );
  assert.equal(
    contract.editable_shape_plan_contract.python_helper_role,
    engineContract.ai_first_boundary.helper_role,
  );
  assert.deepEqual(
    contract.officecli_materializer_policy.required_gate_refs,
    engineContract.officecli_materializer_policy.required_gate_refs,
  );
  assert.equal(engineContract.officecli_materializer_policy.skill_authoring_loop_adopted, false);
  assert.equal(engineContract.officecli_materializer_policy.true_render_proof_substitute_allowed, false);
});

test('product-entry manifest still exposes native PPTX as explicit optional route', async () => {
  const manifest = await getProductEntryManifest({
    workspace_locator: {
      workspace_root: mkdtempSync(path.join(os.tmpdir(), 'redcube-native-pptx-quality-manifest-')),
    },
  });
  const pptPolicy = manifest.deliverable_facade.family_route_policy.ppt_deck;

  assert.equal(pptPolicy.default_visual_route, 'author_image_pages');
  assert.equal(pptPolicy.default_visual_policy, 'image_first');
  assert.equal(pptPolicy.native_ppt_proof_lane.default_enabled, false);
  assert.equal(pptPolicy.native_ppt_proof_lane.production_selectable, true);
  assert.deepEqual(pptPolicy.native_ppt_proof_lane.runnable_routes, ['author_pptx_native', 'repair_pptx_native']);
  assert.deepEqual(
    pptPolicy.route_selection_policy.explicit_selection_required_for,
    ['render_html', 'fix_html', 'author_pptx_native', 'repair_pptx_native'],
  );
  assert.deepEqual(
    pptPolicy.native_ppt_proof_lane.preserved_gates,
    ['visual_director_review', 'screenshot_review', 'export_pptx'],
  );
  assertOfficecliMaterializerPolicy(pptPolicy.native_ppt_proof_lane.officecli_materializer_policy);
});

test('native PPTX authoring artifact exposes Agent Lab quality non-regression refs without verdict authority', async () => {
  const restoreEnv = withEnv({
    REDCUBE_PYTHON_COMMAND: MOCK_REDCUBE_PYTHON_COMMAND,
  });
  try {
    await withMockCodexRuntime(async () => {
      const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-pptx-quality-nonregression-');
      const artifact = await runNativeAuthoring(workspaceRoot);
      const readModel = artifact.native_quality_nonregression_read_model;

      assert.equal(readModel.surface_kind, 'ppt_native_pptx_quality_nonregression_read_model');
      assertRefsOnly(readModel, 'readModel');
      assert.equal(readModel.contract_ref, 'contracts/runtime-program/ppt-native-pptx-quality-nonregression.json');
      assert.equal(readModel.route, 'author_pptx_native');
      assert.equal(readModel.agent_lab_suite_input.agent_lab_score_is_rca_visual_verdict, false);
      assert.equal(readModel.agent_lab_suite_input.claims_visual_ready, false);
      assert.equal(readModel.agent_lab_suite_input.claims_exportable, false);
      assert.equal(readModel.true_render_proof_ref.fail_closed_when_missing, true);
      assert.equal(readModel.true_render_proof_ref.renderer_pipeline, 'libreoffice_headless_pdf_png_v1');
      assert.equal(readModel.officecli_materializer_policy_ref.contract_ref, 'contracts/runtime-program/ppt-native-pptx-quality-nonregression.json#/officecli_materializer_policy');
      assertOfficecliMaterializerPolicy(readModel.officecli_quality_gate);
      assert.equal(readModel.officecli_quality_gate.officecli_skill_can_replace_rca_workflow, false);
      assert.equal(readModel.officecli_quality_gate.officecli_validate_can_replace_true_render_proof, false);
      assert.equal(readModel.shape_manifest_ref.required_metric_refs.includes('shape_manifest#/slides/*/metrics/occupied_ratio'), true);
      assert.equal(readModel.shape_manifest_ref.required_metric_refs.includes('shape_manifest#/slides/*/preview_screenshot_sha256'), true);
      assert.equal(existsSync(readModel.shape_manifest_ref.file), true);
      assert.equal(existsSync(readModel.editable_shape_plan_ref.file), true);
      assert.equal(readModel.editable_shape_plan_ref.layout_intent_required, true);
      assert.equal(readModel.editable_shape_plan_ref.composition_signature_required, true);
      assert.equal(readModel.editable_shape_plan_ref.title_underline_motif_allowed, false);
      assert.equal(readModel.editable_shape_plan_ref.concrete_layout_variant_repetition_limit, 2);
      assert.equal(readModel.repair_policy.blocked_page_only, true);
      assert.equal(readModel.repair_policy.target_source, 'screenshot_review.blocked_slide_ids');
      assert.equal(readModel.quality_gate_refs.includes('agent/quality_gates/screenshot_review.md'), true);
      assert.equal(readModel.quality_gate_refs.includes('officecli_view_issues'), true);
      assert.equal(readModel.quality_gate_refs.includes('workspace-runtime-ref:export_pptx:<run-id>#/operator_proof_summary'), true);
      assertNoForbiddenAuthority(readModel.authority_boundary);
      assert.equal(
        artifact.native_ppt_bundle.quality_nonregression_read_model_ref,
        'native_quality_nonregression_read_model',
      );
    });
  } finally {
    restoreEnv();
  }
});
