// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync, utimesSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  createDeliverable,
  getDeliverable,
  getRun,
  runtimeWatch,
  runDeliverableRoute,
} from '../gateway-test-api.ts';
import { appendEvent, startRun } from '../package-surfaces.ts';
import {
  startMockCodexCli,
  withEnv,
} from '../mock-codex-cli.ts';
import { completeSourceReadiness } from '../helpers/complete-source-readiness.ts';

export const MODULE_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const MOCK_HERMES_NATIVE_BRIDGE_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  path.join(MODULE_DIR, 'helpers/mock-hermes-native-bridge.ts'),
]);

export async function withMockHermesUpstream(testFn) {
  const upstream = await startMockCodexCli();
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
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
  utimesSync,
  writeFileSync,
  createDeliverable,
  getDeliverable,
  getRun,
  runtimeWatch,
  runDeliverableRoute,
  appendEvent,
  startRun,
  startMockCodexCli,
  withEnv,
  completeSourceReadiness,
};
