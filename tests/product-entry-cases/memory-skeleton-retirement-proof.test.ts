// @ts-nocheck
import {
  assert,
  getProductEntryManifest,
  prepareProductEntryWorkspace,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';

test('product-entry manifest exposes physical skeleton audit and runtime residue retirement proof', async () => {
  await withMockCodexRuntimeState(async () => {
    const manifest = await getProductEntryManifest({
      workspace_root: await prepareProductEntryWorkspace(),
    });
    const skeleton = manifest.standard_domain_agent_skeleton;

    assert.equal(skeleton.mapping_model, 'physical_skeleton_repo_source_layout_with_manifest_projection');
    assert.equal(skeleton.repo_source_boundary.physical_relayout_required_now, false);
    assert.equal(skeleton.repo_source_boundary.audit_surface.surface_kind, 'standard_domain_agent_skeleton_repo_source_layout_audit');
    assert.equal(skeleton.repo_source_boundary.audit_surface.status, 'pass');
    assert.deepEqual(skeleton.repo_source_boundary.audit_surface.expected_roots, ['agent', 'contracts', 'runtime', 'docs']);
    assert.deepEqual(
      skeleton.repo_source_boundary.audit_surface.repo_source_layout.map((entry) => [entry.boundary_id, entry.status]),
      [
        ['agent', 'present'],
        ['contracts', 'present'],
        ['runtime', 'present'],
        ['docs', 'present'],
      ],
    );
    assert.deepEqual(skeleton.repo_source_boundary.audit_surface.missing_roots, []);
    assert.deepEqual(skeleton.repo_source_boundary.audit_surface.forbidden_repo_writes, [
      'visual_truth',
      'review_export_verdict',
      'canonical_artifact_blob',
      'memory_content_body',
      'receipt_instance',
    ]);

    assert.equal(manifest.runtime_residue_retirement.surface_kind, 'runtime_residue_retirement_audit');
    assert.equal(manifest.runtime_residue_retirement.status, 'active_path_retired');
    assert.equal(manifest.runtime_residue_retirement.default_runtime_owner, 'configured_family_runtime_provider');
    assert.deepEqual(manifest.runtime_residue_retirement.retired_default_surfaces, [
      'hermes_first_default_runtime',
      'retired_gateway_protocol_boundary_public_entry',
      'repo_local_manager_default',
    ]);
    assert.deepEqual(manifest.runtime_residue_retirement.allowed_remaining_roles, [
      'explicit_proof_backend',
      'provenance',
      'history',
    ]);
    assert.deepEqual(manifest.runtime_residue_retirement.active_path_policy, {
      hermes_agent_default_runtime: false,
      retired_gateway_protocol_boundary_public_entry: false,
      repo_local_manager_default: false,
      opl_hosted_provider_path_allowed: true,
      explicit_proof_backend_allowed: true,
    });

    const controlledSoak = manifest.controlled_soak_no_regression_attempt;
    assert.equal(controlledSoak.surface_kind, 'controlled_soak_no_regression_attempt');
    assert.equal(controlledSoak.attempt_id, 'rca.controlled_soak.no_regression_attempt.v1');
    assert.equal(controlledSoak.state, 'deferred_typed_blocker');
    assert.equal(controlledSoak.controlled_soak_apply_contract_open, true);
    assert.equal(controlledSoak.deferred_blocker.blocker_kind, 'domain_owner_receipt_required');
    assert.equal(
      controlledSoak.deferred_blocker.source_contract,
      'opl_temporal_controlled_visual_stage_attempt_apply_contract',
    );
    assert.deepEqual(controlledSoak.deferred_blocker.required_return_shapes, [
      'domain_owner_receipt_ref',
      'typed_blocker',
      'no_regression_evidence_ref',
    ]);
    assert.equal(controlledSoak.no_regression_surface_refs.includes('/controlled_visual_stage_attempt'), true);
    assert.equal(controlledSoak.no_regression_surface_refs.includes('/controlled_memory_apply_proof'), true);
    assert.equal(controlledSoak.authority_boundary.can_hold_visual_truth, false);
    assert.equal(controlledSoak.authority_boundary.can_hold_review_export_verdict, false);
    assert.equal(controlledSoak.repository_boundary.repo_tracks_visual_or_export_artifacts, false);
    assert.equal(controlledSoak.repository_boundary.repo_tracks_receipt_instance, false);
  });
});

test('product-entry manifest exposes owner receipt, lifecycle apply, physical skeleton follow-through, and review helper follow-through proof', async () => {
  await withMockCodexRuntimeState(async () => {
    const manifest = await getProductEntryManifest({
      workspace_root: await prepareProductEntryWorkspace(),
    });

    const ownerReceipt = manifest.domain_owner_receipt_contract;
    assert.equal(ownerReceipt.surface_kind, 'domain_owner_receipt_contract');
    assert.equal(ownerReceipt.contract_id, 'rca.domain_owner_receipt.v1');
    assert.equal(ownerReceipt.owner, 'redcube_ai');
    assert.deepEqual(ownerReceipt.allowed_return_shapes, [
      'domain_receipt',
      'typed_blocker',
      'no_regression_evidence',
    ]);
    assert.deepEqual(ownerReceipt.required_refs, [
      'attempt_ref',
      'artifact_locator_ref',
      'memory_receipt_ref',
      'lifecycle_receipt_ref',
      'review_export_ref',
      'forbidden_write_proof_ref',
    ]);
    assert.equal(ownerReceipt.opl_consumption_policy.opl_can_store_receipt_refs, true);
    assert.equal(ownerReceipt.opl_consumption_policy.opl_can_store_visual_truth, false);
    assert.equal(ownerReceipt.opl_consumption_policy.opl_can_store_review_export_verdict, false);
    assert.equal(ownerReceipt.opl_consumption_policy.opl_can_store_canonical_artifact_blob, false);
    const noRegressionCase = ownerReceipt.receipt_cases.find((receipt) => receipt.return_shape === 'no_regression_evidence');
    assert.equal(noRegressionCase.generator_action, 'emit_no_regression_evidence');
    assert.equal(noRegressionCase.runtime_locator_ref, 'workspace-runtime-ref:no-regression-evidence:<evidence-id>');
    assert.equal(ownerReceipt.repository_boundary.repo_tracks_runtime_evidence_instances, false);
    assert.deepEqual(
      ownerReceipt.receipt_cases.map((receipt) => receipt.return_shape),
      ['domain_receipt', 'typed_blocker', 'no_regression_evidence'],
    );

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
      assert.equal(operation.receipt_ref.startsWith('rca-lifecycle-receipt:'), true);
    }
    assert.equal(lifecycleApply.repository_boundary.repo_tracks_lifecycle_receipt_instances, false);
    assert.equal(lifecycleApply.repository_boundary.repo_tracks_visual_or_export_artifacts, false);

    const transitionSpec = manifest.visual_transition_spec;
    assert.equal(transitionSpec.surface_kind, 'visual_transition_spec');
    assert.equal(transitionSpec.spec_id, 'rca.visual_transition_spec.v1');
    assert.equal(transitionSpec.status, 'contract_landed_thin_evaluator_landed_runner_owned_by_opl');
    assert.equal(transitionSpec.owner, 'redcube_ai');
    assert.deepEqual(
      transitionSpec.transition_table.map((transition) => [
        transition.transition_id,
        transition.from_stage,
        transition.to_stage,
        transition.owner_action,
      ]),
      [
        ['source_ready_to_strategy', 'source_intake', 'communication_strategy', 'continue_to_communication_strategy'],
        ['strategy_ready_to_visual_direction', 'communication_strategy', 'visual_direction', 'continue_to_visual_direction'],
        ['visual_direction_ready_to_artifact_creation', 'visual_direction', 'artifact_creation', 'create_visual_artifacts'],
        ['artifact_ready_to_review', 'artifact_creation', 'review_and_revision', 'run_review_and_repair_gate'],
        ['review_ready_to_package', 'review_and_revision', 'package_and_handoff', 'export_or_return_typed_blocker'],
      ],
    );
    assert.equal(transitionSpec.guard_contract.guard_model, 'refs_and_typed_blockers_only');
    assert.equal(transitionSpec.oracle_fixture.fixture_id, 'rca.visual_transition_oracle.fixture.v1');
    assert.equal(transitionSpec.oracle_fixture.forbidden_oracle_fields.includes('visual_verdict'), true);
    assert.equal(transitionSpec.oracle_fixture.forbidden_oracle_fields.includes('canonical_artifact_blob'), true);
    assert.equal(transitionSpec.runner_boundary.opl_can_execute_transition_spec, true);
    assert.equal(transitionSpec.runner_boundary.opl_can_declare_visual_ready, false);
    assert.equal(transitionSpec.runner_boundary.opl_can_mutate_artifacts, false);
    assert.equal(transitionSpec.evaluator_descriptor.descriptor_id, 'rca.visual_transition_evaluator.v1');
    assert.equal(transitionSpec.evaluator_descriptor.domain_action_adapter_action, 'evaluate_visual_transition');
    assert.equal(transitionSpec.family_transition_spec_descriptor.rca_implements_opl_generic_runner, false);
    assert.equal(transitionSpec.runner_boundary.rca_can_evaluate_guard_refs, true);
    assert.equal(transitionSpec.runner_boundary.rca_implements_generic_transition_runner, false);
    assert.equal(transitionSpec.repository_boundary.repo_tracks_transition_spec, true);
    assert.equal(transitionSpec.repository_boundary.repo_tracks_evaluator_contract, true);
    assert.equal(transitionSpec.repository_boundary.repo_tracks_runner_state, false);

    const followThrough = manifest.physical_skeleton_follow_through;
    assert.equal(followThrough.surface_kind, 'physical_skeleton_follow_through');
    assert.equal(followThrough.status, 'low_risk_repo_source_follow_through_landed');
    assert.deepEqual(
      followThrough.physical_roots.map((root) => [root.boundary_id, root.status]),
      [
        ['agent', 'present_with_repo_source_entrypoint'],
        ['contracts', 'present_with_runtime_program_contracts'],
        ['runtime', 'present_with_repo_source_entrypoint'],
        ['docs', 'present_with_owner_docs'],
      ],
    );
    assert.deepEqual(followThrough.forbidden_moves, [
      'workspace_runtime_artifacts',
      'receipt_instances',
      'memory_content_body',
      'png_pptx_pdf_exports',
      'review_export_verdicts',
    ]);
    assert.deepEqual(followThrough.provenance_refs, [
      'human_doc:rca_history_index',
      'human_doc:retired_route_narratives_tombstone',
      'human_doc:upstream_hermes_history_index',
      '/runtime_residue_retirement',
    ]);
    assert.deepEqual(followThrough.history_refs, [
      'human_doc:retired_route_narratives_tombstone',
      'human_doc:opl_managed_runtime_three_layer_contract_history',
    ]);
    assert.deepEqual(followThrough.tombstone_refs, [
      'human_doc:retired_route_narratives_tombstone',
    ]);

    const reviewHelper = manifest.review_helper_baseline_follow_through;
    assert.equal(reviewHelper.surface_kind, 'review_helper_baseline_follow_through');
    assert.equal(reviewHelper.helper_path, 'python/redcube_ai/native_helpers/ppt_deck/review.py');
    assert.equal(reviewHelper.current_line_budget_baseline, null);
    assert.equal(reviewHelper.current_helper_line_budget_state, 'within_budget_after_summary_and_geometry_split');
    assert.equal(reviewHelper.growth_guard, 'default_1000_line_budget');
    assert.deepEqual(reviewHelper.split_plan.module_boundaries, [
      'screenshot_capture_remaining',
      'geometry_audit_landed',
      'markdown_report_landed',
      'summary_projection_landed',
    ]);
    assert.deepEqual(reviewHelper.split_plan.landed_modules, [
      'python/redcube_ai/native_helpers/ppt_deck/review_geometry.py',
      'python/redcube_ai/native_helpers/ppt_deck/review_summary.py',
    ]);
    assert.equal(reviewHelper.status, 'summary_and_geometry_split_landed_baseline_removed');
  });
});
