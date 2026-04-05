import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';

import {
  applyReviewMutation,
  createDeliverable,
  getReviewState,
  runDeliverableRoute,
  runtimeWatch,
} from '../packages/redcube-gateway/src/index.js';

async function runPptReviewReady(workspaceRoot) {
  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '肠癌 AI 讲课 deck',
    goal: '给学生讲清肠癌 AI 的问题、方法与边界',
  });
  for (const route of ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html', 'screenshot_review']) {
    const result = await runDeliverableRoute({ workspaceRoot, overlay: 'ppt_deck', topicId: 'topic-a', deliverableId: 'deck-a', route });
    assert.equal(result.ok, true, route);
  }
}

async function runXhsReviewReady(workspaceRoot) {
  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });
  for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'publish_copy']) {
    const result = await runDeliverableRoute({ workspaceRoot, overlay: 'xiaohongshu', topicId: 'topic-a', deliverableId: 'note-a', route });
    assert.equal(result.ok, true, route);
  }
}

test('platform review state tracks pending revisions and rerun loop for ppt_deck', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-platform-'));
  await runPptReviewReady(workspaceRoot);

  const readyState = await getReviewState({ workspaceRoot, topicId: 'topic-a', deliverableId: 'deck-a' });
  assert.equal(readyState.state.current_status, 'export_ready');
  assert.equal(readyState.state.ready_for_export, true);
  assert.equal(readyState.state.approval_state.status, 'not_required');
  assert.equal(readyState.state.publish_state.current, 'not_applicable');

  const blocked = await applyReviewMutation({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    mutation: {
      type: 'request_changes',
      actor: 'human',
      review_stage: 'screenshot_review',
      rerun_from_stage: 'render_html',
      issues: ['visual_peak_missing'],
      notes: '关键页视觉峰值不够',
    },
  });
  assert.equal(blocked.state.current_status, 'blocked_for_revision');
  assert.equal(blocked.state.rerun_from_stage, 'render_html');
  assert.deepEqual(blocked.state.pending_reviews, ['visual_peak_missing']);

  const watchBlocked = await runtimeWatch({ workspaceRoot, topicId: 'topic-a', deliverableId: 'deck-a' });
  assert.equal(watchBlocked.status, 'review_pending');
  assert.equal(watchBlocked.review_state.current_status, 'blocked_for_revision');
  assert.equal(watchBlocked.review_state.rerun_from_stage, 'render_html');

  assert.equal((await runDeliverableRoute({ workspaceRoot, overlay: 'ppt_deck', topicId: 'topic-a', deliverableId: 'deck-a', route: 'render_html' })).ok, true);
  assert.equal((await runDeliverableRoute({ workspaceRoot, overlay: 'ppt_deck', topicId: 'topic-a', deliverableId: 'deck-a', route: 'screenshot_review' })).ok, true);

  const rerunState = await getReviewState({ workspaceRoot, topicId: 'topic-a', deliverableId: 'deck-a' });
  assert.equal(rerunState.state.current_status, 'export_ready');
  assert.equal(rerunState.state.ready_for_export, true);
  assert.equal(rerunState.state.pending_reviews.length, 0);
  assert.equal(rerunState.state.mutation_count >= 1, true);
  assert.equal(rerunState.state.history_count >= 3, true);
});

test('platform review state is shared by xiaohongshu and supports baseline binding metadata', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-platform-'));
  await runXhsReviewReady(workspaceRoot);

  const state = await getReviewState({ workspaceRoot, topicId: 'topic-a', deliverableId: 'note-a' });
  assert.equal(state.state.overlay, 'xiaohongshu');
  assert.equal(state.state.current_status, 'publish_ready');
  assert.equal(state.state.ready_for_export, true);
  assert.equal(state.state.approval_state.status, 'pending_human');
  assert.equal(state.state.publish_state.current, 'approval_pending');
  const publicationStateFile = path.join(workspaceRoot, 'topics', 'topic-a', 'publication-state.json');
  assert.equal(existsSync(publicationStateFile), true);
  assert.equal(JSON.parse(readFileSync(publicationStateFile, 'utf-8')).current, 'approval_pending');

  const mutation = await applyReviewMutation({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'note-a',
    mutation: {
      type: 'bind_baseline',
      actor: 'agent',
      baseline_deliverable_id: 'note-baseline',
      notes: 'bind optimize_existing baseline contract',
    },
  });
  assert.equal(mutation.state.baseline.baseline_deliverable_id, 'note-baseline');
  assert.equal(mutation.state.mutation_count >= 1, true);

  await assert.rejects(
    () => applyReviewMutation({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'note-a',
      mutation: {
        type: 'promote_publish',
        actor: 'human',
      },
    }),
    /approval/i,
  );

  const approved = await applyReviewMutation({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'note-a',
    mutation: {
      type: 'approve_publish',
      actor: 'human',
      notes: '人工确认可发布',
    },
  });
  assert.equal(approved.state.approval_state.status, 'approved');
  assert.equal(approved.state.publish_state.current, 'approved_pending_publish');

  const published = await applyReviewMutation({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'note-a',
    mutation: {
      type: 'promote_publish',
      actor: 'human',
      notes: '正式发布',
    },
  });
  assert.equal(published.state.current_status, 'published');
  assert.equal(published.state.publish_state.current, 'published');
  assert.equal(published.state.publish_state.approved_by, 'human');
  assert.equal(JSON.parse(readFileSync(publicationStateFile, 'utf-8')).current, 'published');
});

test('approve_publish rejects xiaohongshu deliverable before publish_ready', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-platform-'));
  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });

  await assert.rejects(
    () => applyReviewMutation({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'note-a',
      mutation: {
        type: 'approve_publish',
        actor: 'human',
      },
    }),
    /publish_ready|pending_human|ready_for_export/i,
  );
});
