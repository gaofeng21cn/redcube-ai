import { assert, contract, test } from './shared.js';

const AUTHORITY_REF_SURFACES = [
  'artifact_locator_contract',
  'domain_memory_descriptor_locator',
  'domain_owner_receipt_contract',
  'lifecycle_guarded_apply_proof',
  'ai_route_policy',
  'controlled_visual_stage_attempt',
  'controlled_memory_apply_proof',
  'controlled_soak_no_regression_attempt',
  'domain_action_adapter_receipt_refs',
];

test('RCA adoption exposes explicit authority refs instead of a private standard skeleton body', () => {
  const payload = contract();

  assert.equal(payload.standard_domain_agent_skeleton, undefined);
  for (const surface of AUTHORITY_REF_SURFACES) {
    const projection = payload[surface];
    assert.equal(projection.surface_id, surface);
    assert.equal(projection.surface_kind, `${surface}_projection_ref`);
    assert.equal(projection.projection_mode, 'canonical_ref_only_no_body_copy');
    assert.equal(projection.body_copy_in_adoption, false);
    assert.equal(projection.manifest_ref, `/${surface}`);
    assert.equal(projection.generated_readback_ref, `opl_generated:product_entry_manifest#/${surface}`);
  }
});

test('RCA adoption keeps memory and no-regression authority on concrete refs', () => {
  const payload = contract();

  assert.deepEqual(payload.domain_memory_descriptor_locator.subrefs, {
    memory_locator: '/domain_memory_descriptor_locator/memory_locator',
    writeback_proposal_generator: '/domain_memory_descriptor_locator/writeback_proposal_generator',
    writeback_receipt_contract: '/domain_memory_descriptor_locator/writeback_receipt_contract',
    operator_receipt_projection: '/domain_memory_descriptor_locator/operator_receipt_projection',
    migration_plan: '/domain_memory_descriptor_locator/migration_plan',
    seed_fixture_locator: '/domain_memory_descriptor_locator/seed_fixture_locator',
    writeback_receipt_locator: '/domain_memory_descriptor_locator/writeback_receipt_locator',
  });
  assert.deepEqual(payload.controlled_soak_no_regression_attempt.no_regression_surface_refs, [
    '/controlled_visual_stage_attempt',
    '/controlled_memory_apply_proof',
    '/artifact_locator_contract',
    '/runtime_residue_retirement',
  ]);
  assert.ok(payload.domain_action_adapter_receipt_refs.forbidden_receipt_fields.includes('canonical_artifact_blob'));
});

test('RCA generic primitive consumption no longer indexes a standard skeleton manifest surface', () => {
  const payload = contract();
  const consumed = payload.opl_generic_primitive_consumption.consumed_projection_surfaces;

  assert.equal(consumed.some((surface) => surface.primitive === 'standard_domain_agent_scaffold'), false);
  assert.equal(consumed.some((surface) => surface.manifest_ref === '/standard_domain_agent_skeleton'), false);
  assert.ok(payload.opl_generic_primitive_consumption.rca_does_not_own.includes('standard_domain_agent_scaffold'));
  assert.equal(
    consumed.find((surface) => surface.primitive === 'memory_transport').contract_ref,
    'contracts/runtime-program/opl-family-contract-adoption.json#/domain_memory_descriptor_locator',
  );
  assert.equal(
    consumed.find((surface) => surface.primitive === 'artifact_lifecycle').contract_ref,
    'contracts/runtime-program/opl-family-contract-adoption.json#/lifecycle_guarded_apply_proof',
  );
});
