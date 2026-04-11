import os from 'node:os';
import path from 'node:path';

const PROJECT_SLUG = 'redcube-ai';

export function resolveCodexHome() {
  const explicitHome = process.env.CODEX_HOME?.trim();
  if (explicitHome) {
    return path.resolve(explicitHome);
  }
  return path.join(os.homedir(), '.codex');
}

export function resolveRuntimeStateRoot() {
  const explicitRoot = process.env.REDCUBE_RUNTIME_STATE_ROOT?.trim();
  if (explicitRoot) {
    return path.resolve(explicitRoot);
  }
  return path.join(resolveCodexHome(), 'projects', PROJECT_SLUG, 'runtime-state');
}

export function resolveRuntimeStatePath(...segments) {
  return path.join(resolveRuntimeStateRoot(), ...segments);
}

export function runtimeStateDisplayPath(...segments) {
  return path.posix.join('$CODEX_HOME', 'projects', PROJECT_SLUG, 'runtime-state', ...segments);
}

export function runtimeStateDisplayGlob(...segments) {
  return runtimeStateDisplayPath(...segments);
}
