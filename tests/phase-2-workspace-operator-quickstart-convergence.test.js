import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const TRANCHE_CONTRACT = 'contracts/runtime-program/phase-2-workspace-operator-quickstart-convergence.json';
const TRANCHE_BRIEF = 'docs/program/phase-2/phase_2_workspace_operator_quickstart_convergence.md';
const PREDECESSOR_CONTRACT = 'contracts/runtime-program/phase-2-source-readiness-deep-research-trigger-gate-convergence.json';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('workspace operator quickstart convergence stays absorbed provenance while repo-verified product entry federation takes the active tranche', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(TRANCHE_CONTRACT);
  const predecessor = readJson(PREDECESSOR_CONTRACT);

  assert.equal(contract.tranche_id, 'phase_2_workspace_operator_quickstart_convergence');
  assert.equal(contract.status, 'closeout_completed');
  assert.equal(contract.review_status, 'passed');
  assert.equal(predecessor.closeout.absorbed_to_main, true);
  assert.equal(currentProgram.current_state.phase_label, 'Repo-Verified Product Entry And OPL Federation');
  assert.equal(currentProgram.current_state.workstream, 'repo_verified_product_entry_and_opl_federation');
  assert.equal(currentProgram.current_state.active_baton.id, 'managed_product_entry_hardening');
  assert.equal(currentProgram.current_state.active_baton.scope.required_downstream_domain_surfaces.includes('runDeliverableRoute'), true);
  assert.equal(currentProgram.current_state.active_baton.scope.required_audit_surfaces.includes('runtimeWatch'), true);
  assert.equal(contract.operator_quickstart_surface.canonical_route.includes('workspace doctor'), true);
  assert.equal(contract.object_boundary.out_of_scope.includes('controller expansion'), true);
  assert.equal(existsSync(path.resolve(PREDECESSOR_CONTRACT)), true);
});

test('workspace operator quickstart convergence freezes brand-new or thin workspace bootstrap, docs, and help surface honestly', () => {
  const contract = readJson(TRANCHE_CONTRACT);

  assert.equal(existsSync(path.resolve(TRANCHE_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(TRANCHE_BRIEF)), true);
  assert.equal(contract.operator_quickstart_surface.canonical_route.join(' -> '), 'workspace doctor -> source intake / source research -> deliverable create -> deliverable audit -> deliverable run');
  assert.equal(contract.workspace_bootstrap_surface.doctor_surface, 'redcube workspace doctor');
  assert.equal(contract.workspace_bootstrap_surface.doctor_on_brand_new_recommended_action, 'run_source_intake');
  assert.equal(contract.workspace_bootstrap_surface.bootstrap_writers.includes('source research'), true);
  assert.equal(contract.governance_alignment.required_surfaces.includes('getPublicationProjection'), true);
});
