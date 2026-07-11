import os from 'node:os';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import type {
  RedcubeIdentityConfig,
  RedcubeRuntimeConfig,
  RedcubeRuntimeConfigOptions,
  RedcubeRuntimeConfigSources,
} from './types.js';

export type RedcubeInternalJsonObject = Record<string, unknown>;
type RuntimeKey = keyof RedcubeRuntimeConfigSources;
type RuntimeState = {
  values: RedcubeRuntimeConfigSources;
  sources: RedcubeRuntimeConfigSources;
};

const RUNTIME_KEYS: RuntimeKey[] = ['rootDir', 'workspaceRoot', 'promptsDir'];
const MODULE_DIR = import.meta.dirname;
const DEFAULT_REPO_ROOT = path.resolve(MODULE_DIR, '../../../');

export function isRedcubeInternalJsonObject(value: unknown): value is RedcubeInternalJsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function mergeRedcubeInternalJson<T extends RedcubeInternalJsonObject>(base: T, extra: unknown): T;
export function mergeRedcubeInternalJson(base: unknown, extra: unknown): unknown;
export function mergeRedcubeInternalJson(base: unknown, extra: unknown): unknown {
  if (!isRedcubeInternalJsonObject(base)) return isRedcubeInternalJsonObject(extra) ? { ...extra } : extra;
  if (!isRedcubeInternalJsonObject(extra)) return { ...base };

  const merged: RedcubeInternalJsonObject = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    if (isRedcubeInternalJsonObject(value) && isRedcubeInternalJsonObject(merged[key])) {
      merged[key] = mergeRedcubeInternalJson(merged[key], value);
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

export function readRedcubeInternalJsonIfExists(filePath: string): RedcubeInternalJsonObject | null {
  if (!filePath || !existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, 'utf-8')) as RedcubeInternalJsonObject;
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
  if (!isRedcubeInternalJsonObject(patch)) return state;

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
  identity: RedcubeInternalJsonObject,
  dirPath: string,
  sourceTag: string,
): { state: RuntimeState; identity: RedcubeInternalJsonObject } {
  const { runtimeFile, identityFile } = loadConfigFilePair(dirPath);
  const runtimePatch = readRedcubeInternalJsonIfExists(runtimeFile);
  const identityPatch = readRedcubeInternalJsonIfExists(identityFile);

  const nextState = runtimePatch
    ? applyRuntimePatch(state, runtimePatch, sourceTag, path.dirname(runtimeFile))
    : state;
  const nextIdentity = identityPatch ? mergeRedcubeInternalJson(identity, identityPatch) : identity;

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
  let identity: RedcubeInternalJsonObject = {};

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
    identity: mergeRedcubeInternalJson({
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
  RedcubeIdentityConfig,
  RedcubeIdentityProfile,
  RedcubeIdentityRouting,
  RedcubeRuntimeConfig,
  RedcubeRuntimeConfigDirs,
  RedcubeRuntimeConfigOptions,
  RedcubeRuntimeConfigSources,
  RedcubeRuntimeExplicitConfig,
} from './types.js';
