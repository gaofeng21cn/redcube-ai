import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  inspectCurrentRepoSharedPinAlignment,
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

function withTempRedcubeRepo(buildFiles, run) {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-shared-pin-'));
  const repoRoot = path.join(tempRoot, 'redcube-ai');
  mkdirSync(repoRoot, { recursive: true });

  const writeJson = (relativePath, value) => {
    const absolutePath = path.join(repoRoot, relativePath);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, JSON.stringify(value, null, 2));
  };

  buildFiles({ repoRoot, writeJson });
  try {
    return run(repoRoot);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

test('inspectCurrentRepoSharedPinAlignment falls back to the consumer pin when the owner repo contract is unavailable', () => {
  const ownerCommit = '0123456789abcdef0123456789abcdef01234567';
  const result = withTempRedcubeRepo(({ writeJson }) => {
    writeJson('packages/redcube-gateway/package.json', {
      dependencies: {
        'opl-gateway-shared': `git+https://github.com/gaofeng21cn/one-person-lab.git#${ownerCommit}`,
      },
    });
    writeJson('package-lock.json', {
      packages: {
        'packages/redcube-gateway': {
          dependencies: {
            'opl-gateway-shared': `git+https://github.com/gaofeng21cn/one-person-lab.git#${ownerCommit}`,
          },
        },
      },
    });
  }, (repoRoot) => inspectCurrentRepoSharedPinAlignment({
    repoRoot,
    ownerRepoRoot: path.join(repoRoot, '..', 'one-person-lab'),
  }));

  assert.equal(result.status, 'aligned');
  assert.equal(result.owner_commit, ownerCommit);
  assert.deepEqual(
    result.findings.map((entry) => entry.file),
    ['packages/redcube-gateway/package.json', 'package-lock.json'],
  );
  assert.deepEqual(
    result.findings.map((entry) => entry.status),
    ['aligned', 'aligned'],
  );
});

test('inspectCurrentRepoSharedPinAlignment fallback still reports stale package-lock drift', () => {
  const ownerCommit = '89abcdef0123456789abcdef0123456789abcdef';
  const staleCommit = 'fedcba9876543210fedcba9876543210fedcba98';
  const result = withTempRedcubeRepo(({ writeJson }) => {
    writeJson('packages/redcube-gateway/package.json', {
      dependencies: {
        'opl-gateway-shared': `git+https://github.com/gaofeng21cn/one-person-lab.git#${ownerCommit}`,
      },
    });
    writeJson('package-lock.json', {
      packages: {
        'packages/redcube-gateway': {
          dependencies: {
            'opl-gateway-shared': `git+https://github.com/gaofeng21cn/one-person-lab.git#${staleCommit}`,
          },
        },
      },
    });
  }, (repoRoot) => inspectCurrentRepoSharedPinAlignment({
    repoRoot,
    ownerRepoRoot: path.join(repoRoot, '..', 'one-person-lab'),
  }));

  assert.equal(result.status, 'stale');
  assert.equal(result.owner_commit, ownerCommit);
  assert.deepEqual(
    result.findings.map((entry) => entry.status),
    ['aligned', 'stale_pin'],
  );
  assert.deepEqual(result.findings[1]?.pins, [staleCommit]);
});
