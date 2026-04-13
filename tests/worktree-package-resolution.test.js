import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { inspectWorkspacePackageResolution } from '../scripts/run-test-group-lib.mjs';

test('inspectWorkspacePackageResolution accepts workspace packages resolved inside the current checkout', () => {
  const repoRoot = '/tmp/redcube/.worktrees/codex-pass';
  const result = inspectWorkspacePackageResolution({
    repoRoot,
    resolve(specifier) {
      return path.join(repoRoot, 'packages', specifier.replace('@redcube/', ''), 'src', 'index.js');
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.leaking_resolutions.length, 0);
});

test('inspectWorkspacePackageResolution fails closed when workspace packages resolve into a sibling checkout', () => {
  const repoRoot = '/tmp/redcube/.worktrees/codex-pass';
  const leakedRoot = '/tmp/redcube';
  const result = inspectWorkspacePackageResolution({
    repoRoot,
    resolve(specifier) {
      return path.join(leakedRoot, 'packages', specifier.replace('@redcube/', ''), 'src', 'index.js');
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.leaking_resolutions.length > 0, true);
  assert.equal(result.leaking_resolutions[0].resolved_path.startsWith(leakedRoot), true);
  assert.match(result.message, /npm install/);
});
