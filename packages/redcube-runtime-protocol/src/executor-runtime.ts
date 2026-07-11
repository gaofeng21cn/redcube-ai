import {
  buildCodexRuntimeTopology,
} from './runtime-topology.js';

export const CODEX_DEFAULT_ADAPTER = 'codex_cli';
export const CODEX_DEFAULT_MODEL_SELECTION = 'inherit_local_codex_default';
export const CODEX_DEFAULT_REASONING_SELECTION = 'inherit_local_codex_default';
export const CODEX_RUNTIME_SURFACE = 'codex_cli_runtime';

const CODEX_DEPLOYMENT_HOST = 'codex_local_operator_host';
const CODEX_DEPLOYMENT_STATUS = 'active_primary';
const CODEX_FREEZE_ORIGIN = 'P19.A';

export type CodexExecutionModel = ReturnType<typeof buildCodexExecutionModel>;

function buildExecutorAdapterOwnerBoundary() {
  return {
    generic_executor_adapter_owner: 'one-person-lab',
    concrete_executor_host: 'Codex CLI',
    executor_surface: CODEX_RUNTIME_SURFACE,
    selected_executor_backend: CODEX_DEFAULT_ADAPTER,
    route_executor_policy_owner: 'redcube_ai',
    visual_truth_owner: 'redcube_ai_visual_deliverable_runtime',
    review_export_gate_owner: 'redcube_ai',
    rca_role: 'route_executor_policy_and_receipt_refs_only',
    rca_owns_generic_executor_adapter: false,
    rca_owns_generic_attempt_ledger: false,
    rca_owns_generic_runtime_record_store: false,
    rca_owns_generic_event_log: false,
  } as const;
}

export function buildCodexExecutionModel({ adapter = CODEX_DEFAULT_ADAPTER } = {}) {
  const requestedAdapter = String(adapter || '').trim() || CODEX_DEFAULT_ADAPTER;
  if (requestedAdapter !== CODEX_DEFAULT_ADAPTER) {
    throw new Error(`Unsupported executor adapter: ${requestedAdapter}`);
  }
  return {
    mainline_adapter: CODEX_DEFAULT_ADAPTER,
    executor_backend: CODEX_DEFAULT_ADAPTER,
    execution_shape: 'structured_call',
    primary_surface: CODEX_RUNTIME_SURFACE,
    adapter_role: 'primary_creative_executor',
    runtime_substrate_owner: 'Codex CLI',
    deployment_host: CODEX_DEPLOYMENT_HOST,
    deployment_host_status: CODEX_DEPLOYMENT_STATUS,
    requested_adapter: requestedAdapter,
    default_model_selection: CODEX_DEFAULT_MODEL_SELECTION,
    default_reasoning_effort: CODEX_DEFAULT_REASONING_SELECTION,
    freeze_origin_milestone: CODEX_FREEZE_ORIGIN,
    executor_adapter_owner_boundary: buildExecutorAdapterOwnerBoundary(),
  } as const;
}

export function buildCodexExecutorDescriptor({ adapter = CODEX_DEFAULT_ADAPTER } = {}) {
  const executionModel = buildCodexExecutionModel({ adapter });
  return {
    adapter: CODEX_DEFAULT_ADAPTER,
    executor_backend: CODEX_DEFAULT_ADAPTER,
    execution_shape: 'structured_call',
    requested_adapter: executionModel.requested_adapter,
    primary: true,
    execution_surface: CODEX_RUNTIME_SURFACE,
    creative_execution: 'agent_first_director_first',
    runtime_topology: buildCodexRuntimeTopology(),
    execution_model: executionModel,
  } as const;
}
