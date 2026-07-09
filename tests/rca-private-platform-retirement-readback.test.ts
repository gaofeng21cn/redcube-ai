// @ts-nocheck
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import {
  buildPrivatePlatformSourceGuardReadback,
} from '../scripts/check-private-platform-retirement.ts';

function assertSourceGuardSummary(payload, scope) {
  assert.equal(payload.surface_kind, 'rca_private_platform_source_guard_summary');
  assert.equal(payload.schema_version, 2);
  assert.equal(payload.scope, scope);
  assert.equal(payload.state, 'passed_repo_source_guard_only');
  assert.deepEqual(payload.failed_checks, []);
  assert.equal(payload.guard_summary.functional_structure_gap_count, 0);
  assert.equal(
    payload.guard_summary.source_ref_integrity_state,
    'repo_local_source_refs_declared_no_second_truth',
  );
  assert.equal(payload.guard_summary.tail_surface_count, 0);
  assert.equal(payload.guard_summary.current_non_tail_surface_count, 5);
  assert.equal(payload.guard_summary.retained_current_refs_only_boundary_count, 3);
  assert.equal(payload.guard_summary.cleanup_candidate_count, 0);
  assert.equal(payload.guard_summary.owner_delta_required, false);
  assert.deepEqual(payload.guard_summary.missing_evidence_ids, []);
  assert.equal(payload.guard_summary.active_source_scan.state, 'passed_active_source_no_resurrection_scan');
  assert.equal(payload.guard_summary.active_source_scan.violation_count, 0);
  assert.deepEqual(payload.guard_summary.active_source_scan.violations, []);
  assert.equal(payload.authority_boundary.readback_can_authorize_physical_delete, false);
  assert.equal(payload.authority_boundary.readback_can_claim_default_caller_cutover, false);
  assert.equal(payload.authority_boundary.readback_can_claim_visual_ready, false);
  assert.equal(payload.authority_boundary.readback_can_claim_domain_ready, false);
  assert.equal(payload.authority_boundary.readback_can_claim_production_ready, false);
}

for (const scope of ['private-platform', 'default-caller-tail']) {
  test(`RCA ${scope} readback is a compact source guard summary`, () => {
    const payload = buildPrivatePlatformSourceGuardReadback(scope);

    assertSourceGuardSummary(payload, scope);
    assert.equal(
      payload.source_refs.active_source_scan_policy,
      'contracts/physical_source_morphology_policy.json#/default_caller_tail_thinning_gate/active_source_resurrection_scan_policy',
    );
  });

  test(`RCA ${scope} script emits compact parseable JSON`, () => {
    const result = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        'scripts/check-private-platform-retirement.ts',
        '--format',
        'json',
        '--scope',
        scope,
      ],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
      },
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.ok(result.stdout.length < 20000);
    assertSourceGuardSummary(JSON.parse(result.stdout), scope);
  });
}
