import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

import {
  createDeliverable,
  getReviewState,
  intakeSource,
  reviewRenderOutput,
  runDeliverableRoute,
} from '../packages/redcube-gateway/src/index.js';
import { withMockHermesUpstream } from './helpers/mock-codex-cli.js';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function hasPythonPptPipeline() {
  const result = spawnSync('python3', ['-c', 'import pptx, playwright, PIL'], {
    encoding: 'utf-8',
  });
  return result.status === 0;
}

async function runChain({ workspaceRoot, deliverableId, mode = 'draft_new', baselineDeliverableId = '' }) {
  const common = {
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId,
    mode,
    baselineDeliverableId,
  };

  const routes = [
    'storyline',
    'detailed_outline',
    'slide_blueprint',
    'visual_direction',
    'render_html',
    'visual_director_review',
    'screenshot_review',
  ];

  const results = [];
  for (const route of routes) {
    const result = await runDeliverableRoute({ ...common, route });
    results.push({ route, result });
  }
  return results;
}

let sharedOptimizeExportContextPromise;

async function buildSharedOptimizeExportContext() {
  return withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-e2e-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-baseline',
      title: '肠癌 AI 讲课 baseline',
      goal: '旧版认可稿',
    });
    const baselineChain = await runChain({ workspaceRoot, deliverableId: 'deck-baseline' });
    const baselineState = await getReviewState({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'deck-baseline',
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-next',
      title: '肠癌 AI 讲课优化版',
      goal: '在保留旧版优点的前提下提升可教性与视觉峰值',
    });
    const optimizeChain = await runChain({
      workspaceRoot,
      deliverableId: 'deck-next',
      mode: 'optimize_existing',
      baselineDeliverableId: 'deck-baseline',
    });

    const exportResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-baseline',
      route: 'export_pptx',
    });

    return {
      baselineChain,
      baselineState,
      optimizeChain,
      exportResult,
    };
  });
}

async function getSharedOptimizeExportContext() {
  if (!sharedOptimizeExportContextPromise) {
    sharedOptimizeExportContextPromise = buildSharedOptimizeExportContext();
  }
  return sharedOptimizeExportContextPromise;
}

test('ppt_deck ships dedicated prompt pack instead of xiaohongshu prompt semantics', () => {
  const promptFiles = [
    'storyline.md',
    'detailed_outline.md',
    'slide_blueprint.md',
    'visual_direction.md',
    'render_html.md',
    'director_review.md',
    'screenshot_review.md',
    'export_pptx.md',
  ].map((file) => path.resolve('prompts', 'ppt_deck', file));

  for (const file of promptFiles) {
    assert.equal(existsSync(file), true, file);
    const content = readFileSync(file, 'utf-8');
    assert.equal(/xiaohongshu|小红书/i.test(content), false, file);
  }
});

test('ppt_deck render_html blocks until slide_blueprint and visual_direction exist', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-e2e-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '肠癌 AI 讲课 deck',
      goal: '给学生讲清肠癌 AI 的问题、方法与边界',
    });

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'render_html',
    });

    assert.equal(result.ok, false);
    assert.match(result.run.error.message, /render_html.*slide_blueprint.*visual_direction/i);
  });
});

test('ppt_deck render_html fails when prompt pack shell asset is missing', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-e2e-'));

    const created = await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '肠癌 AI 讲课 deck',
      goal: '给学生讲清肠癌 AI 的问题、方法与边界',
    });

    const contractFile = path.join(path.dirname(created.deliverableFile), 'contracts', 'hydrated-deliverable.json');
    const contract = readJson(contractFile);
    contract.prompt_pack.render_contract.shell_file = 'missing-shell.html';
    writeFileSync(contractFile, JSON.stringify(contract, null, 2), 'utf-8');

    for (const route of ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction']) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'render_html',
    });

    assert.equal(result.ok, false);
    assert.match(result.run.error.message, /Missing prompt pack asset/i);
  });
});

test('lecture_student mainline produces real ppt_deck artifacts through screenshot review', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-e2e-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '肠癌 AI 讲课 deck',
      goal: '给学生讲清肠癌 AI 的问题、方法与边界',
    });

    const chain = await runChain({ workspaceRoot, deliverableId: 'deck-a' });
    for (const { route, result } of chain) {
      assert.equal(result.ok, true, route);
    }

    const storyline = readJson(chain[0].result.artifactFile);
    assert.equal(typeof storyline.storyline?.audience, 'string');
    assert.equal(Array.isArray(storyline.storyline?.narrative_arc?.journey), true);

    const blueprint = readJson(chain[2].result.artifactFile);
    assert.equal(Array.isArray(blueprint.slide_blueprint?.slides), true);
    assert.equal(blueprint.slide_blueprint.slides.length >= 6, true);
    assert.equal(
      blueprint.slide_blueprint.slides.every((slide) => Array.isArray(slide.page_core_content) && slide.page_core_content.length > 0),
      true,
    );
    assert.equal(blueprint.slide_blueprint.slides.every((slide) => typeof slide.speaker_notes === 'string' && slide.speaker_notes.length > 0), true);
    assert.equal(blueprint.slide_blueprint.slides.every((slide) => typeof slide.transition_sentence === 'string' && slide.transition_sentence.length > 0), true);
    assert.equal(blueprint.slide_blueprint.slides.some((slide) => Array.isArray(slide.visual_presentation?.anchor_tracks) && slide.visual_presentation.anchor_tracks.length > 0), true);

    const visualDirection = readJson(chain[3].result.artifactFile);
    assert.equal(Array.isArray(visualDirection.visual_direction?.rhythm_curve), true);
    assert.equal(Array.isArray(visualDirection.visual_direction?.peak_pages), true);
    assert.equal(typeof visualDirection.visual_direction?.page_family_ceiling, 'object');
    assert.equal(Array.isArray(visualDirection.visual_direction?.forbidden_regressions), true);
    assert.equal(Array.isArray(visualDirection.visual_direction?.page_role_table), true);

    const renderBundle = readJson(chain[4].result.artifactFile);
    assert.equal(typeof renderBundle.html_bundle?.html_file, 'string');
    assert.equal(existsSync(renderBundle.html_bundle.html_file), true);
    assert.equal(renderBundle.html_bundle?.render_strategy, 'prompt_director_first');
    assert.deepEqual(
      renderBundle.html_bundle?.generator_instructions,
      visualDirection.visual_direction?.final_instruction_to_html_generator,
    );
    assert.deepEqual(
      renderBundle.html_bundle?.slides?.map((slide) => slide.layout_family),
      blueprint.slide_blueprint.slides.map((slide) => slide.visual_presentation.layout_family),
    );
    assert.equal(renderBundle.html_bundle?.slides.every((slide) => typeof slide.recipe_id === 'string' && slide.recipe_id.length > 0), true);
    const html = readFileSync(renderBundle.html_bundle.html_file, 'utf-8');
    assert.match(html, /id="slide-display-area"/);
    assert.match(html, /id="prev-btn"/);
    assert.match(html, /id="next-btn"/);
    assert.match(html, /const slidesData =\s*\[/);
    assert.match(html, /data-render-strategy="prompt-director-first"/);
    assert.match(html, /id="redcube-render-plan"/);
    assert.equal(/renderSlide|layoutByType|cardsGrid|pageType/.test(html), false);

    const directorReview = readJson(chain[5].result.artifactFile);
    assert.equal(directorReview.review_overlay, 'visual_director_review');
    assert.equal(directorReview.visual_director_review?.review_model, 'director_first_visual_judgement');

    const reviewBundle = readJson(chain[6].result.artifactFile);
    assert.equal(typeof reviewBundle.status, 'string');
    assert.equal(Array.isArray(reviewBundle.slide_reviews), true);
    assert.equal(reviewBundle.slide_reviews.length, renderBundle.html_bundle.page_count);
    assert.equal(typeof reviewBundle.checks?.overflow_free, 'boolean');
    assert.equal(typeof reviewBundle.checks?.occlusion_free, 'boolean');
    assert.equal(typeof reviewBundle.checks?.visual_density_ok, 'boolean');
    assert.equal(typeof reviewBundle.checks?.speaker_fit_ok, 'boolean');
    assert.equal(reviewBundle.slide_reviews.every((slide) => existsSync(slide.screenshot_file)), true);

    const reviewReport = await reviewRenderOutput({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
    });
    assert.equal(reviewReport.status, 'pass');
  });
});

test('ppt_deck manual thyroid case keeps topic fidelity instead of falling back to stale AI workflow copy', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-manual-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'lecture-01',
      title: 'Thyroid Basics',
      goal: 'Explain thyroid fundamentals to undergraduate students',
    });

    const chain = await runChain({ workspaceRoot, deliverableId: 'lecture-01' });
    for (const { route, result } of chain) {
      assert.equal(result.ok, true, route);
    }

    const outline = readJson(chain[1].result.artifactFile);
    const slides = outline.detailed_outline?.slides || [];
    const staleTitles = new Set([
      '旧工作流为什么会在这里失效',
      '把科研任务拆成一条 4 段式机制轨道',
      '判断梯：哪些环节适合 AI，哪些必须人工签收',
      '证据页必须把来源口径讲给听众听懂',
      '把方法落成课堂上的四格动作',
      '最后只收束三件必须带走的事',
    ]);
    assert.equal(slides.some((slide) => staleTitles.has(slide.title)), false);

    const nonCoverTopicAnchored = slides
      .slice(1)
      .some((slide) => /thyroid|甲状腺/i.test([
        slide.title,
        slide.page_objective,
        slide.core_sentence,
        ...(slide.page_core_content || []),
      ].join(' ')));
    assert.equal(nonCoverTopicAnchored, true);
  });
});

test('optimize_existing screenshot review binds baseline and emits relative review', async () => {
  const { baselineChain, baselineState, optimizeChain } = await getSharedOptimizeExportContext();
  assert.equal(baselineChain.at(-1).result.ok, true);
  assert.equal(baselineState.state.ready_for_export, true);
  assert.equal(optimizeChain.at(-1).result.ok, true);

  const reviewBundle = readJson(optimizeChain.at(-1).result.artifactFile);
  assert.equal(reviewBundle.baseline_review?.baseline_deliverable_id, 'deck-baseline');
  assert.equal(reviewBundle.baseline_review?.baseline_comparison_passed, true);
});

test('export_pptx performs real delivery or explicit hard block', async () => {
  const { baselineChain, exportResult } = await getSharedOptimizeExportContext();
  assert.equal(baselineChain.at(-1).result.ok, true);

  if (hasPythonPptPipeline()) {
    assert.equal(exportResult.ok, true);
    const bundle = readJson(exportResult.artifactFile);
    assert.equal(existsSync(bundle.export_bundle?.pptx_file), true);
    assert.equal(bundle.export_bundle?.page_count_match, true);
    assert.equal(typeof bundle.export_bundle?.real_conversion_invocation?.tool, 'string');
  } else {
    assert.equal(exportResult.ok, false);
    assert.match(exportResult.run.error.message, /python|playwright|pptx/i);
  }
});

test('ppt_deck storyline/outline/blueprint/visual_direction consume shared source truth', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-source-'));
    const richFile = path.join(workspaceRoot, 'rich-outline.md');
    writeFileSync(
      richFile,
      [
        '# 肠癌 AI 课堂素材',
        '课堂主问题：先定义问题，再判断证据，再决定动作。',
        '听众最容易误判的是把工具演示当成任务定义。',
        '必须把公开来源翻译成学生能复述的话。',
      ].join('\n'),
      'utf-8',
    );

    await intakeSource({
      workspaceRoot,
      topicId: 'topic-rich',
      title: 'PPT rich',
      sourceFiles: [richFile],
    });
    await intakeSource({
      workspaceRoot,
      topicId: 'topic-brief',
      title: 'PPT brief',
      brief: '给学生讲清 AI 讲课 deck 的判断顺序。',
      keywords: ['AI', '课堂', '判断顺序'],
    });

    for (const topicId of ['topic-rich', 'topic-brief']) {
      await createDeliverable({
        workspaceRoot,
        overlay: 'ppt_deck',
        profileId: 'lecture_student',
        topicId,
        deliverableId: `${topicId}-deck`,
        title: `课件 ${topicId}`,
        goal: '验证 ppt shared source truth 消费',
      });
    }

    const richResults = [];
    for (const route of ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction']) {
      richResults.push(await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-rich',
        deliverableId: 'topic-rich-deck',
        route,
      }));
    }
    const briefResults = [];
    for (const route of ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction']) {
      briefResults.push(await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-brief',
        deliverableId: 'topic-brief-deck',
        route,
      }));
    }

    const richStoryline = readJson(richResults[0].artifactFile);
    const briefStoryline = readJson(briefResults[0].artifactFile);
    assert.equal(richStoryline.storyline?.source_truth_input_mode, 'files');
    assert.equal(briefStoryline.storyline?.source_truth_input_mode, 'brief_keywords');
    assert.equal(richStoryline.storyline?.source_sufficiency_judgement, 'planning_ready');
    assert.equal(briefStoryline.storyline?.source_sufficiency_judgement, 'augmentation_required');
    assert.equal(briefStoryline.storyline?.deep_research_state, 'required');
    assert.equal(typeof briefStoryline.storyline?.fact_library_summary, 'string');
    assert.equal(briefStoryline.storyline?.fact_library_summary.length > 0, true);
    assert.notEqual(richStoryline.storyline?.core_metaphor, briefStoryline.storyline?.core_metaphor);

    const richOutline = readJson(richResults[1].artifactFile);
    assert.equal(
      richOutline.detailed_outline.slides.some((slide) => slide.public_sources.includes('inputs/raw_materials/source-intake/content-01-rich-outline.md')),
      true,
    );

    const richBlueprint = readJson(richResults[2].artifactFile);
    assert.equal(
      richBlueprint.slide_blueprint.slides.some((slide) => slide.evidence_and_sources.some((item) => item.public_label.includes('inputs/raw_materials/source-intake/content-01-rich-outline.md'))),
      true,
    );

    const richVisual = readJson(richResults[3].artifactFile);
    assert.equal(richVisual.visual_direction?.source_truth_confidence, 'medium');
  });
});
