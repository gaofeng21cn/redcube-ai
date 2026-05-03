// @ts-nocheck
import os from 'node:os';
import path from 'node:path';
import { mkdirSync, mkdtempSync, realpathSync } from 'node:fs';

const PROJECT_SLUG = 'redcube-ai';

function resolveCodexHome() {
  const explicitHome = String(process.env.CODEX_HOME || '').trim();
  return explicitHome ? path.resolve(explicitHome) : path.join(os.homedir(), '.codex');
}

export function mkUserScopedTestWorkspace(prefix) {
  const explicitRoot = String(process.env.REDCUBE_TEST_WORKSPACE_ROOT || '').trim();
  const root = explicitRoot
    ? path.resolve(explicitRoot)
    : path.join(resolveCodexHome(), 'projects', PROJECT_SLUG, 'runtime-state', 'test-workspaces');
  mkdirSync(root, { recursive: true });

  const workspaceRoot = mkdtempSync(path.join(root, prefix));
  const realWorkspaceRoot = realpathSync(workspaceRoot);
  if (realWorkspaceRoot.startsWith('/private/')) {
    throw new Error(
      `test workspace resolved under /private and may trigger native app authorization loops: ${realWorkspaceRoot}`,
    );
  }
  return workspaceRoot;
}
