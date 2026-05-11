// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import {
  buildTestGroups,
  TEST_REGISTRY,
} from '../scripts/test-registry.ts';

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

const ACTIVE_BATON_ID = 'managed_product_entry_hardening';
const ACTIVE_BATON_CONTRACT = 'contracts/runtime-program/managed-product-entry-hardening.json';

const HISTORICAL_CONTRACTS = Object.freeze([
  {
    milestone: 'upstream_hermes_agent_activation_package',
    contract: 'contracts/runtime-program/upstream-hermes-agent-activation-package.json',
    status: 'closeout_completed',
  },
  {
    milestone: 'upstream_hermes_agent_live_verification_blocker',
    contract: 'contracts/runtime-program/upstream-hermes-agent-live-verification-blocker.json',
    status: 'historical_blocker_resolved',
  },
  {
    milestone: 'upstream_hermes_agent_live_verification_closeout',
    contract: 'contracts/runtime-program/upstream-hermes-agent-live-verification-closeout.json',
    status: 'closeout_completed',
  },
  {
    milestone: 'upstream_hermes_agent_final_target_shape',
    contract: 'contracts/runtime-program/upstream-hermes-agent-final-target-shape.json',
    status: 'closeout_completed',
  },
]);

test('current runtime program keeps one active baton and machine-readable historical provenance', () => {
  const currentProgram = readJson('contracts/runtime-program/current-program.json');
  const activeBaton = currentProgram.current_state.active_baton;

  assert.equal(currentProgram.program_id, 'redcube-runtime-program');
  assert.equal(currentProgram.current_state.active_mainline.id, 'redcube-runtime-program');
  assert.equal(currentProgram.current_state.active_mainline.unique, true);

  assert.equal(activeBaton.id, ACTIVE_BATON_ID);
  assert.equal(activeBaton.status, 'closeout_completed');
  assert.equal(activeBaton.review_status, 'verified');
  assert.equal(activeBaton.artifacts.managed_product_entry_contract, ACTIVE_BATON_CONTRACT);
  assert.equal(existsSync(path.resolve(ACTIVE_BATON_CONTRACT)), true);

  const activeContract = readJson(ACTIVE_BATON_CONTRACT);
  assert.equal(activeContract.managed_product_entry_hardening_id, ACTIVE_BATON_ID);
  assert.equal(activeContract.status, 'closeout_completed');
  assert.equal(activeContract.callable_surface.gateway_action, 'getProductEntrySession');

  for (const historicalContract of HISTORICAL_CONTRACTS) {
    const milestone = currentProgram.current_state.foundation_milestones[historicalContract.milestone];
    assert.equal(milestone.status, historicalContract.status, historicalContract.milestone);
    assert.equal(milestone.contract ?? historicalContract.contract, historicalContract.contract);
    assert.notEqual(historicalContract.milestone, activeBaton.id);
    assert.equal(existsSync(path.resolve(historicalContract.contract)), true, historicalContract.contract);
  }

  for (const snapshot of Object.values(currentProgram.historical_snapshots)) {
    assert.equal(snapshot.is_active_mainline, false);
  }
});

test('historical lane is a compact explicit provenance guard outside the active full suite', () => {
  const groups = buildTestGroups();
  const historicalEntry = TEST_REGISTRY.find((entry) => entry.file === 'tests/runtime-program-provenance.test.ts');

  assert.deepEqual(groups.historical, ['tests/runtime-program-provenance.test.ts']);
  assert.equal(groups.full.includes('tests/runtime-program-provenance.test.ts'), false);
  assert.equal(groups['full:with-historical'].includes('tests/runtime-program-provenance.test.ts'), true);
  assert.equal(historicalEntry.lane, 'historical');
  assert.equal(historicalEntry.size, 'small');
  assert.equal(historicalEntry.layer, 'provenance');
  assert.equal(historicalEntry.state, 'historical');
  assert.equal(historicalEntry.ci_default, false);

  for (const retiredFile of [
    'tests/direct-delivery-longrun-target.test.ts',
    'tests/phase-2-behavior-convergence.test.ts',
    'tests/hermes-run-topology-regression.test.ts',
    'tests/hermes-runtime-canonical-path.test.ts',
    'tests/upstream-hermes-agent-final-target-shape.test.ts',
  ]) {
    assert.equal(TEST_REGISTRY.some((entry) => entry.file === retiredFile), false, retiredFile);
  }
});
