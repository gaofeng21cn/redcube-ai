// @ts-nocheck
import path from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

import {
  AGENT_LOOP_EXECUTION_SHAPE,
  CODEX_DEFAULT_ADAPTER,
  HERMES_AGENT_EXECUTOR_BACKEND,
  HERMES_AGENT_ADAPTER,
  STRUCTURED_CALL_EXECUTION_SHAPE,
  buildCodexRuntimeTopology,
  failRetiredHermesAgentAdapter,
  hermesAgentAdapterRetirementBoundary,
} from '@redcube/runtime-protocol';

import { readCodexCliContract } from './executors/codex-caller.js';
import { resolveExecutorRouting } from '@redcube/redcube-config';
import { createRunRecord, getDeliverablePaths } from '@redcube/runtime-protocol';
import { runCandidateRaceRoute } from './candidate-racing.js';
import {
  executeDeliverableRouteLocally,
  refreshStageFolderRouteArtifact,
  validateDeliverableRouteInput,
} from './deliverable-route-local.js';
import { resolveExecutorAdapter } from './executors/index.js';

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

function normalizeRouteRunError(error) {
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

function buildRouteExecutionRefBoundary() {
  return {
    surface_kind: 'route_execution_ref_boundary',
    generic_attempt_ledger_owner: 'one-person-lab',
    generic_runtime_record_owner: 'one-person-lab',
    generic_event_log_owner: 'one-person-lab',
    rca_role: 'route_executor_policy_and_receipt_refs_only',
    record_mode: 'opl_attempt_ledger_refs_only',
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

function runtimeTopologyForExecutor(executor) {
  if (executor?.runtime_topology) {
    return executor.runtime_topology;
  }
  if (
    executor?.adapter === CODEX_DEFAULT_ADAPTER
    || executor?.executor_backend === CODEX_DEFAULT_ADAPTER
    || executor?.execution_surface === 'codex_cli_runtime'
  ) {
    return buildCodexRuntimeTopology();
  }
  return null;
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

function startRouteExecutionRef({
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
}) {
  const resolvedRunId = String(runId || '').trim() || `run-${randomUUID()}`;
  const routeRunRef = `route-run:${resolvedRunId}`;
  const normalizedCrossProviderAttemptIndex = normalizeCrossProviderAttemptIndex(
    crossProviderAttemptIndex,
    routeRunRef,
  );
  if (!hasOplRouteAttemptEvidence(normalizedCrossProviderAttemptIndex)) {
    throw new Error('startRouteExecutionRef requires OPL-owned stage attempt evidence; RCA-local diagnostic route-run records are retired');
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
    runtime_topology: runtimeTopologyForExecutor(executor),
    route_execution_ref_boundary: buildRouteExecutionRefBoundary(),
    executor,
    ...(normalizedCrossProviderAttemptIndex ? {
      cross_provider_attempt_index: normalizedCrossProviderAttemptIndex,
    } : {}),
  };
  run.telemetry = buildRunTelemetry(run, executor, 'running', null);
  return run;
}

function completeRouteExecutionRef({
  runId,
  run,
  currentStage,
  stageResults,
  artifactRefs,
  executor,
  telemetry = {},
  status = 'completed',
  errorKind = null,
  crossProviderAttemptIndex = null,
}) {
  const runStatus = String(status || '').trim() || 'completed';
  const completedRun = {
    ...run,
    status: runStatus,
    finished_at: new Date().toISOString(),
    current_stage: currentStage,
    stage_results: stageResults,
    artifact_refs: artifactRefs,
    error_kind: errorKind,
    runtime_topology: runtimeTopologyForExecutor(executor || run?.executor),
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

function failRouteExecutionRef({
  run,
  currentStage,
  error,
  errorKind = 'execution_error',
  executor,
  telemetry = {},
  status = 'failed',
}) {
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
    runtime_topology: runtimeTopologyForExecutor(executor || run?.executor),
    executor: executor || run?.executor,
    error: normalizeRouteRunError(error),
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

function buildCodexRuntimeDescriptor(codexContract) {
  return {
    owner: 'codex_cli',
    adapter_surface: 'opl_codex_executor',
    model_selection: codexContract.model_selection,
    reasoning_selection: codexContract.reasoning_selection,
    sandbox: codexContract.sandbox,
    command: [...codexContract.command],
  };
}

function buildHermesAgentLoopRuntimeDescriptor(hermesContract = {}) {
  const defaultOplExecutorAdapterReceipt = {
    source: 'opl_executor_adapter_receipt',
    owner: 'opl_runtime_manager',
    hosted_adapter_reference: 'opl_hosted:hermes_agent_loop',
    adapter: HERMES_AGENT_ADAPTER,
    selected_executor_backend: HERMES_AGENT_ADAPTER,
    runtime_surface: 'hermes_agent_loop',
    ...hermesAgentAdapterRetirementBoundary(),
    domain_truth_owner: 'redcube_ai_visual_deliverable_runtime',
    review_export_gate_owner: 'redcube_ai',
    activation: 'explicit_opt_in_only',
    auditability: 'receipt_backed',
    failure_mode: 'fail_closed',
    effect_equivalence_guaranteed: false,
  };
  const oplExecutorAdapterReceipt = {
    ...defaultOplExecutorAdapterReceipt,
    ...(hermesContract.opl_executor_adapter_receipt || {}),
  };
  return {
    owner: 'opl_runtime_manager',
    adapter_surface: '@redcube/runtime-protocol',
    model_selection: hermesContract.model_selection,
    reasoning_selection: hermesContract.reasoning_selection,
    model: hermesContract.model,
    provider: hermesContract.provider,
    base_url: hermesContract.base_url,
    api_mode: hermesContract.api_mode,
    reasoning_effort: hermesContract.reasoning_effort,
    entrypoint: hermesContract.entrypoint,
    source: oplExecutorAdapterReceipt.source,
    hosted_adapter_reference: oplExecutorAdapterReceipt.hosted_adapter_reference,
    selected_executor_backend: oplExecutorAdapterReceipt.selected_executor_backend,
    backend_lifecycle: oplExecutorAdapterReceipt.backend_lifecycle,
    rca_default_backend: oplExecutorAdapterReceipt.rca_default_backend,
    adapter_deletion_gate_owner: oplExecutorAdapterReceipt.adapter_deletion_gate_owner,
    adapter_deletion_gate: oplExecutorAdapterReceipt.adapter_deletion_gate,
    domain_truth_owner: oplExecutorAdapterReceipt.domain_truth_owner,
    review_export_gate_owner: oplExecutorAdapterReceipt.review_export_gate_owner,
    activation: oplExecutorAdapterReceipt.activation,
    auditability: oplExecutorAdapterReceipt.auditability,
    failure_mode: oplExecutorAdapterReceipt.failure_mode,
    effect_equivalence_guaranteed: oplExecutorAdapterReceipt.effect_equivalence_guaranteed,
    opl_executor_adapter_receipt: oplExecutorAdapterReceipt,
  };
}

function buildHermesAgentRuntimeDescriptor(env = process.env, executionShape = 'agent_loop', hermesProfile = null) {
  return {
    owner: HERMES_AGENT_EXECUTOR_BACKEND,
    adapter_surface: '@redcube/runtime-protocol',
    api_surface: 'hermes_agent_api_server',
    model_selection: 'hermes_agent_server_runtime',
    reasoning_selection: 'hermes_agent_server_runtime',
    model: String(env.REDCUBE_HERMES_AGENT_API_COMPAT_MODEL || 'redcube-api-compat').trim(),
    base_url: String(env.REDCUBE_HERMES_AGENT_API_BASE_URL || '').trim() || null,
    hermes_profile: String(hermesProfile || '').trim() || null,
    api_mode: executionShape === 'structured_call' ? 'structured_call' : 'agent_loop',
  };
}

function buildExecutorDescriptor(executor, runtimeDescriptor) {
  if (executor?.adapter === HERMES_AGENT_ADAPTER && executor?.execution_shape === AGENT_LOOP_EXECUTION_SHAPE) {
    return {
      ...(executor || {}),
      hermes_agent_loop_runtime: runtimeDescriptor,
    };
  }
  if (executor?.adapter === HERMES_AGENT_EXECUTOR_BACKEND) {
    return {
      ...(executor || {}),
      hermes_agent_runtime: runtimeDescriptor,
    };
  }
  return {
    ...(executor || {}),
    codex_cli_runtime: runtimeDescriptor,
  };
}

function safeIndexText(index, ...keys) {
  for (const key of keys) {
    const text = String(index?.[key] || '').trim();
    if (text) return text;
  }
  return '';
}

function routeArtifactAttemptId(index) {
  return safeIndexText(
    index,
    'stage_attempt_ref',
    'stageAttemptRef',
    'attempt_lease_ref',
    'attemptLeaseRef',
    'lease_ref',
    'leaseRef',
    'attempt_receipt_ref',
    'attemptReceiptRef',
    'closeout_receipt_ref',
    'closeoutReceiptRef',
  );
}

function buildMissingOplRouteAttemptBlocker({ safeRoute, overlay, topicId, deliverableId, runId, reasons }) {
  const blockerRef = `rca-typed-blocker:route-execution-owner:${overlay}:${safeRoute}:${deliverableId}:opl-stage-attempt-required`;
  return {
    ok: false,
    surface_kind: 'typed_blocker',
    return_shape: 'typed_blocker',
    blocker_ref: blockerRef,
    blocker_kind: 'missing_opl_stage_attempt',
    owner: 'redcube_ai',
    route: safeRoute,
    overlay,
    topic_id: topicId,
    deliverable_id: deliverableId,
    run: {
      run_id: String(runId || '').trim() || null,
      route: safeRoute,
      overlay,
      topic_id: topicId,
      deliverable_id: deliverableId,
      status: 'typed_blocker',
      current_stage: safeRoute,
      error_kind: 'typed_blocker',
      error: {
        code: 'missing_opl_stage_attempt',
        message: 'RCA route execution requires an OPL-owned stage attempt packet; repo-local route runner cannot be the default execution owner.',
        failure_kind: 'typed_blocker',
        blocking_reasons: reasons,
        recommended_action: 'submit_route_to_opl_stage_attempt_or_record_domain_owned_typed_blocker',
      },
      cross_provider_attempt_index: null,
      route_execution_owner_boundary: {
        owner: 'opl',
        rca_role: 'visual_route_handler_and_artifact_authority',
        default_execution_owner: 'opl_stage_attempt_or_typed_blocker',
        repo_local_route_runner_default_allowed: false,
      },
    },
    events: [],
    error: {
      code: 'missing_opl_stage_attempt',
      message: 'RCA route execution requires an OPL-owned stage attempt packet; repo-local route runner cannot be the default execution owner.',
      failure_kind: 'typed_blocker',
      blocking_reasons: reasons,
      recommended_action: 'submit_route_to_opl_stage_attempt_or_record_domain_owned_typed_blocker',
      blocker_ref: blockerRef,
      blocker_kind: 'missing_opl_stage_attempt',
    },
    typed_blocker: {
      surface_kind: 'typed_blocker',
      return_shape: 'typed_blocker',
      blocker_ref: blockerRef,
      blocker_kind: 'missing_opl_stage_attempt',
      owner: 'redcube_ai',
      next_required_owner_action: 'opl_stage_attempt_or_domain_owned_typed_blocker',
      missing_refs: reasons,
      forbidden_default_owner: 'redcube_ai_repo_local_route_runner',
    },
    artifact: null,
    artifactFile: undefined,
    cache_status: 'miss',
  };
}

function normalizeOplRouteAttemptIndex({ crossProviderAttemptIndex, safeRoute, overlay, topicId, deliverableId, runId }) {
  const index = crossProviderAttemptIndex && typeof crossProviderAttemptIndex === 'object' && !Array.isArray(crossProviderAttemptIndex)
    ? crossProviderAttemptIndex
    : null;
  const missing = [];
  if (!index) {
    missing.push('cross_provider_attempt_index');
    return {
      ok: false,
      blocker: buildMissingOplRouteAttemptBlocker({
        safeRoute,
        overlay,
        topicId,
        deliverableId,
        runId,
        reasons: missing,
      }),
    };
  }

  const providerAttemptOwner = safeIndexText(index, 'provider_attempt_owner', 'providerAttemptOwner');
  const owner = safeIndexText(index, 'owner');
  const providerAttemptRef = safeIndexText(index, 'provider_attempt_ref', 'providerAttemptRef', 'opl_provider_attempt_ref', 'oplProviderAttemptRef');
  const providerAttemptLedgerRef = safeIndexText(index, 'provider_attempt_ledger_ref', 'providerAttemptLedgerRef', 'opl_provider_attempt_ledger_ref', 'oplProviderAttemptLedgerRef');
  const stageAttemptRef = safeIndexText(index, 'stage_attempt_ref', 'stageAttemptRef', 'opl_stage_attempt_ref', 'oplStageAttemptRef');
  const attemptLeaseRef = safeIndexText(index, 'attempt_lease_ref', 'attemptLeaseRef', 'lease_ref', 'leaseRef', 'provider_attempt_lease_ref', 'providerAttemptLeaseRef');
  const attemptReceiptRef = safeIndexText(index, 'attempt_receipt_ref', 'attemptReceiptRef', 'closeout_receipt_ref', 'closeoutReceiptRef');
  const localSessionRef = safeIndexText(index, 'local_session_ref', 'localSessionRef');

  if (providerAttemptOwner !== 'one-person-lab' && owner !== 'one-person-lab') missing.push('provider_attempt_owner');
  if (!providerAttemptRef) missing.push('provider_attempt_ref');
  if (!providerAttemptLedgerRef) missing.push('provider_attempt_ledger_ref');
  if (!stageAttemptRef && !attemptLeaseRef && !attemptReceiptRef) {
    missing.push('opl_stage_attempt_or_lease_or_receipt_ref');
  }
  if (providerAttemptRef && (
    providerAttemptRef === localSessionRef
    || providerAttemptRef.startsWith('route-run:')
    || providerAttemptRef.startsWith('product-entry-session:')
  )) {
    missing.push('valid_provider_attempt_ref');
  }
  if (providerAttemptLedgerRef && (
    providerAttemptLedgerRef === localSessionRef
    || providerAttemptLedgerRef === providerAttemptRef
    || providerAttemptLedgerRef.startsWith('route-run:')
    || providerAttemptLedgerRef.startsWith('product-entry-session:')
  )) {
    missing.push('valid_provider_attempt_ledger_ref');
  }

  if (missing.length > 0) {
    return {
      ok: false,
      blocker: buildMissingOplRouteAttemptBlocker({
        safeRoute,
        overlay,
        topicId,
        deliverableId,
        runId,
        reasons: Array.from(new Set(missing)).sort(),
      }),
    };
  }

  return {
    ok: true,
    index: {
      ...index,
      surface_kind: 'cross_provider_attempt_index',
      version: safeIndexText(index, 'version') || 'cross-provider-attempt-index.v1',
      owner: 'one-person-lab',
      provider_attempt_owner: 'one-person-lab',
      domain_adapter_owner: 'redcube_ai',
      provider_attempt_ref: providerAttemptRef,
      provider_attempt_ledger_ref: providerAttemptLedgerRef,
      ...(stageAttemptRef ? { stage_attempt_ref: stageAttemptRef } : {}),
      ...(attemptLeaseRef ? { attempt_lease_ref: attemptLeaseRef } : {}),
      ...(attemptReceiptRef ? { attempt_receipt_ref: attemptReceiptRef } : {}),
      provider_attempt_ref_required: true,
      provider_attempt_ledger_ref_required: true,
      missing_provider_ledger_policy: 'fail_closed_typed_blocker_projection',
      local_session_ref_is_not_provider_attempt_ref: true,
      rca_does_not_own_provider_attempt_ledger: true,
      can_claim_current_without_provider_ledger: false,
      repo_local_route_runner_default_allowed: false,
      execution_owner: 'opl_stage_attempt',
      rca_execution_role: 'visual_route_handler_and_artifact_authority',
    },
  };
}

function parseRouteRequest(request) {
  const {
    workspaceRoot,
    overlay,
    topicId,
    deliverableId,
    route,
    runId = null,
    adapter = CODEX_DEFAULT_ADAPTER,
    userIntent = '',
    mode = 'draft_new',
    baselineDeliverableId = '',
    candidateCount = 1,
    crossProviderAttemptIndex = request.cross_provider_attempt_index || null,
  } = request;
  const safeRoute = requireSafeSegment('route', route);
  validateDeliverableRouteInput({
    workspaceRoot,
    overlay,
    topicId,
    deliverableId,
    route: safeRoute,
  });
  return {
    workspaceRoot,
    overlay,
    topicId,
    deliverableId,
    runId,
    adapter,
    userIntent,
    mode,
    baselineDeliverableId,
    candidateCount,
    crossProviderAttemptIndex,
    safeRoute,
  };
}

function requestHasExplicitAdapter(request) {
  return Object.prototype.hasOwnProperty.call(request, 'adapter')
    && String(request.adapter || '').trim();
}

function buildRuntimeDescriptor({ selectedExecutor, fallbackExecutor }) {
  if (fallbackExecutor.adapter === HERMES_AGENT_ADAPTER && fallbackExecutor.execution_shape === AGENT_LOOP_EXECUTION_SHAPE) {
    return buildHermesAgentLoopRuntimeDescriptor();
  }
  if (fallbackExecutor.adapter === HERMES_AGENT_EXECUTOR_BACKEND) {
    return buildHermesAgentRuntimeDescriptor(
      process.env,
      selectedExecutor.execution_shape,
      selectedExecutor.hermes_profile,
    );
  }
  return buildCodexRuntimeDescriptor(readCodexCliContract());
}

function resolveRouteExecutor({ workspaceRoot, overlay, topicId, deliverableId, safeRoute, request, adapter }) {
  const profileId = readHydratedContractProfileId({ workspaceRoot, topicId, deliverableId });
  const executorRouting = resolveExecutorRouting({
    family: overlay,
    profileId,
    route: safeRoute,
    requestAdapter: requestHasExplicitAdapter(request) ? adapter : null,
    requestExecutorBackend: request.executorBackend || request.executor_backend || null,
    oplDefaultExecutorBackend: request.oplDefaultExecutorBackend || request.opl_default_executor_backend || null,
  });
  const selectedExecutor = executorRouting.selected_executor;
  const fallbackExecutor = resolveExecutorAdapter({
    adapter: selectedExecutor.adapter,
    executorBackend: selectedExecutor.executor_backend,
    executionShape: selectedExecutor.execution_shape,
    hermesProfile: selectedExecutor.hermes_profile,
    executorRouting,
  });
  const runtimeDescriptor = buildRuntimeDescriptor({
    selectedExecutor,
    fallbackExecutor,
  });
  const executor = buildExecutorDescriptor(
    {
      adapter: fallbackExecutor.adapter,
      executor_backend: fallbackExecutor.executor_backend,
      execution_shape: fallbackExecutor.execution_shape,
      primary: fallbackExecutor.primary,
      execution_surface: fallbackExecutor.execution_surface,
      creative_execution: fallbackExecutor.creative_execution,
      execution_model: fallbackExecutor.execution_model,
    },
    runtimeDescriptor,
  );
  return {
    executorRouting,
    selectedExecutor,
    executor,
  };
}

function buildRouteStartedEvent({ executor, safeRoute, overlay, deliverableId }) {
  const isHermesAgent = executor.adapter === HERMES_AGENT_ADAPTER;
  return {
    type: isHermesAgent && executor.execution_shape === AGENT_LOOP_EXECUTION_SHAPE
      ? 'hermes_agent_loop_route_started'
      : (isHermesAgent ? 'hermes_agent_route_started' : 'codex_route_started'),
    route: safeRoute,
    overlay,
    deliverable_id: deliverableId,
    ...(executor.codex_cli_runtime
      ? {
          codex_cli_runtime: executor.codex_cli_runtime,
        }
      : {}),
    ...(executor.hermes_agent_loop_runtime
      ? {
          hermes_agent_loop_runtime: executor.hermes_agent_loop_runtime,
        }
      : {}),
    ...(executor.hermes_agent_runtime
      ? {
          hermes_agent_runtime: executor.hermes_agent_runtime,
        }
      : {}),
  };
}

function patchArtifactExecutionModel(artifactFile, executor) {
  const artifact = JSON.parse(readFileSync(artifactFile, 'utf-8'));
  artifact.execution_model = {
    ...(artifact.execution_model || {}),
    ...(executor?.codex_cli_runtime
      ? {
          codex_cli_runtime: executor.codex_cli_runtime,
        }
      : {}),
    ...(executor?.hermes_agent_loop_runtime
      ? {
          hermes_agent_loop_runtime: executor.hermes_agent_loop_runtime,
        }
      : {}),
    ...(executor?.hermes_agent_runtime
      ? {
          hermes_agent_runtime: executor.hermes_agent_runtime,
        }
      : {}),
  };
  writeFileSync(artifactFile, JSON.stringify(artifact, null, 2), 'utf-8');
}

function candidateCountForRoute({ route, candidateCount }) {
  const count = Number(candidateCount || 0);
  if (Number.isInteger(count) && count > 0) return count;
  return route === 'visual_direction' && process.env.REDCUBE_VISUAL_DIRECTION_CANDIDATES
    ? Math.max(1, Number(process.env.REDCUBE_VISUAL_DIRECTION_CANDIDATES) || 1)
    : 1;
}

function readHydratedContractProfileId({ workspaceRoot, topicId, deliverableId }) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const deliverable = JSON.parse(readFileSync(deliverablePaths.deliverableFile, 'utf-8'));
  const contractRef = String(deliverable.hydrated_contract_ref || 'contracts/hydrated-deliverable.json').trim();
  const hydratedContract = JSON.parse(readFileSync(path.join(deliverablePaths.deliverableDir, contractRef), 'utf-8'));
  return String(hydratedContract.profile_id || deliverable.profile_id || '').trim() || null;
}

function compactArray(value) {
  return Array.isArray(value)
    ? Array.from(new Set(value.map((item) => String(item || '').trim()).filter(Boolean))).sort()
    : [];
}

function numberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function sumNumber(values) {
  const total = values.reduce((sum, value) => (
    typeof value === 'number' && Number.isFinite(value) ? sum + value : sum
  ), 0);
  return total > 0 ? total : null;
}

function normalizeGenerationChildCalls(generationRuntime = {}) {
  return Array.isArray(generationRuntime?.child_calls)
    ? generationRuntime.child_calls.filter((call) => call && typeof call === 'object')
    : [];
}

function runtimeMetric(generationRuntime, childCalls, key) {
  const direct = numberOrNull(generationRuntime?.[key]);
  if (direct != null) return direct;
  return sumNumber(childCalls.map((call) => call?.[key]));
}

function blockedChecksFromArtifact(artifact = {}) {
  return compactArray([
    ...compactArray(artifact?.blocking_reasons),
    ...compactArray(artifact?.review_state_patch?.blocking_reasons),
    ...compactArray(artifact?.review_state_patch?.pending_reviews),
    ...Object.entries(artifact?.checks || {})
      .filter(([, value]) => value === false)
      .map(([key]) => key),
  ]);
}

function isQualityBlockedArtifact(artifact = {}) {
  const rerunPolicy = artifact?.review_state_patch?.rerun_policy || {};
  return String(artifact?.status || '').trim() === 'block'
    || String(rerunPolicy?.status || '').trim() === 'rerun_required';
}

function generationRuntimeFromArtifact(artifact = {}) {
  return artifact?.creative_execution?.generation_runtime
    || artifact?.review_execution?.generation_runtime
    || artifact?.render_execution?.generation_runtime
    || artifact?.html_bundle?.render_execution?.generation_runtime
    || artifact?.generation_runtime
    || null;
}

function buildRoutePromptTelemetry(routeResult = {}) {
  const artifact = routeResult?.artifact || {};
  const generationRuntime = generationRuntimeFromArtifact(artifact) || {};
  const childCalls = normalizeGenerationChildCalls(generationRuntime);
  const reviewExecution = artifact?.review_execution || {};
  const renderExecution = artifact?.render_execution || artifact?.html_bundle?.render_execution || {};
  const targetedRerun = artifact?.targeted_rerun || {};
  const slideScope = {
    ...(generationRuntime?.slide_scope || {}),
    target_slide_ids: compactArray([
      ...compactArray(generationRuntime?.slide_scope?.target_slide_ids),
      ...compactArray(generationRuntime?.target_slide_scope?.target_slide_ids),
      ...compactArray(reviewExecution?.target_slide_ids),
      ...compactArray(renderExecution?.targeted_slide_ids),
      ...compactArray(targetedRerun?.target_slide_ids),
    ]),
    reviewed_slide_ids: compactArray([
      ...compactArray(generationRuntime?.slide_scope?.reviewed_slide_ids),
      ...compactArray(reviewExecution?.reviewed_slide_ids),
    ]),
    reused_slide_ids: compactArray([
      ...compactArray(generationRuntime?.slide_scope?.reused_slide_ids),
      ...compactArray(reviewExecution?.reused_slide_ids),
      ...compactArray(renderExecution?.reused_slide_ids),
      ...compactArray(targetedRerun?.reused_slide_ids),
    ]),
  };
  slideScope.slide_ids = compactArray([
    ...compactArray(generationRuntime?.slide_scope?.slide_ids),
    ...slideScope.target_slide_ids,
    ...slideScope.reviewed_slide_ids,
    ...slideScope.reused_slide_ids,
  ]);

  return {
    prompt_pack_file: String(generationRuntime?.prompt_pack_file || artifact?.prompt_pack?.relative_path || '').trim() || null,
    prompt_files: compactArray(generationRuntime?.prompt_files),
    prompt_bytes: runtimeMetric(generationRuntime, childCalls, 'prompt_bytes'),
    context_bytes: runtimeMetric(generationRuntime, childCalls, 'context_bytes'),
    prompt_tokens: runtimeMetric(generationRuntime, childCalls, 'prompt_tokens'),
    completion_tokens: runtimeMetric(generationRuntime, childCalls, 'completion_tokens'),
    total_tokens: runtimeMetric(generationRuntime, childCalls, 'total_tokens'),
    estimated_prompt_tokens: runtimeMetric(generationRuntime, childCalls, 'estimated_prompt_tokens'),
    provider_usage: generationRuntime?.provider_usage || generationRuntime?.usage || null,
    cached_tokens: numberOrNull(generationRuntime?.cached_tokens),
    cache_hit: generationRuntime?.cache_hit === true ? true : null,
    child_calls: childCalls,
    review_scope: String(reviewExecution?.review_scope || generationRuntime?.review_scope || '').trim() || null,
    cache_status: routeResult?.cache_status || artifact?.route_cache?.cache_status || artifact?.mechanical_cache?.cache_status || null,
    blocked_checks: blockedChecksFromArtifact(artifact),
    slide_scope: slideScope,
    target_slide_scope: {
      target_slide_ids: slideScope.target_slide_ids,
    },
  };
}

function materializeRouteResult({
  raced,
  executor,
  workspaceRoot,
  overlay,
  topicId,
  deliverableId,
  safeRoute,
  runId,
  crossProviderAttemptIndex,
}) {
  const routeResult = raced.artifact;
  routeResult.artifact = {
    ...(routeResult.artifact || {}),
    candidate_race: raced.race,
  };
  if (routeResult.cache_status === 'hit') {
    routeResult.artifact_refs = Array.from(new Set([
      ...(Array.isArray(routeResult.artifact_refs) ? routeResult.artifact_refs : []),
    ]));
    return routeResult;
  }
  writeFileSync(routeResult.artifact_file, JSON.stringify(routeResult.artifact, null, 2), 'utf-8');
  routeResult.artifact_refs = Array.from(new Set([
    ...(Array.isArray(routeResult.artifact_refs) ? routeResult.artifact_refs : []),
  ]));
  patchArtifactExecutionModel(routeResult.artifact_file, executor);
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const patchedArtifact = JSON.parse(readFileSync(routeResult.artifact_file, 'utf-8'));
  const stageAttemptId = safeIndexText(
    crossProviderAttemptIndex,
    'stage_attempt_ref',
    'stageAttemptRef',
    'opl_stage_attempt_ref',
    'oplStageAttemptRef',
  )
    || safeIndexText(crossProviderAttemptIndex, 'attempt_lease_ref', 'attemptLeaseRef', 'lease_ref', 'leaseRef')
    || safeIndexText(crossProviderAttemptIndex, 'attempt_receipt_ref', 'attemptReceiptRef', 'closeout_receipt_ref', 'closeoutReceiptRef')
    || safeText(runId);
  const stageFolderRefs = refreshStageFolderRouteArtifact({
    deliverablePaths,
    overlay,
    topicId,
    deliverableId,
    route: safeRoute,
    attemptId: stageAttemptId,
    artifactFile: routeResult.artifact_file,
    artifact: patchedArtifact,
    oplRouteAttemptIndex: crossProviderAttemptIndex,
  });
  routeResult.artifact = patchedArtifact;
  routeResult.artifact_refs = Array.from(new Set([
    ...(Array.isArray(routeResult.artifact_refs) ? routeResult.artifact_refs : []),
    ...(Array.isArray(stageFolderRefs?.artifact_refs) ? stageFolderRefs.artifact_refs : []),
  ]));
  return routeResult;
}

async function executeRouteCandidateRace({
  workspaceRoot,
  overlay,
  topicId,
  deliverableId,
  safeRoute,
  selectedExecutor,
  executorRouting,
  userIntent,
  mode,
  baselineDeliverableId,
  candidateCount,
  executor,
  crossProviderAttemptIndex,
  runId,
}) {
  const routeCandidateCount = candidateCountForRoute({ route: safeRoute, candidateCount });
  const raced = await runCandidateRaceRoute({
    family: overlay,
    route: safeRoute,
    candidateCount: routeCandidateCount,
    qualityGate: 'structured_contract_validation',
    runCandidate: async () => executeDeliverableRouteLocally({
      workspaceRoot,
      overlay,
      topicId,
      deliverableId,
      route: safeRoute,
      adapter: selectedExecutor.adapter,
      executionShape: selectedExecutor.execution_shape,
      hermesProfile: selectedExecutor.hermes_profile,
      executorRouting,
      userIntent,
      mode,
      baselineDeliverableId,
      oplRouteAttemptIndex: crossProviderAttemptIndex,
      runId,
    }),
    scoreCandidate: (candidate) => Number(candidate?.artifact?.visual_direction?.rhythm_curve?.length || 1),
  });
  return materializeRouteResult({
    raced,
    executor,
    workspaceRoot,
    overlay,
    topicId,
    deliverableId,
    safeRoute,
    runId,
    crossProviderAttemptIndex,
  });
}

function buildCompletedRouteResponse({
  workspaceRoot,
  run,
  safeRoute,
  overlay,
  deliverableId,
  routeResult,
  executor,
  crossProviderAttemptIndex = null,
  startedEvent = null,
}) {
  const routeRunStatus = isQualityBlockedArtifact(routeResult.artifact) ? 'quality_blocked' : 'completed';
  const completedRun = completeRouteExecutionRef({
    runId: run.run_id,
    run,
    currentStage: safeRoute,
    stageResults: [{
      stage: safeRoute,
      status: routeResult.cache_status === 'hit' ? 'cached' : routeRunStatus,
    }],
    artifactRefs: routeResult.artifact_refs,
    executor,
    telemetry: buildRoutePromptTelemetry(routeResult),
    status: routeRunStatus,
    errorKind: routeRunStatus === 'quality_blocked' ? 'quality_blocked' : null,
    crossProviderAttemptIndex,
  });

  const completedEvent = {
    type: routeRunStatus === 'quality_blocked' ? 'run_quality_blocked' : 'run_completed',
    route: safeRoute,
    overlay,
    deliverable_id: deliverableId,
    profile_id: routeResult.artifact?.contract?.profile_id || null,
    artifact_file: routeResult.artifact_file,
    cache_status: routeResult.cache_status || 'miss',
  };

  return {
    ok: true,
    run: completedRun,
    events: [startedEvent, completedEvent].filter(Boolean),
    artifactFile: routeResult.artifact_file,
    artifact: routeResult.artifact,
    cache_status: routeResult.cache_status || 'miss',
  };
}

function normalizeRouteFailure(error) {
  const failureMessage = String(
    error instanceof Error ? error.message : error,
  ).trim() || 'Codex route execution failed';
  const failure = new Error(failureMessage);
  failure.code = error?.code || null;
  failure.failure_kind = error?.failure_kind || error?.failureKind || null;
  failure.target_slide_ids = Array.isArray(error?.target_slide_ids) ? error.target_slide_ids : [];
  failure.blocking_reasons = Array.isArray(error?.blocking_reasons) ? error.blocking_reasons : [];
  failure.recommended_action = String(error?.recommended_action || '').trim() || null;
  failure.artifact_file = String(error?.artifact_file || '').trim() || null;
  failure.artifact_refs = Array.isArray(error?.artifact_refs) ? error.artifact_refs : [];
  failure.stall_lineage = error?.stall_lineage || null;
  failure.requiresHumanConfirmation = error?.requiresHumanConfirmation === true;
  failure.requiresExternalSecret = error?.requiresExternalSecret === true;
  const failureKind = String(failure.failure_kind || failure.code || '').trim();
  const qualityBlocked = failureKind === 'quality_blocked' || /^Route .+ blocked/.test(failureMessage);
  if (qualityBlocked) {
    failure.code = failure.code || 'quality_blocked';
    failure.failure_kind = 'quality_blocked';
  }
  return {
    failure,
    qualityBlocked,
  };
}

function failedArtifactForError(error, failure) {
  return failure.artifact_file && existsSync(failure.artifact_file)
    ? JSON.parse(readFileSync(failure.artifact_file, 'utf-8'))
    : (error?.artifact || null);
}

function buildFailedRouteResponse({
  workspaceRoot,
  run,
  safeRoute,
  overlay,
  deliverableId,
  error,
  executor,
  startedEvent = null,
}) {
  const { failure, qualityBlocked } = normalizeRouteFailure(error);
  const failedArtifact = failedArtifactForError(error, failure);
  const failedRun = failRouteExecutionRef({
    run,
    currentStage: safeRoute,
    error: failure,
    executor,
    errorKind: qualityBlocked ? 'quality_blocked' : 'execution_error',
    status: qualityBlocked ? 'quality_blocked' : 'failed',
    telemetry: failedArtifact
      ? buildRoutePromptTelemetry({
          artifact: failedArtifact,
          cache_status: failedArtifact?.route_cache?.cache_status || 'miss',
        })
      : {},
  });

  const failedEvent = {
    type: qualityBlocked ? 'run_quality_blocked' : 'run_failed',
    route: safeRoute,
    overlay,
    deliverable_id: deliverableId,
    error: failedRun.error,
  };

  const includeFailedArtifact = failure.failure_kind === 'repeated_block_without_input_change';
  return {
    ok: false,
    run: failedRun,
    events: [startedEvent, failedEvent].filter(Boolean),
    error: failedRun.error,
    artifact: includeFailedArtifact ? failedArtifact : null,
    artifactFile: includeFailedArtifact ? (failure.artifact_file || null) : undefined,
  };
}

export async function runDeliverableRoute(request) {
  const routeRequest = parseRouteRequest(request);
  const {
  workspaceRoot,
  overlay,
  topicId,
  deliverableId,
  runId = null,
  adapter = CODEX_DEFAULT_ADAPTER, userIntent = '',
  mode = 'draft_new',
  baselineDeliverableId = '',
  candidateCount = 1,
  crossProviderAttemptIndex = null,
    safeRoute,
  } = routeRequest;
  const { executorRouting, selectedExecutor, executor } = resolveRouteExecutor({
    workspaceRoot,
    overlay,
    topicId,
    deliverableId,
    safeRoute,
    request,
    adapter,
  });
  if (selectedExecutor.executor_backend === HERMES_AGENT_EXECUTOR_BACKEND) {
    return failRetiredHermesAgentAdapter({
      surface: selectedExecutor.execution_shape === STRUCTURED_CALL_EXECUTION_SHAPE
        ? 'hermes_agent_api_server'
        : 'hermes_agent_loop',
    });
  }
  const effectiveCrossProviderAttemptIndex = crossProviderAttemptIndex && typeof crossProviderAttemptIndex === 'object'
    ? crossProviderAttemptIndex
    : null;
  const normalizedRouteAttempt = normalizeOplRouteAttemptIndex({
    crossProviderAttemptIndex: effectiveCrossProviderAttemptIndex,
    safeRoute,
    overlay,
    topicId,
    deliverableId,
    runId,
  });
  if (normalizedRouteAttempt.ok !== true) {
    return normalizedRouteAttempt.blocker;
  }

  const run = startRouteExecutionRef({
    runId: String(runId || '').trim() || null,
    route: safeRoute,
    overlay,
    target: deliverableId,
    topicId,
    deliverableId,
    baselineDeliverableId,
    executor,
    crossProviderAttemptIndex: normalizedRouteAttempt.index,
  });

  const startedEvent = buildRouteStartedEvent({
    executor,
    safeRoute,
    overlay,
    deliverableId,
  });

  try {
    const routeResult = await executeRouteCandidateRace({
      workspaceRoot,
      overlay,
      topicId,
      deliverableId,
      safeRoute,
      selectedExecutor,
      executorRouting,
      userIntent,
      mode,
      baselineDeliverableId,
      candidateCount,
      executor,
      crossProviderAttemptIndex: normalizedRouteAttempt.index,
      runId: routeArtifactAttemptId(normalizedRouteAttempt.index),
    });
    return buildCompletedRouteResponse({
      workspaceRoot,
      run,
      safeRoute,
      overlay,
      deliverableId,
      routeResult,
      executor,
      crossProviderAttemptIndex: normalizedRouteAttempt.index,
      startedEvent,
    });
  } catch (error) {
    return buildFailedRouteResponse({
      workspaceRoot,
      run,
      safeRoute,
      overlay,
      deliverableId,
      error,
      executor,
      startedEvent,
    });
  }
}
