export interface HermesRuntimeTopology {
  schema_version: 1;
  executor_backend: 'hermes_agent';
  execution_shape: 'agent_loop';
  runtime_substrate_owner: 'Hermes';
  runtime_substrate_surface: 'hermes_backed_runtime_substrate';
  deployment_host: 'codex_default_host_agent_bridge';
  deployment_host_status: 'transition_only';
  gateway_role: 'visual_deliverable_domain_gateway';
  domain_harness_os: 'RedCube Domain Harness OS';
  family_pack_boundary: 'family_profile_pack_harness_execution';
  product_mode: 'auto_only';
  default_formal_entry: 'CLI';
  supported_protocol_layer: ['MCP'];
  internal_controller_surface: 'controller';
  controller_repo_verified: false;
}

export interface CodexRuntimeTopology {
  schema_version: 1;
  executor_backend: 'codex_cli';
  execution_shape: 'structured_call';
  runtime_substrate_owner: 'Codex CLI';
  runtime_substrate_surface: 'codex_native_host_agent';
  deployment_host: 'codex_local_operator_host';
  deployment_host_status: 'active_primary';
  gateway_role: 'visual_deliverable_domain_gateway';
  domain_harness_os: 'RedCube Domain Harness OS';
  family_pack_boundary: 'family_profile_pack_harness_execution';
  product_mode: 'auto_only';
  default_formal_entry: 'CLI';
  supported_protocol_layer: ['MCP'];
  internal_controller_surface: 'controller';
  controller_repo_verified: false;
}

export interface HermesNativeProofRuntimeTopology {
  schema_version: 1;
  executor_backend: 'hermes_agent';
  execution_shape: 'agent_loop';
  runtime_substrate_owner: 'Hermes';
  runtime_substrate_surface: 'hermes_native_full_agent_loop';
  deployment_host: 'local_hermes_agent_bridge';
  deployment_host_status: 'opt_in_available';
  gateway_role: 'visual_deliverable_domain_gateway';
  domain_harness_os: 'RedCube Domain Harness OS';
  family_pack_boundary: 'family_profile_pack_harness_execution';
  product_mode: 'auto_only';
  default_formal_entry: 'CLI';
  supported_protocol_layer: ['MCP'];
  internal_controller_surface: 'controller';
  controller_repo_verified: false;
}

export interface HermesExecutionModel {
  mainline_adapter: 'hermes';
  executor_backend: 'hermes_agent';
  execution_shape: 'agent_loop';
  primary_surface: 'hermes_backed_runtime_substrate';
  adapter_role: 'primary_creative_executor';
  runtime_substrate_owner: 'Hermes';
  deployment_host: 'codex_default_host_agent_bridge';
  deployment_host_status: 'transition_only';
  requested_adapter: string;
  freeze_origin_milestone: 'Hermes.A';
}

export interface HermesExecutorDescriptor {
  adapter: 'hermes';
  executor_backend: 'hermes_agent';
  execution_shape: 'agent_loop';
  requested_adapter: string;
  primary: true;
  execution_surface: 'hermes_backed_runtime_substrate';
  creative_execution: 'agent_first_director_first';
  runtime_topology: HermesRuntimeTopology;
  execution_model: HermesExecutionModel;
}

export interface CodexExecutionModel {
  mainline_adapter: 'host_agent';
  executor_backend: 'codex_cli';
  execution_shape: 'structured_call';
  primary_surface: 'codex_native_host_agent';
  adapter_role: 'primary_creative_executor';
  runtime_substrate_owner: 'Codex CLI';
  deployment_host: 'codex_local_operator_host';
  deployment_host_status: 'active_primary';
  requested_adapter: string;
  default_model_selection: string;
  default_reasoning_effort: string;
  freeze_origin_milestone: 'P19.A';
}

export interface HermesNativeProofExecutionModel {
  mainline_adapter: 'hermes_native_proof';
  executor_backend: 'hermes_agent';
  execution_shape: 'agent_loop';
  primary_surface: 'hermes_native_full_agent_loop';
  adapter_role: 'opt_in_proof_executor';
  runtime_substrate_owner: 'Hermes';
  deployment_host: 'local_hermes_agent_bridge';
  deployment_host_status: 'opt_in_available';
  requested_adapter: string;
  default_model_selection: string;
  default_reasoning_effort: string;
  freeze_origin_milestone: 'Hermes.Proof.A';
}

export interface CodexExecutorDescriptor {
  adapter: 'host_agent';
  executor_backend: 'codex_cli';
  execution_shape: 'structured_call';
  requested_adapter: string;
  primary: true;
  execution_surface: 'codex_native_host_agent';
  creative_execution: 'agent_first_director_first';
  runtime_topology: CodexRuntimeTopology;
  execution_model: CodexExecutionModel;
}

export interface HermesNativeProofExecutorDescriptor {
  adapter: 'hermes_native_proof';
  executor_backend: 'hermes_agent';
  execution_shape: 'agent_loop';
  requested_adapter: string;
  primary: false;
  execution_surface: 'hermes_native_full_agent_loop';
  creative_execution: 'agent_first_director_first';
  runtime_topology: HermesNativeProofRuntimeTopology;
  execution_model: HermesNativeProofExecutionModel;
}

export {
  CODEX_DEFAULT_ADAPTER,
  CODEX_DEFAULT_MODEL_SELECTION,
  CODEX_DEFAULT_REASONING_SELECTION,
  CODEX_DEPLOYMENT_HOST,
  CODEX_DEPLOYMENT_STATUS,
  CODEX_EXECUTOR_BACKEND,
  CODEX_FREEZE_ORIGIN,
  CODEX_RUNTIME_SURFACE,
  AGENT_LOOP_EXECUTION_SHAPE,
  HERMES_DEFAULT_ADAPTER,
  HERMES_AGENT_EXECUTOR_BACKEND,
  HERMES_DEPLOYMENT_HOST,
  HERMES_DEPLOYMENT_STATUS,
  HERMES_FREEZE_ORIGIN,
  HERMES_NATIVE_PROOF_ADAPTER,
  HERMES_NATIVE_PROOF_DEFAULT_MODEL_SELECTION,
  HERMES_NATIVE_PROOF_DEFAULT_REASONING_SELECTION,
  HERMES_NATIVE_PROOF_DEPLOYMENT_HOST,
  HERMES_NATIVE_PROOF_DEPLOYMENT_STATUS,
  HERMES_NATIVE_PROOF_FREEZE_ORIGIN,
  HERMES_NATIVE_PROOF_RUNTIME_SURFACE,
  HERMES_RUNTIME_SURFACE,
  HERMES_SUBSTRATE_OWNER,
  RUNNING_RUN_STALE_TTL_MS,
  STRUCTURED_CALL_EXECUTION_SHAPE,
  appendHermesEvent,
  buildCodexExecutionModel,
  buildCodexExecutorDescriptor,
  buildCodexRuntimeTopology,
  buildExecutorBackendContract,
  buildHermesExecutionModel,
  buildHermesExecutorDescriptor,
  buildHermesNativeProofExecutionModel,
  buildHermesNativeProofExecutorDescriptor,
  buildHermesNativeProofRuntimeTopology,
  buildHermesRuntimeTopology,
  completeHermesRun,
  createHermesCreativeExecution,
  createHermesCreativeSource,
  createHermesReviewExecution,
  failHermesRun,
  generateStructuredArtifactViaHermesAgentApi,
  generateStructuredArtifactViaHermesAgentStructuredCall,
  generateStructuredArtifactViaHermesNativeProof,
  loadHermesRun,
  normalizeCodexAdapter,
  normalizeExecutorBackend,
  normalizeHermesAdapter,
  probeHermesNativeProof,
  readHermesEvents,
  readHermesNativeProofContract,
  runAgentLoopViaHermesAgentApi,
  startHermesRun,
  structuredCallViaHermesAgentApi,
} from './index.impl.js';
