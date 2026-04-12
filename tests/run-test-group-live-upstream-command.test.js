import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildNodeTestArgs,
  DEFAULT_HERMES_GATEWAY_COMMAND,
  resolveRedCubePythonCommand,
  readHermesGatewayLaunchConfig,
} from '../scripts/run-test-group-lib.mjs';

test('run-test-group uses the canonical Hermes gateway command by default', () => {
  const config = readHermesGatewayLaunchConfig({});

  assert.equal(DEFAULT_HERMES_GATEWAY_COMMAND, 'hermes gateway run -q --replace');
  assert.deepEqual(config, {
    command: 'hermes gateway run -q --replace',
    usesShell: false,
  });
});

test('run-test-group allows overriding the live Hermes gateway launch command explicitly', () => {
  const config = readHermesGatewayLaunchConfig({
    REDCUBE_HERMES_GATEWAY_COMMAND:
      'PYTHONPATH=/tmp/hermes-upstream /tmp/venv/bin/python /tmp/hermes-upstream/hermes_cli/main.py gateway run -v --replace',
  });

  assert.deepEqual(config, {
    command:
      'PYTHONPATH=/tmp/hermes-upstream /tmp/venv/bin/python /tmp/hermes-upstream/hermes_cli/main.py gateway run -v --replace',
    usesShell: true,
  });
});

test('run-test-group serializes node test files for live upstream groups', () => {
  assert.deepEqual(buildNodeTestArgs({
    groupName: 'integration',
    forwardedArgs: ['--test-reporter=spec'],
  }), ['--test', '--test-concurrency=1', '--test-reporter=spec']);

  assert.deepEqual(buildNodeTestArgs({
    groupName: 'e2e',
    forwardedArgs: [],
  }), ['--test', '--test-concurrency=1']);

  assert.deepEqual(buildNodeTestArgs({
    groupName: 'meta',
    forwardedArgs: ['--test-reporter=spec'],
  }), ['--test', '--test-reporter=spec']);
});

test('live upstream serialization rule is documented in current program and public docs', () => {
  const currentProgram = JSON.parse(readFileSync('contracts/runtime-program/current-program.json', 'utf-8'));
  const readme = readFileSync('README.md', 'utf-8');
  const readmeZh = readFileSync('README.zh-CN.md', 'utf-8');
  const status = readFileSync('docs/status.md', 'utf-8');

  assert.equal(currentProgram.current_state.green_baseline.live_upstream_verification.node_test_file_concurrency, 1);
  assert.match(
    currentProgram.current_state.green_baseline.live_upstream_verification.serialization_reason,
    /concurrent-run ceiling/i,
  );
  assert.equal(readme.includes('--test-concurrency=1'), true);
  assert.equal(readmeZh.includes('--test-concurrency=1'), true);
  assert.equal(status.includes('--test-concurrency=1'), true);
});

test('run-test-group resolves an explicit Python command for screenshot review and export surfaces', () => {
  assert.deepEqual(
    resolveRedCubePythonCommand({
      env: {
        REDCUBE_PYTHON_COMMAND: '/opt/custom/python-with-playwright',
      },
      spawnSyncImpl() {
        throw new Error('should not probe when REDCUBE_PYTHON_COMMAND is explicit');
      },
    }),
    {
      command: '/opt/custom/python-with-playwright',
      source: 'env',
    },
  );

  assert.deepEqual(
    resolveRedCubePythonCommand({
      env: {},
      spawnSyncImpl(command, args) {
        assert.equal(command, 'python3');
        assert.deepEqual(args, ['-c', 'import sys; import playwright; print(sys.executable)']);
        return {
          status: 0,
          stdout: '/opt/homebrew/bin/python3.14\n',
          stderr: '',
        };
      },
    }),
    {
      command: '/opt/homebrew/bin/python3.14',
      source: 'python3_with_playwright',
    },
  );
});

test('run-test-group fails fast when no Python with playwright can be resolved', () => {
  assert.throws(
    () => resolveRedCubePythonCommand({
      env: {},
      spawnSyncImpl() {
        return {
          status: 1,
          stdout: '',
          stderr: 'ModuleNotFoundError: No module named playwright',
        };
      },
    }),
    /REDCUBE_PYTHON_COMMAND|playwright/i,
  );
});

test('live upstream Python command contract is frozen in current program and public docs', () => {
  const currentProgram = JSON.parse(readFileSync('contracts/runtime-program/current-program.json', 'utf-8'));
  const readme = readFileSync('README.md', 'utf-8');
  const readmeZh = readFileSync('README.zh-CN.md', 'utf-8');
  const status = readFileSync('docs/status.md', 'utf-8');

  assert.equal(
    currentProgram.current_state.green_baseline.live_upstream_verification.python_command_env,
    'REDCUBE_PYTHON_COMMAND',
  );
  assert.match(
    currentProgram.current_state.green_baseline.live_upstream_verification.python_command_requirement,
    /playwright/i,
  );
  assert.deepEqual(currentProgram.current_state.green_baseline.blocked_by, [
    'upstream_hermes_agent_live_verification_blocker',
  ]);
  assert.equal(
    currentProgram.current_state.green_baseline.live_upstream_verification.current_host_status,
    'focused_live_verification_blocked',
  );
  assert.equal(
    currentProgram.current_state.green_baseline.live_upstream_verification.current_host_latest_route_proof.some((item) => item.includes('screenshot_review')),
    true,
  );
  assert.equal(readme.includes('REDCUBE_PYTHON_COMMAND'), true);
  assert.equal(readmeZh.includes('REDCUBE_PYTHON_COMMAND'), true);
  assert.equal(status.includes('REDCUBE_PYTHON_COMMAND'), true);
});
