// @ts-nocheck
import { buildGovernanceSurface } from './governance-surface.js';
import { buildReviewGateSummary } from './reviews-gate-summary.js';
import {
  loadHydratedContract,
  loadPlatformReviewState,
  loadSourceReadinessSummary,
  loadTopicPublicationProjection,
} from './reviews-shared.js';

function normalizePendingReviews(run) {
  return Array.isArray(run?.pending_reviews)
    ? run.pending_reviews.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function buildRuntimeWatchQualitySummary(reviewState) {
  const relativeQuality = reviewState?.baseline?.relative_quality || null;
  return {
    relative_quality_verdict: relativeQuality?.verdict || null,
    degradations: Array.isArray(relativeQuality?.degradations) ? relativeQuality.degradations : [],
    improvements: Array.isArray(relativeQuality?.improvements) ? relativeQuality.improvements : [],
    acceptable_changes: Array.isArray(relativeQuality?.acceptable_changes) ? relativeQuality.acceptable_changes : [],
    baseline_promotion_state: reviewState?.baseline?.promotion_state || null,
    promoted_reference_id: reviewState?.baseline?.promoted_reference_id || null,
  };
}

function resolveWatchStatus({ run, reviewState, pendingReviews }) {
  if (reviewState?.pending_reviews?.length > 0) {
    return 'review_pending';
  }
  return pendingReviews.length > 0
    ? 'review_pending'
    : String(run?.status || reviewState?.current_status || 'idle');
}

export function watchRuntimeReviewLoop(request) {
  const run = request?.run || {};
  const pendingReviews = normalizePendingReviews(run);
  const contract = loadHydratedContract(request);
  const reviewResponse = loadPlatformReviewState(request);
  const reviewState = reviewResponse?.state || null;
  const governanceSurface = reviewResponse?.governance_surface || (contract ? buildGovernanceSurface(contract) : null);
  const sourceReadinessSummary = reviewResponse?.source_readiness_summary || loadSourceReadinessSummary(request);
  const publicationProjection = request?.workspaceRoot && request?.topicId
    ? loadTopicPublicationProjection(request)
    : null;
  const publicationProjectionEntry = publicationProjection?.deliverables?.[request?.deliverableId] || null;
  const operatorHandoff = reviewResponse?.operator_handoff || publicationProjectionEntry?.operator_handoff || null;
  const lifecycleStageSummary = reviewResponse?.lifecycle_stage_summary || publicationProjectionEntry?.lifecycle_stage_summary || null;

  return {
    ok: true,
    surface_kind: 'runtime_watch',
    run_id: String(run?.run_id || '').trim(),
    current_stage: String(run?.current_stage || '').trim() || null,
    status: resolveWatchStatus({ run, reviewState, pendingReviews }),
    pending_reviews: reviewState?.pending_reviews || pendingReviews,
    review_state: reviewState,
    quality_summary: buildRuntimeWatchQualitySummary(reviewState),
    publication_projection: publicationProjection,
    source_readiness_summary: sourceReadinessSummary,
    gate_summary: reviewResponse?.gate_summary || publicationProjectionEntry?.gate_summary || buildReviewGateSummary({
      sourceReadinessSummary,
      reviewState,
      contract,
      publicationProjectionEntry,
      operatorHandoff,
    }),
    operator_handoff: operatorHandoff,
    lifecycle_stage_summary: lifecycleStageSummary,
    governance_surface: governanceSurface,
    resumable: Boolean(run?.resumable),
    profile_id: String(contract?.profile_id || '').trim() || null,
    delivery_contract: contract?.delivery_contract || null,
    required_export_bundle: contract?.export_bundle || null,
  };
}
