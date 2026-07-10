// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { assertCurrentRepoSharedPinAlignment } from '../scripts/run-test-group-lib.ts';
import { buildVerifyLanePlan } from '../scripts/test-registry.ts';

test('root and domain manifests plus lock stay aligned with the current OPL family shared release contract', () => {
  const inspection = assertCurrentRepoSharedPinAlignment({
    repoRoot: process.cwd(),
    consumerRepoId: 'redcube',
  });

  assert.equal(inspection.owner_commit.length, 40);
  assert.equal(inspection.status, 'aligned');
  assert.deepEqual(
    inspection.findings.map((entry) => entry.file),
    ['package.json', 'packages/redcube-domain-entry/package.json', 'package-lock.json'],
  );
  assert.deepEqual(
    inspection.findings.map((entry) => entry.status),
    ['aligned', 'aligned', 'aligned'],
  );
  assert.deepEqual(
    inspection.findings.map((entry) => entry.pins),
    [['latest-stable'], ['latest-stable'], [inspection.owner_commit]],
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

test('stale exact lock receipt remains nonblocking when manifests follow latest-stable', () => {
  const ownerRepoRoot = mkdtempSync(path.join(tmpdir(), 'redcube-owner-release-'));
  const consumerRepoRoot = mkdtempSync(path.join(tmpdir(), 'redcube-consumer-release-'));
  const ownerCommit = 'b'.repeat(40);
  const staleCommit = 'a'.repeat(40);

  try {
    const contractPath = path.join(ownerRepoRoot, 'contracts/family-release/shared-owner-release.json');
    mkdirSync(path.dirname(contractPath), { recursive: true });
    writeFileSync(contractPath, JSON.stringify({
      contract_kind: 'family_shared_owner_release.v2',
      owner_repo: 'one-person-lab',
      owner_commit: ownerCommit,
      latest_stable: { ref: 'latest-stable', commit: ownerCommit },
      consumer_policy: {
        manifest_channel: 'latest-stable',
        lockfile_exact_commit_receipt_required: true,
        consumer_exact_commit_equality_gate: false,
      },
      packages: {},
      consumers: [{
        repo_id: 'redcube',
        repo_dir: 'redcube-ai',
        verify_command: 'scripts/verify.sh family',
        targets: [
          { file: 'package.json', kind: 'js_dependency' },
          { file: 'packages/redcube-domain-entry/package.json', kind: 'js_dependency' },
          { file: 'package-lock.json', kind: 'js_lock' },
        ],
      }],
    }));
    writeFileSync(
      path.join(consumerRepoRoot, 'package.json'),
      JSON.stringify({ dependencies: { 'opl-framework-shared': 'git+https://github.com/gaofeng21cn/one-person-lab.git#latest-stable' } }),
    );
    const domainPackagePath = path.join(consumerRepoRoot, 'packages/redcube-domain-entry/package.json');
    mkdirSync(path.dirname(domainPackagePath), { recursive: true });
    writeFileSync(
      domainPackagePath,
      JSON.stringify({ dependencies: { 'opl-framework-shared': 'git+https://github.com/gaofeng21cn/one-person-lab.git#latest-stable' } }),
    );
    writeFileSync(path.join(consumerRepoRoot, 'package-lock.json'), JSON.stringify({
      packages: {
        'node_modules/opl-framework-shared': {
          resolved: `git+ssh://git@github.com/gaofeng21cn/one-person-lab.git#${staleCommit}`,
        },
      },
    }));

    const inspection = assertCurrentRepoSharedPinAlignment({
      repoRoot: consumerRepoRoot,
      consumerRepoId: 'redcube',
      ownerRepoRoot,
    });

    assert.equal(inspection.status, 'update_available');
  } finally {
    rmSync(ownerRepoRoot, { recursive: true, force: true });
    rmSync(consumerRepoRoot, { recursive: true, force: true });
  }
});

test('family verification is owned by the registry lane dispatcher', () => {
  const plan = buildVerifyLanePlan('family');

  assert.deepEqual(plan.steps, [
    { kind: 'build' },
    { kind: 'test-group', group: 'family' },
  ]);
});
