await import('./typescript-service-boundary-cases/package-dependency-boundary.test.js');
await import('./typescript-service-boundary-cases/runtime-topology-authority.test.js');

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

test('P16 slice 3: CLI exposes public APIs from index while cli remains the bin runner', async () => {
  assert.equal(existsSync(path.resolve('apps/redcube-cli/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('apps/redcube-cli/src/types.ts')), true);

  const pkg = JSON.parse(readFileSync(path.resolve('apps/redcube-cli/package.json'), 'utf-8'));
  const cliModule = await import('../apps/redcube-cli/dist/cli.js');
  const publicModule = await import('../apps/redcube-cli/dist/index.js');

  assert.equal(pkg.types, './dist/index.d.ts');
  assert.equal(pkg.bin.redcube, 'dist/cli.js');
  assert.equal(existsSync(path.resolve('apps/redcube-cli/src/cli.js')), false);
  assert.deepEqual(Object.keys(cliModule), []);
  assert.equal(typeof publicModule.executeCli, 'function');
  assert.equal(typeof publicModule.runCli, 'function');
});

test('P20.B: default registries are package-local runtime contracts, not standalone package facades', () => {
  const runtimeSource = readFileSync(path.resolve('packages/redcube-runtime/src/default-registries.ts'), 'utf-8');

  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/families/ppt/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/families/xiaohongshu/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/families/poster-onepager/index.ts')), true);

  assert.match(runtimeSource, /export function getDefaultOverlayRegistry/);
  assert.match(runtimeSource, /runner_id: 'families\/ppt'/);
  assert.doesNotMatch(runtimeSource, /@redcube\/runtime-family-/);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/default-registries.js')), false);
});

test('P22.A: Codex executor substrate is internal to runtime, not a standalone RCA client package', () => {
  const codexClientPackages = readdirSync(path.resolve('packages'))
    .filter((entry) => /codex.*(?:cli.*client|client)/.test(entry));

  assert.deepEqual(codexClientPackages, []);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/executors/codex-caller.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/executors/index-parts/command-process.ts')), true);

  const rootTsconfig = JSON.parse(readFileSync(path.resolve('tsconfig.json'), 'utf-8'));
  const runtimeSource = readFileSync(path.resolve('packages/redcube-runtime/src/executors/index-parts/constants.ts'), 'utf-8');
  assert.equal(
    rootTsconfig.references.some((entrypoint) => /codex.*(?:cli.*client|client)/.test(entrypoint.path)),
    false,
  );
  assert.match(runtimeSource, /OPL_CODEX_EXECUTOR_SURFACE = 'opl_codex_executor'/);
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
