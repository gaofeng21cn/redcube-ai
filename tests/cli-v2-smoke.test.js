import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

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
