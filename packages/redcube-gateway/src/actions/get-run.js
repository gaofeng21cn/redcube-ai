import { loadRun } from '@redcube/runtime';
import {
  buildApprovalThroughputSummary,
  buildCostSummary,
  buildErrorTaxonomySummary,
  buildMetricExtensions,
  buildQualityDriftSummary,
  buildRerunAnalyticsSummary,
  buildRunTelemetrySummary,
} from './ops-eval-summary.js';

export async function getRun({ workspaceRoot, runId }) {
  const run = loadRun({ workspaceRoot, runId });
  const staleStatus = run.status === 'expired' || run.status === 'orphaned';
  const recommendedAction = staleStatus
    ? 'inspect_stale_run'
    : run.status === 'failed'
    ? 'inspect_run_failure'
    : (run.status === 'completed' ? 'review_runtime_state' : 'continue');
  return {
    ok: true,
    surface_kind: 'run_record',
    recommended_action: recommendedAction,
    summary: {
      run_id: run.run_id,
      status: run.status,
      current_stage: run.current_stage,
    },
    run,
    run_telemetry: buildRunTelemetrySummary(run),
    error_taxonomy: buildErrorTaxonomySummary(run),
    rerun_analytics: buildRerunAnalyticsSummary(run),
    cost_summary: buildCostSummary(run),
    quality_drift_summary: buildQualityDriftSummary(),
    approval_throughput_summary: buildApprovalThroughputSummary({
      status: run.status,
      pendingReviews: run?.pending_reviews,
    }),
    metric_extensions: buildMetricExtensions({
      overlay: run?.overlay,
    }),
  };
}
