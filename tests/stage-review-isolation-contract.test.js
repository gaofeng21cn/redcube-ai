import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  canonicalStageForRoute,
} from '@redcube/runtime-protocol';

test('RCA routes map into six canonical Stages without treating review routes as Stages', () => {
  assert.equal(canonicalStageForRoute('storyline'), 'communication_strategy');
  assert.equal(canonicalStageForRoute('detailed_outline'), 'communication_strategy');
  assert.equal(canonicalStageForRoute('slide_blueprint'), 'communication_strategy');
  assert.equal(canonicalStageForRoute('visual_director_review'), 'artifact_creation');
  assert.equal(canonicalStageForRoute('screenshot_review'), 'artifact_creation');
  assert.equal(canonicalStageForRoute('review_and_revision'), 'review_and_revision');
});

test('RCA internal visual QA cannot impersonate an OPL StageAttempt or materialize Review receipts', () => {
  const qaSource = readFileSync(new URL(
    '../packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/in-attempt-visual-qa.ts',
    import.meta.url,
  ), 'utf8');
  const codexCallerSource = readFileSync(new URL(
    '../packages/redcube-runtime/src/executors/codex-caller.ts',
    import.meta.url,
  ), 'utf8');
  const protocolIndexSource = readFileSync(new URL(
    '../packages/redcube-runtime-protocol/src/index.ts',
    import.meta.url,
  ), 'utf8');
  assert.match(qaSource, /surface_kind: 'rca_in_attempt_visual_qa'/);
  assert.match(qaSource, /formal_stage_review_completed: false/);
  assert.match(qaSource, /review_receipt_materialized: false/);
  assert.doesNotMatch(qaSource, /opl_stage_review_receipt/);
  assert.doesNotMatch(codexCallerSource, /buildQualityAttemptRuntime|stage_quality_attempt/);
  assert.doesNotMatch(protocolIndexSource, /buildStageReviewReceipt|buildQualityAttemptRuntime/);
});

test('RCA quality profile freezes three repair rounds and cross-stage Meta Review', () => {
  const profile = JSON.parse(readFileSync(new URL('../contracts/stage_quality_cycle_policy.json', import.meta.url)));
  const stageManifest = JSON.parse(readFileSync(new URL('../agent/stages/manifest.json', import.meta.url)));
  const ownerReceiptContract = JSON.parse(readFileSync(new URL('../contracts/owner_receipt_contract.json', import.meta.url)));
  assert.equal(profile.surface_kind, 'opl_domain_stage_quality_cycle_profile');
  assert.equal(profile.version, 'domain-stage-quality-cycle-profile.v1');
  assert.deepEqual(profile.attempt_roles, ['producer', 'reviewer', 'repairer', 're_reviewer']);
  assert.deepEqual(profile.handoff_authority_sequence.steps, [
    'terminal_reviewer_or_re_reviewer_outcome',
    'opl_controller_formal_review_receipt',
    'rca_domain_owner_receipt',
    'ready_projection',
  ]);
  assert.equal(profile.handoff_authority_sequence.attempt_can_materialize_review_receipt, false);
  assert.equal(profile.handoff_authority_sequence.attempt_can_materialize_owner_receipt, false);
  assert.equal(profile.handoff_authority_sequence.route_helper_can_set_ready_claim, false);
  assert.equal(profile.quality_budget.max_repair_rounds, 3);
  assert.equal(profile.quality_budget.repair_required_outcome_is_preserved_at_exhaustion, true);
  assert.equal(
    profile.quality_budget.repair_required_at_exhaustion_with_consumable_artifact_is_terminal_decisive,
    true,
  );
  assert.equal(profile.quality_budget.zero_repair_round_budget_makes_initial_review_terminal, true);
  assert.equal(profile.meta_review.stage_role, 'cross_stage_meta_review');
  assert.equal(profile.meta_review.primary_attempt_role, 'producer');
  assert.equal(profile.meta_review.no_context_inheritance, true);
  assert.equal(profile.meta_review.terminal_route_owner, 'producer');
  assert.equal(profile.meta_review.terminal_route_output, 'route_impact.stage_route_decision');
  assert.match(profile.route_selection_contract_ref, /#\/cross_stage_route_selection$/);
  assert.equal(
    profile.attempt_route_execution_policy.attempt_role_round_and_context_validation_owner,
    'opl_stage_run_controller',
  );
  assert.equal(profile.attempt_route_execution_policy.attempt_role_is_never_inferred_or_validated_from_route_name, true);
  assert.equal(profile.attempt_route_execution_policy.rca_route_handler_consumes_attempt_metadata_passively, true);
  assert.equal(profile.attempt_route_execution_policy.rca_route_handler_can_reject_role_round_or_review_context_shape, false);
  assert.equal(profile.attempt_route_execution_policy.missing_attempt_metadata_result, 'completed_with_quality_debt');
  assert.equal(profile.attempt_route_execution_policy.missing_attempt_metadata_blocks_stage_transition, false);
  assert.equal(profile.attempt_route_execution_policy.explicit_owner_or_identity_mismatch_result, 'hard_stop');
  assert.equal(profile.attempt_route_execution_policy.all_quality_attempts_require_fresh_context, true);
  assert.equal(profile.attempt_route_execution_policy.stage_transition_authority_is_not_granted_by_route_execution, true);
  assert.equal(
    profile.finding_and_repair_contract.attempt_outcome_field,
    'route_impact.stage_quality_cycle.outcome',
  );
  assert.deepEqual(profile.finding_and_repair_contract.review_attempt_outcomes, [
    'pass',
    'repair_required',
    'quality_debt',
    'blocked',
    'human_gate',
  ]);
  assert.deepEqual(profile.finding_and_repair_contract.attempt_outcome_authorized_roles, [
    'reviewer',
    're_reviewer',
  ]);
  assert.equal(profile.finding_and_repair_contract.producer_may_emit_attempt_outcome, false);
  assert.equal(profile.finding_and_repair_contract.repairer_may_emit_attempt_outcome, false);
  assert.deepEqual(profile.finding_and_repair_contract.repairer_required_outputs, [
    'artifact_identity',
    'repair_map',
  ]);
  assert.equal(profile.finding_and_repair_contract.repair_map_required_for_each_required_finding, true);
  assert.deepEqual(profile.finding_and_repair_contract.review_receipt_materialization.outcome_to_verdict, {
    pass: 'pass',
    repair_required: 'repair_required',
    quality_debt: 'quality_debt',
    blocked: 'hard_stop',
    human_gate: 'hard_stop',
  });
  assert.equal(
    profile.finding_and_repair_contract.review_receipt_materialization.owner,
    'opl_stage_run_controller',
  );
  assert.equal(profile.finding_and_repair_contract.blocked_or_human_gate_can_emit_stage_route_decision, false);
  assert.deepEqual(profile.finding_and_repair_contract.route_output_policy, {
    pass: 'terminal_stage_route_decision',
    quality_debt: 'terminal_stage_route_decision',
    repair_required_with_budget_remaining: 'stage_route_recommendation_only',
    repair_required_at_budget_exhaustion_with_consumable_artifact: 'terminal_stage_route_decision_and_completed_with_quality_debt',
    repair_required_at_budget_exhaustion_without_consumable_artifact: 'no_stage_route_decision_and_typed_blocker',
    blocked_or_human_gate: 'no_stage_route_decision',
  });
  assert.deepEqual(profile.finding_and_repair_contract.next_repair_round_triggers, [
    'required_finding_not_closed',
    'repair_regression',
    'critical_new_finding',
  ]);
  assert.deepEqual(profile.finding_and_repair_contract.next_round_required_finding_sources, [
    'required_finding_not_closed',
    'repair_regression',
    'critical_new_finding',
  ]);
  assert.equal(profile.finding_and_repair_contract.reopened_finding_id_must_be_unique_across_cycle, true);
  assert.equal(profile.finding_and_repair_contract.repair_regression_or_critical_new_finding_becomes_required, true);
  assert.equal(profile.finding_and_repair_contract.pass_with_optional_observations_allowed, true);
  assert.equal(profile.finding_and_repair_contract.optional_observation_alone_forces_quality_debt, false);
  const forbiddenAttemptPolicyKeys = new Set([
    'next_stage',
    'requires',
    'ensures',
    'stage_route',
    'sub_stage_graph',
    'independent_owner',
  ]);
  const expectedPolicyKeys = [
    'attempt_boundary',
    'budget_exhaustion',
    'enabled',
    'formal_review',
    'in_thread_refinement',
    'quality_rubric_refs',
    'role_prompt_refs',
    'stage_prompt_ref',
    'surface_kind',
    'version',
  ];
  const expectedRoleKeys = ['producer', 're_reviewer', 'repairer', 'reviewer'];
  const expectedAttemptBoundary = {
    inherits_stage_goal_scope_authority: true,
    role_overlay_may_only_narrow: true,
    controller_creates_next_attempt: true,
    attempt_is_not_sub_stage: true,
  };
  for (const [stageId, stagePolicy] of Object.entries(profile.stage_policies)) {
    assert.deepEqual(Object.keys(stagePolicy).sort(), expectedPolicyKeys, stageId);
    assert.equal(stagePolicy.surface_kind, 'opl_stage_quality_cycle_policy', stageId);
    assert.equal(stagePolicy.version, 'stage-quality-cycle-policy.v1', stageId);
    assert.equal(stagePolicy.enabled, true, stageId);
    assert.equal(stagePolicy.stage_prompt_ref, `agent/prompts/${stageId}.md`, stageId);
    assert.deepEqual(Object.keys(stagePolicy.role_prompt_refs).sort(), expectedRoleKeys, stageId);
    assert.equal(Object.values(stagePolicy.role_prompt_refs).every((ref) => ref.startsWith('agent/prompts/stage-quality-cycle-roles.md#')), true, stageId);
    assert.equal(stagePolicy.quality_rubric_refs.length > 0, true, stageId);
    assert.deepEqual(stagePolicy.in_thread_refinement, { allowed: true, authoritative: false }, stageId);
    assert.equal(stagePolicy.formal_review.context_isolation_required, true, stageId);
    assert.equal(stagePolicy.formal_review.max_repair_rounds <= 3, true, stageId);
    assert.equal(stagePolicy.budget_exhaustion, 'complete_with_quality_debt_if_consumable', stageId);
    assert.deepEqual(stagePolicy.attempt_boundary, expectedAttemptBoundary, stageId);
    assert.equal(Object.keys(stagePolicy).some((key) => forbiddenAttemptPolicyKeys.has(key)), false);
  }
  assert.equal(profile.stage_policies.source_intake.formal_review.review_depth, 'full');
  for (const stageId of ['communication_strategy', 'visual_direction', 'artifact_creation']) {
    assert.equal(profile.stage_policies[stageId].formal_review.review_depth, 'multi_axis', stageId);
    assert.equal(profile.stage_policies[stageId].formal_review.required, true, stageId);
  }
  assert.equal(profile.stage_policies.review_and_revision.formal_review.required, false);
  assert.equal(profile.stage_policies.review_and_revision.formal_review.max_repair_rounds, 0);
  assert.equal(profile.stage_policies.package_and_handoff.formal_review.required, true);
  assert.equal(profile.stage_policies.package_and_handoff.formal_review.max_repair_rounds, 3);
  assert.equal(profile.stage_policies.package_and_handoff.formal_review.risk_tier, 'high');
  assert.equal(profile.stage_policies.package_and_handoff.formal_review.review_depth, 'multi_axis');
  const packageStage = stageManifest.stages.find((stage) => stage.stage_id === 'package_and_handoff');
  assert.deepEqual(packageStage.handoff_review_boundary, {
    artifact_effect: 'new_or_transformed_reviewable_bytes',
    freezes_canonical_artifact_bytes: true,
    issues_quality_export_publication_or_ready_claim: true,
    downstream_owner_retains_acceptance: true,
  });
  assert.equal(ownerReceiptContract.formal_stage_review_handoff_policy.attempt_role_alone_can_authorize_ready_claim, false);
  assert.equal(
    ownerReceiptContract.formal_stage_review_handoff_policy.terminal_attempt_output_field,
    'route_impact.stage_quality_cycle.outcome',
  );
  assert.equal(
    ownerReceiptContract.formal_stage_review_handoff_policy.review_receipt_verdict_materialization_owner,
    'opl_stage_run_controller',
  );
  assert.equal(ownerReceiptContract.formal_stage_review_handoff_policy.route_helper_can_issue_owner_receipt, false);
  assert.equal(ownerReceiptContract.formal_stage_review_handoff_policy.stage_folder_writer_can_issue_owner_receipt, false);
  assert.deepEqual(ownerReceiptContract.formal_stage_review_handoff_policy.required_owner_authority_inputs, [
    'formal_review_receipt',
    'artifact_identity_receipt',
  ]);
  assert.equal(ownerReceiptContract.formal_stage_review_handoff_policy.ordinary_review_failure_result, 'quality_debt_without_owner_receipt');
  assert.equal(ownerReceiptContract.formal_stage_review_handoff_policy.ordinary_review_failure_blocks_stage_transition, false);
  assert.equal(
    ownerReceiptContract.formal_stage_review_handoff_policy.domain_owner_receipt_signer,
    'domain-handler:dispatch#emit_domain_owner_receipt',
  );
});
