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
  assert.equal(activationPackage.connection_proof.probe_script, 'node scripts/probe-upstream-hermes-agent.mjs --json --require-run-surface');
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
    activationPackage.verified_preconditions.includes('reachable upstream Hermes-Agent API server'),
    true,
  );
  assert.equal(
    activationPackage.verified_preconditions.includes('provider credentials configured inside upstream Hermes-Agent'),
    true,
  );
  assert.equal(activationPackage.connection_proof.fresh_evidence.includes('hermes gateway run -q'), true);
  assert.equal(activationPackage.known_external_risks[0].includes('RedactingFormatter'), true);
  assert.equal(currentProgram.current_state.foundation_milestones.upstream_hermes_agent_activation_package.status, 'closeout_completed');
  assert.equal(
    currentProgram.current_state.next_activation_package.contract,
    ACTIVATION_PACKAGE_CONTRACT,
  );
  assert.equal(
    currentProgram.current_state.next_activation_package.brief,
    ACTIVATION_PACKAGE_BRIEF,
  );
  assert.equal(
    currentProgram.current_state.next_activation_package.probe_script,
    activationPackage.connection_proof.probe_script,
  );
});

test('public and maintainer docs point the cutover truth to the upstream activation package', () => {
  const readme = read('README.md');
  const readmeZh = read('README.zh-CN.md');
  const docsReadme = read('docs/README.md');
  const status = read('docs/status.md');
  const brief = read(ACTIVATION_PACKAGE_BRIEF);

  assert.equal(readme.includes('upstream-hermes-agent-activation-package'), true);
  assert.equal(readme.includes('probe-upstream-hermes-agent.mjs'), true);
  assert.equal(readme.includes('hermes gateway run -q'), true);
  assert.equal(readme.includes('REDCUBE_HERMES_GATEWAY_COMMAND'), true);
  assert.equal(readmeZh.includes('upstream-hermes-agent-activation-package'), true);
  assert.equal(readmeZh.includes('probe-upstream-hermes-agent.mjs'), true);
  assert.equal(readmeZh.includes('hermes gateway run -q'), true);
  assert.equal(readmeZh.includes('REDCUBE_HERMES_GATEWAY_COMMAND'), true);
  assert.equal(docsReadme.includes('upstream_hermes_agent_activation_package.md'), true);
  assert.equal(status.includes('probe-upstream-hermes-agent.mjs'), true);
  assert.equal(status.includes('RedactingFormatter'), true);
  assert.equal(status.includes('REDCUBE_HERMES_GATEWAY_COMMAND'), true);
  assert.equal(brief.includes('`/v1/health`'), true);
  assert.equal(brief.includes('`/v1/runs/{run_id}/events`'), true);
  assert.equal(brief.includes('`hermes gateway run -q`'), true);
  assert.equal(brief.includes('`REDCUBE_HERMES_GATEWAY_COMMAND`'), true);
});
