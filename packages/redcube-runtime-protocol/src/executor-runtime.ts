// @ts-nocheck
import {
  buildCodexRuntimeTopology as buildProtocolCodexRuntimeTopology,
} from './runtime-topology.js';
import {
  completeRouteRun as completeRouteRunFromRouteRunRecords,
  failRouteRun as failRouteRunFromRouteRunRecords,
  startRouteRun as startRouteRunFromRouteRunRecords,
} from './executor-runtime-parts/route-run-records.js';

const HERMES_SUBSTRATE_OWNER = 'Hermes';
export const HERMES_RUNTIME_SURFACE = 'hermes_agent_api_server';
const HERMES_DEPLOYMENT_HOST = 'codex_cli_operator_bridge';
const HERMES_DEPLOYMENT_STATUS = 'transition_only';
export const CODEX_EXECUTOR_BACKEND = 'codex_cli';
export const HERMES_AGENT_EXECUTOR_BACKEND = 'hermes_agent';
export const CODEX_DEFAULT_ADAPTER = CODEX_EXECUTOR_BACKEND;
export const HERMES_AGENT_ADAPTER = HERMES_AGENT_EXECUTOR_BACKEND;
const HERMES_FREEZE_ORIGIN = 'Hermes.A';
export const STRUCTURED_CALL_EXECUTION_SHAPE = 'structured_call';
export const AGENT_LOOP_EXECUTION_SHAPE = 'agent_loop';
export const CODEX_RUNTIME_SURFACE = 'codex_cli_runtime';
const CODEX_DEPLOYMENT_HOST = 'codex_local_operator_host';
const CODEX_DEPLOYMENT_STATUS = 'active_primary';
export const CODEX_DEFAULT_MODEL_SELECTION = 'inherit_local_codex_default';
export const CODEX_DEFAULT_REASONING_SELECTION = 'inherit_local_codex_default';
const CODEX_FREEZE_ORIGIN = 'P19.A';
export const HERMES_AGENT_LOOP_RUNTIME_SURFACE = 'hermes_agent_loop';
const HERMES_AGENT_LOOP_DEPLOYMENT_HOST = 'local_hermes_agent_bridge';
const HERMES_AGENT_LOOP_DEPLOYMENT_STATUS = 'opt_in_available';
const HERMES_AGENT_LOOP_DEFAULT_MODEL_SELECTION = 'inherit_local_hermes_default';
const HERMES_AGENT_LOOP_DEFAULT_REASONING_SELECTION = 'inherit_local_hermes_default';
const HERMES_AGENT_LOOP_FREEZE_ORIGIN = 'Hermes.Proof.A';
const OPL_EXECUTOR_ADAPTER_RECEIPT_SOURCE = 'opl_executor_adapter_receipt';
const OPL_HOSTED_HERMES_AGENT_LOOP_REFERENCE = 'opl_hosted:hermes_agent_loop';
const OPL_RUNTIME_MANAGER_OWNER = 'OPL Runtime Manager';
const OPL_RUNTIME_MANAGER_RUNTIME_OWNER = 'opl_runtime_manager';
const RCA_VISUAL_DELIVERABLE_RUNTIME_OWNER = 'redcube_ai_visual_deliverable_runtime';
const RCA_REVIEW_EXPORT_GATE_OWNER = 'redcube_ai';

export type CodexExecutionModel = ReturnType<typeof buildCodexExecutionModel>;
export type HermesAgentLoopExecutionModel = ReturnType<typeof buildHermesAgentLoopExecutionModel>;

const ROUTE_RUN_RECORD_RUNTIME_DEPS = Object.freeze({ resolveRuntimeTopologyForExecutor });

const HERMES_RUNTIME_TOPOLOGY = Object.freeze({
  schema_version: 1,
  executor_backend: HERMES_AGENT_EXECUTOR_BACKEND,
  execution_shape: AGENT_LOOP_EXECUTION_SHAPE,
  runtime_substrate_owner: HERMES_SUBSTRATE_OWNER,
  runtime_substrate_surface: HERMES_RUNTIME_SURFACE,
  deployment_host: HERMES_DEPLOYMENT_HOST,
  deployment_host_status: HERMES_DEPLOYMENT_STATUS,
  domain_entry_protocol_role: 'visual_deliverable_domain_entry_protocol_boundary',
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
  runtime_substrate_owner: OPL_RUNTIME_MANAGER_OWNER,
  runtime_substrate_surface: HERMES_AGENT_LOOP_RUNTIME_SURFACE,
  deployment_host: HERMES_AGENT_LOOP_DEPLOYMENT_HOST,
  deployment_host_status: HERMES_AGENT_LOOP_DEPLOYMENT_STATUS,
  domain_entry_protocol_role: 'visual_deliverable_domain_entry_protocol_boundary',
  domain_harness_os: 'RedCube Domain Harness OS',
  family_pack_boundary: 'family_profile_pack_harness_execution',
  product_mode: 'auto_only',
  default_formal_entry: 'CLI',
  supported_protocol_layer: ['MCP'],
  internal_controller_surface: 'controller',
  controller_repo_verified: false,
});

function buildOplExecutorAdapterReceipt({
  adapter = HERMES_AGENT_ADAPTER,
  runtimeSurface = HERMES_AGENT_LOOP_RUNTIME_SURFACE,
  hostedAdapterReference = OPL_HOSTED_HERMES_AGENT_LOOP_REFERENCE,
} = {}) {
  return {
    source: OPL_EXECUTOR_ADAPTER_RECEIPT_SOURCE,
    owner: OPL_RUNTIME_MANAGER_RUNTIME_OWNER,
    hosted_adapter_reference: hostedAdapterReference,
    adapter,
    selected_executor_backend: adapter,
    runtime_surface: runtimeSurface,
    domain_truth_owner: RCA_VISUAL_DELIVERABLE_RUNTIME_OWNER,
    review_export_gate_owner: RCA_REVIEW_EXPORT_GATE_OWNER,
    activation: 'explicit_opt_in_only',
    auditability: 'receipt_backed',
    failure_mode: 'fail_closed',
    effect_equivalence_guaranteed: false,
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

export function buildHermesRuntimeTopology() {
  return {
    ...HERMES_RUNTIME_TOPOLOGY,
    supported_protocol_layer: [...HERMES_RUNTIME_TOPOLOGY.supported_protocol_layer],
  };
}

function buildCodexRuntimeTopology() {
  return buildProtocolCodexRuntimeTopology();
}

function buildHermesAgentLoopRuntimeTopology() {
  return {
    ...HERMES_AGENT_LOOP_RUNTIME_TOPOLOGY,
    supported_protocol_layer: [...HERMES_AGENT_LOOP_RUNTIME_TOPOLOGY.supported_protocol_layer],
  };
}

function normalizeCodexAdapter(adapter = CODEX_DEFAULT_ADAPTER) {
  const requested = String(adapter || '').trim();
  if (!requested || requested === CODEX_DEFAULT_ADAPTER) {
    return CODEX_DEFAULT_ADAPTER;
  }
  throw new Error(`Unsupported executor adapter: ${requested}`);
}

function normalizeHermesAdapter(adapter = HERMES_AGENT_ADAPTER) {
  const requested = String(adapter || '').trim();
  if (!requested || requested === HERMES_AGENT_ADAPTER || requested === HERMES_AGENT_EXECUTOR_BACKEND) {
    return HERMES_AGENT_ADAPTER;
  }
  throw new Error(`Unsupported executor adapter: ${requested}`);
}

export function buildHermesExecutionModel({ adapter = HERMES_AGENT_ADAPTER } = {}) {
  const requestedAdapter = String(adapter || '').trim() || HERMES_AGENT_ADAPTER;
  normalizeHermesAdapter(requestedAdapter);
  const backendContract = buildExecutorBackendContract({ adapter: HERMES_AGENT_ADAPTER });
  return {
    mainline_adapter: HERMES_AGENT_ADAPTER,
    executor_backend: backendContract.executor_backend,
    execution_shape: backendContract.execution_shape,
    primary_surface: HERMES_RUNTIME_SURFACE,
    adapter_role: 'primary_creative_executor',
    runtime_substrate_owner: HERMES_SUBSTRATE_OWNER,
    deployment_host: HERMES_DEPLOYMENT_HOST,
    deployment_host_status: HERMES_DEPLOYMENT_STATUS,
    requested_adapter: requestedAdapter || HERMES_AGENT_ADAPTER,
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
  const oplExecutorAdapterReceipt = buildOplExecutorAdapterReceipt();
  return {
    mainline_adapter: HERMES_AGENT_ADAPTER,
    executor_backend: backendContract.executor_backend,
    execution_shape: backendContract.execution_shape,
    primary_surface: HERMES_AGENT_LOOP_RUNTIME_SURFACE,
    adapter_role: 'opl_hosted_executor_adapter_proof',
    runtime_substrate_owner: OPL_RUNTIME_MANAGER_OWNER,
    deployment_host: HERMES_AGENT_LOOP_DEPLOYMENT_HOST,
    deployment_host_status: HERMES_AGENT_LOOP_DEPLOYMENT_STATUS,
    requested_adapter: requestedAdapter,
    default_model_selection: HERMES_AGENT_LOOP_DEFAULT_MODEL_SELECTION,
    default_reasoning_effort: HERMES_AGENT_LOOP_DEFAULT_REASONING_SELECTION,
    freeze_origin_milestone: HERMES_AGENT_LOOP_FREEZE_ORIGIN,
    opl_executor_adapter_receipt: oplExecutorAdapterReceipt,
  };
}

export function buildHermesExecutorDescriptor({ adapter = HERMES_AGENT_ADAPTER } = {}) {
  const requestedAdapter = String(adapter || '').trim() || HERMES_AGENT_ADAPTER;
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
    opl_executor_adapter_receipt: executionModel.opl_executor_adapter_receipt,
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
  appendRouteRunEvent,
  loadRouteRun,
  readRouteRunEvents,
} from './executor-runtime-parts/route-run-records.js';

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
}) {
  return startRouteRunFromRouteRunRecords({
    workspaceRoot,
    runId,
    route,
    overlay,
    scope,
    target,
    topicId,
    deliverableId,
    baselineDeliverableId,
    executor,
    crossProviderAttemptIndex,
    allowLocalDiagnosticRecord,
  }, ROUTE_RUN_RECORD_RUNTIME_DEPS);
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
}) {
  return completeRouteRunFromRouteRunRecords({
    workspaceRoot,
    runId,
    currentStage,
    stageResults,
    artifactRefs,
    executor,
    telemetry,
    status,
    errorKind,
    crossProviderAttemptIndex,
  }, ROUTE_RUN_RECORD_RUNTIME_DEPS);
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
}) {
  return failRouteRunFromRouteRunRecords({
    workspaceRoot,
    runId,
    currentStage,
    error,
    errorKind,
    executor,
    telemetry,
    status,
  }, ROUTE_RUN_RECORD_RUNTIME_DEPS);
}
