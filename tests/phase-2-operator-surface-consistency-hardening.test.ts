// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const TRANCHE_CONTRACT = 'contracts/runtime-program/phase-2-operator-surface-consistency-hardening.json';
const TRANCHE_BRIEF = 'docs/program/phase-2/phase_2_operator_surface_consistency_hardening.md';
const PREDECESSOR_CONTRACT = 'contracts/runtime-program/phase-2-workspace-operator-quickstart-convergence.json';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('operator surface consistency hardening stays absorbed provenance while upstream Hermes cutover is the active tranche', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(TRANCHE_CONTRACT);
  const predecessor = readJson(PREDECESSOR_CONTRACT);

  assert.equal(contract.tranche_id, 'phase_2_operator_surface_consistency_hardening');
  assert.equal(contract.status, 'closeout_completed');
  assert.equal(contract.review_status, 'passed');
  assert.equal(predecessor.closeout.absorbed_to_main, true);
  assert.equal(currentProgram.current_state.phase_label, 'Repo-Verified Product Entry And OPL Federation');
  assert.equal(currentProgram.current_state.workstream, 'repo_verified_product_entry_and_opl_federation');
  assert.equal(currentProgram.current_state.active_baton.id, 'managed_product_entry_hardening');
  assert.deepEqual(contract.operator_surface_alignment.runtime_watch_boundary.required_embedded_summaries, ['source_readiness_summary', 'gate_summary', 'operator_handoff', 'lifecycle_stage_summary']);
  assert.equal(contract.object_boundary.out_of_scope.includes('controller expansion'), true);
  assert.equal(contract.object_boundary.out_of_scope.includes('xiaohongshu rewrite into direct-delivery'), true);
  assert.equal(existsSync(path.resolve(PREDECESSOR_CONTRACT)), true);
});

test('operator surface consistency hardening freezes doctor/help/runtime-watch convergence honestly across current truth surfaces', () => {
  const contract = readJson(TRANCHE_CONTRACT);

  assert.equal(existsSync(path.resolve(TRANCHE_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(TRANCHE_BRIEF)), true);
  assert.deepEqual(contract.minimal_test_surface.truth_freeze_tests, ['tests/phase-2-operator-surface-consistency-hardening.test.ts']);
  assert.equal(contract.operator_surface_alignment.workspace_doctor.must_not_emit_recommended_action.includes('initialize_workspace_contract'), true);
  assert.equal(contract.operator_surface_alignment.cli_help_surface.supported_commands.includes('review watch'), true);
  assert.equal(contract.operator_surface_alignment.runtime_watch_boundary.required_embedded_summaries.includes('lifecycle_stage_summary'), true);
});
