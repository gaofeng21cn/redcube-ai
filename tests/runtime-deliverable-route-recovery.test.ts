// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, utimesSync } from 'node:fs';

import {
  createDeliverable,
  runDeliverableRoute,
} from '@redcube/gateway';
import {
  startMockCodexCli,
  withEnv,
} from './helpers/mock-codex-cli.ts';
import { completeSourceReadiness } from './helpers/complete-source-readiness.ts';

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

test('runDeliverableRoute auto-recovers fresh review dependencies before ppt fix_html', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-route-recovery-'));
    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: 'Route recovery proof',
      brief: '验证 direct route 在旧截图质控后自动补跑 fresh review。',
      keywords: ['ppt', 'fix_html', 'recovery'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Route recovery proof',
      goal: '验证 direct route recovery',
    });

    for (const route of [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'render_html',
      'visual_director_review',
      'screenshot_review',
    ]) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const renderBundleFile = path.join(
      workspaceRoot,
      'topics',
      'topic-a',
      'deliverables',
      'deck-a',
      'artifacts',
      'render_bundle.json',
    );
    await new Promise((resolve) => setTimeout(resolve, 30));
    const touchedAt = new Date();
    utimesSync(renderBundleFile, touchedAt, touchedAt);

    const restoreVariants = withEnv({
      REDCUBE_MOCK_PPT_SCREENSHOT_REVIEW_VARIANT: 'force_block',
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'require_targeted_revision_rerender',
    });
    try {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'fix_html',
      });

      assert.equal(result.ok, true);
      assert.deepEqual(result.summary.auto_recovered_dependency_routes, [
        'visual_director_review',
        'screenshot_review',
      ]);
      assert.equal(result.summary.requested_route, 'fix_html');
      assert.equal(result.summary.executed_route, 'fix_html');
      assert.deepEqual(
        result.dependency_route_runs.map((entry) => entry.route),
        ['visual_director_review', 'screenshot_review'],
      );
      assert.deepEqual(result.artifact?.render_execution?.freshly_rendered_slide_ids, ['S02']);
    } finally {
      restoreVariants();
    }
  });
});
