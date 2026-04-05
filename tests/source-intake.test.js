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
  assert.equal(parsed.audit.status, 'pass');
  assert.equal(existsSync(parsed.artifactFiles.sourceBriefFile), true);
});
