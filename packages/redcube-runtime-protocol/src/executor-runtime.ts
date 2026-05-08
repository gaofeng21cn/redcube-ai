// @ts-nocheck
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

import {
  buildCodexRuntimeTopology as buildProtocolCodexRuntimeTopology,
} from './runtime-topology.js';
import {
  createRunRecord,
} from './runs.js';
import {
  resolveWorkspaceContract,
} from './workspace.js';

export const HERMES_SUBSTRATE_OWNER = 'Hermes';
export const HERMES_RUNTIME_SURFACE = 'hermes_agent_api_server';
export const HERMES_DEPLOYMENT_HOST = 'codex_cli_operator_bridge';
export const HERMES_DEPLOYMENT_STATUS = 'transition_only';
export const CODEX_EXECUTOR_BACKEND = 'codex_cli';
export const HERMES_AGENT_EXECUTOR_BACKEND = 'hermes_agent';
export const CODEX_DEFAULT_ADAPTER = CODEX_EXECUTOR_BACKEND;
export const HERMES_AGENT_ADAPTER = HERMES_AGENT_EXECUTOR_BACKEND;
export const HERMES_DEFAULT_ADAPTER = HERMES_AGENT_EXECUTOR_BACKEND;
export const HERMES_FREEZE_ORIGIN = 'Hermes.A';
export const STRUCTURED_CALL_EXECUTION_SHAPE = 'structured_call';
export const AGENT_LOOP_EXECUTION_SHAPE = 'agent_loop';
export const CODEX_RUNTIME_SURFACE = 'codex_cli_runtime';
export const CODEX_DEPLOYMENT_HOST = 'codex_local_operator_host';
export const CODEX_DEPLOYMENT_STATUS = 'active_primary';
export const CODEX_DEFAULT_MODEL_SELECTION = 'inherit_local_codex_default';
export const CODEX_DEFAULT_REASONING_SELECTION = 'inherit_local_codex_default';
export const CODEX_FREEZE_ORIGIN = 'P19.A';
export const HERMES_AGENT_LOOP_RUNTIME_SURFACE = 'hermes_agent_loop';
export const HERMES_AGENT_LOOP_DEPLOYMENT_HOST = 'local_hermes_agent_bridge';
export const HERMES_AGENT_LOOP_DEPLOYMENT_STATUS = 'opt_in_available';
export const HERMES_AGENT_LOOP_DEFAULT_MODEL_SELECTION = 'inherit_local_hermes_default';
export const HERMES_AGENT_LOOP_DEFAULT_REASONING_SELECTION = 'inherit_local_hermes_default';
export const HERMES_AGENT_LOOP_FREEZE_ORIGIN = 'Hermes.Proof.A';
export const RUNNING_RUN_STALE_TTL_MS = 2 * 60 * 60 * 1000;

export type CodexExecutionModel = ReturnType<typeof buildCodexExecutionModel>;
export type HermesAgentLoopExecutionModel = ReturnType<typeof buildHermesAgentLoopExecutionModel>;

const HERMES_RUNTIME_TOPOLOGY = Object.freeze({
  schema_version: 1,
  executor_backend: HERMES_AGENT_EXECUTOR_BACKEND,
  execution_shape: AGENT_LOOP_EXECUTION_SHAPE,
  runtime_substrate_owner: HERMES_SUBSTRATE_OWNER,
  runtime_substrate_surface: HERMES_RUNTIME_SURFACE,
  deployment_host: HERMES_DEPLOYMENT_HOST,
  deployment_host_status: HERMES_DEPLOYMENT_STATUS,
  gateway_role: 'visual_deliverable_domain_gateway',
  domain_harness_os: 'RedCube Domain Harness OS',
  family_pack_boundary: 'family_profile_pack_harness_execution',
  product_mode: 'auto_only',
  default_formal_entry: 'CLI',
  supported_protocol_layer: ['MCP'],
  internal_controller_surface: 'controller',
  controller_repo_verified: false,
});

const HERMES_AGENT_LOOP_RUNTIME_TOPOLOGY = Object.freeze({
  schema_version: 1,
  executor_backend: HERMES_AGENT_EXECUTOR_BACKEND,
  execution_shape: AGENT_LOOP_EXECUTION_SHAPE,
  runtime_substrate_owner: HERMES_SUBSTRATE_OWNER,
  runtime_substrate_surface: HERMES_AGENT_LOOP_RUNTIME_SURFACE,
  deployment_host: HERMES_AGENT_LOOP_DEPLOYMENT_HOST,
  deployment_host_status: HERMES_AGENT_LOOP_DEPLOYMENT_STATUS,
  gateway_role: 'visual_deliverable_domain_gateway',
  domain_harness_os: 'RedCube Domain Harness OS',
  family_pack_boundary: 'family_profile_pack_harness_execution',
  product_mode: 'auto_only',
  default_formal_entry: 'CLI',
  supported_protocol_layer: ['MCP'],
  internal_controller_surface: 'controller',
  controller_repo_verified: false,
});

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

function toNullableString(value) {
  const text = String(value || '').trim();
  return text || null;
}

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

function runFile(workspaceRoot, runId) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const runsDir = path.join(contract.runtimeDir, 'runs');
  mkdirSync(runsDir, { recursive: true });
  return path.join(runsDir, `${requireSafeSegment('runId', runId)}.json`);
}

function getRunsDir(workspaceRoot) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const runsDir = path.join(contract.runtimeDir, 'runs');
  mkdirSync(runsDir, { recursive: true });
  return runsDir;
}

function eventFile(workspaceRoot, runId) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const eventsDir = path.join(contract.runtimeDir, 'events');
  mkdirSync(eventsDir, { recursive: true });
  return path.join(eventsDir, `${requireSafeSegment('runId', runId)}.jsonl`);
}

function readStoredRuns(workspaceRoot) {
  const runsDir = getRunsDir(workspaceRoot);
  return readdirSync(runsDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      try {
        return JSON.parse(readFileSync(path.join(runsDir, file), 'utf-8'));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function findPriorRuns({ workspaceRoot, route, scope, target, overlay }) {
  return readStoredRuns(workspaceRoot)
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
      requires_human_confirmation: error.requiresHumanConfirmation === true,
      requires_external_secret: error.requiresExternalSecret === true,
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
    requires_human_confirmation: false,
    requires_external_secret: false,
  };
}

export function normalizeExecutorBackend(value = CODEX_DEFAULT_ADAPTER) {
  const requested = String(value || '').trim();
  if (!requested || requested === CODEX_DEFAULT_ADAPTER || requested === CODEX_EXECUTOR_BACKEND) {
    return CODEX_EXECUTOR_BACKEND;
  }
  if (requested === HERMES_AGENT_ADAPTER || requested === HERMES_AGENT_EXECUTOR_BACKEND) {
    return HERMES_AGENT_EXECUTOR_BACKEND;
  }
  throw new Error(`Unsupported executor backend: ${requested}`);
}

export function buildExecutorBackendContract({ adapter = CODEX_DEFAULT_ADAPTER, route = '' } = {}) {
  const executorBackend = normalizeExecutorBackend(adapter);
  return {
    executor_backend: executorBackend,
    execution_shape: executorBackend === HERMES_AGENT_EXECUTOR_BACKEND
      ? AGENT_LOOP_EXECUTION_SHAPE
      : STRUCTURED_CALL_EXECUTION_SHAPE,
    route_execution_policy: {
      render_html_default_shape: STRUCTURED_CALL_EXECUTION_SHAPE,
      fix_html_default_shape: STRUCTURED_CALL_EXECUTION_SHAPE,
      fix_html_escalation_shape: AGENT_LOOP_EXECUTION_SHAPE,
      route: String(route || '').trim() || null,
    },
  };
}

function loadHermesRunRaw({ workspaceRoot, runId }) {
  const file = runFile(workspaceRoot, runId);
  if (!existsSync(file)) {
    throw new Error(`Run not found: ${runId}`);
  }

  return {
    file,
    run: JSON.parse(readFileSync(file, 'utf-8')),
  };
}

function markStaleRunningRunIfNeeded({ workspaceRoot, runId, checkedSurface = 'loadRun' }) {
  const { file, run } = loadHermesRunRaw({ workspaceRoot, runId });
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
  writeFileSync(file, JSON.stringify(markedRun, null, 2), 'utf-8');
  return markedRun;
}

export function buildHermesRuntimeTopology() {
  return {
    ...HERMES_RUNTIME_TOPOLOGY,
    supported_protocol_layer: [...HERMES_RUNTIME_TOPOLOGY.supported_protocol_layer],
  };
}

export function buildCodexRuntimeTopology() {
  return buildProtocolCodexRuntimeTopology();
}

export function buildHermesAgentLoopRuntimeTopology() {
  return {
    ...HERMES_AGENT_LOOP_RUNTIME_TOPOLOGY,
    supported_protocol_layer: [...HERMES_AGENT_LOOP_RUNTIME_TOPOLOGY.supported_protocol_layer],
  };
}

export function normalizeCodexAdapter(adapter = CODEX_DEFAULT_ADAPTER) {
  const requested = String(adapter || '').trim();
  if (!requested || requested === CODEX_DEFAULT_ADAPTER) {
    return CODEX_DEFAULT_ADAPTER;
  }
  throw new Error(`Unsupported executor adapter: ${requested}`);
}

export function normalizeHermesAdapter(adapter = HERMES_DEFAULT_ADAPTER) {
  const requested = String(adapter || '').trim();
  if (!requested || requested === HERMES_DEFAULT_ADAPTER || requested === HERMES_AGENT_EXECUTOR_BACKEND) {
    return HERMES_DEFAULT_ADAPTER;
  }
  throw new Error(`Unsupported executor adapter: ${requested}`);
}

export function buildHermesExecutionModel({ adapter = HERMES_DEFAULT_ADAPTER } = {}) {
  const requestedAdapter = String(adapter || '').trim() || HERMES_DEFAULT_ADAPTER;
  normalizeHermesAdapter(requestedAdapter);
  const backendContract = buildExecutorBackendContract({ adapter: HERMES_DEFAULT_ADAPTER });
  return {
    mainline_adapter: HERMES_DEFAULT_ADAPTER,
    executor_backend: backendContract.executor_backend,
    execution_shape: backendContract.execution_shape,
    primary_surface: HERMES_RUNTIME_SURFACE,
    adapter_role: 'primary_creative_executor',
    runtime_substrate_owner: HERMES_SUBSTRATE_OWNER,
    deployment_host: HERMES_DEPLOYMENT_HOST,
    deployment_host_status: HERMES_DEPLOYMENT_STATUS,
    requested_adapter: requestedAdapter || HERMES_DEFAULT_ADAPTER,
    freeze_origin_milestone: HERMES_FREEZE_ORIGIN,
  };
}

export function buildCodexExecutionModel({ adapter = CODEX_DEFAULT_ADAPTER } = {}) {
  const requestedAdapter = String(adapter || '').trim() || CODEX_DEFAULT_ADAPTER;
  normalizeCodexAdapter(requestedAdapter);
  const backendContract = buildExecutorBackendContract({ adapter: CODEX_DEFAULT_ADAPTER });
  return {
    mainline_adapter: CODEX_DEFAULT_ADAPTER,
    executor_backend: backendContract.executor_backend,
    execution_shape: backendContract.execution_shape,
    primary_surface: CODEX_RUNTIME_SURFACE,
    adapter_role: 'primary_creative_executor',
    runtime_substrate_owner: 'Codex CLI',
    deployment_host: CODEX_DEPLOYMENT_HOST,
    deployment_host_status: CODEX_DEPLOYMENT_STATUS,
    requested_adapter: requestedAdapter || CODEX_DEFAULT_ADAPTER,
    default_model_selection: CODEX_DEFAULT_MODEL_SELECTION,
    default_reasoning_effort: CODEX_DEFAULT_REASONING_SELECTION,
    freeze_origin_milestone: CODEX_FREEZE_ORIGIN,
  };
}

export function buildHermesAgentLoopExecutionModel({ adapter = HERMES_AGENT_ADAPTER } = {}) {
  const requestedAdapter = String(adapter || '').trim() || HERMES_AGENT_ADAPTER;
  if (requestedAdapter !== HERMES_AGENT_ADAPTER) {
    throw new Error(`Unsupported executor adapter: ${requestedAdapter}`);
  }
  const backendContract = buildExecutorBackendContract({ adapter: HERMES_AGENT_ADAPTER });
  return {
    mainline_adapter: HERMES_AGENT_ADAPTER,
    executor_backend: backendContract.executor_backend,
    execution_shape: backendContract.execution_shape,
    primary_surface: HERMES_AGENT_LOOP_RUNTIME_SURFACE,
    adapter_role: 'opt_in_proof_executor',
    runtime_substrate_owner: HERMES_SUBSTRATE_OWNER,
    deployment_host: HERMES_AGENT_LOOP_DEPLOYMENT_HOST,
    deployment_host_status: HERMES_AGENT_LOOP_DEPLOYMENT_STATUS,
    requested_adapter: requestedAdapter,
    default_model_selection: HERMES_AGENT_LOOP_DEFAULT_MODEL_SELECTION,
    default_reasoning_effort: HERMES_AGENT_LOOP_DEFAULT_REASONING_SELECTION,
    freeze_origin_milestone: HERMES_AGENT_LOOP_FREEZE_ORIGIN,
  };
}

export function buildHermesExecutorDescriptor({ adapter = HERMES_DEFAULT_ADAPTER } = {}) {
  const requestedAdapter = String(adapter || '').trim() || HERMES_DEFAULT_ADAPTER;
  const normalizedAdapter = normalizeHermesAdapter(requestedAdapter);
  const executionModel = buildHermesExecutionModel({ adapter: requestedAdapter });
  return {
    adapter: normalizedAdapter,
    ...buildExecutorBackendContract({ adapter: normalizedAdapter }),
    requested_adapter: requestedAdapter,
    primary: true,
    execution_surface: HERMES_RUNTIME_SURFACE,
    creative_execution: 'agent_first_director_first',
    runtime_topology: buildHermesRuntimeTopology(),
    execution_model: executionModel,
  };
}

export function buildCodexExecutorDescriptor({ adapter = CODEX_DEFAULT_ADAPTER } = {}) {
  const requestedAdapter = String(adapter || '').trim() || CODEX_DEFAULT_ADAPTER;
  const normalizedAdapter = normalizeCodexAdapter(requestedAdapter);
  const executionModel = buildCodexExecutionModel({ adapter: requestedAdapter });
  return {
    adapter: normalizedAdapter,
    ...buildExecutorBackendContract({ adapter: normalizedAdapter }),
    requested_adapter: requestedAdapter,
    primary: true,
    execution_surface: CODEX_RUNTIME_SURFACE,
    creative_execution: 'agent_first_director_first',
    runtime_topology: buildCodexRuntimeTopology(),
    execution_model: executionModel,
  };
}

export function buildHermesAgentLoopExecutorDescriptor({ adapter = HERMES_AGENT_ADAPTER } = {}) {
  const requestedAdapter = String(adapter || '').trim() || HERMES_AGENT_ADAPTER;
  if (requestedAdapter !== HERMES_AGENT_ADAPTER) {
    throw new Error(`Unsupported executor adapter: ${requestedAdapter}`);
  }
  const executionModel = buildHermesAgentLoopExecutionModel({ adapter: requestedAdapter });
  return {
    adapter: HERMES_AGENT_ADAPTER,
    ...buildExecutorBackendContract({ adapter: HERMES_AGENT_ADAPTER }),
    requested_adapter: requestedAdapter,
    primary: false,
    execution_surface: HERMES_AGENT_LOOP_RUNTIME_SURFACE,
    creative_execution: 'agent_first_director_first',
    runtime_topology: buildHermesAgentLoopRuntimeTopology(),
    execution_model: executionModel,
  };
}

function resolveRuntimeTopologyForExecutor(executor) {
  const mainlineAdapter = String(
    executor?.execution_model?.mainline_adapter
    || executor?.adapter
    || '',
  ).trim();
  const executionShape = String(
    executor?.execution_model?.execution_shape
    || executor?.execution_shape
    || '',
  ).trim();
  if (mainlineAdapter === CODEX_DEFAULT_ADAPTER) {
    return buildCodexRuntimeTopology();
  }
  if (mainlineAdapter === HERMES_AGENT_ADAPTER && executionShape === AGENT_LOOP_EXECUTION_SHAPE) {
    return buildHermesAgentLoopRuntimeTopology();
  }
  return buildHermesRuntimeTopology();
}

export {
  generateStructuredArtifactViaHermesAgentLoop,
  probeHermesAgentLoop,
  readHermesAgentLoopContract,
} from './hermes-agent-loop-bridge-client.js';
export {
  generateStructuredArtifactViaHermesAgentApi,
  generateStructuredArtifactViaHermesAgentStructuredCall,
  runAgentLoopViaHermesAgentApi,
  structuredCallViaHermesAgentApi,
} from './hermes-agent-api-client.js';

export function createHermesCreativeSource({
  route = null,
  lifecycleStage = null,
  authoredSurface = null,
  materializedFrom = 'prompt_pack_seed',
  supportingContract = 'prompt_pack_seed',
} = {}) {
  return {
    owner: HERMES_DEFAULT_ADAPTER,
    primary_surface: HERMES_RUNTIME_SURFACE,
    stage_owner: HERMES_RUNTIME_SURFACE,
    adapter: HERMES_DEFAULT_ADAPTER,
    route: toNullableString(route),
    lifecycle_stage: toNullableString(lifecycleStage),
    ownership_model: 'director_first',
    authored_surface: toNullableString(authoredSurface),
    materialized_from: String(materializedFrom || '').trim() || 'prompt_pack_seed',
    supporting_contract: String(supportingContract || '').trim() || 'prompt_pack_seed',
    deployment_host: HERMES_DEPLOYMENT_HOST,
  };
}

export function createHermesCreativeExecution({
  route = null,
  lifecycleStage = null,
  overlay = null,
} = {}) {
  return {
    owner: HERMES_DEFAULT_ADAPTER,
    primary_surface: HERMES_RUNTIME_SURFACE,
    route: toNullableString(route),
    lifecycle_stage: toNullableString(lifecycleStage),
    overlay: toNullableString(overlay),
    ownership_model: 'director_first',
    deployment_host: HERMES_DEPLOYMENT_HOST,
  };
}

export function createHermesReviewExecution({
  overlay = null,
  reviewOverlay = null,
  contractAsset = 'prompt_pack_seed',
} = {}) {
  return {
    owner: HERMES_DEFAULT_ADAPTER,
    overlay: toNullableString(overlay) || toNullableString(reviewOverlay),
    review_overlay: toNullableString(reviewOverlay),
    primary_surface: HERMES_RUNTIME_SURFACE,
    contract_asset: String(contractAsset || '').trim() || 'prompt_pack_seed',
    deployment_host: HERMES_DEPLOYMENT_HOST,
  };
}

export function startHermesRun({
  workspaceRoot,
  runId = null,
  route,
  overlay,
  scope = 'deliverable',
  target,
  topicId = null,
  deliverableId = null,
  managedRunId = null,
  baselineDeliverableId = '',
  executor,
}) {
  const resolvedRunId = String(runId || '').trim() || `run-${randomUUID()}`;
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
      managedRunId,
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
  };
  run.telemetry = buildRunTelemetry(run, executor, 'running', null);

  writeFileSync(runFile(workspaceRoot, resolvedRunId), JSON.stringify(run, null, 2), 'utf-8');
  return run;
}

export function completeHermesRun({
  workspaceRoot,
  runId,
  currentStage,
  stageResults,
  artifactRefs,
  executor,
  telemetry = {},
  status = 'completed',
  errorKind = null,
}) {
  const { run } = loadHermesRunRaw({ workspaceRoot, runId });
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
  };
  completedRun.telemetry = buildRunTelemetry(
    completedRun,
    executor || run?.executor,
    runStatus,
    completedRun.finished_at,
  );

  writeFileSync(runFile(workspaceRoot, runId), JSON.stringify(completedRun, null, 2), 'utf-8');
  return completedRun;
}

export function failHermesRun({
  workspaceRoot,
  runId,
  currentStage,
  error,
  errorKind = 'execution_error',
  executor,
  telemetry = {},
  status = 'failed',
}) {
  const { run } = loadHermesRunRaw({ workspaceRoot, runId });
  const runStatus = String(status || '').trim() || 'failed';
  const failedRun = {
    ...run,
    status: runStatus,
    finished_at: new Date().toISOString(),
    current_stage: currentStage,
    error_kind: errorKind,
    runtime_topology: resolveRuntimeTopologyForExecutor(executor || run?.executor),
    executor: executor || run?.executor,
    error: normalizeError(error),
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

  writeFileSync(runFile(workspaceRoot, runId), JSON.stringify(failedRun, null, 2), 'utf-8');
  return failedRun;
}

export function loadHermesRun({ workspaceRoot, runId }) {
  return markStaleRunningRunIfNeeded({ workspaceRoot, runId });
}

export function appendHermesEvent(workspaceRoot, runId, event) {
  appendFileSync(eventFile(workspaceRoot, runId), `${JSON.stringify(event)}\n`, 'utf-8');
}

export function readHermesEvents(workspaceRoot, runId) {
  const file = eventFile(workspaceRoot, runId);
  if (!existsSync(file)) {
    return [];
  }

  return readFileSync(file, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
