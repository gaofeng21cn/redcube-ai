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
  assertWorkspaceGitBoundary(workspaceRoot);
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

test('intakeSource reuses unchanged file source extraction by source content hash', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-intake-incremental-'));
  const sourceFile = path.join(workspaceRoot, 'source.md');
  writeFileSync(sourceFile, '# 甲状腺门诊\n\nTSH 异常后需要结合 FT4 判断。');

  const first = await intakeSource({
    workspaceRoot,
    topicId: 'topic-incremental',
    title: '甲状腺门诊沟通',
    sourceFiles: [sourceFile],
  });
  const firstManifest = readJson(first.artifactFiles.sourcePackManifestFile);
  const firstMaterials = readJson(first.artifactFiles.extractedMaterialsFile);

  const second = await intakeSource({
    workspaceRoot,
    topicId: 'topic-incremental',
    title: '甲状腺门诊沟通',
    sourceFiles: [sourceFile],
  });
  const secondManifest = readJson(second.artifactFiles.sourcePackManifestFile);
  const secondMaterials = readJson(second.artifactFiles.extractedMaterialsFile);

  assert.equal(second.ok, true);
  assert.equal(second.cache_status, 'hit');
  assert.equal(secondManifest.reuse.frozen_source_pack_reused, true);
  assert.equal(secondManifest.reuse.skip_reason, 'unchanged_source_manifest');
  assert.equal(secondManifest.reuse.reused_source_count, 1);
  assert.equal(secondManifest.reuse.changed_source_count, 0);
  assert.equal(secondManifest.sources[0].content_hash, firstManifest.sources[0].content_hash);
  assert.deepEqual(secondMaterials.materials, firstMaterials.materials);

  writeFileSync(sourceFile, '# 甲状腺门诊\n\nTSH 异常后需要结合 FT4 和症状判断。');
  const third = await intakeSource({
    workspaceRoot,
    topicId: 'topic-incremental',
    title: '甲状腺门诊沟通',
    sourceFiles: [sourceFile],
  });
  const thirdManifest = readJson(third.artifactFiles.sourcePackManifestFile);
  const thirdMaterials = readJson(third.artifactFiles.extractedMaterialsFile);

  assert.equal(third.ok, true);
  assert.equal(third.cache_status, 'miss');
  assert.equal(thirdManifest.reuse.frozen_source_pack_reused, false);
  assert.equal(thirdManifest.reuse.skip_reason, 'source_content_changed');
  assert.equal(thirdManifest.reuse.reused_source_count, 0);
  assert.equal(thirdManifest.reuse.changed_source_count, 1);
  assert.notEqual(thirdManifest.sources[0].content_hash, firstManifest.sources[0].content_hash);
  assert.equal(thirdManifest.sources[0].extraction.reused, false);
  assert.equal(thirdManifest.sources[0].evidence_index.reused, false);
  assert.match(thirdMaterials.materials[0].content_text, /症状判断/);
});

test('intakeSource scaffolds workspace-level xiaohongshu author template with generic RedCube defaults', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-intake-workspace-template-'));

  const result = await intakeSource({
    workspaceRoot,
    topicId: 'topic-template',
    title: '通用知识主题',
    brief: '验证 brand-new workspace 会自动生成可修改的作者模板。',
    keywords: ['通用', '作者模板'],
  });

  assert.equal(result.ok, true);

  const runtimeFile = path.join(workspaceRoot, '.redcube', 'runtime.json');
  const identityFile = path.join(workspaceRoot, '.redcube', 'identity.json');
  const readmeFile = path.join(workspaceRoot, '.redcube', 'README.md');
  const authorLibraryFile = path.join(
    workspaceRoot,
    '.redcube',
    'prompts',
    'aligned',
    '自动小红书',
    '作者档案库.md',
  );

  assert.equal(existsSync(runtimeFile), true);
  assert.equal(existsSync(identityFile), true);
  assert.equal(existsSync(readmeFile), true);
  assert.equal(existsSync(authorLibraryFile), true);

  const runtime = readJson(runtimeFile);
  const identity = readJson(identityFile);
  const authorLibrary = readFileSync(authorLibraryFile, 'utf-8');
  const readme = readFileSync(readmeFile, 'utf-8');

  assert.equal(runtime.promptsDir, './prompts');
  assert.equal(identity.defaultProfileId, 'redcube_author');
  assert.equal(identity.routing.medicalProfileId, 'redcube_author');
  assert.equal(identity.profiles.redcube_author.signatureDisplay, 'RedCube AI');
  assert.equal(identity.profiles.redcube_author.signatureSubtitle, '请改成你的署名与品牌');
  assert.match(authorLibrary, /## profile_id: redcube_author/);
  assert.match(authorLibrary, /署名显示：RedCube AI/);
  assert.match(readme, /workspace 级作者配置模板/);
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
  assert.equal(pack.readiness.planning_ready, false);
  assert.equal(pack.readiness.material_count, 0);
  assert.equal(Array.isArray(pack.fact_library.reference_source_list), true);
  assert.equal(Array.isArray(pack.fact_library.evidence_gaps), true);
  assert.equal(Array.isArray(pack.fact_library.blocking_evidence_gaps), true);
  assert.equal(Array.isArray(pack.fact_library.residual_evidence_gaps), true);
  assert.deepEqual(pack.fact_library.reference_source_list, []);
  assert.deepEqual(pack.fact_library.key_fact_groups, []);
  assert.equal(pack.fact_library.evidence_gaps.includes('public_evidence_missing'), true);
  assert.equal(pack.fact_library.blocking_evidence_gaps.includes('public_evidence_missing'), true);
  assert.equal(pack.release_gate.pass, false);
  assert.equal(pack.release_gate.next_required_surface, 'source_research');

  const augmentation = readJson(result.artifactFiles.sourceAugmentationRequestFile);
  assert.equal(augmentation.schema_version, 1);
  assert.equal(augmentation.topic_id, 'topic-pack');
  assert.equal(augmentation.request_kind, 'shared_source_readiness_augmentation');
  assert.equal(augmentation.status, 'required');
  assert.equal(augmentation.execution_mode, 'auto_required');
  assert.equal(augmentation.readiness_target, 'planning_ready');
  assert.equal(Array.isArray(augmentation.trigger.blocking_evidence_gaps), true);
  assert.equal(Array.isArray(augmentation.trigger.residual_evidence_gaps), true);
  assert.equal(Array.isArray(augmentation.trigger.evidence_gaps), true);
  assert.equal(augmentation.trigger.evidence_gaps.includes('public_evidence_missing'), true);
  assert.equal(augmentation.trigger.blocking_evidence_gaps.includes('public_evidence_missing'), true);
  assert.equal(Array.isArray(augmentation.investigation_lanes), true);
  assert.equal(augmentation.investigation_lanes.length > 0, true);
  assert.equal(Array.isArray(augmentation.focus.required_outputs), true);
  assert.equal(augmentation.focus.required_outputs.includes('reference_source_list'), true);
});

test('intakeSource keeps operator brief out of audience-facing fact summary while preserving it in augmentation focus', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-intake-brief-split-'));

  const result = await intakeSource({
    workspaceRoot,
    topicId: 'topic-brief-split',
    title: 'MedAutoScience 系统介绍',
    brief: '封面必须署名；重点回答三件事；先讲什么、后讲什么要清楚；这些都是给制作系统的操作要求，不是给听众直接看的正文。',
    keywords: ['MedAutoScience', '自动科研', '医学人工智能'],
  });

  const pack = readJson(result.artifactFiles.sourceReadinessPackFile);
  const augmentation = readJson(result.artifactFiles.sourceAugmentationRequestFile);

  assert.equal(pack.fact_library.topic_summary, 'MedAutoScience 系统介绍');
  assert.equal(pack.fact_library.topic_summary.includes('封面必须署名'), false);
  assert.equal(pack.fact_library.topic_summary.includes('重点回答三件事'), false);
  assert.deepEqual(pack.fact_library.reference_source_list, []);
  assert.deepEqual(pack.fact_library.key_fact_groups, []);
  assert.equal(augmentation.focus.topic_summary, 'MedAutoScience 系统介绍');
  assert.equal(augmentation.focus.brief_text.includes('封面必须署名'), true);
  assert.equal(augmentation.focus.brief_text.includes('重点回答三件事'), true);
});

test('intakeSource keeps operator files out of audience-facing fact library while preserving them as operator context', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-intake-operator-files-'));
  const contentFile = path.join(workspaceRoot, 'med-autoscience.md');
  const operatorFile = path.join(workspaceRoot, 'speaker-rules.md');
  writeFileSync(contentFile, [
    '# Med Auto Science',
    '',
    'Med Auto Science 是医学 Research Ops gateway，用正式控制链把 source readiness、study execution 与 publication delivery 收口在同一条主线上。',
  ].join('\n'), 'utf-8');
  writeFileSync(operatorFile, [
    '# 讲课工作台规则',
    '',
    '封面必须署名；重点回答三件事；先讲什么、后讲什么要清楚；这些都是制作约束，不是听众正文。',
  ].join('\n'), 'utf-8');

  const result = await intakeSource({
    workspaceRoot,
    topicId: 'topic-operator-files',
    title: 'MedAutoScience 讲课',
    sourceFiles: [contentFile],
    operatorFiles: [operatorFile],
  });

  const pack = readJson(result.artifactFiles.sourceReadinessPackFile);
  const extracted = readJson(result.artifactFiles.extractedMaterialsFile);
  const index = readJson(result.artifactFiles.sourceIndexFile);

  assert.equal(pack.fact_library.topic_summary.includes('Med Auto Science'), true);
  assert.equal(pack.fact_library.topic_summary.includes('封面必须署名'), false);
  assert.equal(
    pack.fact_library.reference_source_list.some((item) => item.includes('content-01-med-autoscience.md')),
    true,
  );
  assert.equal(
    pack.fact_library.reference_source_list.some((item) => item.includes('operator-01-speaker-rules.md')),
    false,
  );
  assert.equal(
    extracted.materials.some((item) => item.source_role === 'operator_context' && item.source_id === 'SRC-OP-1'),
    true,
  );
  assert.equal(
    index.sources.some((item) => item.source_role === 'operator_context' && item.source_id === 'SRC-OP-1'),
    true,
  );
});

test('intakeSource preserves current source_role when reusing duplicate content hashes', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-intake-role-reuse-'));
  const approvedFile = path.join(workspaceRoot, 'approved-outline.md');
  writeFileSync(approvedFile, [
    '# Approved outline',
    '',
    '## Slide 1: 开场',
    '',
    '## Slide 32: 收束',
  ].join('\n'), 'utf-8');

  const first = await intakeSource({
    workspaceRoot,
    topicId: 'topic-role-reuse',
    title: 'OPL 介绍',
    operatorFiles: [approvedFile],
  });
  const firstExtracted = readJson(first.artifactFiles.extractedMaterialsFile);
  assert.equal(firstExtracted.materials.some((item) => item.source_role === 'operator_context'), true);

  const second = await intakeSource({
    workspaceRoot,
    topicId: 'topic-role-reuse',
    title: 'OPL 介绍',
    sourceFiles: [approvedFile],
    operatorFiles: [approvedFile],
  });
  const secondExtracted = readJson(second.artifactFiles.extractedMaterialsFile);
  assert.equal(
    secondExtracted.materials.some((item) => item.source_id === 'SRC-FILE-1' && item.source_role === 'content_source'),
    true,
  );
  assert.equal(
    secondExtracted.materials.some((item) => item.source_id === 'SRC-OP-1' && item.source_role === 'operator_context'),
    true,
  );
  const secondBrief = readJson(second.artifactFiles.sourceBriefFile);
  assert.equal(secondBrief.consumable_material_count >= 1, true);
});

test('intakeSource cleans markdown wrapper noise out of audience-facing fact library', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-intake-markdown-clean-'));
  const markdownFile = path.join(workspaceRoot, 'opl-readme.md');
  writeFileSync(markdownFile, [
    '<p align="center"><img src="assets/branding/opl-banner.svg" alt="One Person Lab banner" width="100%" /></p>',
    '',
    '<p align="center"><a href="./README.md">English</a> | <a href="./README.zh-CN.md"><strong>中文</strong></a></p>',
    '',
    '# 项目概览',
    '',
    '`Med Auto Science` 是共享 `Unified Harness Engineering Substrate` 之上的医学 `Research Ops` gateway 与 `Domain Harness OS`。',
  ].join('\n'), 'utf-8');

  const result = await intakeSource({
    workspaceRoot,
    topicId: 'topic-markdown-clean',
    title: 'MedAutoScience 系统介绍',
    brief: '给医学人工智能同行介绍系统设计。',
    keywords: ['MedAutoScience', '自动科研'],
    sourceFiles: [markdownFile],
  });

  const pack = readJson(result.artifactFiles.sourceReadinessPackFile);

  assert.equal(pack.fact_library.topic_summary.includes('<p align'), false);
  assert.equal(pack.fact_library.topic_summary.includes('English'), false);
  assert.equal(pack.fact_library.topic_summary.includes('Domain Harness OS'), true);
  assert.deepEqual(pack.fact_library.reference_source_list, [
    'inputs/raw_materials/source-intake/content-01-opl-readme.md',
  ]);
  assert.equal(
    pack.fact_library.key_fact_groups.some((item) => ['SRC-BRIEF', 'SRC-KEYWORDS'].includes(item.source_id)),
    false,
  );
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

