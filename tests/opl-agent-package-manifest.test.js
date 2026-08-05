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
  const pluginManifest = readJson('.codex-plugin/plugin.json');
  const compatibilityPluginManifest = readJson('plugins/redcube-ai/.codex-plugin/plugin.json');
  const packageJson = readJson('package.json');
  const packageLock = readJson('package-lock.json');
  const pyproject = fs.readFileSync(path.join(repoRoot, 'pyproject.toml'), 'utf8');
  const uvLock = fs.readFileSync(path.join(repoRoot, 'uv.lock'), 'utf8');
  const pyprojectVersion = pyproject.match(/^version = "([^"]+)"$/m);
  const uvProjectVersion = uvLock.match(/\[\[package\]\]\nname = "redcube-ai"\nversion = "([^"]+)"/m);

  assert.equal(manifest.surface_kind, 'opl_agent_package_manifest.v1');
  assert.equal(manifest.agent_id, 'rca');
  assert.equal(manifest.package_id, 'rca');
  assert.deepEqual(manifest.presentation, {
    display_name_i18n: { 'en-US': 'RedCube AI' },
    description_i18n: { 'en-US': 'Image-first visual deliverables through OPL' },
    session_routing_summary_i18n: {
      'en-US': 'Run the RCA visual-deliverable stages through the OPL-hosted StageRun controller while preserving RCA visual truth and review/export authority.',
    },
    home_shortcuts: [{
      shortcut_id: 'invoke_product_entry',
      label_i18n: { 'en-US': 'Create or continue a visual deliverable' },
      default_visible: true,
      user_configurable: true,
      route: {
        route_kind: 'agent_package_shortcut',
        executor: 'codex_cli',
        codex_visible_entry: 'redcube-ai',
      },
    }],
  });
  assert.match(manifest.version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  assert.equal(packageJson.version, manifest.version);
  assert.equal(packageLock.version, manifest.version);
  assert.equal(packageLock.packages[''].version, manifest.version);
  assert.equal(manifest.skill_packs[0].version, manifest.version);
  assert.equal(pyprojectVersion?.[1], manifest.version);
  assert.equal(uvProjectVersion?.[1], manifest.version);
  assert.equal(manifest.package_id, manifest.agent_id);
  assert.equal(manifest.source, 'first_party_repo_local');
  assert.equal(manifest.source_contract.central_manifest_ref, 'contracts/opl-framework/packages/rca.json');
  assert.equal(manifest.source_contract.central_package_id, 'rca');
  assert.equal(manifest.source_contract.repo_slug, 'redcube-ai');
  assert.equal(Object.hasOwn(manifest.source_contract, 'central_agent_id_alias'), false);
  assert.equal(manifest.source_contract.repo_canonical_agent_id, registration.agent_id);
  assert.equal(domainDescriptor.package_id, manifest.package_id);

  assert.equal(manifest.carrier_source_role, 'codex_plugin_default_carrier_not_package_truth');
  assert.equal(manifest.codex_surface.plugin_id, 'redcube-ai');
  assert.equal(manifest.codex_surface.carrier_source_path, '.');
  assert.deepEqual(manifest.codex_surface.configured_codex_plugin_carrier, {
    kind: 'codex_plugin_manager',
    plugin_selector: 'redcube-ai@redcube-ai',
    executor_route: 'codex_cli',
    marketplace_source: 'gaofeng21cn/redcube-ai',
    publication_ref: 'ghcr.io/gaofeng21cn/one-person-lab-packages/rca:latest-stable',
  });
  assert.equal(pluginManifest.name, 'redcube-ai');
  assert.equal(pluginManifest.version, manifest.version);
  assert.equal(compatibilityPluginManifest.version, manifest.version);
  assert.notEqual(pluginManifest.name, manifest.package_id);
  assert.equal(
    fs.readFileSync(path.join(repoRoot, 'opl-package.json'), 'utf8'),
    fs.readFileSync(path.join(repoRoot, 'contracts/opl_agent_package_manifest.json'), 'utf8'),
  );
  assert.deepEqual(manifest.codex_surface.required_skill_ids, ['redcube-ai']);
  assert.deepEqual(manifest.required_skill_ids, ['redcube-ai']);
  assert.equal(Object.hasOwn(manifest, 'distribution_payload'), false);
  assert.equal(Object.hasOwn(manifest, 'rollback_ref'), false);
  assert.equal(Object.hasOwn(manifest.package_core, 'lock_owner'), false);
  assert.equal(manifest.package_core.content_identity_fields.includes('package_lock_ref'), false);
  assert.match(manifest.machine_boundary, /compatibility-to-delete/);
  assert.doesNotMatch(manifest.machine_boundary, /owns package core, lock|owns [^.]*lifecycle receipt|owns [^.]*rollback readback/);

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
