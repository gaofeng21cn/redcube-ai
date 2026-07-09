import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  type RedcubeInternalJsonObject as JsonObject,
  isRedcubeInternalJsonObject,
  mergeRedcubeInternalJson,
  readRedcubeInternalJsonIfExists,
} from '@redcube/redcube-config';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = path.resolve(MODULE_DIR, '../../../');
const EXECUTOR_ROUTING_FILE = 'executor-routing.json';
const CODEX_DEFAULT_BACKEND = 'codex_cli';
const HERMES_AGENT_BACKEND = 'hermes_agent';
const STRUCTURED_CALL_SHAPE = 'structured_call';
const AGENT_LOOP_SHAPE = 'agent_loop';
const PRODUCTION_ROUTE_LANE = 'production';
const EXPERIMENTAL_PROOF_ROUTE_LANE = 'experimental_proof';

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
  lane?: 'production' | 'experimental_proof';
  hermes_profile?: string;
  opl_executor_adapter_receipt?: Record<string, unknown>;
  opl_hosted_executor_requirement?: Record<string, unknown>;
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
  default_executor_source_files: string[];
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
    lane: 'production' | 'experimental_proof';
    fallback: 'inherit_effective_default_executor' | 'fail_closed';
    failure_policy: 'fallback_with_proof' | 'fail_closed';
  };
  config_source_files: string[];
}

export interface RedcubeExecutorRoutingOptions {
  cwd?: string;
  env?: Record<string, string | undefined>;
  homeDir?: string;
}

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

function optionalString(value: unknown): string {
  return String(value || '').trim();
}

function hasExplicitDefaultExecutor(raw: unknown): boolean {
  if (!isRedcubeInternalJsonObject(raw)) return false;
  const defaultExecutor = raw.default_executor;
  if (!isRedcubeInternalJsonObject(defaultExecutor)) return false;
  return ['executor_backend', 'execution_shape', 'hermes_profile']
    .some((key) => optionalString(defaultExecutor[key]));
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
  if (!isRedcubeInternalJsonObject(raw)) {
    throw new Error(`RCA executor routing config must be a JSON object: ${sourceFile}`);
  }
  const schemaVersion = Number(raw.schema_version ?? 1);
  if (schemaVersion !== 1) {
    throw new Error(`Unsupported RCA executor routing config schema_version in ${sourceFile}: ${schemaVersion}`);
  }
  const config = raw as JsonObject;
  const defaultExecutor = isRedcubeInternalJsonObject(config.default_executor) ? config.default_executor : {};
  const defaultBackend = normalizeExecutorBackend(
    defaultExecutor.executor_backend,
    `${sourceFile}.default_executor.executor_backend`,
  );
  const defaultExecutionShape = normalizeExecutionShape(
    defaultExecutor.execution_shape,
    defaultBackend,
    `${sourceFile}.default_executor.execution_shape`,
  );
  const structuredCallRouting = isRedcubeInternalJsonObject(config.structured_call_routing)
    ? config.structured_call_routing
    : {};
  const routes = isRedcubeInternalJsonObject(structuredCallRouting.routes) ? structuredCallRouting.routes : {};
  const normalizedRoutes: Record<string, RedcubeStructuredCallRoutePolicy> = {};
  for (const [routeKey, routePolicy] of Object.entries(routes)) {
    if (!isRedcubeInternalJsonObject(routePolicy)) {
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
    const oplExecutorAdapterReceipt = isRedcubeInternalJsonObject(routePolicy.opl_executor_adapter_receipt)
      ? routePolicy.opl_executor_adapter_receipt
      : undefined;
    const oplHostedExecutorRequirement = isRedcubeInternalJsonObject(routePolicy.opl_hosted_executor_requirement)
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

export function loadExecutorRoutingConfig(options: RedcubeExecutorRoutingOptions = {}): RedcubeExecutorRoutingConfigResult {
  const cwd = path.resolve(options.cwd || DEFAULT_REPO_ROOT);
  const env = options.env || process.env;
  const homeDir = path.resolve(options.homeDir || os.homedir());
  const { checked, runtimeStateFile } = executorRoutingConfigFiles({ cwd, env, homeDir });
  let config: RedcubeExecutorRoutingConfig = BUILTIN_EXECUTOR_ROUTING_CONFIG;
  const sourceFiles: string[] = [];
  const defaultExecutorSourceFiles: string[] = [];
  for (const filePath of checked) {
    const raw = readRedcubeInternalJsonIfExists(filePath);
    if (!raw) continue;
    if (hasExplicitDefaultExecutor(raw)) defaultExecutorSourceFiles.push(filePath);
    config = normalizeExecutorRoutingConfig(mergeRedcubeInternalJson(config as unknown as JsonObject, raw), filePath);
    sourceFiles.push(filePath);
  }
  return {
    config,
    source_files: sourceFiles,
    default_executor_source_files: defaultExecutorSourceFiles,
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
        default_executor_source_files: hasExplicitDefaultExecutor(request.config)
          ? ['inline.executor_routing_config']
          : [],
      }
    : loadExecutorRoutingConfig({
        cwd: request.cwd,
        env: request.env,
        homeDir: request.homeDir,
      });
  const config = normalizeExecutorRoutingConfig(loaded.config, 'resolved_executor_routing_config');
  const hasDomainLocalDefault = (loaded.default_executor_source_files || []).length > 0;
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
  } else if (hasDomainLocalDefault && domainDefault.executor_backend) {
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
