// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import {
  buildNodeTestArgs,
  parseRunTestGroupArgs,
  partitionTestFilesForExecution,
  selectGroupFiles,
  resolveRedCubePythonCommand,
  ROUTE_HEAVY_SERIALIZATION_GROUP_NAMES,
  SERIALIZED_ROUTE_HEAVY_TEST_FILES,
  SERIALIZED_VERIFICATION_GROUP_NAMES,
} from '../scripts/run-test-group-lib.ts';
import {
  buildTestGroups,
} from '../scripts/test-registry.ts';

const GROUPS = buildTestGroups();

function excludeCoveredTestFiles(baseFiles = [], coveredFiles = []) {
  const covered = new Set(coveredFiles);
  const selected = [];
  for (const file of baseFiles) {
    if (!covered.has(file) && !selected.includes(file)) {
      selected.push(file);
    }
  }
  return selected;
}

test('run-test-group keeps local codex preflight on integration/e2e/full groups', () => {
  assert.deepEqual(
    [...SERIALIZED_VERIFICATION_GROUP_NAMES].sort(),
    ['e2e', 'full', 'full:remaining', 'full:with-historical', 'integration', 'integration:remaining'],
  );
});

test('run-test-group serializes route-heavy fast files without enabling live Codex preflight', () => {
  assert.deepEqual(
    [...ROUTE_HEAVY_SERIALIZATION_GROUP_NAMES].sort(),
    ['e2e', 'fast', 'full', 'full:remaining', 'full:with-historical', 'integration', 'integration:remaining', 'smoke'],
  );
  assert.equal(SERIALIZED_VERIFICATION_GROUP_NAMES.has('fast'), false);
  assert.equal(SERIALIZED_VERIFICATION_GROUP_NAMES.has('smoke'), false);
});

test('run-test-group only adds file-level serialization to explicit route-heavy file processes', () => {
  const runner = readFileSync('scripts/run-test-group.ts', 'utf-8');

  assert.deepEqual(buildNodeTestArgs({
    forwardedArgs: ['--test-reporter=spec'],
    serialized: true,
  }), ['--experimental-strip-types', '--test', '--test-concurrency=1', '--test-reporter=spec']);

  assert.deepEqual(buildNodeTestArgs({
    forwardedArgs: [],
    serialized: true,
  }), ['--experimental-strip-types', '--test', '--test-concurrency=1']);

  assert.deepEqual(buildNodeTestArgs({
    forwardedArgs: ['--test-reporter=spec'],
    serialized: false,
  }), ['--experimental-strip-types', '--test', '--test-reporter=spec']);

  assert.match(runner, /function runSerializedNodeTestFiles/);
  assert.match(runner, /for \(const file of files\)/);
  assert.match(runner, /files: \[file\]/);
  assert.match(runner, /one process per file/);
});

test('run-test-group partitions route-heavy files away from the default parallel batch', () => {
  assert.deepEqual(
    partitionTestFilesForExecution({
      groupName: 'integration',
      files: [
        'tests/managed-deliverable-execution.test.ts',
        'tests/runtime-deliverable-route.test.ts',
        'tests/review-platform.test.ts',
        'tests/source-intake.test.ts',
      ],
    }),
    {
      parallel_files: [
        'tests/source-intake.test.ts',
      ],
      serialized_files: [
        'tests/managed-deliverable-execution.test.ts',
        'tests/runtime-deliverable-route.test.ts',
        'tests/review-platform.test.ts',
      ],
    },
  );

  assert.deepEqual(
    partitionTestFilesForExecution({
      groupName: 'meta',
      files: ['tests/codex-cli-client.test.ts'],
    }),
    {
      parallel_files: ['tests/codex-cli-client.test.ts'],
      serialized_files: [],
    },
  );

  assert.deepEqual(
    partitionTestFilesForExecution({
      groupName: 'fast',
      files: [
        'tests/ppt-native-ppt-runtime.test.ts',
        'tests/runtime-deliverable-route-recovery.test.ts',
        'tests/product-entry.test.ts',
      ],
    }),
    {
      parallel_files: [
        'tests/product-entry.test.ts',
      ],
      serialized_files: [
        'tests/ppt-native-ppt-runtime.test.ts',
        'tests/runtime-deliverable-route-recovery.test.ts',
      ],
    },
  );
});

test('run-test-group exposes a CI meta remainder lane without repeating fast meta coverage', () => {
  const script = readFileSync('scripts/run-test-group.ts', 'utf-8');
  const meta = GROUPS.meta;
  const fast = GROUPS.fast;

  assert.match(script, /const GROUPS = buildTestGroups\(\)/);
  assert.equal(fast.some((file) => meta.includes(file)), true);
  assert.equal(
    GROUPS['meta:ci'].length,
    meta.length - fast.filter((file) => meta.includes(file)).length,
  );
});

test('run-test-group remainder helper removes covered files and duplicate remainder entries', () => {
  assert.deepEqual(
    excludeCoveredTestFiles(
      ['tests/a.test.ts', 'tests/b.test.ts', 'tests/a.test.ts', 'tests/c.test.ts'],
      ['tests/b.test.ts'],
    ),
    ['tests/a.test.ts', 'tests/c.test.ts'],
  );
});

test('run-test-group exposes an integration remainder lane for local fast-then-integration verification', () => {
  const integration = GROUPS.integration;
  const fast = GROUPS.fast;

  assert.equal(fast.some((file) => integration.includes(file)), true);
  assert.equal(GROUPS['integration:remaining'].length, 35);
});

test('run-test-group exposes a full remainder lane without repeating prior local verification coverage', () => {
  const e2e = GROUPS.e2e;
  const historical = GROUPS.historical;
  const full = GROUPS.full;
  const covered = [
    ...GROUPS.fast,
    ...GROUPS.family,
    ...GROUPS['meta:ci'],
    ...GROUPS['integration:remaining'],
  ];

  assert.deepEqual(excludeCoveredTestFiles(full, covered), e2e);
  for (const historicalFile of historical) {
    assert.equal(full.includes(historicalFile), false, historicalFile);
    assert.equal(GROUPS['full:with-historical'].includes(historicalFile), true, historicalFile);
  }
});

test('run-test-group supports explicit targeted files inside the selected lane', () => {
  assert.deepEqual(
    parseRunTestGroupArgs([
      'integration',
      '--files',
      'tests/source-intake.test.ts,tests/runtime-deliverable-route.test.ts',
      '--test-reporter=dot',
    ]),
    {
      groupName: 'integration',
      requestedFiles: [
        'tests/source-intake.test.ts',
        'tests/runtime-deliverable-route.test.ts',
      ],
      forwardedArgs: ['--test-reporter=dot'],
    },
  );

  assert.deepEqual(
    parseRunTestGroupArgs([
      'meta',
      '--files=./tests/codex-cli-client.test.ts',
    ]),
    {
      groupName: 'meta',
      requestedFiles: ['./tests/codex-cli-client.test.ts'],
      forwardedArgs: [],
    },
  );

  assert.deepEqual(
    selectGroupFiles({
      groupName: 'integration',
      groupFiles: [
        'tests/runtime-deliverable-route.test.ts',
        'tests/source-intake.test.ts',
      ],
      requestedFiles: [
        'tests/source-intake.test.ts',
      ],
    }),
    [
      'tests/source-intake.test.ts',
    ],
  );

  assert.throws(
    () => selectGroupFiles({
      groupName: 'meta',
      groupFiles: ['tests/codex-cli-client.test.ts'],
      requestedFiles: ['tests/source-intake.test.ts'],
    }),
    /meta 分组不包含请求的测试文件: tests\/source-intake\.test\.ts/,
  );

  assert.throws(
    () => selectGroupFiles({
      groupName: 'meta',
      groupFiles: ['tests/codex-cli-client.test.ts'],
      requestedFiles: ['tests/helpers/test-workspace.ts'],
    }),
    /--files 只接受根级测试文件/,
  );
});

test('run-test-group validates requested files before serialized preflight', () => {
  const script = readFileSync('scripts/run-test-group.ts', 'utf-8');
  const selectIndex = script.indexOf('const selectedFiles = selectGroupFiles({');
  const preflightIndex = script.indexOf('const serializedVerificationHandle = await prepareSerializedVerification(groupName);');

  assert.equal(selectIndex > 0, true);
  assert.equal(preflightIndex > 0, true);
  assert.equal(selectIndex < preflightIndex, true);
});

test('default lanes keep historical provenance compact and explicit', () => {
  const meta = GROUPS.meta;
  const family = GROUPS.family;
  const integration = GROUPS.integration;
  const historical = GROUPS.historical;

  assert.deepEqual(family, ['tests/family-shared-release.test.ts']);
  assert.equal(meta.includes('tests/family-shared-release.test.ts'), false);
  assert.equal(meta.includes('tests/direct-delivery-longrun-target.test.ts'), false);
  assert.equal(meta.includes('tests/phase-2-behavior-convergence.test.ts'), false);
  assert.equal(meta.includes('tests/runtime-program-provenance.test.ts'), false);
  assert.equal(integration.includes('tests/direct-delivery-longrun-target.test.ts'), false);
  assert.deepEqual(historical, ['tests/runtime-program-provenance.test.ts']);
});

test('run-test-group usage and verify shim include the family verification lane', () => {
  const script = readFileSync('scripts/run-test-group.ts', 'utf-8');
  const verifyScript = readFileSync('scripts/verify.sh', 'utf-8');

  assert.match(script, /const groupNames = Object\.keys\(GROUPS\)\.join\('\|'\)/);
  assert.match(script, /\[--files tests\/a\.test\.ts,tests\/b\.test\.ts\]/);
  assert.match(verifyScript, /smoke\)/);
  assert.match(verifyScript, /family\)/);
  assert.match(verifyScript, /ci\)/);
  assert.match(verifyScript, /integration-remaining\)/);
  assert.match(verifyScript, /full-remaining\)/);
  assert.match(verifyScript, /full-with-historical\)/);
  assert.match(verifyScript, /\[smoke\|fast\|ci\|line-budget\|structure\|meta\|family\|integration\|integration-remaining\|e2e\|historical\|full\|full-remaining\|full-with-historical\]/);
});

test('deliverable review loop integration stays on the mock codex upstream instead of the live CLI', () => {
  const reviewLoop = readFileSync('tests/deliverable-review-loop.test.ts', 'utf-8');

  assert.match(reviewLoop, /startMockCodexCli/);
  assert.match(reviewLoop, /withMockHermesUpstream/);
  assert.match(reviewLoop, /REDCUBE_CODEX_COMMAND/);
});

test('serialized route-heavy verification files stay on the mock codex upstream instead of the live CLI', () => {
  for (const file of [...SERIALIZED_ROUTE_HEAVY_TEST_FILES].sort()) {
    const content = readSerializedTestFileWithImportedCases(file);
    assert.match(content, /withMockHermesUpstream|REDCUBE_CODEX_COMMAND/);
  }
});

test('native PPT fast runtime tests use the mock Python helper instead of launching the native renderer', () => {
  for (const file of [
    'tests/ppt-native-ppt-runtime.test.ts',
    'tests/ppt-hermes-generation.test.ts',
    'tests/runtime-deliverable-route-recovery.test.ts',
    'tests/runtime-deliverable-route-cases/shared.ts',
  ]) {
    const content = readFileSync(file, 'utf-8');
    assert.match(content, /mock-redcube-python-with-playwright\.ts/);
    assert.match(content, /REDCUBE_PYTHON_COMMAND/);
    assert.doesNotMatch(content, /redcube_ai\.native_helpers\.ppt_deck\.native/);
  }
});

test('fast Python helper catalog checks do not execute the real native PPT helper', () => {
  const content = readFileSync('tests/python-native-helper-catalog.test.ts', 'utf-8');
  const catalog = JSON.parse(readFileSync('contracts/runtime-program/python-native-helper-catalog.json', 'utf-8'));
  const nativeHelper = catalog.helpers.find((helper) => helper.helper_id === 'ppt_deck_native');
  const meta = GROUPS.meta;
  const fast = GROUPS.fast;

  assert.equal(meta.includes('tests/python-native-helper-catalog.test.ts'), true);
  assert.equal(fast.includes('tests/python-native-helper-catalog.test.ts'), true);
  assert.match(content, /NATIVE_PPT_HELPER_ID = 'ppt_deck_native'/);
  assert.match(content, /importlib\.import_module/);
  assert.match(content, /runPythonImportabilityCheck\(helper\.package_module\)/);
  assert.doesNotMatch(content, /runPython\(\['-m',\s*NATIVE_PPT_PACKAGE_MODULE,\s*'--help'\]\)/);
  assert.doesNotMatch(content, /runPythonModule\(NATIVE_PPT_PACKAGE_MODULE/);
  assert.equal(nativeHelper.package_module, 'redcube_ai.native_helpers.ppt_deck.native');
  assert.equal(nativeHelper.default_enabled, false);
  assert.equal(nativeHelper.capability_status, 'production_selectable_optional');
});

function readSerializedTestFileWithImportedCases(file) {
  const content = readFileSync(file, 'utf-8');
  const importedCaseFiles = [...content.matchAll(/await import\(['"](.+?)['"]\);/g)]
    .map((match) => path.join(path.dirname(file), match[1]));
  return [content, ...importedCaseFiles.map((importedFile) => readFileSync(importedFile, 'utf-8'))].join('\n');
}

test('serialized verification rule is documented in current program contract', () => {
  const currentProgram = JSON.parse(readFileSync('contracts/runtime-program/current-program.json', 'utf-8'));

  assert.equal(currentProgram.current_state.green_baseline.local_codex_execution.node_test_file_concurrency.light_files, 'runner_default');
  assert.equal(currentProgram.current_state.green_baseline.local_codex_execution.node_test_file_concurrency.route_heavy_files, 1);
  assert.deepEqual(
    currentProgram.current_state.green_baseline.local_codex_execution.node_test_file_concurrency.route_heavy_groups,
    ['smoke', 'fast', 'integration', 'integration:remaining', 'e2e', 'full', 'full:remaining', 'full:with-historical'],
  );
  assert.match(
    currentProgram.current_state.green_baseline.ci_quality_lane_reason,
    /route-heavy codex\/browser verification files stay serialized/i,
  );
  assert.match(
    currentProgram.current_state.green_baseline.ci_quality_lane_reason,
    /meta:ci runs only the meta remainder not already covered by fast/i,
  );
  assert.match(
    currentProgram.current_state.green_baseline.ci_quality_lane_reason,
    /integration:remaining keeps local fast-then-integration verification from rerunning fast-covered integration files/i,
  );
  assert.match(
    currentProgram.current_state.green_baseline.ci_quality_lane_reason,
    /full:remaining keeps local fast-family-meta-integration verification from rerunning already covered active files/i,
  );
  assert.match(
    currentProgram.current_state.green_baseline.ci_quality_lane_reason,
    /historical stays explicit through test:historical or full:with-historical/i,
  );
  assert.match(
    currentProgram.current_state.green_baseline.ci_quality_lane_reason,
    /family shared pin contract.*clean-clone/i,
  );
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
      env: {
        REDCUBE_PYTHON_COMMAND: '["node","--experimental-strip-types","/tmp/mock-redcube-python.ts"]',
      },
      spawnSyncImpl() {
        throw new Error('should not probe when REDCUBE_PYTHON_COMMAND is explicit');
      },
    }),
    {
      command: 'node',
      args: ['--experimental-strip-types', '/tmp/mock-redcube-python.ts'],
      source: 'env',
    },
  );

  assert.deepEqual(
    resolveRedCubePythonCommand({
      env: {},
      spawnSyncImpl(command, args) {
        if (command === 'python3') {
          assert.deepEqual(args, ['-c', 'import sys; import playwright; print(sys.executable)']);
          return { status: 0, stdout: '/opt/homebrew/bin/python3.12\n', stderr: '' };
        }
        assert.equal(command, '/opt/homebrew/bin/python3.12');
        assert.equal(args[0], '-c');
        assert.equal(String(args[1]).includes('sys.version_info'), true);
        return {
          status: 0,
          stdout: JSON.stringify({
            executable: '/opt/homebrew/bin/python3.12',
            version: '3.12.13',
            major: 3,
            minor: 12,
          }),
          stderr: '',
        };
      },
    }),
    {
      command: '/opt/homebrew/bin/python3.12',
      source: 'python3_with_playwright',
    },
  );
});

test('run-test-group bootstraps a managed Python runtime when host python resolves to unstable 3.14', () => {
  const runtimeStateRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-managed-python-'));
  const managedPython = path.join(runtimeStateRoot, 'python', 'stable-playwright', 'venv', 'bin', 'python');

  const resolved = resolveRedCubePythonCommand({
    env: {
      REDCUBE_RUNTIME_STATE_ROOT: runtimeStateRoot,
    },
    spawnSyncImpl(command, args) {
      if (command === 'python3') {
        assert.deepEqual(args, ['-c', 'import sys; import playwright; print(sys.executable)']);
        return { status: 0, stdout: '/opt/homebrew/bin/python3.14\n', stderr: '' };
      }
      if (command === '/opt/homebrew/bin/python3.14') {
        assert.equal(args[0], '-c');
        assert.equal(String(args[1]).includes('sys.version_info'), true);
        return {
          status: 0,
          stdout: JSON.stringify({
            executable: '/opt/homebrew/bin/python3.14',
            version: '3.14.3',
            major: 3,
            minor: 14,
          }),
          stderr: '',
        };
      }
      if (command === 'python3.12') {
        assert.equal(args[0], '-c');
        return {
          status: 0,
          stdout: JSON.stringify({
            executable: '/Users/test/python3.12',
            version: '3.12.13',
            major: 3,
            minor: 12,
          }),
          stderr: '',
        };
      }
      if (command === '/Users/test/python3.12' && args[0] === '-m' && args[1] === 'venv') {
        mkdirSync(path.dirname(managedPython), { recursive: true });
        writeFileSync(managedPython, '#!/usr/bin/env python3\n', 'utf-8');
        return { status: 0, stdout: '', stderr: '' };
      }
      if (command === managedPython && args[0] === '-m' && args[1] === 'pip') {
        return { status: 0, stdout: '', stderr: '' };
      }
      if (command === managedPython && args[0] === '-m' && args[1] === 'playwright') {
        return { status: 0, stdout: '', stderr: '' };
      }
      if (command === managedPython && args[0] === '-c') {
        const script = String(args[1] || '');
        if (script.includes('import sys; import playwright; print(sys.executable)')) {
          return { status: 0, stdout: `${managedPython}\n`, stderr: '' };
        }
        if (script.includes('sys.version_info')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              executable: managedPython,
              version: '3.12.13',
              major: 3,
              minor: 12,
            }),
            stderr: '',
          };
        }
      }
      throw new Error(`unexpected spawnSync call: ${command} ${args.join(' ')}`);
    },
  });

  assert.equal(resolved.command, managedPython);
  assert.equal(resolved.source, 'managed_python_runtime');
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

test('Codex-backed verification Python command contract is frozen in current program', () => {
  const currentProgram = JSON.parse(readFileSync('contracts/runtime-program/current-program.json', 'utf-8'));

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
});
