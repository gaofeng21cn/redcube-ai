import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync } from 'node:fs';

import {
  createDeliverable,
  runDeliverableRoute,
} from '../packages/redcube-gateway/src/index.js';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

test('xiaohongshu Hermes-backed mainline owns protected creative outputs instead of JS builders', () => {
  const planning = read('packages/redcube-pack-xiaohongshu/src/planning.js');
  const renderCompiler = read('packages/redcube-pack-xiaohongshu/src/render-compiler.js');
  const runtime = read('packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.js');
  const storylinePrompt = read('prompts/xiaohongshu/storyline.md');
  const singleNotePlanPrompt = read('prompts/xiaohongshu/single_note_plan.md');
  const renderHtmlPrompt = read('prompts/xiaohongshu/render_html.md');
  const publishCopyPrompt = read('prompts/xiaohongshu/publish_copy.md');
  const directorReviewPrompt = read('prompts/xiaohongshu/director_review.md');

  assert.equal(planning.includes('function inferPageContent('), false);
  assert.equal(planning.includes('export function inferXhsVisualPresentation('), false);
  assert.equal(renderCompiler.includes('function pickRecipeId('), false);
  assert.equal(renderCompiler.includes('function renderSlideMarkup('), false);
  assert.equal(renderCompiler.includes("materializedFrom: 'prompt_pack_template'"), false);
  assert.equal(renderCompiler.includes('compiled.content = renderTemplate('), false);
  assert.equal(runtime.includes("const seed = promptSeed(contract, 'storyline');"), false);
  assert.equal(runtime.includes("audience_judgement: safeText(seed?.storyline?.audience_judgement, research?.research?.audience_judgement)"), false);
  assert.equal(runtime.includes("const seed = promptSeed(contract, 'publish_copy', {"), false);
  assert.equal(runtime.includes('const body = safeText(publishSeed.body);'), false);
  assert.equal(runtime.includes('const body = `${titles[0] || contract.title}。先别急着上工具'), false);
  assert.equal(runtime.includes('const distinctLayoutRatio = Number((layoutFamilies.length / Math.max(slides.length, 1)).toFixed(2));'), false);
  assert.equal(runtime.includes('const directorIntentLanded = layoutFamilies.length >='), false);
  assert.match(storylinePrompt, /## runtime_artifact/);
  assert.match(singleNotePlanPrompt, /"page_core_content": \[/);
  assert.match(singleNotePlanPrompt, /"visual_presentation": \{/);
  assert.match(renderHtmlPrompt, /## runtime_artifact/);
  assert.equal(renderHtmlPrompt.includes('"template_registry"'), false);
  assert.match(publishCopyPrompt, /## runtime_artifact/);
  assert.match(publishCopyPrompt, /"body": "/);
  assert.match(directorReviewPrompt, /"visual_director_review": \{/);
});

test('xiaohongshu route artifacts record Hermes-backed creative ownership for story, visual, review, and publish surfaces', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-creative-'));
  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: 'P19 小红书创作权收口',
    goal: '验证小红书主创作权已从 JS builder 收回到 Hermes-backed / director-first mainline',
  });

  const routes = ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'publish_copy'];
  const results = [];
  for (const route of routes) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      route,
    });
    assert.equal(result.ok, true, route);
    results.push(result);
  }

  const storyline = readJson(results[1].artifactFile);
  assert.equal(storyline.lifecycle_stage, 'story_architecture');
  assert.equal(storyline.storyline.creative_sources.narrative_arc.owner, 'hermes');
  assert.equal(storyline.storyline.creative_sources.narrative_arc.primary_surface, 'hermes_backed_runtime_substrate');
  assert.equal(storyline.storyline.creative_sources.narrative_arc.materialized_from, 'prompt_pack_artifact');

  const plan = readJson(results[2].artifactFile);
  assert.equal(
    plan.single_note_plan.slides.every((slide) => slide.creative_sources?.page_core_content?.owner === 'hermes'),
    true,
  );
  assert.equal(
    plan.single_note_plan.slides.every((slide) => slide.creative_sources?.visual_presentation?.primary_surface === 'hermes_backed_runtime_substrate'),
    true,
  );

  const visual = readJson(results[3].artifactFile);
  assert.equal(visual.lifecycle_stage, 'visual_authorship');
  assert.equal(visual.visual_direction.creative_sources.director_statement.owner, 'hermes');
  assert.equal(visual.visual_direction.creative_sources.director_statement.primary_surface, 'hermes_backed_runtime_substrate');

  const render = readJson(results[4].artifactFile);
  assert.equal(
    render.html_bundle.slides.every((slide) => slide.creative_sources?.recipe_selection?.owner === 'hermes'),
    true,
  );
  assert.equal(
    render.html_bundle.slides.every((slide) => slide.creative_sources?.final_markup?.owner === 'hermes'),
    true,
  );
  assert.equal(
    render.html_bundle.slides.every((slide) => slide.creative_sources?.final_markup?.materialized_from === 'prompt_pack_artifact'),
    true,
  );
  const html = readFileSync(render.html_bundle.html_file, 'utf-8');
  assert.match(html, /data-template-id=/);

  const directorReview = readJson(results[5].artifactFile);
  assert.equal(directorReview.review_overlay, 'visual_director_review');
  assert.equal(directorReview.review_authorship.primary_surface, 'hermes_backed_runtime_substrate');
  assert.equal(typeof directorReview.visual_director_review?.director_intent_landed, 'boolean');
  assert.equal(typeof directorReview.visual_director_review?.anti_template_ok, 'boolean');
  const directorReviewMarkdown = readFileSync(directorReview.artifact_refs[0], 'utf-8');
  assert.match(directorReviewMarkdown, /- review_owner: hermes_backed_runtime_substrate/);
  assert.equal(directorReviewMarkdown.includes('codex_native_host_agent'), false);

  const screenshotReview = readJson(results[6].artifactFile);
  assert.equal(screenshotReview.review_overlay, 'screenshot_review');
  assert.equal(typeof screenshotReview.checks?.director_intent_landed, 'boolean');
  assert.equal(typeof screenshotReview.checks?.anti_template_ok, 'boolean');

  const copy = readJson(results[7].artifactFile);
  assert.equal(copy.lifecycle_stage, 'delivery_packaging');
  assert.equal(copy.publish_copy.creative_sources.body.owner, 'hermes');
  assert.equal(copy.publish_copy.creative_sources.first_comment.primary_surface, 'hermes_backed_runtime_substrate');
  assert.equal(copy.publish_copy.creative_sources.body.materialized_from, 'prompt_pack_artifact');
});
