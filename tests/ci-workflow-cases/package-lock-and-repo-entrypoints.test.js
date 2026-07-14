import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import {
  listWorkspacePackageDirs,
  readRepoFile,
  readRepoJson,
} from './shared.js';

test('package metadata has no repo-local runtime workspace or dependency graph', () => {
  const rootPackage = readRepoJson('package.json');
  const lockfile = readRepoJson('package-lock.json');
  const lockPackages = lockfile.packages ?? {};

  assert.equal(rootPackage.workspaces, undefined);
  assert.equal(rootPackage.dependencies, undefined);
  assert.deepEqual(listWorkspacePackageDirs(), []);
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

test('CI validates the repo with the latest OPL Framework without mutating package installation state', () => {
  const workflow = readRepoFile('.github/workflows/ci.yml');

  assert.match(workflow, /npm ci --prefix \..\/one-person-lab --ignore-scripts/);
  assert.match(workflow, /npm run --prefix \..\/one-person-lab build/);
  assert.match(workflow, /agents interfaces --repo-dir "\$GITHUB_WORKSPACE" --json/);
  assert.match(workflow, /agents conformance --agent "rca=\$GITHUB_WORKSPACE" --json/);
  assert.doesNotMatch(workflow, /packages link-framework|packages install|packages update/);
  assert.match(workflow, /npm run typecheck:ci/);
  assert.doesNotMatch(workflow, /scripts\/run-test-group\.ts family/);
});
