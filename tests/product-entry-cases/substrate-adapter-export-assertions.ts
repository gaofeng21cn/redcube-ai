// @ts-nocheck
import assert from 'node:assert/strict';

export function assertManifestSubstrateAdapterExport(manifest) {
  assert.equal(manifest.opl_substrate_adapter_export.ref, '/opl_substrate_adapter_export');
  assert.equal(
    manifest.opl_substrate_adapter_export.projection_id,
    'rca.opl_substrate_adapter_export.v1',
  );
  assert.equal(manifest.opl_substrate_adapter_export.owner, 'redcube_ai');
  assert.equal(manifest.opl_substrate_adapter_export.consumer, 'opl_framework');
  assert.equal(
    manifest.opl_substrate_adapter_export.status,
    'refs_only_substrate_adapter_export_landed',
  );
  assert.equal(
    manifest.opl_substrate_adapter_export.adapter_model,
    'domain_owned_opaque_index_only_export',
  );
  assert.equal(manifest.opl_substrate_adapter_export.read_only, true);
  assert.equal(manifest.opl_substrate_adapter_export.refs_only, true);
  assert.equal(manifest.opl_substrate_adapter_export.opaque_refs_only, true);
  assert.equal(manifest.opl_substrate_adapter_export.index_only, true);
  assert.equal(manifest.opl_substrate_adapter_export.exports_body_payloads, false);
  assert.deepEqual(
    manifest.opl_substrate_adapter_export.export_ref_families.map((entry) => entry.family),
    ['workspace_refs', 'source_refs', 'artifact_refs', 'memory_refs'],
  );
  assert.deepEqual(
    manifest.opl_substrate_adapter_export.lifecycle_projection_refs,
    [
      '/task_lifecycle',
      '/runtime_inventory',
      '/runtime_loop_closure',
      '/operator_evidence_readiness_projection',
    ],
  );
  assert.equal(
    manifest.opl_substrate_adapter_export.authority_boundary.opl_can_index_workspace_refs,
    true,
  );
  assert.equal(
    manifest.opl_substrate_adapter_export.authority_boundary.opl_can_read_visual_truth,
    false,
  );
  assert.equal(
    manifest.opl_substrate_adapter_export.authority_boundary.opl_can_authorize_layout_review_export_verdict,
    false,
  );
  assert.equal(
    manifest.opl_substrate_adapter_export.authority_boundary.opl_can_read_deliverable_artifact_body,
    false,
  );
  assert.equal(
    manifest.opl_substrate_adapter_export.authority_boundary.opl_can_read_visual_memory_body,
    false,
  );
  assert.equal(
    manifest.opl_substrate_adapter_export.authority_boundary.opl_can_issue_owner_receipt,
    false,
  );
  assert.equal(
    manifest.product_entry_shell.domain_action_adapter.opl_substrate_adapter_export.ref,
    '/opl_substrate_adapter_export',
  );
  assert.equal(manifest.source_provenance.surface_kind, 'source_provenance');
  assert.equal(manifest.source_provenance.capability_classification, 'source_provenance_only');
  assert.equal(manifest.source_provenance.source_provenance_ref.ref, 'docs/source/source_augmentation_executor_contract.md');
  assert.equal(manifest.source_provenance.parity_oracle_ref.ref, '/visual_pack_compiler_handoff');
  assert.equal(
    manifest.source_provenance.authority_boundary.includes('source_refs_do_not_contain_source_body'),
    true,
  );
  assert.equal(
    manifest.source_provenance.authority_boundary.includes('artifact_authority_owner_is_redcube_ai'),
    true,
  );
  assert.equal(manifest.artifact_inventory.surface_kind, 'artifact_inventory');
  assert.equal(
    manifest.artifact_inventory.supporting_files.some(
      (entry) => entry.file_id === 'artifact_locator_contract' && entry.ref.ref === '/artifact_locator_contract',
    ),
    true,
  );
  assert.equal(
    manifest.artifact_inventory.supporting_files.some(
      (entry) => entry.file_id === 'operator_evidence_readiness_projection'
        && entry.ref.ref === '/operator_evidence_readiness_projection',
    ),
    true,
  );
  assert.equal(
    manifest.artifact_inventory.supporting_files.every((entry) => entry.kind === 'supporting'),
    true,
  );
  assert.equal(
    JSON.stringify(manifest.artifact_inventory.supporting_files).includes('artifact_blob'),
    false,
  );
}

export function assertDomainActionAdapterSubstrateAdapterExport(domain_action_adapter) {
  assert.equal(
    domain_action_adapter.runtime_framework.rca_thin_surface_policy.opl_substrate_adapter_export.status,
    'refs_only_substrate_adapter_export_landed',
  );
  assert.equal(
    domain_action_adapter.runtime_framework.rca_thin_surface_policy.opl_substrate_adapter_export.adapter_model,
    'domain_owned_opaque_index_only_export',
  );
  assert.equal(
    domain_action_adapter.runtime_framework.rca_thin_surface_policy.opl_substrate_adapter_export.export_mode,
    'opaque_index_only_refs',
  );
  assert.equal(
    domain_action_adapter.runtime_framework.rca_thin_surface_policy.opl_substrate_adapter_export.authority_boundary.opl_can_read_deliverable_artifact_body,
    false,
  );
  assert.equal(
    domain_action_adapter.runtime_framework.rca_thin_surface_policy.opl_substrate_adapter_export.authority_boundary.opl_can_issue_owner_receipt,
    false,
  );
  assert.equal(domain_action_adapter.mapped_surfaces.opl_substrate_adapter_export.ref, '/opl_substrate_adapter_export');
  assert.equal(domain_action_adapter.mapped_surfaces.opl_substrate_adapter_export.owner, 'redcube_ai');
  assert.equal(domain_action_adapter.mapped_surfaces.opl_substrate_adapter_export.consumer, 'opl_framework');
  assert.equal(domain_action_adapter.mapped_surfaces.opl_substrate_adapter_export.read_only, true);
  assert.equal(domain_action_adapter.mapped_surfaces.opl_substrate_adapter_export.refs_only, true);
  assert.equal(domain_action_adapter.mapped_surfaces.opl_substrate_adapter_export.opaque_refs_only, true);
  assert.equal(domain_action_adapter.mapped_surfaces.opl_substrate_adapter_export.index_only, true);
  assert.deepEqual(
    domain_action_adapter.mapped_surfaces.opl_substrate_adapter_export.export_ref_families.map((entry) => entry.family),
    ['workspace_refs', 'source_refs', 'artifact_refs', 'memory_refs'],
  );
  assert.equal(
    domain_action_adapter.mapped_surfaces.opl_substrate_adapter_export.authority_boundary.opl_can_read_visual_truth,
    false,
  );
  assert.equal(
    domain_action_adapter.mapped_surfaces.opl_substrate_adapter_export.authority_boundary.opl_can_authorize_layout_review_export_verdict,
    false,
  );
  assert.equal(
    domain_action_adapter.mapped_surfaces.opl_substrate_adapter_export.authority_boundary.opl_can_read_visual_memory_body,
    false,
  );
  assert.equal(
    domain_action_adapter.mapped_surfaces.opl_substrate_adapter_export.forbidden_export_fields.includes('deliverable_artifact_body'),
    true,
  );
  assert.equal(
    domain_action_adapter.source_manifest_refs.opl_substrate_adapter_export_ref,
    '/opl_substrate_adapter_export',
  );
}
