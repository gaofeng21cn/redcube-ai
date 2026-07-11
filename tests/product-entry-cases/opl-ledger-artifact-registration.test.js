import {
  SERIAL_ENV_TEST,
  assert,
  exportDomainActionAdapter,
  readJson,
  test,
  withMockCodexRuntimeState,
  prepareProductEntryWorkspace,
} from '../product-domain-action-case-shared.ts';


test('domain-handler exposes OPL Ledger artifact registration as refs-only RCA contract', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const domain_action_adapter = await exportDomainActionAdapter({
      workspace_root: workspaceRoot,
    });
    const contract = readJson('contracts/opl_ledger_artifact_registration.json');
    const surface = domain_action_adapter.mapped_surfaces.opl_ledger_artifact_registration;

    assert.equal(surface.ref, '/opl_ledger_artifact_registration');
    assert.equal(surface.contract_id, contract.contract_id);
    assert.equal(surface.refs_only, true);
    assert.equal(surface.projection_mode, 'refs_only_registration_contract');
    assert.equal(surface.writable_by_domain_action_adapter, false);
    assert.equal(surface.ledger_transport_owner, 'one-person-lab/OPL Ledger');
    assert.deepEqual(surface.required_registration_refs, [
      'artifact_ref',
      'sha256',
      'artifact_index_ref',
      'review_ref',
      'receipt_ref',
    ]);

    assert.equal(surface.owner_boundary.opl_ledger_can_store_artifact_body, false);
    assert.equal(surface.owner_boundary.opl_ledger_can_issue_rca_owner_receipt, false);
    assert.equal(surface.owner_boundary.opl_ledger_can_create_rca_typed_blocker, false);
    assert.equal(surface.owner_boundary.opl_ledger_can_authorize_review_export_verdict, false);
    assert.equal(surface.owner_boundary.opl_ledger_can_enqueue_runtime_work, false);
    assert.equal(
      domain_action_adapter.source_manifest_refs.opl_ledger_artifact_registration_ref,
      '/opl_ledger_artifact_registration',
    );
  });
});
