import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';

import {
  applyReviewMutation,
  createDeliverable,
  intakeSource,
  runDeliverableRoute,
} from '../packages/redcube-gateway/src/index.js';
import {
  buildReferencePromotionReport,
} from '../packages/redcube-runtime/src/index.js';
import { withMockHermesUpstream } from './helpers/mock-codex-cli.js';

withMockHermesUpstreamSuite();

async function createPromotedReferenceWorkspace() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-reference-report-'));
  await intakeSource({
    workspaceRoot,
    topicId: 'topic-a',
    title: '甲状腺门诊小红书科普',
    brief: '用于 reference promotion report 的标准样本',
    keywords: ['甲状腺', '门诊'],
  });
  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'baseline-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });
  for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'publish_copy']) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'baseline-a',
      route,
    });
    assert.equal(result.ok, true, route);
  }
  await applyReviewMutation({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'baseline-a',
    mutation: {
      type: 'approve_publish',
      actor: 'human',
      notes: 'approve reference baseline',
    },
  });
  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'candidate-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });
  for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'publish_copy']) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'candidate-a',
      route,
      mode: 'optimize_existing',
      baselineDeliverableId: 'baseline-a',
    });
    assert.equal(result.ok, true, route);
  }
  await applyReviewMutation({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'candidate-a',
    mutation: {
      type: 'approve_publish',
      actor: 'human',
      notes: 'approve optimized reference candidate',
    },
  });
  await applyReviewMutation({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'candidate-a',
    mutation: {
      type: 'promote_baseline',
      actor: 'human',
      promoted_reference_id: 'xhs-standard-note-v3',
      notes: 'promote into reference catalog',
    },
  });
  return workspaceRoot;
}

test('reference-os exposes promoted reference reporting surface', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = await createPromotedReferenceWorkspace();
    const report = buildReferencePromotionReport({ workspaceRoot });

    assert.equal(report.surface_kind, 'reference_promotion_report');
    assert.equal(Array.isArray(report.promoted_references), true);
    assert.equal(report.promoted_references.length, 1);
    assert.equal(report.promoted_references[0].promoted_reference_id, 'xhs-standard-note-v3');
    assert.equal(report.promoted_references[0].deliverable_id, 'candidate-a');
    assert.equal(report.promoted_references[0].overlay, 'xiaohongshu');
  });
});
