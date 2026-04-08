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
  writeSourceAugmentationResult,
} from '../packages/redcube-gateway/src/index.js';

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

test('intakeSource creates canonical source truth from brief and keywords', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-intake-'));

  const result = await intakeSource({
    workspaceRoot,
    topicId: 'topic-a',
    title: '甲状腺门诊沟通',
    brief: '把门诊患者最常见的疑问整理成后续可消费的 shared source truth。',
    keywords: ['甲状腺', '门诊', '患者沟通'],
  });

  assert.equal(result.ok, true);
  assert.equal(result.surface_kind, 'source_intake');
  assert.equal(result.recommended_action, 'prepare_source_augmentation');
  assert.equal(result.summary.topic_id, 'topic-a');
  assert.equal(result.summary.audit_status, 'pass');
  assert.equal(result.audit.status, 'pass');
  assert.equal(existsSync(result.artifactFiles.sourceIndexFile), true);
  assert.equal(existsSync(result.artifactFiles.extractedMaterialsFile), true);
  assert.equal(existsSync(result.artifactFiles.sourceAuditFile), true);
  assert.equal(existsSync(result.artifactFiles.sourceBriefFile), true);

  const sourceBrief = readJson(result.artifactFiles.sourceBriefFile);
  assert.equal(sourceBrief.input_mode, 'brief_keywords');
  assert.equal(sourceBrief.confidence, 'low');
  assert.deepEqual(sourceBrief.keywords, ['甲状腺', '门诊', '患者沟通']);

  const sourceIndex = readJson(result.artifactFiles.sourceIndexFile);
  assert.equal(sourceIndex.sources.length >= 2, true);
  assert.equal(sourceIndex.stage_results.intake_source.status, 'pass');
  assert.equal(sourceIndex.stage_results.extract_source.status, 'pass');
  assert.equal(sourceIndex.stage_results.normalize_source.status, 'pass');
  assert.equal(sourceIndex.stage_results.source_audit.status, 'pass');

  const materials = readJson(result.artifactFiles.extractedMaterialsFile);
  assert.equal(materials.materials.some((item) => item.kind === 'brief'), true);
});

test('intakeSource writes canonical source readiness pack for downstream planning', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-intake-pack-'));

  const result = await intakeSource({
    workspaceRoot,
    topicId: 'topic-pack',
    title: '甲状腺门诊沟通',
    brief: '仅有主题和简要说明，需要后续做完整内容交付。',
    keywords: ['甲状腺', '门诊', '患者沟通'],
  });

  assert.equal(result.ok, true);
  assert.equal(existsSync(result.artifactFiles.sourceReadinessPackFile), true);
  assert.equal(existsSync(result.artifactFiles.sourceAugmentationRequestFile), true);

  const pack = readJson(result.artifactFiles.sourceReadinessPackFile);
  assert.equal(pack.schema_version, 1);
  assert.equal(pack.topic_id, 'topic-pack');
  assert.equal(pack.title, '甲状腺门诊沟通');
  assert.equal(pack.readiness.input_mode, 'brief_keywords');
  assert.equal(pack.readiness.deep_research_state, 'required');
  assert.equal(pack.readiness.sufficiency_status, 'augmentation_required');
  assert.equal(pack.readiness.material_count >= 1, true);
  assert.equal(Array.isArray(pack.fact_library.reference_source_list), true);
  assert.equal(Array.isArray(pack.fact_library.evidence_gaps), true);
  assert.equal(pack.fact_library.reference_source_list.length > 0, true);
  assert.equal(pack.fact_library.evidence_gaps.includes('public_evidence_missing'), true);

  const augmentation = readJson(result.artifactFiles.sourceAugmentationRequestFile);
  assert.equal(augmentation.schema_version, 1);
  assert.equal(augmentation.topic_id, 'topic-pack');
  assert.equal(augmentation.request_kind, 'shared_source_readiness_augmentation');
  assert.equal(augmentation.status, 'required');
  assert.equal(augmentation.execution_mode, 'auto_required');
  assert.equal(augmentation.readiness_target, 'planning_ready');
  assert.equal(Array.isArray(augmentation.trigger.evidence_gaps), true);
  assert.equal(augmentation.trigger.evidence_gaps.includes('public_evidence_missing'), true);
  assert.equal(Array.isArray(augmentation.investigation_lanes), true);
  assert.equal(augmentation.investigation_lanes.length > 0, true);
  assert.equal(Array.isArray(augmentation.focus.required_outputs), true);
  assert.equal(augmentation.focus.required_outputs.includes('reference_source_list'), true);
});

test('intakeSource blocks pdf extraction explicitly when mineru is unavailable', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-intake-'));
  const pdfFile = path.join(workspaceRoot, 'mock.pdf');
  writeFileSync(pdfFile, '%PDF-1.4 mock', 'utf-8');

  const previousToken = process.env.MINERU_TOKEN;
  const previousCmd = process.env.MINERU_EXTRACTOR_CMD;
  delete process.env.MINERU_TOKEN;
  delete process.env.MINERU_EXTRACTOR_CMD;

  try {
    const result = await intakeSource({
      workspaceRoot,
      topicId: 'topic-pdf',
      title: 'PDF 输入',
      sourceFiles: [pdfFile],
    });

    assert.equal(result.ok, false);
    assert.equal(result.surface_kind, 'source_intake');
    assert.equal(result.recommended_action, 'resolve_source_blocks');
    assert.equal(result.summary.audit_status, 'block');
    assert.equal(existsSync(result.artifactFiles.sourceAuditFile), true);
    const audit = readJson(result.artifactFiles.sourceAuditFile);
    assert.equal(audit.status, 'block');
    assert.equal(audit.blocking_reasons.includes('pdf_extraction_failed'), true);

    const index = readJson(result.artifactFiles.sourceIndexFile);
    assert.equal(index.sources[0].kind, 'pdf');
    assert.equal(index.sources[0].status, 'blocked');
    assert.match(index.sources[0].blocking_reason, /mineru/i);
  } finally {
    if (previousToken === undefined) delete process.env.MINERU_TOKEN;
    else process.env.MINERU_TOKEN = previousToken;
    if (previousCmd === undefined) delete process.env.MINERU_EXTRACTOR_CMD;
    else process.env.MINERU_EXTRACTOR_CMD = previousCmd;
  }
});

test('CLI source intake proxies gateway action', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-intake-'));

  const output = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/src/cli.js'),
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

test('CLI source augment prepares canonical augmentation contract from source readiness', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-intake-'));

  execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/src/cli.js'),
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
      path.resolve('apps/redcube-cli/src/cli.js'),
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
      path.resolve('apps/redcube-cli/src/cli.js'),
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
      path.resolve('apps/redcube-cli/src/cli.js'),
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

test('executeSourceAugmentation blocks explicitly when augmentation executor is unavailable', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-augment-'));
  const previousCmd = process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  const previousAdapter = process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
  delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  delete process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;

  try {
    await intakeSource({
      workspaceRoot,
      topicId: 'topic-augment-blocked',
      title: 'augment blocked',
      brief: '只有主题和关键词，需要联网补料。',
      keywords: ['甲状腺', '门诊'],
    });

    const result = await executeSourceAugmentation({
      workspaceRoot,
      topicId: 'topic-augment-blocked',
    });

    assert.equal(result.ok, false);
    assert.equal(result.surface_kind, 'source_augmentation_execution');
    assert.equal(result.summary.status, 'blocked');
    assert.equal(result.recommended_action, 'configure_source_augmentation_executor');
    assert.equal(existsSync(result.artifactFiles.sourceAugmentationReportFile), true);

    const report = readJson(result.artifactFiles.sourceAugmentationReportFile);
    assert.equal(report.status, 'blocked');
    assert.equal(report.blocking_reason, 'source_augmentation_executor_unconfigured');
    assert.equal(report.executor.adapter, 'external_command');
    assert.equal(report.executor.execution_surface, 'external_command');
    assert.equal(report.executor.executor_identity, 'source_augmentation_external_command');
  } finally {
    if (previousCmd === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
    else process.env.REDCUBE_SOURCE_AUGMENT_CMD = previousCmd;
    if (previousAdapter === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
    else process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = previousAdapter;
  }
});

test('executeSourceAugmentation blocks explicitly when adapter id is unsupported', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-augment-'));
  const previousCmd = process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  const previousAdapter = process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
  delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = 'unknown_adapter';

  try {
    await intakeSource({
      workspaceRoot,
      topicId: 'topic-augment-unsupported-adapter',
      title: 'augment adapter blocked',
      brief: '只有主题和关键词，需要联网补料。',
      keywords: ['甲状腺', '门诊'],
    });

    const result = await executeSourceAugmentation({
      workspaceRoot,
      topicId: 'topic-augment-unsupported-adapter',
    });

    assert.equal(result.ok, false);
    assert.equal(result.report.status, 'blocked');
    assert.match(result.report.blocking_reason, /Unsupported source augmentation adapter/);
  } finally {
    if (previousCmd === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
    else process.env.REDCUBE_SOURCE_AUGMENT_CMD = previousCmd;
    if (previousAdapter === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
    else process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = previousAdapter;
  }
});

test('executeSourceAugmentation blocks explicitly when result_file adapter input is missing', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-augment-'));
  const previousCmd = process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  const previousAdapter = process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
  const previousResultFile = process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;
  delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = 'result_file';
  process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE = path.join(workspaceRoot, 'missing-result.json');

  try {
    await intakeSource({
      workspaceRoot,
      topicId: 'topic-augment-missing-result-file',
      title: 'augment result file blocked',
      brief: '只有主题和关键词，需要联网补料。',
      keywords: ['甲状腺', '门诊'],
    });

    const result = await executeSourceAugmentation({
      workspaceRoot,
      topicId: 'topic-augment-missing-result-file',
    });

    assert.equal(result.ok, false);
    assert.equal(result.report.status, 'blocked');
    assert.equal(result.report.blocking_reason, 'source_augmentation_result_file_missing');
    assert.equal(result.report.executor.adapter, 'result_file');
    assert.equal(result.report.executor.execution_surface, 'result_file');
    assert.equal(result.report.executor.executor_identity, process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE);
  } finally {
    if (previousCmd === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
    else process.env.REDCUBE_SOURCE_AUGMENT_CMD = previousCmd;
    if (previousAdapter === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
    else process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = previousAdapter;
    if (previousResultFile === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;
    else process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE = previousResultFile;
  }
});

test('executeSourceAugmentation blocks invalid canonical request before invoking executor', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-augment-'));
  const scriptFile = path.join(workspaceRoot, 'should-not-run.js');
  const markerFile = path.join(workspaceRoot, 'executor-invoked.txt');
  const previousCmd = process.env.REDCUBE_SOURCE_AUGMENT_CMD;

  writeFileSync(
    scriptFile,
    `#!/usr/bin/env node
const fs = require('node:fs');
fs.writeFileSync(${JSON.stringify(markerFile)}, 'invoked', 'utf-8');
process.stdout.write(JSON.stringify({
  schema_version: 1,
  topic_id: 'topic-invalid-request',
  request_kind: 'shared_source_readiness_augmentation_result',
  status: 'completed',
  readiness_target: 'planning_ready',
  topic_summary: 'unexpected',
  reference_source_list: [
    { reference_id: 'REF-001', label: '国家指南', url: 'https://example.com/guideline' }
  ],
  key_fact_groups: [
    { fact_id: 'FACT-001', label: 'unexpected', reference_id: 'REF-001' }
  ],
  source_quality_notes: [],
  evidence_gap_resolution: []
}));`,
    'utf-8',
  );
  chmodSync(scriptFile, 0o755);
  process.env.REDCUBE_SOURCE_AUGMENT_CMD = scriptFile;

  try {
    await intakeSource({
      workspaceRoot,
      topicId: 'topic-invalid-request',
      title: 'invalid request',
      brief: '只有主题和关键词，需要联网补料。',
      keywords: ['甲状腺', '门诊'],
    });

    const requestFile = path.join(
      workspaceRoot,
      'topics',
      'topic-invalid-request',
      'canonical',
      'source-augmentation-request.json',
    );
    const request = readJson(requestFile);
    request.request_kind = 'broken_contract';
    writeFileSync(requestFile, JSON.stringify(request, null, 2), 'utf-8');

    const result = await executeSourceAugmentation({
      workspaceRoot,
      topicId: 'topic-invalid-request',
    });

    assert.equal(result.ok, false);
    assert.equal(result.report.status, 'blocked');
    assert.match(result.report.blocking_reason, /request contract invalid/i);
    assert.equal(existsSync(markerFile), false);
  } finally {
    if (previousCmd === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
    else process.env.REDCUBE_SOURCE_AUGMENT_CMD = previousCmd;
  }
});

test('executeSourceAugmentation blocks explicitly when executor returns invalid result contract', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-augment-'));
  const scriptFile = path.join(workspaceRoot, 'invalid-source-augment.js');
  const previousCmd = process.env.REDCUBE_SOURCE_AUGMENT_CMD;

  writeFileSync(
    scriptFile,
    `#!/usr/bin/env node
process.stdout.write(JSON.stringify({
  schema_version: 1,
  topic_id: 'topic-invalid-result',
  request_kind: 'shared_source_readiness_augmentation_result',
  status: 'completed',
  readiness_target: 'planning_ready',
  topic_summary: '缺了可追溯 reference_id 的非法结果',
  reference_source_list: [
    { label: '国家指南', url: 'https://example.com/guideline' }
  ],
  key_fact_groups: [
    { fact_id: 'FACT-001', label: 'TSH 异常后需要结合 FT4 判断下一步动作', reference_id: 'REF-001' }
  ],
  source_quality_notes: [],
  evidence_gap_resolution: []
}));`,
    'utf-8',
  );
  chmodSync(scriptFile, 0o755);
  process.env.REDCUBE_SOURCE_AUGMENT_CMD = scriptFile;

  try {
    await intakeSource({
      workspaceRoot,
      topicId: 'topic-invalid-result',
      title: 'invalid result',
      brief: '只有主题和关键词，需要联网补料。',
      keywords: ['甲状腺', '门诊'],
    });

    const result = await executeSourceAugmentation({
      workspaceRoot,
      topicId: 'topic-invalid-result',
    });

    assert.equal(result.ok, false);
    assert.equal(result.report.status, 'blocked');
    assert.match(result.report.blocking_reason, /result contract invalid/i);
  } finally {
    if (previousCmd === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
    else process.env.REDCUBE_SOURCE_AUGMENT_CMD = previousCmd;
  }
});

test('executeSourceAugmentation can consume built-in result_file adapter and upgrade readiness to planning_ready', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-augment-'));
  const resultFile = path.join(workspaceRoot, 'source-augmentation-result.json');
  const previousCmd = process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  const previousAdapter = process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
  const previousResultFile = process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;
  delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = 'result_file';
  process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE = resultFile;

  try {
    await intakeSource({
      workspaceRoot,
      topicId: 'topic-result-file',
      title: 'result file adapter',
      brief: '只有主题和关键词，需要联网补料。',
      keywords: ['甲状腺', '门诊'],
    });

    writeFileSync(
      resultFile,
      JSON.stringify({
        schema_version: 1,
        topic_id: 'topic-result-file',
        request_kind: 'shared_source_readiness_augmentation_result',
        status: 'completed',
        readiness_target: 'planning_ready',
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
      }, null, 2),
      'utf-8',
    );

    const result = await executeSourceAugmentation({
      workspaceRoot,
      topicId: 'topic-result-file',
    });

    assert.equal(result.ok, true);
    assert.equal(result.report.status, 'completed');
    assert.equal(result.report.executor.adapter, 'result_file');
    assert.equal(result.report.executor.execution_surface, 'result_file');
    assert.equal(result.report.executor.executor_identity, resultFile);
    assert.equal(result.report.added_source_count, 2);
    assert.equal(result.report.resolved_evidence_gaps.includes('public_evidence_missing'), true);

    const pack = readJson(path.join(workspaceRoot, 'topics', 'topic-result-file', 'canonical', 'source-readiness-pack.json'));
    assert.equal(pack.readiness.sufficiency_status, 'planning_ready');
    assert.equal(pack.readiness.deep_research_state, 'completed');
    assert.equal(pack.fact_library.reference_source_list.some((item) => String(item).includes('国家指南')), true);
  } finally {
    if (previousCmd === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
    else process.env.REDCUBE_SOURCE_AUGMENT_CMD = previousCmd;
    if (previousAdapter === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
    else process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = previousAdapter;
    if (previousResultFile === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;
    else process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE = previousResultFile;
  }
});

test('executeSourceAugmentation can consume canonical result file written by writeSourceAugmentationResult with default result_file path', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-augment-'));
  const previousCmd = process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  const previousAdapter = process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
  const previousResultFile = process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;
  delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = 'result_file';
  delete process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;

  try {
    await intakeSource({
      workspaceRoot,
      topicId: 'topic-result-default-path',
      title: 'result file adapter default path',
      brief: '只有主题和关键词，需要联网补料。',
      keywords: ['甲状腺', '门诊'],
    });

    await writeSourceAugmentationResult({
      workspaceRoot,
      topicId: 'topic-result-default-path',
      result: buildAugmentationResultPayload(),
    });

    const result = await executeSourceAugmentation({
      workspaceRoot,
      topicId: 'topic-result-default-path',
    });

    assert.equal(result.ok, true);
    assert.equal(result.report.status, 'completed');
    assert.equal(result.report.executor.adapter, 'result_file');
    assert.equal(result.report.executor.execution_surface, 'result_file');
    assert.equal(result.report.executor.executor_identity, 'canonical_source_augmentation_result_file');
    assert.equal(result.report.added_source_count, 2);

    const pack = readJson(path.join(workspaceRoot, 'topics', 'topic-result-default-path', 'canonical', 'source-readiness-pack.json'));
    assert.equal(pack.readiness.sufficiency_status, 'planning_ready');
    assert.equal(pack.readiness.deep_research_state, 'completed');
  } finally {
    if (previousCmd === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
    else process.env.REDCUBE_SOURCE_AUGMENT_CMD = previousCmd;
    if (previousAdapter === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
    else process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = previousAdapter;
    if (previousResultFile === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;
    else process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE = previousResultFile;
  }
});

test('CLI source execute-augmentation runs configured executor and upgrades readiness to planning_ready', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-augment-'));
  const scriptFile = path.join(workspaceRoot, 'mock-source-augment.js');
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
  topic_summary: request.focus.topic_summary + '（已补充公开证据）',
  reference_source_list: [
    { reference_id: 'REF-001', label: '国家指南', url: 'https://example.com/guideline' },
    { reference_id: 'REF-002', label: '系统综述', url: 'https://example.com/review' }
  ],
  key_fact_groups: [
    {
      fact_id: 'FACT-001',
      label: 'TSH 异常后需要结合 FT4 判断下一步动作',
      reference_id: 'REF-001'
    },
    {
      fact_id: 'FACT-002',
      label: '门诊沟通里应先解释判断顺序，再解释术语',
      reference_id: 'REF-002'
    }
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
    execFileSync(
      'node',
      [
        path.resolve('apps/redcube-cli/src/cli.js'),
        'source',
        'intake',
        '--workspace-root',
        workspaceRoot,
        '--topic-id',
        'topic-cli-execute',
        '--title',
        'CLI execute augment',
        '--brief',
        '仅有主题和关键词，需要执行后续 Deep Research 补料。',
        '--keywords',
        '甲状腺,门诊',
      ],
      { encoding: 'utf-8', cwd: path.resolve('.') },
    );

    const output = execFileSync(
      'node',
      [
        path.resolve('apps/redcube-cli/src/cli.js'),
        'source',
        'execute-augmentation',
        '--workspace-root',
        workspaceRoot,
        '--topic-id',
        'topic-cli-execute',
      ],
      { encoding: 'utf-8', cwd: path.resolve('.') },
    );

    const parsed = JSON.parse(output);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.surface_kind, 'source_augmentation_execution');
    assert.equal(parsed.summary.status, 'completed');
    assert.equal(parsed.recommended_action, 'create_deliverable');
    assert.equal(existsSync(parsed.artifactFiles.sourceAugmentationReportFile), true);

    const report = readJson(parsed.artifactFiles.sourceAugmentationReportFile);
    assert.equal(report.status, 'completed');
    assert.equal(report.executor.adapter, 'external_command');
    assert.equal(report.executor.execution_surface, 'external_command');
    assert.equal(report.executor.executor_identity, scriptFile);
    assert.equal(report.added_source_count, 2);
    assert.equal(report.resolved_evidence_gaps.includes('public_evidence_missing'), true);

    const pack = readJson(path.join(workspaceRoot, 'topics', 'topic-cli-execute', 'canonical', 'source-readiness-pack.json'));
    assert.equal(pack.readiness.sufficiency_status, 'planning_ready');
    assert.equal(pack.readiness.deep_research_state, 'completed');
    assert.equal(pack.readiness.confidence, 'medium');
    assert.equal(pack.fact_library.reference_source_list.some((item) => String(item).includes('国家指南')), true);

    const sourceBrief = readJson(path.join(workspaceRoot, 'topics', 'topic-cli-execute', 'canonical', 'source-brief.json'));
    assert.equal(sourceBrief.confidence, 'medium');
    assert.equal(sourceBrief.material_count >= 3, true);
  } finally {
    if (previousCmd === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
    else process.env.REDCUBE_SOURCE_AUGMENT_CMD = previousCmd;
    if (previousAdapter === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
    else process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = previousAdapter;
  }
});
