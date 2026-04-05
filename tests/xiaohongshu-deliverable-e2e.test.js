import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import {
  applyReviewMutation,
  createDeliverable,
  intakeSource,
  reviewRenderOutput,
  runDeliverableRoute,
} from '../packages/redcube-gateway/src/index.js';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

async function runXhsChain({ workspaceRoot, deliverableId, mode = 'draft_new', baselineDeliverableId = '' }) {
  const common = {
    workspaceRoot,
    overlay: 'xiaohongshu',
    topicId: 'topic-a',
    deliverableId,
    mode,
    baselineDeliverableId,
  };
  const routes = [
    'research',
    'storyline',
    'single_note_plan',
    'visual_direction',
    'render_html',
    'visual_director_review',
    'screenshot_review',
    'publish_copy',
  ];
  const results = [];
  for (const route of routes) {
    const result = await runDeliverableRoute({ ...common, route });
    results.push({ route, result });
  }
  return results;
}

test('xiaohongshu ships dedicated official prompt pack', () => {
  const files = [
    'research.md',
    'storyline.md',
    'single_note_plan.md',
    'visual_direction.md',
    'render_html.md',
    'director_review.md',
    'screenshot_review.md',
    'publish_copy.md',
    'export_bundle.md',
  ].map((file) => path.resolve('prompts', 'xiaohongshu', file));

  for (const file of files) {
    assert.equal(existsSync(file), true, file);
  }
});

test('xiaohongshu render_html blocks until single_note_plan and visual_direction exist', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-e2e-'));
  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });

  const result = await runDeliverableRoute({
    workspaceRoot,
    overlay: 'xiaohongshu',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    route: 'render_html',
  });

  assert.equal(result.ok, false);
  assert.match(result.run.error.message, /render_html.*single_note_plan.*visual_direction/i);
});

test('xiaohongshu render_html fails when pack registry entry in prompt_pack contract is invalid', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-e2e-'));
  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });

  const contractFile = path.join(path.dirname(created.deliverableFile), 'contracts', 'hydrated-deliverable.json');
  const contract = readJson(contractFile);
  contract.prompt_pack.pack_id = 'missing_pack_id';
  writeFileSync(contractFile, JSON.stringify(contract, null, 2), 'utf-8');

  for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction']) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      route,
    });
    assert.equal(result.ok, true, route);
  }

  const result = await runDeliverableRoute({
    workspaceRoot,
    overlay: 'xiaohongshu',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    route: 'render_html',
  });

  assert.equal(result.ok, false);
  assert.match(result.run.error.message, /render pack registry 未配置/i);
});

test('xiaohongshu mainline produces real stage artifacts through publish_copy', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-e2e-'));
  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });

  const chain = await runXhsChain({ workspaceRoot, deliverableId: 'note-a' });
  for (const { route, result } of chain) {
    assert.equal(result.ok, true, route);
  }

  const research = readJson(chain[0].result.artifactFile);
  assert.equal(typeof research.research?.topic_summary, 'string');
  assert.equal(Array.isArray(research.research?.reference_source_list), true);
  assert.equal(typeof research.research?.audience_judgement, 'string');
  assert.equal(typeof research.research?.why_now, 'string');

  const plan = readJson(chain[2].result.artifactFile);
  assert.equal(Array.isArray(plan.single_note_plan?.title_options), true);
  assert.equal(plan.single_note_plan.title_options.length >= 3, true);
  assert.equal(Array.isArray(plan.single_note_plan?.slides), true);
  assert.equal(plan.single_note_plan.slides.every((slide) => typeof slide.page_goal === 'string' && slide.page_goal.length > 0), true);
  assert.equal(plan.single_note_plan.slides.every((slide) => Array.isArray(slide.page_core_content) && slide.page_core_content.length >= 3), true);
  assert.equal(plan.single_note_plan.slides.every((slide) => typeof slide.visual_presentation?.layout_family === 'string'), true);
  assert.equal(plan.single_note_plan.slides.every((slide) => typeof slide.source_language === 'string' && slide.source_language.length > 0), true);
  assert.equal(plan.single_note_plan.slides.every((slide) => typeof slide.progression_role === 'string' && slide.progression_role.length > 0), true);
  assert.equal(plan.single_note_plan.slides.every((slide) => typeof slide.transition === 'string' && slide.transition.length > 0), true);

  const visual = readJson(chain[3].result.artifactFile);
  assert.equal(typeof visual.visual_direction?.director_statement, 'string');
  assert.equal(typeof visual.visual_direction?.visual_motif, 'string');
  assert.equal(Array.isArray(visual.visual_direction?.rhythm_curve), true);
  assert.equal(Array.isArray(visual.visual_direction?.peak_pages), true);
  assert.equal(typeof visual.visual_direction?.page_family_ceiling, 'object');
  assert.equal(Array.isArray(visual.visual_direction?.forbidden_regressions), true);
  assert.equal(Array.isArray(visual.visual_direction?.anti_template_constraints), true);
  assert.equal(typeof visual.visual_direction?.source_language_discipline, 'string');
  assert.equal(Array.isArray(visual.visual_direction?.page_role_table), true);

  const render = readJson(chain[4].result.artifactFile);
  assert.equal(existsSync(render.html_bundle?.html_file), true);
  assert.equal(render.html_bundle?.render_strategy, 'prompt_director_first');
  assert.deepEqual(render.html_bundle?.director_contract?.peak_pages, visual.visual_direction?.peak_pages);
  assert.deepEqual(render.html_bundle?.director_contract?.page_family_ceiling, visual.visual_direction?.page_family_ceiling);
  assert.equal(render.html_bundle?.slides.every((slide) => typeof slide.recipe_id === 'string' && slide.recipe_id.length > 0), true);
  assert.equal(render.html_bundle?.slides.every((slide) => typeof slide.content === 'string' && slide.content.includes('data-recipe-id=')), true);
  const html = readFileSync(render.html_bundle.html_file, 'utf-8');
  assert.match(html, /slide-display-area/);
  assert.match(html, /const slidesData = \[/);
  assert.match(html, /data-render-strategy="prompt-director-first"/);
  assert.match(html, /id="redcube-render-plan"/);

  const directorReview = readJson(chain[5].result.artifactFile);
  assert.equal(typeof directorReview.visual_director_review?.director_intent_landed, 'boolean');
  assert.equal(typeof directorReview.visual_director_review?.memory_hook_present, 'boolean');
  assert.equal(typeof directorReview.visual_director_review?.homogeneous_layout_risk, 'number');
  assert.equal(Array.isArray(directorReview.visual_director_review?.weak_pages), true);
  const review = readJson(chain[6].result.artifactFile);
  assert.equal(typeof review.checks?.overflow_free, 'boolean');
  assert.equal(typeof review.checks?.visual_density_ok, 'boolean');
  assert.equal(typeof review.checks?.anti_template_ok, 'boolean');
  assert.equal(typeof review.checks?.memory_hook_present, 'boolean');
  assert.equal(review.slide_reviews.every((slide) => existsSync(slide.screenshot_file)), true);

  const copy = readJson(chain[7].result.artifactFile);
  assert.equal(Array.isArray(copy.publish_copy?.titles), true);
  assert.equal(typeof copy.publish_copy?.body, 'string');
  assert.equal(copy.publish_copy?.quality_gate?.gate_pass, true);

  const report = await reviewRenderOutput({
    workspaceRoot,
    overlay: 'xiaohongshu',
    topicId: 'topic-a',
    deliverableId: 'note-a',
  });
  assert.equal(report.status, 'pass');
});

test('xiaohongshu optimize_existing binds baseline and emits relative review', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-e2e-'));
  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'baseline-a',
    title: '甲状腺门诊小红书科普 baseline',
    goal: '旧版已发布笔记',
  });
  const baselineChain = await runXhsChain({ workspaceRoot, deliverableId: 'baseline-a' });
  assert.equal(baselineChain.at(-1).result.ok, true);
  const baselineApproved = await applyReviewMutation({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'baseline-a',
    mutation: {
      type: 'approve_publish',
      actor: 'human',
      notes: '认可稿基线',
    },
  });
  assert.equal(baselineApproved.state.approval_state.status, 'approved');

  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普优化版',
    goal: '在保留旧版优点的前提下提升封面钩子与信息图质量',
  });
  const chain = await runXhsChain({
    workspaceRoot,
    deliverableId: 'note-a',
    mode: 'optimize_existing',
    baselineDeliverableId: 'baseline-a',
  });
  assert.equal(chain.at(-1).result.ok, true);

  const directorReview = readJson(chain[5].result.artifactFile);
  assert.equal(typeof directorReview.visual_director_review?.director_intent_landed, 'boolean');
  assert.equal(typeof directorReview.visual_director_review?.memory_hook_present, 'boolean');
  assert.equal(typeof directorReview.visual_director_review?.homogeneous_layout_risk, 'number');
  assert.equal(Array.isArray(directorReview.visual_director_review?.weak_pages), true);
  const review = readJson(chain[6].result.artifactFile);
  assert.equal(typeof review.checks?.baseline_comparison_passed, 'boolean');
  assert.equal(review.baseline_review?.baseline_deliverable_id, 'baseline-a');
});

test('xiaohongshu export_bundle performs real delivery and series surfaces when needed', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-e2e-'));
  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'note-series',
    title: '甲状腺门诊科普系列',
    goal: '面向门诊患者做系列化科普图文',
  });
  const chain = await runXhsChain({ workspaceRoot, deliverableId: 'note-series' });
  assert.equal(chain.at(-1).result.ok, true);

  const exportResult = await runDeliverableRoute({
    workspaceRoot,
    overlay: 'xiaohongshu',
    topicId: 'topic-a',
    deliverableId: 'note-series',
    route: 'export_bundle',
  });
  assert.equal(exportResult.ok, true);
  const bundle = readJson(exportResult.artifactFile);
  assert.equal(existsSync(bundle.export_bundle?.html_file), true);
  assert.equal(existsSync(bundle.export_bundle?.caption_file), true);
  assert.equal(Array.isArray(bundle.export_bundle?.png_files), true);
  assert.equal(bundle.export_bundle.png_files.length > 0, true);
  assert.equal(typeof bundle.export_bundle?.delivery_state?.current, 'string');
  assert.equal(bundle.export_bundle.delivery_state.current, 'output_ready');
  assert.equal(Object.hasOwn(bundle, 'publication_state_file'), false);
  assert.equal(existsSync(path.join(workspaceRoot, 'topics', 'topic-a', 'publication-state.json')), true);
  assert.equal(existsSync(bundle.series_surfaces?.delivery_overview_file), true);
  assert.equal(existsSync(bundle.series_surfaces?.path_mapping_file), true);
  assert.equal(existsSync(bundle.series_surfaces?.cadence_file), true);
});

test('xiaohongshu research/storyline/plan/visual_direction consume shared source truth', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-source-'));
  const richFile = path.join(workspaceRoot, 'rich-material.md');
  writeFileSync(
    richFile,
    [
      '# 门诊沟通记录',
      '患者最关心的是“先复查还是先吃药”。',
      '如果没有先讲清判断顺序，患者会把时间花在错误动作上。',
      '门诊真实痛点是：把来源翻译成人能理解的话。',
    ].join('\n'),
    'utf-8',
  );

  await intakeSource({
    workspaceRoot,
    topicId: 'topic-rich',
    title: '门诊沟通 rich',
    sourceFiles: [richFile],
  });
  await intakeSource({
    workspaceRoot,
    topicId: 'topic-brief',
    title: '门诊沟通 brief',
    brief: '做一个门诊患者可收藏的判断顺序总结。',
    keywords: ['门诊', '患者', '判断顺序'],
  });

  for (const topicId of ['topic-rich', 'topic-brief']) {
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId,
      deliverableId: `${topicId}-note`,
      title: `交付物 ${topicId}`,
      goal: '验证 shared source truth 消费',
    });
  }

  const richChain = [];
  for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction']) {
    richChain.push(await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-rich',
      deliverableId: 'topic-rich-note',
      route,
    }));
  }
  const briefChain = [];
  for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction']) {
    briefChain.push(await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-brief',
      deliverableId: 'topic-brief-note',
      route,
    }));
  }

  const richResearch = readJson(richChain[0].artifactFile);
  const briefResearch = readJson(briefChain[0].artifactFile);
  assert.equal(richResearch.research?.input_mode, 'files');
  assert.equal(briefResearch.research?.input_mode, 'brief_keywords');
  assert.equal(richResearch.research?.source_truth_material_count > 0, true);
  assert.equal(Array.isArray(richResearch.research?.source_truth_material_ids), true);
  assert.notEqual(richResearch.research?.topic_summary, briefResearch.research?.topic_summary);

  const richStoryline = readJson(richChain[1].artifactFile);
  assert.equal(Array.isArray(richStoryline.storyline?.source_truth_material_ids), true);
  assert.notDeepEqual(richStoryline.storyline?.source_truth_material_ids, briefResearch.research?.source_truth_material_ids || []);

  const richPlan = readJson(richChain[2].artifactFile);
  assert.equal(
    richPlan.single_note_plan.slides.some((slide) => slide.page_core_content.some((item) => item.includes('先复查还是先吃药'))),
    true,
  );

  const richVisual = readJson(richChain[3].artifactFile);
  assert.equal(richVisual.visual_direction?.source_truth_confidence, 'medium');
});
