import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const TRANCHE_CONTRACT = 'contracts/runtime-program/hermes-managed-family-closure-truth.json';
const PREDECESSOR_CONTRACT = 'contracts/runtime-program/hermes-stable-family-closure-truth.json';
const TRANCHE_BRIEF = 'docs/program/hermes/hermes_managed_family_closure_truth.md';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

test('current program points to Hermes managed family closure truth after stable family closure absorption', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(TRANCHE_CONTRACT);
  const predecessor = readJson(PREDECESSOR_CONTRACT);
  const brief = readFileSync(path.resolve(TRANCHE_BRIEF), 'utf-8');

  assert.equal(existsSync(path.resolve(TRANCHE_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(TRANCHE_BRIEF)), true);
  assert.equal(contract.tranche_id, 'hermes_managed_family_closure_truth');
  assert.equal(contract.predecessor_tranche, predecessor.tranche_id);
  assert.equal(currentProgram.current_state.phase_label, 'Hermes / managed family closure truth');
  assert.equal(currentProgram.current_state.workstream, 'hermes_managed_family_closure_truth');
  assert.equal(currentProgram.current_state.active_baton.id, 'hermes_managed_family_closure_truth');
  assert.equal(
    currentProgram.current_state.active_baton.artifacts.tranche_contract,
    TRANCHE_CONTRACT,
  );
  assert.equal(
    currentProgram.current_state.active_baton.artifacts.tranche_brief,
    TRANCHE_BRIEF,
  );
  assert.equal(
    currentProgram.current_state.active_baton.artifacts.tranche_test,
    'tests/hermes-managed-family-closure-truth.test.js',
  );
  assert.equal(
    currentProgram.current_state.active_baton.scope.managed_surfaces.includes('runManagedDeliverable'),
    true,
  );
  assert.equal(
    currentProgram.current_state.active_baton.scope.managed_preflight_fail_closed.includes('overlay'),
    true,
  );
  assert.equal(
    currentProgram.current_state.active_baton.scope.managed_preflight_fail_closed.includes('stop_after_stage'),
    true,
  );
  assert.equal(
    currentProgram.current_state.stop_conditions.includes(
      'managed web runtime semantics need a separate frozen activation package',
    ),
    true,
  );
  assert.equal(
    contract.required_behavior.some((item) => item.includes('validates stop_after_stage')),
    true,
  );
  assert.equal(
    contract.required_behavior.some((item) => item.includes('xiaohongshu managed closure preserves approval_pending')),
    true,
  );
  assert.equal(
    contract.required_behavior.some((item) => item.includes('poster_onepager managed closure preserves guarded knowledge-poster')),
    true,
  );
  assert.equal(brief.includes('repo-hosted managed control plane'), true);
  assert.equal(brief.includes('这里说的是 repo-hosted managed control plane'), true);
});
