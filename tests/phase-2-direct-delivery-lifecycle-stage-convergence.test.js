import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const TRANCHE_CONTRACT = 'contracts/runtime-program/phase-2-direct-delivery-lifecycle-stage-convergence.json';
const TRANCHE_BRIEF = 'docs/program/phase-2/phase_2_direct_delivery_lifecycle_stage_convergence.md';
const PREDECESSOR_CONTRACT = 'contracts/runtime-program/phase-2-direct-delivery-operator-handoff-hardening.json';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('phase-2 direct-delivery lifecycle stage convergence stays absorbed provenance while repo-verified product entry federation keeps current lifecycle names intact', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(TRANCHE_CONTRACT);
  const predecessor = readJson(PREDECESSOR_CONTRACT);

  assert.equal(contract.tranche_id, 'phase_2_direct_delivery_lifecycle_stage_convergence');
  assert.equal(contract.status, 'closeout_completed');
  assert.equal(contract.review_status, 'passed');
  assert.equal(predecessor.closeout.next_tranche_candidate, 'phase_2_direct_delivery_lifecycle_stage_convergence');
  assert.equal(currentProgram.current_state.phase_label, 'Repo-Verified Product Entry And OPL Federation');
  assert.equal(currentProgram.current_state.workstream, 'repo_verified_product_entry_and_opl_federation');
  assert.equal(currentProgram.current_state.active_baton.id, 'managed_product_entry_hardening');
  assert.deepEqual(
    currentProgram.durable_surface_contract.required_embedded_summaries,
    ['source_readiness_summary', 'gate_summary', 'operator_handoff', 'lifecycle_stage_summary'],
  );
  assert.equal(currentProgram.current_state.active_baton.scope.excluded_scope.includes('managed web runtime control plane'), true);
  assert.equal(existsSync(path.resolve(TRANCHE_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(PREDECESSOR_CONTRACT)), true);
  assert.equal(contract.lifecycle_stage_contract_surface.human_to_macro_stage.plan, 'story_architecture');
  assert.equal(contract.lifecycle_stage_contract_surface.operator_handoff_within, 'delivery');
  assert.equal(contract.object_boundary.out_of_scope.includes('xiaohongshu rewrite into direct-delivery'), true);
});
