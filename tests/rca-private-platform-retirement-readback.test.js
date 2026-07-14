import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { buildPrivatePlatformSourceGuardReadback } from '../scripts/check-private-platform-retirement.ts';

const repoRoot = path.resolve('.');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));

function assertReadback(payload) {
  assert.equal(payload.surface_kind, 'rca_private_platform_source_guard_summary');
  assert.equal(payload.state, 'passed_repo_source_guard_only');
  assert.deepEqual(payload.failed_checks, []);
  assert.equal(payload.guard_summary.present_retired_source_root_count, 0);
  assert.equal(payload.guard_summary.retired_runtime_token_violation_count, 0);
  assert.equal(payload.guard_summary.hosted_runtime_command_template_count, 0);
}

test('RCA no-resurrection readback proves private source roots and command templates are absent', () => {
  assertReadback(buildPrivatePlatformSourceGuardReadback());
});

test('RCA package and generated handoff expose no repo-local runtime or handler', () => {
  const packageJson = readJson('package.json');
  const handoff = readJson('contracts/generated_surface_handoff.json');
  const policy = readJson('contracts/private_functional_surface_policy.json');

  assert.equal(packageJson.workspaces, undefined);
  assert.equal(packageJson.dependencies, undefined);
  assert.deepEqual(handoff.repo_local_handler_targets, []);
  assert.equal(handoff.bridge_exit_gate.status, 'repo_local_wrappers_physically_retired');
  assert.equal(handoff.bridge_exit_gate.structural_cutover_complete, true);
  assert.equal(handoff.repo_local_launcher_policy.repo_local_cli_allowed, false);
  assert.equal(handoff.repo_local_launcher_policy.repo_local_domain_handler_allowed, false);
  assert.equal(handoff.repo_local_launcher_policy.repo_local_product_entry_allowed, false);
  assert.equal(policy.no_second_control_plane_gate.fallback_runtime_allowed, false);
});

test('RCA no-resurrection command emits compact parseable JSON', () => {
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', 'scripts/check-private-platform-retirement.ts', '--format', 'json'],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(result.stdout.length < 20000);
  assertReadback(JSON.parse(result.stdout));
});
