import { watchRuntimeReviewLoop } from '@redcube/runtime';
import {
  buildApprovalThroughputSummary,
  buildCostSummary,
  buildErrorTaxonomySummary,
  buildMetricExtensions,
  buildQualityDriftSummary,
  buildRerunAnalyticsSummary,
  buildRunTelemetrySummary,
} from './ops-eval-summary.js';

export async function runtimeWatch(request) {
  const response = await watchRuntimeReviewLoop(request);
  const runSource = {
    ...(request?.run || {}),
    telemetry: request?.run?.telemetry || null,
    error_kind: request?.run?.error_kind ?? null,
    rerun_linkage: request?.run?.rerun_linkage || null,
  };
  return {
    ...response,
    source_readiness_summary: response?.source_readiness_summary || null,
    gate_summary: response?.gate_summary || null,
    lifecycle_stage_summary: response?.lifecycle_stage_summary || null,
    run_telemetry: buildRunTelemetrySummary(runSource),
    error_taxonomy: buildErrorTaxonomySummary(runSource),
    rerun_analytics: buildRerunAnalyticsSummary(runSource),
    cost_summary: buildCostSummary(runSource),
    quality_drift_summary: buildQualityDriftSummary({
      qualitySummary: response?.quality_summary,
    }),
    approval_throughput_summary: buildApprovalThroughputSummary({
      status: response?.status,
      pendingReviews: response?.pending_reviews,
      reviewState: response?.review_state,
    }),
    metric_extensions: buildMetricExtensions({
      overlay: response?.review_state?.overlay || request?.overlay || request?.run?.overlay || null,
      profileId: response?.profile_id || null,
    }),
  };
}
