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

export interface HermesExecutionModel {
  mainline_adapter: 'hermes';
  primary_surface: 'hermes_backed_runtime_substrate';
  adapter_role: 'primary_creative_executor' | 'optional_compatibility_adapter';
  agent_first_requires_external_llm: false;
  external_llm_role: 'optional_compatibility_adapter';
  runtime_substrate_owner: 'Hermes';
  deployment_host: 'codex_default_host_agent_bridge';
  deployment_host_status: 'transition_only';
  requested_adapter: string;
  freeze_origin_milestone: 'Hermes.A';
}

export interface HermesExecutorDescriptor {
  adapter: 'hermes' | 'external_llm';
  requested_adapter: string;
  primary: boolean;
  execution_surface: 'hermes_backed_runtime_substrate' | 'external_llm_adapter';
  creative_execution: 'agent_first_director_first' | 'compatibility_adapter_only';
  external_llm_role: 'optional_compatibility_adapter';
  compatibility_role: null | 'optional_compatibility_adapter';
  runtime_topology: HermesRuntimeTopology;
  execution_model: HermesExecutionModel;
}

export declare const HERMES_SUBSTRATE_OWNER: 'Hermes';
export declare const HERMES_RUNTIME_SURFACE: 'hermes_backed_runtime_substrate';
export declare const HERMES_DEPLOYMENT_HOST: 'codex_default_host_agent_bridge';
export declare const HERMES_DEPLOYMENT_STATUS: 'transition_only';
export declare const HERMES_DEFAULT_ADAPTER: 'hermes';
export declare const HERMES_COMPATIBILITY_ADAPTER: 'external_llm';
export declare const HERMES_FREEZE_ORIGIN: 'Hermes.A';

export declare function buildHermesRuntimeTopology(): HermesRuntimeTopology;
export declare function normalizeHermesAdapter(adapter?: string): 'hermes' | 'external_llm';
export declare function buildHermesExecutionModel(options?: { adapter?: string }): HermesExecutionModel;
export declare function buildHermesExecutorDescriptor(options?: { adapter?: string }): HermesExecutorDescriptor;
export declare function createHermesCreativeSource(options?: Record<string, unknown>): Record<string, unknown>;
export declare function createHermesCreativeExecution(options?: Record<string, unknown>): Record<string, unknown>;
export declare function createHermesReviewExecution(options?: Record<string, unknown>): Record<string, unknown>;
export declare function startHermesRun(options: Record<string, unknown>): Record<string, unknown>;
export declare function completeHermesRun(options: Record<string, unknown>): Record<string, unknown>;
export declare function failHermesRun(options: Record<string, unknown>): Record<string, unknown>;
export declare function loadHermesRun(options: Record<string, unknown>): Record<string, unknown>;
export declare function appendHermesEvent(workspaceRoot: string, runId: string, event: Record<string, unknown>): void;
export declare function readHermesEvents(workspaceRoot: string, runId: string): Array<Record<string, unknown>>;
