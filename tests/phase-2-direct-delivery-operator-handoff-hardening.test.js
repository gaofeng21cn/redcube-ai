import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const TRANCHE_CONTRACT = 'contracts/runtime-program/phase-2-direct-delivery-operator-handoff-hardening.json';
const TRANCHE_BRIEF = 'docs/program/phase-2/phase_2_direct_delivery_operator_handoff_hardening.md';
const PREDECESSOR_CONTRACT = 'contracts/runtime-program/phase-2-publication-projection-delivery-contract-convergence.json';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('phase-2 direct-delivery operator handoff tranche is frozen as a repo-tracked contract', () => {
  const contract = readJson(TRANCHE_CONTRACT);
  const predecessor = readJson(PREDECESSOR_CONTRACT);

  assert.equal(contract.tranche_id, 'phase_2_direct_delivery_operator_handoff_hardening');
  assert.equal(contract.program_mode, 'autonomous_longrun');
  assert.equal(contract.formal_entry.controller_repo_verified, false);
  assert.equal(contract.foundations.phase_2_publication_projection_delivery_contract_convergence.commit, '57c9310');
  assert.equal(predecessor.closeout.next_tranche_candidate, 'phase_2_direct_delivery_operator_handoff_hardening');
  assert.equal(contract.object_boundary.in_scope.some((item) => item.includes('operator_handoff')), true);
  assert.equal(contract.direct_delivery_handoff_surface.required_contract_fields.includes('operator_handoff.owner_surface'), true);
  assert.equal(contract.direct_delivery_handoff_surface.required_summary_fields.includes('delivery_state_owner'), true);
  assert.equal(contract.governance_alignment.required_gate_summary_fields.includes('operator_handoff_status'), true);
  assert.equal(contract.governance_alignment.required_gate_summary_fields.includes('delivery_state_owner'), true);
  assert.equal(contract.object_boundary.out_of_scope.includes('controller expansion'), true);
  assert.equal(contract.object_boundary.out_of_scope.includes('paper_poster or conference_poster academic contract advancement'), true);
});
