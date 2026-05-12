// @ts-nocheck
import {
  assert,
  getProductEntryManifest,
  prepareProductEntryWorkspace,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';

test('product-entry manifest exposes physical skeleton audit and runtime residue retirement proof', async () => {
  await withMockCodexRuntimeState(async () => {
    const manifest = await getProductEntryManifest({
      workspace_root: await prepareProductEntryWorkspace(),
    });
    const skeleton = manifest.standard_domain_agent_skeleton;

    assert.equal(skeleton.mapping_model, 'physical_skeleton_repo_source_layout_with_manifest_projection');
    assert.equal(skeleton.repo_source_boundary.physical_relayout_required_now, false);
    assert.equal(skeleton.repo_source_boundary.audit_surface.surface_kind, 'standard_domain_agent_skeleton_repo_source_layout_audit');
    assert.equal(skeleton.repo_source_boundary.audit_surface.status, 'pass');
    assert.deepEqual(skeleton.repo_source_boundary.audit_surface.expected_roots, ['agent', 'contracts', 'runtime', 'docs']);
    assert.deepEqual(
      skeleton.repo_source_boundary.audit_surface.repo_source_layout.map((entry) => [entry.boundary_id, entry.status]),
      [
        ['agent', 'present'],
        ['contracts', 'present'],
        ['runtime', 'present'],
        ['docs', 'present'],
      ],
    );
    assert.deepEqual(skeleton.repo_source_boundary.audit_surface.missing_roots, []);
    assert.deepEqual(skeleton.repo_source_boundary.audit_surface.forbidden_repo_writes, [
      'visual_truth',
      'review_export_verdict',
      'canonical_artifact_blob',
      'memory_content_body',
      'receipt_instance',
    ]);

    assert.equal(manifest.runtime_residue_retirement.surface_kind, 'runtime_residue_retirement_audit');
    assert.equal(manifest.runtime_residue_retirement.status, 'active_path_retired');
    assert.equal(manifest.runtime_residue_retirement.default_runtime_owner, 'codex_cli');
    assert.deepEqual(manifest.runtime_residue_retirement.retired_default_surfaces, [
      'hermes_first_default_runtime',
      'gateway_first_public_entry',
      'repo_local_manager_default',
    ]);
    assert.deepEqual(manifest.runtime_residue_retirement.allowed_remaining_roles, [
      'explicit_proof_backend',
      'provenance',
      'history',
    ]);
    assert.deepEqual(manifest.runtime_residue_retirement.active_path_policy, {
      hermes_agent_default_runtime: false,
      gateway_first_public_entry: false,
      repo_local_manager_default: false,
      opl_hosted_provider_path_allowed: true,
      explicit_proof_backend_allowed: true,
    });

    const controlledSoak = manifest.controlled_soak_no_regression_attempt;
    assert.equal(controlledSoak.surface_kind, 'controlled_soak_no_regression_attempt');
    assert.equal(controlledSoak.attempt_id, 'rca.controlled_soak.no_regression_attempt.v1');
    assert.equal(controlledSoak.state, 'deferred_typed_blocker');
    assert.equal(controlledSoak.controlled_soak_apply_contract_open, true);
    assert.equal(controlledSoak.deferred_blocker.blocker_kind, 'domain_owner_receipt_required');
    assert.equal(
      controlledSoak.deferred_blocker.source_contract,
      'opl_temporal_controlled_visual_stage_attempt_apply_contract',
    );
    assert.deepEqual(controlledSoak.deferred_blocker.required_return_shapes, [
      'domain_owner_receipt_ref',
      'typed_blocker',
      'no_regression_evidence_ref',
    ]);
    assert.equal(controlledSoak.no_regression_surface_refs.includes('/controlled_visual_stage_attempt'), true);
    assert.equal(controlledSoak.no_regression_surface_refs.includes('/controlled_memory_apply_proof'), true);
    assert.equal(controlledSoak.authority_boundary.can_hold_visual_truth, false);
    assert.equal(controlledSoak.authority_boundary.can_hold_review_export_verdict, false);
    assert.equal(controlledSoak.repository_boundary.repo_tracks_visual_or_export_artifacts, false);
    assert.equal(controlledSoak.repository_boundary.repo_tracks_receipt_instance, false);
  });
});
