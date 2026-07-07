// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  createDeliverable,
  intakeSource,
  runDeliverableRoute,
} from './product-domain-action-test-api.ts';
import { createPptDeckRuntimeCore } from '../packages/redcube-runtime/dist/families/ppt/ppt-deck-runtime-family-parts/core.js';
import {
  startMockCodexCli,
  withEnv,
} from './mock-codex-cli.ts';

const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  fileURLToPath(new URL('./helpers/mock-redcube-python-with-playwright.ts', import.meta.url)),
]);

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function routeArtifactFile(result) {
  const file = result?.artifactFile || result?.artifact_file || result?.error?.artifact_file || result?.run?.error?.artifact_file;
  assert.equal(typeof file, 'string');
  assert.notEqual(file.trim(), '');
  return file;
}

async function withMockCodexRuntime(testFn) {
  const upstream = await startMockCodexCli();
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
    REDCUBE_PYTHON_COMMAND: MOCK_REDCUBE_PYTHON_COMMAND,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

test('ppt authoring context passes full source materials instead of first-line excerpts', () => {
  const { authoringParts } = createPptDeckRuntimeCore();
  const lateEvidence = '后半段主要结果：357例，57/357 early non-GTR，16.0%；AUROC 0.800，Brier 0.110，校准斜率 1.04。';
  const longOpening = '这是一段没有数字证据的材料开头，用来证明不能只截取开头。'.repeat(20);
  const contract = {
    title: 'NF-PitNET 三篇论文科室内部进展汇报',
    goal: '三篇成文论文要投稿，给主任和同事同步第一篇、第二篇、第三篇的故事、结论和证据。',
    profile_id: 'lecture_peer',
    shared_source_truth: {
      source_brief: {
        brief_text: '待投稿论文同步，必须讲清数字结果。',
        input_mode: 'source_files',
        confidence: 'high',
      },
      source_index: {
        sources: [
          {
            status: 'ready',
            relative_path: 'materials/full-paper-pack.md',
            kind: 'file',
          },
        ],
      },
      extracted_materials: {
        materials: [
          {
            material_id: 'MAT-1',
            source_id: 'SRC-1',
            kind: 'file',
            title: 'NF-PitNET full paper pack',
            content_text: `${longOpening}\n\n${lateEvidence}`,
          },
        ],
      },
    },
  };

  const context = authoringParts.buildAuthoringContext(contract);
  assert.equal(context.evidence_excerpts, undefined);
  assert.equal(context.source_materials_full_text.length, 1);
  assert.equal(context.source_materials_full_text[0].content_text.includes(lateEvidence), true);
  assert.equal(context.content_density_contract?.purpose, 'manuscript_submission_sync');
  assert.equal(context.source_evidence_extraction_contract?.source_input, 'source_materials_full_text');
  assert.equal(context.source_evidence_extraction_contract?.output_field, 'manuscript_evidence_table');
});

test('ppt manuscript sync blocks abstract outlines without visible paper evidence', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-manuscript-density-'));
    const sourceFile = path.join(workspaceRoot, 'nfpitnet-paper-pack.md');
    writeFileSync(sourceFile, [
      '# NF-PitNET 三篇论文资料',
      '',
      '第一篇：357例，57/357 early non-GTR，16.0%；AUROC 0.800，Brier 0.110。',
      '第二篇：98/357 持续性术后垂体功能减退，27.5%；AUROC 0.708，Brier 0.171。',
      '第三篇：154/357 侵袭性病例，43.1%；Knosp 0-2 为 203/203 非侵袭，Knosp 3-4 为 154/154 侵袭。',
    ].join('\n'), 'utf-8');

    await intakeSource({
      workspaceRoot,
      topicId: 'topic-a',
      title: 'NF-PitNET 三篇论文同步',
      brief: '三篇成文论文要投稿，给主任和同事同步第一篇、第二篇、第三篇的故事、结论和证据。',
      keywords: ['NF-PitNET', '第一篇', '第二篇', '第三篇'],
      sourceFiles: [sourceFile],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'NF-PitNET 三篇论文科室内部进展汇报',
      goal: '三篇成文论文要投稿，给主任和同事同步第一篇、第二篇、第三篇的故事、结论和证据。',
    });

    const storylineResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    });
    assert.equal(storylineResult.ok, true);
    const storylineArtifact = readJson(routeArtifactFile(storylineResult));
    assert.equal(storylineArtifact.storyline.manuscript_evidence_table.length, 3);
    assert.match(
      storylineArtifact.storyline.manuscript_evidence_table[0].key_numeric_results.join('\n'),
      /357|57\/357|16\.0|AUROC|Brier/,
    );

    const restoreOutlineVariant = withEnv({
      REDCUBE_MOCK_PPT_OUTLINE_VARIANT: 'abstract_manuscript',
    });
    let outlineResult;
    try {
      outlineResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'detailed_outline',
      });
    } finally {
      restoreOutlineVariant();
    }

    assert.equal(outlineResult.ok, false);
    assert.match(outlineResult.run?.error?.message || '', /manuscript sync requires/);
  });
});

test('ppt authoring treats numbered source slide plans as suggestions, not approved outline contracts', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-numbered-plan-'));
    const sourceFile = path.join(workspaceRoot, 'numbered-plan.md');
    const slidePlan = Array.from({ length: 21 }, (_, index) => {
      const pageNo = index + 1;
      return `${pageNo}. 第${pageNo}页：研究同步逐页结构，覆盖封面、背景、方法、结果、边界或结束。`;
    }).join('\n');
    writeFileSync(sourceFile, `# 科室研究同步资料\n\n## 推荐逐页内容\n\n${slidePlan}\n`, 'utf-8');

    await intakeSource({
      workspaceRoot,
      topicId: 'topic-plan',
      title: '研究同步逐页计划',
      brief: '资料包逐页计划只作为参考，生成正式PPT不超过30页。',
      keywords: ['研究同步', '逐页计划'],
      sourceFiles: [sourceFile],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-plan',
      deliverableId: 'deck-plan',
      title: '研究同步逐页计划',
      goal: '资料包中的21页逐页结构只作为参考，不超过30页。',
    });

    assert.equal((await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-plan',
      deliverableId: 'deck-plan',
      route: 'storyline',
    })).ok, true);

    const outlineResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-plan',
      deliverableId: 'deck-plan',
      route: 'detailed_outline',
    });
    assert.equal(outlineResult.ok, true);
    const outlineArtifact = readJson(routeArtifactFile(outlineResult));
    assert.notEqual(outlineArtifact.detailed_outline.slides.length, 21);
    assert.equal(outlineArtifact.detailed_outline.slides.length <= 30, true);
  });
});

test('ppt core authoring stages carry Codex generation evidence and keep operator meta instructions out of audience-facing content', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-hermes-generation-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'MedAutoScience 系统介绍',
      goal: '面向医学人工智能小同行正式讲课，封面必须署名，重点回答三件事，先讲什么后讲什么要清楚，不要把内部文档原话放进 PPT。',
    });

    const storylineResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    });
    const outlineResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'detailed_outline',
    });
    const blueprintResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'slide_blueprint',
    });
    const visualResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'visual_direction',
    });

    assert.equal(storylineResult.ok, true);
    assert.equal(outlineResult.ok, true);
    assert.equal(blueprintResult.ok, true);
    assert.equal(visualResult.ok, true);

    const storyline = readJson(storylineResult.artifactFile);
    const outline = readJson(outlineResult.artifactFile);
    const blueprint = readJson(blueprintResult.artifactFile);
    const visual = readJson(visualResult.artifactFile);

    assert.match(storyline.creative_execution?.generation_runtime?.run_id || '', /^run_(mock|codex)_/);
    assert.equal(storyline.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(storyline.storyline?.creative_sources?.core_metaphor?.materialized_from, 'codex_cli_json_output');
    assert.equal(storyline.storyline?.creative_sources?.narrative_arc?.materialized_from, 'codex_cli_json_output');

    const audienceFacingText = [
      storyline.storyline?.core_metaphor,
      ...(storyline.storyline?.narrative_arc?.hook || []),
      ...(storyline.storyline?.narrative_arc?.journey || []),
      ...(storyline.storyline?.narrative_arc?.resolution || []),
      ...((outline.detailed_outline?.slides || []).flatMap((slide) => [
        slide.title,
        slide.page_objective,
        slide.core_sentence,
        ...(slide.page_core_content || []),
        slide.speaker_notes,
        slide.transition_sentence,
      ])),
      ...((blueprint.slide_blueprint?.slides || []).flatMap((slide) => [
        slide.title,
        slide.page_goal,
        slide.core_sentence,
        ...(slide.page_core_content || []).map((item) => item?.text || item),
        slide.speaker_notes,
        slide.transition_sentence,
      ])),
      visual.visual_direction?.visual_manifest,
      ...(visual.visual_direction?.what_it_is || []),
    ].join('\n');

    assert.equal(/封面必须署名|重点回答三件事|内部文档/.test(audienceFacingText), false);
    assert.equal(/先讲 面向医学人工智能小同行正式讲课/.test(audienceFacingText), false);
    assert.equal((outline.detailed_outline?.slides || []).length >= 6, true);
    assert.equal((blueprint.slide_blueprint?.slides || []).length >= 6, true);
  });
});

test('ppt authoring context keeps lecture_peer audience and public source labels aligned to source truth', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-hermes-audience-'));
    const sourceFile = path.join(workspaceRoot, 'med-auto-science.md');
    writeFileSync(sourceFile, [
      '# 项目概览',
      '',
      '`Med Auto Science` 是医学科研 domain-agent，基于 source extraction 和 fact library 组织证据、规划研究任务，并把 publication delivery 产物保持在可审计状态。',
    ].join('\n'), 'utf-8');

    await intakeSource({
      workspaceRoot,
      topicId: 'topic-a',
      title: 'MedAutoScience 系统介绍',
      brief: '为医学人工智能小同行讲课，讲清系统为什么能支撑自动科研。',
      keywords: ['MedAutoScience', '自动科研', '医学人工智能'],
      sourceFiles: [sourceFile],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'MedAutoScience 系统介绍',
      goal: '面向医学人工智能小同行正式讲课，讲清系统设计、推进路径与模块复用。',
    });

    const storylineResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    });

    const storyline = readJson(storylineResult.artifactFile);
    assert.equal(storyline.storyline?.audience, '临床科研同行');
    assert.equal(storyline.storyline?.fact_library_summary.includes('<p align'), false);
    assert.equal(storyline.storyline?.fact_library_summary.includes('English'), false);
    assert.equal(storyline.storyline?.fact_library_summary.includes('source extraction'), true);
    assert.equal(storyline.storyline?.fact_library_summary.includes('fact library'), true);
    assert.equal(storyline.storyline?.fact_library_summary.includes('domain-agent'), true);
    assert.equal(Array.isArray(storyline.storyline?.source_truth_material_ids), true);
    assert.equal(storyline.storyline?.source_truth_material_ids.length, 1);
    assert.equal(storyline.storyline?.source_sufficiency_judgement, 'planning_ready');
  });
});

test('ppt screenshot review escalates speaker fit failures back to slide_blueprint instead of staying at render_html', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-rerun-stage-'));

    const created = await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'MedAutoScience 系统介绍',
      goal: '面向医学人工智能小同行正式讲课，讲清系统设计、推进路径与模块复用。',
    });

    const routeResults = new Map();
    for (const route of ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html']) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
      routeResults.set(route, result);
    }

    const renderArtifact = readJson(routeArtifactFile(routeResults.get('render_html')));
    const htmlFile = renderArtifact.html_bundle?.html_file;
    const originalHtml = readFileSync(htmlFile, 'utf-8');
    writeFileSync(
      htmlFile,
      originalHtml.replace(/data-speaker-seconds="65"/g, 'data-speaker-seconds="5"'),
      'utf-8',
    );

    const directorReviewResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'visual_director_review',
    });
    assert.equal(directorReviewResult.ok, true);

    const screenshotReviewResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'screenshot_review',
    });
    assert.equal(screenshotReviewResult.ok, false);
    assert.match(screenshotReviewResult.run?.error?.message || '', /Route screenshot_review blocked/);

    const reviewArtifact = readJson(routeArtifactFile(screenshotReviewResult));
    assert.equal(reviewArtifact.status, 'block');
    assert.equal(reviewArtifact.checks?.speaker_fit_ok, false);
    assert.equal(reviewArtifact.review_state_patch?.rerun_from_stage, 'slide_blueprint');
    assert.equal(reviewArtifact.review_state_patch?.rerun_policy?.rerun_from_stage, 'slide_blueprint');
  });
});
