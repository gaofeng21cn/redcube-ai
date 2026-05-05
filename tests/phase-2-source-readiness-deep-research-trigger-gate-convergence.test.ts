// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const TRANCHE_CONTRACT = 'contracts/runtime-program/phase-2-source-readiness-deep-research-trigger-gate-convergence.json';
const PREDECESSOR_CONTRACT = 'contracts/runtime-program/phase-2-direct-delivery-lifecycle-stage-convergence.json';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('source-readiness deep research trigger+gate convergence stays absorbed provenance while repo-verified product entry federation is the active tranche', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(TRANCHE_CONTRACT);
  const predecessor = readJson(PREDECESSOR_CONTRACT);

  assert.equal(contract.tranche_id, 'phase_2_source_readiness_deep_research_trigger_gate_convergence');
  assert.equal(contract.status, 'closeout_completed');
  assert.equal(contract.review_status, 'passed');
  assert.equal(predecessor.closeout.absorbed_to_main, true);
  assert.equal(currentProgram.current_state.phase_label, 'Repo-Verified Product Entry And OPL Federation');
  assert.equal(currentProgram.current_state.workstream, 'repo_verified_product_entry_and_opl_federation');
  assert.equal(currentProgram.current_state.active_baton.id, 'managed_product_entry_hardening');
  assert.equal(currentProgram.durable_surface_contract.required_embedded_summaries.includes('source_readiness_summary'), true);
  assert.equal(currentProgram.current_state.active_baton.scope.consumer_families.includes('xiaohongshu'), true);
  assert.equal(currentProgram.current_state.active_baton.scope.consumer_families.includes('poster_onepager'), true);
  assert.equal(currentProgram.current_state.active_baton.scope.excluded_scope.includes('controller expansion'), true);
  assert.equal(existsSync(path.resolve(TRANCHE_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(PREDECESSOR_CONTRACT)), true);
});

test('source-readiness deep research trigger+gate convergence freezes trigger logic, planning_ready gate, and future-facing target honestly', () => {
  const contract = readJson(TRANCHE_CONTRACT);

  assert.equal(existsSync(path.resolve(TRANCHE_CONTRACT)), true);
  assert.equal(contract.trigger_and_gate_surface.research_positioning.belongs_to, 'source_readiness');
  assert.equal(contract.trigger_and_gate_surface.force_trigger_conditions.includes('input only contains topic, keywords, or rough idea'), true);
  assert.equal(contract.trigger_and_gate_surface.pass_condition.includes('planning_ready=true'), true);
  assert.equal(contract.governance_alignment.required_summary_fields.includes('gate_summary.source_planning_ready'), true);
});
