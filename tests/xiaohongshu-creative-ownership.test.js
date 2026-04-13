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
  startMockCodexCli,
  withEnv,
} from './helpers/mock-codex-cli.js';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

async function withMockHermesUpstream(testFn) {
  const upstream = await startMockCodexCli();
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

test('xiaohongshu Codex-backed mainline owns protected creative outputs instead of JS builders', () => {
  const packEntry = read('packages/redcube-pack-xiaohongshu/src/index.ts');
  const runtime = read('packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.js');
  const storylinePrompt = read('prompts/xiaohongshu/storyline.md');
  const singleNotePlanPrompt = read('prompts/xiaohongshu/single_note_plan.md');
  const renderHtmlPrompt = read('prompts/xiaohongshu/render_html.md');
  const publishCopyPrompt = read('prompts/xiaohongshu/publish_copy.md');
  const directorReviewPrompt = read('prompts/xiaohongshu/director_review.md');

  assert.equal(existsSync(path.resolve('packages/redcube-pack-xiaohongshu/src/planning.js')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-pack-xiaohongshu/src/render-compiler.js')), false);
  assert.equal(packEntry.includes('buildXhsPlanSlides'), false);
  assert.equal(packEntry.includes('buildXhsVisualDirection'), false);
  assert.equal(packEntry.includes('buildXhsRenderHtml'), false);
  assert.equal(packEntry.includes('compileXhsRenderSlides'), false);
  assert.equal(runtime.includes("const seed = promptSeed(contract, 'storyline');"), false);
  assert.equal(runtime.includes("audience_judgement: safeText(seed?.storyline?.audience_judgement, research?.research?.audience_judgement)"), false);
  assert.equal(runtime.includes("const authoredArtifact = promptArtifact(contract, 'storyline', buildStorylineInputs(contract, research));"), false);
  assert.equal(runtime.includes("const seed = promptSeed(contract, 'single_note_plan', { title: contract.title });"), false);
  assert.equal(runtime.includes("const seed = promptSeed(contract, 'visual_direction');"), false);
  assert.equal(runtime.includes("const renderArtifact = deps.promptArtifact(contract, 'render_html')?.render_markup_artifact || {};"), false);
  assert.equal(runtime.includes("const seed = promptSeed(contract, 'publish_copy', {"), false);
  assert.equal(runtime.includes("const authoredArtifact = promptArtifact(contract, 'publish_copy', {"), false);
  assert.equal(runtime.includes('const body = safeText(publishSeed.body);'), false);
  assert.equal(runtime.includes('const body = `${titles[0] || contract.title}。先别急着上工具'), false);
  assert.equal(runtime.includes('const distinctLayoutRatio = Number((layoutFamilies.length / Math.max(slides.length, 1)).toFixed(2));'), false);
  assert.equal(runtime.includes('const directorIntentLanded = layoutFamilies.length >='), false);
  assert.equal(runtime.includes('@redcube/pack-xiaohongshu'), false);
  assert.match(storylinePrompt, /## runtime_artifact/);
  assert.match(singleNotePlanPrompt, /"page_core_content": \[/);
  assert.match(singleNotePlanPrompt, /"visual_presentation": \{/);
  assert.match(renderHtmlPrompt, /## runtime_artifact/);
  assert.equal(renderHtmlPrompt.includes('"template_registry"'), false);
  assert.match(publishCopyPrompt, /## runtime_artifact/);
  assert.match(publishCopyPrompt, /"body": "/);
  assert.match(directorReviewPrompt, /"visual_director_review": \{/);
});

test('xiaohongshu route artifacts record Codex-backed creative ownership for story, visual, review, and publish surfaces', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-creative-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: 'P19 小红书创作权收口',
      goal: '验证小红书主创作权已从 JS builder 收回到 Codex-backed / director-first mainline',
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
    assert.equal(storyline.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(storyline.storyline.creative_sources.narrative_arc.owner, 'host_agent');
    assert.equal(storyline.storyline.creative_sources.narrative_arc.primary_surface, 'codex_native_host_agent');
    assert.equal(storyline.storyline.creative_sources.narrative_arc.materialized_from, 'codex_cli_json_output');

    const plan = readJson(results[2].artifactFile);
    assert.equal(plan.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(
      plan.single_note_plan.slides.every((slide) => slide.creative_sources?.page_core_content?.owner === 'host_agent'),
      true,
    );
    assert.equal(
      plan.single_note_plan.slides.every((slide) => slide.creative_sources?.page_core_content?.materialized_from === 'codex_cli_json_output'),
      true,
    );
    assert.equal(
      plan.single_note_plan.slides.every((slide) => slide.creative_sources?.visual_presentation?.primary_surface === 'codex_native_host_agent'),
      true,
    );

    const visual = readJson(results[3].artifactFile);
    assert.equal(visual.lifecycle_stage, 'visual_authorship');
    assert.equal(visual.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(visual.visual_direction.creative_sources.director_statement.owner, 'host_agent');
    assert.equal(visual.visual_direction.creative_sources.director_statement.primary_surface, 'codex_native_host_agent');
    assert.equal(visual.visual_direction.creative_sources.director_statement.materialized_from, 'codex_cli_json_output');

    const render = readJson(results[4].artifactFile);
    assert.equal(render.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(
      render.html_bundle.slides.every((slide) => slide.creative_sources?.recipe_selection?.owner === 'host_agent'),
      true,
    );
    assert.equal(
      render.html_bundle.slides.every((slide) => slide.creative_sources?.final_markup?.owner === 'host_agent'),
      true,
    );
    assert.equal(
      render.html_bundle.slides.every((slide) => slide.creative_sources?.final_markup?.materialized_from === 'codex_cli_json_output'),
      true,
    );
    const html = readFileSync(render.html_bundle.html_file, 'utf-8');
    assert.equal(html.includes('prompt_pack_artifact'), false);

    const directorReview = readJson(results[5].artifactFile);
    assert.equal(directorReview.review_overlay, 'visual_director_review');
    assert.equal(directorReview.review_authorship.primary_surface, 'codex_native_host_agent');
    assert.equal(directorReview.review_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(typeof directorReview.visual_director_review?.director_intent_landed, 'boolean');
    assert.equal(typeof directorReview.visual_director_review?.anti_template_ok, 'boolean');
    assert.equal(directorReview.visual_director_review?.creative_sources?.review_judgement?.materialized_from, 'codex_cli_json_output');
    const directorReviewMarkdown = readFileSync(directorReview.artifact_refs[0], 'utf-8');
    assert.match(directorReviewMarkdown, /- review_owner: codex_native_host_agent/);
    assert.equal((directorReviewMarkdown.match(/codex_native_host_agent/g) || []).length, 1);

    const screenshotReview = readJson(results[6].artifactFile);
    assert.equal(screenshotReview.review_overlay, 'screenshot_review');
    assert.equal(screenshotReview.review_execution?.owner, 'host_agent');
    assert.equal(screenshotReview.review_execution?.overlay, 'screenshot_review');
    assert.equal(screenshotReview.review_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(screenshotReview.ai_review?.review_model, 'screenshot_director_first_visual_judgement');
    assert.equal(typeof screenshotReview.ai_review?.review_summary, 'string');
    assert.equal(
      screenshotReview.ai_review?.creative_sources?.review_judgement?.materialized_from,
      'codex_cli_json_output',
    );
    assert.equal(typeof screenshotReview.checks?.director_intent_landed, 'boolean');
    assert.equal(typeof screenshotReview.checks?.anti_template_ok, 'boolean');

    const copy = readJson(results[7].artifactFile);
    assert.equal(copy.lifecycle_stage, 'delivery_packaging');
    assert.equal(copy.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(copy.publish_copy.creative_sources.body.owner, 'host_agent');
    assert.equal(copy.publish_copy.creative_sources.first_comment.primary_surface, 'codex_native_host_agent');
    assert.equal(copy.publish_copy.creative_sources.body.materialized_from, 'codex_cli_json_output');
  });
});
