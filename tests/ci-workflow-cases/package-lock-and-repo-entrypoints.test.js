import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import {
  listWorkspacePackageDirs,
  readRepoFile,
  readRepoJson,
} from './shared.js';

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

test('CI constructs and links the OPL Framework before running consumers', () => {
  const workflow = readRepoFile('.github/workflows/ci.yml');

  assert.match(workflow, /npm ci --prefix \..\/one-person-lab --ignore-scripts/);
  assert.match(workflow, /npm run --prefix \..\/one-person-lab build/);
  assert.match(workflow, /connect agent-packages link-framework --agent-root "\$GITHUB_WORKSPACE" --json/);
  assert.doesNotMatch(workflow, /scripts\/run-test-group\.ts family/);
});
