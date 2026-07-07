// @ts-nocheck
import { assert, contract, fs, path, repoRoot, test } from './shared.ts';

test('RCA standard domain-agent skeleton keeps repo source and runtime artifacts separate', () => {
  const payload = contract();
  const skeleton = payload.standard_domain_agent_skeleton;

  assert.equal(skeleton.surface_kind, 'rca_domain_authority_refs');
  assert.equal(skeleton.skeleton_id, 'rca.standard_domain_agent_skeleton.v1');
  assert.equal(skeleton.mapping_model, 'rca_refs_only_opl_generated_standard_domain_agent');
  assert.deepEqual(skeleton.repo_source_boundary.allowed_roots.map((root) => root.boundary_id), [
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
    for (const ref of root.repo_refs) {
      if (ref.startsWith('human_doc:')) {
        continue;
      }
      assert.equal(fs.existsSync(path.join(repoRoot, ref)), true, `${root.boundary_id}:${ref}`);
    }
  }
  assert.ok(skeleton.repo_source_boundary.audit_surface.forbidden_repo_writes.includes('canonical_artifact_blob'));
  assert.deepEqual(skeleton.runtime_declarations.declares_only, [
    'domain_handler_target',
    'projection_builder',
    'lifecycle_adapter',
    'visual_transition_spec',
    'visual_transition_evaluator',
    'domain_memory_descriptor_locator',
    'domain_owner_receipt_contract',
    'lifecycle_guarded_apply_proof',
  ]);
  assert.equal(skeleton.runtime_declarations.domain_handler_target_ref, '/product_entry_shell/domain_handler');
  assert.equal(skeleton.runtime_declarations.projection_builder_ref, '/family_stage_control_plane');
  assert.equal(skeleton.runtime_declarations.lifecycle_adapter_ref, '/opl_family_lifecycle_adapter');
  assert.equal(skeleton.runtime_declarations.visual_transition_spec_ref, '/visual_transition_spec');
  assert.equal(skeleton.runtime_declarations.visual_transition_evaluator_ref, '/visual_transition_evaluator');
  assert.equal(skeleton.runtime_declarations.domain_memory_descriptor_locator_ref, '/domain_memory_descriptor_locator');
  assert.equal(skeleton.lifecycle_guarded_apply_proof.proof_id, 'rca.lifecycle_guarded_apply_proof.v1');
  assert.equal(skeleton.domain_owner_receipt_contract.contract_id, 'rca.domain_owner_receipt.v1');
});

test('RCA controlled soak remains deferred without descriptor index skeleton regression', () => {
  const payload = contract();
  const controlledSoak = payload.standard_domain_agent_skeleton.controlled_soak_no_regression_attempt;

  assert.equal(controlledSoak.state, 'deferred_typed_blocker');
  assert.equal(controlledSoak.controlled_soak_apply_contract_open, true);
  assert.equal(controlledSoak.deferred_blocker.blocker_kind, 'domain_owner_receipt_required');
  assert.equal(controlledSoak.deferred_blocker.required_owner, 'redcube_ai');
  assert.deepEqual(controlledSoak.no_regression_surface_refs, [
    '/controlled_visual_stage_attempt',
    '/controlled_memory_apply_proof',
    '/artifact_locator_contract',
    '/runtime_residue_retirement',
  ]);
  assert.equal(controlledSoak.authority_boundary.opl_role, 'controlled_soak_attempt_router_only');
  assert.equal(controlledSoak.authority_boundary.can_hold_visual_truth, false);
  assert.equal(controlledSoak.authority_boundary.can_hold_review_export_verdict, false);
  assert.equal(controlledSoak.repository_boundary.repo_tracks_visual_or_export_artifacts, false);
  assert.equal(controlledSoak.repository_boundary.repo_tracks_receipt_instance, false);
});

test('RCA artifact locator and domain_action_adapter receipts expose refs without OPL visual verdict ownership', () => {
  const payload = contract();
  const skeleton = payload.standard_domain_agent_skeleton;

  assert.equal(skeleton.artifact_locator_contract.contract_id, 'rca.workspace_runtime_artifact_locator.v1');
  assert.equal(skeleton.artifact_locator_contract.locator_model, 'opl_stage_folder_contract_refs_only');
  assert.equal(skeleton.artifact_locator_contract.repo_source_boundary.repo_tracks_visual_or_export_artifact_blobs, false);
  for (const forbidden of [
    'store_png_pptx_pdf_blob',
    'declare_visual_export_verdict',
    'rewrite_canonical_artifact',
    'mutate_review_state',
  ]) {
    assert.ok(skeleton.artifact_locator_contract.opl_consumption_policy.forbidden.includes(forbidden));
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
  ]) {
    assert.ok(skeleton.domain_action_adapter_receipt_refs.forbidden_receipt_fields.includes(field));
  }
  assert.deepEqual(skeleton.domain_action_adapter_receipt_refs.forbidden_receipt_roles, [
    'compatibility_alias',
  ]);
  assert.equal(skeleton.controlled_visual_stage_attempt.fixture_id, 'rca.controlled_visual_stage_attempt.fixture.v1');
  assert.equal(
    skeleton.controlled_visual_stage_attempt.proof_model,
    'consumed_memory_writeback_receipt_descriptor_domain_action_adapter_quality_ref_equivalence_only',
  );
  assert.deepEqual(skeleton.controlled_visual_stage_attempt.stage_kinds, ['review_and_revision', 'package_and_handoff']);
  assert.deepEqual(skeleton.controlled_visual_stage_attempt.route_stage_refs, [
    'visual_director_review',
    'screenshot_review',
    'repair_image_pages',
    'export_pptx',
  ]);
  assert.equal(skeleton.controlled_visual_stage_attempt.memory_consumption_contract.repository_boundary.repo_tracks_consumed_memory_ref_fixture, true);
  assert.equal(skeleton.controlled_visual_stage_attempt.memory_consumption_contract.repository_boundary.repo_tracks_memory_content_body, false);
  assert.equal(skeleton.controlled_visual_stage_attempt.memory_consumption_contract.repository_boundary.repo_tracks_visual_or_export_artifacts, false);
  assert.equal(skeleton.controlled_visual_stage_attempt.writeback_proof_contract.repository_boundary.repo_tracks_proof_schema_and_locator_fixture, true);
  assert.equal(skeleton.controlled_visual_stage_attempt.writeback_proof_contract.repository_boundary.repo_tracks_memory_entry, false);
  assert.equal(skeleton.controlled_visual_stage_attempt.writeback_proof_contract.repository_boundary.repo_tracks_visual_or_export_artifacts, false);
});
