import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { readCurrentProgramContract } from './helpers/current-program-contract.js';
import { readJson } from './helpers/json-io.ts';

import {
  assertRootTestPartition,
  buildNodeTestArgs,
  discoverRootTestFiles,
} from '../scripts/run-test-group-lib.ts';
import {
  assertValidTestRegistry,
  buildVerifyLanePlan,
  buildTestGroups,
  listVerifyLanes,
  TEST_REGISTRY,
} from '../scripts/test-registry.ts';

function workspacePackageFiles() {
  return ['apps', 'packages'].flatMap((root) => (
    readdirSync(path.resolve(root), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(root, entry.name, 'package.json'))
      .filter((file) => existsSync(path.resolve(file)))
  )).sort();
}

function runtimeSourceJsExports(exportsValue) {
  if (!exportsValue) return [];

  if (typeof exportsValue === 'string') {
    return exportsValue.startsWith('./src/') && exportsValue.endsWith('.js')
      ? [{ subpath: '.', target: exportsValue }]
      : [];
  }

  return Object.entries(exportsValue).flatMap(([subpath, value]) => {
    if (typeof value === 'string') {
      return value.startsWith('./src/') && value.endsWith('.js')
        ? [{ subpath, target: value }]
        : [];
    }

    if (!value || typeof value !== 'object') return [];

    return Object.entries(value)
      .filter(([, target]) => typeof target === 'string' && target.startsWith('./src/') && target.endsWith('.js'))
      .map(([condition, target]) => ({ subpath, condition, target }));
  });
}

function compiledDistRuntimeExports(exportsValue) {
  if (!exportsValue) return [];

  if (typeof exportsValue === 'string') {
    return exportsValue.startsWith('./dist/') && exportsValue.endsWith('.js')
      ? [{ subpath: '.', target: exportsValue }]
      : [];
  }

  return Object.entries(exportsValue).flatMap(([subpath, value]) => {
    if (typeof value === 'string') {
      return value.startsWith('./dist/') && value.endsWith('.js')
        ? [{ subpath, target: value }]
        : [];
    }

    if (!value || typeof value !== 'object') return [];

    return Object.entries(value)
      .filter(([, target]) => typeof target === 'string' && target.startsWith('./dist/') && target.endsWith('.js'))
      .map(([condition, target]) => ({ subpath, condition, target }));
  });
}

test('typescript baseline defines root tsconfig with NodeNext/ESM policy', () => {
  assert.equal(existsSync(path.resolve('tsconfig.base.json')), true);
  assert.equal(existsSync(path.resolve('tsconfig.json')), true);
  assert.equal(existsSync(path.resolve('tsconfig.typecheck.json')), true);

  const base = readJson('tsconfig.base.json');
  assert.equal(base.compilerOptions.module, 'NodeNext');
  assert.equal(base.compilerOptions.moduleResolution, 'NodeNext');
  assert.equal(base.compilerOptions.resolveJsonModule, true);
  assert.equal(base.compilerOptions.verbatimModuleSyntax, true);

  const typecheck = readJson('tsconfig.typecheck.json');
  assert.equal(typecheck.extends, './tsconfig.base.json');
  assert.equal(typecheck.compilerOptions.composite, true);
  assert.equal(typecheck.compilerOptions.allowImportingTsExtensions, true);
  assert.equal(typecheck.include.includes('packages/**/*.ts'), true);
  assert.equal(typecheck.include.includes('packages/**/*.js'), true);
  assert.equal(typecheck.include.includes('packages/**/*.mjs'), true);
  assert.equal(typecheck.include.includes('apps/**/*.ts'), true);
  assert.equal(typecheck.include.includes('tests/**/*.js'), true);
  assert.equal(typecheck.include.includes('tests/**/*.mjs'), true);
  assert.equal(typecheck.include.includes('scripts/**/*.mjs'), true);
  assert.equal(typecheck.include.includes('scripts/**/*.ts'), true);
  assert.equal(typecheck.include.includes('tools/**/*.mjs'), true);
  assert.equal(typecheck.include.includes('tools/**/*.ts'), true);
});

test('root package exposes formal typecheck entrypoint', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts.test, 'npm run test:smoke');
  assert.equal(pkg.scripts['test:smoke'], 'node scripts/verify-lane.ts smoke');
  assert.equal(pkg.scripts['test:fast'], 'node scripts/verify-lane.ts fast');
  assert.equal(pkg.scripts['test:ci'], 'node scripts/verify-lane.ts ci');
  assert.equal(pkg.scripts['test:full'], 'node scripts/verify-lane.ts full');
  assert.equal(pkg.scripts['test:family'], undefined);
  assert.equal(pkg.scripts['test:historical'], 'node scripts/verify-lane.ts historical');
  assert.equal(pkg.scripts['test:full:with-historical'], 'node scripts/verify-lane.ts full:with-historical');
  for (const script of ['test:meta', 'test:integration', 'test:e2e']) {
    assert.equal(pkg.scripts[script], undefined);
  }
  assert.equal(pkg.scripts['test:meta:ci'], undefined);
  assert.equal(pkg.scripts['test:integration:remaining'], undefined);
  assert.equal(pkg.scripts['test:full:remaining'], undefined);
  assert.equal(pkg.scripts['test:line-budget'], undefined);
  assert.equal(pkg.scripts['test:line-budget:strict'], undefined);
  assert.equal(pkg.scripts.typecheck, 'npm run --silent build && tsc --noEmit --project tsconfig.typecheck.json --pretty false');
  assert.equal(pkg.scripts['typecheck:ci'], 'npm run --silent build:ci && tsc --noEmit --project tsconfig.typecheck.json --pretty false');
  assert.equal(
    pkg.scripts['audit:typescript-closeout'],
    'node scripts/run-typescript-closeout-audit.ts',
  );
  assert.equal(
    pkg.scripts.build,
    'tsc --build tsconfig.json --pretty false',
  );
  assert.equal(pkg.scripts['build:ci'], 'tsc --build tsconfig.json --pretty false --force');
});

test('registry and verify dispatcher own non-package test lanes', () => {
  for (const lane of ['meta', 'integration', 'e2e', 'historical', 'full:with-historical']) {
    assert.equal(listVerifyLanes().includes(lane), true, lane);
    assert.equal(buildVerifyLanePlan(lane).lane, lane, lane);
  }
  assert.equal(listVerifyLanes().includes('family'), false);
});

test('workspace packages and apps participate in package-level tsconfig layering', () => {
  const paths = [
    'apps/redcube-cli/tsconfig.json',
    'packages/redcube-domain-entry/tsconfig.json',
    'packages/redcube-governance/tsconfig.json',
    'packages/redcube-runtime-protocol/tsconfig.json',
    'packages/redcube-runtime/tsconfig.json',
  ];

  for (const file of paths) {
    assert.equal(existsSync(path.resolve(file)), true, file);
    const config = readJson(file);
    assert.equal(config.extends, '../../tsconfig.package-build.json');
  }
});

test('root package build graph lists dist-export dependencies before consumers', () => {
  const rootConfig = readJson('tsconfig.json');
  const referenceIndex = new Map(
    rootConfig.references.map((entry, index) => [entry.path, index]),
  );

  const before = (dependency, consumer) => {
    assert.equal(referenceIndex.has(dependency), true, dependency);
    assert.equal(referenceIndex.has(consumer), true, consumer);
    assert.equal(
      referenceIndex.get(dependency) < referenceIndex.get(consumer),
      true,
      `${dependency} must build before ${consumer}`,
    );
  };

  before('./packages/redcube-runtime-protocol', './packages/redcube-overlay-core');
  before('./packages/redcube-overlay-core', './packages/redcube-governance');
  before('./packages/redcube-governance', './packages/redcube-runtime');
  before('./packages/redcube-runtime', './packages/redcube-domain-entry');
  before('./packages/redcube-domain-entry', './apps/redcube-cli');
});

test('typescript package build contract requires runtime exports to resolve through compiled dist artifacts', () => {
  const contractFile = 'contracts/runtime-program/typescript-package-build-contract.json';
  const contract = readJson(contractFile);
  const currentProgram = readCurrentProgramContract();

  assert.equal(contract.contract_id, 'typescript-package-build-contract');
  assert.equal(contract.language, 'typescript');
  assert.equal(
    currentProgram.longrun_goal.language_target.typescript_package_build_contract,
    contractFile,
  );
  assert.equal(contract.current_transition_model.source_types_entry, './src/index.ts');
  assert.equal(contract.current_transition_model.runtime_export_kind, 'compiled_dist_runtime_export');
  assert.equal(contract.current_transition_model.compiled_runtime_target, './dist/index.js');
  assert.equal(contract.current_transition_model.compiled_types_target, './dist/index.d.ts');
  assert.equal(contract.transition_policy.new_packages_must_use_typescript_source, true);
  assert.equal(contract.transition_policy.new_runtime_js_exports_forbidden_without_contract, true);
  assert.equal(contract.transition_policy.source_js_exports_forbidden, true);
  assert.equal(contract.transition_policy.legacy_source_js_export_allowlist_retired, true);
  assert.equal(Object.hasOwn(contract.transition_policy, 'zero_js_source_gate_contract'), false);
  assert.equal(Object.hasOwn(contract.transition_policy, 'source_js_exports_allowlisted_only'), false);
  assert.equal(Object.hasOwn(contract, 'legacy_source_js_runtime_exports'), false);
  assert.equal(contract.quality_gates.typecheck, 'npm run typecheck');
  assert.equal(contract.quality_gates.typecheck_model, 'build_compiled_exports_then_no_emit');
  assert.equal(contract.quality_gates.build, 'npm run build');

  const actualSourceJsExports = workspacePackageFiles().flatMap((file) => {
    const pkg = readJson(file);
    const exports = runtimeSourceJsExports(pkg.exports);
    if (exports.length === 0) return [];
    return [{
      directory: path.dirname(file).split(path.sep).join('/'),
      package_name: pkg.name,
      exports,
    }];
  });

  assert.deepEqual(actualSourceJsExports, []);

  const actualDistExports = workspacePackageFiles().flatMap((file) => {
    const pkg = readJson(file);
    const exports = compiledDistRuntimeExports(pkg.exports);
    if (exports.length === 0) return [];
    return [{
      directory: path.dirname(file).split(path.sep).join('/'),
      package_name: pkg.name,
      exports,
    }];
  });

  assert.deepEqual(actualDistExports, contract.compiled_dist_runtime_exports);
});

test('workspace packages with active runtime exports expose compiled dist contracts', () => {
  const contract = readJson('contracts/runtime-program/typescript-package-build-contract.json');
  const compiledExportDirectories = new Set(
    contract.compiled_dist_runtime_exports.map((entry) => entry.directory),
  );

  for (const file of workspacePackageFiles()) {
    const directory = path.dirname(file).split(path.sep).join('/');
    const srcDirectory = path.join(directory, 'src');
    if (!existsSync(path.resolve(srcDirectory))) continue;

    const pkg = readJson(file);
    assert.equal(existsSync(path.resolve(directory, 'tsconfig.json')), true, directory);
    assert.equal(existsSync(path.resolve(directory, 'src/index.ts')), true, directory);
    assert.equal(pkg.main ?? null, null, `${directory} must not add a source JS main entry`);

    if (compiledExportDirectories.has(directory)) {
      assert.equal(pkg.types, './dist/index.d.ts', directory);
      assert.equal(existsSync(path.resolve(directory, 'dist/index.js')), true, `${directory} must build dist/index.js`);
      assert.equal(existsSync(path.resolve(directory, 'dist/index.d.ts')), true, `${directory} must build dist/index.d.ts`);
    }
  }
});

test('compiled dist runtime entrypoints preserve package runtime exports', async () => {
  const contract = readJson('contracts/runtime-program/typescript-package-build-contract.json');

  for (const entry of contract.compiled_dist_runtime_exports) {
    for (const exportTarget of entry.exports) {
      if (!exportTarget.target.startsWith('./dist/') || !exportTarget.target.endsWith('.js')) {
        continue;
      }
      const distFile = path.resolve(entry.directory, exportTarget.target);
      const distModule = readFileSync(distFile, 'utf-8');
      const basename = path.basename(exportTarget.target);
      assert.equal(
        distModule.includes(`from './${basename}'`),
        false,
        `${entry.directory} ${exportTarget.target} must not self-import its package entrypoint`,
      );
    }
  }

  const runtimeExpectations = [
    {
      packageName: '@redcube/runtime-protocol',
      exports: ['CODEX_DEFAULT_MODEL_SELECTION', 'buildCodexRuntimeTopology'],
    },
    {
      packageName: '@redcube/runtime',
      exports: ['probeCodexCli', 'generateStructuredArtifactViaCodexCli'],
    },
    {
      packageName: '@redcube/domain-entry',
      exports: ['getProductStatus', 'runDeliverableRoute'],
    },
    {
      packageName: '@redcube/runtime-protocol',
      exports: ['buildSourcePackFanoutArtifact', 'resolveWorkspaceContract'],
    },
  ];

  for (const expectation of runtimeExpectations) {
    const runtimeModule = await import(expectation.packageName);
    for (const exportName of expectation.exports) {
      assert.equal(
        exportName in runtimeModule,
        true,
        `${expectation.packageName} must expose ${exportName} from dist runtime export`,
      );
    }
  }
});

test('root AGENTS stays tracked', () => {
  assert.equal(existsSync(path.resolve('AGENTS.md')), true);
});

test('test runner treats root-level TypeScript tests as first-class lane members', () => {
  assert.deepEqual(
    buildNodeTestArgs({
      forwardedArgs: ['--test-reporter=spec'],
      serialized: false,
    }),
    ['--test', '--test-reporter=spec'],
  );

  assert.deepEqual(
    discoverRootTestFiles({
      entries: ['alpha.test.js', 'beta.test.ts', 'nested', 'helper.js'],
    }),
    ['tests/alpha.test.js', 'tests/beta.test.ts'],
  );

  assert.doesNotThrow(() => assertRootTestPartition({
    discoveredFiles: ['tests/alpha.test.js', 'tests/beta.test.ts'],
    partitionFiles: ['tests/alpha.test.js', 'tests/beta.test.ts'],
  }));

  assert.throws(
    () => assertRootTestPartition({
      discoveredFiles: ['tests/alpha.test.js', 'tests/beta.test.ts'],
      partitionFiles: ['tests/alpha.test.js'],
    }),
    /未被纳入 meta\/integration\/e2e\/historical 的测试文件: tests\/beta\.test\.ts/,
  );
});

test('test registry is the single source of truth for lane membership and keeps historical explicit', () => {
  assert.doesNotThrow(() => assertValidTestRegistry());

  const groups = buildTestGroups();
  const registryFiles = TEST_REGISTRY.map((entry) => entry.file);

  assert.equal(registryFiles.length, new Set(registryFiles).size);
  assert.equal(groups.historical.length, 1);
  assert.equal(groups.fast.length, 44);
  assert.equal(groups.smoke.length > 0, true);
  assert.equal(groups.smoke.length < groups.fast.length, true);
  assert.equal(groups['meta:ci'].some((file) => groups.fast.includes(file)), false);
  assert.equal(groups['integration:remaining'].some((file) => groups.fast.includes(file)), false);

  for (const historicalFile of groups.historical) {
    assert.equal(groups.full.includes(historicalFile), false, historicalFile);
    assert.equal(groups['full:with-historical'].includes(historicalFile), true, historicalFile);
  }

  for (const entry of TEST_REGISTRY) {
    assert.equal(typeof entry.file, 'string');
    assert.equal(typeof entry.lane, 'string');
    assert.equal(Object.keys(entry).every((key) => ['file', 'lane', 'smoke', 'fast', 'routeHeavy'].includes(key)), true);
  }
});
