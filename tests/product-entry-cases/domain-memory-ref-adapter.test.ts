// @ts-nocheck
import {
  assert,
  getProductEntryManifest,
  prepareProductEntryWorkspace,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';

const DOMAIN_MEMORY_ADOPTION_STATE = 'descriptor_proof_contract_landed_runtime_writeback_pending';

function assertStandardFamilyDomainMemoryRef(descriptor) {
  assert.equal(descriptor.surface_kind, 'family_domain_memory_ref');
  assert.equal(descriptor.version, 'family-domain-memory-ref.v1');
  assert.equal(descriptor.memory_ref_id, 'rca_visual_pattern_memory');
  assert.equal(descriptor.target_domain_id, 'redcube_ai');
  assert.equal(descriptor.owner, 'redcube_ai');
  assert.equal(descriptor.memory_family, 'visual_pattern_memory');
  assert.deepEqual(descriptor.stage_applicability, [
    'source_intake',
    'communication_strategy',
    'visual_direction',
    'artifact_creation',
    'review_and_revision',
    'package_and_handoff',
  ]);

  assert.deepEqual(descriptor.memory_pack_ref, {
    ref_kind: 'json_pointer',
    ref: '/domain_memory_descriptor_locator',
    role: 'domain_owned_memory_pack_descriptor',
    label: 'RCA visual pattern memory descriptor locator',
  });
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

  assert.equal(descriptor.freshness.source, 'product_entry_manifest_build');
  assert.equal(descriptor.freshness.descriptor_locator_ref, '/domain_memory_descriptor_locator');
  assert.equal(
    descriptor.migration_readiness.status,
    DOMAIN_MEMORY_ADOPTION_STATE,
  );
  assert.equal(descriptor.migration_readiness.migration_state, DOMAIN_MEMORY_ADOPTION_STATE);
  assert.equal(descriptor.migration_readiness.descriptor_proof_contract_state, 'landed');
  assert.equal(descriptor.migration_readiness.runtime_writeback_state, 'pending');
  assert.equal(descriptor.migration_readiness.memory_body_migration, 'domain_owned_runtime_apply_required');
  assert.equal(descriptor.migration_readiness.opl_apply_allowed, false);
  assert.equal(descriptor.status, DOMAIN_MEMORY_ADOPTION_STATE);

  assert.equal(descriptor.authority_boundary.opl_role, 'locator_projection_owner');
  assert.equal(descriptor.authority_boundary.domain_memory_owner, 'redcube_ai');
  assert.deepEqual(descriptor.authority_boundary.forbidden_opl_authority, [
    'memory_store_owner',
    'domain_truth_owner',
    'visual_route_owner',
    'accept_reject_owner',
    'quality_verdict_owner',
    'review_export_verdict_owner',
    'artifact_authority',
  ]);
  assert.equal(descriptor.authority_boundary.can_write_domain_truth, false);
  assert.equal(descriptor.authority_boundary.can_authorize_quality_verdict, false);
  assert.equal(descriptor.authority_boundary.can_write_artifacts, false);
  assert.equal(descriptor.authority_boundary.can_choose_visual_route, false);
  assert.equal(descriptor.authority_boundary.can_accept_or_reject_memory_writeback, false);
  assert.equal(descriptor.authority_boundary.can_issue_review_or_export_verdict, false);
}

test('product-entry manifest exposes OPL standard domain_memory_descriptor for RCA visual pattern memory', async () => {
  await withMockCodexRuntimeState(async () => {
    const manifest = await getProductEntryManifest({
      workspace_root: await prepareProductEntryWorkspace(),
    });

    assertStandardFamilyDomainMemoryRef(manifest.domain_memory_descriptor);
    assert.deepEqual(manifest.skill_catalog.skills[0].domain_projection.domain_memory_descriptor_ref, {
      ref_kind: 'json_pointer',
      ref: '/domain_memory_descriptor',
      label: 'RCA OPL family domain memory ref',
    });
    assert.equal(
      manifest.domain_memory_descriptor.memory_pack_ref.ref,
      manifest.standard_domain_agent_skeleton.runtime_declarations.domain_memory_descriptor_locator_ref,
    );
  });
});

test('product-entry manifest exposes controlled consumed-memory and writeback receipt proof refs', async () => {
  await withMockCodexRuntimeState(async () => {
    const manifest = await getProductEntryManifest({
      workspace_root: await prepareProductEntryWorkspace(),
    });
    const attempt = manifest.controlled_visual_stage_attempt;

    assert.equal(
      attempt.proof_model,
      'consumed_memory_writeback_receipt_descriptor_sidecar_quality_ref_equivalence_only',
    );
    assert.equal(attempt.status, DOMAIN_MEMORY_ADOPTION_STATE);
    assert.equal(attempt.proof_contract_state, 'landed');
    assert.equal(attempt.runtime_writeback_state, 'pending');
    assert.equal(
      attempt.provider_controlled_proof_id,
      'rca.opl_hosted.controlled_visual_stage_attempt_memory_proof.v1',
    );
    assert.equal(
      attempt.provider_controlled_proof_model,
      'opl_hosted_attempt_consumes_memory_refs_and_returns_locator_only_receipts',
    );
    assert.deepEqual(attempt.memory_consumption_contract.required_fields, [
      'memory_ref',
      'memory_family',
      'stage_scope',
      'deliverable_family',
      'provenance_refs',
      'content_ref',
    ]);
    for (const field of [
      'memory_content_body',
      'slide_or_page_content',
      'visual_verdict',
      'export_verdict',
      'review_verdict',
      'canonical_artifact_blob',
    ]) {
      assert.ok(attempt.memory_consumption_contract.forbidden_fields.includes(field));
    }
    assert.equal(attempt.memory_consumption_contract.repository_boundary.repo_tracks_memory_content_body, false);
    assert.equal(attempt.writeback_proof_contract.proposal_ref, 'rca-memory-proposal:visual-pattern:<proposal-id>');
    assert.equal(attempt.writeback_proof_contract.status, DOMAIN_MEMORY_ADOPTION_STATE);
    assert.equal(attempt.writeback_proof_contract.receipt_ref, 'rca-memory-receipt:visual-pattern:<receipt-id>');
    assert.equal(attempt.writeback_proof_contract.memory_locator_ref, 'rca-memory:visual-pattern:<memory-id>');
    assert.equal(attempt.writeback_proof_contract.repository_boundary.repo_tracks_proposal_instance, false);
    assert.equal(attempt.writeback_proof_contract.repository_boundary.repo_tracks_receipt_instance, false);
    assert.equal(attempt.writeback_proof_contract.repository_boundary.repo_tracks_memory_entry, false);
    assert.equal(attempt.writeback_proof_contract.repository_boundary.repo_tracks_visual_or_export_artifacts, false);

    assert.deepEqual(attempt.opl_hosted_attempt.consumed_memory_refs, [
      'rca-memory:visual-pattern:<memory-id>',
    ]);
    assert.equal(attempt.opl_hosted_attempt.writeback_receipt_ref, 'rca-memory-receipt:visual-pattern:<receipt-id>');
    assert.equal(
      attempt.opl_hosted_attempt.operator_receipt_projection_ref,
      '/domain_memory_descriptor_locator/operator_receipt_projection',
    );
    assert.equal(attempt.equivalence_proof.direct_and_opl_share_consumed_memory_refs, true);
    assert.equal(attempt.equivalence_proof.opl_writes_memory_content, false);
    assert.equal(attempt.equivalence_proof.opl_writes_receipt_instance, false);
    assert.equal(attempt.projection_only_result.memory_content_body, null);
    assert.equal(attempt.projection_only_result.status, DOMAIN_MEMORY_ADOPTION_STATE);
    assert.equal(attempt.projection_only_result.runtime_writeback_state, 'pending');
    assert.equal(attempt.projection_only_result.receipt_instance, null);
    assert.deepEqual(attempt.projection_only_result.writeback_refs, {
      proposal_ref: 'rca-memory-proposal:visual-pattern:<proposal-id>',
      receipt_ref: 'rca-memory-receipt:visual-pattern:<receipt-id>',
      memory_locator_ref: 'rca-memory:visual-pattern:<memory-id>',
      operator_receipt_projection_ref: '/domain_memory_descriptor_locator/operator_receipt_projection',
    });
    assert.equal(attempt.opl_policy_proof.opl_consumes_memory_refs, true);
    assert.equal(attempt.opl_policy_proof.opl_consumes_writeback_receipt_refs, true);
    assert.equal(attempt.opl_policy_proof.opl_holds_memory_content, false);
    assert.equal(attempt.opl_policy_proof.opl_holds_receipt_instance, false);
  });
});
