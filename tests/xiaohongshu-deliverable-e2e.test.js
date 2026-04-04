import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';

import {
  createDeliverable,
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
  const html = readFileSync(render.html_bundle.html_file, 'utf-8');
  assert.match(html, /slide-display-area/);
  assert.match(html, /const slidesData = \[/);

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
  assert.equal(typeof bundle.export_bundle?.publish_state?.current, 'string');
  assert.equal(bundle.export_bundle.publish_state.current, 'output_ready');
  assert.equal(existsSync(bundle.publication_state_file), true);
  assert.equal(existsSync(bundle.series_surfaces?.delivery_overview_file), true);
  assert.equal(existsSync(bundle.series_surfaces?.path_mapping_file), true);
  assert.equal(existsSync(bundle.series_surfaces?.cadence_file), true);
});
