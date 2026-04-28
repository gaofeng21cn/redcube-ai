// @ts-nocheck
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import {
  appendHistory,
  buildQualitySummary,
  defaultState,
  loadContractAndPaths,
  normalizeList,
  nowIso,
  reviewHistoryFile,
  reviewStateFile,
  safeReadJson,
  writeState,
} from './review-state-shared.js';
import { rebuildTopicPublicationProjection } from './review-state-projection.js';
import { getReviewState } from './review-state-surfaces.js';

function deriveArtifactGovernanceState({ previous, patch, contract }) {
  const approvalRequired = Boolean(contract?.delivery_contract?.human_gate?.required);
  const baseApproval = previous?.approval_state || defaultState({
    contract,
    topicId: previous?.topic_id || '',
    deliverableId: previous?.deliverable_id || '',
  }).approval_state;
  const basePublish = previous?.publish_state || defaultState({
    contract,
    topicId: previous?.topic_id || '',
    deliverableId: previous?.deliverable_id || '',
  }).publish_state;

  if (!approvalRequired) {
    return {
      approval_state: baseApproval,
      publish_state: basePublish,
    };
  }

  const stage = String(patch?.latest_review_stage || '').trim();
  if (!['publish_copy', 'export_bundle'].includes(stage)) {
    return {
      approval_state: baseApproval,
      publish_state: basePublish,
    };
  }

  const readyForExport = Boolean(patch?.ready_for_export);
  const pendingReviews = normalizeList(patch?.pending_reviews);
  const blocked = String(patch?.current_status || '').trim() === 'blocked_for_revision' || !readyForExport;

  if (blocked) {
    return {
      approval_state: {
        ...baseApproval,
        required: true,
        status: 'changes_requested',
        requested_at: null,
        approved_at: null,
        approved_by: null,
      },
      publish_state: {
        ...basePublish,
        current: 'draft',
        promoted_at: null,
        approved_by: null,
      },
    };
  }

  if (readyForExport && pendingReviews.length === 0) {
    return {
      approval_state: {
        ...baseApproval,
        required: true,
        status: 'pending_human',
        requested_at: baseApproval.requested_at || nowIso(),
        approved_at: null,
        approved_by: null,
      },
      publish_state: {
        ...basePublish,
        current: 'approval_pending',
        promoted_at: null,
        approved_by: null,
      },
    };
  }

  return {
    approval_state: baseApproval,
    publish_state: basePublish,
  };
}

export function isBaselineApprovedState(state) {
  if (!state) return false;
  if (state.approval_state?.required) {
    return state.approval_state.status === 'approved' || state.publish_state?.current === 'published';
  }
  return Boolean(state.ready_for_export);
}

export function persistReviewStatePatch({ workspaceRoot, topicId, deliverableId, patch, source = 'artifact' }) {
  const { deliverablePaths, contract } = loadContractAndPaths({ workspaceRoot, topicId, deliverableId });
  const file = reviewStateFile(deliverablePaths);
  const historyFile = reviewHistoryFile(deliverablePaths);
  const previous = existsSync(file)
    ? JSON.parse(readFileSync(file, 'utf-8'))
    : defaultState({ contract, topicId, deliverableId });

  const artifactGovernanceState = source === 'artifact'
    ? deriveArtifactGovernanceState({ previous, patch, contract })
    : null;

  const next = {
    ...previous,
    ...patch,
    pending_reviews: patch.pending_reviews !== undefined ? normalizeList(patch.pending_reviews) : previous.pending_reviews,
    blocking_reasons: patch.blocking_reasons !== undefined ? normalizeList(patch.blocking_reasons) : previous.blocking_reasons,
    rerun_from_stage: Object.hasOwn(patch, 'rerun_from_stage') ? patch.rerun_from_stage : previous.rerun_from_stage,
    latest_checks: patch.latest_checks ? { ...patch.latest_checks } : previous.latest_checks,
    baseline: patch.baseline ? { ...(previous.baseline || {}), ...patch.baseline } : previous.baseline,
    rerun_policy: patch.rerun_policy ? { ...(previous.rerun_policy || {}), ...patch.rerun_policy } : previous.rerun_policy,
    approval_state: patch.approval_state
      ? { ...(previous.approval_state || {}), ...patch.approval_state }
      : (artifactGovernanceState?.approval_state || previous.approval_state),
    publish_state: patch.publish_state
      ? { ...(previous.publish_state || {}), ...patch.publish_state }
      : (artifactGovernanceState?.publish_state || previous.publish_state),
    last_updated_at: nowIso(),
  };
  next.history_count = Number(previous.history_count || 0) + 1;
  if (source === 'mutation') {
    next.mutation_count = Number(previous.mutation_count || 0) + 1;
    next.last_mutation = patch.last_mutation || null;
  } else {
    next.mutation_count = Number(previous.mutation_count || 0);
  }
  writeState(file, next);
  appendHistory(historyFile, {
    timestamp: next.last_updated_at,
    source,
    patch,
  });
  const publicationStateFile = rebuildTopicPublicationProjection({ workspaceRoot, topicId });
  return {
    ok: true,
    state: next,
    quality_summary: buildQualitySummary(next),
    state_file: file,
    history_file: historyFile,
    publication_state_file: publicationStateFile,
  };
}

function requestChangesPatch(type, mutation) {
  return {
    current_status: 'blocked_for_revision',
    ready_for_export: false,
    pending_reviews: normalizeList(mutation?.issues),
    blocking_reasons: normalizeList([...(mutation?.issues || []), mutation?.notes || '']).filter(Boolean),
    rerun_from_stage: String(mutation?.rerun_from_stage || '').trim() || null,
    rerun_policy: {
      status: 'rerun_required',
      rerun_from_stage: String(mutation?.rerun_from_stage || '').trim() || null,
    },
    approval_state: {
      status: 'changes_requested',
      approved_at: null,
      approved_by: null,
    },
    publish_state: {
      current: 'draft',
      promoted_at: null,
      approved_by: null,
    },
    last_mutation: {
      type,
      actor: String(mutation?.actor || 'unknown'),
      review_stage: String(mutation?.review_stage || '').trim() || null,
      notes: String(mutation?.notes || '').trim() || null,
    },
  };
}

function bindBaselinePatch(type, mutation) {
  if (!String(mutation?.baseline_deliverable_id || '').trim()) {
    throw new Error('bind_baseline 需要 baseline_deliverable_id');
  }
  return {
    baseline: {
      baseline_deliverable_id: String(mutation?.baseline_deliverable_id || '').trim(),
      notes: String(mutation?.notes || '').trim() || null,
    },
    last_mutation: {
      type,
      actor: String(mutation?.actor || 'unknown'),
      notes: String(mutation?.notes || '').trim() || null,
    },
  };
}

function approvePublishPatch({ type, mutation, current }) {
  if (current?.current_status !== 'publish_ready') {
    throw new Error('approve_publish requires current_status === publish_ready');
  }
  if (current?.approval_state?.status !== 'pending_human') {
    throw new Error('approve_publish requires approval_state.status === pending_human');
  }
  if (!current?.ready_for_export) {
    throw new Error('approve_publish requires ready_for_export === true');
  }
  if (normalizeList(current?.pending_reviews).length > 0) {
    throw new Error('approve_publish requires pending_reviews to be empty');
  }
  return {
    current_status: 'approved_for_publish',
    approval_state: {
      status: 'approved',
      approved_at: nowIso(),
      approved_by: String(mutation?.actor || 'unknown'),
    },
    publish_state: {
      current: 'approved_pending_publish',
      approved_by: String(mutation?.actor || 'unknown'),
    },
    last_mutation: {
      type,
      actor: String(mutation?.actor || 'unknown'),
      notes: String(mutation?.notes || '').trim() || null,
    },
  };
}

function promotePublishPatch({ type, mutation, current }) {
  if (current?.approval_state?.status !== 'approved') {
    throw new Error('promote_publish requires approval_state.status === approved');
  }
  if (current?.current_status !== 'approved_for_publish') {
    throw new Error('promote_publish requires current_status === approved_for_publish');
  }
  if (current?.publish_state?.current !== 'approved_pending_publish') {
    throw new Error('promote_publish requires publish_state.current === approved_pending_publish');
  }
  return {
    current_status: 'published',
    publish_state: {
      current: 'published',
      promoted_at: nowIso(),
      approved_by: String(mutation?.actor || current?.approval_state?.approved_by || 'unknown'),
    },
    last_mutation: {
      type,
      actor: String(mutation?.actor || 'unknown'),
      notes: String(mutation?.notes || '').trim() || null,
    },
  };
}

function promoteBaselinePatch({ workspaceRoot, topicId, deliverableId, type, mutation, current }) {
  const { deliverablePaths, contract } = loadContractAndPaths({ workspaceRoot, topicId, deliverableId });
  if (!current?.ready_for_export) {
    throw new Error('promote_baseline requires ready_for_export === true');
  }
  if (current?.approval_state?.required && current?.approval_state?.status !== 'approved' && current?.publish_state?.current !== 'published') {
    throw new Error('promote_baseline requires approval_state.status === approved or publish_state.current === published');
  }
  const promotedReferenceId = String(mutation?.promoted_reference_id || '').trim();
  if (!promotedReferenceId) {
    throw new Error('promote_baseline requires promoted_reference_id');
  }
  const latestArtifactFile = String(current?.latest_review_artifact || '').trim();
  const latestArtifact = latestArtifactFile ? safeReadJson(latestArtifactFile) : null;
  const screenshotStage = Array.isArray(contract?.stage_sequence?.stages)
    ? contract.stage_sequence.stages.find((stage) => stage?.stage_id === 'screenshot_review')
    : null;
  const screenshotArtifactName = String(screenshotStage?.output_artifact || 'screenshot_review.json').trim();
  const screenshotReviewArtifact = safeReadJson(path.join(deliverablePaths.artifactsDir, screenshotArtifactName));
  const relativeQuality = latestArtifact?.baseline_review?.relative_quality
    || screenshotReviewArtifact?.baseline_review?.relative_quality
    || null;
  if (!relativeQuality || !Array.isArray(relativeQuality.dimensions) || relativeQuality.dimensions.length === 0) {
    throw new Error('promote_baseline requires structured relative_quality');
  }
  return {
    baseline: {
      ...(current?.baseline || {}),
      promotion_state: 'promoted',
      promoted_reference_id: promotedReferenceId,
      source_deliverable_id: deliverableId,
      promoted_at: nowIso(),
      promoted_by: String(mutation?.actor || 'unknown'),
      promotion_notes: String(mutation?.notes || '').trim() || null,
      relative_quality: relativeQuality,
    },
    last_mutation: {
      type,
      actor: String(mutation?.actor || 'unknown'),
      notes: String(mutation?.notes || '').trim() || null,
    },
  };
}

function buildMutationPatch({ workspaceRoot, topicId, deliverableId, type, mutation }) {
  if (type === 'request_changes') {
    return requestChangesPatch(type, mutation);
  }
  if (type === 'bind_baseline') {
    return bindBaselinePatch(type, mutation);
  }

  const current = getReviewState({ workspaceRoot, topicId, deliverableId }).state;
  if (type === 'approve_publish') {
    return approvePublishPatch({ type, mutation, current });
  }
  if (type === 'promote_publish') {
    return promotePublishPatch({ type, mutation, current });
  }
  if (type === 'promote_baseline') {
    return promoteBaselinePatch({ workspaceRoot, topicId, deliverableId, type, mutation, current });
  }
  throw new Error(`Unsupported review mutation type: ${type}`);
}

export function applyReviewMutation({ workspaceRoot, topicId, deliverableId, mutation }) {
  const type = String(mutation?.type || '').trim();
  if (!type) {
    throw new Error('mutation.type 不能为空');
  }
  return persistReviewStatePatch({
    workspaceRoot,
    topicId,
    deliverableId,
    source: 'mutation',
    patch: buildMutationPatch({ workspaceRoot, topicId, deliverableId, type, mutation }),
  });
}
