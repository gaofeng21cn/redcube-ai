// @ts-nocheck
await import('./typescript-service-boundary-cases/package-dependency-boundary.test.ts');
await import('./typescript-service-boundary-cases/runtime-topology-authority.test.ts');

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';

test('P16 slice 1: runtime exposes a TypeScript service entrypoint and typed boundary exports', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/types.ts')), true);

  const pkg = JSON.parse(readFileSync(path.resolve('packages/redcube-runtime/package.json'), 'utf-8'));

  assert.equal(pkg.types, './dist/index.d.ts');
});

test('P16 slice 2: legacy pack-runtime compiler registry service boundary is removed', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-pack-runtime')), false);
  const rootTsconfig = JSON.parse(readFileSync(path.resolve('tsconfig.json'), 'utf-8'));
  assert.equal(
    rootTsconfig.references.some((entry) => entry.path === './packages/redcube-pack-runtime'),
    false,
  );
});

test('P16 slice 3: CLI exposes a TypeScript service entrypoint and typed command contracts', () => {
  assert.equal(existsSync(path.resolve('apps/redcube-cli/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('apps/redcube-cli/src/types.ts')), true);

  const pkg = JSON.parse(readFileSync(path.resolve('apps/redcube-cli/package.json'), 'utf-8'));

  assert.equal(pkg.types, './dist/index.d.ts');
  assert.equal(pkg.bin.redcube, 'dist/cli.js');
  assert.equal(existsSync(path.resolve('apps/redcube-cli/src/cli.js')), false);
});

test('P16 slice 4: RCA no longer self-maintains a production MCP API app', () => {
  assert.equal(existsSync(path.resolve('apps/redcube-mcp')), false);
  const rootTsconfig = JSON.parse(readFileSync(path.resolve('tsconfig.json'), 'utf-8'));
  assert.equal(
    rootTsconfig.references.some((entrypoint) => entrypoint.path === './apps/redcube-mcp'),
    false,
  );
});

test('P20.B: default registries are package-local runtime contracts, not standalone package facades', () => {
  const rootTsconfig = JSON.parse(readFileSync(path.resolve('tsconfig.json'), 'utf-8'));
  const runtimeSource = readFileSync(path.resolve('packages/redcube-runtime/src/default-registries.ts'), 'utf-8');

  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-registry/package.json')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-overlay-registry/package.json')), false);
  assert.equal(
    rootTsconfig.references.some((entrypoint) => entrypoint.path === './packages/redcube-runtime-family-registry'),
    false,
  );
  assert.equal(
    rootTsconfig.references.some((entrypoint) => entrypoint.path === './packages/redcube-overlay-registry'),
    false,
  );
  for (const retiredFamilyPackage of [
    './packages/redcube-runtime-family-ppt',
    './packages/redcube-runtime-family-xiaohongshu',
    './packages/redcube-runtime-family-poster-onepager',
  ]) {
    assert.equal(rootTsconfig.references.some((entrypoint) => entrypoint.path === retiredFamilyPackage), false);
    assert.equal(existsSync(path.resolve(retiredFamilyPackage)), false);
  }
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/families/ppt/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/families/xiaohongshu/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/families/poster-onepager/index.ts')), true);

  assert.match(runtimeSource, /export function getDefaultOverlayRegistry/);
  assert.match(runtimeSource, /runnerId: 'families\/ppt'/);
  assert.doesNotMatch(runtimeSource, /@redcube\/runtime-family-/);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/default-registries.js')), false);
});

test('P22.A: codex-cli-client exposes a TypeScript service entrypoint and typed local-exec contracts', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-codex-cli-client/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-codex-cli-client/src/index.impl.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-codex-cli-client/tsconfig.json')), true);

  const pkg = JSON.parse(readFileSync(path.resolve('packages/redcube-codex-cli-client/package.json'), 'utf-8'));
  assert.equal(pkg.types, './dist/index.d.ts');
});

test('P23.A: current utility package exposes TypeScript service entrypoints without legacy utility packages', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-tools')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-llm')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-overlay-paper-poster')), false);

  const packages = [
    {
      directory: 'packages/redcube-config',
      expectedTypesEntry: './dist/index.d.ts',
      publicEntrypoints: [
        'src/index.ts',
        'src/private-profile.ts',
        'src/xiaohongshu-author-profile.ts',
      ],
    },
  ];
  const rootTsconfig = JSON.parse(readFileSync(path.resolve('tsconfig.json'), 'utf-8'));

  for (const pkgSpec of packages) {
    const pkg = JSON.parse(readFileSync(path.resolve(pkgSpec.directory, 'package.json'), 'utf-8'));
    const packageTsconfig = JSON.parse(readFileSync(path.resolve(pkgSpec.directory, 'tsconfig.json'), 'utf-8'));
    assert.equal(pkg.types, pkgSpec.expectedTypesEntry, pkgSpec.directory);
    assert.equal(packageTsconfig.extends, '../../tsconfig.package-build.json', pkgSpec.directory);
    assert.equal(
      rootTsconfig.references.some((entrypoint) => entrypoint.path === `./${pkgSpec.directory}`),
      true,
      pkgSpec.directory,
    );

    for (const entrypoint of pkgSpec.publicEntrypoints) {
      assert.equal(existsSync(path.resolve(pkgSpec.directory, entrypoint)), true, entrypoint);
    }
  }

  const redcubeConfigPkg = JSON.parse(readFileSync(path.resolve('packages/redcube-config/package.json'), 'utf-8'));
  assert.equal(redcubeConfigPkg.exports['.'].default, './dist/index.js');
  assert.equal(redcubeConfigPkg.exports['.'].types, './dist/index.d.ts');
  assert.equal(redcubeConfigPkg.exports['./private-profile'].default, './dist/private-profile.js');
  assert.equal(redcubeConfigPkg.exports['./private-profile'].types, './dist/private-profile.d.ts');
  assert.equal(redcubeConfigPkg.exports['./xiaohongshu-author-profile'].default, './dist/xiaohongshu-author-profile.js');
  assert.equal(redcubeConfigPkg.exports['./xiaohongshu-author-profile'].types, './dist/xiaohongshu-author-profile.d.ts');
});

const TESTS_DIR = 'tests';
const TRANSIENT_TEST_FIXTURE_DIRS = new Set([
  '__closeout-audit-nested-ts-case__',
]);

function isTransientTestFixtureDir(entry) {
  return TRANSIENT_TEST_FIXTURE_DIRS.has(entry)
    || /^__closeout-audit-nested-ts-case-[0-9a-f-]+__$/.test(entry);
}

function toRepoPath(file) {
  return file.split(path.sep).join('/');
}

function collectTestFiles(dir = TESTS_DIR) {
  return readdirSync(dir)
    .flatMap((entry) => {
      const file = path.join(dir, entry);
      let stat;
      try {
        stat = statSync(file);
      } catch (error) {
        if (error?.code === 'ENOENT') {
          return [];
        }
        throw error;
      }
      if (stat.isDirectory()) {
        if (dir === TESTS_DIR && isTransientTestFixtureDir(entry)) {
          return [];
        }
        return collectTestFiles(file);
      }
      return file.endsWith('.test.ts') ? [toRepoPath(file)] : [];
    })
    .sort();
}

function rootTestFiles(files) {
  return files.filter((file) => /^tests\/[^/]+\.test\.ts$/.test(file));
}

function nestedTestFiles(files) {
  return files.filter((file) => /^tests\/[^/]+\/.+\.test\.ts$/.test(file));
}

function importedTestFiles(file) {
  const source = readFileSync(file, 'utf-8');
  const importSpecifiers = [
    ...source.matchAll(/\bimport\s*\(\s*(['"])(\.{1,2}\/[^'"]+?\.test\.ts)\1\s*\)/g),
    ...source.matchAll(/^\s*import\s+(['"])(\.{1,2}\/[^'"]+?\.test\.ts)\1\s*;?/gm),
  ].map((match) => match[2]);

  return importSpecifiers.map((specifier) => (
    toRepoPath(path.normalize(path.join(path.dirname(file), specifier)))
  ));
}

function reachableFromRootTests(rootFiles) {
  const reachable = new Set();
  const pending = [...rootFiles];

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || reachable.has(current)) {
      continue;
    }
    reachable.add(current);

    for (const imported of importedTestFiles(current)) {
      if (!reachable.has(imported)) {
        pending.push(imported);
      }
    }
  }

  return reachable;
}

test('nested test files are explicitly mounted from root test entrypoints', () => {
  const testFiles = collectTestFiles();
  const rootFiles = rootTestFiles(testFiles);
  const nestedFiles = nestedTestFiles(testFiles);
  const reachableFiles = reachableFromRootTests(rootFiles);
  const unmounted = nestedFiles.filter((file) => !reachableFiles.has(file));

  assert.deepEqual(
    unmounted,
    [],
    [
      'nested tests must be reachable from a root tests/*.test.ts entrypoint via explicit test imports',
      ...unmounted,
    ].join('\n'),
  );
});
