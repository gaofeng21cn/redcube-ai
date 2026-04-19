import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const BLOCKER_CONTRACT = 'contracts/runtime-program/upstream-hermes-agent-live-verification-blocker.json';
const CLOSEOUT_CONTRACT = 'contracts/runtime-program/upstream-hermes-agent-live-verification-closeout.json';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

test('historical upstream Hermes live verification blocker is preserved after resolution', () => {
  const blocker = readJson(BLOCKER_CONTRACT);
  const currentProgram = readJson('contracts/runtime-program/current-program.json');

  assert.equal(blocker.blocker_id, 'upstream_hermes_agent_live_verification_blocker');
  assert.equal(blocker.status, 'historical_blocker_resolved');
  assert.equal(blocker.scope.phase_id, 'F4_end_to_end_verification_and_absorb');
  assert.equal(
    blocker.verified_passes.some((item) => item.summary.includes('run.completed terminal event')),
    true,
  );
  assert.equal(
    blocker.verified_blockers.some((item) => item.surface === 'ppt_deck.screenshot_review'),
    true,
  );
  assert.equal(
    blocker.verified_blockers.some((item) => item.test === 'tests/ppt-deliverable-e2e.test.js'),
    true,
  );
  assert.equal(
    blocker.resolution.resolved_by_contract,
    CLOSEOUT_CONTRACT,
  );
  assert.equal(
    currentProgram.current_state.foundation_milestones.upstream_hermes_agent_live_verification_blocker.status,
    'historical_blocker_resolved',
  );
  assert.equal(
    currentProgram.current_state.foundation_milestones.upstream_hermes_agent_live_verification_blocker.resolved_by,
    'upstream_hermes_agent_live_verification_closeout',
  );
});
