// @ts-nocheck
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  cleanupCreatedUserScopedTestWorkspaces,
  cleanupStaleUserScopedTestWorkspaces,
  mkUserScopedTestWorkspace,
} from './helpers/test-workspace.ts';

const markerFile = '.redcube-test-workspace.json';

function makeLifecycleRoot() {
  const base = path.join(os.homedir(), '.codex', 'projects', 'redcube-ai', 'runtime-state');
  mkdirSync(base, { recursive: true });
  return mkdtempSync(path.join(base, 'test-helper-lifecycle-'));
}

function restoreEnv(name, previousValue) {
  if (previousValue === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = previousValue;
}

test('mkUserScopedTestWorkspace marks and removes current-process workspaces by default', () => {
  const root = makeLifecycleRoot();
  const previousRoot = process.env.REDCUBE_TEST_WORKSPACE_ROOT;
  const previousKeep = process.env.REDCUBE_TEST_WORKSPACE_KEEP;

  try {
    process.env.REDCUBE_TEST_WORKSPACE_ROOT = root;
    delete process.env.REDCUBE_TEST_WORKSPACE_KEEP;

    const workspaceRoot = mkUserScopedTestWorkspace('redcube-helper-current-');

    assert.equal(existsSync(path.join(workspaceRoot, markerFile)), true);
    cleanupCreatedUserScopedTestWorkspaces();
    assert.equal(existsSync(workspaceRoot), false);
  } finally {
    restoreEnv('REDCUBE_TEST_WORKSPACE_ROOT', previousRoot);
    restoreEnv('REDCUBE_TEST_WORKSPACE_KEEP', previousKeep);
    rmSync(root, { recursive: true, force: true });
  }
});

test('cleanupStaleUserScopedTestWorkspaces removes only stale marked workspaces', () => {
  const root = makeLifecycleRoot();
  const nowMs = Date.now();
  const oldDate = new Date(nowMs - 48 * 60 * 60 * 1000);

  try {
    const staleWorkspace = path.join(root, 'redcube-helper-stale-old');
    const freshWorkspace = path.join(root, 'redcube-helper-stale-fresh');
    const unmarkedWorkspace = path.join(root, 'redcube-helper-stale-unmarked');

    for (const workspaceRoot of [staleWorkspace, freshWorkspace, unmarkedWorkspace]) {
      mkdirSync(workspaceRoot, { recursive: true });
    }
    writeFileSync(path.join(staleWorkspace, markerFile), '{}\n', 'utf-8');
    writeFileSync(path.join(freshWorkspace, markerFile), '{}\n', 'utf-8');
    utimesSync(staleWorkspace, oldDate, oldDate);

    cleanupStaleUserScopedTestWorkspaces(root, {
      nowMs,
      ttlHours: 24,
      useLock: false,
    });

    assert.equal(existsSync(staleWorkspace), false);
    assert.equal(existsSync(freshWorkspace), true);
    assert.equal(existsSync(unmarkedWorkspace), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
