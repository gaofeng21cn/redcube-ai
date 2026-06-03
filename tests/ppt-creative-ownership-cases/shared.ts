// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';

import {
  createDeliverable,
} from '@redcube/domain-entry';
import { runDeliverableRoute } from '../helpers/route-attempt-test-api.ts';
import {
  getPublicationProjection,
} from '@redcube/governance';
import {
  startMockCodexCli,
  withEnv,
} from '../helpers/mock-codex-cli.ts';

export {
  assert,
  cpSync,
  createDeliverable,
  existsSync,
  getPublicationProjection,
  mkdirSync,
  mkdtempSync,
  os,
  path,
  readFileSync,
  readdirSync,
  rmSync,
  runDeliverableRoute,
  spawnSync,
  startMockCodexCli,
  statSync,
  test,
  withEnv,
  writeFileSync,
};
