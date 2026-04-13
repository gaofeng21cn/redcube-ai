import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildNodeTestArgs,
  resolveRedCubePythonCommand,
  SERIALIZED_VERIFICATION_GROUP_NAMES,
} from '../scripts/run-test-group-lib.mjs';

test('run-test-group serializes the heavy verification groups on the active Codex mainline', () => {
  assert.deepEqual(
    [...SERIALIZED_VERIFICATION_GROUP_NAMES].sort(),
    ['e2e', 'full', 'integration'],
  );
});

test('run-test-group serializes node test files for Codex-backed verification groups', () => {
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

test('serialized verification rule is documented in current program and public docs', () => {
  const currentProgram = JSON.parse(readFileSync('contracts/runtime-program/current-program.json', 'utf-8'));
  const readme = readFileSync('README.md', 'utf-8');
  const readmeZh = readFileSync('README.zh-CN.md', 'utf-8');
  const status = readFileSync('docs/status.md', 'utf-8');

  assert.equal(currentProgram.current_state.green_baseline.local_codex_execution.node_test_file_concurrency, 1);
  assert.match(
    currentProgram.current_state.green_baseline.ci_quality_lane_reason,
    /poster governed screenshot review/i,
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

test('Codex-backed verification Python command contract is frozen in current program and public docs', () => {
  const currentProgram = JSON.parse(readFileSync('contracts/runtime-program/current-program.json', 'utf-8'));
  const readme = readFileSync('README.md', 'utf-8');
  const readmeZh = readFileSync('README.zh-CN.md', 'utf-8');
  const status = readFileSync('docs/status.md', 'utf-8');

  assert.equal(
    currentProgram.current_state.green_baseline.local_codex_execution.python_command_env,
    'REDCUBE_PYTHON_COMMAND',
  );
  assert.match(
    currentProgram.current_state.green_baseline.local_codex_execution.python_command_requirement,
    /playwright/i,
  );
  assert.deepEqual(currentProgram.current_state.green_baseline.blocked_by, []);
  assert.equal(
    currentProgram.current_state.green_baseline.local_codex_execution.current_host_status,
    'fresh_codex_smoke_passed',
  );
  assert.equal(
    currentProgram.current_state.green_baseline.local_codex_execution.current_host_closeout_contract,
    'contracts/runtime-program/managed-product-entry-hardening.json',
  );
  assert.equal(
    currentProgram.current_state.green_baseline.local_codex_execution.current_host_latest_route_proof.some((item) => item.includes('local Codex CLI route and managed execution pass repo smoke')),
    true,
  );
  assert.equal(readme.includes('REDCUBE_PYTHON_COMMAND'), true);
  assert.equal(readmeZh.includes('REDCUBE_PYTHON_COMMAND'), true);
  assert.equal(status.includes('REDCUBE_PYTHON_COMMAND'), true);
});
