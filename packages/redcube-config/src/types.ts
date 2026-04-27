export interface RedcubeIdentityProfile {
  displayName?: string;
  signatureDisplay?: string;
  signatureSubtitle?: string;
  brandSubtitle?: string;
  [key: string]: unknown;
}

export interface RedcubeIdentityRouting {
  medicalProfileId?: string;
  generalProfileId?: string;
  [key: string]: unknown;
}

export interface RedcubeIdentityConfig {
  defaultProfileId: string;
  routing: RedcubeIdentityRouting;
  profiles: Record<string, RedcubeIdentityProfile>;
  [key: string]: unknown;
}

export interface RedcubeRuntimeExplicitConfig {
  rootDir?: string;
  workspaceRoot?: string;
  promptsDir?: string;
}

export interface RedcubeRuntimeConfigOptions {
  cwd?: string;
  env?: Record<string, string | undefined>;
  explicit?: RedcubeRuntimeExplicitConfig;
  homeDir?: string;
}

export interface RedcubeRuntimeConfigSources {
  rootDir: string;
  workspaceRoot: string;
  promptsDir: string;
}

export interface RedcubeRuntimeConfigDirs {
  defaultsDir: string;
  localDir: string;
  userDir: string;
  workspaceConfigDir: string;
}

export interface RedcubeRuntimeConfig {
  rootDir: string;
  workspaceRoot: string;
  promptsDir: string;
  identity: RedcubeIdentityConfig;
  sources: RedcubeRuntimeConfigSources;
  configDirs: RedcubeRuntimeConfigDirs;
}

export type RedcubeExecutorBackend = 'codex_cli' | 'hermes_agent';
export type RedcubeExecutionShape = 'structured_call' | 'agent_loop';
export type RedcubeExecutorResolutionSource =
  | 'request_explicit_executor'
  | 'opl_runtime_manager_default_executor'
  | 'domain_local_user_config'
  | 'domain_builtin_default';

export interface RedcubeExecutorSelection {
  executor_backend: RedcubeExecutorBackend;
  execution_shape: RedcubeExecutionShape;
  adapter: string;
  source: RedcubeExecutorResolutionSource;
  hermes_profile?: string | null;
}

export interface RedcubeStructuredCallRoutePolicy {
  executor_backend: RedcubeExecutorBackend;
  execution_shape: 'structured_call';
  hermes_profile?: string;
  fallback?: 'inherit_effective_default_executor' | 'fail_closed';
  failure_policy?: 'fallback_with_proof' | 'fail_closed';
}

export interface RedcubeStructuredCallRoutingConfig {
  enabled?: boolean;
  default_on_missing?: 'inherit_effective_default_executor';
  routes?: Record<string, RedcubeStructuredCallRoutePolicy>;
}

export interface RedcubeExecutorRoutingConfig {
  schema_version: 1;
  default_executor?: {
    executor_backend?: RedcubeExecutorBackend;
    execution_shape?: RedcubeExecutionShape;
    hermes_profile?: string;
  };
  structured_call_routing?: RedcubeStructuredCallRoutingConfig;
}

export interface RedcubeExecutorRoutingConfigResult {
  config: RedcubeExecutorRoutingConfig;
  source_files: string[];
  checked_files: string[];
  runtime_state_config_file: string;
}

export interface RedcubeExecutorRoutingResolutionRequest {
  family: string;
  profileId?: string | null;
  route: string;
  requestExecutorBackend?: string | null;
  requestAdapter?: string | null;
  oplDefaultExecutorBackend?: string | null;
  env?: Record<string, string | undefined>;
  cwd?: string;
  homeDir?: string;
  config?: RedcubeExecutorRoutingConfig | null;
}

export interface RedcubeExecutorRoutingResolution {
  schema_version: 1;
  resolution_kind: 'redcube_executor_routing';
  family: string;
  profile_id: string | null;
  route: string;
  route_key_candidates: string[];
  matched_route_key: string | null;
  effective_default_executor: RedcubeExecutorSelection;
  selected_executor: RedcubeExecutorSelection;
  structured_call_routing: {
    enabled: boolean;
    default_on_missing: 'inherit_effective_default_executor';
    route_matched: boolean;
    fallback: 'inherit_effective_default_executor' | 'fail_closed';
    failure_policy: 'fallback_with_proof' | 'fail_closed';
  };
  config_source_files: string[];
}

export interface RedcubePrivateProfileOptions {
  configHome?: string;
  env?: Record<string, string | undefined>;
  homeDir?: string;
  force?: boolean;
  sourceSystemDir?: string;
  bundleFile?: string;
}

export interface RedcubePrivateProfileResult {
  ok: true;
  configHome: string;
  promptsDir?: string;
  sourceSystemDir?: string;
  profiles?: string[];
  bundleFile?: string;
}

export interface RedcubeWorkspaceAuthorTemplateRequest {
  workspaceRoot: string;
}

export interface RedcubeWorkspaceAuthorTemplateResult {
  config_dir: string;
  runtime_file: string;
  identity_file: string;
  readme_file: string;
  author_library_file: string;
}

export interface RedcubeWorkspaceAuthorProfileRequest {
  workspaceRoot: string;
  taskTitle?: string;
  projectTitle?: string;
  rawMaterials?: string;
  promptFile?: string;
  configCwd?: string;
  env?: Record<string, string | undefined>;
}

export interface RedcubeWorkspaceAuthorProfile {
  profile_id: string;
  account_name: string;
  signature_display: string;
  signature_subtitle: string;
  content_strategy: string;
  style_traits: string;
  narrative_focus: string;
  title_preference: string;
  taboo: string;
  origin: 'author_library' | 'identity_fallback';
  config_scope: 'workspace' | 'user' | 'repo_local' | 'repo_default';
  author_library_file: string | null;
  branding_rules: string[];
}
