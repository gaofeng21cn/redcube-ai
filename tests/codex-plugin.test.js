import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { handleContributionRequest } from '../agent/tools/app-contribution.mjs';
import { mkUserScopedTestWorkspace } from './helpers/test-workspace.js';

const repoRoot = path.resolve('.');
const manifestPath = path.join(repoRoot, 'opl-package.json');
const canonicalSkillPath = path.join(repoRoot, 'agent', 'primary_skill', 'SKILL.md');
const skillUiMetadataPath = path.join(repoRoot, 'agent', 'primary_skill', 'agents', 'openai.yaml');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

test('v2 primary skill, branding icon, and Codex metadata stay canonical without plugins/ mirrors', () => {
  const manifest = readJson(manifestPath);
  const skillText = readFileSync(canonicalSkillPath, 'utf-8');
  const metadataText = readFileSync(skillUiMetadataPath, 'utf-8');

  assert.equal(existsSync(path.join(repoRoot, 'plugins')), false);
  assert.equal(existsSync(path.join(repoRoot, '.codex-plugin')), false);
  assert.equal(existsSync(path.join(repoRoot, '.agents')), false);
  assert.equal(existsSync(path.join(repoRoot, 'scripts', 'sync_carrier.py')), false);
  assert.equal(existsSync(path.join(repoRoot, 'scripts', 'install-codex-plugin.ts')), false);

  assert.equal(manifest.schema_version, 'opl.package.v2');
  assert.equal(manifest.host_hints.codex.sync_enabled, true);
  assert.equal(manifest.host_hints.codex.plugin_name, 'redcube-ai');
  assert.equal(existsSync(path.join(repoRoot, manifest.identity.icon)), true);
  assert.match(metadataText, /display_name: "RedCube AI"/);
  assert.match(metadataText, /default_prompt: "Use \$redcube-ai/);
  assert.match(skillText, /^name: redcube-ai$/m);
});

test('hosted RCA stage manifest and action catalog resolve cleanly from canonical sources', () => {
  const manifest = readJson(manifestPath);
  const actionCatalog = readJson(path.join(repoRoot, 'contracts', 'action_catalog.json'));
  const domainDescriptor = readJson(path.join(repoRoot, manifest.provides.agent.stages_ref === 'agent/stages/manifest.json'
    ? 'contracts/domain_descriptor.json'
    : manifest.provides.agent.stages_ref));

  assert.equal(domainDescriptor.package_id, 'rca');
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

test('RCA contribution_handler reports unavailable when unconfigured and reads real workspace state', (t) => {
  const unconfigured = handleContributionRequest({
    schema_version: 'opl-package-app-contribution-request.v1',
    operation: 'read',
    package_id: 'rca',
    ref: 'rca.workspace.v1#status',
    input: {},
  });
  assert.equal(unconfigured.ok, true);
  assert.equal(unconfigured.state, 'unavailable');
  assert.equal(unconfigured.reason, 'workspace_not_configured');

  const ws = mkUserScopedTestWorkspace('redcube-contrib-');
  mkdirSync(path.join(ws, 'artifacts'), { recursive: true });
  writeFileSync(path.join(ws, 'workspace.json'), JSON.stringify({
    status: 'in_progress',
    stages: [{ stage_id: 'visual_direction', status: 'completed' }],
  }));
  writeFileSync(path.join(ws, 'artifacts', 'deck.pptx'), 'pptx-placeholder');

  const statusRes = spawnSync(process.execPath, ['agent/tools/app-contribution.mjs'], {
    cwd: repoRoot,
    input: JSON.stringify({
      schema_version: 'opl-package-app-contribution-request.v1',
      operation: 'read',
      package_id: 'rca',
      ref: 'rca.workspace.v1#status',
      input: { workspace_root: ws },
    }),
    encoding: 'utf8',
    env: { ...process.env, OPL_PROFILE_WORKSPACE: '' },
  });
  assert.equal(statusRes.status, 0, statusRes.stderr);
  const statusBody = JSON.parse(statusRes.stdout);
  assert.equal(statusBody.ok, true);
  assert.equal(statusBody.state, 'ready');
  assert.equal(statusBody.data.stages.length, 1);
  assert.equal(statusBody.data.stages[0].stage_id, 'visual_direction');

  const artifactsRes = spawnSync(process.execPath, ['agent/tools/app-contribution.mjs'], {
    cwd: repoRoot,
    input: JSON.stringify({
      schema_version: 'opl-package-app-contribution-request.v1',
      operation: 'read',
      package_id: 'rca',
      ref: 'rca.workspace.v1#artifacts',
      input: {},
    }),
    encoding: 'utf8',
    env: { ...process.env, OPL_PROFILE_WORKSPACE: ws },
  });
  assert.equal(artifactsRes.status, 0, artifactsRes.stderr);
  const artifactsBody = JSON.parse(artifactsRes.stdout);
  assert.equal(artifactsBody.ok, true);
  assert.equal(artifactsBody.state, 'ready');
  assert.deepEqual(artifactsBody.data.artifacts, [
    { name: 'deck.pptx', path: 'artifacts/deck.pptx', kind: 'file' },
  ]);

  const execRes = handleContributionRequest({
    schema_version: 'opl-package-app-contribution-request.v1',
    operation: 'execute',
    package_id: 'rca',
    action_id: 'rca.noop',
    payload: {},
  });
  assert.equal(execRes.ok, false);
  assert.equal(execRes.state, 'unsupported_action');
});
