import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  copyFileSync,
  mkdtempSync,
  mkdirSync,
  realpathSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

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
  const runtimeProtocolPackagePath = path.join(
    gatewayPackagePath,
    'node_modules',
    '@redcube',
    'runtime-protocol',
  );

  mkdirSync(cliDir, { recursive: true });
  mkdirSync(consumerNodeModulesDir, { recursive: true });

  copyFileSync(
    path.resolve('apps/redcube-cli/src/cli.js'),
    path.join(cliDir, 'cli.js'),
  );
  writeFileSync(
    path.join(installRoot, 'package.json'),
    JSON.stringify({
      name: 'redcube-cli-isolated-test',
      private: true,
      type: 'module',
      dependencies: {
        '@redcube/gateway': 'workspace:*',
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
    assert.equal(error.stderr, '');

    return JSON.parse(error.stdout);
  }
}

test('CLI workspace doctor proxies gateway doctorWorkspace', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-'));
  writeFileSync(path.join(workspaceRoot, 'redcube.workspace.json'), JSON.stringify({ overlay: 'xiaohongshu' }), 'utf-8');

  const output = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/src/cli.js'), 'workspace', 'doctor', '--workspace-root', workspaceRoot],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.workspaceFileExists, true);
});

test('CLI workspace doctor works from isolated install without monorepo sibling source packages', () => {
  const { cliPath, installRoot } = createIsolatedCliInstall();
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-isolated-'));
  writeFileSync(
    path.join(workspaceRoot, 'redcube.workspace.json'),
    JSON.stringify({ overlay: 'xiaohongshu' }),
    'utf-8',
  );

  const output = execFileSync(
    'node',
    [cliPath, 'workspace', 'doctor', '--workspace-root', workspaceRoot],
    { encoding: 'utf-8', cwd: installRoot },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.workspaceRoot, workspaceRoot);
  assert.equal(parsed.workspaceFileExists, true);
});

test('CLI isolated install returns CLI JSON for unknown commands before touching legacy runtime', () => {
  const { cliPath, installRoot } = createIsolatedCliInstall();

  const parsed = execCliExpectFailure(
    cliPath,
    ['foo'],
    { cwd: installRoot },
  );

  assert.deepEqual(parsed, {
    ok: false,
    error: '未知命令: foo',
  });
});

test('CLI isolated install wraps legacy runtime import failures as CLI JSON errors', () => {
  const { cliPath, installRoot } = createIsolatedCliInstall();

  const parsed = execCliExpectFailure(
    cliPath,
    ['list'],
    { cwd: installRoot },
  );

  assert.equal(parsed.ok, false);
  assert.match(parsed.error, /legacy runtime/i);
  assert.doesNotMatch(parsed.error, /Cannot find module/);
});

test('CLI isolated install fixture keeps package realpaths inside temp install and consumer only depends on gateway', () => {
  const {
    gatewayPackagePath,
    installRoot,
    runtimeProtocolPackagePath,
  } = createIsolatedCliInstall();
  const packageJson = JSON.parse(
    readFileSync(path.join(installRoot, 'package.json'), 'utf-8'),
  );
  const installRootRealpath = realpathSync(installRoot);

  assert.deepEqual(packageJson.dependencies, {
    '@redcube/gateway': 'workspace:*',
  });
  assert.equal(realpathSync(gatewayPackagePath).startsWith(installRootRealpath), true);
  assert.equal(realpathSync(runtimeProtocolPackagePath).startsWith(installRootRealpath), true);
});

test('CLI topics list proxies gateway listTopics', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-'));
  const topicDir = path.join(workspaceRoot, 'topics', 'topic-a');
  mkdirSync(topicDir, { recursive: true });
  writeFileSync(path.join(topicDir, 'topic.json'), JSON.stringify({
    topic_id: 'topic-a',
    status: 'draft',
    overlay: 'xiaohongshu',
  }), 'utf-8');

  const output = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/src/cli.js'), 'topics', 'list', '--workspace-root', workspaceRoot],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.total, 1);
  assert.equal(parsed.topics[0].topic_id, 'topic-a');
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
      path.resolve('apps/redcube-cli/src/cli.js'),
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
    [path.resolve('apps/redcube-cli/src/cli.js'), 'topics', 'list', '--root-dir', workspaceRoot],
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
    [path.resolve('apps/redcube-cli/src/cli.js'), 'topics', 'list'],
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
      path.resolve('apps/redcube-cli/src/cli.js'),
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
    [path.resolve('apps/redcube-cli/src/cli.js'), 'workspace', 'doctor', '--root-dir', workspaceRoot],
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
    [path.resolve('apps/redcube-cli/src/cli.js'), 'workspace', 'doctor'],
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

  assert.equal(typeof packageJson.dependencies?.['@redcube/gateway'], 'string');
});
