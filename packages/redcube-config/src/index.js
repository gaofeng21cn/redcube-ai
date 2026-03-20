import os from 'node:os';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RUNTIME_KEYS = ['rootDir', 'workspaceRoot', 'promptsDir'];
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = path.resolve(MODULE_DIR, '../../../');

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(base, extra) {
  if (!isPlainObject(base)) return isPlainObject(extra) ? { ...extra } : extra;
  if (!isPlainObject(extra)) return { ...base };

  const merged = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    if (isPlainObject(value) && isPlainObject(merged[key])) {
      merged[key] = deepMerge(merged[key], value);
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

function readJsonIfExists(filePath) {
  if (!filePath || !existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function normalizeDirValue(value, baseDir) {
  const text = String(value || '').trim();
  if (!text) return '';

  if (text.startsWith('~/')) {
    return path.join(os.homedir(), text.slice(2));
  }

  return path.isAbsolute(text) ? path.resolve(text) : path.resolve(baseDir, text);
}

function applyRuntimePatch(state, patch, sourceTag, baseDir) {
  if (!isPlainObject(patch)) return state;

  const next = {
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

function loadConfigFilePair(dirPath) {
  return {
    runtimeFile: path.join(dirPath, 'runtime.json'),
    identityFile: path.join(dirPath, 'identity.json'),
  };
}

function loadLayer(state, identity, dirPath, sourceTag) {
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

function resolveUserConfigDir({ env = process.env, homeDir = os.homedir() }) {
  const explicit = String(env.REDCUBE_CONFIG_HOME || '').trim();
  if (explicit) return path.resolve(explicit);
  return path.join(path.resolve(homeDir), '.config', 'redcube');
}

function prelimWorkspaceRoot({ explicit = {}, env = process.env, state, cwd }) {
  const explicitWorkspace = String(explicit.workspaceRoot || '').trim();
  if (explicitWorkspace) return path.resolve(explicitWorkspace);

  const envWorkspace = String(
    env.REDCUBE_WORKSPACE_ROOT
    || env.REDCUBE_WORKBENCH_ROOT
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

export function loadRuntimeConfig(options = {}) {
  const cwd = path.resolve(options.cwd || DEFAULT_REPO_ROOT);
  const env = options.env || process.env;
  const explicit = options.explicit || {};
  const homeDir = path.resolve(options.homeDir || os.homedir());

  let runtimeState = {
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
  let identity = {};

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
    || env.REDCUBE_WORKBENCH_ROOT
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
    }, identity),
    sources: {
      rootDir: explicit.rootDir ? 'explicit.rootDir' : env.REDCUBE_ROOT_DIR ? 'env:REDCUBE_ROOT_DIR' : runtimeState.sources.rootDir || 'fallback.cwd',
      workspaceRoot: explicit.workspaceRoot
        ? 'explicit.workspaceRoot'
        : env.REDCUBE_WORKSPACE_ROOT
          ? 'env:REDCUBE_WORKSPACE_ROOT'
          : env.REDCUBE_WORKBENCH_ROOT
            ? 'env:REDCUBE_WORKBENCH_ROOT'
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
