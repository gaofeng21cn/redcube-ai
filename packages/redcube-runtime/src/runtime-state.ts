import os from 'node:os';
import path from 'node:path';

const PROJECT_SLUG = 'redcube-ai';

function resolveCodexHome(): string {
  const explicitHome = process.env.CODEX_HOME?.trim();
  if (explicitHome) {
    return path.resolve(explicitHome);
  }
  return path.join(os.homedir(), '.codex');
}

function resolveRuntimeStateRoot(): string {
  const explicitRoot = process.env.REDCUBE_RUNTIME_STATE_ROOT?.trim();
  if (explicitRoot) {
    return path.resolve(explicitRoot);
  }
  return path.join(resolveCodexHome(), 'projects', PROJECT_SLUG, 'runtime-state');
}

export function resolveRuntimeStatePath(...segments: string[]): string {
  return path.join(resolveRuntimeStateRoot(), ...segments);
}

export function runtimeStateDisplayPath(...segments: string[]): string {
  return path.posix.join('$CODEX_HOME', 'projects', PROJECT_SLUG, 'runtime-state', ...segments);
}
