// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';

const DOMAIN_MEMORY_ADOPTION_STATE = 'descriptor_proof_contract_landed_runtime_writeback_pending';

const DOMAIN_MEMORY_SUBREFS = {
  memory_locator: '/domain_memory_descriptor_locator/memory_locator',
  writeback_proposal_generator: '/domain_memory_descriptor_locator/writeback_proposal_generator',
  writeback_receipt_contract: '/domain_memory_descriptor_locator/writeback_receipt_contract',
  operator_receipt_projection: '/domain_memory_descriptor_locator/operator_receipt_projection',
  migration_plan: '/domain_memory_descriptor_locator/migration_plan',
  seed_fixture_locator: '/domain_memory_descriptor_locator/seed_fixture_locator',
  writeback_receipt_locator: '/domain_memory_descriptor_locator/writeback_receipt_locator',
};

export function registerDomainMemoryAdoptionTests(contract) {
  test('RCA domain memory descriptor points at explicit locator refs without moving visual authority to OPL', () => {
    const payload = contract();
    const descriptor = payload.domain_memory_descriptor;
    const locator = payload.domain_memory_descriptor_locator;

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
    assert.deepEqual(descriptor.memory_pack_ref.ref, '/domain_memory_descriptor_locator');
    assert.deepEqual(descriptor.retrieval_contract_ref.ref, DOMAIN_MEMORY_SUBREFS.memory_locator);
    assert.deepEqual(descriptor.writeback_contract_ref.ref, DOMAIN_MEMORY_SUBREFS.writeback_proposal_generator);
    assert.deepEqual(descriptor.receipt_contract_ref.ref, DOMAIN_MEMORY_SUBREFS.writeback_receipt_contract);
    assert.deepEqual(descriptor.recall_projection_ref.ref, DOMAIN_MEMORY_SUBREFS.operator_receipt_projection);
    assert.deepEqual(descriptor.migration_plan_ref.ref, DOMAIN_MEMORY_SUBREFS.migration_plan);
    assert.deepEqual(descriptor.seed_corpus_ref.ref, DOMAIN_MEMORY_SUBREFS.seed_fixture_locator);
    assert.deepEqual(descriptor.writeback_receipt_locator_ref.ref, DOMAIN_MEMORY_SUBREFS.writeback_receipt_locator);
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

    assert.equal(locator.surface_kind, 'domain_memory_descriptor_locator_projection_ref');
    assert.equal(locator.surface_id, 'domain_memory_descriptor_locator');
    assert.equal(locator.projection_mode, 'canonical_ref_only_no_body_copy');
    assert.equal(locator.body_copy_in_adoption, false);
    assert.equal(locator.status, DOMAIN_MEMORY_ADOPTION_STATE);
    assert.equal(locator.authority_role, 'locator_ref_receipt_consumer_only');
    assert.deepEqual(locator.subrefs, DOMAIN_MEMORY_SUBREFS);
    assert.deepEqual(locator.forbidden_body_fields, [
      'memory_content_body',
      'slide_or_page_content',
      'visual_truth',
      'visual_verdict',
      'export_verdict',
      'review_export_verdict',
      'canonical_artifact_blob',
      'receipt_instance',
    ]);
  });

  test('RCA domain memory adoption keeps nested locator surfaces as refs only', () => {
    const locator = contract().domain_memory_descriptor_locator;

    assert.deepEqual(Object.keys(locator.subrefs), [
      'memory_locator',
      'writeback_proposal_generator',
      'writeback_receipt_contract',
      'operator_receipt_projection',
      'migration_plan',
      'seed_fixture_locator',
      'writeback_receipt_locator',
    ]);
    for (const ref of Object.values(locator.subrefs)) {
      assert.equal(ref.startsWith('/domain_memory_descriptor_locator/'), true, ref);
    }
    assert.equal(locator.generated_readback_ref, 'opl_generated:product_entry_manifest#/domain_memory_descriptor_locator');
    assert.equal(locator.manifest_ref, '/domain_memory_descriptor_locator');
  });
}
