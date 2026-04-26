// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const ACTIVATION_PACKAGE_CONTRACT = 'contracts/runtime-program/upstream-hermes-agent-activation-package.json';
const ACTIVATION_PACKAGE_BRIEF = 'docs/program/upstream_hermes_agent_activation_package.md';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('upstream Hermes-Agent activation package is closed out as the frozen upstream proof gate', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const activationPackage = readJson(ACTIVATION_PACKAGE_CONTRACT);

  assert.equal(activationPackage.activation_id, 'upstream_hermes_agent_activation_package');
  assert.equal(activationPackage.status, 'closeout_completed');
  assert.equal(activationPackage.review_status, 'passed');
  assert.equal(activationPackage.connection_proof.required_runtime_owner, 'upstream_hermes_agent');
  assert.equal(activationPackage.connection_proof.probe_script, 'node --experimental-strip-types scripts/probe-upstream-hermes-agent.ts --json --require-run-surface');
  assert.equal(
    activationPackage.connection_proof.required_surfaces.includes('/v1/runs'),
    true,
  );
  assert.equal(
    activationPackage.connection_proof.required_surfaces.includes('/v1/runs/{run_id}/events'),
    true,
  );
  assert.equal(
    activationPackage.connection_proof.live_gateway_command_env,
    'REDCUBE_HERMES_GATEWAY_COMMAND',
  );
  assert.equal(
    activationPackage.connection_proof.python_command_env,
    'REDCUBE_PYTHON_COMMAND',
  );
  assert.equal(
    activationPackage.verified_preconditions.includes('reachable upstream Hermes-Agent API server'),
    true,
  );
  assert.equal(
    activationPackage.verified_preconditions.includes('provider credentials configured inside upstream Hermes-Agent'),
    true,
  );
  assert.equal(activationPackage.connection_proof.fresh_evidence.includes('hermes gateway run -q'), true);
  assert.equal(
    activationPackage.connection_proof.fresh_evidence.includes('python3 -c \"import sys; import playwright; print(sys.executable)\"'),
    true,
  );
  assert.equal(activationPackage.known_external_risks[0].includes('RedactingFormatter'), true);
  assert.equal(
    activationPackage.known_external_risks.some((item) => item.includes('REDCUBE_PYTHON_COMMAND')),
    true,
  );
  assert.equal(
    activationPackage.closeout.suite_result,
    'fresh_route_and_preflight_proof_passed_on_current_branch',
  );
  assert.equal(currentProgram.current_state.foundation_milestones.upstream_hermes_agent_activation_package.status, 'closeout_completed');
  assert.equal(
    currentProgram.current_state.next_activation_package.contract,
    'contracts/runtime-program/managed-product-entry-hardening.json',
  );
  assert.equal(
    currentProgram.current_state.next_activation_package.brief,
    'docs/program/managed_product_entry_hardening.md',
  );
  assert.equal(
    currentProgram.current_state.next_activation_package.probe_script,
    'redcube product invoke',
  );
});
