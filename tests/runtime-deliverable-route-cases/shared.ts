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
  runtimeWatch,
  runDeliverableRoute,
} from '../product-domain-action-test-api.ts';
import {
  startMockCodexCli,
  withEnv,
} from '../mock-codex-cli.ts';
import { completeSourceReadiness } from '../helpers/complete-source-readiness.ts';

export const MODULE_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  path.join(MODULE_DIR, 'helpers/mock-redcube-python-with-playwright.ts'),
]);

export async function withMockCodexRuntime(testFn) {
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
  runtimeWatch,
  runDeliverableRoute,
  startMockCodexCli,
  withEnv,
  completeSourceReadiness,
};
