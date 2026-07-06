// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';
import { assertRefString, readJson } from './rca-production-acceptance-shared.ts';

test('RCA one-shot closeout records planned done deferred skipped verification and commit-push state', () => {
  const closeout = readJson('contracts/runtime-program/rca-one-shot-production-hardening-closeout.json');

  assert.equal(closeout.closeout_id, 'rca_one_shot_production_hardening_closeout');
  assert.equal(closeout.surface_kind, 'rca_program_closeout_contract');
  assert.equal(closeout.status, 'closed_with_typed_production_evidence_blockers');
  assert.equal(closeout.scope.default_executor_policy, 'codex_cli_first_class_default');

  for (const field of ['planned', 'done', 'deferred', 'skipped', 'verification', 'commit_push_state']) {
    assert.equal(Object.hasOwn(closeout, field), true, field);
  }

  assert.deepEqual(closeout.planned.map((lane) => lane.lane_id), ['A', 'B', 'C', 'D']);
  assert.deepEqual(closeout.done.map((lane) => lane.lane_id), ['A', 'B', 'C', 'D']);
  assert.deepEqual(closeout.commit_push_state.lane_absorb_order, ['B', 'C', 'A', 'D']);
  assert.equal(closeout.commit_push_state.D, 'pending_absorb_until_fresh_verification_and_commit');
  assert.equal(closeout.commit_push_state.main_push_state, 'pending_final_main_verification');
});

test('RCA one-shot closeout preserves AI-first executor and owner boundaries', () => {
  const closeout = readJson('contracts/runtime-program/rca-one-shot-production-hardening-closeout.json');

  assert.equal(
    closeout.scope.executor_first_claim,
    'OPL provides stage runtime, queue, receipts, recovery and projection; Codex/default executor performs protected visual stages; RCA owns visual truth, review/export verdict, artifact authority, visual memory accept/reject, owner receipt and native helpers',
  );
  assert.deepEqual(closeout.scope.domain_boundary.rca_retains, [
    'visual_truth',
    'review_export_verdict',
    'artifact_authority',
    'visual_memory_accept_reject',
    'owner_receipt',
    'native_helper_implementation',
  ]);
  assert.deepEqual(closeout.scope.domain_boundary.opl_owns, [
    'runtime',
    'queue',
    'attempt_ledger',
    'session_workbench_shell',
    'artifact_review_transport',
    'operator_projection',
    'generated_wrappers',
  ]);
});

test('RCA one-shot closeout does not upgrade deferred production evidence blockers', () => {
  const closeout = readJson('contracts/runtime-program/rca-one-shot-production-hardening-closeout.json');
  const acceptance = readJson('contracts/production_acceptance/rca-production-acceptance.json');
  const acceptanceBlockers = new Map(
    acceptance.remaining_evidence_gate_blockers.blockers.map((blocker) => [
      blocker.remaining_gap_id,
      blocker.typed_blocker_ref,
    ]),
  );

  const deferredById = new Map(closeout.deferred.map((entry) => [entry.gap_id, entry]));
  for (const gapId of [
    'opl_hosted_controlled_visual_stage_long_soak',
    'real_memory_lifecycle_receipt_instances',
    'cross_family_repeated_no_regression_evidence',
  ]) {
    const deferred = deferredById.get(gapId);
    assert.equal(deferred.status, 'deferred_typed_blocker', gapId);
    assert.equal(deferred.typed_blocker_ref, acceptanceBlockers.get(gapId), gapId);
    assertRefString(deferred.backlog_ref, `${gapId}.backlog_ref`);
    assert.equal(Array.isArray(deferred.next_verification_command_refs), true, gapId);
    assert.equal(deferred.next_verification_command_refs.length > 0, true, gapId);
  }

  const skippedClaims = closeout.skipped.map((entry) => entry.item);
  assert.equal(skippedClaims.includes('claiming_visual_ready_or_handoffable'), true);
  assert.equal(closeout.done[0].landed_truth.includes('remaining production evidence gaps are represented as RCA-owned typed blockers'), true);
});

test('RCA one-shot closeout links current-program active closeout without making docs prose the test target', () => {
  const closeout = readJson('contracts/runtime-program/rca-one-shot-production-hardening-closeout.json');
  const currentProgram = readJson('contracts/runtime-program/current-program.json');
  const activeCloseout = currentProgram.current_state.active_baton.closeout;

  assert.equal(activeCloseout.closeout_ref, 'contracts/runtime-program/rca-one-shot-production-hardening-closeout.json');
  assert.equal(activeCloseout.closeout_id, closeout.closeout_id);
  assert.equal(activeCloseout.status, closeout.status);
  assert.equal(activeCloseout.docs_assertion_policy, 'machine_contracts_only_no_markdown_prose_assertions');
  assert.equal(closeout.verification.docs_assertion_policy.docs_are_human_governance_surfaces, true);
  assert.equal(closeout.verification.docs_assertion_policy.tests_must_not_assert_markdown_prose, true);
  assert.equal(closeout.verification.docs_assertion_policy.tests_may_assert_machine_contracts, true);
});
