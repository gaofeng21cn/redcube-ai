// @ts-nocheck
import {
  assert,
  getProductEntryManifest,
  prepareProductEntryWorkspace,
  test,
  withMockHermesAndRuntimeState,
} from '../gateway-case-shared.ts';

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
  assert.equal(descriptor.migration_readiness.status, 'migration_plan_ready_descriptor_only');
  assert.equal(descriptor.migration_readiness.memory_body_migration, 'domain_owned_runtime_apply_required');
  assert.equal(descriptor.migration_readiness.opl_apply_allowed, false);
  assert.equal(descriptor.status, 'active');

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
  await withMockHermesAndRuntimeState(async () => {
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
      manifest.domain_agent_skeleton_adapter.runtime_declarations.domain_memory_descriptor_locator_ref,
    );
  });
});
