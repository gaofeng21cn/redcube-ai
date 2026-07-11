import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

test('repo-local OPL agent package manifest keeps RCA package and authority boundaries explicit', () => {
  const manifest = readJson('contracts/opl_agent_package_manifest.json');
  const domainDescriptor = readJson('contracts/domain_descriptor.json');
  const registration = readJson('contracts/opl_domain_manifest_registration.json');

  assert.equal(manifest.surface_kind, 'opl_agent_package_manifest.v1');
  assert.equal(manifest.agent_id, 'rca');
  assert.equal(manifest.package_id, 'redcube-ai');
  assert.equal(manifest.source, 'first_party_repo_local');
  assert.equal(manifest.source_contract.central_manifest_ref, 'one-person-lab/contracts/opl-framework/agent-packages/rca.json');
  assert.equal(manifest.source_contract.central_package_id, 'redcube-ai');
  assert.equal(manifest.source_contract.repo_canonical_agent_id, registration.agent_id);
  assert.equal(domainDescriptor.package_id, manifest.package_id);

  assert.equal(manifest.carrier_source_role, 'codex_plugin_default_carrier_not_package_truth');
  assert.equal(manifest.codex_surface.plugin_id, 'redcube-ai');
  assert.deepEqual(manifest.codex_surface.required_skill_ids, ['redcube-ai']);
  assert.deepEqual(manifest.required_skill_ids, ['redcube-ai']);
  assert.deepEqual(manifest.distribution_payload.required_skill_pack_lock_refs, []);
  assert.equal(manifest.distribution_payload.live_download_proof, false);
  assert.equal(manifest.distribution_payload.installed_reload_proof, false);
  assert.equal(manifest.distribution_payload.install_truth, 'resolved_digest_lock');
  assert.equal(manifest.rollback_ref, 'rollback-ref:redcube-ai/unavailable');

  assert.equal(manifest.authority_boundary.package_core_owner, 'opl_connect_agent_package_registry');
  assert.equal(manifest.authority_boundary.domain_truth_owner, 'redcube_ai');
  assert.equal(manifest.authority_boundary.rca_owns_visual_truth, true);
  assert.equal(manifest.authority_boundary.rca_owns_review_export_verdict, true);
  assert.equal(manifest.authority_boundary.rca_owns_artifact_authority, true);
  assert.equal(manifest.authority_boundary.repo_can_own_generic_runtime, false);
  assert.equal(manifest.authority_boundary.repo_can_own_generic_package_manager, false);
  assert.equal(manifest.authority_boundary.manifest_can_write_domain_truth, false);
  assert.equal(manifest.authority_boundary.manifest_can_sign_owner_receipt, false);
  assert.equal(manifest.authority_boundary.manifest_can_create_typed_blocker, false);
  assert.equal(manifest.authority_boundary.manifest_can_write_runtime_queue, false);
  assert.equal(manifest.authority_boundary.manifest_can_claim_runtime_readiness, false);
  assert.equal(manifest.authority_boundary.manifest_can_claim_release_readiness, false);
});
