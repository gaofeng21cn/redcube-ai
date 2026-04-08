import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

import { intakeSource } from '../packages/redcube-gateway/src/index.js';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
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
