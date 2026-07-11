import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import {
  listWorkspacePackageDirs,
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
