// @ts-nocheck
import {
  assert,
  getProductEntryManifest,
  prepareProductEntryWorkspace,
  readJson,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';
import { existsSync } from 'node:fs';

test('product-entry manifest retires the private standard skeleton body and keeps explicit authority refs', async () => {
  await withMockCodexRuntimeState(async () => {
    const manifest = await getProductEntryManifest({
      workspace_root: await prepareProductEntryWorkspace(),
    });

    assert.equal(manifest.standard_domain_agent_skeleton, undefined);
    assert.equal(manifest.physical_skeleton_follow_through, undefined);
    assert.equal(manifest.review_helper_baseline_follow_through, undefined);

    assert.equal(manifest.artifact_locator_contract.surface_kind, 'artifact_locator_contract');
    assert.equal(manifest.domain_memory_descriptor_locator.surface_kind, 'domain_memory_descriptor_locator');
    assert.equal(manifest.domain_action_adapter_receipt_refs.receipt_contract_id, 'rca.domain_action_adapter.receipt_refs.v1');
    assert.equal(manifest.controlled_visual_stage_attempt.fixture_id, 'rca.controlled_visual_stage_attempt.fixture.v1');
    assert.equal(manifest.controlled_memory_apply_proof.proof_id, 'rca.visual_pattern_memory.controlled_apply_proof.v1');
    assert.equal(manifest.controlled_soak_no_regression_attempt.attempt_id, 'rca.controlled_soak.no_regression_attempt.v1');

    assert.equal(manifest.runtime_residue_retirement.surface_kind, 'runtime_residue_retirement_audit');
    assert.equal(manifest.runtime_residue_retirement.status, 'active_path_retired');
    assert.deepEqual(manifest.runtime_residue_retirement.retired_default_surfaces, [
      'hermes_first_default_runtime',
      'retired_gateway_protocol_boundary_public_entry',
      'repo_local_manager_default',
    ]);
  });
});

test('product-entry manifest exposes owner receipt, lifecycle apply, and transition authority refs', async () => {
  await withMockCodexRuntimeState(async () => {
    const manifest = await getProductEntryManifest({
      workspace_root: await prepareProductEntryWorkspace(),
    });

    const ownerReceipt = manifest.domain_owner_receipt_contract;
    assert.equal(ownerReceipt.surface_kind, 'domain_owner_receipt_contract');
    assert.equal(ownerReceipt.contract_id, 'rca.domain_owner_receipt.v1');
    assert.deepEqual(ownerReceipt.allowed_return_shapes, [
      'domain_receipt',
      'typed_blocker',
      'no_regression_evidence',
    ]);
    assert.equal(ownerReceipt.opl_consumption_policy.opl_can_store_receipt_refs, true);
    assert.equal(ownerReceipt.opl_consumption_policy.opl_can_store_visual_truth, false);
    assert.equal(ownerReceipt.repository_boundary.repo_tracks_runtime_evidence_instances, false);

    const lifecycleApply = manifest.lifecycle_guarded_apply_proof;
    assert.equal(lifecycleApply.surface_kind, 'lifecycle_guarded_apply_proof');
    assert.equal(lifecycleApply.proof_id, 'rca.lifecycle_guarded_apply_proof.v1');
    assert.deepEqual(
      lifecycleApply.operations.map((operation) => operation.operation),
      ['cleanup', 'restore', 'retention'],
    );
    for (const operation of lifecycleApply.operations) {
      assert.equal(operation.owner, 'redcube_ai');
      assert.equal(operation.opl_can_apply_domain_artifact_mutation, false);
      assert.equal(operation.domain_receipt_required_for_artifact_mutation, true);
    }

    const transitionSpec = manifest.visual_transition_spec;
    assert.equal(transitionSpec.surface_kind, 'visual_transition_spec');
    assert.equal(transitionSpec.spec_id, 'rca.visual_transition_spec.v1');
    assert.deepEqual(
      transitionSpec.transition_table.map((transition) => [
        transition.transition_id,
        transition.from_stage,
        transition.to_stage,
      ]),
      [
        ['source_ready_to_strategy', 'source_intake', 'communication_strategy'],
        ['strategy_ready_to_visual_direction', 'communication_strategy', 'visual_direction'],
        ['visual_direction_ready_to_artifact_creation', 'visual_direction', 'artifact_creation'],
        ['artifact_ready_to_review', 'artifact_creation', 'review_and_revision'],
        ['review_ready_to_package', 'review_and_revision', 'package_and_handoff'],
      ],
    );
    assert.equal(transitionSpec.guard_contract.guard_model, 'refs_and_typed_blockers_only');
    assert.equal(transitionSpec.runner_boundary.opl_can_declare_visual_ready, false);
    assert.equal(transitionSpec.runner_boundary.opl_can_mutate_artifacts, false);
    assert.equal(transitionSpec.evaluator_descriptor.domain_action_adapter_action, 'evaluate_visual_transition');

    const expectedRegistry = readJson('contracts/visual_transition_adapter_profile.json');
    const registry = manifest.visual_transition_adapter_profile_registry;
    assert.deepEqual(registry, expectedRegistry);
    assert.equal(registry.authority_boundary.refs_only, true);
    for (const field of [
      'domain_transition_profile_extension_is_core_ontology',
      'can_execute_domain_action',
      'can_write_domain_truth',
      'can_create_owner_receipt',
      'can_create_typed_blocker',
      'can_claim_domain_ready',
      'can_claim_visual_ready',
      'can_claim_exportable',
      'can_mutate_artifacts',
    ]) {
      assert.equal(registry.authority_boundary[field], false, field);
    }

    const { buildRedCubeDomainAuthorityRefs } = await import('../../packages/redcube-domain-entry/dist/index.js');
    const authorityRefs = buildRedCubeDomainAuthorityRefs();
    assert.deepEqual(authorityRefs.visual_transition_adapter_profile_registry, expectedRegistry);
    assert.equal(
      authorityRefs.source_refs.visual_transition_adapter_profile_registry_ref,
      '/visual_transition_adapter_profile_registry',
    );
  });
});

test('product-entry consumes the declarative stage manifest and never a tracked stage plane', async () => {
  await withMockCodexRuntimeState(async () => {
    const manifest = await getProductEntryManifest({
      workspace_root: await prepareProductEntryWorkspace(),
    });

    assert.equal(existsSync('contracts/stage_control_plane.json'), false);
    assert.equal(manifest.declarative_stage_manifest_ref, 'agent/stages/manifest.json');
    assert.equal(manifest.family_stage_control_plane_ref, 'opl-generated:family_stage_control_plane');
    assert.equal(Object.hasOwn(manifest, 'family_stage_control_plane'), false);
  });
});
