import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { inspectCurrentRepoSharedPinAlignment } from '../scripts/run-test-group-lib.mjs';

test('gateway package and lock stay aligned with the current OPL family shared release pin contract', () => {
  const inspection = inspectCurrentRepoSharedPinAlignment({
    repoRoot: process.cwd(),
    consumerRepoId: 'redcube',
  });

  assert.equal(inspection.owner_commit.length, 40);
  assert.equal(inspection.status, 'aligned');
  assert.deepEqual(
    inspection.findings.map((entry) => entry.file),
    ['packages/redcube-gateway/package.json', 'package-lock.json'],
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

test('package scripts expose a dedicated family verify lane', () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

  assert.equal(packageJson.scripts?.['test:family'], 'node scripts/run-test-group.mjs family');
});
