import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const repoRoot = path.resolve('.');
const pluginRoot = path.join(repoRoot, 'plugins', 'redcube-ai');
const rootPluginManifestPath = path.join(repoRoot, '.codex-plugin', 'plugin.json');
const rootPackageDescriptorPath = path.join(repoRoot, 'opl-package.json');
const pluginManifestPath = path.join(pluginRoot, '.codex-plugin', 'plugin.json');
const portablePluginManifestPath = path.join(pluginRoot, 'plugin.json');
const packageDescriptorPath = path.join(pluginRoot, 'opl-package.json');
const marketplacePath = path.join(repoRoot, '.agents', 'plugins', 'marketplace.json');
const pluginIconPath = path.join(pluginRoot, 'assets', 'icon.png');
const pluginSkillPath = path.join(pluginRoot, 'skills', 'redcube-ai', 'SKILL.md');
const canonicalSkillPath = path.join(repoRoot, 'agent', 'primary_skill', 'SKILL.md');
const pluginSkillUiMetadataPath = path.join(pluginRoot, 'skills', 'redcube-ai', 'agents', 'openai.yaml');
function readJson(filePath) { return JSON.parse(readFileSync(filePath, 'utf-8')); }
const forbiddenLifecycleBasisFields = new Set([
  'content_lock',
  'dependency_resolution',
  'distribution_payload',
  'durable_transaction',
  'installed_lock',
  'last_known_good',
  'lifecycle',
  'lifecycle_receipt',
  'lifecycle_receipt_owner',
  'lkg',
  'lock_owner',
  'materialization',
  'materialization_readiness',
  'materializer',
  'opl_managed_surface',
  'package_core',
  'package_lock_ref',
  'payload',
  'payload_digest_ref',
  'receipt_ref',
  'resolver',
  'rollback',
  'rollback_ref',
  'transaction',
  'update_channel',
]);
function assertNoLegacyLifecycleBasis(value, valuePath = 'descriptor') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoLegacyLifecycleBasis(item, `${valuePath}[${index}]`));
    return;
  }
  if (value === null || typeof value !== 'object') return;
  for (const [key, nestedValue] of Object.entries(value)) {
    assert.equal(forbiddenLifecycleBasisFields.has(key), false, `${valuePath}.${key}`);
    assertNoLegacyLifecycleBasis(nestedValue, `${valuePath}.${key}`);
  }
}
test('codex plugin scaffold tracks repo metadata and skill layout', () => {
  const packageJson = readJson(path.join(repoRoot, 'package.json'));
  const packageManifest = readJson(path.join(repoRoot, 'contracts', 'opl_agent_package_manifest.json'));
  const manifest = readJson(pluginManifestPath);
  const skillText = readFileSync(pluginSkillPath, 'utf-8');
  const canonicalSkillText = readFileSync(canonicalSkillPath, 'utf-8');
  const metadataText = readFileSync(pluginSkillUiMetadataPath, 'utf-8');

  assert.equal(manifest.name, 'redcube-ai');
  assert.equal(manifest.version, packageJson.version);
  assert.equal(manifest.skills, './skills/');
  assert.equal(manifest.interface.displayName, 'RedCube AI');
  assert.equal(manifest.interface.category, 'Creative');
  assert.equal(manifest.interface.composerIcon, './assets/icon.png');
  assert.equal(manifest.interface.logo, './assets/icon.png');
  assert.equal(manifest.description, packageManifest.presentation.description_i18n['en-US']);
  assert.equal(existsSync(pluginIconPath), true);
  assert.match(metadataText, /display_name: "RedCube AI"/);
  assert.match(metadataText, /default_prompt: "Use \$redcube-ai/);
  assert.match(skillText, /^name: redcube-ai$/m);
  assert.equal(skillText, canonicalSkillText);
  assert.equal(existsSync(path.join(repoRoot, 'plugins', 'rca')), false);
  assert.equal(existsSync(path.join(pluginRoot, 'skills', 'rca')), false);
});

test('repo marketplace exposes the Codex carrier without taking RCA package authority', () => {
  const marketplace = readJson(marketplacePath);
  const pluginManifest = readJson(pluginManifestPath);
  const packageManifest = readJson(path.join(repoRoot, 'contracts', 'opl_agent_package_manifest.json'));

  assert.equal(marketplace.name, 'redcube-ai');
  assert.equal(marketplace.interface.displayName, 'RedCube AI');
  assert.equal(marketplace.plugins.length, 1);
  assert.deepEqual(marketplace.plugins[0], {
    name: 'redcube-ai',
    source: {
      source: 'local',
      path: './plugins/redcube-ai',
    },
    policy: {
      installation: 'AVAILABLE',
      authentication: 'ON_INSTALL',
    },
    category: 'Creative',
  });
  assert.equal(marketplace.plugins[0].name, pluginManifest.name);
  assert.equal(packageManifest.package_id, 'rca');
  assert.notEqual(marketplace.plugins[0].name, packageManifest.package_id);
});

test('nested native carrier keeps the hosted RCA runtime owned by the repo', () => {
  const marketplace = readJson(marketplacePath);
  const marketplacePluginRoot = path.resolve(repoRoot, marketplace.plugins[0].source.path);
  const pluginManifest = readJson(pluginManifestPath);
  const canonicalDescriptorPath = path.join(repoRoot, 'contracts', 'opl_agent_package_manifest.json');
  const ownerDescriptor = readJson(canonicalDescriptorPath);
  const carrierDescriptor = readJson(packageDescriptorPath);
  const actionCatalog = readJson(path.join(repoRoot, ownerDescriptor.entrypoints
    .find(({ entrypoint_id }) => entrypoint_id === 'hosted_stage_actions').source_ref));

  assert.equal(marketplacePluginRoot, pluginRoot);
  assert.equal(pluginManifest.skills, './skills/');
  assert.equal(pluginManifest.version, ownerDescriptor.version);
  assert.equal(carrierDescriptor.version, ownerDescriptor.version);
  assert.equal(
    readFileSync(rootPackageDescriptorPath, 'utf-8'),
    readFileSync(canonicalDescriptorPath, 'utf-8'),
  );
  assert.equal(ownerDescriptor.codex_surface.carrier_source_path, '.');
  assertNoLegacyLifecycleBasis(ownerDescriptor);
  assertNoLegacyLifecycleBasis(carrierDescriptor);
  assert.equal(existsSync(path.join(repoRoot, ownerDescriptor.source_contract.domain_descriptor_ref)), true);
  assert.equal(existsSync(path.join(repoRoot, 'contracts', 'action_catalog.json')), true);

  const stageManifestRefs = new Set(actionCatalog.actions.map(
    ({ execution_binding }) => execution_binding.stage_manifest_ref,
  ));
  assert.deepEqual([...stageManifestRefs], ['agent/stages/manifest.json']);
  for (const stageManifestRef of stageManifestRefs) {
    const stageManifestPath = path.join(repoRoot, stageManifestRef);
    const stageManifest = readJson(stageManifestPath);
    assert.equal(existsSync(stageManifestPath), true);
    for (const stage of stageManifest.stages) {
      assert.equal(existsSync(path.join(repoRoot, stage.policy_ref)), true, stage.policy_ref);
    }
  }
});

test('native package descriptor exposes RCA without recreating package lifecycle authority', () => {
  const packageJson = readJson(path.join(repoRoot, 'package.json'));
  const pluginManifest = readJson(pluginManifestPath);
  const descriptor = readJson(packageDescriptorPath);

  assert.equal(descriptor.surface_kind, 'opl_agent_package_manifest.v1');
  assert.equal(descriptor.kind, 'agent');
  assert.equal(descriptor.agent_id, 'rca');
  assert.equal(descriptor.package_id, 'rca');
  assert.equal(descriptor.domain_id, 'redcube_ai');
  assert.equal(descriptor.version, packageJson.version);
  assert.equal(descriptor.version, pluginManifest.version);
  assert.equal(descriptor.carrier_source_role, 'codex_plugin_default_carrier_not_package_truth');
  assert.deepEqual(descriptor.codex_surface, {
    plugin_id: 'redcube-ai',
    plugin_source_path: '.',
    configured_codex_plugin_carrier: {
      kind: 'codex_plugin_manager',
      plugin_selector: 'redcube-ai@redcube-ai',
      executor_route: 'codex_cli',
      marketplace_source: 'gaofeng21cn/redcube-ai',
      publication_ref: 'ghcr.io/gaofeng21cn/one-person-lab-packages/rca:latest-stable',
    },
    required_skill_ids: ['redcube-ai'],
  });
  assert.deepEqual(descriptor.requires, []);
  assert.deepEqual(descriptor.capability_dependencies, []);
  assert.equal(descriptor.domain_descriptor_ref, 'contracts/domain_descriptor.json');
  assert.equal(
    descriptor.task_provider_ref,
    'contracts/domain_descriptor.json#/standard_agent_interface/stage_catalog',
  );
  assert.equal(descriptor.action_catalog_ref, 'contracts/action_catalog.json');
  assert.deepEqual(descriptor.view_refs, []);
  assert.deepEqual(descriptor.entrypoints.map(({ entrypoint_id }) => entrypoint_id), [
    'codex_primary_skill',
    'hosted_stage_actions',
  ]);
  assert.deepEqual(descriptor.presentation.home_shortcuts, [{
    shortcut_id: 'invoke_product_entry',
    label_i18n: {
      'zh-CN': '制作视觉交付物',
      'en-US': 'Create or continue a visual deliverable',
    },
    default_visible: true,
    user_configurable: true,
    route: {
      route_kind: 'agent_package_shortcut',
      executor: 'codex_cli',
      codex_visible_entry: 'redcube-ai',
    },
  }]);

  for (const forbiddenField of [
    'authority_boundary',
    'configured_codex_plugin_carrier',
    'content_lock',
    'distribution_payload',
    'health_check',
    'lifecycle',
    'machine_boundary',
    'managed_shell',
    'opl_managed_surface',
    'package_core',
    'permissions',
    'receipt_ref',
    'resolver',
    'rollback_ref',
    'source_contract',
    'transaction',
    'update_channel',
  ]) {
    assert.equal(
      Object.hasOwn(descriptor, forbiddenField),
      false,
      `${forbiddenField} must remain outside the installed owner descriptor`,
    );
  }
  assertNoLegacyLifecycleBasis(descriptor);
});

test('nested Codex carrier remains a synchronized compatibility surface without a repo-local installer', () => {
  const packageJson = readJson(path.join(repoRoot, 'package.json'));
  const rootPluginManifest = readJson(rootPluginManifestPath);
  const nestedPluginManifest = readJson(pluginManifestPath);
  const portablePluginManifest = readJson(portablePluginManifestPath);
  const nestedDescriptor = readJson(packageDescriptorPath);

  assert.equal(rootPluginManifest.version, packageJson.version);
  assert.equal(nestedPluginManifest.version, packageJson.version);
  assert.equal(portablePluginManifest.version, packageJson.version);
  assert.equal(
    portablePluginManifest.$schema,
    'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
  );
  assert.equal(portablePluginManifest.name, nestedPluginManifest.name);
  assert.deepEqual(
    portablePluginManifest.extensions['com.openai'].interface,
    nestedPluginManifest.interface,
  );
  assert.equal(Object.hasOwn(portablePluginManifest, 'skills'), false);
  assert.equal(existsSync(path.join(pluginRoot, 'mcp.json')), false);
  assert.equal(nestedDescriptor.version, packageJson.version);
  assert.equal(existsSync(path.join(repoRoot, 'scripts', 'install-codex-plugin.ts')), false);
});
