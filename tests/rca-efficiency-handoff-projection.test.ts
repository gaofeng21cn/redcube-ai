// @ts-nocheck
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  exportDomainActionAdapter,
  prepareProductEntryWorkspace,
  SERIAL_ENV_TEST,
  withMockCodexRuntimeState,
} from './product-domain-action-case-shared.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const contractPath = 'contracts/production_acceptance/rca-efficiency-handoff-projection.json';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function assertRefString(value, label) {
  assert.equal(typeof value, 'string', label);
  assert.notEqual(value.trim(), '', label);
  assert.equal(value.startsWith('/'), false, `${label} must be portable, not an absolute path`);
  assert.equal(value.includes('\n'), false, label);
}

function assertRefArray(values, label) {
  assert.equal(Array.isArray(values), true, label);
  assert.equal(values.length > 0, true, label);
  values.forEach((value, index) => assertRefString(value, `${label}[${index}]`));
}

function assertEfficiencySuiteShape(suite) {
  assert.equal(suite.surface_kind, 'rca_efficiency_handoff_projection');
  assert.equal(suite.owner, 'redcube_ai');
  assert.equal(suite.consumer, 'opl_agent_lab');
  assert.equal(suite.refs_only, true);
  assert.equal(suite.read_only, true);
  assert.equal(suite.source_work_order_ref, 'oma_developer_patch_work_order_5a1b68cacbd4');
  assert.equal(suite.agent_lab_suite_input.suite_kind, 'standard');
  assert.equal(suite.agent_lab_suite_input.domain_specific_suite_kind_required, false);
  assert.equal(suite.agent_lab_suite_input.domain_id, 'redcube-ai');
  assert.equal(suite.agent_lab_suite_input.claims_visual_ready, false);
  assert.equal(suite.agent_lab_suite_input.claims_exportable, false);
  assert.equal(suite.agent_lab_suite_input.claims_handoffable, false);
  assert.equal(suite.agent_lab_suite_input.claims_production_soak_complete, false);

  assert.equal(suite.target_agent_owner_surface_refs.owner, 'redcube_ai');
  assert.equal(suite.target_agent_owner_surface_refs.refs_only, true);
  assert.equal(suite.target_agent_owner_surface_refs.owner_route_ref, 'redcube product manifest#/owner_route');
  assert.equal(
    suite.target_agent_owner_surface_refs.owner_receipt_contract_ref,
    'redcube product manifest#/domain_owner_receipt_contract',
  );
  assert.equal(
    suite.target_agent_owner_surface_refs.external_work_order_owner_closeout_ref,
    'redcube product manifest#/domain_owner_receipt_contract/external_work_order_owner_closeout',
  );
  assert.equal(
    suite.target_agent_owner_surface_refs.external_work_order_owner_closeout_action,
    'emit_external_work_order_owner_closeout',
  );
  assert.equal(
    suite.target_agent_owner_surface_refs.production_acceptance_contract_ref,
    'contracts/production_acceptance/rca-production-acceptance.json',
  );
  assertRefArray(suite.target_agent_owner_surface_refs.quality_gate_refs, 'quality_gate_refs');
  assertRefArray(suite.target_agent_owner_surface_refs.regression_suite_refs, 'regression_suite_refs');
  assertRefArray(suite.target_runtime_consumption_refs, 'target_runtime_consumption_refs');
  assert.equal(
    suite.target_runtime_consumption_refs.includes('redcube product manifest#/rca_efficiency_handoff_projection'),
    true,
  );
  assert.equal(
    suite.target_runtime_consumption_refs.includes('redcube domain-handler export#/mapped_surfaces/rca_efficiency_handoff_projection'),
    true,
  );
  assert.equal(
    suite.target_runtime_consumption_refs.includes('redcube domain-handler export#/mapped_surfaces/external_work_order_owner_closeout'),
    true,
  );
  assert.equal(
    suite.target_runtime_consumption_refs.includes('redcube domain-handler export#/source_manifest_refs/external_work_order_owner_closeout_ref'),
    true,
  );

  assertRefArray(suite.efficiency_signal_refs.duration_refs, 'duration_refs');
  assertRefArray(suite.efficiency_signal_refs.cost_refs, 'cost_refs');
  assertRefArray(suite.efficiency_signal_refs.cache_refs, 'cache_refs');
  assertRefArray(suite.efficiency_signal_refs.reuse_refs, 'reuse_refs');
  assertRefArray(suite.efficiency_signal_refs.render_execution_refs, 'render_execution_refs');
  assertRefArray(suite.efficiency_signal_refs.export_result_refs, 'export_result_refs');
  assertRefArray(suite.efficiency_signal_refs.repair_scope_refs, 'repair_scope_refs');
  assert.equal(
    suite.efficiency_signal_refs.cache_refs.some((ref) => ref.includes('source-pack-reuse')),
    true,
  );
  assert.equal(
    suite.efficiency_signal_refs.cache_refs.some((ref) => ref.includes('prompt-static-prefix-cache')),
    true,
  );
  assert.equal(
    suite.efficiency_signal_refs.cache_refs.some((ref) => ref.includes('export-preview-cache')),
    true,
  );
  assert.equal(
    suite.efficiency_signal_refs.render_execution_refs.some((ref) => ref.includes('page_local_batch_runtime')),
    true,
  );
  assert.equal(
    suite.efficiency_signal_refs.repair_scope_refs.some((ref) => ref.includes('blocked_slide_ids')),
    true,
  );

  assert.equal(suite.efficiency_fields.cache_status.source_ref.includes('cache_status'), true);
  assert.equal(suite.efficiency_fields.elapsed_ms.source_ref.includes('elapsed_ms'), true);
  assert.equal(suite.efficiency_fields.render_execution.source_ref.includes('render_execution'), true);
  assert.equal(suite.efficiency_fields.reused_slide_ids.source_ref.includes('reused_slide_ids'), true);
  assert.equal(suite.efficiency_fields.cost_summary.source_ref.includes('cost_summary'), true);
  assert.equal(suite.efficiency_fields.export_result.source_ref.includes('export'), true);
  assert.equal(suite.efficiency_fields.source_pack_reuse.body_included, false);
  assert.equal(suite.efficiency_fields.prompt_static_prefix_cache.body_included, false);
  assert.equal(suite.efficiency_fields.page_local_batch_runtime.body_included, false);
  assert.equal(suite.efficiency_fields.blocked_page_only_repair.body_included, false);
  assert.equal(suite.efficiency_fields.export_preview_cache.body_included, false);
  assertRefArray(suite.target_verification_refs, 'target_verification_refs');
  assert.deepEqual(suite.target_verification_refs, [
    'target_runtime_consumption_verification_receipt',
    'target_workspace_environment_consumption_receipt',
    'workspace-runtime-ref:review-export:<run-id>',
    'workspace-runtime-ref:export-result:<run-id>',
    'target-verification:redcube-ai/product-manifest-read',
    'target-verification:redcube-ai/domain-handler-export-read',
    'target-verification:redcube-ai/typecheck',
    'target-verification:redcube-ai/test-fast',
    'target-verification:redcube-ai/targeted-efficiency-tests',
  ]);
  assert.equal(Array.isArray(suite.patch_traceability_matrix), true);
  assert.deepEqual(
    suite.patch_traceability_matrix.map((entry) => entry.target_surface),
    [
      'target_agent_owner_receipt_contract_ref',
      'target_agent_owner_route_ref',
      'target_agent_production_acceptance_contract_ref',
      'target_agent_quality_gate_ref',
      'target_agent_regression_suite_ref',
    ],
  );
  for (const [index, entry] of suite.patch_traceability_matrix.entries()) {
    assertRefString(entry.proposed_change_ref, `patch_traceability_matrix[${index}].proposed_change_ref`);
    assertRefString(entry.target_surface, `patch_traceability_matrix[${index}].target_surface`);
    assertRefString(entry.verifies_ref, `patch_traceability_matrix[${index}].verifies_ref`);
    assertRefArray(entry.target_repo_refs, `patch_traceability_matrix[${index}].target_repo_refs`);
    assert.equal(entry.refs_only, true);
    assert.equal(entry.writes_target_domain_truth, false);
    assert.equal(entry.writes_memory_body, false);
    assert.equal(entry.writes_artifact_body, false);
    assert.equal(entry.authorizes_quality_or_export, false);
  }

  assertRefArray(suite.quality_floor_refs.review_export_gate_refs, 'review_export_gate_refs');
  assertRefArray(suite.quality_floor_refs.screenshot_review_gate_refs, 'screenshot_review_gate_refs');
  assertRefArray(suite.quality_floor_refs.visual_memory_authority_refs, 'visual_memory_authority_refs');
  assertRefArray(suite.quality_floor_refs.owner_receipt_refs, 'owner_receipt_refs');
  assertRefArray(suite.quality_floor_refs.blocked_page_only_repair_refs, 'blocked_page_only_repair_refs');
  assert.equal(
    suite.quality_floor_refs.blocked_page_only_repair_refs.includes('prompts/ppt_deck/repair_image_pages.md'),
    true,
  );
  assertRefArray(suite.quality_floor_refs.export_preview_cache_gate_refs, 'export_preview_cache_gate_refs');

  assert.equal(suite.authority_boundary.no_forbidden_write, true);
  assert.equal(suite.authority_boundary.opl_agent_lab_can_write_rca_visual_truth, false);
  assert.equal(suite.authority_boundary.opl_agent_lab_can_authorize_quality_verdict, false);
  assert.equal(suite.authority_boundary.opl_agent_lab_can_authorize_exportable, false);
  assert.equal(suite.authority_boundary.rca_quality_floor_owner, 'redcube_ai');
  assert.equal(suite.optimization_policy.efficiency_improves_observability_only, true);
  assert.equal(suite.optimization_policy.quality_gates_may_be_lowered, false);
  assert.equal(suite.optimization_policy.source_pack_reuse_allowed, true);
  assert.equal(suite.optimization_policy.prompt_static_prefix_cache_allowed, true);
  assert.equal(suite.optimization_policy.page_local_parallel_or_batch_sizing_telemetry_allowed, true);
  assert.equal(suite.optimization_policy.blocked_page_only_repair_required_for_repair_route, true);
  assert.equal(suite.optimization_policy.export_preview_cache_allowed, true);
}

test('RCA efficiency handoff contract exposes a refs-only standard Agent Lab suite input', () => {
  assert.equal(fs.existsSync(path.join(repoRoot, contractPath)), true);
  const suite = readJson(contractPath);

  assertEfficiencySuiteShape(suite);
});

test('domain-handler projection includes RCA efficiency handoff without claiming visual readiness', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const projection = await exportDomainActionAdapter({
      workspace_root: workspaceRoot,
    });

    assertEfficiencySuiteShape(projection.mapped_surfaces.rca_efficiency_handoff_projection);
    assert.equal(
      projection.source_manifest_refs.rca_efficiency_handoff_projection_ref,
      '/rca_efficiency_handoff_projection',
    );
    assert.equal(
      projection.mapped_surfaces.rca_efficiency_handoff_projection.target_runtime_consumption_refs.includes(
        'redcube domain-handler export#/mapped_surfaces/rca_efficiency_handoff_projection',
      ),
      true,
    );
  });
});

test('product manifest exposes RCA efficiency handoff and owner route consumption refs', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const manifestModule = await import('../packages/redcube-domain-entry/dist/index.js');
    const manifest = await manifestModule.getProductEntryManifest({
      workspace_root: workspaceRoot,
    });

    assertEfficiencySuiteShape(manifest.rca_efficiency_handoff_projection);
    assert.deepEqual(
      manifest.operator_evidence_readiness_projection.rca_efficiency_handoff_projection,
      manifest.rca_efficiency_handoff_projection,
    );
    assert.equal(
      manifest.owner_route.projection_refs.some((entry) => entry.ref === '/rca_efficiency_handoff_projection'),
      true,
    );
    assert.equal(
      manifest.domain_owner_receipt_contract.efficiency_handoff_owner_projection.refs_only,
      true,
    );
    assert.equal(
      manifest.domain_owner_receipt_contract.efficiency_handoff_owner_projection.authorizes_quality_or_export,
      false,
    );
  });
});
