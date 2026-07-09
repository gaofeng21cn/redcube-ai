// @ts-nocheck
import {
  assert,
  getProductEntryManifest,
  prepareProductEntryWorkspace,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';
import { assertPathValues, list } from './surface-fixture-assertions.ts';

const MEMORY_STATE = 'descriptor_proof_contract_landed_runtime_writeback_pending';

test('product entry manifest keeps memory and controlled attempt surfaces refs-only', async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });

    assertPathValues(manifest, {
      'domain_memory_descriptor_locator.descriptor_id': 'rca.visual_pattern_memory.descriptor.v1',
      'domain_memory_descriptor_locator.status': MEMORY_STATE,
      'domain_memory_descriptor_locator.locator_id': 'rca.visual_pattern_memory.locator.v1',
      'domain_memory_descriptor_locator.memory_family': 'visual_pattern_memory',
      'domain_memory_descriptor_locator.memory_model': 'natural_language_pattern_cards',
      'domain_memory_descriptor_locator.policy_ref.ref_kind': 'human_doc',
      'domain_memory_descriptor_locator.policy_ref.ref': 'human_doc:visual_pattern_memory_policy',
      'domain_memory_descriptor_locator.human_doc_ref.ref_kind': 'human_doc',
      'domain_memory_descriptor_locator.human_doc_ref.ref': 'human_doc:domain_memory_descriptor_locator',
      'domain_memory_descriptor_locator.memory_locator.opl_consumable_fields': list('memory_id stage_scope deliverable_family provenance_refs content_ref writeback_receipt_ref'),
      'domain_memory_descriptor_locator.writeback_receipt_contract.forbidden_receipt_fields': list('memory_content_body visual_verdict export_verdict review_verdict canonical_artifact_blob'),
      'domain_memory_descriptor_locator.migration_plan.plan_id': 'rca.visual_pattern_memory.migration_plan.v1',
      'domain_memory_descriptor_locator.migration_plan.state': MEMORY_STATE,
      'domain_memory_descriptor_locator.migration_plan.descriptor_proof_contract_state': 'landed',
      'domain_memory_descriptor_locator.migration_plan.runtime_writeback_state': 'pending',
      'domain_memory_descriptor_locator.migration_plan.repository_boundary.repo_tracks_migration_plan': true,
      'domain_memory_descriptor_locator.migration_plan.repository_boundary.repo_tracks_seed_locator_contract': true,
      'domain_memory_descriptor_locator.migration_plan.repository_boundary.repo_tracks_memory_entries': false,
      'domain_memory_descriptor_locator.migration_plan.repository_boundary.repo_tracks_receipt_instances': false,
      'domain_memory_descriptor_locator.migration_plan.repository_boundary.repo_tracks_visual_or_export_artifacts': false,
      'domain_memory_descriptor_locator.migration_plan.repository_boundary.visual_truth_changed': false,
      'domain_memory_descriptor_locator.migration_plan.repository_boundary.route_truth_changed': false,
      'domain_memory_descriptor_locator.seed_fixture_locator.required_locator_fields': list('seed_id source_review_ref stage_scope deliverable_family reusable_lesson_ref provenance_refs migration_status'),
      'domain_memory_descriptor_locator.writeback_receipt_locator.locator_id': 'rca.visual_pattern_memory.writeback_receipt_locator.v1',
      'domain_memory_descriptor_locator.writeback_receipt_locator.locator_fields': list('receipt_id proposal_id source_review_ref candidate_memory_ref writeback_status memory_locator_ref operator_receipt_projection_ref owner created_at'),
      'domain_memory_descriptor_locator.writeback_receipt_locator.repo_tracks_receipt_instances': false,
      'domain_memory_descriptor_locator.writeback_receipt_locator.runtime_writeback_state': 'pending',
      'domain_memory_descriptor_locator.writeback_proposal_generator.generator_id': 'rca.visual_pattern_memory.writeback_proposal_generator.v1',
      'domain_memory_descriptor_locator.writeback_proposal_generator.repository_boundary.repo_tracks_proposal_instances': false,
      'domain_memory_descriptor_locator.accept_reject_command.command_id': 'rca.visual_pattern_memory.accept_reject.v1',
      'domain_memory_descriptor_locator.accept_reject_command.allowed_decisions': ['accepted', 'rejected'],
      'domain_memory_descriptor_locator.accept_reject_command.side_effect_boundary.writes_repo_memory_entry': false,
      'domain_memory_descriptor_locator.operator_receipt_projection.projection_id': 'rca.visual_pattern_memory.operator_receipt_projection.v1',
      'domain_memory_descriptor_locator.operator_receipt_projection.opl_consumption_policy.opl_can_store_memory_content': false,
      'visual_pattern_memory_writeback.surface_kind': 'visual_pattern_memory_writeback_projection',
      'visual_pattern_memory_writeback.status': MEMORY_STATE,
      'visual_pattern_memory_writeback.proof_contract_state': 'landed',
      'visual_pattern_memory_writeback.runtime_writeback_state': 'pending',
      'visual_pattern_memory_writeback.proposal_generator.generator_id': 'rca.visual_pattern_memory.writeback_proposal_generator.v1',
      'visual_pattern_memory_writeback.accept_reject_command.command_id': 'rca.visual_pattern_memory.accept_reject.v1',
      'visual_pattern_memory_writeback.operator_receipt_projection.projection_id': 'rca.visual_pattern_memory.operator_receipt_projection.v1',
      'visual_pattern_memory_writeback.repo_tracks_memory_entries': false,
      'visual_pattern_memory_writeback.repo_tracks_receipt_instances': false,
      'domain_memory_descriptor_locator.authority_boundary.memory_content_owner': 'redcube_ai',
      'domain_memory_descriptor_locator.authority_boundary.route_truth_owner': 'redcube_ai',
      'domain_memory_descriptor_locator.authority_boundary.review_export_verdict_owner': 'redcube_ai',
      'domain_memory_descriptor_locator.authority_boundary.artifact_authority_owner': 'redcube_ai',
      'domain_memory_descriptor_locator.authority_boundary.opl_role': 'locator_ref_receipt_consumer_only',
      'domain_memory_descriptor_locator.authority_boundary.opl_can_hold_memory_content': false,
      'domain_memory_descriptor_locator.authority_boundary.opl_can_choose_visual_route': false,
      'domain_memory_descriptor_locator.authority_boundary.opl_can_accept_or_reject_memory_writeback': false,
      'domain_memory_descriptor_locator.authority_boundary.opl_can_issue_review_or_export_verdict': false,
      'domain_memory_descriptor_locator.authority_boundary.opl_can_mutate_canonical_artifacts': false,
      'domain_action_adapter_receipt_refs.receipt_contract_id': 'rca.domain_action_adapter.receipt_refs.v1',
      'controlled_visual_stage_attempt.fixture_id': 'rca.controlled_visual_stage_attempt.fixture.v1',
      'controlled_visual_stage_attempt.status': MEMORY_STATE,
      'controlled_visual_stage_attempt.proof_contract_state': 'landed',
      'controlled_visual_stage_attempt.runtime_writeback_state': 'pending',
      'controlled_visual_stage_attempt.proof_model': 'consumed_memory_writeback_receipt_descriptor_domain_action_adapter_quality_ref_equivalence_only',
      'controlled_visual_stage_attempt.provider_controlled_proof_id': 'rca.opl_hosted.controlled_visual_stage_attempt_memory_proof.v1',
      'controlled_visual_stage_attempt.stage_kinds': ['review_and_revision', 'package_and_handoff'],
      'controlled_visual_stage_attempt.route_stage_refs': list('visual_director_review screenshot_review repair_image_pages export_pptx'),
      'controlled_visual_stage_attempt.equivalence_proof.direct_and_opl_share_descriptor_refs': true,
      'controlled_visual_stage_attempt.equivalence_proof.direct_and_opl_share_consumed_memory_refs': true,
      'controlled_visual_stage_attempt.equivalence_proof.direct_and_opl_share_domain_action_adapter_refs': true,
      'controlled_visual_stage_attempt.equivalence_proof.direct_and_opl_share_quality_refs': true,
      'controlled_visual_stage_attempt.equivalence_proof.opl_writes_visual_truth': false,
      'controlled_visual_stage_attempt.equivalence_proof.opl_writes_review_export_verdict': false,
      'controlled_visual_stage_attempt.equivalence_proof.opl_writes_artifact_blob': false,
      'controlled_visual_stage_attempt.equivalence_proof.opl_writes_memory_content': false,
      'controlled_visual_stage_attempt.equivalence_proof.opl_writes_receipt_instance': false,
      'controlled_visual_stage_attempt.opl_policy_proof.opl_consumes_descriptor_refs': true,
      'controlled_visual_stage_attempt.opl_policy_proof.opl_consumes_memory_refs': true,
      'controlled_visual_stage_attempt.opl_policy_proof.opl_consumes_writeback_receipt_refs': true,
      'controlled_visual_stage_attempt.opl_policy_proof.opl_consumes_artifact_refs': true,
      'controlled_visual_stage_attempt.opl_policy_proof.opl_consumes_quality_refs': true,
      'controlled_visual_stage_attempt.opl_policy_proof.opl_holds_visual_verdict': false,
      'controlled_visual_stage_attempt.opl_policy_proof.opl_holds_export_verdict': false,
      'controlled_visual_stage_attempt.opl_policy_proof.opl_holds_memory_content': false,
      'controlled_visual_stage_attempt.opl_policy_proof.opl_holds_receipt_instance': false,
      'controlled_visual_stage_attempt.projection_only_result.visual_export_verdict': null,
      'controlled_visual_stage_attempt.projection_only_result.memory_content_body': null,
      'controlled_visual_stage_attempt.projection_only_result.receipt_instance': null,
    });
    for (const [surface, fields] of [
      [manifest.domain_memory_descriptor_locator.seed_fixture_locator.forbidden_seed_fields, list('memory_content_body canonical_artifact_blob')],
      [manifest.domain_action_adapter_receipt_refs.forbidden_receipt_fields, list('visual_verdict artifact_blob')],
      [manifest.domain_memory_descriptor_locator.migration_plan.migration_steps, list('generate_writeback_proposal_locator project_operator_receipt_status')],
      [manifest.domain_memory_descriptor_locator.migration_plan.acceptance_gates, list('proposal_is_locator_only operator_receipt_projection_is_locator_only consumed_memory_refs_are_locator_only opl_hosted_attempt_carries_refs_not_memory_body')],
    ]) {
      for (const field of fields) assert.equal(surface.includes(field), true, field);
    }
    assert.deepEqual(
      manifest.controlled_visual_stage_attempt.direct_skill_attempt.descriptor_refs,
      manifest.controlled_visual_stage_attempt.opl_hosted_attempt.descriptor_refs,
    );
    assert.deepEqual(
      manifest.controlled_visual_stage_attempt.direct_skill_attempt.domain_action_adapter_refs,
      manifest.controlled_visual_stage_attempt.opl_hosted_attempt.domain_action_adapter_refs,
    );
    assert.deepEqual(
      manifest.controlled_visual_stage_attempt.direct_skill_attempt.quality_refs,
      manifest.controlled_visual_stage_attempt.opl_hosted_attempt.quality_refs,
    );
    assert.deepEqual(
      manifest.controlled_visual_stage_attempt.direct_skill_attempt.consumed_memory_refs,
      manifest.controlled_visual_stage_attempt.opl_hosted_attempt.consumed_memory_refs,
    );
  });
});
