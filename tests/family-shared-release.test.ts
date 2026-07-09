// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { assertCurrentRepoSharedPinAlignment } from '../scripts/run-test-group-lib.ts';

test('domain entry package and lock stay aligned with the current OPL family shared release pin contract', () => {
  const inspection = assertCurrentRepoSharedPinAlignment({
    repoRoot: process.cwd(),
    consumerRepoId: 'redcube',
  });

  assert.equal(inspection.owner_commit.length, 40);
  assert.equal(inspection.status, 'aligned');
  assert.deepEqual(
    inspection.findings.map((entry) => entry.file),
    ['packages/redcube-domain-entry/package.json', 'package-lock.json'],
  );
  assert.deepEqual(
    inspection.findings.map((entry) => entry.status),
    ['aligned', 'aligned'],
  );
  assert.deepEqual(
    inspection.findings.map((entry) => entry.pins),
    [[inspection.owner_commit], [inspection.owner_commit]],
  );
});

test('family shared release check fails closed without the OPL owner contract', () => {
  const ownerRepoRoot = mkdtempSync(path.join(tmpdir(), 'redcube-missing-owner-release-'));

  try {
    assert.throws(
      () => assertCurrentRepoSharedPinAlignment({
        repoRoot: process.cwd(),
        consumerRepoId: 'redcube',
        ownerRepoRoot,
      }),
      /shared-owner-release\.json|ENOENT/,
    );
  } finally {
    rmSync(ownerRepoRoot, { recursive: true, force: true });
  }
});

test('package scripts expose a dedicated family verify lane', () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

  assert.equal(packageJson.scripts?.['test:family'], 'node --experimental-strip-types scripts/verify-lane.ts family');
});
