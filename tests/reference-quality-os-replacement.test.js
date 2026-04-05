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
  buildReferenceReplacementReport,
} from '../packages/redcube-runtime/src/index.js';

async function promoteReference({ workspaceRoot, deliverableId, promotedReferenceId, baselineDeliverableId = '' }) {
  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId,
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });

  for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'publish_copy']) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId,
      route,
      mode: baselineDeliverableId ? 'optimize_existing' : 'draft_new',
      baselineDeliverableId,
    });
    assert.equal(result.ok, true, route);
  }

  await applyReviewMutation({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId,
    mutation: {
      type: 'approve_publish',
      actor: 'human',
      notes: `approve ${deliverableId}`,
    },
  });

  await applyReviewMutation({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId,
    mutation: {
      type: 'promote_baseline',
      actor: 'human',
      promoted_reference_id: promotedReferenceId,
      notes: `promote ${deliverableId}`,
    },
  });
}

async function createBaselineDeliverable({ workspaceRoot, deliverableId }) {
  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId,
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });
  for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'publish_copy']) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId,
      route,
    });
    assert.equal(result.ok, true, route);
  }
  await applyReviewMutation({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId,
    mutation: {
      type: 'approve_publish',
      actor: 'human',
      notes: `approve ${deliverableId}`,
    },
  });
}

test('reference-os exposes machine-readable replacement report for superseded promoted references', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-reference-replacement-'));
  await intakeSource({
    workspaceRoot,
    topicId: 'topic-a',
    title: '甲状腺门诊小红书科普',
    brief: '用于 reference replacement report 的样本',
    keywords: ['甲状腺', '门诊'],
  });

  await createBaselineDeliverable({
    workspaceRoot,
    deliverableId: 'baseline-a',
  });
  await promoteReference({
    workspaceRoot,
    deliverableId: 'candidate-b',
    promotedReferenceId: 'xhs-standard-note-v2',
    baselineDeliverableId: 'baseline-a',
  });
  await promoteReference({
    workspaceRoot,
    deliverableId: 'candidate-c',
    promotedReferenceId: 'xhs-standard-note-v3',
    baselineDeliverableId: 'candidate-b',
  });

  const report = buildReferenceReplacementReport({ workspaceRoot });
  assert.equal(report.surface_kind, 'reference_replacement_report');
  assert.equal(Array.isArray(report.replacements), true);
  assert.equal(report.replacements.length, 1);
  assert.equal(report.replacements[0].superseded_reference_id, 'xhs-standard-note-v2');
  assert.equal(report.replacements[0].replacement_reference_id, 'xhs-standard-note-v3');
  assert.equal(report.replacements[0].overlay, 'xiaohongshu');
  assert.equal(report.replacements[0].profile_id, 'standard_note');
});
