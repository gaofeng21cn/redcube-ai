// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';

import {
  canonicalStageForRoute,
  getDeliverablePaths,
  stageOrderForCanonicalStage,
  stageFolderOutputPath,
  writeStageFolderArtifact,
} from '@redcube/runtime-protocol';
import { createDeliverable, runDeliverableRoute } from './product-domain-action-test-api.ts';
import { withMockCodexRuntime } from './mock-codex-cli.ts';
import { readJson, writeJson } from './helpers/json-io.ts';

function writeBlockedScreenshotReview({ workspaceRoot, deliverableId, slides, blockedSlideId }) {
  const paths = getDeliverablePaths(workspaceRoot, 'topic-a', deliverableId);
  const stageId = 'screenshot_review';
  const canonicalStageId = canonicalStageForRoute(stageId);
  const stageOrder = stageOrderForCanonicalStage(canonicalStageId);
  const attemptId = `seed-${stageId}`;
  const artifactFile = stageFolderOutputPath({
    deliverablePaths: paths,
    routeStageId: stageId,
    canonicalStageId,
    stageOrder,
    attemptId,
    outputName: 'screenshot-review.json',
  });
  const artifact = {
    route: stageId,
    status: 'block',
    blocked_slide_ids: [blockedSlideId],
    slide_reviews: slides.map((slide) => ({
      slide_id: slide.slide_id,
      title: slide.title,
      status: slide.slide_id === blockedSlideId ? 'block' : 'pass',
      checks: { block_content_fit_ok: slide.slide_id !== blockedSlideId },
      issues: slide.slide_id === blockedSlideId ? ['block_content_overflow_detected'] : [],
      mechanical_issues: slide.slide_id === blockedSlideId ? ['block_content_overflow_detected'] : [],
      ai_review: {
        judgement: slide.slide_id === blockedSlideId ? 'block' : 'pass',
        visual_findings: [slide.slide_id === blockedSlideId ? '文字拥挤，需要重绘整页图' : '可保留'],
        recommended_fix: slide.slide_id === blockedSlideId ? 'redraw this XHS page only' : 'none',
      },
    })),
  };
  writeJson(artifactFile, artifact);
  writeStageFolderArtifact({
    deliverablePaths: paths,
    routeStageId: stageId,
    canonicalStageId,
    stageOrder,
    attemptId,
    artifactFile,
    outputName: 'screenshot-review.json',
    status: 'blocked',
    typedBlockerRefs: [`rca-typed-blocker:test-seed:${stageId}:${deliverableId}`],
    blockingReasons: ['block_content_overflow_detected'],
  });
}

async function runXhsChain({ workspaceRoot, deliverableId, visualRoute = 'author_image_pages' }) {
  process.env.REDCUBE_IMAGE_GENERATION_MOCK = '1';
  const routes = [
    'research',
    'storyline',
    'single_note_plan',
    'visual_direction',
    visualRoute,
    'visual_director_review',
    'screenshot_review',
    'publish_copy',
  ];
  const results = [];
  for (const route of routes) {
    results.push({
      route,
      result: await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId,
        route,
      }),
    });
  }
  return results;
}

function routeArtifact(results, route) {
  return readJson(results.find((item) => item.route === route).result.artifactFile);
}

test('xiaohongshu image author-repair regenerates only blocked pages', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-image-pages-'));
    const deliverableId = 'note-repair';
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId,
      title: '甲状腺门诊小红书科普',
      goal: '为门诊患者生成可发布的科普图文',
    });
    for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction']) {
      const result = await runDeliverableRoute({ workspaceRoot, overlay: 'xiaohongshu', topicId: 'topic-a', deliverableId, route });
      assert.equal(result.ok, true, route);
    }
    process.env.REDCUBE_IMAGE_GENERATION_MOCK = '1';
    const authoredResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId,
      route: 'author_image_pages',
    });
    assert.equal(authoredResult.ok, true);
    const authored = readJson(authoredResult.artifactFile);
    const slides = authored.image_page_manifest.slides;
    assert.equal(authored.image_pages_bundle.source_visual_route, 'author_image_pages');
    assert.equal(slides.length > 1, true);
    assert.equal(slides.every((slide) => existsSync(slide.image_file)), true);
    assert.equal(slides[0].dimensions.width, 1086);
    assert.equal(slides[0].dimensions.height, 1448);
    assert.equal(slides[0].dimensions.ratio, '3:4');

    const blockedSlideId = slides[1].slide_id;
    writeBlockedScreenshotReview({ workspaceRoot, deliverableId, slides, blockedSlideId });
    const repairedResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId,
      route: 'repair_image_pages',
    });
    assert.equal(repairedResult.ok, true);
    const repaired = readJson(repairedResult.artifactFile);
    assert.deepEqual(repaired.repair_image_pages.blocked_slide_ids, [blockedSlideId]);
    assert.equal(repaired.image_generation_calls.length, 1);
    const preservedBefore = slides.find((slide) => slide.slide_id !== blockedSlideId);
    const preservedAfter = repaired.image_page_manifest.slides.find((slide) => slide.slide_id === preservedBefore.slide_id);
    assert.equal(preservedAfter.preserved, true);
    assert.equal(preservedAfter.hash, preservedBefore.hash);
  });
});

test('xiaohongshu render_html fails closed without planning artifacts', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-fail-closed-'));
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
});

test('xiaohongshu image-first workflow publishes and exports real files', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-e2e-'));
    const deliverableId = 'note-series';
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId,
      title: '甲状腺门诊科普系列',
      goal: '面向门诊患者做系列化科普图文',
    });
    const chain = await runXhsChain({ workspaceRoot, deliverableId });
    assert.equal(chain.every(({ result }) => result.ok), true);
    const authored = routeArtifact(chain, 'author_image_pages');
    const review = routeArtifact(chain, 'screenshot_review');
    const copy = routeArtifact(chain, 'publish_copy');
    assert.equal(authored.image_page_manifest.slides.every((slide) => existsSync(slide.image_file)), true);
    assert.equal(review.slide_reviews.every((slide) => existsSync(slide.screenshot_file)), true);
    assert.equal(copy.publish_copy.quality_gate.gate_pass, true);

    const exportResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId,
      route: 'export_bundle',
    });
    assert.equal(exportResult.ok, true);
    const bundle = readJson(exportResult.artifactFile);
    assert.equal(bundle.export_bundle.delivery_state.current, 'output_ready');
    assert.equal(bundle.export_bundle.publish_image_files.every((file) => existsSync(file)), true);
    assert.equal(existsSync(bundle.export_bundle.caption_file), true);
    assert.equal(Object.hasOwn(bundle, 'publication_state_file'), false);
    assert.equal(existsSync(bundle.series_surfaces.delivery_overview_file), true);
  });
});

test('xiaohongshu explicit HTML renderer remains an executable alternate workflow', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-html-'));
    const deliverableId = 'note-html';
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId,
      title: '甲状腺门诊小红书科普 HTML',
      goal: '验证显式 HTML 分支仍可运行',
    });
    const chain = await runXhsChain({ workspaceRoot, deliverableId, visualRoute: 'render_html' });
    assert.equal(chain.every(({ result }) => result.ok), true);
    const render = routeArtifact(chain, 'render_html');
    assert.equal(existsSync(render.html_bundle.html_file), true);
    assert.equal(render.render_execution.route, 'render_html');
    assert.equal(render.html_bundle.slides.every((slide) => slide.content.includes('data-recipe-id=')), true);
    const html = readFileSync(render.html_bundle.html_file, 'utf-8');
    assert.match(html, /slide-display-area/);
    assert.match(html, /id="redcube-render-plan"/);
  });
});
