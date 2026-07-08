// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  realpathSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import {
  createIsolatedCliInstall,
  execCliAsync,
  execCliExpectFailure,
  withMockCodexRuntimeCli,
} from './shared.ts';

test('CLI workspace doctor proxies domain entry doctorWorkspace', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-'));
  writeFileSync(path.join(workspaceRoot, 'redcube.workspace.json'), JSON.stringify({ overlay: 'xiaohongshu' }), 'utf-8');

  const output = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/dist/cli.js'), 'workspace', 'doctor', '--workspace-root', workspaceRoot],
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

test('CLI product invalid subcommand keeps the OPL-hosted stage runtime handoff out of public usage hints', () => {
  const { cliPath, installRoot } = createIsolatedCliInstall();

  const parsed = execCliExpectFailure(
    cliPath,
    ['product', 'bad-subcommand'],
    { cwd: installRoot },
  );

  assert.equal(parsed.ok, false);
  assert.equal(parsed.error_kind, 'cli_usage_error');
  assert.match(parsed.error, /仅保留 invoke domain handler target/);
  assert.match(parsed.error, /generated\/default wrapper 由 OPL 持有/);
  assert.equal(parsed.error.includes('federate'), false);
});

test('CLI help exposes task-oriented onboarding surface', () => {
  const output = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/dist/cli.js'), 'help'],
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
  assert.equal(parsed.commonTasks.some((item) => item.command === 'npm run rca -- help'), true);
  assert.equal(parsed.commonTasks.some((item) => item.command === 'npm run rca -- foundry status --json'), false);
  assert.equal(parsed.commonTasks.some((item) => item.command === 'redcube status'), false);
  assert.equal(parsed.commonTasks.some((item) => item.command === 'redcube deck inspect'), false);
  assert.equal(parsed.commonTasks.some((item) => item.command.includes('review get')), true);
  assert.equal(parsed.commonTasks.some((item) => item.command.includes('review projection')), true);
  assert.equal(parsed.commonTasks.some((item) => item.command.includes('review watch')), false);
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
  assert.equal(parsed.commandGroups.foundry, undefined);
  assert.equal(parsed.commandGroups.work, undefined);
  assert.equal(parsed.commandGroups.deck, undefined);
  assert.equal(parsed.commandGroups.managed, undefined);
  assert.equal(parsed.commandGroups.product.includes('invoke'), true);
  assert.equal(parsed.commandGroups.product.includes('session'), false);
  assert.equal(parsed.commandGroups.review.includes('projection'), true);
  assert.equal(parsed.whereToReadNext.humanQuickstart, 'human_doc:human_quickstart');
  assert.equal(parsed.whereToReadNext.deliverableExamples, 'human_doc:deliverable_examples');
  assert.equal(parsed.whereToReadNext.runtimeArchitecture, 'human_doc:runtime_architecture');
  assert.equal(
    Object.values(parsed.whereToReadNext).every((surface) => typeof surface === 'string' && surface.startsWith('human_doc:')),
    true,
  );
  assert.equal(typeof parsed.usage.deliverableCreate, 'string');
  assert.equal(parsed.usage.rcaNpmAlias, 'npm run rca -- help');
  assert.equal(typeof parsed.usage.sourceResearch, 'string');
  assert.match(parsed.usage.reviewMutate, /promote_baseline/);
});

test('CLI no longer exposes repo-local OPL Foundry Agent series first-layer grammar', () => {
  const cliPath = path.resolve('apps/redcube-cli/dist/cli.js');
  for (const args of [['foundry', 'status'], ['status'], ['interfaces'], ['validate'], ['doctor'], ['peers'], ['work'], ['deck', 'inspect']]) {
    const parsed = execCliExpectFailure(cliPath, args);
    assert.equal(parsed.ok, false, args.join(' '));
    assert.equal(parsed.error_kind, 'cli_usage_error', args.join(' '));
    assert.match(parsed.error, /未知命令/, args.join(' '));
  }
});

test('CLI Foundry commands and --json alias are not RCA active surfaces', () => {
  const cliPath = path.resolve('apps/redcube-cli/dist/cli.js');

  for (const operation of ['status', 'interfaces', 'validate', 'doctor', 'inspect', 'peers']) {
    const parsed = execCliExpectFailure(cliPath, ['foundry', operation, '--json']);
    assert.equal(parsed.ok, false, operation);
    assert.match(parsed.error, /未知命令/, operation);
  }
});

test('RCA npm script aliases the existing RedCube CLI', () => {
  const help = JSON.parse(execFileSync('npm', ['run', '--silent', 'rca', '--', '--help'], {
    encoding: 'utf-8',
    cwd: path.resolve('.'),
  }));
  assert.equal(help.ok, true);
  assert.equal(help.usage.rcaNpmAlias, 'npm run rca -- help');
});

test('CLI Foundry series grammar is retired from isolated install', () => {
  const { cliPath, installRoot } = createIsolatedCliInstall();

  const parsed = execCliExpectFailure(cliPath, ['deck', 'doctor'], { cwd: installRoot });
  assert.equal(parsed.ok, false);
  assert.equal(parsed.error_kind, 'cli_usage_error');
  assert.match(parsed.error, /未知命令/);
});


test('CLI subcommand --help returns machine-readable command help without executing the route', () => {
  const cliPath = path.resolve('apps/redcube-cli/dist/cli.js');
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
      actionRef: 'doctorWorkspace',
      usageIncludes: '--workspace-root <dir>',
    },
    {
      args: ['source', 'intake', '--help'],
      command: 'source intake',
      actionRef: 'intakeSource',
      usageIncludes: '--topic-id <id>',
    },
    {
      args: ['source', 'research', '--help'],
      command: 'source research',
      actionRef: 'researchSource',
      usageIncludes: '--payload-file /abs/result.json',
    },
    {
      args: ['deliverable', 'create', '--help'],
      command: 'deliverable create',
      actionRef: 'createDeliverable',
      usageIncludes: '--deliverable-id <id>',
    },
    {
      args: ['deliverable', 'audit', '--help'],
      command: 'deliverable audit',
      actionRef: 'auditDeliverable',
      usageIncludes: '--mode <draft_new|optimize_existing>',
    },
    {
      args: ['deliverable', 'run', '--help'],
      command: 'deliverable run',
      actionRef: 'invokeDomainEntry',
      usageIncludes: '--route <stage>',
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
    assert.equal(parsed.action_ref, item.actionRef);
    assert.equal(parsed.usage.includes(item.usageIncludes), true);
    assert.deepEqual(parsed.canonical_operator_route, expectedRoute);
  }

  for (const args of [['status', '--help'], ['foundry', 'interfaces', '--help'], ['deck', 'inspect', '--help']]) {
    const retiredHelp = execCliExpectFailure(cliPath, args);
    assert.equal(retiredHelp.ok, false);
    assert.match(retiredHelp.error, /未知命令/);
  }

  const retiredWatchHelp = execCliExpectFailure(cliPath, ['review', 'watch', '--help']);
  assert.equal(retiredWatchHelp.ok, false);
  assert.equal(retiredWatchHelp.error_kind, 'cli_usage_error');
  assert.match(retiredWatchHelp.error, /runtimeWatch default wrapper 由 OPL status\/workbench\/read-model caller 持有/);
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

test('CLI isolated install fixture keeps package realpaths inside temp install and consumer only depends on domain entry', () => {
  const {
    domainEntryPackagePath,
    installRoot,
    runtimeProtocolPackagePath,
  } = createIsolatedCliInstall();
  const packageJson = JSON.parse(
    readFileSync(path.join(installRoot, 'package.json'), 'utf-8'),
  );
  const installRootRealpath = realpathSync(installRoot);
  const domainEntrySourcePackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-domain-entry/package.json'), 'utf-8'),
  );

  assert.deepEqual(packageJson.dependencies, {
    '@redcube/domain-entry': domainEntrySourcePackageJson.version,
  });
  assert.equal(realpathSync(domainEntryPackagePath).startsWith(installRootRealpath), true);
  assert.equal(realpathSync(runtimeProtocolPackagePath).startsWith(installRootRealpath), true);
});

test('CLI topics list proxies domain entry listTopics', () => {
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
    [path.resolve('apps/redcube-cli/dist/cli.js'), 'topics', 'list', '--workspace-root', workspaceRoot],
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

test('CLI deliverable create proxies domain entry createDeliverable', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-deliverable-'));

  const output = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/dist/cli.js'),
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
      path.resolve('apps/redcube-cli/dist/cli.js'),
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
      path.resolve('apps/redcube-cli/dist/cli.js'),
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

test('CLI deliverable run returns an OPL StageRun plan from isolated install', async () => {
  await withMockCodexRuntimeCli(async () => {
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
    assert.equal(parsed.surface_kind, 'domain_entry');
    assert.equal(parsed.task_intent, 'run_opl_stage_execution_plan');
    assert.equal(parsed.result_surface.surface_kind, 'opl_stage_execution_plan');
    assert.equal(parsed.result_surface.owner, 'one-person-lab');
    assert.equal(parsed.result_surface.delivery_identity.route, 'storyline');
    assert.equal(parsed.result_surface.control_policy.requested_stop_after_stage, 'storyline');
    assert.equal(parsed.result_surface.execution_model.repo_local_stage_runner_active_caller, false);
  });
});

test('CLI deliverable run defaults to StageRun owner-chain instead of local route-run records', async () => {
  await withMockCodexRuntimeCli(async () => {
    const cliPath = path.resolve('apps/redcube-cli/dist/cli.js');
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
    assert.equal(runParsed.surface_kind, 'domain_entry');
    assert.equal(runParsed.result_surface.surface_kind, 'opl_stage_execution_plan');
    assert.equal(runParsed.result_surface.delivery_identity.route, 'storyline');
    assert.equal(runParsed.result_surface.control_policy.requested_stop_after_stage, 'storyline');
    assert.equal(runParsed.result_surface.execution_model.repo_local_stage_runner_active_caller, false);

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
    assert.equal(secondRunParsed.surface_kind, 'domain_entry');
    assert.equal(secondRunParsed.result_surface.surface_kind, 'opl_stage_execution_plan');
    assert.equal(secondRunParsed.result_surface.delivery_identity.route, 'detailed_outline');
    assert.equal(secondRunParsed.result_surface.control_policy.requested_stop_after_stage, 'detailed_outline');
    assert.equal(secondRunParsed.result_surface.execution_model.repo_local_stage_runner_active_caller, false);
    assert.equal(secondRunParsed.result_surface.attempt_ledger_owner, 'one-person-lab');
  });
});
