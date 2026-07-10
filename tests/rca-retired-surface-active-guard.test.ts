// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync } from 'node:fs';

import * as domainEntry from '../packages/redcube-domain-entry/dist/index.js';
import { buildHelp, executeCli, getCliDomainActions } from '../apps/redcube-cli/dist/index.js';

const RETIRED_CONTRACTS = Object.freeze([
  'contracts/runtime-program/hermes-runtime-substrate-activation-package.json',
  'contracts/runtime-program/hermes-runtime-capability-extraction-map.json',
  'contracts/runtime-program/hermes-runtime-substrate-canonical-closure.json',
  'contracts/runtime-program/hermes-stable-family-closure-truth.json',
  'contracts/runtime-program/hermes-managed-family-closure-truth.json',
]);

test('RCA retired runtime substrate contract files stay absent from active repo surfaces', () => {
  for (const contractFile of RETIRED_CONTRACTS) {
    assert.equal(existsSync(path.resolve(contractFile)), false, contractFile);
  }
  assert.equal(existsSync(path.resolve('packages/redcube-hermes-substrate')), false);
});

test('RCA-local run lookup stays absent from domain entry and CLI public surfaces', async () => {
  assert.equal(existsSync(path.resolve('packages/redcube-domain-entry/src/actions/get-run.ts')), false);
  assert.equal('getRun' in domainEntry, false);

  const help = await buildHelp(getCliDomainActions());
  assert.equal(Object.hasOwn(help.commandGroups, 'runs'), false);
  assert.equal(Object.hasOwn(help.usage, 'runsGet'), false);
  await assert.rejects(() => executeCli(['runs', 'get']), /未知命令: runs/);
});
