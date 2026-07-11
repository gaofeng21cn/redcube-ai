import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import { buildCommandHelp, buildHelp, executeCli, getCliDomainActions } from '../apps/redcube-cli/dist/index.js';
import { buildRedCubeActionMetadata } from '../packages/redcube-domain-entry/dist/index.js';
import { withMockCodexRuntime } from './mock-codex-cli.js';

function runCli(args, options = {}) {
  const output = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/dist/cli.js'), ...args],
    { encoding: 'utf-8', cwd: path.resolve('.'), ...options },
  );

  return JSON.parse(output);
}

function writeResearchPayload(file) {
  writeFileSync(file, JSON.stringify({
    topic_summary: '围绕甲状腺门诊沟通，先解释判断顺序，再解释术语与下一步动作。',
    reference_source_list: [
      { reference_id: 'REF-001', label: '国家指南', url: 'https://example.com/guideline' },
      { reference_id: 'REF-002', label: '系统综述', url: 'https://example.com/review' },
    ],
    key_fact_groups: [
      { fact_id: 'FACT-001', label: 'TSH 异常后需要结合 FT4 判断下一步动作。', reference_id: 'REF-001' },
      { fact_id: 'FACT-002', label: '门诊沟通里应先解释判断顺序，再解释术语。', reference_id: 'REF-002' },
    ],
    source_quality_notes: ['优先使用公开指南与系统综述。'],
    evidence_gap_resolution: [
      { gap_id: 'public_evidence_missing', status: 'resolved', note: '已补入可追溯公开来源。' },
      { gap_id: 'consumable_material_missing', status: 'resolved', note: '已补入可直接消费的事实材料。' },
    ],
  }, null, 2), 'utf-8');
}

test('CLI help keeps deliverable run as the canonical quickstart surface while retired managed commands stay unavailable', () => {
  const parsed = runCli(['help']);

  assert.equal(parsed.commonTasks.some((item) => item.command.includes('deliverable run')), true);
  assert.equal(parsed.commonTasks.some((item) => item.command.includes('deliverable execute')), true);
  assert.equal(parsed.commonTasks.some((item) => item.command.includes('review watch')), false);
  assert.equal(parsed.commonTasks.some((item) => item.command.includes('redcube managed')), false);
  assert.equal(parsed.commonTasks.filter((item) => item.command.includes('deliverable execute')).length, 1);
  assert.deepEqual(parsed.commonFlows.ppt_deck, [
    '1. redcube workspace doctor --workspace-root <dir>',
    '2. redcube source research --workspace-root <dir> --topic-id <id> ...',
    '3. redcube deliverable create --workspace-root <dir> --overlay ppt_deck --profile-id lecture_student ...',
    '4. redcube deliverable audit --workspace-root <dir> --overlay ppt_deck --mode draft_new ...',
    '5. redcube deliverable run --workspace-root <dir> --overlay ppt_deck --route <stage> ...',
  ]);
  assert.deepEqual(parsed.operatorQuickstart.canonicalRoute, [
    'workspace doctor',
    'source intake / source research',
    'deliverable create',
    'deliverable audit',
    'deliverable run',
  ]);
  assert.deepEqual(parsed.operatorQuickstart.entryVariants.providedMaterials, [
    'workspace doctor',
    'source intake',
    'deliverable create',
    'deliverable audit',
    'deliverable run',
  ]);
  assert.deepEqual(parsed.operatorQuickstart.entryVariants.topicOnlyOrThinWorkspace, [
    'workspace doctor',
    'source research',
    'deliverable create',
    'deliverable audit',
    'deliverable run',
  ]);
  assert.equal(parsed.operatorQuickstart.doctorRole, 'diagnostic_only');
  assert.equal(parsed.operatorQuickstart.step1Gate, 'planning_ready');
  assert.equal(typeof parsed.usage.deliverableRun, 'string');
  assert.equal(typeof parsed.usage.deliverableExecute, 'string');
  assert.equal(parsed.usage.managedGet, undefined);
  assert.equal(parsed.usage.managedSupervise, undefined);
  assert.equal(parsed.commandGroups.managed, undefined);
});

test('CLI help common tasks stay deduplicated and CLI actions stay aligned with generated metadata', async () => {
  const cliActions = getCliDomainActions();
  const help = await buildHelp(cliActions);
  const commands = help.commonTasks.map((item) => item.command);
  const metadata = buildRedCubeActionMetadata();
  const cliActionRefs = new Set(metadata.cli_commands.map((command) => command.action_ref));

  assert.equal(new Set(commands).size, commands.length);
  assert.equal(commands.filter((command) => command.includes('deliverable execute')).length, 1);
  assert.equal(commands.some((command) => command.includes('review watch')), false);
  assert.equal(commands.some((command) => command.includes('redcube managed')), false);

  for (const actionKey of [
    'doctorWorkspace',
    'intakeSource',
    'researchSource',
    'createDeliverable',
    'auditDeliverable',
    'invokeDomainEntry',
    'getReviewState',
    'getPublicationProjection',
  ]) {
    assert.equal(typeof cliActions[actionKey], 'function', `cli:${actionKey}`);
  }
  for (const actionRef of [
    'invoke_product_entry',
    'export_domain_handler',
    'dispatch_domain_handler',
    'run_image_ppt_proof',
    'run_native_ppt_proof',
  ]) {
    assert.equal(cliActionRefs.has(actionRef), true, `metadata:${actionRef}`);
  }
  assert.equal(cliActions.runtimeWatch, undefined);
});

test('CLI managed command is retired from public operator surface', async () => {
  await assert.rejects(
    () => executeCli(['managed', 'supervise', '--workspace-root', '/tmp/ws', '--managed-run-id', 'managed-a']),
    /未知命令: managed/,
  );
});

test('CLI product-entry and proof command help is projected from family action metadata', () => {
  const metadata = buildRedCubeActionMetadata();

  for (const entry of metadata.cli_commands.filter((command) => (
    command.command.startsWith('redcube product ')
    || command.command.startsWith('redcube image-ppt ')
    || command.command.startsWith('redcube native-ppt ')
  ))) {
    const commandKey = entry.command.replace(/^redcube /, '');
    const help = buildCommandHelp(commandKey);

    assert.equal(help.surface_kind, 'command_help');
    assert.equal(help.command, commandKey);
    assert.equal(help.summary, entry.summary);
    assert.equal(help.usage, entry.usage);
    assert.equal(help.action_ref, entry.action_ref);
    assert.equal(help.api_surface, entry.api_surface);
    assert.deepEqual(help.boundary_fields, entry.boundary_fields);
  }
});

test('CLI domain-handler subcommand help uses family action metadata at runtime', async () => {
  for (const [argv, actionId] of [
    [['domain-handler', 'export', '--help'], 'export_domain_handler'],
    [['domain-handler', 'dispatch', '--help'], 'dispatch_domain_handler'],
  ]) {
    const help = await executeCli(argv);
    const commandKey = argv.slice(0, 2).join(' ');
    const catalogHelp = buildCommandHelp(commandKey);

    assert.equal(help.surface_kind, 'command_help');
    assert.equal(help.source_metadata, 'redcube_family_action_catalog');
    assert.equal(help.action_id, actionId);
    assert.equal(help.summary, catalogHelp.summary);
    assert.equal(help.usage, catalogHelp.usage);
  }
});

test('brand-new workspace quickstart converges doctor -> source research -> create -> audit -> run with aligned governance surfaces', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-quickstart-brand-new-'));
    const payloadFile = path.join(workspaceRoot, 'research-result.json');
    writeResearchPayload(payloadFile);

    const doctor = runCli(['workspace', 'doctor', '--workspace-root', workspaceRoot]);
    assert.equal(doctor.recommended_action, 'run_source_intake');
    assert.deepEqual(doctor.recommended_actions, ['run_source_intake', 'run_source_research']);
    assert.equal(doctor.workspaceFileExists, false);
    assert.equal(doctor.summary.workspace_bootstrap_needed, true);
    assert.deepEqual(doctor.summary.bootstrap_via, ['source_intake', 'source_research']);

    const research = runCli(
      ['source', 'research', '--workspace-root', workspaceRoot, '--topic-id', 'topic-a', '--title', '甲状腺门诊科普', '--brief', '给本科生准备一份可讲授的甲状腺门诊科普材料。', '--keywords', '甲状腺,门诊,科普', '--payload-file', payloadFile],
      { env: { ...process.env, REDCUBE_SOURCE_AUGMENT_ADAPTER: 'result_file' } },
    );
    assert.equal(research.ok, true);
    assert.equal(research.stage, 'source_augmentation_execution');
    assert.equal(research.planningReady, true);
    assert.equal(research.recommended_action, 'create_deliverable');
    assert.equal(existsSync(path.join(workspaceRoot, 'redcube.workspace.json')), true);
    assert.equal(existsSync(path.join(workspaceRoot, 'topics', 'topic-a', 'canonical', 'source-readiness-pack.json')), true);

    const created = runCli(['deliverable', 'create', '--workspace-root', workspaceRoot, '--overlay', 'ppt_deck', '--profile-id', 'lecture_student', '--topic-id', 'topic-a', '--deliverable-id', 'deck-a', '--title', '甲状腺门诊科普 deck', '--goal', '为本科生讲授甲状腺基础知识']);
    assert.equal(created.ok, true);
    assert.equal(created.surface_kind, 'deliverable_create');

    const audit = runCli(['deliverable', 'audit', '--workspace-root', workspaceRoot, '--overlay', 'ppt_deck', '--topic-id', 'topic-a', '--deliverable-id', 'deck-a', '--mode', 'draft_new']);
    assert.equal(audit.status, 'pass');
    assert.equal(audit.source_readiness_summary?.planning_ready, true);
    assert.equal(audit.gate_summary?.source_planning_ready, true);

    const run = runCli(['deliverable', 'run', '--workspace-root', workspaceRoot, '--overlay', 'ppt_deck', '--topic-id', 'topic-a', '--deliverable-id', 'deck-a', '--route', 'storyline']);
    assert.equal(run.ok, true);
    assert.equal(run.surface_kind, 'domain_entry');
    assert.equal(run.task_intent, 'run_opl_stage_execution_plan');
    assert.equal(run.result_surface.surface_kind, 'opl_stage_execution_plan');
    assert.equal(run.result_surface.delivery_identity.route, 'storyline');
    assert.equal(run.result_surface.control_policy.requested_stop_after_stage, 'storyline');
    assert.equal(run.result_surface.execution_model.repo_local_stage_runner_active_caller, false);

    const review = runCli(['review', 'get', '--workspace-root', workspaceRoot, '--topic-id', 'topic-a', '--deliverable-id', 'deck-a']);
    const projection = runCli(['review', 'projection', '--workspace-root', workspaceRoot, '--topic-id', 'topic-a']);
    try {
      runCli(['review', 'watch', '--workspace-root', workspaceRoot, '--topic-id', 'topic-a', '--deliverable-id', 'deck-a', '--run-id', 'opl-stage-plan-only']);
      assert.fail('review watch CLI wrapper must fail closed');
    } catch (error) {
      const failure = JSON.parse(error.stdout);
      assert.equal(failure.ok, false);
      assert.equal(failure.error_kind, 'cli_usage_error');
      assert.match(failure.error, /runtimeWatch default wrapper 由 OPL status\/workbench\/read-model caller 持有/);
    }

    assert.equal(review.source_readiness_summary?.planning_ready, true);
    assert.equal(review.gate_summary?.source_planning_ready, true);
    assert.equal(projection.publication.deliverables['deck-a'].source_readiness_summary.planning_ready, true);
    assert.equal(projection.publication.deliverables['deck-a'].gate_summary.source_planning_ready, true);
  });
});

test('thin workspace source intake bootstraps topic truth but keeps audit blocked until planning_ready', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-quickstart-thin-'));
  writeFileSync(path.join(workspaceRoot, 'redcube.workspace.json'), JSON.stringify({ workspace_version: 1, mode: 'agent_first_runtime' }, null, 2), 'utf-8');

  const doctor = runCli(['workspace', 'doctor', '--workspace-root', workspaceRoot]);
  assert.equal(doctor.recommended_action, 'continue');
  assert.equal(doctor.workspaceFileExists, true);

  const intake = runCli(['source', 'intake', '--workspace-root', workspaceRoot, '--topic-id', 'topic-thin', '--title', '甲状腺门诊科普', '--brief', '当前只有主题与简要说明，需要先建立 canonical source truth。', '--keywords', '甲状腺,门诊']);
  assert.equal(intake.ok, true);
  assert.equal(existsSync(path.join(workspaceRoot, 'topics', 'topic-thin', 'canonical', 'source-index.json')), true);
  assert.equal(existsSync(path.join(workspaceRoot, 'topics', 'topic-thin', 'canonical', 'source-readiness-pack.json')), true);

  const created = runCli(['deliverable', 'create', '--workspace-root', workspaceRoot, '--overlay', 'xiaohongshu', '--profile-id', 'standard_note', '--topic-id', 'topic-thin', '--deliverable-id', 'note-a', '--title', '甲状腺门诊图文', '--goal', '为门诊患者生成可发布的科普图文']);
  assert.equal(created.ok, true);

  const audit = runCli(['deliverable', 'audit', '--workspace-root', workspaceRoot, '--overlay', 'xiaohongshu', '--topic-id', 'topic-thin', '--deliverable-id', 'note-a', '--mode', 'draft_new']);
  assert.equal(audit.status, 'block');
  assert.equal(audit.recommended_action, 'run_source_research');
  assert.equal(audit.source_readiness_summary?.planning_ready, false);
  assert.equal(audit.gate_summary?.source_planning_ready, false);

  const pack = JSON.parse(readFileSync(path.join(workspaceRoot, 'topics', 'topic-thin', 'canonical', 'source-readiness-pack.json'), 'utf-8'));
  assert.equal(pack.readiness.planning_ready, false);
});
