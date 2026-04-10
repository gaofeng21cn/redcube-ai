import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

function runCli(args, options = {}) {
  const output = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/src/cli.js'), ...args],
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

test('CLI help keeps deliverable run as the canonical quickstart surface while managed execute remains available', () => {
  const parsed = runCli(['help']);

  assert.equal(parsed.commonTasks.some((item) => item.command.includes('deliverable run')), true);
  assert.equal(parsed.commonTasks.some((item) => item.command.includes('deliverable execute')), true);
  assert.deepEqual(parsed.commonFlows.ppt_deck, [
    '1. redcube workspace doctor --workspace-root <dir>',
    '2. redcube source research --workspace-root <dir> --topic-id <id> ...',
    '3. redcube deliverable create --workspace-root <dir> --overlay ppt_deck --profile-id lecture_student ...',
    '4. redcube deliverable audit --workspace-root <dir> --overlay ppt_deck --mode draft_new ...',
    '5. redcube deliverable run --workspace-root <dir> --overlay ppt_deck --route <stage> ...',
  ]);
  assert.equal(typeof parsed.usage.deliverableRun, 'string');
  assert.equal(typeof parsed.usage.deliverableExecute, 'string');
});

test('brand-new workspace quickstart converges doctor -> source research -> create -> audit -> run with aligned governance surfaces', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-quickstart-brand-new-'));
  const payloadFile = path.join(workspaceRoot, 'research-result.json');
  writeResearchPayload(payloadFile);

  const doctor = runCli(['workspace', 'doctor', '--workspace-root', workspaceRoot]);
  assert.equal(doctor.recommended_action, 'run_source_intake');
  assert.equal(doctor.workspaceFileExists, false);
  assert.equal(doctor.summary.workspace_bootstrap_needed, true);
  assert.equal(doctor.summary.bootstrap_via, 'source_intake');

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
  assert.equal(run.run.status, 'completed');
  assert.equal(run.run.current_stage, 'storyline');

  const review = runCli(['review', 'get', '--workspace-root', workspaceRoot, '--topic-id', 'topic-a', '--deliverable-id', 'deck-a']);
  const projection = runCli(['review', 'projection', '--workspace-root', workspaceRoot, '--topic-id', 'topic-a']);
  const watch = runCli(['review', 'watch', '--workspace-root', workspaceRoot, '--topic-id', 'topic-a', '--deliverable-id', 'deck-a', '--run-id', run.run.run_id]);

  assert.equal(review.source_readiness_summary?.planning_ready, true);
  assert.equal(review.gate_summary?.source_planning_ready, true);
  assert.equal(projection.publication.deliverables['deck-a'].source_readiness_summary.planning_ready, true);
  assert.equal(projection.publication.deliverables['deck-a'].gate_summary.source_planning_ready, true);
  assert.equal(watch.source_readiness_summary?.planning_ready, true);
  assert.equal(watch.gate_summary?.source_planning_ready, true);
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
