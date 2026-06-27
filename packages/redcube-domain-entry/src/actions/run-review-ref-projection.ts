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

type AnyRecord = Record<string, any>;

export const RUNTIME_WATCH_BOUNDARY = Object.freeze({
  surface_kind: 'runtime_watch_boundary',
  boundary_contract_id: 'rca.runtime_watch_refs_only_projection.v1',
  owner: 'redcube_ai',
  consumer: 'opl',
  role: 'existing_run_locator_refs_only_projection',
  classification: 'retained_current_refs_only_boundary',
  refs_only: true,
  read_only: true,
  active_caller_status: 'direct_review_watch_and_opl_operator_projection_target',
  generic_supervisor_owner: 'opl',
  generic_session_shell_owner: 'opl',
  owns_generic_supervisor: false,
  owns_generic_runner: false,
  owns_generic_attempt_ledger: false,
  owns_generic_session_runtime: false,
  owns_generic_workbench: false,
  writes_visual_truth: false,
  writes_artifact_blob: false,
  writes_memory_body: false,
  declares_visual_ready: false,
  declares_exportable: false,
  declares_handoffable: false,
  declares_production_soak_complete: false,
  compatibility_alias_allowed: false,
  no_resurrection_gate: {
    generic_supervisor_owner_allowed: false,
    generic_runtime_owner_allowed: false,
    generic_session_runtime_owner_allowed: false,
    default_supervision_route_allowed: false,
  },
  exports_only: [
    'run_status_refs',
    'artifact_locator_refs',
    'review_state_refs',
    'typed_blocker_refs',
    'operator_evidence_refs',
    'telemetry_summary_refs',
  ],
});

function resolveRun(request: AnyRecord): AnyRecord {
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

function validateResolvedRunLocator(request: AnyRecord, resolvedRun: AnyRecord): void {
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

export async function runtimeWatch(request: AnyRecord) {
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
    owner_boundary: RUNTIME_WATCH_BOUNDARY,
    source_readiness_summary: response?.source_readiness_summary || null,
    gate_summary: response?.gate_summary || null,
    lifecycle_stage_summary: response?.lifecycle_stage_summary || null,
    run_stale_audit: resolvedRun?.stale_run_audit || null,
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
      reviewState: response?.review_state as AnyRecord | null,
    }),
    metric_extensions: buildMetricExtensions({
      overlay: response?.review_state?.overlay || request?.overlay || resolvedRun?.overlay || null,
      profileId: response?.profile_id || null,
    }),
  };
}
