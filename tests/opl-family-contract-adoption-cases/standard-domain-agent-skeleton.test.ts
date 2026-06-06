// @ts-nocheck
import { assert, contract, fs, path, repoRoot, test } from './shared.ts';

test('RCA standard domain-agent skeleton keeps repo source and runtime artifacts separate', () => {
  const payload = contract();
  const skeleton = payload.standard_domain_agent_skeleton;

  assert.equal(skeleton.surface_kind, 'standard_domain_agent_skeleton');
  assert.equal(skeleton.skeleton_id, 'rca.standard_domain_agent_skeleton.v1');
  assert.equal(skeleton.mapping_model, 'physical_skeleton_repo_source_layout_with_manifest_projection');
  assert.deepEqual(skeleton.repo_source_boundary.allowed_roots, [
    'agent',
    'contracts',
    'runtime',
    'docs',
  ]);
  assert.equal(skeleton.repo_source_boundary.repo_tracks_runtime_artifact_blobs, false);
  assert.equal(skeleton.repo_source_boundary.repo_tracks_receipt_instances, false);
  assert.equal(skeleton.repo_source_boundary.audit_surface.status, 'pass');
  assert.deepEqual(skeleton.repo_source_boundary.audit_surface.expected_roots, [
    'agent',
    'contracts',
    'runtime',
    'docs',
  ]);
  assert.deepEqual(skeleton.repo_source_boundary.audit_surface.missing_roots, []);
  for (const root of skeleton.repo_source_boundary.allowed_roots) {
    assert.equal(fs.existsSync(path.join(repoRoot, root)), true);
  }
  assert.ok(skeleton.repo_source_boundary.audit_surface.forbidden_repo_writes.includes('canonical_artifact_blob'));
  assert.deepEqual(skeleton.runtime_declarations.declares_only, [
    'domain_action_adapter_adapter',
    'projection_builder',
    'lifecycle_adapter',
    'visual_transition_spec',
    'visual_transition_evaluator',
    'domain_memory_descriptor_locator',
    'domain_owner_receipt_contract',
    'lifecycle_guarded_apply_proof',
    'workspace_receipt_inventory_projection',
  ]);
  assert.equal(skeleton.runtime_declarations.domain_action_adapter_adapter_ref, '/product_entry_shell/domain_action_adapter');
  assert.equal(skeleton.runtime_declarations.projection_builder_ref, '/family_stage_control_plane');
  assert.equal(skeleton.runtime_declarations.lifecycle_adapter_ref, '/opl_family_lifecycle_adapter');
  assert.equal(skeleton.runtime_declarations.visual_transition_spec_ref, '/visual_transition_spec');
  assert.equal(skeleton.runtime_declarations.visual_transition_evaluator_ref, '/visual_transition_evaluator');
  assert.equal(skeleton.runtime_declarations.domain_memory_descriptor_locator_ref, '/domain_memory_descriptor_locator');
  assert.equal(skeleton.runtime_declarations.domain_owner_receipt_contract_ref, '/domain_owner_receipt_contract');
  assert.equal(skeleton.runtime_declarations.lifecycle_guarded_apply_proof_ref, '/lifecycle_guarded_apply_proof');
  assert.equal(skeleton.runtime_declarations.workspace_receipt_inventory_projection_ref, '/workspace_receipt_inventory_projection');
});

test('RCA controlled soak remains deferred without descriptor index skeleton regression', () => {
  const payload = contract();
  const controlledSoak = payload.standard_domain_agent_skeleton.controlled_soak;

  assert.equal(controlledSoak.state, 'deferred');
  assert.equal(controlledSoak.required_opl_substrate, 'Temporal production online runtime');
  assert.deepEqual(controlledSoak.owner_runtime_receipt_actions, {
    state: 'runtime_receipt_refs_available',
    domain_owner_receipt_action: 'emit_domain_owner_receipt',
    visual_memory_writeback_action: 'apply_visual_memory_writeback',
    workspace_lifecycle_action: 'apply_visual_workspace_lifecycle',
    workspace_receipt_root: '<workspace-root>/.redcube/runtime/receipts/',
    typed_blocker_on_missing_required_refs: true,
    visual_ready_claimed: false,
    repo_tracks_live_receipt_instances: false,
    opl_consumes_locator_and_receipt_refs_only: true,
  });
  assert.deepEqual(controlledSoak.no_regression_surfaces, [
    'family_action_catalog',
    'stage_control_projection',
    'route_equivalence',
    'standard_domain_agent_skeleton',
    'artifact_locator_contract',
    'domain_action_adapter_receipt_refs',
    'domain_memory_descriptor',
    'domain_memory_descriptor_locator',
    'controlled_visual_stage_attempt',
    'controlled_memory_apply_proof',
    'workspace_receipt_inventory_projection',
    'domain_owner_receipt_contract',
    'lifecycle_guarded_apply_proof',
    'visual_transition_spec',
    'visual_transition_evaluator',
    'physical_skeleton_follow_through',
    'review_helper_baseline_follow_through',
  ]);
  assert.ok(controlledSoak.forbidden_deferred_claims.includes('provider_hosted_controlled_visual_stage_soak_completed'));
  assert.ok(controlledSoak.forbidden_deferred_claims.includes('real_visual_memory_body_repo_tracked'));
  assert.ok(controlledSoak.forbidden_deferred_claims.includes('accepted_or_rejected_receipt_instance_repo_tracked'));
  assert.ok(controlledSoak.forbidden_deferred_claims.includes('OPL_holds_visual_or_export_verdict'));
});

test('RCA artifact locator and domain_action_adapter receipts expose refs without OPL visual verdict ownership', () => {
  const payload = contract();
  const skeleton = payload.standard_domain_agent_skeleton;

  assert.equal(skeleton.artifact_locator_contract.contract_id, 'rca.workspace_runtime_artifact_locator.v1');
  assert.equal(skeleton.artifact_locator_contract.locator_model, 'opl_stage_folder_contract_refs_only');
  assert.equal(skeleton.artifact_locator_contract.repo_tracks_visual_or_export_artifact_blobs, false);
  for (const forbidden of [
    'store_png_pptx_pdf_blob',
    'declare_visual_export_verdict',
    'rewrite_canonical_artifact',
    'mutate_review_state',
  ]) {
    assert.ok(skeleton.artifact_locator_contract.opl_forbidden.includes(forbidden));
  }
  assert.equal(skeleton.domain_action_adapter_receipt_refs.receipt_contract_id, 'rca.domain_action_adapter.receipt_refs.v1');
  for (const field of [
    'visual_verdict',
    'visual_truth_body',
    'export_verdict',
    'review_verdict',
    'review_export_verdict_body',
    'publication_gate_verdict',
    'canonical_artifact_blob',
    'artifact_blob',
    'artifact_body',
    'memory_content_body',
    'generic_runtime_state',
    'managed_runtime_compatibility_alias',
  ]) {
    assert.ok(skeleton.domain_action_adapter_receipt_refs.forbidden_receipt_fields.includes(field));
  }
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.fixture_id, 'rca.controlled_visual_stage_attempt.fixture.v1');
  assert.equal(
    skeleton.controlled_visual_stage_attempt_fixture.proof_model,
    'consumed_memory_writeback_receipt_descriptor_domain_action_adapter_quality_ref_equivalence_only',
  );
  assert.deepEqual(skeleton.controlled_visual_stage_attempt_fixture.stage_kinds, ['review_and_revision', 'package_and_handoff']);
  assert.deepEqual(skeleton.controlled_visual_stage_attempt_fixture.route_stage_refs, [
    'visual_director_review',
    'screenshot_review',
    'repair_image_pages',
    'export_pptx',
  ]);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_consumes_descriptor_refs, true);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_consumes_artifact_refs, true);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_consumes_quality_refs, true);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.direct_and_opl_share_descriptor_refs, true);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.direct_and_opl_share_domain_action_adapter_refs, true);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.direct_and_opl_share_quality_refs, true);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_holds_visual_verdict, false);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_holds_export_verdict, false);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_holds_canonical_artifact_content, false);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_writes_visual_truth, false);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_writes_review_export_verdict, false);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_writes_artifact_blob, false);
});
