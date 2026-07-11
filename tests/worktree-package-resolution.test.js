import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import {
  assertRequiredRuntimeSharedResolution,
  assertWorkspacePackageResolution,
} from '../scripts/run-test-group-lib.ts';

test('inspectWorkspacePackageResolution accepts workspace packages resolved inside the current checkout', () => {
  const repoRoot = '/tmp/redcube/.worktrees/codex-pass';
  const result = assertWorkspacePackageResolution({
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
  assert.throws(
    () => assertWorkspacePackageResolution({
      repoRoot,
      resolve(specifier) {
        return path.join(leakedRoot, 'packages', specifier.replace('@redcube/', ''), 'src', 'index.js');
      },
    }),
    /workspace package resolution leaked outside the current checkout/,
  );
});

test('inspectRequiredRuntimeSharedResolution accepts required runtime/shared specifiers resolved in checkout', () => {
  const repoRoot = '/tmp/redcube/.worktrees/codex-pass';
  const result = assertRequiredRuntimeSharedResolution({
    repoRoot,
    checks: [
      {
        specifier: '@redcube/redcube-config/xiaohongshu-author-profile',
        resolve_from: 'packages/redcube-runtime/package.json',
      },
      {
        specifier: 'opl-framework/product-entry-companions',
        resolve_from: 'packages/redcube-domain-entry/package.json',
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
  assert.throws(
    () => assertRequiredRuntimeSharedResolution({
      repoRoot,
      checks: [
        {
          specifier: '@redcube/redcube-config/xiaohongshu-author-profile',
          resolve_from: 'packages/redcube-runtime/package.json',
        },
        {
          specifier: 'opl-framework/product-entry-program-companions',
          resolve_from: 'packages/redcube-domain-entry/package.json',
        },
      ],
      resolve(specifier) {
        if (specifier === 'opl-framework/product-entry-program-companions') {
          const error = new Error('Cannot find module');
          error.code = 'ERR_MODULE_NOT_FOUND';
          throw error;
        }
        return path.join(repoRoot, 'node_modules', specifier, 'index.js');
      },
    }),
    /opl-framework\/product-entry-program-companions/,
  );
});
