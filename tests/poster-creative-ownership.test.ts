// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs';

import {
  createDeliverable,
  runDeliverableRoute,
} from './gateway-test-api.ts';
import {
  startMockCodexCli,
  withEnv,
} from './helpers/mock-codex-cli.ts';

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

test('poster_onepager creative mainline no longer lets runtime artifacts, seeds, or pack compilers author content', () => {
  const packEntry = read('packages/redcube-pack-poster-onepager/src/index.ts');
  const runtime = [
    read('packages/redcube-runtime-family-poster-onepager/src/poster-onepager-runtime.ts'),
    read('packages/redcube-runtime-family-poster-onepager/src/poster-onepager-runtime-parts/authoring.ts'),
    read('packages/redcube-runtime-family-poster-onepager/src/poster-onepager-runtime-parts/core.ts'),
  ].join('\n');
  const storylinePrompt = read('prompts/poster_onepager/storyline.md');
  const blueprintPrompt = read('prompts/poster_onepager/poster_blueprint.md');
  const visualPrompt = read('prompts/poster_onepager/visual_direction.md');
  const renderHtmlPrompt = read('prompts/poster_onepager/render_html.md');
  const renderShell = read('prompts/poster_onepager/render_shell.html');
  const directorReviewPrompt = read('prompts/poster_onepager/director_review.md');
  const screenshotReviewPrompt = read('prompts/poster_onepager/screenshot_review.md');

  assert.equal(existsSync(path.resolve('packages/redcube-pack-poster-onepager/src/render-compiler.js')), false);
  assert.equal(packEntry.includes('buildPosterBlueprint'), false);
  assert.equal(packEntry.includes('buildPosterVisualDirection'), false);
  assert.equal(packEntry.includes('buildPosterRenderArtifact'), false);
  assert.equal(packEntry.includes('compilePosterRenderSlides'), false);
  assert.equal(runtime.includes("const authoredArtifact = promptArtifact(contract, 'storyline', {"), false);
  assert.equal(runtime.includes("const seed = promptSeed(contract, 'visual_director_review', {"), false);
  assert.equal(runtime.includes('buildPosterBlueprint(contract, storylineArtifact,'), false);
  assert.equal(runtime.includes('buildPosterVisualDirection(contract, blueprintArtifact'), false);
  assert.equal(runtime.includes("const renderArtifact = deps.promptArtifact(contract, 'render_html')?.render_markup_artifact || {};"), false);
  assert.equal(runtime.includes('buildPosterRenderArtifact({ workspaceRoot, topicId, deliverableId, contract, deliverablePaths }'), false);
  assert.equal(runtime.includes('@redcube/pack-poster-onepager'), false);
  assert.match(storylinePrompt, /## runtime_artifact/);
  assert.match(blueprintPrompt, /## runtime_seed/);
  assert.match(visualPrompt, /## runtime_seed/);
  assert.match(visualPrompt, /相邻可读块安全间距/);
  assert.match(renderHtmlPrompt, /## runtime_seed/);
  assert.match(renderHtmlPrompt, /相邻读者可见.*安全间距/);
  assert.match(renderShell, /font-awesome\/6\.5\.1/);
  assert.match(directorReviewPrompt, /## runtime_seed/);
  assert.match(screenshotReviewPrompt, /相邻读者可见.*视觉贴住/);
  assert.equal(runtime.includes("family: 'poster_onepager'"), true);
});

test('poster_onepager route artifacts record Codex-backed ownership for story, visual, render, and director review surfaces', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-poster-creative-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'poster_onepager',
      profileId: 'knowledge_poster',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      title: 'P19 单页海报创作权收口',
      goal: '验证 poster 主创作权已从 runtime seed / compiler 收回到 Codex-backed mainline',
    });

    const routes = ['storyline', 'poster_blueprint', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review'];
    const results = [];
    for (const route of routes) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'poster_onepager',
        topicId: 'topic-a',
        deliverableId: 'poster-a',
        route,
      });
      assert.equal(result.ok, true, route);
      results.push(result);
    }

    const storyline = readJson(results[0].artifactFile);
    assert.equal(storyline.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(storyline.storyline.creative_sources?.headline?.owner, 'host_agent');
    assert.equal(storyline.storyline.creative_sources?.headline?.materialized_from, 'codex_cli_json_output');

    const blueprint = readJson(results[1].artifactFile);
    assert.equal(blueprint.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(
      blueprint.poster_blueprint.slides.every((slide) => slide.creative_authorship?.major_blueprint_text?.owner === 'host_agent'),
      true,
    );
    assert.equal(
      blueprint.poster_blueprint.slides.every((slide) => slide.creative_authorship?.major_blueprint_text?.materialized_from === 'codex_cli_json_output'),
      true,
    );

    const visual = readJson(results[2].artifactFile);
    assert.equal(visual.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(visual.visual_direction.creative_sources?.visual_manifest?.owner, 'host_agent');
    assert.equal(visual.visual_direction.creative_sources?.visual_manifest?.materialized_from, 'codex_cli_json_output');

    const render = readJson(results[3].artifactFile);
    assert.equal(render.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(
      render.html_bundle.slides.every((slide) => slide.creative_authorship?.final_html_markup?.owner === 'host_agent'),
      true,
    );
    assert.equal(
      render.html_bundle.slides.every((slide) => slide.creative_authorship?.final_html_markup?.materialized_from === 'codex_cli_json_output'),
      true,
    );
    const html = readFileSync(render.html_bundle.html_file, 'utf-8');
    assert.equal(html.includes('prompt_pack_artifact'), false);

    const directorReview = readJson(results[4].artifactFile);
    assert.equal(directorReview.review_execution?.owner, 'host_agent');
    assert.equal(directorReview.review_execution?.overlay, 'visual_director_review');
    assert.equal(directorReview.review_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(directorReview.visual_director_review?.review_model, 'director_first_visual_judgement');
    assert.equal(directorReview.visual_director_review?.creative_sources?.review_judgement?.materialized_from, 'codex_cli_json_output');

    const screenshotReview = readJson(results[5].artifactFile);
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
    assert.equal(typeof screenshotReview.checks?.message_hierarchy_clear, 'boolean');
  });
});

test('poster_onepager screenshot_review forwards current source_html alongside screenshots', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-poster-screenshot-source-html-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'poster_onepager',
      profileId: 'knowledge_poster',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      title: 'P19 海报截图质控源码对照',
      goal: '验证海报截图质控会同时参考当前 HTML 源码',
    });

    const restoreVariant = withEnv({
      REDCUBE_MOCK_POSTER_SCREENSHOT_REVIEW_VARIANT: 'require_source_html',
    });
    try {
      const routes = ['storyline', 'poster_blueprint', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review'];
      for (const route of routes) {
        const result = await runDeliverableRoute({
          workspaceRoot,
          overlay: 'poster_onepager',
          topicId: 'topic-a',
          deliverableId: 'poster-a',
          route,
        });
        assert.equal(result.ok, true, route);
      }
    } finally {
      restoreVariant();
    }
  });
});

test('poster_onepager rerender keeps stable views untouched and writes candidate draft separately', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-poster-stable-views-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'poster_onepager',
      profileId: 'knowledge_poster',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      title: 'P19 海报稳定视图验证',
      goal: '验证海报候选稿不会覆盖稳定视图，且稳定截图入口与通过 capture 对齐',
    });

    const routes = ['storyline', 'poster_blueprint', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review'];
    const results = [];
    for (const route of routes) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'poster_onepager',
        topicId: 'topic-a',
        deliverableId: 'poster-a',
        route,
      });
      assert.equal(result.ok, true, route);
      results.push(result);
    }

    const deliverableDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', 'poster-a');
    const stableViewHtmlFile = path.join(deliverableDir, 'views', 'poster-a.html');
    const draftViewHtmlFile = path.join(deliverableDir, 'views', 'poster-a.draft.html');

    const stableViewHtmlContent = readFileSync(stableViewHtmlFile, 'utf-8');
    const stableViewHtmlStat = statSync(stableViewHtmlFile).mtimeMs;

    await new Promise((resolve) => setTimeout(resolve, 25));
    const rerender = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'poster_onepager',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      route: 'render_html',
    });
    assert.equal(rerender.ok, true);

    assert.equal(statSync(stableViewHtmlFile).mtimeMs, stableViewHtmlStat);
    assert.equal(readFileSync(stableViewHtmlFile, 'utf-8'), stableViewHtmlContent);
    assert.equal(existsSync(draftViewHtmlFile), true);
  });
});

test('poster_onepager export_bundle records the stable reviewed HTML instead of the latest draft candidate', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-poster-export-stable-html-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'poster_onepager',
      profileId: 'knowledge_poster',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      title: 'P19 海报稳定导出 HTML',
      goal: '验证 export_bundle 记录的 source_html 指向稳定通过版',
    });

    for (const route of [
      'storyline',
      'poster_blueprint',
      'visual_direction',
      'render_html',
      'visual_director_review',
      'screenshot_review',
      'export_bundle',
    ]) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'poster_onepager',
        topicId: 'topic-a',
        deliverableId: 'poster-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const deliverableDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', 'poster-a');
    const exportArtifact = readJson(path.join(deliverableDir, 'artifacts', 'publish_bundle.json'));
    assert.equal(exportArtifact.export_bundle.source_html, path.join(deliverableDir, 'views', 'poster-a.html'));
  });
});
