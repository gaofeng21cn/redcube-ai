import {
  assert,
  getProductEntryManifest,
  prepareProductEntryWorkspace,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';
import { existsSync } from 'node:fs';

async function readManifest() {
  return getProductEntryManifest({
    workspace_root: await prepareProductEntryWorkspace(),
  });
}

test('product-entry is a thin domain-authority refs adapter', async () => {
  await withMockCodexRuntimeState(async () => {
    const manifest = await readManifest();

    assert.equal(manifest.manifest_kind, 'rca_domain_authority_refs_projection');
    assert.equal(manifest.domain_authority_refs.surface_kind, 'rca_domain_authority_refs');
    assert.equal(manifest.domain_authority_refs.owner, 'redcube_ai');
    assert.equal(manifest.authority_boundary.generic_product_shell_owner, 'one-person-lab');
    assert.equal(manifest.authority_boundary.agent_lab_owner, 'one-person-lab');
    assert.equal(manifest.authority_boundary.production_workorder_owner, 'one-person-lab');

    for (const removedSurface of [
      'operator_evidence_readiness_projection',
      'production_evidence_scaleout_refs',
      'production_evidence_tail_workorder',
      'opl_expected_receipt_monitor_freshness_handoff',
      'rca_efficiency_handoff_projection',
      'goal_workflow_agent_lab_suite',
      'ppt_three_route_agent_lab_suite',
      'workspace_receipt_inventory_projection',
      'opl_ledger_artifact_registration',
    ]) {
      assert.equal(Object.hasOwn(manifest, removedSurface), false, removedSurface);
    }
    assert.equal(existsSync('packages/redcube-domain-entry/src/actions/get-product-entry-manifest-parts'), false);
  });
});

test('product-entry returns only domain evidence, blocker, receipt, and artifact locator refs', async () => {
  await withMockCodexRuntimeState(async () => {
    const manifest = await readManifest();

    assert.deepEqual(Object.keys(manifest.domain_evidence_refs).sort(), [
      'live_stage_run_progress_evidence_ref',
      'no_regression_evidence_ref',
      'production_acceptance_ref',
    ]);
    assert.deepEqual(Object.keys(manifest.typed_blocker_refs).sort(), [
      'human_gate_refs_ref',
      'typed_blocker_refs_ref',
    ]);
    assert.deepEqual(Object.keys(manifest.receipt_refs).sort(), [
      'domain_action_receipt_refs_ref',
      'no_regression_receipt_ref',
      'owner_receipt_contract_ref',
    ]);
    assert.deepEqual(Object.keys(manifest.artifact_locator_refs).sort(), [
      'artifact_locator_contract_ref',
      'stage_folder_locator_contract_ref',
    ]);
    assert.equal(manifest.authority_boundary.opl_can_create_owner_receipt, false);
    assert.equal(manifest.authority_boundary.opl_can_create_typed_blocker, false);
    assert.equal(manifest.authority_boundary.projection_can_claim_domain_ready, false);
  });
});

test('product-entry consumes the declarative stage manifest and never a tracked stage plane', async () => {
  await withMockCodexRuntimeState(async () => {
    const manifest = await readManifest();

    assert.equal(existsSync('contracts/stage_control_plane.json'), false);
    assert.equal(manifest.declarative_stage_manifest_ref, 'agent/stages/manifest.json');
    assert.equal(manifest.family_stage_control_plane_ref, 'opl-generated:family_stage_control_plane');
    assert.equal(Object.hasOwn(manifest, 'family_stage_control_plane'), false);
  });
});
