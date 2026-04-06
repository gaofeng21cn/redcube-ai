import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';

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

test('ppt clears code-authored Story Architecture / Visual Authorship residue and adds explicit visual_director_review', () => {
  const pack = read('packages/redcube-pack-ppt/src/index.js');
  const runtime = read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime.js');
  const renderCompiler = existsSync(path.resolve('packages/redcube-pack-ppt/src/render-compiler.js'))
    ? read('packages/redcube-pack-ppt/src/render-compiler.js')
    : '';
  const outlinePrompt = read('prompts/ppt_deck/detailed_outline.md');
  const visualPrompt = read('prompts/ppt_deck/visual_direction.md');

  assert.equal(runtime.includes("safeText(seed?.storyline?.core_metaphor, '把 AI 放回科研链，而不是神化成万能入口')"), false);
  assert.equal(runtime.includes("safeArray(seed?.storyline?.journey).length > 0 ? seed.storyline.journey : ["), false);
  assert.equal(renderCompiler.includes('function pickRecipeId('), false);
  assert.equal(renderCompiler.includes('function renderSlideMarkup('), false);
  assert.match(outlinePrompt, /"render_recipe_id": "ppt\./);
  assert.match(visualPrompt, /"peak_pages": \[/);
  assert.equal(existsSync(path.resolve('prompts/ppt_deck/director_review.md')), true);
  assert.equal(existsSync(path.resolve('prompts/ppt_deck/render-templates/ppt.hero_signal.html')), true);
  assert.equal(existsSync(path.resolve('prompts/ppt_deck/render-templates/ppt.summary_peak.html')), true);
});

test('ppt route artifacts record host-agent ownership for Story Architecture, Visual Authorship, and visual_director_review overlay', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-creative-'));
  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: 'P19 PPT 创作权收口',
    goal: '验证 PPT 主创作权已从 JS 收回到 host-agent / director-first mainline',
  });

  const routes = ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review'];
  const results = [];
  for (const route of routes) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route,
    });
    assert.equal(result.ok, true, route);
    results.push(result);
  }

  const storyline = readJson(results[0].artifactFile);
  assert.equal(storyline.creative_execution?.owner, 'host_agent');
  assert.equal(storyline.creative_execution?.lifecycle_stage, 'story_architecture');

  const outline = readJson(results[1].artifactFile);
  assert.equal(outline.creative_execution?.owner, 'host_agent');
  assert.equal(outline.creative_execution?.lifecycle_stage, 'story_architecture');
  assert.equal(
    outline.detailed_outline.slides.every((slide) => slide.creative_authorship?.major_text?.owner === 'host_agent'),
    true,
  );

  const blueprint = readJson(results[2].artifactFile);
  assert.equal(blueprint.creative_execution?.owner, 'host_agent');
  assert.equal(blueprint.creative_execution?.lifecycle_stage, 'story_architecture');
  assert.equal(
    blueprint.slide_blueprint.slides.every((slide) => slide.creative_authorship?.page_core_content?.owner === 'host_agent'),
    true,
  );
  assert.equal(
    blueprint.slide_blueprint.slides.every((slide) => slide.creative_authorship?.speaker_notes?.owner === 'host_agent'),
    true,
  );

  const visual = readJson(results[3].artifactFile);
  assert.equal(visual.creative_execution?.owner, 'host_agent');
  assert.equal(visual.creative_execution?.lifecycle_stage, 'visual_authorship');
  assert.equal(visual.visual_direction?.creative_authorship?.visual_direction?.owner, 'host_agent');

  const render = readJson(results[4].artifactFile);
  assert.equal(render.creative_execution?.owner, 'host_agent');
  assert.equal(render.creative_execution?.lifecycle_stage, 'visual_authorship');
  assert.equal(
    render.html_bundle.slides.every((slide) => slide.creative_authorship?.final_html_markup?.owner === 'host_agent'),
    true,
  );
  assert.equal(
    render.html_bundle.slides.every((slide) => typeof slide.template_id === 'string' && slide.template_id.endsWith('.html')),
    true,
  );

  const directorReview = readJson(results[5].artifactFile);
  assert.equal(directorReview.review_execution?.owner, 'host_agent');
  assert.equal(directorReview.review_execution?.overlay, 'visual_director_review');
  assert.equal(directorReview.visual_director_review?.review_model, 'director_first_visual_judgement');
});
