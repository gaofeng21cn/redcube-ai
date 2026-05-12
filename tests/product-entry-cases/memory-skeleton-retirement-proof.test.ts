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
  });
});
