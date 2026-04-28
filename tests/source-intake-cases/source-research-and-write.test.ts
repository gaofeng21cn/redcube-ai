// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

import {
  executeSourceAugmentation,
  intakeSource,
  prepareSourceAugmentationResult,
  researchSource,
  writeSourceAugmentationResult,
} from '@redcube/gateway';
import { assertWorkspaceGitBoundary } from '../helpers/workspace-git-boundary.ts';
function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function buildAugmentationResultPayload(overrides = {}) {
  return {
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
    ...overrides,
  };
}

test('CLI source intake proxies gateway action', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-intake-'));

  const output = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/dist/cli.js'),
      'source',
      'intake',
      '--workspace-root',
      workspaceRoot,
      '--topic-id',
      'topic-cli',
      '--title',
      'CLI intake',
      '--brief',
      '从 CLI 进入 shared source intake',
      '--keywords',
      '甲状腺,门诊',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.surface_kind, 'source_intake');
  assert.equal(parsed.recommended_action, 'prepare_source_augmentation');
  assert.equal(parsed.audit.status, 'pass');
  assert.equal(existsSync(parsed.artifactFiles.sourceBriefFile), true);
});

test('researchSource stops at canonical result scaffold when result_file route needs agent-authored payload', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-research-'));
  const previousCmd = process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  const previousAdapter = process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
  const previousResultFile = process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;
  delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = 'result_file';
  delete process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;

  try {
    const result = await researchSource({
      workspaceRoot,
      topicId: 'topic-research-awaiting-payload',
      title: 'research awaiting payload',
      brief: '只有主题和关键词，需要先进入 Research 准备事实材料。',
      keywords: ['甲状腺', '门诊'],
    });

    assert.equal(result.ok, true);
    assert.equal(result.surface_kind, 'source_research');
    assert.equal(result.stage, 'source_augmentation_result_preparation');
    assert.equal(result.planningReady, false);
    assert.equal(result.recommended_action, 'write_source_augmentation_result');
    assert.equal(existsSync(result.artifactFiles.sourceAugmentationRequestFile), true);
    assert.equal(existsSync(result.artifactFiles.sourceAugmentationResultFile), true);
    assert.equal(existsSync(result.artifactFiles.sourceResearchReportFile), true);

    const report = readJson(result.artifactFiles.sourceResearchReportFile);
    assert.equal(report.status, 'awaiting_input');
    assert.equal(report.stage, 'source_augmentation_result_preparation');
    assert.equal(report.planning_ready, false);
    assert.equal(report.readiness_target, 'planning_ready');
    assert.equal(report.recommended_action, 'write_source_augmentation_result');
  } finally {
    if (previousCmd === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
    else process.env.REDCUBE_SOURCE_AUGMENT_CMD = previousCmd;
    if (previousAdapter === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
    else process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = previousAdapter;
    if (previousResultFile === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;
    else process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE = previousResultFile;
  }
});

test('researchSource can complete Source Readiness end-to-end on result_file route when payload is supplied', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-research-complete-'));
  const previousCmd = process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  const previousAdapter = process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
  const previousResultFile = process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;
  delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = 'result_file';
  delete process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;

  try {
    const result = await researchSource({
      workspaceRoot,
      topicId: 'topic-research-complete',
      title: 'research complete',
      brief: '只有主题和关键词，需要完成完整 Research。',
      keywords: ['甲状腺', '门诊'],
      result: buildAugmentationResultPayload(),
    });

    assert.equal(result.ok, true);
    assert.equal(result.surface_kind, 'source_research');
    assert.equal(result.stage, 'source_augmentation_execution');
    assert.equal(result.planningReady, true);
    assert.equal(result.recommended_action, 'create_deliverable');
    assert.equal(result.execution.report.status, 'completed');
    assert.equal(existsSync(result.artifactFiles.sourceResearchReportFile), true);

    const report = readJson(result.artifactFiles.sourceResearchReportFile);
    assert.equal(report.status, 'completed');
    assert.equal(report.stage, 'source_augmentation_execution');
    assert.equal(report.planning_ready, true);
    assert.equal(report.sufficiency_status, 'planning_ready');
    assert.equal(report.deep_research_state, 'completed');
    assert.equal(report.recommended_action, 'create_deliverable');

    const pack = readJson(path.join(workspaceRoot, 'topics', 'topic-research-complete', 'canonical', 'source-readiness-pack.json'));
    assert.equal(pack.readiness.sufficiency_status, 'planning_ready');
    assert.equal(pack.readiness.deep_research_state, 'completed');
    assert.equal(pack.readiness.planning_ready, true);
  } finally {
    if (previousCmd === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
    else process.env.REDCUBE_SOURCE_AUGMENT_CMD = previousCmd;
    if (previousAdapter === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
    else process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = previousAdapter;
    if (previousResultFile === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;
    else process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE = previousResultFile;
  }
});

test('CLI source augment prepares canonical augmentation contract from source readiness', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-intake-'));

  execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/dist/cli.js'),
      'source',
      'intake',
      '--workspace-root',
      workspaceRoot,
      '--topic-id',
      'topic-cli-augment',
      '--title',
      'CLI augment',
      '--brief',
      '仅有主题和关键词，需要准备后续 Deep Research 补料合同。',
      '--keywords',
      '甲状腺,门诊',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const output = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/dist/cli.js'),
      'source',
      'augment',
      '--workspace-root',
      workspaceRoot,
      '--topic-id',
      'topic-cli-augment',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.surface_kind, 'source_augmentation');
  assert.equal(parsed.summary.topic_id, 'topic-cli-augment');
  assert.equal(parsed.summary.status, 'required');
  assert.equal(parsed.summary.readiness_target, 'planning_ready');
  assert.equal(typeof parsed.augmentation.focus.topic_summary, 'string');
  assert.equal(Array.isArray(parsed.augmentation.investigation_lanes), true);
  assert.equal(existsSync(parsed.artifactFiles.sourceAugmentationRequestFile), true);
});

test('CLI source research can finish Source Readiness end-to-end on result_file route', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-research-cli-'));
  const payloadFile = path.join(workspaceRoot, 'research-result-payload.json');
  const previousCmd = process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  const previousAdapter = process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
  const previousResultFile = process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;
  delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = 'result_file';
  delete process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;

  writeFileSync(payloadFile, JSON.stringify(buildAugmentationResultPayload(), null, 2), 'utf-8');

  try {
    const output = execFileSync(
      'node',
      [
        path.resolve('apps/redcube-cli/dist/cli.js'),
        'source',
        'research',
        '--workspace-root',
        workspaceRoot,
        '--topic-id',
        'topic-cli-research',
        '--title',
        'CLI research',
        '--brief',
        '只有主题和关键词，需要一条命令把 Step 1 跑到 planning_ready。',
        '--keywords',
        '甲状腺,门诊',
        '--payload-file',
        payloadFile,
      ],
      { encoding: 'utf-8', cwd: path.resolve('.') },
    );

    const parsed = JSON.parse(output);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.surface_kind, 'source_research');
    assert.equal(parsed.stage, 'source_augmentation_execution');
    assert.equal(parsed.planningReady, true);
    assert.equal(parsed.recommended_action, 'create_deliverable');
    assert.equal(existsSync(parsed.artifactFiles.sourceResearchReportFile), true);
  } finally {
    if (previousCmd === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
    else process.env.REDCUBE_SOURCE_AUGMENT_CMD = previousCmd;
    if (previousAdapter === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
    else process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = previousAdapter;
    if (previousResultFile === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;
    else process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE = previousResultFile;
  }
});

test('prepareSourceAugmentationResult exposes canonical result scaffold for agent-native research route', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-augment-prepare-result-'));

  await intakeSource({
    workspaceRoot,
    topicId: 'topic-prepare-result',
    title: 'prepare augmentation result',
    brief: '只有主题和关键词，需要准备后续 Deep Research 结果 scaffold。',
    keywords: ['甲状腺', '门诊'],
  });

  const prepared = await prepareSourceAugmentationResult({
    workspaceRoot,
    topicId: 'topic-prepare-result',
  });

  assert.equal(prepared.ok, true);
  assert.equal(prepared.surface_kind, 'source_augmentation_result_preparation');
  assert.equal(prepared.recommended_action, 'write_source_augmentation_result');
  assert.equal(prepared.resultDraft.topic_id, 'topic-prepare-result');
  assert.equal(prepared.resultDraft.request_kind, 'shared_source_readiness_augmentation_result');
  assert.equal(prepared.resultDraft.evidence_gap_resolution.length >= 1, true);
  assert.equal(
    prepared.artifactFiles.sourceAugmentationResultFile,
    path.join(workspaceRoot, 'topics', 'topic-prepare-result', 'canonical', 'source-augmentation-result.json'),
  );
});

test('writeSourceAugmentationResult stages canonical augmentation result artifact from structured payload', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-augment-write-'));

  await intakeSource({
    workspaceRoot,
    topicId: 'topic-write-result',
    title: 'write augmentation result',
    brief: '只有主题和关键词，需要先补齐事实材料，再推进 Storyline。',
    keywords: ['甲状腺', '门诊'],
  });

  const staged = await writeSourceAugmentationResult({
    workspaceRoot,
    topicId: 'topic-write-result',
    result: buildAugmentationResultPayload(),
  });

  assert.equal(staged.ok, true);
  assert.equal(staged.surface_kind, 'source_augmentation_result_write');
  assert.equal(staged.recommended_action, 'execute_source_augmentation');
  assert.equal(existsSync(staged.artifactFiles.sourceAugmentationResultFile), true);

  const canonicalResult = readJson(staged.artifactFiles.sourceAugmentationResultFile);
  assert.equal(canonicalResult.schema_version, 1);
  assert.equal(canonicalResult.topic_id, 'topic-write-result');
  assert.equal(canonicalResult.request_kind, 'shared_source_readiness_augmentation_result');
  assert.equal(canonicalResult.status, 'completed');
  assert.equal(canonicalResult.readiness_target, 'planning_ready');
  assert.equal(canonicalResult.evidence_gap_resolution.length, 2);
});

test('CLI source write-augmentation-result stages canonical result artifact from payload file', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-intake-'));
  const payloadFile = path.join(workspaceRoot, 'augmentation-result-payload.json');

  execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/dist/cli.js'),
      'source',
      'intake',
      '--workspace-root',
      workspaceRoot,
      '--topic-id',
      'topic-cli-write',
      '--title',
      'CLI write augment result',
      '--brief',
      '只有主题和关键词，需要先补齐事实材料。',
      '--keywords',
      '甲状腺,门诊',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  writeFileSync(payloadFile, JSON.stringify(buildAugmentationResultPayload(), null, 2), 'utf-8');

  const output = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/dist/cli.js'),
      'source',
      'write-augmentation-result',
      '--workspace-root',
      workspaceRoot,
      '--topic-id',
      'topic-cli-write',
      '--payload-file',
      payloadFile,
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.surface_kind, 'source_augmentation_result_write');
  assert.equal(parsed.recommended_action, 'execute_source_augmentation');
  assert.equal(existsSync(parsed.artifactFiles.sourceAugmentationResultFile), true);
});

