// @ts-nocheck
import {
  loadHydratedContract,
  loadPlatformReviewState,
  loadReviewArtifact,
  toFailedIssue,
  toMissingIssue,
} from './reviews-shared.js';

export function reviewRenderedDeliverable(request) {
  const contract = loadHydratedContract(request);
  const reviewArtifact = loadReviewArtifact(request, contract);
  const reviewState = loadPlatformReviewState(request)?.state || null;
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
