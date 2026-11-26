import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

test('single root opl.package.v2 manifest aligns RCA identity, versions, and UI boundaries', () => {
  const manifest = readJson('opl-package.json');
  const domainDescriptor = readJson('contracts/domain_descriptor.json');
  const registration = readJson('contracts/opl_domain_manifest_registration.json');
  const packageJson = readJson('package.json');
  const packageLock = readJson('package-lock.json');
  const pyproject = fs.readFileSync(path.join(repoRoot, 'pyproject.toml'), 'utf8');
  const uvLock = fs.readFileSync(path.join(repoRoot, 'uv.lock'), 'utf8');
  const pyprojectVersion = pyproject.match(/^version = "([^"]+)"$/m);
  const uvProjectVersion = uvLock.match(/\[\[package\]\]\nname = "redcube-ai"\nversion = "([^"]+)"/m);

  assert.equal(manifest.schema_version, 'opl.package.v2');
  assert.equal(manifest.identity.id, 'rca');
  assert.equal(manifest.identity.intent, 'agent');
  assert.equal(manifest.identity.publisher, 'one-person-lab');
  assert.equal(manifest.identity.license, 'Apache-2.0');
  assert.deepEqual(manifest.identity.name, { 'zh-CN': 'RedCube AI', 'en-US': 'RedCube AI' });
  assert.deepEqual(manifest.identity.summary, {
    'zh-CN': '以图像为核心的视觉内容设计、生成、评审与交付。',
    'en-US': 'Image-first visual content design, generation, review, and delivery.',
  });
  assert.match(manifest.identity.version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  assert.equal(packageJson.version, manifest.identity.version);
  assert.equal(packageLock.version, manifest.identity.version);
  assert.equal(packageLock.packages[''].version, manifest.identity.version);
  assert.equal(pyprojectVersion?.[1], manifest.identity.version);
  assert.equal(uvProjectVersion?.[1], manifest.identity.version);
  assert.equal(domainDescriptor.package_id, manifest.identity.id);
  assert.equal(registration.agent_id, manifest.identity.id);

  assert.equal(fs.existsSync(path.join(repoRoot, manifest.identity.icon)), true);
  assert.equal(manifest.provides.agent.stages_ref, 'agent/stages/manifest.json');
  assert.equal(fs.existsSync(path.join(repoRoot, manifest.provides.agent.stages_ref)), true);
  assert.deepEqual(manifest.provides.skills, [
    { id: 'redcube-ai', path: './agent/primary_skill', exposure: 'default' },
  ]);
  assert.deepEqual(manifest.provides.contribution_handler, {
    kind: 'cli',
    argv: ['node', './agent/tools/app-contribution.mjs'],
    transport: 'stdin_json_stdout_json',
  });
  assert.equal(fs.existsSync(path.join(repoRoot, 'agent/tools/app-contribution.mjs')), true);

  assert.deepEqual(
    manifest.ui.declarative.views.map((view) => view.id),
    ['rca.workspace.status', 'rca.workspace.artifacts'],
  );
  assert.deepEqual(manifest.host_hints.codex, {
    sync_enabled: true,
    plugin_name: 'redcube-ai',
    category: 'Creative',
    brand_color: '#C65D2E',
    capabilities: ['Interactive', 'Write'],
  });
  assert.notEqual(manifest.host_hints.codex.plugin_name, manifest.identity.id);
  assert.deepEqual(manifest.distribution, {
    oci: 'ghcr.io/gaofeng21cn/one-person-lab-packages/rca',
    visibility: 'public',
  });

  for (const legacyPath of [
    '.codex-plugin',
    '.agents',
    'plugins',
    'app-contribution-adapter.json',
    'contracts/carrier_projection.json',
    'contracts/opl_agent_package_manifest.json',
    'scripts/sync_carrier.py',
  ]) {
    assert.equal(fs.existsSync(path.join(repoRoot, legacyPath)), false, `${legacyPath} must be removed in v2`);
  }
});
