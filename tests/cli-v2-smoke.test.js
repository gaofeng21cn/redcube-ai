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
  const gatewayNodeModulesDir = path.join(gatewayPackagePath, 'node_modules', '@redcube');
  const runtimeProtocolPackagePath = path.join(gatewayNodeModulesDir, 'runtime-protocol');

  mkdirSync(cliDir, { recursive: true });
  mkdirSync(consumerNodeModulesDir, { recursive: true });

  const gatewaySourcePackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-gateway/package.json'), 'utf-8'),
  );

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
    path.resolve('packages/redcube-governance'),
    path.join(gatewayNodeModulesDir, 'governance'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-reference-os'),
    path.join(gatewayNodeModulesDir, 'reference-os'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-pack-runtime'),
    path.join(gatewayNodeModulesDir, 'pack-runtime'),
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
    path.resolve('packages/redcube-runtime-family-ppt'),
    path.join(gatewayNodeModulesDir, 'runtime-family-ppt'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-family-xiaohongshu'),
    path.join(gatewayNodeModulesDir, 'runtime-family-xiaohongshu'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-overlay-core'),
    path.join(gatewayNodeModulesDir, 'overlay-core'),
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
  assert.equal(parsed.surface_kind, 'workspace_doctor');
  assert.equal(parsed.recommended_action, 'continue');
  assert.equal(parsed.summary.workspace_file_exists, true);
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
  assert.equal(parsed.surface_kind, 'workspace_doctor');
  assert.equal(parsed.recommended_action, 'continue');
  assert.equal(parsed.workspaceRoot, workspaceRoot);
  assert.equal(parsed.workspaceFileExists, true);
});

test('CLI isolated install returns CLI JSON for unknown commands', () => {
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

test('CLI help exposes task-oriented onboarding surface', () => {
  const output = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/src/cli.js'), 'help'],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.match(parsed.whatIsRedCube, /PPT deck/);
  assert.match(parsed.whatIsRedCube, /小红书图文/);
  assert.equal(parsed.usage.deliverableCreate.includes('<ppt_deck|xiaohongshu>'), false);
  assert.equal(parsed.discovery.profileList, 'redcube profile --action list');
  assert.deepEqual(
    parsed.availableOverlays.map((overlay) => overlay.overlay_id),
    ['ppt_deck', 'xiaohongshu'],
  );
  assert.equal(Array.isArray(parsed.commonTasks), true);
  assert.equal(parsed.commonTasks.length >= 4, true);
  assert.equal(parsed.commandGroups.deliverable.includes('create'), true);
  assert.equal(parsed.commandGroups.review.includes('projection'), true);
  assert.equal(parsed.whereToReadNext.humanQuickstart, 'docs/human_quickstart.md');
  assert.equal(typeof parsed.usage.deliverableCreate, 'string');
  assert.match(parsed.usage.reviewMutate, /promote_baseline/);
});

test('CLI profile list exposes registry-driven overlay catalog from isolated install', () => {
  const { cliPath, installRoot } = createIsolatedCliInstall();

  const output = execFileSync(
    'node',
    [cliPath, 'profile', '--action', 'list'],
    { encoding: 'utf-8', cwd: installRoot },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.surface_kind, 'overlay_catalog');
  assert.equal(parsed.recommended_action, 'create_deliverable');
  assert.equal(parsed.summary.total_overlays, 2);
  assert.deepEqual(
    parsed.overlays.map((overlay) => overlay.overlay_id),
    ['ppt_deck', 'xiaohongshu'],
  );
  assert.deepEqual(
    parsed.overlays.find((overlay) => overlay.overlay_id === 'ppt_deck')?.profiles,
    ['lecture_student', 'lecture_peer', 'executive_briefing', 'defense_deck'],
  );
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
  const gatewaySourcePackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-gateway/package.json'), 'utf-8'),
  );

  assert.deepEqual(packageJson.dependencies, {
    '@redcube/gateway': gatewaySourcePackageJson.version,
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
  assert.equal(parsed.surface_kind, 'topic_catalog');
  assert.equal(parsed.recommended_action, 'continue');
  assert.equal(parsed.summary.total_topics, 1);
  assert.equal(parsed.total, 1);
  assert.equal(parsed.topics[0].topic_id, 'topic-a');
});

test('CLI deliverable create proxies gateway createDeliverable', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-deliverable-'));

  const output = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/src/cli.js'),
      'deliverable',
      'create',
      '--workspace-root',
      workspaceRoot,
      '--overlay',
      'ppt_deck',
      '--profile-id',
      'lecture_student',
      '--topic-id',
      'topic-a',
      '--deliverable-id',
      'deck-a',
      '--title',
      '甲状腺门诊科普 deck',
      '--goal',
      '为本科生讲授甲状腺基础知识',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.deliverable.overlay, 'ppt_deck');
  assert.equal(parsed.deliverable.profile_id, 'lecture_student');
  assert.equal(parsed.deliverable.hydrated_contract_ref, 'contracts/hydrated-deliverable.json');
});

test('CLI deliverable create works from isolated install without monorepo sibling source packages', () => {
  const { cliPath, installRoot } = createIsolatedCliInstall();
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-deliverable-isolated-'));

  const output = execFileSync(
    'node',
    [
      cliPath,
      'deliverable',
      'create',
      '--workspace-root',
      workspaceRoot,
      '--overlay',
      'xiaohongshu',
      '--profile-id',
      'standard_note',
      '--topic-id',
      'topic-a',
      '--deliverable-id',
      'note-a',
      '--title',
      '甲状腺门诊小红书科普',
      '--goal',
      '为门诊患者生成可发布的科普图文',
    ],
    { encoding: 'utf-8', cwd: installRoot },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.deliverable.overlay, 'xiaohongshu');
  assert.equal(parsed.deliverable.profile_id, 'standard_note');
});

test('CLI deliverable run and runs get proxy the contract-driven runtime mainline', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-run-'));

  execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/src/cli.js'),
      'deliverable',
      'create',
      '--workspace-root',
      workspaceRoot,
      '--overlay',
      'ppt_deck',
      '--profile-id',
      'lecture_peer',
      '--topic-id',
      'topic-a',
      '--deliverable-id',
      'deck-a',
      '--title',
      '同行讲解 deck',
      '--goal',
      '向小同行解释问题、方法、证据与边界',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const runOutput = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/src/cli.js'),
      'deliverable',
      'run',
      '--workspace-root',
      workspaceRoot,
      '--overlay',
      'ppt_deck',
      '--topic-id',
      'topic-a',
      '--deliverable-id',
      'deck-a',
      '--route',
      'storyline',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const runParsed = JSON.parse(runOutput);
  assert.equal(runParsed.ok, true);
  assert.equal(runParsed.run.current_stage, 'storyline');

  const secondRunOutput = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/src/cli.js'),
      'deliverable',
      'run',
      '--workspace-root',
      workspaceRoot,
      '--overlay',
      'ppt_deck',
      '--topic-id',
      'topic-a',
      '--deliverable-id',
      'deck-a',
      '--route',
      'detailed_outline',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const secondRunParsed = JSON.parse(secondRunOutput);
  assert.equal(secondRunParsed.ok, true);
  assert.equal(secondRunParsed.run.current_stage, 'detailed_outline');

  const getOutput = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/src/cli.js'),
      'runs',
      'get',
      '--workspace-root',
      workspaceRoot,
      '--run-id',
      secondRunParsed.run.run_id,
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const getParsed = JSON.parse(getOutput);
  assert.equal(getParsed.ok, true);
  assert.equal(getParsed.run.status, 'completed');
  assert.equal(getParsed.run.current_stage, 'detailed_outline');
});



test('CLI review get and mutate proxy review platform actions', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-review-'));

  execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/src/cli.js'),
      'deliverable',
      'create',
      '--workspace-root', workspaceRoot,
      '--overlay', 'ppt_deck',
      '--profile-id', 'lecture_student',
      '--topic-id', 'topic-a',
      '--deliverable-id', 'deck-a',
      '--title', '肠癌 AI 讲课 deck',
      '--goal', '给学生讲清肠癌 AI 的问题、方法与边界',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const getOutput = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/src/cli.js'),
      'review',
      'get',
      '--workspace-root', workspaceRoot,
      '--topic-id', 'topic-a',
      '--deliverable-id', 'deck-a',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );
  const getParsed = JSON.parse(getOutput);
  assert.equal(getParsed.ok, true);
  assert.equal(getParsed.surface_kind, 'review_state');
  assert.equal(getParsed.state_type, 'canonical');
  assert.equal(getParsed.canonical_source.kind, 'review_state.publish_state');
  assert.equal(getParsed.state.deliverable_id, 'deck-a');
  assert.equal(getParsed.quality_summary?.relative_quality_verdict, null);
  assert.equal(getParsed.quality_summary?.baseline_promotion_state, null);

  const mutateOutput = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/src/cli.js'),
      'review',
      'mutate',
      '--workspace-root', workspaceRoot,
      '--topic-id', 'topic-a',
      '--deliverable-id', 'deck-a',
      '--type', 'bind_baseline',
      '--baseline-deliverable-id', 'deck-v1',
      '--actor', 'agent',
      '--notes', 'bind baseline',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );
  const mutateParsed = JSON.parse(mutateOutput);
  assert.equal(mutateParsed.ok, true);
  assert.equal(mutateParsed.state.baseline.baseline_deliverable_id, 'deck-v1');
});

test('CLI review projection proxies topic publication projection read path', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-review-projection-'));

  const createOutput = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/src/cli.js'),
      'deliverable',
      'create',
      '--workspace-root', workspaceRoot,
      '--overlay', 'xiaohongshu',
      '--profile-id', 'standard_note',
      '--topic-id', 'topic-a',
      '--deliverable-id', 'note-a',
      '--title', '甲状腺门诊小红书科普',
      '--goal', '为门诊患者生成可发布的科普图文',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );
  assert.equal(JSON.parse(createOutput).ok, true);

  for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'publish_copy']) {
    const output = execFileSync(
      'node',
      [
        path.resolve('apps/redcube-cli/src/cli.js'),
        'deliverable',
        'run',
        '--workspace-root', workspaceRoot,
        '--overlay', 'xiaohongshu',
        '--topic-id', 'topic-a',
        '--deliverable-id', 'note-a',
        '--route', route,
      ],
      { encoding: 'utf-8', cwd: path.resolve('.') },
    );
    assert.equal(JSON.parse(output).ok, true, route);
  }

  const projectionOutput = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/src/cli.js'),
      'review',
      'projection',
      '--workspace-root', workspaceRoot,
      '--topic-id', 'topic-a',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const projection = JSON.parse(projectionOutput);
  assert.equal(projection.ok, true);
  assert.equal(projection.surface_kind, 'publication_projection');
  assert.equal(projection.state_type, 'projection');
  assert.equal(projection.publication.current, 'approval_pending');
  assert.equal(projection.canonical_source.kind, 'review_state.publish_state');
});

test('CLI review watch returns operator-facing runtime watch surface for a persisted run', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-review-watch-'));

  const createOutput = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/src/cli.js'),
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
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );
  assert.equal(JSON.parse(createOutput).ok, true);

  const runOutput = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/src/cli.js'),
      'deliverable',
      'run',
      '--workspace-root', workspaceRoot,
      '--overlay', 'ppt_deck',
      '--topic-id', 'topic-a',
      '--deliverable-id', 'deck-a',
      '--route', 'storyline',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );
  const runParsed = JSON.parse(runOutput);
  assert.equal(runParsed.ok, true);

  const watchOutput = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/src/cli.js'),
      'review',
      'watch',
      '--workspace-root', workspaceRoot,
      '--topic-id', 'topic-a',
      '--deliverable-id', 'deck-a',
      '--run-id', runParsed.run.run_id,
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );
  const watched = JSON.parse(watchOutput);
  assert.equal(watched.ok, true);
  assert.equal(watched.surface_kind, 'runtime_watch');
  assert.equal(watched.run_id, runParsed.run.run_id);
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
  const gatewayPackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-gateway/package.json'), 'utf-8'),
  );

  assert.equal(
    packageJson.dependencies?.['@redcube/gateway'],
    gatewayPackageJson.version,
  );
});
