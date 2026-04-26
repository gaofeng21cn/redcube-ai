import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import {
  cpSync,
  copyFileSync,
  mkdtempSync,
  mkdirSync,
  realpathSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import {
  startMockCodexCli,
  withEnv,
} from '../helpers/mock-codex-cli.js';

const execFileAsync = promisify(execFile);
const gatewayResolve = createRequire(path.resolve('packages/redcube-gateway/package.json'));

function copyPackageIntoInstall(sourceDir, targetDir) {
  cpSync(sourceDir, targetDir, {
    recursive: true,
    force: true,
  });
}

function createIsolatedCliInstall() {
  const installRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-isolated-'));
  const cliDir = path.join(installRoot, 'dist');
  const consumerNodeModulesDir = path.join(installRoot, 'node_modules', '@redcube');
  const gatewayPackagePath = path.join(consumerNodeModulesDir, 'gateway');
  const gatewayNodeModulesDir = path.join(gatewayPackagePath, 'node_modules', '@redcube');
  const runtimeProtocolPackagePath = path.join(gatewayNodeModulesDir, 'runtime-protocol');

  mkdirSync(cliDir, { recursive: true });
  mkdirSync(consumerNodeModulesDir, { recursive: true });

  const gatewaySourcePackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-gateway/package.json'), 'utf-8'),
  );

  copyFileSync(
    path.resolve('apps/redcube-cli/dist/cli.js'),
    path.join(cliDir, 'cli.js'),
  );
  copyFileSync(
    path.resolve('apps/redcube-cli/src/cli.ts'),
    path.join(cliDir, 'cli.ts'),
  );
  writeFileSync(
    path.join(installRoot, 'package.json'),
    JSON.stringify({
      name: 'redcube-cli-isolated-test',
      private: true,
      type: 'module',
      dependencies: {
        '@redcube/gateway': gatewaySourcePackageJson.version,
      },
    }, null, 2),
    'utf-8',
  );

  copyPackageIntoInstall(
    path.resolve('packages/redcube-gateway'),
    gatewayPackagePath,
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-protocol'),
    runtimeProtocolPackagePath,
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime'),
    path.join(gatewayNodeModulesDir, 'runtime'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-config'),
    path.join(gatewayNodeModulesDir, 'redcube-config'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-governance'),
    path.join(gatewayNodeModulesDir, 'governance'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-reference-os'),
    path.join(gatewayNodeModulesDir, 'reference-os'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-pack-ppt'),
    path.join(gatewayNodeModulesDir, 'pack-ppt'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-pack-xiaohongshu'),
    path.join(gatewayNodeModulesDir, 'pack-xiaohongshu'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-pack-poster-onepager'),
    path.join(gatewayNodeModulesDir, 'pack-poster-onepager'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-family-ppt'),
    path.join(gatewayNodeModulesDir, 'runtime-family-ppt'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-family-ppt'),
    path.join(gatewayPackagePath, 'node_modules', '@redcube', 'runtime-family-ppt'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-family-xiaohongshu'),
    path.join(gatewayNodeModulesDir, 'runtime-family-xiaohongshu'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-family-poster-onepager'),
    path.join(gatewayNodeModulesDir, 'runtime-family-poster-onepager'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-family-poster-onepager'),
    path.join(gatewayPackagePath, 'node_modules', '@redcube', 'runtime-family-poster-onepager'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-family-registry'),
    path.join(gatewayNodeModulesDir, 'runtime-family-registry'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-overlay-core'),
    path.join(gatewayNodeModulesDir, 'overlay-core'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-hermes-substrate'),
    path.join(gatewayNodeModulesDir, 'hermes-substrate'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-codex-cli-client'),
    path.join(gatewayNodeModulesDir, 'codex-cli-client'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-codex-cli-client'),
    path.join(gatewayNodeModulesDir, 'runtime', 'node_modules', '@redcube', 'codex-cli-client'),
  );
  copyPackageIntoInstall(
    path.resolve('prompts'),
    path.join(gatewayPackagePath, 'node_modules', 'prompts'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime/scripts'),
    path.join(gatewayPackagePath, 'node_modules', '@redcube', 'redcube-runtime', 'scripts'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-overlay-registry'),
    path.join(gatewayNodeModulesDir, 'overlay-registry'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-overlay-ppt'),
    path.join(gatewayNodeModulesDir, 'overlay-ppt'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-overlay-xiaohongshu'),
    path.join(gatewayNodeModulesDir, 'overlay-xiaohongshu'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-overlay-poster-onepager'),
    path.join(gatewayNodeModulesDir, 'overlay-poster-onepager'),
  );
  copyPackageIntoInstall(
    path.resolve('contracts'),
    path.join(installRoot, 'node_modules', 'contracts'),
  );
  copyPackageIntoInstall(
    path.resolve('contracts'),
    path.join(gatewayPackagePath, 'node_modules', 'contracts'),
  );
  const oplGatewaySharedDist = gatewayResolve.resolve('opl-gateway-shared/family-orchestration');
  const oplGatewaySharedPackageRoot = path.resolve(path.dirname(oplGatewaySharedDist), '..');
  copyPackageIntoInstall(
    oplGatewaySharedPackageRoot,
    path.join(gatewayPackagePath, 'node_modules', 'opl-gateway-shared'),
  );

  return {
    cliPath: path.join(cliDir, 'cli.js'),
    gatewayPackagePath,
    runtimeProtocolPackagePath,
    installRoot,
  };
}

function execCliExpectFailure(cliPath, args, options) {
  try {
    execFileSync('node', [cliPath, ...args], {
      encoding: 'utf-8',
      ...options,
    });
    assert.fail('expected CLI to exit with non-zero status');
  } catch (error) {
    assert.notEqual(error.status, 0);
    assert.equal(error.stderr || '', '');

    return JSON.parse(error.stdout);
  }
}

async function execCliAsync(cliPath, args, options = {}) {
  const result = await execFileAsync('node', [cliPath, ...args], {
    encoding: 'utf-8',
    ...options,
  });
  return JSON.parse(result.stdout);
}

async function execCliExpectFailureAsync(cliPath, args, options = {}) {
  try {
    await execFileAsync('node', [cliPath, ...args], {
      encoding: 'utf-8',
      ...options,
    });
    assert.fail('expected CLI to exit with non-zero status');
  } catch (error) {
    assert.notEqual(error.code, 0);
    assert.equal(error.stderr || '', '');
    return JSON.parse(error.stdout);
  }
}

async function withMockHermesUpstreamCli(testFn) {
  const upstream = await startMockCodexCli();
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
  });

  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

test('CLI review watch returns operator-facing runtime watch surface for a persisted run', async () => {
  await withMockHermesUpstreamCli(async () => {
    const cliPath = path.resolve('apps/redcube-cli/dist/cli.js');
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-review-watch-'));

    const createOutput = await execCliAsync(
      cliPath,
      [
        'deliverable',
        'create',
        '--workspace-root', workspaceRoot,
        '--overlay', 'ppt_deck',
        '--profile-id', 'lecture_student',
        '--topic-id', 'topic-a',
        '--deliverable-id', 'deck-a',
        '--title', '甲状腺门诊科普 deck',
        '--goal', '为本科生讲授甲状腺基础知识',
      ],
      { cwd: path.resolve('.') },
    );
    assert.equal(createOutput.ok, true);

    const runParsed = await execCliAsync(
      cliPath,
      [
        'deliverable',
        'run',
        '--workspace-root', workspaceRoot,
        '--overlay', 'ppt_deck',
        '--topic-id', 'topic-a',
        '--deliverable-id', 'deck-a',
        '--route', 'storyline',
      ],
      { cwd: path.resolve('.') },
    );
    assert.equal(runParsed.ok, true);

    const watched = await execCliAsync(
      cliPath,
      [
        'review',
        'watch',
        '--workspace-root', workspaceRoot,
        '--topic-id', 'topic-a',
        '--deliverable-id', 'deck-a',
        '--run-id', runParsed.run.run_id,
      ],
      { cwd: path.resolve('.') },
    );
    assert.equal(watched.ok, true);
    assert.equal(watched.surface_kind, 'runtime_watch');
    assert.equal(watched.run_id, runParsed.run.run_id);
  });
});

test('CLI review watch rejects a persisted run when topic locator does not match the run identity', async () => {
  await withMockHermesUpstreamCli(async () => {
    const cliPath = path.resolve('apps/redcube-cli/dist/cli.js');
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-review-watch-mismatch-'));

    for (const topicId of ['topic-a', 'topic-b']) {
      const createOutput = await execCliAsync(
        cliPath,
        [
          'deliverable',
          'create',
          '--workspace-root', workspaceRoot,
          '--overlay', 'ppt_deck',
          '--profile-id', 'lecture_student',
          '--topic-id', topicId,
          '--deliverable-id', 'deck-a',
          '--title', `deck ${topicId}`,
          '--goal', `goal ${topicId}`,
        ],
        { cwd: path.resolve('.') },
      );
      assert.equal(createOutput.ok, true);
    }

    const runParsed = await execCliAsync(
      cliPath,
      [
        'deliverable',
        'run',
        '--workspace-root', workspaceRoot,
        '--overlay', 'ppt_deck',
        '--topic-id', 'topic-a',
        '--deliverable-id', 'deck-a',
        '--route', 'storyline',
      ],
      { cwd: path.resolve('.') },
    );
    assert.equal(runParsed.ok, true);

    const failure = await execCliExpectFailureAsync(
      cliPath,
      [
        'review',
        'watch',
        '--workspace-root', workspaceRoot,
        '--topic-id', 'topic-b',
        '--deliverable-id', 'deck-a',
        '--run-id', runParsed.run.run_id,
      ],
      { cwd: path.resolve('.') },
    );

    assert.equal(failure.ok, false);
    assert.equal(failure.error_kind, 'cli_usage_error');
    assert.match(failure.error, /runtimeWatch topicId 与 run\.topic_id 不一致/);
  });
});

test('CLI topics list works from isolated install without monorepo sibling source packages', () => {
  const { cliPath, installRoot } = createIsolatedCliInstall();
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-isolated-topics-'));
  const topicDir = path.join(workspaceRoot, 'topics', 'topic-a');
  mkdirSync(topicDir, { recursive: true });
  writeFileSync(path.join(topicDir, 'topic.json'), JSON.stringify({
    topic_id: 'topic-a',
    status: 'draft',
    overlay: 'xiaohongshu',
  }), 'utf-8');

  const output = execFileSync(
    'node',
    [cliPath, 'topics', 'list', '--workspace-root', workspaceRoot],
    { encoding: 'utf-8', cwd: installRoot },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.total, 1);
  assert.equal(parsed.topics[0].topic_id, 'topic-a');
});

test('CLI topics list resolves root by priority: --workspace-root over --root-dir', () => {
  const preferredRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-topics-priority-'));
  const fallbackRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-topics-priority-'));

  const preferredTopicDir = path.join(preferredRoot, 'topics', 'topic-preferred');
  mkdirSync(preferredTopicDir, { recursive: true });
  writeFileSync(path.join(preferredTopicDir, 'topic.json'), JSON.stringify({
    topic_id: 'topic-preferred',
    status: 'draft',
    overlay: 'xiaohongshu',
  }), 'utf-8');

  const fallbackTopicDir = path.join(fallbackRoot, 'topics', 'topic-fallback');
  mkdirSync(fallbackTopicDir, { recursive: true });
  writeFileSync(path.join(fallbackTopicDir, 'topic.json'), JSON.stringify({
    topic_id: 'topic-fallback',
    status: 'draft',
    overlay: 'douyin',
  }), 'utf-8');

  const output = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/dist/cli.js'),
      'topics',
      'list',
      '--workspace-root',
      preferredRoot,
      '--root-dir',
      fallbackRoot,
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.workspaceRoot, preferredRoot);
  assert.equal(parsed.total, 1);
  assert.equal(parsed.topics[0].topic_id, 'topic-preferred');
});

test('CLI topics list falls back to --root-dir when --workspace-root is absent', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-topics-rootdir-'));
  const topicDir = path.join(workspaceRoot, 'topics', 'topic-rootdir');
  mkdirSync(topicDir, { recursive: true });
  writeFileSync(path.join(topicDir, 'topic.json'), JSON.stringify({
    topic_id: 'topic-rootdir',
    status: 'draft',
    overlay: 'xiaohongshu',
  }), 'utf-8');

  const output = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/dist/cli.js'), 'topics', 'list', '--root-dir', workspaceRoot],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.workspaceRoot, workspaceRoot);
  assert.equal(parsed.total, 1);
  assert.equal(parsed.topics[0].topic_id, 'topic-rootdir');
});

test('CLI topics list falls back to process.cwd() when root flags are absent', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-topics-cwd-'));
  const topicDir = path.join(workspaceRoot, 'topics', 'topic-cwd');
  mkdirSync(topicDir, { recursive: true });
  writeFileSync(path.join(topicDir, 'topic.json'), JSON.stringify({
    topic_id: 'topic-cwd',
    status: 'draft',
    overlay: 'xiaohongshu',
  }), 'utf-8');
  const expectedCwd = execFileSync(
    'node',
    ['-e', 'process.stdout.write(process.cwd())'],
    { encoding: 'utf-8', cwd: workspaceRoot },
  );

  const output = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/dist/cli.js'), 'topics', 'list'],
    { encoding: 'utf-8', cwd: workspaceRoot },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.workspaceRoot, expectedCwd);
  assert.equal(parsed.total, 1);
  assert.equal(parsed.topics[0].topic_id, 'topic-cwd');
});

test('CLI workspace doctor resolves root by priority: --workspace-root over --root-dir', () => {
  const preferredRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-priority-'));
  const fallbackRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-priority-'));
  writeFileSync(path.join(preferredRoot, 'redcube.workspace.json'), JSON.stringify({ overlay: 'xiaohongshu' }), 'utf-8');
  writeFileSync(path.join(fallbackRoot, 'redcube.workspace.json'), JSON.stringify({ overlay: 'douyin' }), 'utf-8');

  const output = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/dist/cli.js'),
      'workspace',
      'doctor',
      '--workspace-root',
      preferredRoot,
      '--root-dir',
      fallbackRoot,
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.workspaceRoot, preferredRoot);
});

test('CLI workspace doctor falls back to --root-dir when --workspace-root is absent', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-rootdir-'));
  writeFileSync(path.join(workspaceRoot, 'redcube.workspace.json'), JSON.stringify({ overlay: 'xiaohongshu' }), 'utf-8');

  const output = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/dist/cli.js'), 'workspace', 'doctor', '--root-dir', workspaceRoot],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.workspaceRoot, workspaceRoot);
});

test('CLI workspace doctor falls back to process.cwd() when root flags are absent', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-cwd-'));
  writeFileSync(path.join(workspaceRoot, 'redcube.workspace.json'), JSON.stringify({ overlay: 'xiaohongshu' }), 'utf-8');
  const expectedCwd = execFileSync(
    'node',
    ['-e', 'process.stdout.write(process.cwd())'],
    { encoding: 'utf-8', cwd: workspaceRoot },
  );

  const output = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/dist/cli.js'), 'workspace', 'doctor'],
    { encoding: 'utf-8', cwd: workspaceRoot },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.workspaceRoot, expectedCwd);
});

test('@redcube/cli declares @redcube/gateway dependency explicitly', () => {
  const packageJson = JSON.parse(
    readFileSync(path.resolve('apps/redcube-cli/package.json'), 'utf-8'),
  );
  const gatewayPackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-gateway/package.json'), 'utf-8'),
  );

  assert.equal(
    packageJson.dependencies?.['@redcube/gateway'],
    gatewayPackageJson.version,
  );
});
