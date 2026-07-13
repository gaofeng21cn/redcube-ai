import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import {
  canonicalStageForRoute,
  getDeliverablePaths,
  stageOrderForCanonicalStage,
  stageFolderOutputPath,
  writeStageFolderArtifact,
} from '@redcube/runtime-protocol';
import { createDeliverable, runDeliverableRoute } from './product-domain-action-test-api.js';
import { withMockCodexRuntime } from './mock-codex-cli.js';
import { readJson, writeJson } from './helpers/json-io.ts';

function hydratedContractFile(paths) {
  const deliverable = readJson(paths.deliverableFile);
  const contractRef = String(deliverable.hydrated_contract_ref || 'contracts/hydrated-deliverable.json').trim();
  return path.join(paths.deliverableDir, contractRef);
}

function writeBlockedScreenshotReview({ workspaceRoot, deliverableId, slides, blockedSlideId }) {
  const paths = getDeliverablePaths(workspaceRoot, 'topic-a', deliverableId);
  const stageId = 'screenshot_review';
  const canonicalStageId = canonicalStageForRoute(stageId);
  const stageOrder = stageOrderForCanonicalStage(canonicalStageId);
  const attemptId = `seed-${stageId}`;
  const contract = readJson(hydratedContractFile(paths));
  const stages = [
    ...(Array.isArray(contract.stage_sequence?.stages) ? contract.stage_sequence.stages : []),
    ...(Array.isArray(contract.stage_sequence?.alternate_stages) ? contract.stage_sequence.alternate_stages : []),
  ];
  const outputName = stages.find((stage) => stage.stage_id === stageId)?.output_artifact;
  assert.equal(outputName, 'quality_gate.json');
  const artifactFile = stageFolderOutputPath({
    deliverablePaths: paths,
    routeStageId: stageId,
    canonicalStageId,
    stageOrder,
    attemptId,
    outputName,
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
    outputName,
    status: 'blocked',
    typedBlockerRefs: [`rca-typed-blocker:test-seed:${stageId}:${deliverableId}`],
    blockingReasons: ['block_content_overflow_detected'],
  });
}

async function runXhsRoutes({ workspaceRoot, deliverableId, routes }) {
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

async function runXhsChain({ workspaceRoot, deliverableId, visualRoute = 'author_image_pages' }) {
  process.env.REDCUBE_IMAGE_GENERATION_MOCK = '1';
  return runXhsRoutes({
    workspaceRoot,
    deliverableId,
    routes: [
      'research',
      'storyline',
      'single_note_plan',
      'visual_direction',
      visualRoute,
      'visual_director_review',
      'screenshot_review',
      'publish_copy',
    ],
  });
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

test('xiaohongshu style_reference_dir replaces built-in references for image authoring', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-style-ref-'));
    const deliverableId = 'note-style-ref';
    const styleRefDir = path.join(workspaceRoot, 'operator-style-ref');
    mkdirSync(styleRefDir, { recursive: true });
    writeFileSync(
      path.join(styleRefDir, 'operator-style.png'),
      Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000000020001e221bc330000000049454e44ae426082', 'hex'),
    );
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId,
      title: '甲状腺门诊小红书科普',
      goal: '为门诊患者生成可发布的科普图文',
    });
    const paths = getDeliverablePaths(workspaceRoot, 'topic-a', deliverableId);
    const contractFile = hydratedContractFile(paths);
    const contract = readJson(contractFile);
    contract.delivery_request = { ...(contract.delivery_request || {}), style_reference_dir: styleRefDir };
    writeJson(contractFile, contract);

    process.env.REDCUBE_IMAGE_GENERATION_MOCK = '1';
    const results = await runXhsRoutes({
      workspaceRoot,
      deliverableId,
      routes: ['research', 'storyline', 'single_note_plan', 'visual_direction', 'author_image_pages'],
    });
    assert.equal(results.every(({ result }) => result.ok), true);
    const authored = routeArtifact(results, 'author_image_pages');
    const styleManifest = readJson(authored.image_page_manifest.style_manifest);
    assert.equal(styleManifest.style_reference.mode, 'user_style_reference_dir');
    assert.equal(styleManifest.style_reference.artifact_materialization, 'copied_operator_references');
    assert.deepEqual(styleManifest.style_reference.built_in_reference_files, []);
    assert.equal(styleManifest.style_reference.copied_files[0].file_name, 'operator-style.png');
    assert.equal(existsSync(styleManifest.style_reference.copied_files[0].copied_file), true);
    assert.equal(styleManifest.fact_copy_guard.reference_images_style_only, true);
  });
});

test('xiaohongshu render_html starts without planning artifacts and records quality debt', async () => {
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
    assert.equal(result.ok, true);
    const artifact = readJson(result.artifactFile);
    assert.equal(artifact.status, 'completed_with_quality_debt');
    assert.equal(artifact.progress_first.next_stage_may_start, true);
    assert.equal(artifact.quality_debt.blocks_stage_transition, false);
    assert.match(artifact.stage_attempt_diagnostic.error_message, /stages|single_note_plan|visual_direction/i);
  });
});

test('xiaohongshu render_html advances with quality debt when the hydrated shell asset is missing', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-missing-shell-'));
    const deliverableId = 'note-missing-shell';
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId,
      title: '甲状腺门诊小红书科普',
      goal: '为门诊患者生成可发布的科普图文',
    });
    const paths = getDeliverablePaths(workspaceRoot, 'topic-a', deliverableId);
    const contractFile = hydratedContractFile(paths);
    const contract = readJson(contractFile);
    contract.prompt_pack.render_contract.shell_file = 'missing-shell.html';
    writeJson(contractFile, contract);

    const planning = await runXhsRoutes({
      workspaceRoot,
      deliverableId,
      routes: ['research', 'storyline', 'single_note_plan', 'visual_direction'],
    });
    assert.equal(planning.every(({ result }) => result.ok), true);
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId,
      route: 'render_html',
    });
    assert.equal(result.ok, true, JSON.stringify(result, null, 2));
    assert.equal(result.run.status, 'completed_with_quality_debt');
    assert.equal(result.run.error, null);
    assert.equal(result.artifact.status, 'completed_with_quality_debt');
    assert.match(result.artifact.stage_attempt_diagnostic.error_message, /Missing prompt pack asset/i);
    assert.equal(result.artifact.progress_first.next_stage_may_start, true);
    assert.equal(result.artifact.quality_debt.blocks_stage_transition, false);
    assert.equal(result.artifact.quality_debt.blocks_visual_ready_claim, true);
    assert.equal(result.artifact.quality_debt.blocks_export_ready_claim, true);
    assert.deepEqual(result.artifact.typed_blocker_refs, []);
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

test('xiaohongshu image authoring advances with quality debt when one page generation fails', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-image-partial-'));
    const deliverableId = 'note-partial-image';
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId,
      title: '甲状腺门诊小红书科普',
      goal: '验证单页图像失败不会阻断后续交付',
    });
    await runXhsRoutes({
      workspaceRoot,
      deliverableId,
      routes: ['research', 'storyline', 'single_note_plan', 'visual_direction'],
    });
    process.env.REDCUBE_IMAGE_GENERATION_MOCK = '1';
    process.env.REDCUBE_IMAGE_GENERATION_MOCK_FAIL_SLIDE_IDS = 'N02';
    try {
      const authoredResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId,
        route: 'author_image_pages',
      });
      assert.equal(authoredResult.ok, true);
      const authored = readJson(authoredResult.artifactFile);
      assert.equal(authored.status, 'completed_with_quality_debt');
      assert.deepEqual(authored.quality_debt.failed_slide_ids, ['N02'], JSON.stringify(authored, null, 2));
      assert.equal(authored.image_pages_bundle.page_count > 0, true);
      assert.equal(authored.image_pages_bundle.pages.some((page) => page.slide_id === 'N02'), false);

      const downstream = await runXhsRoutes({
        workspaceRoot,
        deliverableId,
        routes: ['visual_director_review', 'screenshot_review', 'publish_copy', 'export_bundle'],
      });
      assert.equal(downstream.every(({ result }) => result.ok), true);
      const exported = routeArtifact(downstream, 'export_bundle');
      assert.equal(exported.status, 'completed_with_quality_debt');
      assert.equal(exported.quality_debt.blocks_stage_transition, false);
      assert.equal(exported.review_state_patch.ready_for_export, false);
      assert.equal(exported.export_bundle.publish_image_files.length > 0, true);
    } finally {
      delete process.env.REDCUBE_IMAGE_GENERATION_MOCK_FAIL_SLIDE_IDS;
    }
  });
});

test('xiaohongshu HTML authoring advances with quality debt when one page is missing', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-html-partial-'));
    const deliverableId = 'note-html-partial';
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId,
      title: '甲状腺门诊小红书科普 HTML',
      goal: '验证 HTML 缺一页仍可推进',
    });
    await runXhsRoutes({
      workspaceRoot,
      deliverableId,
      routes: ['research', 'storyline', 'single_note_plan', 'visual_direction'],
    });
    process.env.REDCUBE_MOCK_XHS_RENDER_OMIT_SLIDE_ID = 'N02';
    const renderedResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId,
      route: 'render_html',
    });
    delete process.env.REDCUBE_MOCK_XHS_RENDER_OMIT_SLIDE_ID;
    assert.equal(renderedResult.ok, true, JSON.stringify(renderedResult));
    const rendered = readJson(renderedResult.artifactFile);
    assert.equal(rendered.status, 'completed_with_quality_debt');
    assert.equal(rendered.html_bundle.actual_page_count > 0, true);
    assert.equal(rendered.html_bundle.actual_page_count < rendered.html_bundle.expected_page_count, true);
    const downstream = await runXhsRoutes({
      workspaceRoot,
      deliverableId,
      routes: ['visual_director_review', 'screenshot_review', 'publish_copy', 'export_bundle'],
    });
    assert.equal(downstream.every(({ result }) => result.ok), true);
    const exported = routeArtifact(downstream, 'export_bundle');
    assert.equal(exported.status, 'completed_with_quality_debt');
    assert.equal(exported.review_state_patch.ready_for_export, false);
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
