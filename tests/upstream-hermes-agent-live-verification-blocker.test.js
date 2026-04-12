import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const BLOCKER_CONTRACT = 'contracts/runtime-program/upstream-hermes-agent-live-verification-blocker.json';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

test('upstream Hermes live verification blocker is frozen as the current F4 stop boundary', () => {
  const blocker = readJson(BLOCKER_CONTRACT);
  const currentProgram = readJson('contracts/runtime-program/current-program.json');
  const status = readFileSync('docs/status.md', 'utf-8');

  assert.equal(blocker.blocker_id, 'upstream_hermes_agent_live_verification_blocker');
  assert.equal(blocker.status, 'blocked_external_upstream_or_live_runtime');
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
    currentProgram.current_state.green_baseline.live_upstream_verification.current_host_blocker_contract,
    BLOCKER_CONTRACT,
  );
  assert.equal(
    currentProgram.current_state.green_baseline.blocked_by.includes('upstream_hermes_agent_live_verification_blocker'),
    true,
  );
  assert.equal(status.includes(BLOCKER_CONTRACT), true);
  assert.equal(status.includes('ppt_deck` focused live e2e 目前在 `screenshot_review` 失败'), true);
});
