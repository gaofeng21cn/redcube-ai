// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import {
  ACTIVE_COMPATIBILITY_ALIAS_CLAIM_PATTERNS,
  ACTIVE_ROOTS,
  RETIRED_CONTRACTS,
  RETIRED_SURFACE_GUARD_TEST_FILES,
  listTextFiles,
  normalizePath,
} from './helpers/rca-retired-surface-guard.ts';

test('RCA active source surfaces do not restore compatibility alias claims or repo-local product manifest refs', () => {
  for (const contractFile of RETIRED_CONTRACTS) {
    assert.equal(existsSync(path.resolve(contractFile)), false, contractFile);
  }
  assert.equal(existsSync(path.resolve('packages/redcube-hermes-substrate')), false);

  const violations = [];
  for (const file of ACTIVE_ROOTS.flatMap((root) => {
    if (!existsSync(path.resolve(root))) return [];
    return path.extname(root) ? [root] : listTextFiles(root);
  })) {
    if (RETIRED_SURFACE_GUARD_TEST_FILES.has(normalizePath(file))) continue;
    const text = readFileSync(file, 'utf-8');
    for (const pattern of ACTIVE_COMPATIBILITY_ALIAS_CLAIM_PATTERNS) {
      if (pattern.test(text)) {
        violations.push(`${file}: ${pattern}`);
      }
    }
    for (const term of ['redcube product manifest#', 'redcube product manifest']) {
      if (text.includes(term)) violations.push(`${file}: ${term}`);
    }
  }

  assert.deepEqual(violations, []);
});

test('hosted attempt reconciliation fixture helpers stay out of production domain-entry source', () => {
  assert.equal(
    existsSync(path.resolve('packages/redcube-domain-entry/src/actions/domain-action-adapter-parts/hosted-attempt-reconciliation.ts')),
    false,
  );
  assert.equal(existsSync(path.resolve('tests/helpers/hosted-attempt-reconciliation.ts')), true);

  const violations = [];
  const retiredProductionPatterns = [
    /\bbuildHostedAttemptBridgeFixture\b/,
    /\breconcileHostedAttemptReceipt\b/,
    /\bassertReceiptOnlyHostedAttemptProjection\b/,
    /\bisReceiptOnlyHostedAttemptProjection\b/,
    /hosted-attempt-reconciliation/,
  ];
  for (const file of listTextFiles('packages/redcube-domain-entry/src')) {
    const text = readFileSync(file, 'utf-8');
    for (const pattern of retiredProductionPatterns) {
      if (pattern.test(text)) {
        violations.push(`${file}: ${pattern}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test('RCA consumes OPL family scheduler replacement without owning generic scheduling surfaces', () => {
  const currentProgram = JSON.parse(readFileSync(
    path.resolve('contracts/runtime-program/current-program.json'),
    'utf-8',
  ));
  const adoption = JSON.parse(readFileSync(
    path.resolve('contracts/runtime-program/opl-family-contract-adoption.json'),
    'utf-8',
  ));

  for (const surface of [
    currentProgram.product_release_metadata.opl_family_scheduler_replacement,
    currentProgram.current_state.opl_family_scheduler_replacement,
    adoption.family_scheduler_replacement,
  ]) {
    assert.equal(surface.contract_ref, 'opl.family_scheduler_replacement.v1');
    assert.equal(surface.owner, 'opl');
    assert.equal(surface.consumer, 'redcube_ai');
    assert.equal(surface.projection_mode, 'consumer_projection_only');
    assert.equal(surface.rca_generic_scheduler_owner, false);
    assert.equal(surface.rca_generic_daemon_owner, false);
    assert.equal(surface.rca_generic_lifecycle_owner, false);
    assert.equal(surface.rca_generic_queue_owner, false);
    assert.equal(surface.rca_generic_attempt_ledger_owner, false);
    assert.equal(surface.rca_generic_runner_owner, false);
    assert.equal(surface.rca_generic_workbench_owner, false);
    assert.equal(surface.rca_thin_surface_role, 'visual_domain_authority_pack_plus_thin_program_surface');
    assert.equal(surface.projection_scope, 'consumer_projection_and_visual_domain_authority_refs_only');
    assert.deepEqual(surface.opl_owned_generic_surfaces, [
      'family_scheduler',
      'daemon',
      'generic_lifecycle',
      'typed_queue',
      'attempt_ledger',
      'generic_runner',
      'workbench_shell',
    ]);
    assert.equal(surface.visual_stage_descriptor_scope, 'opl_stage_execution_plan_route_handler_refs_only');
    assert.deepEqual(surface.rca_retained_authority, [
      'visual_truth',
      'review_export_verdict',
      'artifact_authority',
      'visual_memory_body',
      'owner_receipt',
      'native_helper_implementation',
      'typed_blocker',
      'safe_action_refs',
    ]);
  }
});
test('retired managed product-entry contract is tombstoned without compatibility caller', () => {
  const retired = JSON.parse(readFileSync(
    path.resolve('contracts/runtime-program/managed-product-entry-hardening.json'),
    'utf-8',
  ));
  const replacement = JSON.parse(readFileSync(
    path.resolve('contracts/runtime-program/product-entry-session-continuity.json'),
    'utf-8',
  ));

  assert.equal(retired.surface_kind, 'retired_runtime_program_contract_tombstone');
  assert.equal(retired.replacement_contract, 'contracts/runtime-program/product-entry-session-continuity.json');
  assert.equal(retired.compatibility_alias_allowed, false);
  assert.equal(retired.callable_surface_retained, false);
  assert.equal(retired.active_caller_retained, false);
  assert.equal(replacement.product_entry_session_continuity_id, 'product_entry_session_continuity');
  assert.equal(replacement.callable_surface.api_surface, 'getProductEntrySession');
  assert.equal(replacement.callable_surface.cli_entry, 'opl_generated:product_session');
  assert.equal(replacement.callable_surface.repo_local_command_available, false);
  assert.equal(replacement.callable_surface.repo_local_cli_entry_retired, true);
});

test('current program active entry surfaces use generated product shell naming', () => {
  const currentProgram = JSON.parse(readFileSync(
    path.resolve('contracts/runtime-program/current-program.json'),
    'utf-8',
  ));
  const entrySurfaces = currentProgram.current_state.active_baton.scope.entry_surfaces;
  const productEntrySurfaces = currentProgram.product_release_metadata.public_surfaces.product_entry_surfaces;

  assert.equal(entrySurfaces.includes('redcube domain-handler dispatch'), true);
  assert.equal(entrySurfaces.includes('redcube domain-handler export'), true);
  assert.equal(entrySurfaces.includes('domain_action_adapter_dispatch'), false);
  assert.equal(entrySurfaces.includes('redcube product manifest'), false);
  assert.equal(entrySurfaces.includes('redcube product session'), false);
  assert.equal(entrySurfaces.includes('opl_generated:product_session'), true);
  assert.equal(productEntrySurfaces.includes('redcube product status'), false);
  assert.equal(productEntrySurfaces.includes('redcube product manifest'), false);
  assert.equal(productEntrySurfaces.includes('redcube product session'), false);
  assert.equal(productEntrySurfaces.includes('opl_generated:product_status'), true);
  assert.equal(productEntrySurfaces.includes('opl_generated:product_entry_manifest'), true);
  assert.equal(productEntrySurfaces.includes('opl_generated:product_session'), true);
});
