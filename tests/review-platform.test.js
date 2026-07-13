import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';

import {
  applyReviewMutation,
  createDeliverable,
  dispatchDomainHandler,
  getPublicationProjection,
  getReviewState,
  runDeliverableRoute,
  runtimeWatch,
} from './product-domain-action-test-api.js';
import { persistReviewStatePatch } from '@redcube/governance';
import { withMockCodexRuntime } from './mock-codex-cli.js';
import {
  applyFormalPackageReviewCloseoutForTest,
  prepareFormalPackageReviewEvidenceForTest,
} from './helpers/route-attempt-test-api.ts';

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
  await applyFormalPackageReviewCloseoutForTest({ workspaceRoot, overlay, topicId, deliverableId });
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

test('package handoff keeps review debt non-blocking and reserves hard stops for exact-byte identity conflicts', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = createWorkspaceRoot('redcube-review-platform-handoff-authority-');
    const deliverableId = 'deck-authority';
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: TOPIC_ID,
      deliverableId,
      title: 'Handoff authority deck',
      goal: '验证 Review 质量债与 exact-byte identity authority 边界',
    });
    await runAllReviewRoutes({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: TOPIC_ID,
      deliverableId,
    });
    const evidence = await prepareFormalPackageReviewEvidenceForTest({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: TOPIC_ID,
      deliverableId,
    });

    const reviewDebt = await dispatchDomainHandler({
      task: {
        ...evidence.ownerReceiptTask,
        receipt_id: 'review-quality-debt',
        formal_review_receipt: {
          ...evidence.formalReviewReceipt,
          verdict: 'quality_debt',
        },
      },
    });
    assert.equal(reviewDebt.ok, true);
    assert.equal(reviewDebt.result_surface.ok, false);
    assert.equal(reviewDebt.result_surface.return_shape, 'quality_debt');
    assert.equal(reviewDebt.result_surface.receipt_issued, false);
    assert.equal(reviewDebt.result_surface.quality_debt.blocks_stage_transition, false);
    assert.equal(reviewDebt.result_surface.quality_debt.next_stage_may_start, true);
    assert.equal(reviewDebt.result_surface.quality_debt.blocks_quality_export_publication_or_ready_claims, true);

    const mismatchedReviewHash = await dispatchDomainHandler({
      task: {
        ...evidence.ownerReceiptTask,
        receipt_id: 'review-hash-mismatch',
        formal_review_receipt: {
          ...evidence.formalReviewReceipt,
          reviewed_artifact_hashes: evidence.formalReviewReceipt.reviewed_artifact_hashes
            .map((hash, index) => index === 0 ? '0'.repeat(64) : hash),
        },
      },
    });
    assert.equal(mismatchedReviewHash.result_surface.return_shape, 'typed_blocker');
    assert.equal(mismatchedReviewHash.result_surface.blocker_kind, 'stale_or_mismatched_stage_identity');
    assert.equal(
      mismatchedReviewHash.result_surface.identity_mismatch_reasons.includes('formal_review_hashes_do_not_match_candidate'),
      true,
    );

    const mismatchedSizeIdentity = {
      ...evidence.identityReceipt,
      exact_artifact_ref_metadata: evidence.exactArtifactMetadata.map((entry, index) => (
        index === 0 ? { ...entry, size_bytes: entry.size_bytes + 1 } : entry
      )),
    };
    const mismatchedCurrentSize = await dispatchDomainHandler({
      task: {
        ...evidence.ownerReceiptTask,
        receipt_id: 'current-size-mismatch',
        artifact_identity_receipt: mismatchedSizeIdentity,
      },
    });
    assert.equal(mismatchedCurrentSize.result_surface.return_shape, 'typed_blocker');
    assert.equal(mismatchedCurrentSize.result_surface.blocker_kind, 'stale_or_mismatched_stage_identity');
    assert.equal(
      mismatchedCurrentSize.result_surface.identity_mismatch_reasons
        .some((reason) => reason.startsWith('artifact_size_changed:')),
      true,
    );

    const closeoutBase = {
      surface_kind: 'rca_handoff_review_closeout',
      attempt_role: 'reviewer',
      reviewer_session_ref: evidence.reviewerSessionRef,
      producer_session_refs: [evidence.producerSessionRef],
      no_context_inheritance: true,
      artifact_identity_receipt_refs: evidence.identityReceiptRefs,
      reviewed_artifact_ref_metadata: evidence.exactArtifactMetadata,
      review_receipt_refs: [evidence.reviewReceiptRef],
    };
    const fakeOwnerReceiptCloseout = {
      ...closeoutBase,
      status: 'pass',
      owner_receipt_refs: ['rca-owner-receipt:fake-without-body'],
    };
    const fakeOwnerResult = persistReviewStatePatch({
      workspaceRoot,
      topicId: TOPIC_ID,
      deliverableId,
      patch: {
        current_status: 'export_ready',
        ready_for_export: true,
        latest_review_stage: 'export_pptx',
        pending_reviews: [],
        handoff_review_closeout: fakeOwnerReceiptCloseout,
      },
    });
    assert.equal(fakeOwnerResult.state.ready_for_export, false);
    assert.equal(fakeOwnerResult.state.pending_reviews.includes('final_byte_handoff_review'), true);
    assert.equal(fakeOwnerResult.state.handoff_review_validation.reasons.includes('domain_owner_receipt_body_missing'), true);
    assert.deepEqual(fakeOwnerResult.state.handoff_review_closeout, fakeOwnerReceiptCloseout);

    const failedReviewCloseout = {
      ...closeoutBase,
      status: 'quality_debt',
      owner_receipt_refs: [],
    };
    const failedReviewResult = persistReviewStatePatch({
      workspaceRoot,
      topicId: TOPIC_ID,
      deliverableId,
      patch: {
        current_status: 'completed_with_quality_debt',
        ready_for_export: false,
        latest_review_stage: 'export_pptx',
        pending_reviews: [],
        handoff_review_closeout: failedReviewCloseout,
      },
    });
    assert.equal(failedReviewResult.state.ready_for_export, false);
    assert.equal(
      failedReviewResult.state.handoff_review_validation.reasons.includes('decisive_handoff_review_not_passed'),
      true,
    );
    assert.deepEqual(failedReviewResult.state.handoff_review_closeout, failedReviewCloseout);
    const failedHistory = readFileSync(failedReviewResult.history_file, 'utf-8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    assert.deepEqual(failedHistory.at(-1)?.patch?.handoff_review_closeout, failedReviewCloseout);
  });
});

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
    assert.equal(watchBlocked.surface_kind, 'rca_visual_review_refs_projection');
    assert.equal(watchBlocked.visual_review_semantics.review_status, 'blocked_for_revision');
    assert.equal(watchBlocked.visual_review_semantics.rerun_from_visual_stage, 'author_image_pages');
    assert.deepEqual(watchBlocked.visual_review_semantics.pending_visual_reviews, ['visual_peak_missing']);

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
    await applyFormalPackageReviewCloseoutForTest({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: TOPIC_ID,
      deliverableId: 'deck-candidate',
      attemptRole: 're_reviewer',
      qualityRoundIndex: 1,
    });

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
