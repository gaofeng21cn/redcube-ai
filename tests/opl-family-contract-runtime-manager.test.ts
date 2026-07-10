// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readCurrentProgramContract } from './helpers/current-program-contract.ts';

const DOMAIN_MEMORY_ADOPTION_STATE = 'descriptor_proof_contract_landed_runtime_writeback_pending';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function currentProgram() {
  return readCurrentProgramContract();
}

test('current runtime program points OPL Runtime Manager at the RCA lifecycle adapter projection', () => {
  const payload = currentProgram();
  const managerBoundary = payload.longrun_goal.runtime_manager_boundary;
  const persistence = payload.current_state.runtime_persistence_strategy;
  const adapter = payload.current_state.active_baton.scope.opl_family_lifecycle_adapter;
  const stageProjection = payload.current_state.active_baton.scope.opl_family_stage_control_projection;
  const memory = payload.current_state.active_baton.scope.domain_memory_descriptor_locator;
  const applyProof = payload.current_state.active_baton.scope.controlled_memory_apply_proof;
  const repoSourceLayout = payload.current_state.active_baton.scope.repo_source_layout_authority_refs;
  const residueRetirement = payload.current_state.active_baton.scope.runtime_residue_retirement;

  assert.ok(managerBoundary.consumes_redcube_surfaces.includes('opl_family_lifecycle_adapter'));
  assert.ok(managerBoundary.consumes_redcube_surfaces.includes('opl_family_stage_control_projection'));
  assert.ok(managerBoundary.consumes_redcube_surfaces.includes('domain_memory_descriptor_locator'));
  assert.ok(managerBoundary.does_not_own.includes('domain memory content or verdicts'));
  assert.ok(persistence.canonical_truth_surfaces_remain_files.includes('opl_family_lifecycle_adapter projection'));
  assert.ok(persistence.canonical_truth_surfaces_remain_files.includes('opl_family_stage_control_projection projection'));
  assert.ok(persistence.canonical_truth_surfaces_remain_files.includes('domain_memory_descriptor_locator projection'));
  assert.equal(adapter.status, 'repo_tracked_refs_only_projection_contract');
  assert.equal(adapter.adapter_id, 'rca.opl.family.lifecycle.adapter.v1');
  assert.equal(adapter.rca_owns_generic_lifecycle_adapter, false);
  assert.equal(adapter.rca_owns_generic_session_shell, false);
  assert.equal(adapter.rca_owns_runtime_loop, false);
  assert.equal(adapter.sqlite_status, 'deferred_for_rca_opl_state_index_kernel_sidecar');
  assert.equal(
    adapter.state_index_kernel_adoption_ref,
    'contracts/stage_artifact_kernel_adoption.json#/opl_state_index_kernel_adoption',
  );
  assert.deepEqual(adapter.state_index_kernel_adoption, {
    owner: 'one-person-lab',
    consumer: 'redcube_ai',
    sqlite_enabled_now: false,
    index_backend: 'sqlite_sidecar_index',
    refs_only: true,
    rebuildable: true,
    sidecar_is_domain_runtime: false,
    sqlite_can_be_truth_source: false,
    sqlite_can_store_visual_artifact_body: false,
    sqlite_can_store_review_export_judgment: false,
  });
  assert.deepEqual(adapter.exposes, [
    'family persistence',
    'lifecycle projection',
    'owner-route discovery',
    'adoption surface',
  ]);
  assert.equal(stageProjection.status, 'repo_tracked_projection_contract');
  assert.equal(stageProjection.adapter_model, 'descriptor_and_stage_execution_plan_provider');
  assert.equal(stageProjection.default_ppt_route_changed, false);
  assert.equal(stageProjection.repo_local_stage_runner_retired, true);
  assert.equal(stageProjection.repo_local_stage_runner_role, 'tombstone_or_historical_regression_only');
  const attempt = payload.current_state.active_baton.scope.controlled_visual_stage_attempt;

  assert.equal(memory.status, DOMAIN_MEMORY_ADOPTION_STATE);
  assert.equal(memory.descriptor_id, 'rca.visual_pattern_memory.descriptor.v1');
  assert.equal(memory.locator_id, 'rca.visual_pattern_memory.locator.v1');
  assert.equal(memory.migration_plan_id, 'rca.visual_pattern_memory.migration_plan.v1');
  assert.equal(memory.seed_fixture_locator_id, 'rca.visual_pattern_memory.seed_fixture_locator.v1');
  assert.equal(memory.writeback_receipt_locator_id, 'rca.visual_pattern_memory.writeback_receipt_locator.v1');
  assert.equal(memory.writeback_proposal_generator_id, 'rca.visual_pattern_memory.writeback_proposal_generator.v1');
  assert.equal(memory.accept_reject_command_id, 'rca.visual_pattern_memory.accept_reject.v1');
  assert.equal(memory.operator_receipt_projection_id, 'rca.visual_pattern_memory.operator_receipt_projection.v1');
  assert.equal(
    memory.migration_state,
    DOMAIN_MEMORY_ADOPTION_STATE,
  );
  assert.equal(memory.descriptor_proof_contract_state, 'landed');
  assert.equal(memory.runtime_writeback_state, 'pending');
  assert.equal(memory.controlled_apply_proof_state, 'controlled_apply_proof_landed_memory_body_external');
  assert.equal(memory.controlled_memory_apply_proof_ref, 'opl_generated:product_entry_manifest#/controlled_memory_apply_proof');
  assert.equal(memory.memory_content_owner, 'redcube_ai');
  assert.equal(memory.route_truth_owner, 'redcube_ai');
  assert.equal(memory.review_export_verdict_owner, 'redcube_ai');
  assert.equal(memory.artifact_authority_owner, 'redcube_ai');
  assert.equal(memory.opl_role, 'locator_ref_receipt_consumer_only');
  assert.equal(memory.repo_tracks_memory_entries, false);
  assert.equal(memory.repo_tracks_proposal_instances, false);
  assert.equal(memory.repo_tracks_receipt_instances, false);
  assert.equal(memory.repo_tracks_visual_or_export_artifacts, false);
  assert.equal(memory.visual_truth_changed, false);
  assert.equal(memory.route_truth_changed, false);
  assert.equal(memory.operator_receipt_projection_ready, true);
  assert.equal(memory.opl_can_accept_or_reject_memory_writeback, false);
  assert.equal(attempt.status, DOMAIN_MEMORY_ADOPTION_STATE);
  assert.equal(attempt.proof_contract_state, 'landed');
  assert.equal(attempt.runtime_writeback_state, 'pending');
  assert.equal(attempt.apply_proof_state, 'controlled_apply_proof_landed_memory_body_external');
  assert.equal(attempt.controlled_memory_apply_proof_ref, 'opl_generated:product_entry_manifest#/controlled_memory_apply_proof');
  assert.deepEqual(attempt.stage_kinds, ['review_and_revision', 'package_and_handoff']);
  assert.equal(attempt.direct_and_opl_share_descriptor_refs, true);
  assert.equal(attempt.direct_and_opl_share_domain_action_adapter_refs, true);
  assert.equal(attempt.direct_and_opl_share_quality_refs, true);
  assert.equal(attempt.opl_writes_visual_truth, false);
  assert.equal(attempt.opl_writes_review_export_verdict, false);
  assert.equal(attempt.opl_writes_artifact_blob, false);

  assert.equal(applyProof.status, 'controlled_apply_proof_landed_memory_body_external');
  assert.equal(applyProof.proof_id, 'rca.visual_pattern_memory.controlled_apply_proof.v1');
  assert.equal(applyProof.consumes_visual_pattern_memory_refs, true);
  assert.equal(applyProof.projects_writeback_proposal_ref, true);
  assert.deepEqual(applyProof.projects_accept_reject_receipt_cases, ['accepted', 'rejected']);
  assert.equal(
    applyProof.runtime_receipt_instances_ref,
    'opl_generated:product_entry_manifest#/controlled_memory_apply_proof/runtime_receipt_instances',
  );
  assert.deepEqual(applyProof.projects_runtime_receipt_statuses, ['accepted', 'rejected']);
  assert.equal(applyProof.writes_visual_truth, false);
  assert.equal(applyProof.writes_review_verdict, false);
  assert.equal(applyProof.writes_export_verdict, false);
  assert.equal(applyProof.writes_artifact_blob, false);
  assert.equal(applyProof.repo_tracks_memory_content_body, false);
  assert.equal(applyProof.repo_tracks_receipt_instances, false);

  assert.equal(repoSourceLayout.status, 'audit_surface_landed');
  assert.equal(repoSourceLayout.mapping_model, 'explicit_domain_authority_refs_no_private_standard_skeleton');
  assert.equal(repoSourceLayout.audit_surface, 'contracts/pack_compiler_input.json#/required_domain_pack_paths');
  assert.deepEqual(repoSourceLayout.expected_roots, ['agent', 'contracts', 'runtime', 'docs']);
  assert.deepEqual(repoSourceLayout.missing_roots, []);
  assert.ok(repoSourceLayout.forbidden_repo_writes.includes('memory_content_body'));

  const ownerReceipt = payload.current_state.active_baton.scope.domain_owner_receipt_contract;
  assert.equal(ownerReceipt.status, 'contract_landed_runtime_no_regression_evidence_ref_available');
  assert.equal(ownerReceipt.contract_id, 'rca.domain_owner_receipt.v1');
  assert.deepEqual(ownerReceipt.allowed_return_shapes, ['domain_receipt', 'typed_blocker', 'no_regression_evidence']);
  assert.equal(ownerReceipt.opl_can_store_receipt_refs, true);
  assert.equal(ownerReceipt.opl_can_store_visual_truth, false);
  assert.equal(ownerReceipt.opl_can_store_review_export_verdict, false);
  assert.equal(ownerReceipt.opl_can_store_canonical_artifact_blob, false);

  const lifecycleApply = payload.current_state.active_baton.scope.lifecycle_guarded_apply_proof;
  assert.equal(lifecycleApply.status, 'guarded_apply_proof_landed_domain_artifact_mutation_requires_receipt');
  assert.deepEqual(lifecycleApply.operations, ['cleanup', 'restore', 'retention']);
  assert.equal(lifecycleApply.domain_artifact_mutation_requires_domain_receipt, true);
  assert.equal(lifecycleApply.opl_can_apply_domain_artifact_mutation, false);

  const transitionSpec = payload.current_state.active_baton.scope.visual_transition_spec;
  assert.equal(transitionSpec.status, 'contract_landed_thin_evaluator_landed_runner_owned_by_opl');
  assert.equal(transitionSpec.spec_id, 'rca.visual_transition_spec.v1');
  assert.equal(transitionSpec.transition_count, 5);
  assert.equal(transitionSpec.opl_can_execute_transition_spec, true);
  assert.equal(transitionSpec.opl_can_declare_visual_ready, false);
  assert.equal(transitionSpec.opl_can_declare_exportable, false);
  assert.equal(transitionSpec.evaluator_descriptor_id, 'rca.visual_transition_evaluator.v1');
  assert.equal(transitionSpec.evaluator_action, 'evaluate_visual_transition');
  assert.equal(transitionSpec.family_transition_spec_descriptor_ref, '/visual_transition_spec/family_transition_spec_descriptor');
  assert.equal(transitionSpec.repo_tracks_runner_state, false);

  assert.equal(payload.current_state.active_baton.scope.physical_skeleton_follow_through, undefined);
  assert.equal(payload.current_state.active_baton.scope.review_helper_baseline_follow_through, undefined);

  assert.equal(residueRetirement.status, 'active_path_retired');
  assert.deepEqual(residueRetirement.retired_default_surfaces, [
    'hermes_first_default_runtime',
    'retired_gateway_protocol_boundary_public_entry',
    'repo_local_manager_default',
  ]);
  assert.deepEqual(residueRetirement.allowed_remaining_roles, [
    'explicit_proof_backend',
    'provenance',
    'history',
  ]);
});
