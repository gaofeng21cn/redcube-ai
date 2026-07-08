// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { parseArgs } from '../../apps/redcube-cli/dist/cli-parts/options.js';
import {
  createIsolatedCliInstall,
  execCliAsync,
  execCliExpectFailureAsync,
  withMockCodexRuntimeCli,
} from './shared.ts';

test('CLI parser uses node util tokens while preserving unknown long option values', () => {
  assert.deepEqual(
    parseArgs([
      '--workspace-root', '/tmp/ws',
      '--json-summary',
      '--native-sample-slide-count=3',
      '--user-intent', 'tight deck',
      '-x', 'ignored',
    ]),
    {
      workspaceRoot: '/tmp/ws',
      jsonSummary: true,
      nativeSampleSlideCount: '3',
      userIntent: 'tight deck',
    },
  );
});


test('CLI review watch fails closed because the default watch wrapper is OPL-owned', async () => {
  await withMockCodexRuntimeCli(async () => {
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
    assert.equal(runParsed.result_surface?.surface_kind, 'opl_stage_execution_plan');

    const failure = await execCliExpectFailureAsync(
      cliPath,
      [
        'review',
        'watch',
        '--workspace-root', workspaceRoot,
        '--topic-id', 'topic-a',
        '--deliverable-id', 'deck-a',
        '--run-id', runParsed.summary.target_handle,
      ],
      { cwd: path.resolve('.') },
    );

    assert.equal(failure.ok, false);
    assert.equal(failure.error_kind, 'cli_usage_error');
    assert.match(failure.error, /runtimeWatch default wrapper 由 OPL status\/workbench\/read-model caller 持有/);
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

test('@redcube/cli declares @redcube/domain-entry dependency explicitly', () => {
  const packageJson = JSON.parse(
    readFileSync(path.resolve('apps/redcube-cli/package.json'), 'utf-8'),
  );
  const domainEntryPackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-domain-entry/package.json'), 'utf-8'),
  );

  assert.equal(
    packageJson.dependencies?.['@redcube/domain-entry'],
    domainEntryPackageJson.version,
  );
});
