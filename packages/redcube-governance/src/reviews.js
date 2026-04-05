import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import { getDeliverablePaths } from '@redcube/runtime-protocol';
import { getPublicationProjection as loadPublicationProjection, getReviewState as loadReviewState } from './review-state.js';

function loadHydratedContract({ workspaceRoot, topicId, deliverableId }) {
  if (!workspaceRoot || !topicId || !deliverableId) {
    return null;
  }

  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const deliverable = JSON.parse(readFileSync(deliverablePaths.deliverableFile, 'utf-8'));
  const contractRef = String(
    deliverable?.hydrated_contract_ref || 'contracts/hydrated-deliverable.json',
  ).trim();
  return JSON.parse(
    readFileSync(path.join(deliverablePaths.deliverableDir, contractRef), 'utf-8'),
  );
}


function loadPlatformReviewState(request) {
  if (!request?.workspaceRoot || !request?.topicId || !request?.deliverableId) return null;
  try {
    return loadReviewState(request).state;
  } catch {
    return null;
  }
}

function loadReviewArtifact(request, contract) {
  if (!request?.workspaceRoot || !request?.topicId || !request?.deliverableId || !contract) {
    return null;
  }
  const deliverablePaths = getDeliverablePaths(
    request.workspaceRoot,
    request.topicId,
    request.deliverableId,
  );
  const reviewFile = path.join(
    deliverablePaths.artifactsDir,
    String(contract?.review_surface?.artifact_file || 'quality_gate.json').trim(),
  );
  if (!existsSync(reviewFile)) {
    return null;
  }
  return JSON.parse(readFileSync(reviewFile, 'utf-8'));
}

function toMissingIssue(check) {
  if (check === 'visual_density_ok') {
    return 'visual_density_check_missing';
  }
  return `${check}_missing`;
}

function toFailedIssue(check) {
  if (check === 'visual_density_ok') {
    return 'visual_density_too_high';
  }
  return `${check}_failed`;
}

export function auditDeliverableRequest({ mode, baselineDeliverableId }) {
  if (mode === 'optimize_existing' && !String(baselineDeliverableId || '').trim()) {
    return {
      status: 'block',
      issues: ['baseline_missing'],
      rerun_from_stage: 'intake',
      recommended_action: 'bind_baseline_deliverable',
    };
  }

  return {
    status: 'pass',
    issues: [],
    rerun_from_stage: null,
    recommended_action: 'continue',
  };
}

export function reviewRenderedDeliverable(request) {
  const contract = loadHydratedContract(request);
  const reviewArtifact = loadReviewArtifact(request, contract);
  const reviewState = loadPlatformReviewState(request);
  const suppliedChecks = request?.checks && typeof request.checks === 'object'
    ? request.checks
    : null;
  const checks = suppliedChecks || reviewState?.latest_checks || reviewArtifact?.checks || {};
  const reviewSurface = contract?.review_surface || null;
  const baseChecks = Array.isArray(reviewSurface?.required_checks)
    ? reviewSurface.required_checks
    : ['visual_density_ok'];
  const conditionalChecks = Array.isArray(reviewSurface?.conditional_checks?.[request?.mode])
    ? reviewSurface.conditional_checks[request.mode]
    : [];
  const requiredChecks = [...baseChecks, ...conditionalChecks];
  if (!suppliedChecks && reviewState?.pending_reviews?.length > 0) {
    return {
      status: 'block',
      issues: reviewState.pending_reviews,
      rerun_from_stage: reviewState.rerun_from_stage || null,
      recommended_action: 'revise_render_output',
    };
  }
  const rerunFromStage = reviewSurface?.rerun_from_stage || {
    visual_density_ok: 'visual_direction',
  };

  const missingChecks = requiredChecks.filter(
    (check) => !Object.hasOwn(checks, check),
  );
  if (missingChecks.length > 0) {
    const firstMissing = missingChecks[0];
    return {
      status: 'block',
      issues: missingChecks.map((check) => toMissingIssue(check)),
      rerun_from_stage:
        firstMissing === 'visual_density_ok'
          ? 'render_review'
          : rerunFromStage[firstMissing] || 'render_review',
      recommended_action: 'supply_render_checks',
    };
  }

  const failedChecks = requiredChecks.filter((check) => checks[check] === false);
  if (failedChecks.length > 0) {
    const firstFailed = failedChecks[0];
    return {
      status: 'block',
      issues: failedChecks.map((check) => toFailedIssue(check)),
      rerun_from_stage: rerunFromStage[firstFailed] || 'render_review',
      recommended_action:
        firstFailed === 'visual_density_ok'
          ? 'revise_visual_direction'
          : 'revise_render_output',
    };
  }

  return {
    status: (reviewState?.current_status === 'publish_ready' || reviewState?.current_status === 'export_ready') ? 'pass' : (reviewArtifact?.status || 'pass'),
    issues: [],
    rerun_from_stage: null,
    recommended_action: 'continue',
  };
}

export function watchRuntimeReviewLoop(request) {
  const run = request?.run || {};
  const pendingReviews = Array.isArray(run?.pending_reviews)
    ? run.pending_reviews.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const contract = loadHydratedContract(request);
  const reviewState = loadPlatformReviewState(request);
  const publicationProjection = request?.workspaceRoot && request?.topicId
    ? loadPublicationProjection({ workspaceRoot: request.workspaceRoot, topicId: request.topicId }).publication
    : null;
  const relativeQuality = reviewState?.baseline?.relative_quality || null;

  return {
    ok: true,
    surface_kind: 'runtime_watch',
    run_id: String(run?.run_id || '').trim(),
    current_stage: String(run?.current_stage || '').trim() || null,
    status: reviewState?.pending_reviews?.length > 0 ? 'review_pending' : (pendingReviews.length > 0 ? 'review_pending' : String(run?.status || reviewState?.current_status || 'idle')),
    pending_reviews: reviewState?.pending_reviews || pendingReviews,
    review_state: reviewState,
    quality_summary: {
      relative_quality_verdict: relativeQuality?.verdict || null,
      degradations: Array.isArray(relativeQuality?.degradations) ? relativeQuality.degradations : [],
      improvements: Array.isArray(relativeQuality?.improvements) ? relativeQuality.improvements : [],
      acceptable_changes: Array.isArray(relativeQuality?.acceptable_changes) ? relativeQuality.acceptable_changes : [],
      baseline_promotion_state: reviewState?.baseline?.promotion_state || null,
      promoted_reference_id: reviewState?.baseline?.promoted_reference_id || null,
    },
    publication_projection: publicationProjection,
    resumable: Boolean(run?.resumable),
    profile_id: String(contract?.profile_id || '').trim() || null,
    required_export_bundle: contract?.export_bundle || null,
  };
}
