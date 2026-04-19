import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

import { createRunRecord, resolveWorkspaceContract } from '@redcube/runtime-protocol';

export const HERMES_SUBSTRATE_OWNER = 'Hermes';
export const HERMES_RUNTIME_SURFACE = 'hermes_backed_runtime_substrate';
export const HERMES_DEPLOYMENT_HOST = 'codex_default_host_agent_bridge';
export const HERMES_DEPLOYMENT_STATUS = 'transition_only';
export const HERMES_DEFAULT_ADAPTER = 'hermes';
export const HERMES_FREEZE_ORIGIN = 'Hermes.A';
export const CODEX_DEFAULT_ADAPTER = 'host_agent';
export const HERMES_NATIVE_PROOF_ADAPTER = 'hermes_native_proof';
export const CODEX_RUNTIME_SURFACE = 'codex_native_host_agent';
export const CODEX_DEPLOYMENT_HOST = 'codex_local_operator_host';
export const CODEX_DEPLOYMENT_STATUS = 'active_primary';
export const CODEX_DEFAULT_MODEL_SELECTION = 'inherit_local_codex_default';
export const CODEX_DEFAULT_REASONING_SELECTION = 'inherit_local_codex_default';
export const CODEX_FREEZE_ORIGIN = 'P19.A';
export const HERMES_NATIVE_PROOF_RUNTIME_SURFACE = 'hermes_native_full_agent_loop';
export const HERMES_NATIVE_PROOF_DEPLOYMENT_HOST = 'local_hermes_agent_bridge';
export const HERMES_NATIVE_PROOF_DEPLOYMENT_STATUS = 'opt_in_available';
export const HERMES_NATIVE_PROOF_DEFAULT_MODEL_SELECTION = 'inherit_local_hermes_default';
export const HERMES_NATIVE_PROOF_DEFAULT_REASONING_SELECTION = 'inherit_local_hermes_default';
export const HERMES_NATIVE_PROOF_FREEZE_ORIGIN = 'Hermes.Proof.A';

const HERMES_RUNTIME_TOPOLOGY = Object.freeze({
  schema_version: 1,
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

const CODEX_RUNTIME_TOPOLOGY = Object.freeze({
  schema_version: 1,
  runtime_substrate_owner: 'Codex CLI',
  runtime_substrate_surface: CODEX_RUNTIME_SURFACE,
  deployment_host: CODEX_DEPLOYMENT_HOST,
  deployment_host_status: CODEX_DEPLOYMENT_STATUS,
  gateway_role: 'visual_deliverable_domain_gateway',
  domain_harness_os: 'RedCube Domain Harness OS',
  family_pack_boundary: 'family_profile_pack_harness_execution',
  product_mode: 'auto_only',
  default_formal_entry: 'CLI',
  supported_protocol_layer: ['MCP'],
  internal_controller_surface: 'controller',
  controller_repo_verified: false,
});

const HERMES_NATIVE_PROOF_RUNTIME_TOPOLOGY = Object.freeze({
  schema_version: 1,
  runtime_substrate_owner: HERMES_SUBSTRATE_OWNER,
  runtime_substrate_surface: HERMES_NATIVE_PROOF_RUNTIME_SURFACE,
  deployment_host: HERMES_NATIVE_PROOF_DEPLOYMENT_HOST,
  deployment_host_status: HERMES_NATIVE_PROOF_DEPLOYMENT_STATUS,
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
      requires_human_confirmation: error.requiresHumanConfirmation === true,
      requires_external_secret: error.requiresExternalSecret === true,
    };
  }
  return {
    code: null,
    message: error instanceof Error ? error.message : String(error),
    requires_human_confirmation: false,
    requires_external_secret: false,
  };
}

export function buildHermesRuntimeTopology() {
  return {
    ...HERMES_RUNTIME_TOPOLOGY,
    supported_protocol_layer: [...HERMES_RUNTIME_TOPOLOGY.supported_protocol_layer],
  };
}

export function buildCodexRuntimeTopology() {
  return {
    ...CODEX_RUNTIME_TOPOLOGY,
    supported_protocol_layer: [...CODEX_RUNTIME_TOPOLOGY.supported_protocol_layer],
  };
}

export function buildHermesNativeProofRuntimeTopology() {
  return {
    ...HERMES_NATIVE_PROOF_RUNTIME_TOPOLOGY,
    supported_protocol_layer: [...HERMES_NATIVE_PROOF_RUNTIME_TOPOLOGY.supported_protocol_layer],
  };
}

export function normalizeCodexAdapter(adapter = CODEX_DEFAULT_ADAPTER) {
  const requested = String(adapter || '').trim();
  if (!requested || requested === CODEX_DEFAULT_ADAPTER || requested === HERMES_DEFAULT_ADAPTER) {
    return CODEX_DEFAULT_ADAPTER;
  }
  throw new Error(`Unsupported executor adapter: ${requested}`);
}

export function normalizeHermesAdapter(adapter = HERMES_DEFAULT_ADAPTER) {
  const requested = String(adapter || '').trim();
  if (!requested || requested === 'host_agent' || requested === HERMES_DEFAULT_ADAPTER) {
    return HERMES_DEFAULT_ADAPTER;
  }
  throw new Error(`Unsupported executor adapter: ${requested}`);
}

export function buildHermesExecutionModel({ adapter = HERMES_DEFAULT_ADAPTER } = {}) {
  const requestedAdapter = String(adapter || '').trim() || HERMES_DEFAULT_ADAPTER;
  normalizeHermesAdapter(requestedAdapter);
  return {
    mainline_adapter: HERMES_DEFAULT_ADAPTER,
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
  return {
    mainline_adapter: CODEX_DEFAULT_ADAPTER,
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

export function buildHermesNativeProofExecutionModel({ adapter = HERMES_NATIVE_PROOF_ADAPTER } = {}) {
  const requestedAdapter = String(adapter || '').trim() || HERMES_NATIVE_PROOF_ADAPTER;
  if (requestedAdapter !== HERMES_NATIVE_PROOF_ADAPTER) {
    throw new Error(`Unsupported executor adapter: ${requestedAdapter}`);
  }
  return {
    mainline_adapter: HERMES_NATIVE_PROOF_ADAPTER,
    primary_surface: HERMES_NATIVE_PROOF_RUNTIME_SURFACE,
    adapter_role: 'opt_in_proof_executor',
    runtime_substrate_owner: HERMES_SUBSTRATE_OWNER,
    deployment_host: HERMES_NATIVE_PROOF_DEPLOYMENT_HOST,
    deployment_host_status: HERMES_NATIVE_PROOF_DEPLOYMENT_STATUS,
    requested_adapter: requestedAdapter,
    default_model_selection: HERMES_NATIVE_PROOF_DEFAULT_MODEL_SELECTION,
    default_reasoning_effort: HERMES_NATIVE_PROOF_DEFAULT_REASONING_SELECTION,
    freeze_origin_milestone: HERMES_NATIVE_PROOF_FREEZE_ORIGIN,
  };
}

export function buildHermesExecutorDescriptor({ adapter = HERMES_DEFAULT_ADAPTER } = {}) {
  const requestedAdapter = String(adapter || '').trim() || HERMES_DEFAULT_ADAPTER;
  const normalizedAdapter = normalizeHermesAdapter(requestedAdapter);
  const executionModel = buildHermesExecutionModel({ adapter: requestedAdapter });
  return {
    adapter: normalizedAdapter,
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
    requested_adapter: requestedAdapter,
    primary: true,
    execution_surface: CODEX_RUNTIME_SURFACE,
    creative_execution: 'agent_first_director_first',
    runtime_topology: buildCodexRuntimeTopology(),
    execution_model: executionModel,
  };
}

export function buildHermesNativeProofExecutorDescriptor({ adapter = HERMES_NATIVE_PROOF_ADAPTER } = {}) {
  const requestedAdapter = String(adapter || '').trim() || HERMES_NATIVE_PROOF_ADAPTER;
  if (requestedAdapter !== HERMES_NATIVE_PROOF_ADAPTER) {
    throw new Error(`Unsupported executor adapter: ${requestedAdapter}`);
  }
  const executionModel = buildHermesNativeProofExecutionModel({ adapter: requestedAdapter });
  return {
    adapter: HERMES_NATIVE_PROOF_ADAPTER,
    requested_adapter: requestedAdapter,
    primary: false,
    execution_surface: HERMES_NATIVE_PROOF_RUNTIME_SURFACE,
    creative_execution: 'agent_first_director_first',
    runtime_topology: buildHermesNativeProofRuntimeTopology(),
    execution_model: executionModel,
  };
}

function resolveRuntimeTopologyForExecutor(executor) {
  const mainlineAdapter = String(
    executor?.execution_model?.mainline_adapter
    || executor?.adapter
    || '',
  ).trim();
  if (mainlineAdapter === CODEX_DEFAULT_ADAPTER) {
    return buildCodexRuntimeTopology();
  }
  if (mainlineAdapter === HERMES_NATIVE_PROOF_ADAPTER) {
    return buildHermesNativeProofRuntimeTopology();
  }
  return buildHermesRuntimeTopology();
}

export {
  generateStructuredArtifactViaHermesNativeProof,
  probeHermesNativeProof,
  readHermesNativeProofContract,
} from './hermes-native-proof-client.js';

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
}) {
  const run = loadHermesRun({ workspaceRoot, runId });
  const completedRun = {
    ...run,
    status: 'completed',
    finished_at: new Date().toISOString(),
    current_stage: currentStage,
    stage_results: stageResults,
    artifact_refs: artifactRefs,
    error_kind: null,
    runtime_topology: resolveRuntimeTopologyForExecutor(executor || run?.executor),
    executor: executor || run?.executor,
  };
  completedRun.telemetry = buildRunTelemetry(
    completedRun,
    executor || run?.executor,
    'completed',
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
}) {
  const run = loadHermesRun({ workspaceRoot, runId });
  const failedRun = {
    ...run,
    status: 'failed',
    finished_at: new Date().toISOString(),
    current_stage: currentStage,
    error_kind: errorKind,
    runtime_topology: resolveRuntimeTopologyForExecutor(executor || run?.executor),
    executor: executor || run?.executor,
    error: normalizeError(error),
  };
  failedRun.telemetry = buildRunTelemetry(
    failedRun,
    executor || run?.executor,
    'failed',
    failedRun.finished_at,
  );

  writeFileSync(runFile(workspaceRoot, runId), JSON.stringify(failedRun, null, 2), 'utf-8');
  return failedRun;
}

export function loadHermesRun({ workspaceRoot, runId }) {
  const file = runFile(workspaceRoot, runId);
  if (!existsSync(file)) {
    throw new Error(`Run not found: ${runId}`);
  }

  return JSON.parse(readFileSync(file, 'utf-8'));
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
