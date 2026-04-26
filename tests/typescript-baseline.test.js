import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

import {
  assertRootTestPartition,
  buildNodeTestArgs,
  discoverRootTestFiles,
} from '../scripts/run-test-group-lib.mjs';

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

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
  assert.equal(typecheck.include.includes('packages/**/*.ts'), true);
  assert.equal(typecheck.include.includes('packages/**/*.js'), true);
  assert.equal(typecheck.include.includes('packages/**/*.mjs'), true);
  assert.equal(typecheck.include.includes('apps/**/*.ts'), true);
  assert.equal(typecheck.include.includes('tests/**/*.js'), true);
  assert.equal(typecheck.include.includes('tests/**/*.mjs'), true);
  assert.equal(typecheck.include.includes('scripts/**/*.mjs'), true);
  assert.equal(typecheck.include.includes('scripts/**/*.ts'), true);
});

test('root package exposes formal typecheck entrypoint', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts.test, 'node scripts/run-test-group.mjs fast');
  assert.equal(pkg.scripts['test:fast'], 'node scripts/run-test-group.mjs fast');
  assert.equal(pkg.scripts['test:meta'], 'node scripts/run-test-group.mjs meta');
  assert.equal(pkg.scripts['test:integration'], 'node scripts/run-test-group.mjs integration');
  assert.equal(pkg.scripts['test:e2e'], 'node scripts/run-test-group.mjs e2e');
  assert.equal(pkg.scripts['test:historical'], 'node scripts/run-test-group.mjs historical');
  assert.equal(pkg.scripts['test:full'], 'node scripts/run-test-group.mjs full');
  assert.equal(pkg.scripts.typecheck, 'tsc --noEmit --project tsconfig.typecheck.json --pretty false');
  assert.equal(pkg.scripts.build, 'tsc --build tsconfig.json --pretty false');
});

test('workspace packages and apps participate in package-level tsconfig layering', () => {
  const paths = [
    'apps/redcube-cli/tsconfig.json',
    'apps/redcube-mcp/tsconfig.json',
    'packages/redcube-gateway/tsconfig.json',
    'packages/redcube-governance/tsconfig.json',
    'packages/redcube-reference-os/tsconfig.json',
    'packages/redcube-runtime-protocol/tsconfig.json',
    'packages/redcube-runtime/tsconfig.json',
  ];

  for (const file of paths) {
    assert.equal(existsSync(path.resolve(file)), true, file);
    const config = readJson(file);
    assert.equal(config.extends, '../../tsconfig.base.json');
  }
});

test('typescript migration policy reference stays tracked', () => {
  assert.equal(existsSync(path.resolve('docs/policies/typescript_migration_policy.md')), true);
});

test('typescript package build contract freezes legacy source JS exports while targeting compiled dist exports', () => {
  const contractFile = 'contracts/runtime-program/typescript-package-build-contract.json';
  const contract = readJson(contractFile);
  const currentProgram = readJson('contracts/runtime-program/current-program.json');

  assert.equal(contract.contract_id, 'typescript-package-build-contract');
  assert.equal(contract.language, 'typescript');
  assert.equal(
    currentProgram.longrun_goal.language_target.typescript_package_build_contract,
    contractFile,
  );
  assert.equal(contract.current_transition_model.source_types_entry, './src/index.ts');
  assert.equal(contract.current_transition_model.legacy_runtime_export_kind, 'legacy_source_js_runtime_export');
  assert.equal(contract.current_transition_model.future_runtime_export_kind, 'compiled_dist_runtime_export');
  assert.equal(contract.current_transition_model.compiled_runtime_target, './dist/index.js');
  assert.equal(contract.transition_policy.new_packages_must_use_typescript_source, true);
  assert.equal(contract.transition_policy.new_runtime_js_exports_forbidden_without_contract, true);
  assert.equal(contract.quality_gates.typecheck, 'npm run typecheck');
  assert.equal(contract.quality_gates.build, 'npm run build');

  const actualLegacyExports = workspacePackageFiles().flatMap((file) => {
    const pkg = readJson(file);
    const exports = runtimeSourceJsExports(pkg.exports);
    if (exports.length === 0) return [];
    return [{
      directory: path.dirname(file).split(path.sep).join('/'),
      package_name: pkg.name,
      exports,
    }];
  });

  assert.deepEqual(actualLegacyExports, contract.legacy_source_js_runtime_exports);
});

test('workspace packages with active source roots expose TypeScript source contracts before runtime JS migration', () => {
  const contract = readJson('contracts/runtime-program/typescript-package-build-contract.json');
  const legacyExportDirectories = new Set(
    contract.legacy_source_js_runtime_exports.map((entry) => entry.directory),
  );

  for (const file of workspacePackageFiles()) {
    const directory = path.dirname(file).split(path.sep).join('/');
    const srcDirectory = path.join(directory, 'src');
    if (!existsSync(path.resolve(srcDirectory))) continue;

    const pkg = readJson(file);
    assert.equal(pkg.types, './src/index.ts', directory);
    assert.equal(existsSync(path.resolve(directory, 'tsconfig.json')), true, directory);
    assert.equal(existsSync(path.resolve(directory, 'src/index.ts')), true, directory);
    assert.equal(pkg.main ?? null, null, `${directory} must not add a source JS main entry`);

    const sourceJsExports = runtimeSourceJsExports(pkg.exports);
    if (sourceJsExports.length > 0) {
      assert.equal(
        legacyExportDirectories.has(directory),
        true,
        `${directory} has unregistered source JS runtime exports`,
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
    ['--experimental-strip-types', '--test', '--test-reporter=spec'],
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
    /未被纳入 meta\/family\/integration\/e2e\/historical 的测试文件: tests\/beta\.test\.ts/,
  );
});
