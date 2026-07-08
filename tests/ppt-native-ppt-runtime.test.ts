// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

import { mkUserScopedTestWorkspace } from './helpers/test-workspace.ts';
import {
  readJson,
  runNativePlanningChain,
  withMockNativePptRuntime,
} from './helpers/ppt-native-ppt-runtime-fixtures.ts';
import { runDeliverableRoute } from './product-domain-action-test-api.ts';

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
