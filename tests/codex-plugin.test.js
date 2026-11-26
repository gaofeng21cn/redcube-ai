import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
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

test('RCA contribution_handler blocks path traversal, outside OPL_PROFILE_WORKSPACE, and symlink escapes', () => {
  const runCli = (envelope, envOverrides = {}) => {
    const res = spawnSync(process.execPath, ['agent/tools/app-contribution.mjs'], {
      cwd: repoRoot,
      input: JSON.stringify(envelope),
      encoding: 'utf8',
      env: { ...process.env, ...envOverrides },
    });
    assert.equal(res.status, 0, res.stderr);
    return JSON.parse(res.stdout);
  };

  for (const traversalPath of ['../../../../../etc', './relative/ws', '/tmp/../etc', 123]) {
    const body = runCli({
      schema_version: 'opl-package-app-contribution-request.v1',
      operation: 'read',
      package_id: 'rca',
      ref: 'rca.workspace.v1#status',
      input: { workspace_root: traversalPath },
    }, { OPL_PROFILE_WORKSPACE: '' });
    assert.equal(body.ok, false);
    assert.equal(body.state, 'unavailable');
    assert.equal(body.reason, 'invalid_workspace_root');
    assert.equal(body.error?.code, 'INVALID_WORKSPACE_ROOT');
    assert.equal(body.workspace_root, undefined);
    assert.equal(JSON.stringify(body).includes('/private/etc'), false);
  }

  const allowedWs = mkUserScopedTestWorkspace('redcube-allowed-');
  const outsideDir = mkUserScopedTestWorkspace('redcube-outside-');
  const nestedAllowed = path.join(allowedWs, 'nested-project');
  mkdirSync(nestedAllowed, { recursive: true });
  writeFileSync(path.join(nestedAllowed, 'workspace.json'), JSON.stringify({
    status: 'active',
    stages: [{ stage_id: 'inside_stage', status: 'completed' }],
  }));
  writeFileSync(path.join(outsideDir, 'secret.json'), JSON.stringify({
    status: 'hijacked',
    stages: [{ stage_id: 'evil_stage', status: 'pwned' }],
  }));
  writeFileSync(path.join(outsideDir, 'index-secret.json'), JSON.stringify({
    projects: { leaked_project: { name: 'leaked' } },
  }));
  writeFileSync(path.join(outsideDir, 'outside.txt'), 'secret-artifact');
  mkdirSync(path.join(outsideDir, 'outside-dir'), { recursive: true });

  const symlinkEscapeWs = path.join(allowedWs, 'symlink-escape-ws');
  symlinkSync(outsideDir, symlinkEscapeWs, 'dir');

  for (const outsideCandidate of [outsideDir, symlinkEscapeWs]) {
    const body = runCli({
      schema_version: 'opl-package-app-contribution-request.v1',
      operation: 'read',
      package_id: 'rca',
      ref: 'rca.workspace.v1#status',
      input: { workspace_root: outsideCandidate },
    }, { OPL_PROFILE_WORKSPACE: allowedWs });
    assert.equal(body.ok, false);
    assert.equal(body.state, 'unavailable');
    assert.equal(body.reason, 'workspace_root_outside_allowed_boundary');
    assert.equal(body.error?.code, 'WORKSPACE_ROOT_OUTSIDE_ALLOWED_BOUNDARY');
    assert.equal(body.workspace_root, undefined);
    assert.equal(JSON.stringify(body).includes(outsideDir), false);
  }

  const allowedBody = runCli({
    schema_version: 'opl-package-app-contribution-request.v1',
    operation: 'read',
    package_id: 'rca',
    ref: 'rca.workspace.v1#status',
    input: { workspace_root: nestedAllowed },
  }, { OPL_PROFILE_WORKSPACE: allowedWs });
  assert.equal(allowedBody.ok, true);
  assert.equal(allowedBody.state, 'ready');
  assert.deepEqual(allowedBody.data.stages, [{ stage_id: 'inside_stage', status: 'completed' }]);

  const wsWithSymlinks = mkUserScopedTestWorkspace('redcube-symlink-contained-');
  mkdirSync(path.join(wsWithSymlinks, 'runtime-state'), { recursive: true });
  mkdirSync(path.join(wsWithSymlinks, 'artifacts'), { recursive: true });
  mkdirSync(path.join(wsWithSymlinks, 'deliverables'), { recursive: true });

  symlinkSync(path.join(outsideDir, 'secret.json'), path.join(wsWithSymlinks, 'workspace.json'));
  symlinkSync(path.join(outsideDir, 'index-secret.json'), path.join(wsWithSymlinks, 'workspace_index.json'));
  symlinkSync(path.join(outsideDir, 'secret.json'), path.join(wsWithSymlinks, 'runtime-state', 'evil.json'));
  symlinkSync(path.join(outsideDir, 'outside.txt'), path.join(wsWithSymlinks, 'artifacts', 'escape.txt'));
  symlinkSync(path.join(outsideDir, 'outside-dir'), path.join(wsWithSymlinks, 'deliverables', 'escape-dir'));
  symlinkSync(path.join(outsideDir, 'nonexistent.txt'), path.join(wsWithSymlinks, 'artifacts', 'dangling.txt'));

  writeFileSync(path.join(wsWithSymlinks, 'runtime-state', 'legit.json'), JSON.stringify({
    stages: [{ stage_id: 'legit_stage', status: 'completed' }],
  }));
  writeFileSync(path.join(wsWithSymlinks, 'artifacts', 'legit.png'), 'png-bytes');
  writeFileSync(path.join(wsWithSymlinks, 'deliverables', 'legit-deliverable.pdf'), 'pdf-bytes');
  symlinkSync(path.join(outsideDir, 'outside.txt'), path.join(wsWithSymlinks, 'deliverables', 'escape.pdf'));

  const statusBody = runCli({
    schema_version: 'opl-package-app-contribution-request.v1',
    operation: 'read',
    package_id: 'rca',
    ref: 'rca.workspace.v1#status',
    input: { workspace_root: wsWithSymlinks },
  }, { OPL_PROFILE_WORKSPACE: '' });
  assert.equal(statusBody.ok, true);
  assert.equal(statusBody.state, 'ready');
  assert.deepEqual(statusBody.data.projects, []);
  assert.deepEqual(statusBody.data.stages, [{ stage_id: 'legit_stage', status: 'completed' }]);
  assert.equal(statusBody.data.workspace_status, 'active');

  const artifactsBody = runCli({
    schema_version: 'opl-package-app-contribution-request.v1',
    operation: 'read',
    package_id: 'rca',
    ref: 'rca.workspace.v1#artifacts',
    input: { workspace_root: wsWithSymlinks },
  }, { OPL_PROFILE_WORKSPACE: '' });
  assert.equal(artifactsBody.ok, true);
  assert.equal(artifactsBody.state, 'ready');
  assert.deepEqual(artifactsBody.data.artifacts, [
    { name: 'legit.png', path: 'artifacts/legit.png', kind: 'file' },
    { name: 'legit-deliverable.pdf', path: 'deliverables/legit-deliverable.pdf', kind: 'file' },
  ]);

  const wsDirSymlinks = mkUserScopedTestWorkspace('redcube-dir-symlink-escape-');
  const outsideRuntimeState = path.join(outsideDir, 'outside-runtime-state');
  mkdirSync(outsideRuntimeState, { recursive: true });
  writeFileSync(path.join(outsideRuntimeState, 'secret.json'), JSON.stringify({
    stages: [{ stage_id: 'dir_escape_stage', status: 'pwned' }],
  }));
  symlinkSync(outsideRuntimeState, path.join(wsDirSymlinks, 'runtime-state'), 'dir');
  symlinkSync(outsideDir, path.join(wsDirSymlinks, 'artifacts'), 'dir');
  symlinkSync(outsideDir, path.join(wsDirSymlinks, 'deliverables'), 'dir');

  const dirEscapeStatus = runCli({
    schema_version: 'opl-package-app-contribution-request.v1',
    operation: 'read',
    package_id: 'rca',
    ref: 'rca.workspace.v1#status',
    input: { workspace_root: wsDirSymlinks },
  }, { OPL_PROFILE_WORKSPACE: allowedWs });
  assert.equal(dirEscapeStatus.ok, false);
  assert.equal(dirEscapeStatus.state, 'unavailable');
  assert.equal(dirEscapeStatus.reason, 'workspace_root_outside_allowed_boundary');

  const dirEscapeStatusDirect = runCli({
    schema_version: 'opl-package-app-contribution-request.v1',
    operation: 'read',
    package_id: 'rca',
    ref: 'rca.workspace.v1#status',
    input: { workspace_root: wsDirSymlinks },
  }, { OPL_PROFILE_WORKSPACE: '' });
  assert.equal(dirEscapeStatusDirect.ok, true);
  assert.equal(dirEscapeStatusDirect.state, 'empty');
  assert.deepEqual(dirEscapeStatusDirect.data.stages, []);

  const dirEscapeArtifactsDirect = runCli({
    schema_version: 'opl-package-app-contribution-request.v1',
    operation: 'read',
    package_id: 'rca',
    ref: 'rca.workspace.v1#artifacts',
    input: { workspace_root: wsDirSymlinks },
  }, { OPL_PROFILE_WORKSPACE: '' });
  assert.equal(dirEscapeArtifactsDirect.ok, true);
  assert.equal(dirEscapeArtifactsDirect.state, 'empty');
  assert.deepEqual(dirEscapeArtifactsDirect.data.artifacts, []);
});
