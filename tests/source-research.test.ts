// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import {
  researchSource,
  writeSourceAugmentationResult,
} from '@redcube/gateway';
import { buildResolvedAugmentationPayload } from './helpers/complete-source-readiness.ts';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

test('researchSource prepares canonical result scaffold when result_file route needs agent-native payload', async () => {
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
      topicId: 'topic-research-result-file',
      title: 'result file route',
      brief: '只有主题和关键词，希望 Step 1 统一 orchestration 到 research payload scaffold。',
      keywords: ['甲状腺', '门诊'],
    });

    assert.equal(result.ok, true);
    assert.equal(result.surface_kind, 'source_research');
    assert.equal(result.stage, 'source_augmentation_result_preparation');
    assert.equal(result.planningReady, false);
    assert.equal(result.recommended_action, 'write_source_augmentation_result');
    assert.equal(existsSync(result.artifactFiles.sourceAugmentationRequestFile), true);
    assert.equal(existsSync(result.artifactFiles.sourceAugmentationResultFile), true);

    const resultDraft = readJson(result.artifactFiles.sourceAugmentationResultFile);
    assert.equal(resultDraft.topic_id, 'topic-research-result-file');
    assert.equal(resultDraft.request_kind, 'shared_source_readiness_augmentation_result');
  } finally {
    if (previousCmd === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
    else process.env.REDCUBE_SOURCE_AUGMENT_CMD = previousCmd;
    if (previousAdapter === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
    else process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = previousAdapter;
    if (previousResultFile === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;
    else process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE = previousResultFile;
  }
});

test('researchSource can complete Step 1 through external_command adapter', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-research-'));
  const scriptFile = path.join(workspaceRoot, 'mock-source-research.js');
  const previousCmd = process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  const previousAdapter = process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;

  writeFileSync(
    scriptFile,
    `#!/usr/bin/env node
const fs = require('node:fs');
const request = JSON.parse(fs.readFileSync(process.argv[2], 'utf-8'));
process.stdout.write(JSON.stringify({
  schema_version: 1,
  topic_id: request.topic_id,
  request_kind: 'shared_source_readiness_augmentation_result',
  status: 'completed',
  readiness_target: 'planning_ready',
  topic_summary: request.focus.topic_summary + '（已完成 source research）',
  reference_source_list: [
    { reference_id: 'REF-001', label: '国家指南', url: 'https://example.com/guideline' },
    { reference_id: 'REF-002', label: '系统综述', url: 'https://example.com/review' }
  ],
  key_fact_groups: [
    { fact_id: 'FACT-001', label: 'TSH 异常后需要结合 FT4 判断下一步动作', reference_id: 'REF-001' },
    { fact_id: 'FACT-002', label: '门诊沟通里应先解释判断顺序，再解释术语', reference_id: 'REF-002' }
  ],
  source_quality_notes: ['优先使用公开指南与系统综述。'],
  evidence_gap_resolution: [
    { gap_id: 'public_evidence_missing', status: 'resolved', note: '已补入可追溯公开来源。' },
    { gap_id: 'consumable_material_missing', status: 'resolved', note: '已补入可直接消费的事实材料。' }
  ]
}));`,
    'utf-8',
  );
  chmodSync(scriptFile, 0o755);
  process.env.REDCUBE_SOURCE_AUGMENT_CMD = scriptFile;
  delete process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;

  try {
    const result = await researchSource({
      workspaceRoot,
      topicId: 'topic-research-external',
      title: 'external command route',
      brief: '只有主题和关键词，希望统一跑完 Step 1。',
      keywords: ['甲状腺', '门诊'],
    });

    assert.equal(result.ok, true);
    assert.equal(result.surface_kind, 'source_research');
    assert.equal(result.stage, 'source_augmentation_execution');
    assert.equal(result.planningReady, true);
    assert.equal(result.recommended_action, 'create_deliverable');
    assert.equal(result.execution.report.status, 'completed');

    const pack = readJson(path.join(workspaceRoot, 'topics', 'topic-research-external', 'canonical', 'source-readiness-pack.json'));
    assert.equal(pack.readiness.sufficiency_status, 'planning_ready');
    assert.equal(pack.readiness.deep_research_state, 'completed');
    assert.equal(pack.readiness.planning_ready, true);
  } finally {
    if (previousCmd === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
    else process.env.REDCUBE_SOURCE_AUGMENT_CMD = previousCmd;
    if (previousAdapter === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
    else process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = previousAdapter;
  }
});

test('CLI source research proxies unified Step 1 orchestration surface', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-research-cli-'));
  const previousCmd = process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  const previousAdapter = process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
  const previousResultFile = process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;
  delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = 'result_file';
  delete process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;

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
        'CLI source research',
        '--brief',
        '只有主题和关键词，希望统一 orchestration 到 result scaffold。',
        '--keywords',
        '甲状腺,门诊',
      ],
      { encoding: 'utf-8', cwd: path.resolve('.') },
    );

    const parsed = JSON.parse(output);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.surface_kind, 'source_research');
    assert.equal(parsed.stage, 'source_augmentation_result_preparation');
    assert.equal(parsed.recommended_action, 'write_source_augmentation_result');
    assert.equal(existsSync(parsed.artifactFiles.sourceAugmentationResultFile), true);
  } finally {
    if (previousCmd === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
    else process.env.REDCUBE_SOURCE_AUGMENT_CMD = previousCmd;
    if (previousAdapter === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
    else process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = previousAdapter;
    if (previousResultFile === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;
    else process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE = previousResultFile;
  }
});

test('researchSource can resume from an existing canonical augmentation result file', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-research-resume-'));
  const previousCmd = process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  const previousAdapter = process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
  const previousResultFile = process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;
  delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = 'result_file';
  delete process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;

  try {
    const staged = await researchSource({
      workspaceRoot,
      topicId: 'topic-research-resume',
      title: 'resume from canonical result',
      brief: '只有主题和关键词，但 canonical augmentation result 已经补齐。',
      keywords: ['甲状腺', '门诊'],
    });

    assert.equal(staged.stage, 'source_augmentation_result_preparation');
    const request = readJson(staged.artifactFiles.sourceAugmentationRequestFile);

    await writeSourceAugmentationResult({
      workspaceRoot,
      topicId: 'topic-research-resume',
      result: buildResolvedAugmentationPayload(request),
    });

    const resumed = await researchSource({
      workspaceRoot,
      topicId: 'topic-research-resume',
      title: 'resume from canonical result',
      brief: '只有主题和关键词，但 canonical augmentation result 已经补齐。',
      keywords: ['甲状腺', '门诊'],
    });

    assert.equal(resumed.ok, true);
    assert.equal(resumed.stage, 'source_augmentation_execution');
    assert.equal(resumed.planningReady, true);
    assert.equal(resumed.execution.report.planning_ready, true);
    assert.equal(resumed.recommended_action, 'create_deliverable');
  } finally {
    if (previousCmd === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
    else process.env.REDCUBE_SOURCE_AUGMENT_CMD = previousCmd;
    if (previousAdapter === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
    else process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = previousAdapter;
    if (previousResultFile === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;
    else process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE = previousResultFile;
  }
});
