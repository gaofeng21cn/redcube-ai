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

import type { RunRecordResponse, WorkspaceRootRequest } from '../types.js';
import type { RuntimeRunRecord } from '@redcube/runtime';

type RuntimeRecordSurface = RuntimeRunRecord & {
  pending_reviews?: unknown;
};

const summarizeRunTelemetry = buildRunTelemetrySummary as (source: unknown) => RunRecordResponse['run_telemetry'];
const summarizeErrorTaxonomy = buildErrorTaxonomySummary as (source: unknown) => RunRecordResponse['error_taxonomy'];
const summarizeRerunAnalytics = buildRerunAnalyticsSummary as (source: unknown) => RunRecordResponse['rerun_analytics'];
const summarizeCost = buildCostSummary as (source: unknown) => RunRecordResponse['cost_summary'];
const summarizeQualityDrift = buildQualityDriftSummary as (source?: unknown) => RunRecordResponse['quality_drift_summary'];
const summarizeApprovalThroughput = buildApprovalThroughputSummary as (
  source: Record<string, unknown>,
) => RunRecordResponse['approval_throughput_summary'];
const summarizeMetricExtensions = buildMetricExtensions as (
  source: Record<string, unknown>,
) => RunRecordResponse['metric_extensions'];

export async function getRun({
  workspaceRoot,
  runId,
}: WorkspaceRootRequest & { runId: string }): Promise<RunRecordResponse> {
  const run = loadRun({ workspaceRoot, runId }) as RuntimeRecordSurface;
  const staleStatus = run.status === 'expired' || run.status === 'orphaned';
  const recommendedAction = staleStatus
    ? 'inspect_stale_run'
    : run.status === 'quality_blocked'
      ? 'run_recommended_repair'
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
    run: run as unknown as Record<string, unknown>,
    run_telemetry: summarizeRunTelemetry(run),
    error_taxonomy: summarizeErrorTaxonomy(run),
    rerun_analytics: summarizeRerunAnalytics(run),
    cost_summary: summarizeCost(run),
    quality_drift_summary: summarizeQualityDrift(),
    approval_throughput_summary: summarizeApprovalThroughput({
      status: run.status,
      pendingReviews: run.pending_reviews,
    }),
    metric_extensions: summarizeMetricExtensions({
      overlay: run.overlay,
    }),
  };
}
