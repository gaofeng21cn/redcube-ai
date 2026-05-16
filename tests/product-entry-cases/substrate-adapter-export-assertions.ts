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
    manifest.product_entry_shell.sidecar.opl_substrate_adapter_export.ref,
    '/opl_substrate_adapter_export',
  );
}

export function assertSidecarSubstrateAdapterExport(sidecar) {
  assert.equal(
    sidecar.runtime_framework.rca_thin_surface_policy.opl_substrate_adapter_export.status,
    'refs_only_substrate_adapter_export_landed',
  );
  assert.equal(
    sidecar.runtime_framework.rca_thin_surface_policy.opl_substrate_adapter_export.adapter_model,
    'domain_owned_opaque_index_only_export',
  );
  assert.equal(
    sidecar.runtime_framework.rca_thin_surface_policy.opl_substrate_adapter_export.export_mode,
    'opaque_index_only_refs',
  );
  assert.equal(
    sidecar.runtime_framework.rca_thin_surface_policy.opl_substrate_adapter_export.authority_boundary.opl_can_read_deliverable_artifact_body,
    false,
  );
  assert.equal(
    sidecar.runtime_framework.rca_thin_surface_policy.opl_substrate_adapter_export.authority_boundary.opl_can_issue_owner_receipt,
    false,
  );
  assert.equal(sidecar.mapped_surfaces.opl_substrate_adapter_export.ref, '/opl_substrate_adapter_export');
  assert.equal(sidecar.mapped_surfaces.opl_substrate_adapter_export.owner, 'redcube_ai');
  assert.equal(sidecar.mapped_surfaces.opl_substrate_adapter_export.consumer, 'opl_framework');
  assert.equal(sidecar.mapped_surfaces.opl_substrate_adapter_export.read_only, true);
  assert.equal(sidecar.mapped_surfaces.opl_substrate_adapter_export.refs_only, true);
  assert.equal(sidecar.mapped_surfaces.opl_substrate_adapter_export.opaque_refs_only, true);
  assert.equal(sidecar.mapped_surfaces.opl_substrate_adapter_export.index_only, true);
  assert.deepEqual(
    sidecar.mapped_surfaces.opl_substrate_adapter_export.export_ref_families.map((entry) => entry.family),
    ['workspace_refs', 'source_refs', 'artifact_refs', 'memory_refs'],
  );
  assert.equal(
    sidecar.mapped_surfaces.opl_substrate_adapter_export.authority_boundary.opl_can_read_visual_truth,
    false,
  );
  assert.equal(
    sidecar.mapped_surfaces.opl_substrate_adapter_export.authority_boundary.opl_can_authorize_layout_review_export_verdict,
    false,
  );
  assert.equal(
    sidecar.mapped_surfaces.opl_substrate_adapter_export.authority_boundary.opl_can_read_visual_memory_body,
    false,
  );
  assert.equal(
    sidecar.mapped_surfaces.opl_substrate_adapter_export.forbidden_export_fields.includes('deliverable_artifact_body'),
    true,
  );
  assert.equal(
    sidecar.source_manifest_refs.opl_substrate_adapter_export_ref,
    '/opl_substrate_adapter_export',
  );
}
