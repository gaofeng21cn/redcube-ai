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
