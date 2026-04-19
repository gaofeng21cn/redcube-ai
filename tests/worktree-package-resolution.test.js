import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import {
  inspectRequiredRuntimeSharedResolution,
  inspectWorkspacePackageResolution,
} from '../scripts/run-test-group-lib.mjs';

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

test('inspectRequiredRuntimeSharedResolution accepts required runtime/shared specifiers resolved in checkout', () => {
  const repoRoot = '/tmp/redcube/.worktrees/codex-pass';
  const result = inspectRequiredRuntimeSharedResolution({
    repoRoot,
    checks: [
      {
        specifier: '@redcube/redcube-config/xiaohongshu-author-profile',
        resolve_from: 'packages/redcube-runtime/package.json',
      },
      {
        specifier: 'opl-gateway-shared/product-entry-companions',
        resolve_from: 'packages/redcube-gateway/package.json',
      },
      {
        specifier: 'opl-gateway-shared/family-shared-release',
        resolve_from: 'packages/redcube-gateway/package.json',
      },
    ],
    resolve(specifier) {
      return path.join(repoRoot, 'node_modules', specifier, 'index.js');
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.missing_specifiers.length, 0);
});

test('inspectRequiredRuntimeSharedResolution fails closed when required runtime/shared specifiers are missing', () => {
  const repoRoot = '/tmp/redcube/.worktrees/codex-pass';
  const result = inspectRequiredRuntimeSharedResolution({
    repoRoot,
    checks: [
      {
        specifier: '@redcube/redcube-config/xiaohongshu-author-profile',
        resolve_from: 'packages/redcube-runtime/package.json',
      },
      {
        specifier: 'opl-gateway-shared/product-entry-program-companions',
        resolve_from: 'packages/redcube-gateway/package.json',
      },
      {
        specifier: 'opl-gateway-shared/family-shared-release',
        resolve_from: 'packages/redcube-gateway/package.json',
      },
    ],
    resolve(specifier) {
      if (
        specifier === 'opl-gateway-shared/product-entry-program-companions'
        || specifier === 'opl-gateway-shared/family-shared-release'
      ) {
        const error = new Error('Cannot find module');
        error.code = 'ERR_MODULE_NOT_FOUND';
        throw error;
      }
      return path.join(repoRoot, 'node_modules', specifier, 'index.js');
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.missing_specifiers.length, 2);
  assert.deepEqual(
    result.missing_specifiers.map((entry) => entry.specifier).sort(),
    [
      'opl-gateway-shared/family-shared-release',
      'opl-gateway-shared/product-entry-program-companions',
    ],
  );
  assert.match(result.message, /npm install/);
});
