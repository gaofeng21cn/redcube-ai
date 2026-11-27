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
  assert.equal(unconfigured.operation, 'read');
  assert.equal(unconfigured.ref, 'rca.workspace.v1#status');
  assert.equal(unconfigured.result.state, 'unavailable');
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
  assert.equal(statusBody.operation, 'read');
  assert.equal(statusBody.ref, 'rca.workspace.v1#status');
  assert.equal(statusBody.result.state, 'ready');
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
  assert.equal(artifactsBody.operation, 'read');
  assert.equal(artifactsBody.ref, 'rca.workspace.v1#artifacts');
  assert.equal(artifactsBody.result.state, 'ready');
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
  assert.equal(execRes.operation, 'execute');
  assert.equal(execRes.ref, 'rca.noop');
});

test('RCA contribution handler rejects non-v2 request identities', () => {
  for (const request of [
    { schema_version: 'opl-package-app-contribution-request.v0', package_id: 'rca', operation: 'read', ref: 'rca.workspace.v1#status' },
    { schema_version: 'opl-package-app-contribution-request.v1', package_id: 'other', operation: 'read', ref: 'rca.workspace.v1#status' },
  ]) {
    const response = handleContributionRequest(request);
    assert.equal(response.ok, false);
    assert.equal(response.error.code, 'INVALID_REQUEST');
  }
});

test('RCA contribution reads the selected existing project and its registered outputs', () => {
  const workspace = mkUserScopedTestWorkspace('redcube-registered-projects-');
  const projects = ['deck-a', 'deck-b'].map((project_id) => ({
    project_id,
    project_root: 'projects/' + project_id,
    current_stage_pointer_ref: 'projects/' + project_id + '/artifacts/stage_outputs/current_stage.json',
  }));
  writeFileSync(path.join(workspace, 'workspace_index.json'), JSON.stringify({ projects }));
  for (const project of projects) {
    const root = path.join(workspace, project.project_root);
    mkdirSync(path.join(root, 'artifacts/stage_outputs'), { recursive: true });
    mkdirSync(path.join(root, 'control/opl/artifact_lifecycle'), { recursive: true });
    writeFileSync(path.join(workspace, project.current_stage_pointer_ref), JSON.stringify({
      surface_kind: 'opl_current_stage_pointer',
      project_id: project.project_id,
      current_stage: {
        stage_id: project.project_id === 'deck-a' ? 'visual_direction' : 'export',
        status: 'completed',
      },
    }));
    writeFileSync(path.join(root, 'artifacts', 'deck.pptx'), 'registered deck');
    writeFileSync(path.join(root, 'artifacts', 'scratch.pptx'), 'unregistered draft');
    writeFileSync(path.join(root, 'control/opl/artifact_lifecycle/output_lifecycle.json'), JSON.stringify({
      surface_kind: 'opl_workspace_output_lifecycle',
      project_id: project.project_id,
      project_root: project.project_root,
      artifacts: [
        { ref: project.project_root + '/artifacts/deck.pptx', exists: true },
        { ref: 'projects/deck-b/artifacts/deck.pptx', exists: true },
      ],
    }));
  }

  function read(view, input = {}) {
    const result = spawnSync(process.execPath, ['agent/tools/app-contribution.mjs'], {
      cwd: repoRoot,
      input: JSON.stringify({
        schema_version: 'opl-package-app-contribution-request.v1',
        operation: 'read',
        package_id: 'rca',
        ref: 'rca.workspace.v1#' + view,
        input,
      }),
      encoding: 'utf8',
      env: { ...process.env, OPL_PROFILE_WORKSPACE: workspace },
    });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  }

  const choices = read('status');
  assert.equal(choices.state, 'input_required');
  assert.equal(choices.operation, 'read');
  assert.equal(choices.ref, 'rca.workspace.v1#status');
  assert.equal(choices.result.state, 'input_required');
  assert.deepEqual(choices.input_schema.properties.project_id.enum, ['deck-a', 'deck-b']);

  const selection = {
    workspace_path: workspace,
    work_item_identity: {
      identity_state: 'resolved',
      agent_id: 'rca',
      domain_work_item_id: 'deck-a',
      workspace_path: workspace,
      work_item_root: path.join(workspace, 'projects/deck-a'),
    },
  };
  const status = read('status', selection);
  assert.equal(status.state, 'ready');
  assert.equal(status.result.state, 'ready');
  assert.equal(status.data.project_id, 'deck-a');
  assert.deepEqual(status.data.stages, [{ stage_id: 'visual_direction', status: 'completed' }]);

  const artifacts = read('artifacts', selection);
  assert.equal(artifacts.state, 'ready');
  assert.equal(artifacts.operation, 'read');
  assert.equal(artifacts.ref, 'rca.workspace.v1#artifacts');
  assert.equal(artifacts.result.state, 'ready');
  assert.deepEqual(artifacts.data.items.map((item) => item.source_ref), ['projects/deck-a/artifacts/deck.pptx']);
  assert.equal(read('artifacts', { project_id: 'missing' }).state, 'unavailable');
  assert.equal(read('artifacts', { ...selection, project_id: 'deck-b' }).state, 'unavailable');

  const second = read('artifacts', { project_id: 'deck-b' });
  assert.deepEqual(second.data.items.map((item) => item.source_ref), ['projects/deck-b/artifacts/deck.pptx']);
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

test('RCA contribution_handler CLI fails closed with exit code 2 on non-read and malformed requests', () => {
  const runRawCli = (rawInput) => spawnSync(process.execPath, ['agent/tools/app-contribution.mjs'], {
    cwd: repoRoot,
    input: rawInput,
    encoding: 'utf8',
    env: { ...process.env, OPL_PROFILE_WORKSPACE: '' },
  });

  const executeRes = runRawCli(JSON.stringify({
    schema_version: 'opl-package-app-contribution-request.v1',
    operation: 'execute',
    package_id: 'rca',
    action_id: 'rca.noop',
    payload: {},
    dry_run: false,
  }));
  assert.equal(executeRes.status, 2, executeRes.stderr);
  const executeBody = JSON.parse(executeRes.stdout);
  assert.equal(executeBody.ok, false);
  assert.equal(executeBody.state, 'unsupported_action');
  assert.equal(executeBody.action_id, 'rca.noop');
  assert.equal(executeBody.error?.code, 'UNSUPPORTED_ACTION');

  const invalidJsonRes = runRawCli('{not-valid-json');
  assert.equal(invalidJsonRes.status, 2, invalidJsonRes.stderr);
  const invalidJsonBody = JSON.parse(invalidJsonRes.stdout);
  assert.equal(invalidJsonBody.ok, false);
  assert.equal(invalidJsonBody.state, 'invalid_request');
  assert.equal(invalidJsonBody.error?.code, 'INVALID_JSON');

  const unsupportedOpRes = runRawCli(JSON.stringify({
    schema_version: 'opl-package-app-contribution-request.v1',
    operation: 'unknown',
    package_id: 'rca',
  }));
  assert.equal(unsupportedOpRes.status, 2, unsupportedOpRes.stderr);
  const unsupportedOpBody = JSON.parse(unsupportedOpRes.stdout);
  assert.equal(unsupportedOpBody.ok, false);
  assert.equal(unsupportedOpBody.state, 'unsupported_operation');
  assert.equal(unsupportedOpBody.error?.code, 'UNSUPPORTED_OPERATION');

  for (const missingOpPayload of [
    JSON.stringify({ schema_version: 'opl-package-app-contribution-request.v1', package_id: 'rca' }),
    JSON.stringify({ operation: '' }),
    JSON.stringify(['not', 'an', 'object']),
  ]) {
    const invalidReqRes = runRawCli(missingOpPayload);
    assert.equal(invalidReqRes.status, 2, invalidReqRes.stderr);
    const invalidReqBody = JSON.parse(invalidReqRes.stdout);
    assert.equal(invalidReqBody.ok, false);
    assert.equal(invalidReqBody.state, 'invalid_request');
    assert.equal(invalidReqBody.error?.code, 'INVALID_REQUEST');
  }
});
