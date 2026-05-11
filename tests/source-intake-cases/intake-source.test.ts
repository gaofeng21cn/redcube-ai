// @ts-nocheck
import {
  assert,
  assertWorkspaceGitBoundary,
  buildAugmentationResultPayload,
  execFileSync,
  existsSync,
  intakeSource,
  mkdtempSync,
  os,
  path,
  prepareSourceAugmentationResult,
  readFileSync,
  readJson,
  researchSource,
  test,
  writeFileSync,
  writeSourceAugmentationResult,
} from '../gateway-case-shared.ts';

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
    'Med Auto Science 是医学科研 domain-agent，通过 source extraction、fact library、study planning 与 publication delivery，把证据、任务和交付状态连接到可验证的研究工作流。',
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
  assert.equal(pack.fact_library.topic_summary.includes('source extraction'), true);
  assert.equal(pack.fact_library.topic_summary.includes('fact library'), true);
  assert.equal(pack.fact_library.topic_summary.includes('domain-agent'), true);
  assert.equal(pack.fact_library.topic_summary.includes('封面必须署名'), false);
  assert.equal(
    pack.fact_library.reference_source_list.some((item) => item.includes('content-01-med-autoscience.md')),
    true,
  );
  assert.equal(
    pack.fact_library.key_fact_groups.some((item) => item.label.includes('source extraction') && item.source_id === 'SRC-FILE-1'),
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
    '`Med Auto Science` 是医学科研 domain-agent，基于 source extraction 和 fact library 组织证据、规划研究任务，并把 publication delivery 产物保持在可审计状态。',
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
  assert.equal(pack.fact_library.topic_summary.includes('source extraction'), true);
  assert.equal(pack.fact_library.topic_summary.includes('fact library'), true);
  assert.equal(pack.fact_library.topic_summary.includes('domain-agent'), true);
  assert.deepEqual(pack.fact_library.reference_source_list, [
    'inputs/raw_materials/source-intake/content-01-opl-readme.md',
  ]);
  assert.equal(
    pack.fact_library.key_fact_groups.some((item) => item.label.includes('fact library') && item.source_id === 'SRC-FILE-1'),
    true,
  );
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
