// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import {
  listRepoFiles,
  listWorkspacePackageDirs,
  readRepoFile,
  readRepoJson,
} from './shared.ts';

test('repo-local family pin wrapper is the only allowed direct upstream family helper entrypoint', () => {
  const allowedFiles = new Set(['scripts/run-test-group-lib.ts']);
  const disallowedDirectImports = [];
  const upstreamFamilyHelperImportPattern = /\bfrom\s+['"]opl-framework-shared\/family-shared-release['"]|\bimport\s*\(\s*['"]opl-framework-shared\/family-shared-release['"]\s*\)/;
  const sharedOwnerContractPathPattern = /['"]contracts\/family-release\/shared-owner-release\.json['"]/;

  for (const file of [...listRepoFiles('scripts'), ...listRepoFiles('tests')]) {
    if (!/\.(?:ts|js|mjs|cjs)$/.test(file) || allowedFiles.has(file)) {
      continue;
    }

    const text = readRepoFile(file);
    if (
      upstreamFamilyHelperImportPattern.test(text)
      || sharedOwnerContractPathPattern.test(text)
    ) {
      disallowedDirectImports.push(file);
    }
  }

  assert.deepEqual(disallowedDirectImports, []);
});

test('package-lock tracks every declared workspace package', () => {
  const lockfile = readRepoJson('package-lock.json');
  const lockPackages = lockfile.packages ?? {};

  for (const relativeDir of listWorkspacePackageDirs()) {
    const manifest = readRepoJson(path.join(relativeDir, 'package.json'));
    assert.equal(
      Object.hasOwn(lockPackages, relativeDir),
      true,
      `package-lock.json 缺少 workspace 条目: ${relativeDir} (${manifest.name})`
    );
    assert.equal(lockPackages[relativeDir].name, manifest.name);
  }
});
