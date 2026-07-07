// @ts-nocheck
import { randomUUID } from 'node:crypto';

import {
  createRunRecord,
} from '../runs.js';

function computeLatencyMs(startedAt, finishedAt) {
  const startMs = Date.parse(String(startedAt || ''));
  const finishMs = Date.parse(String(finishedAt || ''));
  if (!Number.isFinite(startMs) || !Number.isFinite(finishMs)) {
    return null;
  }
  return Math.max(finishMs - startMs, 0);
}

function buildRunTelemetry(run, executor, status, finishedAt = run.finished_at) {
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

function requireRuntimeTopologyResolver(deps) {
  const resolver = deps?.resolveRuntimeTopologyForExecutor;
  if (typeof resolver !== 'function') {
    throw new Error('resolveRuntimeTopologyForExecutor is required');
  }
  return resolver;
}

function requireSafeSegment(name, value) {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  if (/[\\/]/.test(text)) {
    throw new Error(`${name} 不能包含路径分隔符`);
  }
  if (text.includes('..')) {
    throw new Error(`${name} 不能包含父目录引用`);
  }
  return text;
}

function requireStartedRun(run, surface) {
  if (run && typeof run === 'object' && !Array.isArray(run)) {
    return run;
  }
  throw new Error(`${surface} no longer reads RCA-local route-run records; pass the current run ref from the OPL-bound caller`);
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

function buildRouteRunRecordBoundary({ diagnosticOnly = false } = {}) {
  return {
    surface_kind: 'route_run_record_boundary',
    generic_attempt_ledger_owner: 'one-person-lab',
    generic_runtime_record_owner: 'one-person-lab',
    generic_event_log_owner: 'one-person-lab',
    rca_role: 'route_executor_policy_refs_only',
    record_mode: diagnosticOnly ? 'diagnostic_rejected_no_local_store' : 'opl_attempt_ledger_refs_only',
    local_record_store_retired: true,
    local_event_log_retired: true,
    rca_owns_generic_attempt_ledger: false,
    rca_owns_generic_runtime_record_store: false,
    rca_owns_generic_event_log: false,
    rca_retained_refs: [
      'route_executor_policy_refs',
      'executor_receipt_refs',
      'typed_blocker_refs',
      'no_forbidden_write_refs',
    ],
  };
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
  if (!hasOplRouteAttemptEvidence(normalizedCrossProviderAttemptIndex)) {
    throw new Error('startRouteRun requires OPL-owned stage attempt evidence; RCA-local diagnostic route-run records are retired');
  }
  const run = {
    ...createRunRecord({
      runId: resolvedRunId,
      route,
      scope,
      target,
      overlay,
      topicId,
      deliverableId,
      rerunCount: 0,
      previousRunId: null,
      sourceStage: null,
      baselineDeliverableId,
    }),
    started_at: new Date().toISOString(),
    current_stage: route,
    runtime_topology: resolveRuntimeTopologyForExecutor(executor),
    route_run_record_boundary: buildRouteRunRecordBoundary({
      diagnosticOnly: !hasOplRouteAttemptEvidence(normalizedCrossProviderAttemptIndex),
    }),
    executor,
    ...(normalizedCrossProviderAttemptIndex ? {
      cross_provider_attempt_index: normalizedCrossProviderAttemptIndex,
    } : {}),
  };
  run.telemetry = buildRunTelemetry(run, executor, 'running', null);

  return run;
}

export function completeRouteRun({
  workspaceRoot,
  runId,
  run: startedRun = null,
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
  const run = requireStartedRun(startedRun, 'completeRouteRun');
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

  return completedRun;
}

export function failRouteRun({
  workspaceRoot,
  runId,
  run: startedRun = null,
  currentStage,
  error,
  errorKind = 'execution_error',
  executor,
  telemetry = {},
  status = 'failed',
}, deps = {}) {
  const resolveRuntimeTopologyForExecutor = requireRuntimeTopologyResolver(deps);
  const run = requireStartedRun(startedRun, 'failRouteRun');
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

  return failedRun;
}

export function loadRouteRun({ workspaceRoot, runId }) {
  requireSafeSegment('runId', runId);
  throw new Error('RCA-local route-run record store is retired; use OPL stage attempt and provider ledger refs');
  return createRunRecord({
    runId,
    route: 'retired_route_run_record_store',
    scope: 'route',
    target: 'retired_route_run_record_store',
    overlay: 'redcube_ai',
  });
}

export function appendRouteRunEvent(workspaceRoot, runId, event) {
  requireSafeSegment('runId', runId);
  return {
    surface_kind: 'route_run_event_ref',
    run_id: String(runId || '').trim(),
    event,
    event_log_owner: 'one-person-lab',
    local_event_log_written: false,
  };
}

export function readRouteRunEvents(workspaceRoot, runId) {
  requireSafeSegment('runId', runId);
  return [];
}
