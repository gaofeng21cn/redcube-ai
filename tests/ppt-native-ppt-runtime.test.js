import test from 'node:test';
import assert from 'node:assert/strict';
import { appendFileSync, existsSync } from 'node:fs';

import { mkUserScopedTestWorkspace } from './helpers/test-workspace.js';
import {
  readJson,
  readRouteStageArtifact,
  runNativePlanningChain,
  withMockNativePptRuntime,
  writeJson,
} from './helpers/ppt-native-ppt-runtime-fixtures.js';
import { runDeliverableRoute } from './product-domain-action-test-api.js';

test('native PPT lane authors editable PPTX and keeps review/export gates wired', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-');
    const deliverableId = 'deck-native';
    await runNativePlanningChain({ workspaceRoot, deliverableId });

    const authorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
      route: 'author_pptx_native',
    });
    assert.equal(authorResult.ok, true);
    const authored = readJson(authorResult.artifactFile);
    assert.equal(authored.native_ppt_bundle?.editable_artifact, true);
    assert.equal(authored.native_ppt_bundle?.source_visual_route, 'author_pptx_native');
    assert.equal(existsSync(authored.native_ppt_bundle?.pptx_file), true);
    assert.equal(existsSync(authored.native_ppt_bundle?.shape_manifest_file), true);
    assert.equal(
      authored.native_ppt_bundle.preview_screenshots.every((file) => existsSync(file)),
      true,
    );

    for (const route of ['visual_director_review', 'screenshot_review', 'export_pptx']) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId,
        route,
      });
      assert.equal(result.ok, true, route);
      if (route === 'export_pptx') {
        const exported = readJson(result.artifactFile);
        assert.equal(exported.export_bundle?.source_visual_route, 'author_pptx_native');
        assert.equal(exported.export_bundle?.source_pptx, authored.native_ppt_bundle.pptx_file);
        assert.equal(existsSync(exported.export_bundle?.pptx_file), true);
        assert.equal(existsSync(exported.export_bundle?.pdf_file), true);
      }
    }
  });
});

test('native PPT review and export reject a PPTX whose SHA no longer matches package and render proof', async () => {
  await withMockNativePptRuntime(async () => {
    const reviewWorkspace = mkUserScopedTestWorkspace('redcube-native-ppt-stale-review-');
    await runNativePlanningChain({ workspaceRoot: reviewWorkspace, deliverableId: 'deck-stale-review' });
    const authoredForReview = await runDeliverableRoute({
      workspaceRoot: reviewWorkspace,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-stale-review',
      route: 'author_pptx_native',
    });
    const reviewArtifact = readJson(authoredForReview.artifactFile);
    appendFileSync(reviewArtifact.native_ppt_bundle.pptx_file, '-replaced-after-proof');
    const staleReview = await runDeliverableRoute({
      workspaceRoot: reviewWorkspace,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-stale-review',
      route: 'visual_director_review',
    });
    assert.equal(staleReview.ok, false);
    assert.match(staleReview.run.error.message, /PPTX SHA mismatch/);

    const exportWorkspace = mkUserScopedTestWorkspace('redcube-native-ppt-stale-export-');
    await runNativePlanningChain({ workspaceRoot: exportWorkspace, deliverableId: 'deck-stale-export' });
    const authoredForExport = await runDeliverableRoute({
      workspaceRoot: exportWorkspace,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-stale-export',
      route: 'author_pptx_native',
    });
    for (const route of ['visual_director_review', 'screenshot_review']) {
      const review = await runDeliverableRoute({
        workspaceRoot: exportWorkspace,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-stale-export',
        route,
      });
      assert.equal(review.ok, true, route);
    }
    const exportArtifact = readJson(authoredForExport.artifactFile);
    appendFileSync(exportArtifact.native_ppt_bundle.pptx_file, '-replaced-before-export');
    const staleExport = await runDeliverableRoute({
      workspaceRoot: exportWorkspace,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-stale-export',
      route: 'export_pptx',
    });
    assert.equal(staleExport.ok, false);
    assert.match(staleExport.run.error.message, /PPTX SHA mismatch/);
  });
});

test('native PPT review uses semantic_kind after package materialization', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-semantic-kind-');
    const deliverableId = 'deck-semantic-kind';
    await runNativePlanningChain({ workspaceRoot, deliverableId });
    const authored = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
      route: 'author_pptx_native',
    });
    const nativeArtifact = readJson(authored.artifactFile);
    const shapeManifest = readJson(nativeArtifact.native_ppt_bundle.shape_manifest_file);
    shapeManifest.slides[0].native_shapes[0].kind = 'group';
    shapeManifest.slides[0].native_shapes[0].semantic_kind = 'chart';
    delete shapeManifest.slides[0].metrics.chart_metrics;
    writeJson(nativeArtifact.native_ppt_bundle.shape_manifest_file, shapeManifest);

    const directorReview = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
      route: 'visual_director_review',
    });
    assert.equal(directorReview.ok, true);
    const screenshotReview = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
      route: 'screenshot_review',
    });
    assert.equal(screenshotReview.ok, true);
    const reviewArtifact = readRouteStageArtifact(
      workspaceRoot,
      'topic-a',
      deliverableId,
      'screenshot_review',
    );
    assert.equal(reviewArtifact.status, 'completed_with_quality_debt');
    assert.equal(reviewArtifact.quality_debt?.blocks_stage_transition, false);
    assert.equal(reviewArtifact.review_state_patch?.ready_for_export, false);
    assert.match(JSON.stringify(reviewArtifact), /native_chart_metrics_missing/);
  });
});
