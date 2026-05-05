// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

test('direct-delivery longrun target remains reflected in current program truth', () => {
  const currentProgram = JSON.parse(read('contracts/runtime-program/current-program.json'));

  assert.equal(currentProgram.current_state.active_baton.id, 'managed_product_entry_hardening');
  assert.equal(currentProgram.current_state.phase_label, 'Repo-Verified Product Entry And OPL Federation');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_runtime_watch_locator_integrity_hardening.status, 'closeout_completed');
  assert.equal(currentProgram.current_state.active_baton.scope.excluded_scope.includes('managed web runtime control plane'), true);
});
