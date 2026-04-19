export interface HermesRuntimeTopology {
  schema_version: 1;
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
  requested_adapter: string;
  primary: true;
  execution_surface: 'hermes_backed_runtime_substrate';
  creative_execution: 'agent_first_director_first';
  runtime_topology: HermesRuntimeTopology;
  execution_model: HermesExecutionModel;
}

export interface CodexExecutionModel {
  mainline_adapter: 'host_agent';
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
  requested_adapter: string;
  primary: true;
  execution_surface: 'codex_native_host_agent';
  creative_execution: 'agent_first_director_first';
  runtime_topology: CodexRuntimeTopology;
  execution_model: CodexExecutionModel;
}

export interface HermesNativeProofExecutorDescriptor {
  adapter: 'hermes_native_proof';
  requested_adapter: string;
  primary: false;
  execution_surface: 'hermes_native_full_agent_loop';
  creative_execution: 'agent_first_director_first';
  runtime_topology: HermesNativeProofRuntimeTopology;
  execution_model: HermesNativeProofExecutionModel;
}

export declare const HERMES_SUBSTRATE_OWNER: 'Hermes';
export declare const HERMES_RUNTIME_SURFACE: 'hermes_backed_runtime_substrate';
export declare const HERMES_DEPLOYMENT_HOST: 'codex_default_host_agent_bridge';
export declare const HERMES_DEPLOYMENT_STATUS: 'transition_only';
export declare const HERMES_DEFAULT_ADAPTER: 'hermes';
export declare const HERMES_FREEZE_ORIGIN: 'Hermes.A';
export declare const CODEX_DEFAULT_ADAPTER: 'host_agent';
export declare const HERMES_NATIVE_PROOF_ADAPTER: 'hermes_native_proof';
export declare const CODEX_RUNTIME_SURFACE: 'codex_native_host_agent';
export declare const CODEX_DEPLOYMENT_HOST: 'codex_local_operator_host';
export declare const CODEX_DEPLOYMENT_STATUS: 'active_primary';
export declare const CODEX_DEFAULT_MODEL_SELECTION: 'inherit_local_codex_default';
export declare const CODEX_DEFAULT_REASONING_SELECTION: 'inherit_local_codex_default';
export declare const CODEX_FREEZE_ORIGIN: 'P19.A';
export declare const HERMES_NATIVE_PROOF_RUNTIME_SURFACE: 'hermes_native_full_agent_loop';
export declare const HERMES_NATIVE_PROOF_DEPLOYMENT_HOST: 'local_hermes_agent_bridge';
export declare const HERMES_NATIVE_PROOF_DEPLOYMENT_STATUS: 'opt_in_available';
export declare const HERMES_NATIVE_PROOF_DEFAULT_MODEL_SELECTION: 'inherit_local_hermes_default';
export declare const HERMES_NATIVE_PROOF_DEFAULT_REASONING_SELECTION: 'inherit_local_hermes_default';
export declare const HERMES_NATIVE_PROOF_FREEZE_ORIGIN: 'Hermes.Proof.A';

export declare function buildHermesRuntimeTopology(): HermesRuntimeTopology;
export declare function buildCodexRuntimeTopology(): CodexRuntimeTopology;
export declare function buildHermesNativeProofRuntimeTopology(): HermesNativeProofRuntimeTopology;
export declare function normalizeCodexAdapter(adapter?: string): 'host_agent';
export declare function normalizeHermesAdapter(adapter?: string): 'hermes';
export declare function buildHermesExecutionModel(options?: { adapter?: string }): HermesExecutionModel;
export declare function buildCodexExecutionModel(options?: { adapter?: string }): CodexExecutionModel;
export declare function buildHermesNativeProofExecutionModel(options?: { adapter?: string }): HermesNativeProofExecutionModel;
export declare function buildHermesExecutorDescriptor(options?: { adapter?: string }): HermesExecutorDescriptor;
export declare function buildCodexExecutorDescriptor(options?: { adapter?: string }): CodexExecutorDescriptor;
export declare function buildHermesNativeProofExecutorDescriptor(options?: { adapter?: string }): HermesNativeProofExecutorDescriptor;
export declare function createHermesCreativeSource(options?: Record<string, unknown>): Record<string, unknown>;
export declare function createHermesCreativeExecution(options?: Record<string, unknown>): Record<string, unknown>;
export declare function createHermesReviewExecution(options?: Record<string, unknown>): Record<string, unknown>;
export declare function readHermesNativeProofContract(options?: Record<string, unknown>): Record<string, unknown>;
export declare function probeHermesNativeProof(options?: Record<string, unknown>): Record<string, unknown>;
export declare function generateStructuredArtifactViaHermesNativeProof(options?: Record<string, unknown>): Record<string, unknown>;
export declare function startHermesRun(options: Record<string, unknown>): Record<string, unknown>;
export declare function completeHermesRun(options: Record<string, unknown>): Record<string, unknown>;
export declare function failHermesRun(options: Record<string, unknown>): Record<string, unknown>;
export declare function loadHermesRun(options: Record<string, unknown>): Record<string, unknown>;
export declare function appendHermesEvent(workspaceRoot: string, runId: string, event: Record<string, unknown>): void;
export declare function readHermesEvents(workspaceRoot: string, runId: string): Array<Record<string, unknown>>;
