import os from 'node:os';
import path from 'node:path';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';

const PROJECT_SLUG = 'redcube-ai';
const TEST_WORKSPACE_MARKER = '.redcube-test-workspace.json';
const DEFAULT_TEST_WORKSPACE_TTL_HOURS = 24;
const CLEANUP_LOCK_STALE_MS = 10 * 60 * 1000;

const createdWorkspaceRoots = new Set();
let exitCleanupRegistered = false;
const staleCleanupRoots = new Set();

function resolveCodexHome() {
  const explicitHome = String(process.env.CODEX_HOME || '').trim();
  return explicitHome ? path.resolve(explicitHome) : path.join(os.homedir(), '.codex');
}

function envFlagEnabled(name) {
  return ['1', 'true', 'yes'].includes(String(process.env[name] || '').trim().toLowerCase());
}

function resolveTestWorkspaceRoot() {
  const explicitRoot = String(process.env.REDCUBE_TEST_WORKSPACE_ROOT || '').trim();
  return explicitRoot
    ? path.resolve(explicitRoot)
    : path.join(resolveCodexHome(), 'projects', PROJECT_SLUG, 'runtime-state', 'test-workspaces');
}

function resolveTestWorkspaceTtlHours() {
  const value = Number.parseFloat(String(process.env.REDCUBE_TEST_WORKSPACE_TTL_HOURS || '').trim());
  if (Number.isFinite(value) && value >= 0) {
    return value;
  }
  return DEFAULT_TEST_WORKSPACE_TTL_HOURS;
}

function markerPath(workspaceRoot) {
  return path.join(workspaceRoot, TEST_WORKSPACE_MARKER);
}

function markTestWorkspace(workspaceRoot, prefix) {
  writeFileSync(markerPath(workspaceRoot), `${JSON.stringify({
    owner: 'redcube-ai',
    purpose: 'test-workspace',
    prefix,
    pid: process.pid,
    created_at: new Date().toISOString(),
  }, null, 2)}\n`, 'utf-8');
}

function removeMarkedWorkspace(workspaceRoot) {
  if (!existsSync(markerPath(workspaceRoot))) {
    return false;
  }
  rmSync(workspaceRoot, { recursive: true, force: true });
  return true;
}

function cleanupCurrentProcessWorkspaces() {
  if (envFlagEnabled('REDCUBE_TEST_WORKSPACE_KEEP')) {
    return;
  }
  for (const workspaceRoot of createdWorkspaceRoots) {
    removeMarkedWorkspace(workspaceRoot);
  }
  createdWorkspaceRoots.clear();
}

function registerExitCleanup() {
  if (exitCleanupRegistered) {
    return;
  }
  exitCleanupRegistered = true;
  process.once('exit', cleanupCurrentProcessWorkspaces);
}

function acquireCleanupLock(root, nowMs, useLock) {
  if (!useLock) {
    return null;
  }
  const lockDir = path.join(root, '.cleanup.lock');
  try {
    mkdirSync(lockDir);
    writeFileSync(path.join(lockDir, 'owner.json'), `${JSON.stringify({
      pid: process.pid,
      created_at: new Date(nowMs).toISOString(),
    }, null, 2)}\n`, 'utf-8');
    return lockDir;
  } catch (error) {
    if (error?.code !== 'EEXIST') {
      throw error;
    }
    try {
      const lockAgeMs = nowMs - statSync(lockDir).mtimeMs;
      if (lockAgeMs > CLEANUP_LOCK_STALE_MS) {
        rmSync(lockDir, { recursive: true, force: true });
      }
    } catch {
      return null;
    }
    return null;
  }
}

function releaseCleanupLock(lockDir) {
  if (lockDir) {
    rmSync(lockDir, { recursive: true, force: true });
  }
}

export function cleanupStaleUserScopedTestWorkspaces(root = resolveTestWorkspaceRoot(), options = {}) {
  const ttlHours = Number.isFinite(options.ttlHours) ? options.ttlHours : resolveTestWorkspaceTtlHours();
  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const useLock = options.useLock !== false;
  if (!existsSync(root)) {
    return { removed: 0, skipped: false };
  }
  const lockDir = acquireCleanupLock(root, nowMs, useLock);

  if (useLock && !lockDir) {
    return { removed: 0, skipped: true };
  }

  let removed = 0;
  try {
    const ttlMs = ttlHours * 60 * 60 * 1000;
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === '.cleanup.lock') {
        continue;
      }
      const workspaceRoot = path.join(root, entry.name);
      if (!existsSync(markerPath(workspaceRoot))) {
        continue;
      }
      const ageMs = nowMs - statSync(workspaceRoot).mtimeMs;
      if (ageMs >= ttlMs && removeMarkedWorkspace(workspaceRoot)) {
        removed += 1;
      }
    }
  } finally {
    releaseCleanupLock(lockDir);
  }

  return { removed, skipped: false };
}

export function cleanupCreatedUserScopedTestWorkspaces() {
  cleanupCurrentProcessWorkspaces();
}

export function mkUserScopedTestWorkspace(prefix) {
  const root = resolveTestWorkspaceRoot();
  mkdirSync(root, { recursive: true });
  if (!staleCleanupRoots.has(root) && !envFlagEnabled('REDCUBE_TEST_WORKSPACE_KEEP')) {
    staleCleanupRoots.add(root);
    cleanupStaleUserScopedTestWorkspaces(root);
  }

  const workspaceRoot = mkdtempSync(path.join(root, prefix));
  const realWorkspaceRoot = realpathSync(workspaceRoot);
  if (realWorkspaceRoot.startsWith('/private/')) {
    throw new Error(
      `test workspace resolved under /private and may trigger native app authorization loops: ${realWorkspaceRoot}`,
    );
  }
  markTestWorkspace(workspaceRoot, prefix);
  createdWorkspaceRoots.add(workspaceRoot);
  registerExitCleanup();
  return workspaceRoot;
}
