// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const FINAL_TARGET_CONTRACT = 'contracts/runtime-program/upstream-hermes-agent-final-target-shape.json';
const FINAL_TARGET_BRIEF = 'docs/program/upstream_hermes_agent_final_target_shape.md';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('upstream Hermes-Agent final target shape is frozen as the OPL-callable RedCube visual-domain node', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const finalTarget = readJson(FINAL_TARGET_CONTRACT);

  assert.equal(finalTarget.target_shape_id, 'upstream_hermes_agent_final_target_shape');
  assert.equal(finalTarget.status, 'closeout_completed');
  assert.equal(
    finalTarget.final_target_route.redcube_direct_entry,
    'User -> RedCube Product Entry -> RedCube Gateway -> Hermes runtime substrate -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces',
  );
  assert.equal(
    finalTarget.final_target_route.opl_federated_entry,
    'User -> OPL Product Entry -> OPL Gateway -> Hermes runtime substrate -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces',
  );
  assert.equal(finalTarget.runtime_boundary.runtime_owner, 'upstream_hermes_agent');
  assert.deepEqual(finalTarget.entry_surface_contract.formal_entry.repo_verified, ['CLI', 'MCP']);
  assert.equal(
    finalTarget.entry_surface_contract.service_safe_domain_entry.contract,
    'contracts/runtime-program/service-safe-domain-entry-adapter.json',
  );
  assert.equal(finalTarget.entry_surface_contract.product_entry_service_surface.status, 'repo_verified_service_surface_landed');
  assert.equal(finalTarget.entry_surface_contract.product_entry_service_surface.ui_shell_status, 'not_landed');
  assert.equal(
    finalTarget.current_gap.hard_blockers.length,
    0,
  );
  assert.equal(
    currentProgram.longrun_goal.final_target_shape_contract,
    FINAL_TARGET_CONTRACT,
  );
  assert.equal(
    currentProgram.current_state.foundation_milestones.upstream_hermes_agent_final_target_shape.status,
    'closeout_completed',
  );
  assert.equal(
    currentProgram.current_state.foundation_milestones.upstream_hermes_agent_final_target_shape.contract,
    FINAL_TARGET_CONTRACT,
  );
  assert.equal(
    currentProgram.current_state.foundation_milestones.upstream_hermes_agent_final_target_shape.brief,
    FINAL_TARGET_BRIEF,
  );
});
