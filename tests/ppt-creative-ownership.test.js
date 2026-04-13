import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';

import {
  createDeliverable,
  runDeliverableRoute,
} from '../packages/redcube-gateway/src/index.js';
import {
  startMockHermesAgentUpstream,
  withEnv,
} from './helpers/mock-hermes-agent-upstream.js';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

async function withMockHermesUpstream(testFn) {
  const upstream = await startMockHermesAgentUpstream();
  const restoreEnv = withEnv({
    REDCUBE_HERMES_UPSTREAM_BASE_URL: upstream.baseUrl,
    REDCUBE_HERMES_UPSTREAM_MODEL: 'hermes-agent',
    REDCUBE_HERMES_UPSTREAM_API_KEY: undefined,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

test('ppt clears code-authored Story Architecture / Visual Authorship residue and adds explicit visual_director_review', () => {
  const pack = read('packages/redcube-pack-ppt/src/index.js');
  const packTypes = read('packages/redcube-pack-ppt/src/index.ts');
  const runtime = read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime.js');
  const renderCompiler = existsSync(path.resolve('packages/redcube-pack-ppt/src/render-compiler.js'))
    ? read('packages/redcube-pack-ppt/src/render-compiler.js')
    : '';
  const storylinePrompt = read('prompts/ppt_deck/storyline.md');
  const outlinePrompt = read('prompts/ppt_deck/detailed_outline.md');
  const visualPrompt = read('prompts/ppt_deck/visual_direction.md');
  const renderHtmlPrompt = read('prompts/ppt_deck/render_html.md');

  assert.equal(runtime.includes("const seed = promptSeed('storyline', {"), false);
  assert.equal(runtime.includes("core_metaphor: safeText(seed?.storyline?.core_metaphor)"), false);
  assert.equal(renderCompiler.includes('function pickRecipeId('), false);
  assert.equal(renderCompiler.includes('function renderSlideMarkup('), false);
  assert.equal(renderCompiler.includes('function renderTemplate('), false);
  assert.equal(renderCompiler.includes("renderContract?.template_registry?.[recipeId]"), false);
  assert.equal(renderCompiler.includes("materializedFrom: 'prompt_runtime_template'"), false);
  assert.equal(renderCompiler.includes('compiled.content = renderTemplate(templateText, buildTemplateState(compiled, canvas));'), false);
  assert.equal(existsSync(path.resolve('packages/redcube-pack-ppt/src/render-compiler.js')), false);
  assert.equal(pack.includes('function toBlueprintContent('), false);
  assert.equal(pack.includes("speaker_seconds: preset.speaker_seconds + (slide.layout_family === 'judgement_ladder' ? 10 : 0),"), false);
  assert.equal(packTypes.includes('buildPptDetailedOutline'), false);
  assert.equal(packTypes.includes('buildPptSlideBlueprint'), false);
  assert.equal(packTypes.includes('buildPptVisualDirection'), false);
  assert.equal(packTypes.includes('compilePptRenderSlides'), false);
  assert.equal(runtime.includes('@redcube/pack-ppt'), false);
  assert.equal(runtime.includes("const renderArtifact = deps.promptArtifact('render_html')?.render_markup_artifact || {};"), false);
  assert.equal(runtime.includes('compileRenderSlides({'), false);
  assert.equal(runtime.includes("const seed = promptSeed('visual_director_review')?.visual_director_review || {};"), false);
  assert.match(storylinePrompt, /## runtime_artifact/);
  assert.match(outlinePrompt, /"render_recipe_id": "ppt\./);
  assert.match(visualPrompt, /"peak_pages": \[/);
  assert.match(renderHtmlPrompt, /## runtime_artifact/);
  assert.equal(renderHtmlPrompt.includes('"template_registry"'), false);
  assert.equal(existsSync(path.resolve('prompts/ppt_deck/director_review.md')), true);
  assert.equal(existsSync(path.resolve('prompts/ppt_deck/render-artifacts/ppt.hero_signal.html')), true);
  assert.equal(existsSync(path.resolve('prompts/ppt_deck/render-artifacts/ppt.summary_peak.html')), true);
});

test('ppt route artifacts record Hermes-backed ownership for Story Architecture, Visual Authorship, and visual_director_review overlay', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-creative-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'P19 PPT 创作权收口',
      goal: '验证 PPT 主创作权已从 JS 收回到 Hermes-backed / director-first mainline',
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
    assert.equal(storyline.creative_execution?.owner, 'hermes');
    assert.equal(storyline.creative_execution?.lifecycle_stage, 'story_architecture');
    assert.equal(storyline.creative_execution?.generation_runtime?.owner, 'upstream_hermes_agent');
    assert.equal(storyline.storyline.creative_sources?.core_metaphor?.materialized_from, 'upstream_run_json_output');
    assert.equal(storyline.storyline.creative_sources?.narrative_arc?.materialized_from, 'upstream_run_json_output');

    const outline = readJson(results[1].artifactFile);
    assert.equal(outline.creative_execution?.owner, 'hermes');
    assert.equal(outline.creative_execution?.lifecycle_stage, 'story_architecture');
    assert.equal(outline.creative_execution?.generation_runtime?.owner, 'upstream_hermes_agent');
    assert.equal(
      outline.detailed_outline.slides.every((slide) => slide.creative_authorship?.major_text?.owner === 'hermes'),
      true,
    );

    const blueprint = readJson(results[2].artifactFile);
    assert.equal(blueprint.creative_execution?.owner, 'hermes');
    assert.equal(blueprint.creative_execution?.lifecycle_stage, 'story_architecture');
    assert.equal(blueprint.creative_execution?.generation_runtime?.owner, 'upstream_hermes_agent');
    assert.equal(
      blueprint.slide_blueprint.slides.every((slide) => slide.creative_authorship?.page_core_content?.owner === 'hermes'),
      true,
    );
    assert.equal(
      blueprint.slide_blueprint.slides.every((slide) => slide.creative_authorship?.page_core_content?.materialized_from === 'upstream_run_json_output'),
      true,
    );
    assert.equal(
      blueprint.slide_blueprint.slides.every((slide) => slide.creative_authorship?.speaker_notes?.owner === 'hermes'),
      true,
    );

    const visual = readJson(results[3].artifactFile);
    assert.equal(visual.creative_execution?.owner, 'hermes');
    assert.equal(visual.creative_execution?.lifecycle_stage, 'visual_authorship');
    assert.equal(visual.creative_execution?.generation_runtime?.owner, 'upstream_hermes_agent');
    assert.equal(visual.visual_direction?.creative_authorship?.visual_direction?.owner, 'hermes');
    assert.equal(visual.visual_direction?.creative_authorship?.visual_direction?.materialized_from, 'upstream_run_json_output');

    const render = readJson(results[4].artifactFile);
    assert.equal(render.creative_execution?.owner, 'hermes');
    assert.equal(render.creative_execution?.lifecycle_stage, 'visual_authorship');
    assert.equal(render.creative_execution?.generation_runtime?.owner, 'upstream_hermes_agent');
    assert.equal(
      render.html_bundle.slides.every((slide) => slide.creative_authorship?.final_html_markup?.owner === 'hermes'),
      true,
    );
    assert.equal(
      render.html_bundle.slides.every((slide) => slide.creative_authorship?.final_html_markup?.materialized_from === 'upstream_run_json_output'),
      true,
    );

    const directorReview = readJson(results[5].artifactFile);
    assert.equal(directorReview.review_execution?.owner, 'hermes');
    assert.equal(directorReview.review_execution?.overlay, 'visual_director_review');
    assert.equal(directorReview.review_execution?.generation_runtime?.owner, 'upstream_hermes_agent');
    assert.equal(directorReview.visual_director_review?.review_model, 'director_first_visual_judgement');
    assert.equal(directorReview.visual_director_review?.creative_sources?.review_judgement?.materialized_from, 'upstream_run_json_output');
  });
});
