// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const PREDECESSOR_CONTRACT = 'contracts/runtime-program/phase-2-runtime-watch-locator-integrity-hardening.json';
const BOARD_CONTRACT = 'contracts/runtime-program/phase-2-family-parity-autopilot-continuation-board.json';
const TRANCHE_CONTRACT = 'contracts/runtime-program/phase-2-family-parity-governance-surface-convergence.json';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('family parity follow-on board remains tracked as historical provenance from the phase-2 runtime-watch tranche', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const predecessor = readJson(PREDECESSOR_CONTRACT);
  const board = readJson(BOARD_CONTRACT);
  const tranche = readJson(TRANCHE_CONTRACT);

  assert.equal(board.board_id, 'phase_2_family_parity_autopilot_continuation_board');
  assert.equal(board.status, 'prefrozen_follow_on_board');
  assert.equal(board.parent_tranche_id, 'phase_2_runtime_watch_locator_integrity_hardening');
  assert.deepEqual(
    board.ordered_tranches.map((entry) => entry.tranche_id),
    [
      'phase_2_family_parity_governance_surface_convergence',
      'phase_2_autonomous_stop_reason_convergence',
      'phase_2_autopilot_closeout_evidence_convergence',
    ],
  );
  assert.equal(
    predecessor.closeout.next_tranche_candidate,
    'phase_2_family_parity_governance_surface_convergence',
  );
  assert.equal(predecessor.closeout.next_tranche_kind, 'prefrozen_follow_on_board_entry');
  assert.equal(
    predecessor.closeout.prefrozen_follow_on_board.board_contract,
    'contracts/runtime-program/phase-2-family-parity-autopilot-continuation-board.json',
  );
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_family_parity_governance_surface_convergence.status, 'closeout_completed');
  assert.equal(tranche.predecessor.phase_2_runtime_watch_locator_integrity_hardening.commit, '9cfe58b');
});

test('family parity governance tranche is now absorbed provenance without widening product boundaries', () => {
  const board = readJson(BOARD_CONTRACT);
  const tranche = readJson(TRANCHE_CONTRACT);

  assert.equal(existsSync(path.resolve(BOARD_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(TRANCHE_CONTRACT)), true);
  assert.equal(tranche.status, 'closeout_completed');
  assert.deepEqual(tranche.scope.consumer_families, ['ppt_deck', 'xiaohongshu', 'poster_onepager']);
  assert.equal(tranche.scope.required_family_boundaries.includes('xiaohongshu remains human_publication rather than direct-delivery'), true);
  assert.equal(tranche.closeout.next_tranche_candidate, 'hermes_runtime_substrate_activation_package');
  assert.equal(tranche.closeout.next_tranche_kind, 'new_mainline_activation_package');
  assert.equal(
    board.required_verification.includes(
      'node --test tests/runtime-alignment-p0.test.ts tests/phase-2-runtime-watch-locator-integrity-hardening.test.ts tests/phase-2-family-parity-governance-surface-convergence.test.ts tests/deliverable-review-loop.test.ts tests/runtime-deliverable-route.test.ts tests/phase-2-behavior-convergence.test.ts tests/mcp-gateway.test.ts tests/cli-v2-smoke.test.ts',
    ),
    true,
  );
  assert.equal(board.required_verification.includes('npm run test:full'), true);
});
