import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { readCurrentProgramContract } from './helpers/current-program-contract.js';
import { runRedCubePythonHelper } from '../packages/redcube-runtime-protocol/dist/python-native-helper.js';

import {
  buildNodeTestArgs,
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
      files: ['tests/runtime-deliverable-route.test.js', 'tests/source-intake.test.js'],
    }),
    {
      parallel_files: ['tests/source-intake.test.js'],
      serialized_files: ['tests/runtime-deliverable-route.test.js'],
    },
  );
});

test('run-test-group only adds file-level serialization to explicit route-heavy file processes', () => {
  const runner = readFileSync('scripts/run-test-group.ts', 'utf-8');

  assert.deepEqual(buildNodeTestArgs({
    forwardedArgs: ['--test-reporter=spec'],
    serialized: true,
  }), ['--test', '--test-concurrency=1', '--test-reporter=spec']);

  assert.deepEqual(buildNodeTestArgs({
    forwardedArgs: [],
    serialized: true,
  }), ['--test', '--test-concurrency=1']);

  assert.deepEqual(buildNodeTestArgs({
    forwardedArgs: ['--test-reporter=spec'],
    serialized: false,
  }), ['--test', '--test-reporter=spec']);

  assert.doesNotMatch(runner, /runSerializedNodeTestFiles/);
  assert.match(runner, /serialized: true/);
});

test('run-test-group routes Python cache outside the checkout', () => {
  const runner = readFileSync('scripts/run-test-group.ts', 'utf-8');
  const pyproject = readFileSync('pyproject.toml', 'utf-8');

  assert.match(runner, /connect[\s\S]*agent-packages[\s\S]*link-framework/);
  assert.match(runner, /node_modules[\s\S]*opl-framework[\s\S]*bin[\s\S]*opl/);
  assert.match(runner, /OPL-managed framework link check failed before test execution/);
  assert.match(runner, /OPL_REPO_TEMP_ROOT/);
  assert.match(runner, /redcube-repo-temp-/);
  assert.match(runner, /PYTHONDONTWRITEBYTECODE/);
  assert.match(runner, /PYTHONPYCACHEPREFIX/);
  assert.match(runner, /UV_PROJECT_ENVIRONMENT/);
  assert.doesNotMatch(runner, /PIP_CACHE_DIR/);
  assert.match(runner, /NPM_CONFIG_CACHE/);
  assert.match(runner, /NODE_COMPILE_CACHE/);
  assert.match(runner, /XDG_CACHE_HOME/);
  assert.match(runner, /process\.env\.OPL_STATE_DIR = path\.join\(repoTempRoot, 'opl-state'\)/);
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
  assert.match(
    readFileSync('scripts/run-with-repo-temp-env.sh', 'utf-8'),
    /node_modules\/opl-framework\/bin\/opl[\s\S]*connect[\s\S]*agent-packages[\s\S]*link-framework[\s\S]*--check/,
  );
  assert.match(
    readFileSync('scripts/run-with-repo-temp-env.sh', 'utf-8'),
    /export OPL_STATE_DIR="\$\{repo_temp_root\}\/opl-state"/,
  );
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
        'tests/runtime-deliverable-route-integration.test.js',
        'tests/runtime-deliverable-route.test.js',
        'tests/review-platform.test.js',
        'tests/source-intake.test.js',
      ],
    }),
    {
      parallel_files: [
        'tests/source-intake.test.js',
      ],
      serialized_files: [
        'tests/runtime-deliverable-route-integration.test.js',
        'tests/runtime-deliverable-route.test.js',
        'tests/review-platform.test.js',
      ],
    },
  );

  assert.deepEqual(
    partitionTestFilesForExecution({
      groupName: 'meta',
      files: ['tests/codex-executor-adapter.test.js'],
    }),
    {
      parallel_files: ['tests/codex-executor-adapter.test.js'],
      serialized_files: [],
    },
  );

  assert.deepEqual(
    partitionTestFilesForExecution({
      groupName: 'fast',
      files: [
        'tests/ppt-native-ppt-runtime.test.js',
        'tests/runtime-deliverable-route-recovery.test.js',
        'tests/product-entry.test.js',
      ],
    }),
    {
      parallel_files: [
        'tests/product-entry.test.js',
      ],
      serialized_files: [
        'tests/ppt-native-ppt-runtime.test.js',
        'tests/runtime-deliverable-route-recovery.test.js',
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

test('run-test-group accepts native positional test files before serialized preflight', () => {
  const script = readFileSync('scripts/run-test-group.ts', 'utf-8');
  const selectIndex = script.indexOf('const selectedFiles = requestedFiles.length > 0');
  const preflightIndex = script.indexOf('await prepareSerializedVerification(groupName);');

  assert.equal(selectIndex > 0, true);
  assert.equal(preflightIndex > 0, true);
  assert.equal(selectIndex < preflightIndex, true);
  assert.doesNotMatch(script, /--files/);
});

test('default lanes keep historical provenance compact and explicit', () => {
  const meta = GROUPS.meta;
  const integration = GROUPS.integration;
  const historical = GROUPS.historical;

  assert.equal(meta.includes('tests/direct-delivery-longrun-target.test.ts'), false);
  assert.equal(meta.includes('tests/phase-2-behavior-convergence.test.ts'), false);
  assert.equal(meta.includes('tests/runtime-program-provenance.test.js'), false);
  assert.equal(integration.includes('tests/direct-delivery-longrun-target.test.ts'), false);
  assert.deepEqual(historical, ['tests/runtime-program-provenance.test.js']);
});

test('run-test-group usage and verify lane registry expose active verification lanes', () => {
  const script = readFileSync('scripts/run-test-group.ts', 'utf-8');
  const verifyScript = readFileSync('scripts/verify.sh', 'utf-8');
  const verifyLaneScript = readFileSync('scripts/verify-lane.ts', 'utf-8');

  assert.match(script, /const groupNames = Object\.keys\(GROUPS\)\.join\('\|'\)/);
  assert.match(script, /\[tests\/example\.test\.js\]/);
  assert.match(verifyScript, /scripts\/verify-lane\.ts "\$lane" --verify-wrapper "\$@"/);
  assert.match(verifyLaneScript, /buildVerifyLanePlan/);
  assert.equal(listVerifyLanes().includes('family'), false);
  assert.equal(listVerifyLanes().includes('private-platform:strict'), true);
  assert.equal(listVerifyLanes().includes('default-caller-tail:strict'), false);
  assert.throws(() => buildVerifyLanePlan('default-caller-tail:strict'), /Unknown lane/);
  assert.throws(() => buildVerifyLanePlan('family'), /Unknown lane/);
  assert.equal(buildVerifyLanePlan('integration-remaining').lane, 'integration:remaining');
  assert.equal(buildVerifyLanePlan('full-remaining').lane, 'full:remaining');
  assert.equal(buildVerifyLanePlan('full-with-historical').lane, 'full:with-historical');
});

test('deliverable review loop integration stays on the mock Codex runtime instead of the live CLI', () => {
  const reviewLoop = readFileSync('tests/deliverable-review-loop.test.js', 'utf-8');

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
  assert.equal(GROUPS.fast.includes('tests/ppt-native-python-layouts.test.js'), false);
  assert.equal(GROUPS.integration.includes('tests/ppt-native-python-layouts.test.js'), true);
  for (const file of [
    'tests/ppt-native-ppt-runtime.test.js',
    'tests/ppt-generation.test.js',
    'tests/runtime-deliverable-route-recovery.test.js',
    'tests/runtime-deliverable-route-cases/shared.js',
  ]) {
    const content = readTestFileWithStaticRelativeImports(file);
    assert.match(content, /mock-redcube-python-with-playwright\.js/);
    assert.match(content, /REDCUBE_PYTHON_COMMAND/);
    assert.doesNotMatch(content, /redcube_ai\.native_helpers\.ppt_deck\.native/);
  }
});

test('fast Python helper catalog checks do not execute the real native PPT helper', () => {
  const content = readFileSync('tests/python-native-helper-catalog.test.js', 'utf-8');
  const catalog = JSON.parse(readFileSync('contracts/runtime-program/python-native-helper-catalog.json', 'utf-8'));
  const nativeHelper = catalog.helpers.find((helper) => helper.helper_id === 'ppt_deck_native');
  const meta = GROUPS.meta;
  const fast = GROUPS.fast;

  assert.equal(meta.includes('tests/python-native-helper-catalog.test.js'), true);
  assert.equal(fast.includes('tests/python-native-helper-catalog.test.js'), true);
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
    /full:remaining keeps local fast-meta-integration verification from rerunning already covered active files/i,
  );
  assert.match(
    currentProgram.current_state.green_baseline.ci_quality_lane_reason,
    /historical stays explicit through .*full:with-historical/i,
  );
});

test('run-test-group resolves an explicit Python command for screenshot review and export surfaces', () => {
  const direct = resolveRedCubePythonCommand({
    env: { REDCUBE_PYTHON_COMMAND: '/opt/custom/python-with-playwright' },
  });
  assert.equal(direct.command, '/opt/custom/python-with-playwright');
  assert.equal(direct.source, 'env');
  assert.equal(direct.runtimeEnv.PYTHONDONTWRITEBYTECODE, '1');

  const arrayCarrier = resolveRedCubePythonCommand({
      env: {
        REDCUBE_PYTHON_COMMAND: '["node","--experimental-strip-types","/tmp/mock-redcube-python.ts"]',
      },
    });
  assert.equal(arrayCarrier.command, 'node');
  assert.deepEqual(arrayCarrier.args, ['--experimental-strip-types', '/tmp/mock-redcube-python.ts']);
  assert.equal(arrayCarrier.source, 'env');

  const managed = resolveRedCubePythonCommand({
    env: { OPL_MANAGED_PYTHON: '/usr/bin/true', PATH: '' },
    fileExists: () => true,
    pythonProbeImpl: () => ({ status: 0 }),
  });
  assert.equal(managed.command, '/usr/bin/true');
  assert.equal(managed.source, 'managed_python_runtime');
});

test('run-test-group consumes an OPL-managed Python runtime without installing a domain-local environment', () => {
  const resolved = resolveRedCubePythonCommand({
    env: { OPL_MANAGED_PYTHON: '/usr/bin/true', PATH: '' },
    fileExists: () => true,
    pythonProbeImpl: () => ({ status: 0 }),
  });
  assert.equal(resolved.command, '/usr/bin/true');
  assert.equal(resolved.source, 'managed_python_runtime');
  assert.equal(resolved.runtimeEnv.PYTHONDONTWRITEBYTECODE, '1');
});

test('RCA native helper invocation delegates catalog resolution and process lifecycle to OPL', () => {
  const helper = {
    helperId: 'ppt_deck_review',
    catalogFile: 'contracts/runtime-program/python-native-helper-catalog.json',
  };
  const result = runRedCubePythonHelper(helper, ['--input-json', '/tmp/input.json'], {
    oplBin: '/opt/opl/bin/opl',
    env: { REDCUBE_PYTHON_COMMAND: '["node","mock-helper.js"]', PATH: '' },
    spawnSyncImpl(command, args, options) {
      assert.equal(command, '/opt/opl/bin/opl');
      assert.deepEqual(args.slice(0, 3), ['pack', 'native-helper', 'run']);
      assert.equal(args[args.indexOf('--catalog') + 1], helper.catalogFile);
      assert.equal(args[args.indexOf('--helper') + 1], helper.helperId);
      assert.equal(args.at(-1), '--json');
      const request = JSON.parse(readFileSync(args[args.indexOf('--request') + 1], 'utf8'));
      assert.deepEqual(request.args, ['--input-json', '/tmp/input.json']);
      assert.equal(request.timeout_seconds, 300);
      assert.equal(Object.hasOwn(options.env, 'PYTHONPATH'), false);
      assert.equal(options.env.OPL_DOMAIN_PYTHON_COMMAND, '["node","mock-helper.js"]');
      return {
        status: 0,
        stdout: JSON.stringify({
          pack_native_helper_execution_receipt: {
            helper_id: helper.helperId,
            package_module: 'redcube_ai.native_helpers.ppt_deck.review',
            payload: { status: 'ok' },
          },
        }),
        stderr: '',
      };
    },
  });

  assert.equal(result.command, '/opt/opl/bin/opl');
  assert.equal(result.package_module, 'redcube_ai.native_helpers.ppt_deck.review');
  assert.deepEqual(result.payload, { status: 'ok' });
});

test('run-test-group fails fast when no Python with playwright can be resolved', () => {
  assert.throws(
    () => resolveRedCubePythonCommand({
      env: { PATH: '', OPL_MANAGED_PYTHON: '/missing/opl-python' },
      fileExists: (file) => file !== '/missing/opl-python',
      pythonProbeImpl: () => ({ status: 1 }),
    }),
    /OPL-managed Python runtime/i,
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
