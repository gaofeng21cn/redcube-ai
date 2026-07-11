// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { readCurrentProgramContract } from './helpers/current-program-contract.ts';
import { runRedCubePythonHelper } from '../packages/redcube-runtime-protocol/dist/python-native-helper.js';

import {
  buildNodeTestArgs,
  parseRunTestGroupArgs,
  selectGroupFiles,
  resolveRedCubePythonCommand,
} from '../scripts/run-test-group-lib.ts';
import {
  buildVerifyLanePlan,
  buildTestGroups,
  groupRequiresLiveCodexPreflight,
  listVerifyLanes,
  partitionTestFilesForExecution,
} from '../scripts/test-registry.ts';

const GROUPS = buildTestGroups();

test('run-test-group keeps local codex preflight on integration/e2e/full groups', () => {
  const liveGroups = Object.keys(GROUPS).filter(groupRequiresLiveCodexPreflight).sort();
  assert.deepEqual(liveGroups, ['e2e', 'full', 'full:remaining', 'full:with-historical', 'integration', 'integration:remaining']);
});

test('run-test-group serializes route-heavy fast files without enabling live Codex preflight', () => {
  assert.equal(groupRequiresLiveCodexPreflight('fast'), false);
  assert.equal(groupRequiresLiveCodexPreflight('smoke'), false);
  assert.deepEqual(
    partitionTestFilesForExecution({
      groupName: 'fast',
      files: ['tests/runtime-deliverable-route.test.ts', 'tests/source-intake.test.ts'],
    }),
    {
      parallel_files: ['tests/source-intake.test.ts'],
      serialized_files: ['tests/runtime-deliverable-route.test.ts'],
    },
  );
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

test('run-test-group routes Python cache outside the checkout', () => {
  const runner = readFileSync('scripts/run-test-group.ts', 'utf-8');
  const pyproject = readFileSync('pyproject.toml', 'utf-8');

  assert.match(runner, /OPL_REPO_TEMP_ROOT/);
  assert.match(runner, /redcube-repo-temp-/);
  assert.match(runner, /PYTHONDONTWRITEBYTECODE/);
  assert.match(runner, /PYTHONPYCACHEPREFIX/);
  assert.match(runner, /UV_PROJECT_ENVIRONMENT/);
  assert.doesNotMatch(runner, /PIP_CACHE_DIR/);
  assert.match(runner, /NPM_CONFIG_CACHE/);
  assert.match(runner, /NODE_COMPILE_CACHE/);
  assert.match(runner, /XDG_CACHE_HOME/);
  assert.match(runner, /pathIsInsideRepo/);
  assert.match(runner, /-p no:cacheprovider/);
  assert.match(runner, /cache_dir=\$\{path\.join\(pythonCacheRoot, 'pytest-cache'\)\}/);
  assert.match(pyproject, /\[tool\.pytest\.ini_options\]/);
  assert.match(pyproject, /cache_dir = "\/tmp\/redcube-ai-pytest-cache"/);
});

test('verification scripts expose repo temp hygiene entrypoints', () => {
  const verifyScript = readFileSync('scripts/verify.sh', 'utf-8');
  const verifyLaneScript = readFileSync('scripts/verify-lane.ts', 'utf-8');
  const hygieneScript = readFileSync('scripts/repo-hygiene.sh', 'utf-8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));

  assert.match(verifyScript, /run-with-repo-temp-env\.sh/);
  assert.match(verifyScript, /OPL_REPO_TEMP_ENV_ACTIVE/);
  assert.match(verifyScript, /scripts\/verify-lane\.ts "\$lane" --verify-wrapper "\$@"/);
  assert.match(verifyLaneScript, /run\('scripts\/repo-hygiene\.sh', \['--fix'\]\)/);
  assert.match(verifyLaneScript, /run\('scripts\/repo-hygiene\.sh'\)/);
  assert.match(hygieneScript, /scripts\/repo-hygiene\.sh \[--fix\]/);
  assert.match(hygieneScript, /git ls-files --others --exclude-standard/);
  assert.match(hygieneScript, /Route the producer to OPL_REPO_TEMP_ROOT/);
  assert.equal(packageJson.scripts['repo:hygiene'], 'scripts/repo-hygiene.sh');
  assert.equal(packageJson.scripts['repo:hygiene:fix'], 'scripts/repo-hygiene.sh --fix');
});

test('run-test-group partitions route-heavy files away from the default parallel batch', () => {
  assert.deepEqual(
    partitionTestFilesForExecution({
      groupName: 'integration',
      files: [
        'tests/runtime-deliverable-route-integration.test.ts',
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
        'tests/runtime-deliverable-route-integration.test.ts',
        'tests/runtime-deliverable-route.test.ts',
        'tests/review-platform.test.ts',
      ],
    },
  );

  assert.deepEqual(
    partitionTestFilesForExecution({
      groupName: 'meta',
      files: ['tests/codex-executor-adapter.test.ts'],
    }),
    {
      parallel_files: ['tests/codex-executor-adapter.test.ts'],
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

test('run-test-group exposes an integration remainder lane for local fast-then-integration verification', () => {
  const integration = GROUPS.integration;
  const fast = GROUPS.fast;
  const integrationRemaining = GROUPS['integration:remaining'];

  assert.equal(fast.some((file) => integration.includes(file)), true);
  assert.equal(new Set(integrationRemaining).size, integrationRemaining.length);
  assert.equal(integrationRemaining.every((file) => integration.includes(file)), true);
  assert.equal(integrationRemaining.some((file) => fast.includes(file)), false);
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

  assert.deepEqual(GROUPS['full:remaining'], e2e);
  assert.equal(GROUPS['full:remaining'].some((file) => covered.includes(file)), false);
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
      '--files=./tests/codex-executor-adapter.test.ts',
    ]),
    {
      groupName: 'meta',
      requestedFiles: ['./tests/codex-executor-adapter.test.ts'],
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
      groupFiles: ['tests/codex-executor-adapter.test.ts'],
      requestedFiles: ['tests/source-intake.test.ts'],
    }),
    /meta 分组不包含请求的测试文件: tests\/source-intake\.test\.ts/,
  );

  assert.throws(
    () => selectGroupFiles({
      groupName: 'meta',
      groupFiles: ['tests/codex-executor-adapter.test.ts'],
      requestedFiles: ['tests/helpers/test-workspace.ts'],
    }),
    /--files 只接受根级测试文件/,
  );
});

test('run-test-group validates requested files before serialized preflight', () => {
  const script = readFileSync('scripts/run-test-group.ts', 'utf-8');
  const selectIndex = script.indexOf('const selectedFiles = selectGroupFiles({');
  const preflightIndex = script.indexOf('await prepareSerializedVerification(groupName);');

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

test('run-test-group usage and verify lane registry include the family verification lane', () => {
  const script = readFileSync('scripts/run-test-group.ts', 'utf-8');
  const verifyScript = readFileSync('scripts/verify.sh', 'utf-8');
  const verifyLaneScript = readFileSync('scripts/verify-lane.ts', 'utf-8');

  assert.match(script, /const groupNames = Object\.keys\(GROUPS\)\.join\('\|'\)/);
  assert.match(script, /\[--files tests\/a\.test\.ts,tests\/b\.test\.ts\]/);
  assert.match(verifyScript, /scripts\/verify-lane\.ts "\$lane" --verify-wrapper "\$@"/);
  assert.match(verifyLaneScript, /buildVerifyLanePlan/);
  assert.equal(listVerifyLanes().includes('family'), true);
  assert.equal(listVerifyLanes().includes('private-platform:strict'), true);
  assert.equal(listVerifyLanes().includes('default-caller-tail:strict'), false);
  assert.throws(() => buildVerifyLanePlan('default-caller-tail:strict'), /Unknown lane/);
  assert.deepEqual(
    buildVerifyLanePlan('family').steps,
    [
      { kind: 'build' },
      { kind: 'test-group', group: 'family' },
    ],
  );
  assert.equal(buildVerifyLanePlan('integration-remaining').lane, 'integration:remaining');
  assert.equal(buildVerifyLanePlan('full-remaining').lane, 'full:remaining');
  assert.equal(buildVerifyLanePlan('full-with-historical').lane, 'full:with-historical');
});

test('deliverable review loop integration stays on the mock Codex runtime instead of the live CLI', () => {
  const reviewLoop = readFileSync('tests/deliverable-review-loop.test.ts', 'utf-8');

  assert.match(reviewLoop, /startMockCodexCli/);
  assert.match(reviewLoop, /withMockCodexRuntime/);
  assert.match(reviewLoop, /REDCUBE_CODEX_COMMAND/);
});

test('serialized route-heavy verification files stay on the mock Codex runtime instead of the live CLI', () => {
  const serializedFiles = partitionTestFilesForExecution({
    groupName: 'smoke',
    files: GROUPS.smoke,
  }).serialized_files;
  for (const file of serializedFiles.sort()) {
    const content = readSerializedTestFileWithImportedCases(file);
    const helperAwareContent = readTestFileWithStaticRelativeImports(file);
    assert.match(`${content}\n${helperAwareContent}`, /withMockCodexRuntime(?:State)?|REDCUBE_CODEX_COMMAND/);
  }
});

test('native PPT fast runtime tests use the mock Python helper instead of launching the native renderer', () => {
  assert.equal(GROUPS.fast.includes('tests/ppt-native-python-layouts.test.ts'), false);
  assert.equal(GROUPS.integration.includes('tests/ppt-native-python-layouts.test.ts'), true);
  for (const file of [
    'tests/ppt-native-ppt-runtime.test.ts',
    'tests/ppt-generation.test.ts',
    'tests/runtime-deliverable-route-recovery.test.ts',
    'tests/runtime-deliverable-route-cases/shared.ts',
  ]) {
    const content = readTestFileWithStaticRelativeImports(file);
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

function readTestFileWithStaticRelativeImports(file) {
  const seen = new Set();
  function readRecursive(currentFile) {
    if (seen.has(currentFile)) return '';
    seen.add(currentFile);
    const content = readFileSync(currentFile, 'utf-8');
    const imports = [...content.matchAll(/from ['"](\.\/[^'"]+|(?:\.\.\/)[^'"]+)['"]/g)]
      .map((match) => path.normalize(path.join(path.dirname(currentFile), match[1])));
    return [content, ...imports.map((importedFile) => (
      importedFile.startsWith('tests/')
        ? readRecursive(importedFile)
        : ''
    ))].join('\n');
  }
  return readRecursive(file);
}

test('serialized verification rule is documented in current program contract', () => {
  const currentProgram = readCurrentProgramContract();

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
    /historical stays explicit through .*full:with-historical/i,
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

test('run-test-group bootstraps a lock-synced managed Python runtime when host python resolves to unstable 3.14', () => {
  const runtimeStateRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-managed-python-'));
  const managedPython = path.join(runtimeStateRoot, 'python', 'stable-playwright', 'venv', 'bin', 'python');
  const managedRoot = path.join(runtimeStateRoot, 'python', 'stable-playwright');

  const resolved = resolveRedCubePythonCommand({
    env: {
      REDCUBE_RUNTIME_STATE_ROOT: runtimeStateRoot,
    },
    spawnSyncImpl(command, args, options) {
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
      if (command === 'uv') {
        assert.deepEqual(args, [
          'sync',
          '--locked',
          '--no-dev',
          '--extra',
          'native',
          '--no-install-project',
          '--python',
          '/Users/test/python3.12',
        ]);
        assert.equal(options.cwd, path.resolve(''));
        assert.equal(options.env.UV_PROJECT_ENVIRONMENT, path.join(managedRoot, 'venv'));
        assert.equal(options.env.UV_CACHE_DIR, path.join(managedRoot, 'uv-cache'));
        assert.equal(options.env.PLAYWRIGHT_BROWSERS_PATH, path.join(managedRoot, 'playwright-browsers'));
        assert.equal(options.env.UV_PYTHON_DOWNLOADS, 'never');
        mkdirSync(path.dirname(managedPython), { recursive: true });
        writeFileSync(managedPython, '#!/usr/bin/env python3\n', 'utf-8');
        return { status: 0, stdout: '', stderr: '' };
      }
      if (command === managedPython && args[0] === '-m' && args[1] === 'playwright') {
        assert.equal(options.cwd, path.resolve(''));
        assert.equal(options.env.UV_PROJECT_ENVIRONMENT, path.join(managedRoot, 'venv'));
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
  assert.deepEqual(resolved.runtimeEnv, {
    PLAYWRIGHT_BROWSERS_PATH: path.join(managedRoot, 'playwright-browsers'),
    PYTHONDONTWRITEBYTECODE: '1',
    PYTHONPYCACHEPREFIX: path.join(managedRoot, 'pycache'),
  });
  const marker = JSON.parse(readFileSync(path.join(managedRoot, 'installation.json'), 'utf-8'));
  assert.match(marker.dependency_signature, /^[a-f0-9]{64}$/);
  assert.equal('requirements_signature' in marker, false);
});

test('managed Python helper invocations preserve the private Playwright browser path', () => {
  const runtimeStateRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-managed-helper-'));
  const managedRoot = path.join(runtimeStateRoot, 'python', 'stable-playwright');
  const managedPython = path.join(managedRoot, 'venv', 'bin', 'python');
  const dependencySignature = createHash('sha256')
    .update('pyproject.toml')
    .update('\0')
    .update(readFileSync('pyproject.toml'))
    .update('uv.lock')
    .update('\0')
    .update(readFileSync('uv.lock'))
    .digest('hex');
  mkdirSync(path.dirname(managedPython), { recursive: true });
  writeFileSync(managedPython, '#!/usr/bin/env python3\n', 'utf-8');
  writeFileSync(path.join(managedRoot, 'installation.json'), JSON.stringify({ dependency_signature: dependencySignature }), 'utf-8');

  const helper = {
    helperId: 'ppt_deck_review',
    packageModule: 'redcube_ai.native_helpers.ppt_deck.review',
    pythonRoot: path.resolve('python'),
    catalogFile: 'contracts/runtime-program/python-native-helper-catalog.json',
  };
  const result = runRedCubePythonHelper(helper, ['--input-json', '/tmp/input.json'], {
    env: { REDCUBE_RUNTIME_STATE_ROOT: runtimeStateRoot },
    spawnSyncImpl(command, args, options) {
      if (command === 'python3') {
        return { status: 0, stdout: '/opt/homebrew/bin/python3.14\n', stderr: '' };
      }
      if (command === '/opt/homebrew/bin/python3.14') {
        return {
          status: 0,
          stdout: JSON.stringify({ executable: '/opt/homebrew/bin/python3.14', version: '3.14.3', major: 3, minor: 14 }),
          stderr: '',
        };
      }
      if (command === managedPython && args[0] === '-c') {
        const script = String(args[1] || '');
        if (script.includes('import sys; import playwright; print(sys.executable)')) {
          return { status: 0, stdout: `${managedPython}\n`, stderr: '' };
        }
        if (script.includes('sys.version_info')) {
          return {
            status: 0,
            stdout: JSON.stringify({ executable: managedPython, version: '3.12.13', major: 3, minor: 12 }),
            stderr: '',
          };
        }
      }
      if (command === managedPython && args[0] === '-m') {
        assert.equal(options.env.PLAYWRIGHT_BROWSERS_PATH, path.join(managedRoot, 'playwright-browsers'));
        assert.equal(options.env.PYTHONPYCACHEPREFIX, path.join(managedRoot, 'pycache'));
        assert.equal(options.env.PYTHONDONTWRITEBYTECODE, '1');
        assert.equal(options.env.PYTHONPATH.startsWith(path.resolve('python')), true);
        return { status: 0, stdout: JSON.stringify({ status: 'ok' }), stderr: '' };
      }
      throw new Error(`unexpected spawnSync call: ${command} ${args.join(' ')}`);
    },
  });

  assert.deepEqual(result.payload, { status: 'ok' });
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
  const currentProgram = readCurrentProgramContract();

  assert.deepEqual(
    currentProgram.current_state.green_baseline.ci_quality_lane_requires,
    ['python-3.12', 'uv-lock-native-dependencies'],
  );
  assert.deepEqual(
    currentProgram.current_state.exploration_lanes.ppt_native_authoring_proof_lane.production_hardening.ci_proof_lane_v2.cache_layers,
    ['npm', 'uv', 'playwright'],
  );
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
    'contracts/runtime-program/product-entry-session-continuity.json',
  );
  assert.equal(
    currentProgram.current_state.green_baseline.local_codex_execution.current_host_latest_route_proof.some((item) => item.includes('local Codex CLI route and OPL stage execution pass repo smoke')),
    true,
  );
});
