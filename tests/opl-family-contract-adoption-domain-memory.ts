// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';

const DOMAIN_MEMORY_ADOPTION_STATE = 'descriptor_proof_contract_landed_runtime_writeback_pending';

export function registerDomainMemoryAdoptionTests(contract) {
  test('RCA domain memory descriptor exposes locator and receipts without moving visual authority to OPL', () => {
    const payload = contract();
    const descriptor = payload.domain_memory_descriptor;
    const memory = payload.standard_domain_agent_skeleton.domain_memory_descriptor_locator;

    assert.equal(descriptor.surface_kind, 'family_domain_memory_ref');
    assert.equal(descriptor.version, 'family-domain-memory-ref.v1');
    assert.equal(descriptor.memory_ref_id, 'rca_visual_pattern_memory');
    assert.equal(descriptor.target_domain_id, 'redcube_ai');
    assert.equal(descriptor.owner, 'redcube_ai');
    assert.equal(descriptor.memory_family, 'visual_pattern_memory');
    assert.deepEqual(descriptor.memory_pack_ref, {
      ref_kind: 'json_pointer',
      ref: '/domain_memory_descriptor_locator',
      role: 'domain_owned_memory_pack_descriptor',
      label: 'RCA visual pattern memory descriptor locator',
    });
    assert.deepEqual(descriptor.stage_applicability, [
      'source_intake',
      'communication_strategy',
      'visual_direction',
      'artifact_creation',
      'review_and_revision',
      'package_and_handoff',
    ]);
    assert.deepEqual(descriptor.retrieval_contract_ref, {
      ref_kind: 'json_pointer',
      ref: '/domain_memory_descriptor_locator/memory_locator',
      role: 'locator_only_retrieval_contract',
      label: 'RCA visual pattern memory locator',
    });
    assert.deepEqual(descriptor.writeback_contract_ref, {
      ref_kind: 'json_pointer',
      ref: '/domain_memory_descriptor_locator/writeback_proposal_generator',
      role: 'domain_owned_writeback_proposal_contract',
      label: 'RCA visual pattern memory writeback proposal generator',
    });
    assert.deepEqual(descriptor.receipt_contract_ref, {
      ref_kind: 'json_pointer',
      ref: '/domain_memory_descriptor_locator/writeback_receipt_contract',
      role: 'locator_only_writeback_receipt_contract',
      label: 'RCA visual pattern memory writeback receipt refs',
    });
    assert.deepEqual(descriptor.recall_projection_ref, {
      ref_kind: 'json_pointer',
      ref: '/domain_memory_descriptor_locator/operator_receipt_projection',
      role: 'operator_recall_receipt_projection',
      label: 'RCA visual pattern memory operator receipt projection',
    });
    assert.deepEqual(descriptor.migration_plan_ref, {
      ref_kind: 'json_pointer',
      ref: '/domain_memory_descriptor_locator/migration_plan',
      role: 'domain_owned_migration_plan',
      label: 'RCA visual pattern memory migration plan',
    });
    assert.deepEqual(descriptor.seed_corpus_ref, {
      ref_kind: 'json_pointer',
      ref: '/domain_memory_descriptor_locator/seed_fixture_locator',
      role: 'domain_owned_seed_locator',
      label: 'RCA visual pattern memory seed fixture locator',
    });
    assert.deepEqual(descriptor.writeback_receipt_locator_ref, {
      ref_kind: 'json_pointer',
      ref: '/domain_memory_descriptor_locator/writeback_receipt_locator',
      role: 'domain_owned_writeback_receipt_locator',
      label: 'RCA visual pattern memory writeback receipt locator',
    });
    assert.equal(descriptor.freshness.source, 'contract_manifest_projection');
    assert.equal(descriptor.migration_readiness.status, DOMAIN_MEMORY_ADOPTION_STATE);
    assert.equal(descriptor.migration_readiness.migration_state, DOMAIN_MEMORY_ADOPTION_STATE);
    assert.equal(descriptor.migration_readiness.descriptor_proof_contract_state, 'landed');
    assert.equal(descriptor.migration_readiness.runtime_writeback_state, 'pending');
    assert.equal(descriptor.migration_readiness.memory_body_migration, 'domain_owned_runtime_apply_required');
    assert.equal(descriptor.migration_readiness.opl_apply_allowed, false);
    assert.equal(descriptor.status, DOMAIN_MEMORY_ADOPTION_STATE);
    assert.equal(descriptor.authority_boundary.opl_role, 'locator_projection_owner');
    assert.equal(descriptor.authority_boundary.domain_memory_owner, 'redcube_ai');
    assert.ok(descriptor.authority_boundary.forbidden_opl_authority.includes('memory_store_owner'));
    assert.ok(descriptor.authority_boundary.forbidden_opl_authority.includes('visual_route_owner'));
    assert.ok(descriptor.authority_boundary.forbidden_opl_authority.includes('accept_reject_owner'));
    assert.equal(descriptor.authority_boundary.can_write_domain_truth, false);
    assert.equal(descriptor.authority_boundary.can_authorize_quality_verdict, false);
    assert.equal(descriptor.authority_boundary.can_write_artifacts, false);
    assert.equal(descriptor.authority_boundary.can_choose_visual_route, false);
    assert.equal(descriptor.authority_boundary.can_accept_or_reject_memory_writeback, false);
    assert.equal(descriptor.authority_boundary.can_issue_review_or_export_verdict, false);

    assert.equal(memory.descriptor_id, 'rca.visual_pattern_memory.descriptor.v1');
    assert.equal(memory.status, DOMAIN_MEMORY_ADOPTION_STATE);
    assert.equal(memory.locator_id, 'rca.visual_pattern_memory.locator.v1');
    assert.equal(memory.memory_family, 'visual_pattern_memory');
    assert.equal(memory.memory_model, 'natural_language_pattern_cards');
    assert.equal(memory.descriptor_model, 'repo_tracked_descriptor_refs_only');
    assert.equal(memory.locator_model, 'rca_owned_memory_ref_locator');
    assert.equal(memory.policy_ref, 'human_doc:visual_pattern_memory_policy');
    assert.equal(memory.human_doc_ref, 'human_doc:domain_memory_descriptor_locator');
    assert.deepEqual(memory.opl_consumes, [
      'memory locator refs',
      'memory provenance refs',
      'writeback receipt refs',
    ]);
    for (const forbidden of [
      'own_memory_content',
      'choose_visual_route',
      'issue_review_or_export_verdict',
      'mutate_canonical_artifacts',
    ]) {
      assert.ok(memory.opl_forbidden.includes(forbidden));
    }
    assert.deepEqual(memory.authority_boundary, {
      memory_content_owner: 'redcube_ai',
      route_truth_owner: 'redcube_ai',
      review_export_verdict_owner: 'redcube_ai',
      artifact_authority_owner: 'redcube_ai',
      opl_role: 'locator_ref_receipt_consumer_only',
      opl_can_accept_or_reject_memory_writeback: false,
    });
  });

  test('RCA domain memory migration plan is locator-only and acceptance-gated', () => {
    const payload = contract();
    const memory = payload.standard_domain_agent_skeleton.domain_memory_descriptor_locator;
    const plan = memory.migration_plan;

    assert.equal(plan.plan_id, 'rca.visual_pattern_memory.migration_plan.v1');
    assert.equal(plan.state, DOMAIN_MEMORY_ADOPTION_STATE);
    assert.equal(plan.descriptor_proof_contract_state, 'landed');
    assert.equal(plan.runtime_writeback_state, 'pending');
    assert.deepEqual(plan.source_surfaces, [
      'workspace_runtime_root',
      'product_entry_session',
      'visual_director_review',
      'screenshot_review',
      'export_closeout',
      'human_doc_reference',
    ]);
    assert.deepEqual(plan.migration_steps, [
      'discover_candidate_lessons',
      'extract_reusable_pattern_card_candidate',
      'record_seed_fixture_locator_ref',
      'generate_writeback_proposal_locator',
      'domain_review_accept_or_reject',
      'publish_memory_locator_ref',
      'emit_writeback_receipt_ref',
      'project_operator_receipt_status',
    ]);
    for (const gate of [
      'candidate_excludes_current_deliverable_content',
      'candidate_excludes_review_export_verdict',
      'candidate_excludes_canonical_artifact_blob',
      'proposal_is_locator_only',
      'decision_is_rca_owned_accept_or_reject',
      'writeback_receipt_is_locator_only',
      'operator_receipt_projection_is_locator_only',
    ]) {
      assert.ok(plan.acceptance_gates.includes(gate));
    }
    assert.deepEqual(plan.repository_boundary, {
      repo_tracks_migration_plan: true,
      repo_tracks_seed_locator_contract: true,
      repo_tracks_memory_entries: false,
      repo_tracks_receipt_instances: false,
      repo_tracks_visual_or_export_artifacts: false,
      visual_truth_changed: false,
      route_truth_changed: false,
    });
  });

  test('RCA visual pattern memory seed and receipt surfaces do not carry memory content or artifacts', () => {
    const payload = contract();
    const memory = payload.standard_domain_agent_skeleton.domain_memory_descriptor_locator;
    const seed = memory.seed_fixture_locator;
    const receipt = memory.writeback_receipt_locator;

    assert.equal(seed.fixture_id, 'rca.visual_pattern_memory.seed_fixture_locator.v1');
    assert.equal(seed.fixture_model, 'locator_only_no_memory_content');
    assert.deepEqual(seed.required_locator_fields, [
      'seed_id',
      'source_review_ref',
      'stage_scope',
      'deliverable_family',
      'reusable_lesson_ref',
      'provenance_refs',
      'migration_status',
    ]);
    for (const forbidden of [
      'memory_content_body',
      'slide_or_page_content',
      'visual_verdict',
      'export_verdict',
      'canonical_artifact_blob',
    ]) {
      assert.ok(seed.forbidden_seed_fields.includes(forbidden));
    }
    assert.equal(receipt.locator_id, 'rca.visual_pattern_memory.writeback_receipt_locator.v1');
    assert.equal(receipt.receipt_contract_id, 'rca.visual_pattern_memory.writeback_receipt_refs.v1');
    assert.equal(receipt.receipt_model, 'locator_only_no_receipt_instance');
    assert.equal(receipt.runtime_writeback_state, 'pending');
    assert.equal(receipt.repo_tracks_receipt_instances, false);
    assert.deepEqual(receipt.locator_fields, [
      'receipt_id',
      'proposal_id',
      'source_review_ref',
      'candidate_memory_ref',
      'writeback_status',
      'memory_locator_ref',
      'operator_receipt_projection_ref',
      'owner',
      'created_at',
    ]);
  });

  test('RCA visual pattern memory proposal, accept/reject, and operator receipt projection stay locator-only', () => {
    const payload = contract();
    const memory = payload.standard_domain_agent_skeleton.domain_memory_descriptor_locator;
    const proposal = memory.writeback_proposal_generator;
    const decision = memory.accept_reject_command;
    const projection = memory.operator_receipt_projection;

    assert.equal(proposal.generator_id, 'rca.visual_pattern_memory.writeback_proposal_generator.v1');
    assert.equal(proposal.generator_model, 'locator_only_candidate_projection');
    assert.deepEqual(proposal.proposal_contract.required_fields, [
      'proposal_id',
      'seed_fixture_ref',
      'source_review_ref',
      'stage_scope',
      'deliverable_family',
      'candidate_memory_ref',
      'provenance_refs',
      'recommended_decision',
    ]);
    for (const field of ['memory_content_body', 'visual_verdict', 'export_verdict', 'canonical_artifact_blob']) {
      assert.ok(proposal.proposal_contract.forbidden_fields.includes(field));
    }
    assert.equal(proposal.repository_boundary.repo_tracks_proposal_instances, false);

    assert.equal(decision.command_id, 'rca.visual_pattern_memory.accept_reject.v1');
    assert.deepEqual(decision.allowed_decisions, ['accepted', 'rejected']);
    assert.deepEqual(decision.output_refs, [
      'memory_locator_ref',
      'writeback_receipt_ref',
      'operator_receipt_projection_ref',
    ]);
    assert.equal(decision.side_effect_boundary.writes_domain_memory_outside_repo, true);
    assert.equal(decision.side_effect_boundary.writes_repo_memory_entry, false);
    assert.equal(decision.side_effect_boundary.writes_review_export_verdict, false);

    assert.equal(projection.projection_id, 'rca.visual_pattern_memory.operator_receipt_projection.v1');
    assert.deepEqual(projection.visible_fields, [
      'receipt_id',
      'proposal_id',
      'writeback_status',
      'memory_locator_ref',
      'source_review_ref',
      'operator_message_ref',
    ]);
    assert.ok(projection.forbidden_projection_fields.includes('memory_content_body'));
    assert.ok(projection.forbidden_projection_fields.includes('artifact_blob'));
    assert.equal(projection.opl_consumption_policy.opl_can_surface_projection, true);
    assert.equal(projection.opl_consumption_policy.opl_can_store_memory_content, false);
    assert.equal(projection.opl_consumption_policy.opl_can_issue_decision, false);
  });
}
