import os from 'node:os';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type {
  RedcubeIdentityConfig,
  RedcubeExecutorBackend,
  RedcubeExecutionShape,
  RedcubeExecutorRoutingConfig,
  RedcubeExecutorRoutingConfigResult,
  RedcubeExecutorRoutingResolution,
  RedcubeExecutorRoutingResolutionRequest,
  RedcubeExecutorResolutionSource,
  RedcubeExecutorSelection,
  RedcubeStructuredCallRoutePolicy,
  RedcubeRuntimeConfig,
  RedcubeRuntimeConfigOptions,
  RedcubeRuntimeConfigSources,
} from './types.js';

type JsonObject = Record<string, unknown>;
type RuntimeKey = keyof RedcubeRuntimeConfigSources;
type RuntimeState = {
  values: RedcubeRuntimeConfigSources;
  sources: RedcubeRuntimeConfigSources;
};

const RUNTIME_KEYS: RuntimeKey[] = ['rootDir', 'workspaceRoot', 'promptsDir'];
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = path.resolve(MODULE_DIR, '../../../');
const EXECUTOR_ROUTING_FILE = 'executor-routing.json';
const CODEX_DEFAULT_BACKEND = 'codex_cli';
const HERMES_AGENT_BACKEND = 'hermes_agent';
const STRUCTURED_CALL_SHAPE = 'structured_call';
const AGENT_LOOP_SHAPE = 'agent_loop';
const PRODUCTION_ROUTE_LANE = 'production';
const EXPERIMENTAL_PROOF_ROUTE_LANE = 'experimental_proof';
const BUILTIN_EXECUTOR_ROUTING_CONFIG: RedcubeExecutorRoutingConfig = {
  schema_version: 1,
  default_executor: {
    executor_backend: CODEX_DEFAULT_BACKEND,
    execution_shape: STRUCTURED_CALL_SHAPE,
  },
  structured_call_routing: {
    enabled: false,
    default_on_missing: 'inherit_effective_default_executor',
    routes: {},
  },
};

function isPlainObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge<T extends JsonObject>(base: T, extra: unknown): T;
function deepMerge(base: unknown, extra: unknown): unknown;
function deepMerge(base: unknown, extra: unknown): unknown {
  if (!isPlainObject(base)) return isPlainObject(extra) ? { ...extra } : extra;
  if (!isPlainObject(extra)) return { ...base };

  const merged: JsonObject = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    if (isPlainObject(value) && isPlainObject(merged[key])) {
      merged[key] = deepMerge(merged[key], value);
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

function readJsonIfExists(filePath: string): JsonObject | null {
  if (!filePath || !existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, 'utf-8')) as JsonObject;
}

function optionalString(value: unknown): string {
  return String(value || '').trim();
}

function normalizeExecutorBackend(value: unknown, fieldName = 'executor_backend'): RedcubeExecutorBackend {
  const text = optionalString(value);
  if (!text || text === 'codex_cli' || text === CODEX_DEFAULT_BACKEND) return CODEX_DEFAULT_BACKEND;
  if (text === 'hermes_agent' || text === HERMES_AGENT_BACKEND) {
    return HERMES_AGENT_BACKEND;
  }
  throw new Error(`Unsupported RCA executor backend in ${fieldName}: ${text}`);
}

function normalizeExecutionShape(
  value: unknown,
  backend: RedcubeExecutorBackend,
  fieldName = 'execution_shape',
): RedcubeExecutionShape {
  const text = optionalString(value);
  if (!text) return backend === HERMES_AGENT_BACKEND ? AGENT_LOOP_SHAPE : STRUCTURED_CALL_SHAPE;
  if (text === STRUCTURED_CALL_SHAPE || text === AGENT_LOOP_SHAPE) return text;
  throw new Error(`Unsupported RCA execution shape in ${fieldName}: ${text}`);
}

function normalizeStructuredCallRouteLane(value: unknown, fieldName: string): 'production' | 'experimental_proof' {
  const text = optionalString(value);
  if (!text || text === PRODUCTION_ROUTE_LANE) return PRODUCTION_ROUTE_LANE;
  if (text === EXPERIMENTAL_PROOF_ROUTE_LANE) return EXPERIMENTAL_PROOF_ROUTE_LANE;
  throw new Error(`Unsupported RCA structured_call route lane in ${fieldName}: ${text}`);
}

function adapterForBackend(backend: RedcubeExecutorBackend): string {
  return backend === HERMES_AGENT_BACKEND ? HERMES_AGENT_BACKEND : 'codex_cli';
}

function selectionForBackend({
  backend,
  executionShape,
  source,
  hermesProfile = null,
  adapter = null,
}: {
  backend: RedcubeExecutorBackend;
  executionShape?: RedcubeExecutionShape | null;
  source: RedcubeExecutorResolutionSource;
  hermesProfile?: string | null;
  adapter?: string | null;
}): RedcubeExecutorSelection {
  return {
    executor_backend: backend,
    execution_shape: executionShape || normalizeExecutionShape(null, backend),
    adapter: optionalString(adapter) || adapterForBackend(backend),
    source,
    hermes_profile: optionalString(hermesProfile) || null,
  };
}

function selectionForRequestedAdapter(adapter: string): RedcubeExecutorSelection {
  const requested = optionalString(adapter);
  if (!requested || requested === 'codex_cli' || requested === CODEX_DEFAULT_BACKEND) {
    return selectionForBackend({
      backend: CODEX_DEFAULT_BACKEND,
      executionShape: STRUCTURED_CALL_SHAPE,
      source: 'request_explicit_executor',
      adapter: 'codex_cli',
    });
  }
  if (requested === 'hermes_agent' || requested === HERMES_AGENT_BACKEND) {
    return selectionForBackend({
      backend: HERMES_AGENT_BACKEND,
      executionShape: AGENT_LOOP_SHAPE,
      source: 'request_explicit_executor',
      adapter: requested,
    });
  }
  throw new Error(`Unsupported executor adapter: ${requested}`);
}

function runtimeStateExecutorRoutingFile({
  env = process.env,
  homeDir = os.homedir(),
}: {
  env?: Record<string, string | undefined>;
  homeDir?: string;
}): string {
  const codexHome = optionalString(env.CODEX_HOME) || path.join(path.resolve(homeDir), '.codex');
  return path.join(path.resolve(codexHome), 'projects', 'redcube-ai', 'runtime-state', 'config', EXECUTOR_ROUTING_FILE);
}

function normalizeExecutorRoutingConfig(raw: unknown, sourceFile: string): RedcubeExecutorRoutingConfig {
  if (!isPlainObject(raw)) {
    throw new Error(`RCA executor routing config must be a JSON object: ${sourceFile}`);
  }
  const schemaVersion = Number(raw.schema_version ?? 1);
  if (schemaVersion !== 1) {
    throw new Error(`Unsupported RCA executor routing config schema_version in ${sourceFile}: ${schemaVersion}`);
  }
  const config = raw as JsonObject;
  const defaultExecutor = isPlainObject(config.default_executor) ? config.default_executor : {};
  const defaultBackend = normalizeExecutorBackend(
    defaultExecutor.executor_backend,
    `${sourceFile}.default_executor.executor_backend`,
  );
  const defaultExecutionShape = normalizeExecutionShape(
    defaultExecutor.execution_shape,
    defaultBackend,
    `${sourceFile}.default_executor.execution_shape`,
  );
  const structuredCallRouting = isPlainObject(config.structured_call_routing)
    ? config.structured_call_routing
    : {};
  const routes = isPlainObject(structuredCallRouting.routes) ? structuredCallRouting.routes : {};
  const normalizedRoutes: Record<string, RedcubeStructuredCallRoutePolicy> = {};
  for (const [routeKey, routePolicy] of Object.entries(routes)) {
    if (!isPlainObject(routePolicy)) {
      throw new Error(`RCA structured_call route policy must be an object: ${sourceFile}:${routeKey}`);
    }
    const routeBackend = normalizeExecutorBackend(
      routePolicy.executor_backend,
      `${sourceFile}.structured_call_routing.routes.${routeKey}.executor_backend`,
    );
    const routeShape = normalizeExecutionShape(
      routePolicy.execution_shape || STRUCTURED_CALL_SHAPE,
      routeBackend,
      `${sourceFile}.structured_call_routing.routes.${routeKey}.execution_shape`,
    );
    if (routeShape !== STRUCTURED_CALL_SHAPE) {
      throw new Error(`RCA structured_call route policy cannot use execution_shape=${routeShape}: ${sourceFile}:${routeKey}`);
    }
    const oplExecutorAdapterReceipt = isPlainObject(routePolicy.opl_executor_adapter_receipt)
      ? routePolicy.opl_executor_adapter_receipt
      : undefined;
    const oplHostedExecutorRequirement = isPlainObject(routePolicy.opl_hosted_executor_requirement)
      ? routePolicy.opl_hosted_executor_requirement
      : undefined;
    if (
      routeBackend === HERMES_AGENT_BACKEND
      && !oplExecutorAdapterReceipt
      && !oplHostedExecutorRequirement
    ) {
      throw new Error(
        `RCA hermes_agent structured_call route requires OPL receipt or hosted executor requirement: ${sourceFile}:${routeKey}`,
      );
    }
    const routeLane = normalizeStructuredCallRouteLane(
      routePolicy.lane,
      `${sourceFile}.structured_call_routing.routes.${routeKey}.lane`,
    );
    const fallback = routePolicy.fallback === 'inherit_effective_default_executor'
      ? 'inherit_effective_default_executor'
      : 'fail_closed';
    const failurePolicy = routePolicy.failure_policy === 'fallback_with_proof'
      ? 'fallback_with_proof'
      : 'fail_closed';
    if (failurePolicy === 'fallback_with_proof') {
      if (routeLane !== EXPERIMENTAL_PROOF_ROUTE_LANE) {
        throw new Error(
          `RCA structured_call route fallback_with_proof requires lane=experimental_proof: ${sourceFile}:${routeKey}`,
        );
      }
      if (fallback !== 'inherit_effective_default_executor') {
        throw new Error(
          `RCA structured_call route fallback_with_proof requires fallback=inherit_effective_default_executor: ${sourceFile}:${routeKey}`,
        );
      }
    }
    normalizedRoutes[routeKey] = {
      executor_backend: routeBackend,
      execution_shape: STRUCTURED_CALL_SHAPE,
      lane: routeLane,
      hermes_profile: optionalString(routePolicy.hermes_profile) || undefined,
      opl_executor_adapter_receipt: oplExecutorAdapterReceipt,
      opl_hosted_executor_requirement: oplHostedExecutorRequirement,
      fallback,
      failure_policy: failurePolicy,
    };
  }

  return {
    schema_version: 1,
    default_executor: {
      executor_backend: defaultBackend,
      execution_shape: defaultExecutionShape,
      hermes_profile: optionalString(defaultExecutor.hermes_profile) || undefined,
    },
    structured_call_routing: {
      enabled: structuredCallRouting.enabled === true,
      default_on_missing: 'inherit_effective_default_executor',
      routes: normalizedRoutes,
    },
  };
}

function executorRoutingConfigFiles({
  cwd,
  env = process.env,
  homeDir = os.homedir(),
}: {
  cwd: string;
  env?: Record<string, string | undefined>;
  homeDir?: string;
}): { checked: string[]; runtimeStateFile: string } {
  const runtimeStateFile = runtimeStateExecutorRoutingFile({ env, homeDir });
  const files = [
    runtimeStateFile,
    path.join(cwd, 'config', 'local', EXECUTOR_ROUTING_FILE),
  ];
  const explicit = optionalString(env.REDCUBE_EXECUTOR_ROUTING_CONFIG);
  if (explicit) files.push(path.resolve(explicit));
  return {
    checked: Array.from(new Set(files)),
    runtimeStateFile,
  };
}

export function loadExecutorRoutingConfig(options: RedcubeRuntimeConfigOptions = {}): RedcubeExecutorRoutingConfigResult {
  const cwd = path.resolve(options.cwd || DEFAULT_REPO_ROOT);
  const env = options.env || process.env;
  const homeDir = path.resolve(options.homeDir || os.homedir());
  const { checked, runtimeStateFile } = executorRoutingConfigFiles({ cwd, env, homeDir });
  let config: RedcubeExecutorRoutingConfig = BUILTIN_EXECUTOR_ROUTING_CONFIG;
  const sourceFiles: string[] = [];
  for (const filePath of checked) {
    const raw = readJsonIfExists(filePath);
    if (!raw) continue;
    config = normalizeExecutorRoutingConfig(deepMerge(config as unknown as JsonObject, raw), filePath);
    sourceFiles.push(filePath);
  }
  return {
    config,
    source_files: sourceFiles,
    checked_files: checked,
    runtime_state_config_file: runtimeStateFile,
  };
}

function routeKeyCandidates({
  family,
  profileId,
  route,
}: {
  family: string;
  profileId?: string | null;
  route: string;
}): string[] {
  const safeFamily = optionalString(family);
  const safeProfile = optionalString(profileId);
  const safeRoute = optionalString(route);
  return Array.from(new Set([
    safeFamily && safeProfile && safeRoute ? `${safeFamily}/${safeProfile}/${safeRoute}` : '',
    safeFamily && safeRoute ? `${safeFamily}/${safeRoute}` : '',
    safeRoute,
  ].filter(Boolean)));
}

export function resolveExecutorRouting(
  request: RedcubeExecutorRoutingResolutionRequest,
): RedcubeExecutorRoutingResolution {
  const family = optionalString(request.family);
  const route = optionalString(request.route);
  if (!family) throw new Error('RCA executor routing requires family');
  if (!route) throw new Error('RCA executor routing requires route');

  const loaded = request.config
    ? {
        config: request.config,
        source_files: ['inline.executor_routing_config'],
      }
    : loadExecutorRoutingConfig({
        cwd: request.cwd,
        env: request.env,
        homeDir: request.homeDir,
      });
  const config = normalizeExecutorRoutingConfig(loaded.config, 'resolved_executor_routing_config');
  const hasDomainLocalConfig = (loaded.source_files || []).length > 0;
  const requestExecutorBackend = optionalString(request.requestExecutorBackend);
  const requestAdapter = optionalString(request.requestAdapter);
  const oplDefault = optionalString(
    request.oplDefaultExecutorBackend
    || request.env?.REDCUBE_OPL_DEFAULT_EXECUTOR_BACKEND
    || request.env?.OPL_DEFAULT_EXECUTOR_BACKEND
    || request.env?.REDCUBE_EFFECTIVE_DEFAULT_EXECUTOR_BACKEND,
  );
  const domainDefault = config.default_executor || {};

  let effectiveDefaultExecutor: RedcubeExecutorSelection;
  if (requestExecutorBackend) {
    const backend = normalizeExecutorBackend(requestExecutorBackend, 'request.executor_backend');
    effectiveDefaultExecutor = selectionForBackend({
      backend,
      executionShape: normalizeExecutionShape(null, backend),
      source: 'request_explicit_executor',
    });
  } else if (requestAdapter) {
    effectiveDefaultExecutor = selectionForRequestedAdapter(requestAdapter);
  } else if (oplDefault) {
    const backend = normalizeExecutorBackend(oplDefault, 'opl.default_executor_backend');
    effectiveDefaultExecutor = selectionForBackend({
      backend,
      executionShape: normalizeExecutionShape(null, backend),
      source: 'opl_runtime_manager_default_executor',
    });
  } else if (hasDomainLocalConfig && domainDefault.executor_backend) {
    const backend = normalizeExecutorBackend(domainDefault.executor_backend, 'domain.default_executor.executor_backend');
    effectiveDefaultExecutor = selectionForBackend({
      backend,
      executionShape: normalizeExecutionShape(domainDefault.execution_shape, backend),
      source: 'domain_local_user_config',
      hermesProfile: domainDefault.hermes_profile,
    });
  } else {
    effectiveDefaultExecutor = selectionForBackend({
      backend: CODEX_DEFAULT_BACKEND,
      executionShape: STRUCTURED_CALL_SHAPE,
      source: 'domain_builtin_default',
    });
  }

  const routing = config.structured_call_routing || {};
  const candidates = routeKeyCandidates({ family, profileId: request.profileId, route });
  const routes = routing.routes || {};
  const matchedRouteKey = routing.enabled === true
    ? candidates.find((candidate) => routes[candidate])
    : null;
  const routePolicy = matchedRouteKey ? routes[matchedRouteKey] : null;
  const selectedExecutor = routePolicy
    ? selectionForBackend({
        backend: routePolicy.executor_backend,
        executionShape: STRUCTURED_CALL_SHAPE,
        source: 'domain_local_user_config',
        hermesProfile: routePolicy.hermes_profile,
      })
    : effectiveDefaultExecutor;

  return {
    schema_version: 1,
    resolution_kind: 'redcube_executor_routing',
    family,
    profile_id: optionalString(request.profileId) || null,
    route,
    route_key_candidates: candidates,
    matched_route_key: matchedRouteKey || null,
    effective_default_executor: effectiveDefaultExecutor,
    selected_executor: selectedExecutor,
    structured_call_routing: {
      enabled: routing.enabled === true,
      default_on_missing: 'inherit_effective_default_executor',
      route_matched: Boolean(routePolicy),
      lane: routePolicy?.lane || PRODUCTION_ROUTE_LANE,
      fallback: routePolicy?.fallback || 'fail_closed',
      failure_policy: routePolicy?.failure_policy || 'fail_closed',
    },
    config_source_files: loaded.source_files || [],
  };
}

function normalizeDirValue(value: unknown, baseDir: string): string {
  const text = String(value || '').trim();
  if (!text) return '';

  if (text.startsWith('~/')) {
    return path.join(os.homedir(), text.slice(2));
  }

  return path.isAbsolute(text) ? path.resolve(text) : path.resolve(baseDir, text);
}

function applyRuntimePatch(
  state: RuntimeState,
  patch: unknown,
  sourceTag: string,
  baseDir: string,
): RuntimeState {
  if (!isPlainObject(patch)) return state;

  const next: RuntimeState = {
    values: { ...state.values },
    sources: { ...state.sources },
  };

  for (const key of RUNTIME_KEYS) {
    if (!(key in patch)) continue;
    const normalized = normalizeDirValue(patch[key], baseDir);
    if (!normalized) continue;
    next.values[key] = normalized;
    next.sources[key] = sourceTag;
  }

  return next;
}

function loadConfigFilePair(dirPath: string): { runtimeFile: string; identityFile: string } {
  return {
    runtimeFile: path.join(dirPath, 'runtime.json'),
    identityFile: path.join(dirPath, 'identity.json'),
  };
}

function loadLayer(
  state: RuntimeState,
  identity: JsonObject,
  dirPath: string,
  sourceTag: string,
): { state: RuntimeState; identity: JsonObject } {
  const { runtimeFile, identityFile } = loadConfigFilePair(dirPath);
  const runtimePatch = readJsonIfExists(runtimeFile);
  const identityPatch = readJsonIfExists(identityFile);

  const nextState = runtimePatch
    ? applyRuntimePatch(state, runtimePatch, sourceTag, path.dirname(runtimeFile))
    : state;
  const nextIdentity = identityPatch ? deepMerge(identity, identityPatch) : identity;

  return {
    state: nextState,
    identity: nextIdentity,
  };
}

function resolveUserConfigDir({
  env = process.env,
  homeDir = os.homedir(),
}: {
  env?: Record<string, string | undefined>;
  homeDir?: string;
}): string {
  const explicit = String(env.REDCUBE_CONFIG_HOME || '').trim();
  if (explicit) return path.resolve(explicit);
  return path.join(path.resolve(homeDir), '.config', 'redcube');
}

function prelimWorkspaceRoot({
  explicit = {},
  env = process.env,
  state,
  cwd,
}: Required<Pick<RedcubeRuntimeConfigOptions, 'explicit' | 'env'>> & {
  state: RuntimeState;
  cwd: string;
}): string {
  const explicitWorkspace = String(explicit.workspaceRoot || '').trim();
  if (explicitWorkspace) return path.resolve(explicitWorkspace);

  const envWorkspace = String(
    env.REDCUBE_WORKSPACE_ROOT
    || '',
  ).trim();
  if (envWorkspace) return path.resolve(envWorkspace);

  if (state.values.workspaceRoot) return state.values.workspaceRoot;
  if (String(explicit.rootDir || '').trim()) return path.resolve(String(explicit.rootDir).trim());

  const envRoot = String(env.REDCUBE_ROOT_DIR || '').trim();
  if (envRoot) return path.resolve(envRoot);

  if (state.values.rootDir) return state.values.rootDir;
  return path.resolve(cwd);
}

export function loadRuntimeConfig(options: RedcubeRuntimeConfigOptions = {}): RedcubeRuntimeConfig {
  const cwd = path.resolve(options.cwd || DEFAULT_REPO_ROOT);
  const env = options.env || process.env;
  const explicit = options.explicit || {};
  const homeDir = path.resolve(options.homeDir || os.homedir());

  let runtimeState: RuntimeState = {
    values: {
      rootDir: '',
      workspaceRoot: '',
      promptsDir: '',
    },
    sources: {
      rootDir: '',
      workspaceRoot: '',
      promptsDir: '',
    },
  };
  let identity: JsonObject = {};

  const defaultsDir = path.join(cwd, 'config', 'defaults');
  ({ state: runtimeState, identity } = loadLayer(runtimeState, identity, defaultsDir, path.join(defaultsDir, 'runtime.json')));

  const userDir = resolveUserConfigDir({ env, homeDir });
  ({ state: runtimeState, identity } = loadLayer(runtimeState, identity, userDir, path.join(userDir, 'runtime.json')));

  const localDir = path.join(cwd, 'config', 'local');
  ({ state: runtimeState, identity } = loadLayer(runtimeState, identity, localDir, path.join(localDir, 'runtime.json')));

  const workspaceRoot = prelimWorkspaceRoot({ explicit, env, state: runtimeState, cwd });
  const workspaceConfigDir = path.join(workspaceRoot, '.redcube');
  ({ state: runtimeState, identity } = loadLayer(runtimeState, identity, workspaceConfigDir, path.join(workspaceConfigDir, 'runtime.json')));

  const rootDir = String(explicit.rootDir || env.REDCUBE_ROOT_DIR || runtimeState.values.rootDir || cwd).trim();
  const finalWorkspaceRoot = String(
    explicit.workspaceRoot
    || env.REDCUBE_WORKSPACE_ROOT
    || runtimeState.values.workspaceRoot
    || rootDir,
  ).trim();
  const promptsDir = String(explicit.promptsDir || env.REDCUBE_PROMPTS_DIR || runtimeState.values.promptsDir || path.join(cwd, 'prompts', 'node')).trim();

  return {
    rootDir: path.resolve(rootDir),
    workspaceRoot: path.resolve(finalWorkspaceRoot),
    promptsDir: path.resolve(promptsDir),
    identity: deepMerge({
      defaultProfileId: 'general_public',
      routing: {
        medicalProfileId: 'medical_public',
        generalProfileId: 'general_public',
      },
      profiles: {},
    }, identity) as RedcubeIdentityConfig,
    sources: {
      rootDir: explicit.rootDir ? 'explicit.rootDir' : env.REDCUBE_ROOT_DIR ? 'env:REDCUBE_ROOT_DIR' : runtimeState.sources.rootDir || 'fallback.cwd',
      workspaceRoot: explicit.workspaceRoot
        ? 'explicit.workspaceRoot'
        : env.REDCUBE_WORKSPACE_ROOT
          ? 'env:REDCUBE_WORKSPACE_ROOT'
          : runtimeState.sources.workspaceRoot || (rootDir ? 'fallback.rootDir' : 'fallback.cwd'),
      promptsDir: explicit.promptsDir
        ? 'explicit.promptsDir'
        : env.REDCUBE_PROMPTS_DIR
          ? 'env:REDCUBE_PROMPTS_DIR'
          : runtimeState.sources.promptsDir || 'fallback.repoPromptsDir',
    },
    configDirs: {
      defaultsDir,
      localDir,
      userDir,
      workspaceConfigDir,
    },
  };
}

export type {
  RedcubeExecutionShape,
  RedcubeExecutorBackend,
  RedcubeExecutorResolutionSource,
  RedcubeExecutorRoutingConfig,
  RedcubeExecutorRoutingConfigResult,
  RedcubeExecutorRoutingResolution,
  RedcubeExecutorRoutingResolutionRequest,
  RedcubeExecutorSelection,
  RedcubeIdentityConfig,
  RedcubeIdentityProfile,
  RedcubeIdentityRouting,
  RedcubeRuntimeConfig,
  RedcubeRuntimeConfigDirs,
  RedcubeRuntimeConfigOptions,
  RedcubeRuntimeConfigSources,
  RedcubeRuntimeExplicitConfig,
} from './types.js';
