// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const CLOSEOUT_CONTRACT = 'contracts/runtime-program/upstream-hermes-agent-live-verification-closeout.json';
const CLOSEOUT_BRIEF = 'docs/program/upstream_hermes_agent_live_verification_closeout.md';
const BLOCKER_CONTRACT = 'contracts/runtime-program/upstream-hermes-agent-live-verification-blocker.json';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

test('upstream Hermes live verification closeout is frozen as the completed F4 proof on the current host', () => {
  const closeout = readJson(CLOSEOUT_CONTRACT);
  const blocker = readJson(BLOCKER_CONTRACT);
  const currentProgram = readJson('contracts/runtime-program/current-program.json');

  assert.equal(closeout.closeout_id, 'upstream_hermes_agent_live_verification_closeout');
  assert.equal(closeout.status, 'closeout_completed');
  assert.equal(closeout.scope.phase_id, 'F4_end_to_end_verification_and_absorb');
  assert.equal(closeout.fresh_live_proof.some((item) => item.surface === 'ppt_deck.live_e2e'), true);
  assert.equal(closeout.fresh_live_proof.some((item) => item.surface === 'xiaohongshu.live_e2e'), true);
  assert.equal(closeout.fresh_live_proof.some((item) => item.surface === 'guarded_poster_onepager.live_integration'), true);
  assert.equal(closeout.verification.current_host_gateway_command, 'hermes gateway run -q --replace');
  assert.equal(closeout.verification.current_host_python_command.includes('python3.14'), true);
  assert.deepEqual(currentProgram.current_state.green_baseline.blocked_by, []);
  assert.equal(currentProgram.current_state.green_baseline.local_codex_execution.current_host_status, 'fresh_codex_smoke_passed');
  assert.equal(
    currentProgram.current_state.foundation_milestones.upstream_hermes_agent_live_verification_closeout.contract,
    CLOSEOUT_CONTRACT,
  );
  assert.equal(
    currentProgram.current_state.foundation_milestones.upstream_hermes_agent_live_verification_closeout.status,
    'closeout_completed',
  );
  assert.equal(blocker.resolution.resolved_by_contract, CLOSEOUT_CONTRACT);
});
