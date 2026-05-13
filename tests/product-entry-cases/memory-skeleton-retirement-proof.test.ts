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
    assert.equal(manifest.runtime_residue_retirement.default_runtime_owner, 'codex_cli');
    assert.deepEqual(manifest.runtime_residue_retirement.retired_default_surfaces, [
      'hermes_first_default_runtime',
      'gateway_first_public_entry',
      'repo_local_manager_default',
    ]);
    assert.deepEqual(manifest.runtime_residue_retirement.allowed_remaining_roles, [
      'explicit_proof_backend',
      'provenance',
      'history',
    ]);
    assert.deepEqual(manifest.runtime_residue_retirement.active_path_policy, {
      hermes_agent_default_runtime: false,
      gateway_first_public_entry: false,
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

    const reviewHelper = manifest.review_helper_baseline_follow_through;
    assert.equal(reviewHelper.surface_kind, 'review_helper_baseline_follow_through');
    assert.equal(reviewHelper.helper_path, 'python/redcube_ai/native_helpers/ppt_deck/review.py');
    assert.equal(reviewHelper.current_line_budget_baseline, 1154);
    assert.equal(reviewHelper.growth_guard, 'fail_closed_on_growth');
    assert.deepEqual(reviewHelper.split_plan.module_boundaries, [
      'screenshot_capture',
      'geometry_audit',
      'markdown_report',
      'summary_projection',
    ]);
    assert.equal(reviewHelper.status, 'baseline_guarded_split_plan_landed');
  });
});
