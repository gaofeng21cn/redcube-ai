import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(relativePath: string): any {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

test('RCA Foundry Agent OS domain kernel manifest declares visual authority', () => {
  const manifest = readJson('contracts/foundry-agent-os-domain-kernel-manifest.json');

  assert.equal(manifest.surface_kind, 'foundry_agent_os_domain_kernel_manifest');
  assert.equal(manifest.domain_id, 'redcube_ai');
  assert.equal(manifest.domain_agent_id, 'rca');
  assert.equal(manifest.owner, 'RedCube AI');
  assert.equal(manifest.role, 'w4_domain_kernel_manifest');

  const retained = new Set(manifest.domain_authority_kernel.retained_surfaces);
  [
    'visual_truth',
    'source_readiness_verdict',
    'communication_strategy',
    'visual_direction_decision',
    'layout_review_export_verdict',
    'repair_target_selection',
    'artifact_mutation_authorization',
    'artifact_export_authority',
    'visual_memory_accept_reject_or_blocker',
    'owner_receipt_signer',
    'typed_blocker_materializer',
    'visual_native_helper_authority',
  ].forEach((surface) => assert.equal(retained.has(surface), true, surface));
  assert.equal(manifest.domain_authority_kernel.owner_receipt_signer, 'redcube_ai_authority_kernel');
  assert.equal(manifest.domain_authority_kernel.typed_blocker_signer, 'redcube_ai_authority_kernel');
  assert.ok(
    manifest.domain_authority_kernel.quality_export_publication_review_verdict_signers.includes(
      'layout_review_export_verdict',
    ),
  );
  assert.ok(manifest.domain_authority_kernel.accepted_answer_shapes.includes('rca_owner_receipt_ref'));
  assert.ok(manifest.domain_authority_kernel.accepted_answer_shapes.includes('rca_typed_blocker_ref'));
});

test('RCA Foundry Agent OS domain kernel manifest upcollects generic surfaces to OPL', () => {
  const manifest = readJson('contracts/foundry-agent-os-domain-kernel-manifest.json');

  assert.deepEqual(manifest.default_read_root, {
    surface: 'current_owner_delta',
    ordinary_operator_root: true,
    raw_worklist_role: 'drilldown_only',
    provider_completion_role: 'transport_evidence_only',
    artifact_inventory_role: 'audit_only',
    gallery_projection_role: 'drilldown_only',
    projection_can_be_owner_answer: false,
  });

  const upcollect = new Set(manifest.opl_upcollect_surfaces);
  [
    'generic_runtime',
    'workspace_source_intake_shell',
    'artifact_gallery_handoff_shell',
    'review_repair_transport',
    'native_helper_envelope',
    'generated_cli_mcp_app_status_workbench_surfaces',
    'console_current_owner_delta_projection',
    'refs_only_vault_lineage',
    'capability_registry_abi',
  ].forEach((surface) => assert.equal(upcollect.has(surface), true, surface));
});

test('RCA Foundry Agent OS domain kernel manifest forbids false authority', () => {
  const manifest = readJson('contracts/foundry-agent-os-domain-kernel-manifest.json');

  [
    'opl',
    'vault',
    'console',
    'runway',
    'pack',
    'capability_registry',
    'gallery_handoff_shell',
  ].forEach((surface) => {
    assert.deepEqual(manifest.forbidden_authority_flags[surface], {
      can_write_domain_truth: false,
      can_sign_owner_receipt: false,
      can_create_domain_typed_blocker: false,
      can_authorize_quality_export_publication_or_review_verdict: false,
    });
  });

  [
    'domain_ready',
    'visual_ready',
    'exportable',
    'handoffable',
    'production_visual_stage_long_soak_complete',
    'production_ready',
    'physical_delete_authorized',
  ].forEach((claim) => assert.equal(manifest.non_claims[claim], false, claim));
});
