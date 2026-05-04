// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  buildManagedRepeatedReviewRerunDecision,
  createManagedRun as createRuntimeManagedRun,
  saveManagedRun,
  startRun,
} from '../package-surfaces.ts';
import {
  auditDeliverable,
  createDeliverable,
  getPublicationProjection,
  getReviewState,
  getManagedRun,
  runManagedDeliverable,
  superviseManagedRun,
  runtimeWatch,
} from '../gateway-test-api.ts';
import { resolveWorkspaceContract } from '../package-surfaces.ts';
import { completeSourceReadiness } from '../helpers/complete-source-readiness.ts';
import {
  startMockCodexCli,
  withEnv,
} from '../mock-codex-cli.ts';

export const MODULE_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const MOCK_HERMES_NATIVE_BRIDGE_COMMAND = JSON.stringify([process.execPath, '--experimental-strip-types', path.join(MODULE_DIR, 'helpers/mock-hermes-native-bridge.ts')]);
export const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([process.execPath, '--experimental-strip-types', path.join(MODULE_DIR, 'helpers/mock-redcube-python-with-playwright.ts')]);

export function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function withoutUpdatedAt(payload) {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }
  const clone = JSON.parse(JSON.stringify(payload));
  if (clone && typeof clone === 'object' && 'updated_at' in clone) {
    delete clone.updated_at;
  }
  return clone;
}

export function runtimeDirEntries(workspaceRoot, relativeDir) {
  const runtimeDir = resolveWorkspaceContract({ workspaceRoot }).runtimeDir;
  const dir = path.join(runtimeDir, relativeDir);
  return existsSync(dir) ? readdirSync(dir) : [];
}

export function assertNoManagedState(workspaceRoot) {
  assert.deepEqual(runtimeDirEntries(workspaceRoot, 'managed-runs'), []);
  assert.deepEqual(runtimeDirEntries(workspaceRoot, 'managed-progress'), []);
  assert.deepEqual(runtimeDirEntries(workspaceRoot, 'managed-stage-records'), []);
  assert.deepEqual(runtimeDirEntries(workspaceRoot, 'managed-supervision'), []);
  assert.deepEqual(runtimeDirEntries(workspaceRoot, 'managed-escalation'), []);
}

export async function withMockHermesUpstream(testFn) {
  const upstream = await startMockCodexCli();
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
    REDCUBE_PYTHON_COMMAND: MOCK_REDCUBE_PYTHON_COMMAND,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

export async function withMockHermesNativeProof(testFn) {
  const restoreEnv = withEnv({
    REDCUBE_HERMES_NATIVE_BRIDGE_COMMAND: MOCK_HERMES_NATIVE_BRIDGE_COMMAND,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
  }
}

export {
  test,
  assert,
  os,
  path,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  buildManagedRepeatedReviewRerunDecision,
  createRuntimeManagedRun,
  saveManagedRun,
  startRun,
  auditDeliverable,
  createDeliverable,
  getPublicationProjection,
  getReviewState,
  getManagedRun,
  runManagedDeliverable,
  superviseManagedRun,
  runtimeWatch,
  resolveWorkspaceContract,
  completeSourceReadiness,
  startMockCodexCli,
  withEnv,
};
