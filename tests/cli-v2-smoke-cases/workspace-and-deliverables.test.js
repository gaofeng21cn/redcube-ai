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
    path.resolve('apps/redcube-cli/src/cli.js'),
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
    error_kind: 'cli_usage_error',
    recommended_action: 'read_help',
    error: '未知命令: foo',
  });
});

test('CLI product invalid subcommand keeps the internal OPL bridge out of public usage hints', () => {
  const { cliPath, installRoot } = createIsolatedCliInstall();

  const parsed = execCliExpectFailure(
    cliPath,
    ['product', 'bad-subcommand'],
    { cwd: installRoot },
  );

  assert.equal(parsed.ok, false);
  assert.equal(parsed.error_kind, 'cli_usage_error');
  assert.match(parsed.error, /frontdesk\|start\|preflight\|invoke\|session\|manifest/);
  assert.equal(parsed.error.includes('federate'), false);
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
  assert.match(parsed.whatIsRedCube, /单页知识海报/);
  assert.equal(parsed.usage.deliverableCreate.includes('<ppt_deck|xiaohongshu>'), false);
  assert.equal(parsed.discovery.profileList, 'redcube profile --action list');
  assert.deepEqual(
    parsed.availableOverlays.map((overlay) => overlay.overlay_id),
    ['ppt_deck', 'xiaohongshu', 'poster_onepager'],
  );
  assert.equal(Array.isArray(parsed.commonTasks), true);
  assert.equal(parsed.commonTasks.length >= 4, true);
  assert.equal(parsed.commonTasks.some((item) => item.command.includes('review get')), true);
  assert.equal(parsed.commonTasks.some((item) => item.command.includes('review projection')), true);
  assert.equal(parsed.commonTasks.some((item) => item.command.includes('review watch')), true);
  assert.equal(parsed.commonTasks.some((item) => item.command.includes('source research')), true);
  assert.equal(parsed.commonTasks.some((item) => item.command.includes('deliverable run')), true);
  assert.equal(parsed.commonTasks.some((item) => item.command.includes('product invoke')), true);
  assert.deepEqual(parsed.commonFlows.ppt_deck, [
    '1. redcube workspace doctor --workspace-root <dir>',
    '2. redcube source research --workspace-root <dir> --topic-id <id> ...',
    '3. redcube deliverable create --workspace-root <dir> --overlay ppt_deck --profile-id lecture_student ...',
    '4. redcube deliverable audit --workspace-root <dir> --overlay ppt_deck --mode draft_new ...',
    '5. redcube deliverable run --workspace-root <dir> --overlay ppt_deck --route <stage> ...',
  ]);
  assert.equal(parsed.commandGroups.source.includes('research'), true);
  assert.equal(parsed.commandGroups.deliverable.includes('create'), true);
  assert.equal(parsed.commandGroups.managed.includes('supervise'), true);
  assert.equal(parsed.commandGroups.product.includes('invoke'), true);
  assert.equal(parsed.commandGroups.product.includes('session'), true);
  assert.equal(parsed.commandGroups.review.includes('projection'), true);
  assert.equal(parsed.whereToReadNext.humanQuickstart, 'docs/human_quickstart.md');
  assert.equal(typeof parsed.usage.deliverableCreate, 'string');
  assert.equal(typeof parsed.usage.sourceResearch, 'string');
  assert.match(parsed.usage.reviewMutate, /promote_baseline/);
});


test('CLI subcommand --help returns machine-readable command help without executing the route', () => {
  const cliPath = path.resolve('apps/redcube-cli/src/cli.js');
  const expectedRoute = [
    'workspace doctor',
    'source intake / source research',
    'deliverable create',
    'deliverable audit',
    'deliverable run',
  ];
  const cases = [
    {
      args: ['workspace', 'doctor', '--help'],
      command: 'workspace doctor',
      gatewayAction: 'doctorWorkspace',
      usageIncludes: '--workspace-root <dir>',
    },
    {
      args: ['source', 'intake', '--help'],
      command: 'source intake',
      gatewayAction: 'intakeSource',
      usageIncludes: '--topic-id <id>',
    },
    {
      args: ['source', 'research', '--help'],
      command: 'source research',
      gatewayAction: 'researchSource',
      usageIncludes: '--payload-file /abs/result.json',
    },
    {
      args: ['deliverable', 'create', '--help'],
      command: 'deliverable create',
      gatewayAction: 'createDeliverable',
      usageIncludes: '--deliverable-id <id>',
    },
    {
      args: ['deliverable', 'audit', '--help'],
      command: 'deliverable audit',
      gatewayAction: 'auditDeliverable',
      usageIncludes: '--mode <draft_new|optimize_existing>',
    },
    {
      args: ['deliverable', 'run', '--help'],
      command: 'deliverable run',
      gatewayAction: 'runDeliverableRoute',
      usageIncludes: '--route <stage>',
    },
    {
      args: ['review', 'watch', '--help'],
      command: 'review watch',
      gatewayAction: 'runtimeWatch',
      usageIncludes: '--run-id <id>',
    },
  ];

  for (const item of cases) {
    const output = execFileSync('node', [cliPath, ...item.args], {
      encoding: 'utf-8',
      cwd: path.resolve('.'),
    });
    const parsed = JSON.parse(output);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.surface_kind, 'command_help');
    assert.equal(parsed.command, item.command);
    assert.equal(parsed.gateway_action, item.gatewayAction);
    assert.equal(parsed.usage.includes(item.usageIncludes), true);
    assert.deepEqual(parsed.canonical_operator_route, expectedRoute);
  }
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
  assert.equal(parsed.summary.total_overlays, 3);
  assert.deepEqual(
    parsed.overlays.map((overlay) => overlay.overlay_id),
    ['ppt_deck', 'xiaohongshu', 'poster_onepager'],
  );
  assert.deepEqual(
    parsed.overlays.find((overlay) => overlay.overlay_id === 'ppt_deck')?.profiles,
    ['lecture_student', 'lecture_peer', 'executive_briefing', 'defense_deck'],
  );
  assert.deepEqual(
    parsed.overlays.find((overlay) => overlay.overlay_id === 'poster_onepager')?.profiles,
    ['knowledge_poster'],
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

test('CLI deliverable get returns operator-facing deliverable record surface', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-deliverable-get-'));

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
      '--title', '甲状腺门诊科普 deck',
      '--goal', '为本科生讲授甲状腺基础知识',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const output = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/src/cli.js'),
      'deliverable',
      'get',
      '--workspace-root', workspaceRoot,
      '--topic-id', 'topic-a',
      '--deliverable-id', 'deck-a',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );
  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.surface_kind, 'deliverable_record');
  assert.equal(parsed.recommended_action, 'audit_deliverable');
  assert.equal(parsed.summary.deliverable_id, 'deck-a');
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

test('CLI deliverable run works from isolated install through the upstream Hermes service-entry bridge', async () => {
  await withMockHermesUpstreamCli(async () => {
    const { cliPath, installRoot } = createIsolatedCliInstall();
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-deliverable-isolated-run-'));

    const createOutput = await execCliAsync(
      cliPath,
      [
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
      { cwd: installRoot },
    );
    assert.equal(createOutput.ok, true);

    const parsed = await execCliAsync(
      cliPath,
      [
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
      { cwd: installRoot },
    );

    assert.equal(parsed.ok, true);
    assert.equal(parsed.surface_kind, 'route_run');
    assert.equal(parsed.run.executor.codex_cli_runtime?.owner, 'codex_cli');
  });
});

test('CLI deliverable run and runs get proxy the contract-driven runtime mainline', async () => {
  await withMockHermesUpstreamCli(async () => {
    const cliPath = path.resolve('apps/redcube-cli/src/cli.js');
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-run-'));

    await execCliAsync(
      cliPath,
      [
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
      { cwd: path.resolve('.') },
    );

    const runParsed = await execCliAsync(
      cliPath,
      [
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
      { cwd: path.resolve('.') },
    );
    assert.equal(runParsed.ok, true);
    assert.equal(runParsed.run.current_stage, 'storyline');

    const secondRunParsed = await execCliAsync(
      cliPath,
      [
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
      { cwd: path.resolve('.') },
    );
    assert.equal(secondRunParsed.ok, true);
    assert.equal(secondRunParsed.run.current_stage, 'detailed_outline');

    const getParsed = await execCliAsync(
      cliPath,
      [
        'runs',
        'get',
        '--workspace-root',
        workspaceRoot,
        '--run-id',
        secondRunParsed.run.run_id,
      ],
      { cwd: path.resolve('.') },
    );
    assert.equal(getParsed.ok, true);
    assert.equal(getParsed.run.status, 'completed');
    assert.equal(getParsed.run.current_stage, 'detailed_outline');
  });
});
