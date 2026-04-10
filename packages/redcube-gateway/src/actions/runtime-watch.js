import { loadRun, watchRuntimeReviewLoop } from '@redcube/runtime';
import {
  buildApprovalThroughputSummary,
  buildCostSummary,
  buildErrorTaxonomySummary,
  buildMetricExtensions,
  buildQualityDriftSummary,
  buildRerunAnalyticsSummary,
  buildRunTelemetrySummary,
} from './ops-eval-summary.js';

function resolveRun(request) {
  const providedRun = request?.run && typeof request.run === 'object' ? request.run : null;
  const providedRunId = String(request?.runId || '').trim();
  const runRecordId = String(providedRun?.run_id || '').trim();

  if (providedRun && providedRunId && runRecordId && runRecordId !== providedRunId) {
    throw new Error('runtimeWatch runId 与 run.run_id 不一致');
  }

  if (providedRun) {
    return providedRun;
  }

  if (request?.workspaceRoot && providedRunId) {
    return loadRun({
      workspaceRoot: request.workspaceRoot,
      runId: providedRunId,
    });
  }

  return {};
}

function validateResolvedRunLocator(request, resolvedRun) {
  const workspaceRoot = String(request?.workspaceRoot || '').trim();
  const topicId = String(request?.topicId || '').trim();
  const deliverableId = String(request?.deliverableId || '').trim();
  const hasExplicitRun = Boolean(
    String(request?.runId || '').trim()
    || (request?.run && typeof request.run === 'object'),
  );

  if (!workspaceRoot || !topicId || !deliverableId || !hasExplicitRun) {
    return;
  }

  const runTopicId = String(resolvedRun?.topic_id || '').trim();
  const runDeliverableId = String(resolvedRun?.deliverable_id || '').trim();

  if (!runTopicId || !runDeliverableId) {
    throw new Error('runtimeWatch run.topic_id 与 run.deliverable_id 不能为空');
  }

  if (runTopicId !== topicId) {
    throw new Error('runtimeWatch topicId 与 run.topic_id 不一致');
  }

  if (runDeliverableId !== deliverableId) {
    throw new Error('runtimeWatch deliverableId 与 run.deliverable_id 不一致');
  }
}

export async function runtimeWatch(request) {
  const resolvedRun = resolveRun(request);
  validateResolvedRunLocator(request, resolvedRun);
  const response = await watchRuntimeReviewLoop({
    ...request,
    run: resolvedRun,
  });
  const runSource = {
    ...resolvedRun,
    telemetry: resolvedRun?.telemetry || null,
    error_kind: resolvedRun?.error_kind ?? null,
    rerun_linkage: resolvedRun?.rerun_linkage || null,
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
      overlay: response?.review_state?.overlay || request?.overlay || resolvedRun?.overlay || null,
      profileId: response?.profile_id || null,
    }),
  };
}
