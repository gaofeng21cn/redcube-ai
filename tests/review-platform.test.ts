// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';

import {
  applyReviewMutation,
  createDeliverable,
  getPublicationProjection,
  getReviewState,
  runDeliverableRoute,
  runtimeWatch,
} from './product-domain-action-test-api.ts';
import { withMockCodexRuntime } from './mock-codex-cli.ts';

const TOPIC_ID = 'topic-a';
const XHS_SHARED_STATE_TOPIC_ID = 'topic-shared-state';
const ROUTES_BY_OVERLAY = {
  ppt_deck: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'author_image_pages', 'visual_director_review', 'screenshot_review'],
  xiaohongshu: ['research', 'storyline', 'single_note_plan', 'visual_direction', 'author_image_pages', 'visual_director_review', 'screenshot_review', 'publish_copy'],
};

function createWorkspaceRoot(prefix = 'redcube-review-platform-') {
  return mkdtempSync(path.join(os.tmpdir(), prefix));
}

async function runAllReviewRoutes({
  workspaceRoot,
  overlay,
  topicId = TOPIC_ID,
  deliverableId,
  mode,
  baselineDeliverableId,
}) {
  for (const route of ROUTES_BY_OVERLAY[overlay]) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay,
      topicId,
      deliverableId,
      route,
      mode,
      baselineDeliverableId,
    });
    assert.equal(result.ok, true, route);
  }
}

async function createReviewReadyDeliverable({
  workspaceRoot,
  overlay,
  profileId,
  topicId = TOPIC_ID,
  deliverableId,
  title,
  goal,
  mode,
  baselineDeliverableId,
}) {
  await createDeliverable({
    workspaceRoot,
    overlay,
    profileId,
    topicId,
    deliverableId,
    title,
    goal,
  });
  await runAllReviewRoutes({ workspaceRoot, overlay, topicId, deliverableId, mode, baselineDeliverableId });
}

async function buildXhsBaselineCandidateFixture(workspaceRoot) {
  await createReviewReadyDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: XHS_SHARED_STATE_TOPIC_ID,
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });
  await createReviewReadyDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    deliverableId: 'baseline-a',
    title: '甲状腺门诊小红书 baseline',
    goal: '旧版认可稿',
  });
  await applyReviewMutation({
    workspaceRoot,
    topicId: TOPIC_ID,
    deliverableId: 'baseline-a',
    mutation: {
      type: 'approve_publish',
      actor: 'human',
      notes: 'baseline approved',
    },
  });
  await createReviewReadyDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    deliverableId: 'candidate-a',
    title: '甲状腺门诊小红书优化版',
    goal: '在 baseline 基础上优化可读性',
    mode: 'optimize_existing',
    baselineDeliverableId: 'baseline-a',
  });
}

async function buildPptBaselineCandidateFixture(workspaceRoot) {
  await createReviewReadyDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    deliverableId: 'deck-baseline',
    title: '肠癌 AI 讲课 baseline',
    goal: '旧版认可稿',
  });
  await createReviewReadyDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    deliverableId: 'deck-candidate',
    title: '肠癌 AI 讲课优化版',
    goal: '在 baseline 基础上提升教学性',
    mode: 'optimize_existing',
    baselineDeliverableId: 'deck-baseline',
  });
}

async function createPreparedWorkspace(name, buildFixture) {
  const workspaceRoot = createWorkspaceRoot(`redcube-review-platform-${name}-`);
  await buildFixture(workspaceRoot);
  return workspaceRoot;
}

test('platform review state tracks pending revisions and rerun loop for ppt_deck', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = await createPreparedWorkspace('ppt-baseline-candidate', buildPptBaselineCandidateFixture);

    const readyState = await getReviewState({ workspaceRoot, topicId: TOPIC_ID, deliverableId: 'deck-candidate' });
    assert.equal(readyState.surface_kind, 'review_state');
    assert.equal(readyState.state_type, 'canonical');
    assert.equal(readyState.canonical_source.kind, 'review_state.publish_state');
    assert.equal(readyState.state.current_status, 'export_ready');
    assert.equal(readyState.state.ready_for_export, true);
    assert.equal(readyState.state.approval_state.status, 'not_required');
    assert.equal(readyState.state.publish_state.current, 'not_applicable');

    const blocked = await applyReviewMutation({
      workspaceRoot,
      topicId: TOPIC_ID,
      deliverableId: 'deck-candidate',
      mutation: {
        type: 'request_changes',
        actor: 'human',
        review_stage: 'screenshot_review',
        rerun_from_stage: 'author_image_pages',
        issues: ['visual_peak_missing'],
        notes: '关键页视觉峰值不够',
      },
    });
    assert.equal(blocked.state.current_status, 'blocked_for_revision');
    assert.equal(blocked.state.rerun_from_stage, 'author_image_pages');
    assert.deepEqual(blocked.state.pending_reviews, ['visual_peak_missing']);

    const watchBlocked = await runtimeWatch({ workspaceRoot, topicId: TOPIC_ID, deliverableId: 'deck-candidate' });
    assert.equal(watchBlocked.status, 'review_pending');
    assert.equal(watchBlocked.review_state.current_status, 'blocked_for_revision');
    assert.equal(watchBlocked.review_state.rerun_from_stage, 'author_image_pages');

    const authorImagePages = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: TOPIC_ID,
      deliverableId: 'deck-candidate',
      route: 'author_image_pages',
    });
    assert.equal(authorImagePages.ok, true, JSON.stringify(authorImagePages));
    assert.equal((await runDeliverableRoute({ workspaceRoot, overlay: 'ppt_deck', topicId: TOPIC_ID, deliverableId: 'deck-candidate', route: 'visual_director_review' })).ok, true);
    assert.equal((await runDeliverableRoute({ workspaceRoot, overlay: 'ppt_deck', topicId: TOPIC_ID, deliverableId: 'deck-candidate', route: 'screenshot_review' })).ok, true);

    const rerunState = await getReviewState({ workspaceRoot, topicId: TOPIC_ID, deliverableId: 'deck-candidate' });
    assert.equal(rerunState.state.current_status, 'export_ready');
    assert.equal(rerunState.state.ready_for_export, true);
    assert.equal(rerunState.state.pending_reviews.length, 0);
    assert.equal(rerunState.state.mutation_count >= 1, true);
    assert.equal(rerunState.state.history_count >= 3, true);
  });
});

test('platform review state is shared by xiaohongshu and supports baseline binding metadata', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = await createPreparedWorkspace('xhs-baseline-candidate', buildXhsBaselineCandidateFixture);

    const state = await getReviewState({ workspaceRoot, topicId: XHS_SHARED_STATE_TOPIC_ID, deliverableId: 'note-a' });
    assert.equal(state.state_type, 'canonical');
    assert.equal(state.canonical_source.kind, 'review_state.publish_state');
    assert.equal(state.state.overlay, 'xiaohongshu');
    assert.equal(state.state.current_status, 'publish_ready');
    assert.equal(state.state.ready_for_export, true);
    assert.equal(state.state.approval_state.status, 'pending_human');
    assert.equal(state.state.publish_state.current, 'approval_pending');
    const publicationStateFile = path.join(workspaceRoot, 'topics', XHS_SHARED_STATE_TOPIC_ID, 'publication-state.json');
    assert.equal(existsSync(publicationStateFile), true);
    assert.equal(JSON.parse(readFileSync(publicationStateFile, 'utf-8')).current, 'approval_pending');
    const projection = await getPublicationProjection({ workspaceRoot, topicId: XHS_SHARED_STATE_TOPIC_ID });
    assert.equal(projection.surface_kind, 'publication_projection');
    assert.equal(projection.state_type, 'projection');
    assert.equal(projection.publication.current, 'approval_pending');
    assert.equal(projection.canonical_source.kind, 'review_state.delivery_projection');
    rmSync(publicationStateFile);
    const rebuiltAfterDelete = await getPublicationProjection({ workspaceRoot, topicId: XHS_SHARED_STATE_TOPIC_ID });
    assert.equal(rebuiltAfterDelete.publication.current, 'approval_pending');
    assert.equal(existsSync(publicationStateFile), true);

    const mutation = await applyReviewMutation({
      workspaceRoot,
      topicId: XHS_SHARED_STATE_TOPIC_ID,
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

    assert.throws(
      () => applyReviewMutation({
        workspaceRoot,
        topicId: XHS_SHARED_STATE_TOPIC_ID,
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
      topicId: XHS_SHARED_STATE_TOPIC_ID,
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
      topicId: XHS_SHARED_STATE_TOPIC_ID,
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
    const publishHistory = readFileSync(published.history_file, 'utf-8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    assert.equal(publishHistory.at(-2)?.patch?.last_mutation?.type, 'approve_publish');
    assert.equal(publishHistory.at(-1)?.patch?.last_mutation?.type, 'promote_publish');
    assert.equal(JSON.parse(readFileSync(publicationStateFile, 'utf-8')).current, 'published');
    const rebuilt = await getPublicationProjection({ workspaceRoot, topicId: XHS_SHARED_STATE_TOPIC_ID });
    assert.equal(rebuilt.publication.current, 'published');
  });
});

test('promote_baseline requires structured relative quality and approval gates, then records promotion state', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = await createPreparedWorkspace('xhs-baseline-candidate', buildXhsBaselineCandidateFixture);

    assert.throws(
      () => applyReviewMutation({
        workspaceRoot,
        topicId: 'topic-a',
        deliverableId: 'candidate-a',
        mutation: {
          type: 'promote_baseline',
          actor: 'human',
          promoted_reference_id: 'xhs-standard-note-v2',
        },
      }),
      /approval|approved/i,
    );

    await applyReviewMutation({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'candidate-a',
      mutation: {
        type: 'approve_publish',
        actor: 'human',
        notes: 'candidate approved before promotion',
      },
    });

    const promoted = await applyReviewMutation({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'candidate-a',
      mutation: {
        type: 'promote_baseline',
        actor: 'human',
        promoted_reference_id: 'xhs-standard-note-v2',
        notes: 'promote optimized note into approved reference',
      },
    });
    assert.equal(promoted.state.baseline.promotion_state, 'promoted');
    assert.equal(promoted.state.baseline.promoted_reference_id, 'xhs-standard-note-v2');
    assert.equal(promoted.state.baseline.source_deliverable_id, 'candidate-a');
    assert.equal(typeof promoted.state.baseline.promoted_at, 'string');
    assert.equal(promoted.state.baseline.promoted_by, 'human');
    assert.equal(promoted.quality_summary?.relative_quality_verdict, 'acceptable');
    assert.equal(promoted.quality_summary?.baseline_promotion_state, 'promoted');
    assert.equal(promoted.quality_summary?.promoted_reference_id, 'xhs-standard-note-v2');

    const history = readFileSync(promoted.history_file, 'utf-8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    assert.equal(history.at(-1)?.patch?.last_mutation?.type, 'promote_baseline');
  });
});

test('approve_publish rejects xiaohongshu deliverable before publish_ready', async () => {
  const workspaceRoot = createWorkspaceRoot();
  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });

  assert.throws(
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

test('promote_baseline works for ppt_deck without human approval gate once relative quality exists', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = await createPreparedWorkspace('ppt-baseline-candidate', buildPptBaselineCandidateFixture);

    const promoted = await applyReviewMutation({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'deck-candidate',
      mutation: {
        type: 'promote_baseline',
        actor: 'human',
        promoted_reference_id: 'ppt-lecture-student-v2',
        notes: 'promote improved lecture deck into approved reference',
      },
    });
    assert.equal(promoted.state.baseline.promotion_state, 'promoted');
    assert.equal(promoted.state.baseline.promoted_reference_id, 'ppt-lecture-student-v2');
    assert.equal(promoted.state.baseline.source_deliverable_id, 'deck-candidate');
    assert.equal(promoted.quality_summary?.baseline_promotion_state, 'promoted');
  });
});
