// @ts-nocheck
import { randomUUID } from 'node:crypto';

import {
  createRunRecord,
} from '../runs.js';
import {
  appendRouteRunEventRecord,
  loadRouteRunRecord,
  readRouteRunEventRecords,
  readStoredRouteRuns,
  writeRouteRunRecord,
} from './route-run-record-store.js';

export const RUNNING_RUN_STALE_TTL_MS = 2 * 60 * 60 * 1000;

function computeLatencyMs(startedAt, finishedAt) {
  const startMs = Date.parse(String(startedAt || ''));
  const finishMs = Date.parse(String(finishedAt || ''));
  if (!Number.isFinite(startMs) || !Number.isFinite(finishMs)) {
    return null;
  }
  return Math.max(finishMs - startMs, 0);
}

function runningRunStaleAudit(run, now = new Date()) {
  if (String(run?.status || '').trim() !== 'running') {
    return null;
  }
  const checkedAt = now.toISOString();
  const startedAt = String(run?.started_at || '').trim();
  const startedMs = Date.parse(startedAt);
  if (!Number.isFinite(startedMs)) {
    return {
      status_after: 'orphaned',
      reason_code: 'running_run_missing_started_at',
      age_ms: null,
      marked_at: checkedAt,
    };
  }
  const ageMs = Math.max(now.getTime() - startedMs, 0);
  if (ageMs <= RUNNING_RUN_STALE_TTL_MS) {
    return null;
  }
  return {
    status_after: 'expired',
    reason_code: 'running_run_exceeded_stale_ttl',
    age_ms: ageMs,
    marked_at: checkedAt,
  };
}

function findPriorRuns({ workspaceRoot, route, scope, target, overlay }) {
  return readStoredRouteRuns(workspaceRoot)
    .filter((run) => run?.route === route
      && run?.scope === scope
      && run?.target === target
      && run?.overlay === overlay)
    .sort((left, right) => {
      const leftTime = Date.parse(left?.started_at || '') || 0;
      const rightTime = Date.parse(right?.started_at || '') || 0;
      return leftTime - rightTime;
    });
}

export function buildRunTelemetry(run, executor, status, finishedAt = run.finished_at) {
  return {
    ...(run?.telemetry || {}),
    run_id: run.run_id,
    route: run.route,
    scope: run.scope,
    target: run.target,
    overlay: run.overlay,
    executor_kind: String(
      executor?.adapter
      || run?.telemetry?.executor_kind
      || '',
    ).trim() || null,
    execution_surface: String(
      executor?.execution_surface
      || run?.telemetry?.execution_surface
      || '',
    ).trim() || null,
    status,
    started_at: run.started_at || null,
    finished_at: finishedAt || null,
    latency_ms: computeLatencyMs(run.started_at, finishedAt),
    prompt_tokens: run?.telemetry?.prompt_tokens ?? null,
    completion_tokens: run?.telemetry?.completion_tokens ?? null,
    estimated_cost: run?.telemetry?.estimated_cost ?? null,
  };
}

function normalizeError(error) {
  if (error && typeof error === 'object') {
    return {
      code: String(error.code || '').trim() || null,
      message: error instanceof Error ? error.message : String(error.message || error),
      failure_kind: String(error.failure_kind || error.failureKind || '').trim() || null,
      target_slide_ids: Array.isArray(error.target_slide_ids) ? error.target_slide_ids : [],
      blocking_reasons: Array.isArray(error.blocking_reasons) ? error.blocking_reasons : [],
      recommended_action: String(error.recommended_action || '').trim() || null,
      artifact_file: String(error.artifact_file || '').trim() || null,
      artifact_refs: Array.isArray(error.artifact_refs)
        ? Array.from(new Set(error.artifact_refs.map((ref) => String(ref || '').trim()).filter(Boolean))).sort()
        : [],
      requires_human_confirmation: error.requiresHumanConfirmation === true,
      requires_external_secret: error.requiresExternalSecret === true,
      stall_lineage: error.stall_lineage || null,
    };
  }
  return {
    code: null,
    message: error instanceof Error ? error.message : String(error),
    failure_kind: null,
    target_slide_ids: [],
    blocking_reasons: [],
    recommended_action: null,
    artifact_file: null,
    artifact_refs: [],
    requires_human_confirmation: false,
    requires_external_secret: false,
  };
}

function markStaleRunningRunIfNeeded({ workspaceRoot, runId, checkedSurface = 'loadRun' }) {
  const run = loadRouteRunRecord({ workspaceRoot, runId });
  const staleAudit = runningRunStaleAudit(run);
  if (!staleAudit) {
    return run;
  }
  const markedRun = {
    ...run,
    status: staleAudit.status_after,
    finished_at: run.finished_at || staleAudit.marked_at,
    error_kind: run.error_kind || 'execution_error',
    error: run.error || {
      code: staleAudit.status_after,
      message: staleAudit.status_after === 'expired'
        ? 'Running run exceeded stale TTL and was marked expired on read'
        : 'Running run has no valid start timestamp and was marked orphaned on read',
    },
    stale_run_audit: {
      schema_version: 1,
      audit_contract: 'redcube_stale_running_run.v1',
      marked_at: staleAudit.marked_at,
      marked_by: 'redcube_runtime_run_reader',
      checked_surface: checkedSurface,
      status_before: 'running',
      status_after: staleAudit.status_after,
      reason_code: staleAudit.reason_code,
      run_id: run.run_id,
      route: run.route,
      overlay: run.overlay,
      topic_id: run.topic_id || null,
      deliverable_id: run.deliverable_id || null,
      started_at: run.started_at || null,
      stale_after_ms: RUNNING_RUN_STALE_TTL_MS,
      age_ms: staleAudit.age_ms,
    },
  };
  markedRun.telemetry = buildRunTelemetry(
    markedRun,
    markedRun?.executor,
    markedRun.status,
    markedRun.finished_at,
  );
  return writeRouteRunRecord({ workspaceRoot, runId, run: markedRun });
}

function requireRuntimeTopologyResolver(deps) {
  const resolver = deps?.resolveRuntimeTopologyForExecutor;
  if (typeof resolver !== 'function') {
    throw new Error('resolveRuntimeTopologyForExecutor is required');
  }
  return resolver;
}

function normalizeCrossProviderAttemptIndex(index, routeRunRef) {
  if (!index || typeof index !== 'object' || Array.isArray(index)) {
    return null;
  }
  return {
    ...index,
    local_session_ref: String(index.local_session_ref || routeRunRef).trim() || routeRunRef,
    local_route_run_ref: String(index.local_route_run_ref || routeRunRef).trim() || routeRunRef,
  };
}

function hasOplRouteAttemptEvidence(index) {
  if (!index || typeof index !== 'object' || Array.isArray(index)) return false;
  const owner = String(index.provider_attempt_owner || index.providerAttemptOwner || index.owner || '').trim();
  const providerAttemptRef = String(index.provider_attempt_ref || index.providerAttemptRef || '').trim();
  const providerAttemptLedgerRef = String(index.provider_attempt_ledger_ref || index.providerAttemptLedgerRef || '').trim();
  const stageAttemptRef = String(index.stage_attempt_ref || index.stageAttemptRef || index.opl_stage_attempt_ref || index.oplStageAttemptRef || '').trim();
  const attemptLeaseRef = String(index.attempt_lease_ref || index.attemptLeaseRef || index.lease_ref || index.leaseRef || '').trim();
  const attemptReceiptRef = String(index.attempt_receipt_ref || index.attemptReceiptRef || index.closeout_receipt_ref || index.closeoutReceiptRef || '').trim();
  return owner === 'one-person-lab'
    && providerAttemptRef
    && providerAttemptLedgerRef
    && (stageAttemptRef || attemptLeaseRef || attemptReceiptRef);
}

export function startRouteRun({
  workspaceRoot,
  runId = null,
  route,
  overlay,
  scope = 'deliverable',
  target,
  topicId = null,
  deliverableId = null,
  baselineDeliverableId = '',
  executor,
  crossProviderAttemptIndex = null,
  allowLocalDiagnosticRecord = false,
}, deps = {}) {
  const resolveRuntimeTopologyForExecutor = requireRuntimeTopologyResolver(deps);
  const resolvedRunId = String(runId || '').trim() || `run-${randomUUID()}`;
  const resolvedRouteRunRef = `route-run:${resolvedRunId}`;
  const normalizedCrossProviderAttemptIndex = normalizeCrossProviderAttemptIndex(
    crossProviderAttemptIndex,
    resolvedRouteRunRef,
  );
  if (!hasOplRouteAttemptEvidence(normalizedCrossProviderAttemptIndex) && allowLocalDiagnosticRecord !== true) {
    throw new Error('startRouteRun requires OPL-owned stage attempt evidence; set allowLocalDiagnosticRecord only for explicit refs-only diagnostics');
  }
  const priorRuns = findPriorRuns({
    workspaceRoot,
    route,
    scope,
    target,
    overlay,
  });
  const run = {
    ...createRunRecord({
      runId: resolvedRunId,
      route,
      scope,
      target,
      overlay,
      topicId,
      deliverableId,
      rerunCount: priorRuns.length,
      previousRunId: priorRuns.at(-1)?.run_id || null,
      sourceStage: priorRuns.at(-1)?.current_stage || null,
      baselineDeliverableId,
    }),
    started_at: new Date().toISOString(),
    current_stage: route,
    runtime_topology: resolveRuntimeTopologyForExecutor(executor),
    executor,
    ...(normalizedCrossProviderAttemptIndex ? {
      cross_provider_attempt_index: normalizedCrossProviderAttemptIndex,
    } : {}),
  };
  run.telemetry = buildRunTelemetry(run, executor, 'running', null);

  return writeRouteRunRecord({ workspaceRoot, runId: resolvedRunId, run });
}

export function completeRouteRun({
  workspaceRoot,
  runId,
  currentStage,
  stageResults,
  artifactRefs,
  executor,
  telemetry = {},
  status = 'completed',
  errorKind = null,
  crossProviderAttemptIndex = null,
}, deps = {}) {
  const resolveRuntimeTopologyForExecutor = requireRuntimeTopologyResolver(deps);
  const run = loadRouteRunRecord({ workspaceRoot, runId });
  const runStatus = String(status || '').trim() || 'completed';
  const completedRun = {
    ...run,
    status: runStatus,
    finished_at: new Date().toISOString(),
    current_stage: currentStage,
    stage_results: stageResults,
    artifact_refs: artifactRefs,
    error_kind: errorKind,
    runtime_topology: resolveRuntimeTopologyForExecutor(executor || run?.executor),
    executor: executor || run?.executor,
    telemetry: {
      ...(run?.telemetry || {}),
      ...(telemetry && typeof telemetry === 'object' ? telemetry : {}),
    },
    ...(crossProviderAttemptIndex && typeof crossProviderAttemptIndex === 'object' && !Array.isArray(crossProviderAttemptIndex)
      ? {
          cross_provider_attempt_index: {
            ...(run?.cross_provider_attempt_index || {}),
            ...crossProviderAttemptIndex,
            local_session_ref: crossProviderAttemptIndex.local_session_ref
              || run?.cross_provider_attempt_index?.local_session_ref
              || `route-run:${runId}`,
            local_route_run_ref: crossProviderAttemptIndex.local_route_run_ref
              || run?.cross_provider_attempt_index?.local_route_run_ref
              || `route-run:${runId}`,
            provider_attempt_ref: crossProviderAttemptIndex.provider_attempt_ref
              || run?.cross_provider_attempt_index?.provider_attempt_ref,
            provider_attempt_ledger_ref: crossProviderAttemptIndex.provider_attempt_ledger_ref
              || run?.cross_provider_attempt_index?.provider_attempt_ledger_ref,
          },
        }
      : {}),
  };
  completedRun.telemetry = buildRunTelemetry(
    completedRun,
    executor || run?.executor,
    runStatus,
    completedRun.finished_at,
  );

  return writeRouteRunRecord({ workspaceRoot, runId, run: completedRun });
}

export function failRouteRun({
  workspaceRoot,
  runId,
  currentStage,
  error,
  errorKind = 'execution_error',
  executor,
  telemetry = {},
  status = 'failed',
}, deps = {}) {
  const resolveRuntimeTopologyForExecutor = requireRuntimeTopologyResolver(deps);
  const run = loadRouteRunRecord({ workspaceRoot, runId });
  const runStatus = String(status || '').trim() || 'failed';
  const failedRun = {
    ...run,
    status: runStatus,
    finished_at: new Date().toISOString(),
    current_stage: currentStage,
    artifact_refs: Array.isArray(error?.artifact_refs)
      ? Array.from(new Set(error.artifact_refs.map((ref) => String(ref || '').trim()).filter(Boolean))).sort()
      : (Array.isArray(run?.artifact_refs) ? run.artifact_refs : []),
    error_kind: errorKind,
    runtime_topology: resolveRuntimeTopologyForExecutor(executor || run?.executor),
    executor: executor || run?.executor,
    error: normalizeError(error),
    stall_lineage: error?.stall_lineage || null,
    telemetry: {
      ...(run?.telemetry || {}),
      ...(telemetry && typeof telemetry === 'object' ? telemetry : {}),
    },
  };
  failedRun.telemetry = buildRunTelemetry(
    failedRun,
    executor || run?.executor,
    runStatus,
    failedRun.finished_at,
  );

  return writeRouteRunRecord({ workspaceRoot, runId, run: failedRun });
}

export function loadRouteRun({ workspaceRoot, runId }) {
  return markStaleRunningRunIfNeeded({ workspaceRoot, runId });
}

export function appendRouteRunEvent(workspaceRoot, runId, event) {
  appendRouteRunEventRecord({ workspaceRoot, runId, event });
}

export function readRouteRunEvents(workspaceRoot, runId) {
  return readRouteRunEventRecords({ workspaceRoot, runId });
}
