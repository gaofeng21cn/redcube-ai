// @ts-nocheck
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import {
  analyzeTypeScriptOwnerBoundarySource,
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
  assert.equal(
    payload.guard_summary.active_source_scan.behavioral_scan_policy_id,
    'rca.source_morphology.behavioral_owner_boundary_scan.v1',
  );
  assert.equal(
    payload.guard_summary.active_source_scan.typescript_ast_policy_id,
    'rca.source_morphology.product_session_owner_ast_boundary.v1',
  );
  assert.equal(payload.guard_summary.active_source_scan.resurrection_violation_count, 0);
  assert.equal(payload.guard_summary.active_source_scan.behavior_violation_count, 0);
  assert.equal(payload.guard_summary.active_source_scan.typescript_ast_violation_count, 0);
  assert.deepEqual(payload.guard_summary.active_source_scan.forbidden_construct_ids, [
    'repo_local_product_entry_companion_assembly',
    'repo_local_executor_attempt_blocker_envelope',
    'retired_get_product_start_wrapper',
    'retired_get_product_start_export',
  ]);
  assert.equal(payload.guard_summary.active_source_scan.violation_count, 0);
  assert.deepEqual(payload.guard_summary.active_source_scan.violations, []);
  assert.equal(payload.authority_boundary.readback_can_authorize_physical_delete, false);
  assert.equal(payload.authority_boundary.readback_can_claim_default_caller_cutover, false);
  assert.equal(payload.authority_boundary.readback_can_claim_visual_ready, false);
  assert.equal(payload.authority_boundary.readback_can_claim_domain_ready, false);
  assert.equal(payload.authority_boundary.readback_can_claim_production_ready, false);
}

const AST_POLICY = {
  forbiddenModuleSpecifiers: ['fs', 'fs/promises', 'node:fs', 'node:fs/promises'],
  forbiddenPropertyNames: [
    'runtime_state_path',
    'session_file',
    'session_file_ref',
    'session_store_root',
    'resumed_from_session',
  ],
};

test('RCA product-session AST guard catches aliased filesystem imports after function renames', () => {
  for (const moduleSpecifier of AST_POLICY.forbiddenModuleSpecifiers) {
    const violations = analyzeTypeScriptOwnerBoundarySource({
      sourceRef: 'fixture/renamed-owner.ts',
      sourceText: `
        import { readFile as loadDomainSnapshot } from '${moduleSpecifier}';
        export function renamedDomainSnapshotOwner() { return loadDomainSnapshot('state.json'); }
      `,
      ...AST_POLICY,
    });
    assert.equal(violations.length, 1, moduleSpecifier);
    assert.equal(
      violations[0].endsWith(`forbidden_module_import:${moduleSpecifier}`),
      true,
      moduleSpecifier,
    );
  }
});

test('RCA product-session AST guard catches property syntax variants without scanning denylist strings', () => {
  const violations = analyzeTypeScriptOwnerBoundarySource({
    sourceRef: 'fixture/property-variants.ts',
    sourceText: `
      const runtime_state_path = 'state.json';
      const payload = {
        runtime_state_path,
        'session_file': 'session.json',
        ['session_file_ref']: 'session-ref',
        session_store_root: 'sessions',
        resumed_from_session: true,
      };
      export function renamedAssembler() { return payload['session_file_ref']; }
    `,
    ...AST_POLICY,
  });
  assert.deepEqual(
    [...new Set(violations.map((entry) => entry.split(':').at(-1)))].sort(),
    [
      'resumed_from_session',
      'runtime_state_path',
      'session_file',
      'session_file_ref',
      'session_store_root',
    ],
  );
});

for (const scope of ['private-platform', 'default-caller-tail']) {
  test(`RCA ${scope} readback is a compact source guard summary`, () => {
    const payload = buildPrivatePlatformSourceGuardReadback(scope);

    assertSourceGuardSummary(payload, scope);
    assert.equal(
      payload.source_refs.active_source_scan_policy,
      'contracts/physical_source_morphology_policy.json#/default_caller_tail_thinning_gate/active_source_resurrection_scan_policy',
    );
    assert.equal(
      payload.source_refs.behavioral_source_scan_policy,
      'contracts/physical_source_morphology_policy.json#/behavioral_source_scan_policy',
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
