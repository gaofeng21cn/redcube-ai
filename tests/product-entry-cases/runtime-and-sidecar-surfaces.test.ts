// @ts-nocheck
import {
  GATEWAY_PACKAGE_JSON,
  PRODUCT_ENTRY_PROGRAM_COMPANIONS_SPECIFIER,
  SERIAL_ENV_TEST,
  assert,
  getProductEntryManifest,
  getProductStatus,
  getProductStart,
  getProductSidecarGuardedActionMetadata,
  exportProductSidecar,
  dispatchProductSidecar,
  importGatewaySharedModule,
  invokeProductEntry,
  getProductEntrySession,
  readJson,
  test,
  withMockCodexRuntimeState,
  prepareProductEntryWorkspace,
} from '../product-domain-action-case-shared.ts';


test('product sidecar export and dispatch preserve RCA authority while allowing guarded control-plane actions', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const sidecar = await exportProductSidecar({
      workspace_root: workspaceRoot,
    });
    const sidecarGuardedActionMetadata = await getProductSidecarGuardedActionMetadata();

    assert.equal(sidecar.ok, true);
    assert.equal(sidecar.surface_kind, 'product_sidecar_export');
    assert.equal(sidecar.runtime_framework.runtime_owner, 'configured_family_runtime_provider');
    assert.equal(sidecar.runtime_framework.provider_transport_owner, 'opl_family_runtime_provider');
    assert.equal(sidecar.runtime_framework.managed_by, 'opl_runtime_manager');
    assert.equal(sidecar.runtime_framework.queue_owner, 'opl');
    assert.equal(sidecar.runtime_framework.family_scheduler_replacement.consumer, 'redcube_ai');
    assert.equal(sidecar.runtime_framework.family_scheduler_replacement.owner, 'opl');
    assert.equal(sidecar.runtime_framework.family_scheduler_replacement.rca_generic_scheduler_owner, false);
    assert.equal(sidecar.runtime_framework.family_scheduler_replacement.rca_generic_daemon_owner, false);
    assert.equal(sidecar.runtime_framework.family_scheduler_replacement.rca_generic_lifecycle_owner, false);
    assert.equal(sidecar.runtime_framework.family_scheduler_replacement.rca_generic_queue_owner, false);
    assert.equal(sidecar.runtime_framework.family_scheduler_replacement.rca_generic_attempt_ledger_owner, false);
    assert.equal(sidecar.runtime_framework.family_scheduler_replacement.rca_generic_runner_owner, false);
    assert.equal(sidecar.runtime_framework.family_scheduler_replacement.rca_generic_workbench_owner, false);
    assert.equal(
      sidecar.runtime_framework.family_scheduler_replacement.projection_scope,
      'consumer_projection_and_visual_domain_authority_refs_only',
    );
    assert.deepEqual(sidecar.runtime_framework.family_scheduler_replacement.opl_owned_generic_surfaces, [
      'family_scheduler',
      'daemon',
      'generic_lifecycle',
      'typed_queue',
      'attempt_ledger',
      'generic_runner',
      'workbench_shell',
    ]);
    assert.equal(
      sidecar.runtime_framework.family_scheduler_replacement.managed_dag_scheduler_scope,
      'visual_deliverable_internal_dag_only',
    );
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.generic_surfaces_owner, 'opl');
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_generic_scheduler_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_generic_daemon_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_generic_lifecycle_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_generic_queue_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_generic_attempt_ledger_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_generic_runner_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_generic_workbench_owner, false);
    assert.equal(sidecar.owner_boundary.provider_owns_visual_truth, false);
    assert.equal(sidecar.owner_boundary.opl_owns_review_verdict, false);
    assert.equal(sidecar.owner_boundary.opl_owns_publication_gate, false);
    assert.equal(sidecar.owner_boundary.rca_surface_role, 'visual_domain_authority_pack_plus_thin_program_surface');
    assert.equal(sidecar.owner_boundary.rca_owns_generic_scheduler, false);
    assert.equal(sidecar.owner_boundary.rca_owns_generic_daemon, false);
    assert.equal(sidecar.owner_boundary.rca_owns_generic_lifecycle, false);
    assert.equal(sidecar.owner_boundary.rca_owns_generic_queue, false);
    assert.equal(sidecar.owner_boundary.rca_owns_generic_attempt_ledger, false);
    assert.equal(sidecar.owner_boundary.rca_owns_generic_runner, false);
    assert.equal(sidecar.owner_boundary.rca_owns_generic_workbench, false);
    assert.equal(sidecar.owner_boundary.rca_owns_visual_truth, true);
    assert.equal(sidecar.owner_boundary.rca_owns_review_publication_projection, true);
    assert.equal(sidecar.mapped_surfaces.standard_domain_agent_skeleton.ref, '/standard_domain_agent_skeleton');
    assert.equal(sidecar.mapped_surfaces.standard_domain_agent_skeleton.mapping_model, 'physical_skeleton_repo_source_layout_with_manifest_projection');
    assert.equal(sidecar.mapped_surfaces.standard_domain_agent_skeleton.repo_source_layout_audit_ref, '/standard_domain_agent_skeleton/repo_source_boundary/audit_surface');
    assert.equal(sidecar.mapped_surfaces.standard_domain_agent_skeleton.repo_source_layout_audit_status, 'pass');
    assert.equal(sidecar.mapped_surfaces.artifact_locator_contract.ref, '/artifact_locator_contract');
    assert.equal(sidecar.mapped_surfaces.artifact_locator_contract.locator_model, 'workspace_runtime_artifact_root_refs_only');
    assert.equal(sidecar.mapped_surfaces.receipt_refs.ref, '/product_sidecar_receipt_refs');
    assert.equal(sidecar.mapped_surfaces.receipt_refs.forbidden_receipt_fields.includes('export_verdict'), true);
    assert.equal(sidecar.mapped_surfaces.visual_pattern_memory_writeback.descriptor_ref, '/domain_memory_descriptor_locator');
    assert.equal(
      sidecar.mapped_surfaces.visual_pattern_memory_writeback.proposal_generator_ref,
      '/domain_memory_descriptor_locator/writeback_proposal_generator',
    );
    assert.equal(
      sidecar.mapped_surfaces.visual_pattern_memory_writeback.accept_reject_command_ref,
      '/domain_memory_descriptor_locator/accept_reject_command',
    );
    assert.equal(
      sidecar.mapped_surfaces.visual_pattern_memory_writeback.operator_receipt_projection_ref,
      '/domain_memory_descriptor_locator/operator_receipt_projection',
    );
    assert.equal(sidecar.mapped_surfaces.visual_pattern_memory_writeback.opl_can_generate_memory_content, false);
    assert.equal(sidecar.mapped_surfaces.visual_pattern_memory_writeback.opl_can_accept_or_reject, false);
    assert.equal(sidecar.mapped_surfaces.visual_pattern_memory_writeback.opl_can_write_receipt_instance, false);
    assert.equal(sidecar.mapped_surfaces.visual_pattern_memory_writeback.controlled_apply_proof_ref, '/controlled_memory_apply_proof');
    assert.equal(sidecar.mapped_surfaces.visual_pattern_memory_writeback.opl_can_write_visual_truth, false);
    assert.equal(sidecar.mapped_surfaces.visual_pattern_memory_writeback.opl_can_write_artifact_blob, false);
    assert.equal(sidecar.mapped_surfaces.controlled_visual_stage_attempt.ref, '/controlled_visual_stage_attempt');
    assert.equal(sidecar.mapped_surfaces.controlled_visual_stage_attempt.opl_consumes_descriptor_refs, true);
    assert.equal(sidecar.mapped_surfaces.controlled_visual_stage_attempt.opl_consumes_quality_refs, true);
    assert.equal(sidecar.mapped_surfaces.controlled_visual_stage_attempt.direct_and_opl_share_descriptor_refs, true);
    assert.equal(sidecar.mapped_surfaces.controlled_visual_stage_attempt.direct_and_opl_share_sidecar_refs, true);
    assert.equal(sidecar.mapped_surfaces.controlled_visual_stage_attempt.direct_and_opl_share_quality_refs, true);
    assert.equal(sidecar.mapped_surfaces.controlled_visual_stage_attempt.opl_holds_visual_or_export_verdict, false);
    assert.equal(sidecar.mapped_surfaces.controlled_visual_stage_attempt.controlled_memory_apply_proof_ref, '/controlled_memory_apply_proof');
    assert.equal(sidecar.mapped_surfaces.controlled_visual_stage_attempt.apply_proof_state, 'controlled_apply_proof_landed_memory_body_external');
    assert.equal(sidecar.mapped_surfaces.family_scheduler_replacement.ref, '/family_scheduler_replacement');
    assert.equal(sidecar.mapped_surfaces.family_scheduler_replacement.owner, 'opl');
    assert.equal(sidecar.mapped_surfaces.family_scheduler_replacement.consumer, 'redcube_ai');
    assert.equal(sidecar.mapped_surfaces.family_scheduler_replacement.projection_mode, 'consumer_projection_only');
    assert.deepEqual(sidecar.mapped_surfaces.family_scheduler_replacement.rca_retained_authority, [
      'visual_truth',
      'review_export_verdict',
      'artifact_authority',
      'visual_memory_body',
      'owner_receipt',
      'typed_blocker',
      'safe_action_refs',
    ]);
    assert.equal(sidecar.source_manifest_refs.standard_domain_agent_skeleton_ref, '/standard_domain_agent_skeleton');
    assert.equal(sidecar.source_manifest_refs.artifact_locator_contract_ref, '/artifact_locator_contract');
    assert.equal(sidecar.source_manifest_refs.domain_memory_descriptor_locator_ref, '/domain_memory_descriptor_locator');
    assert.equal(sidecar.source_manifest_refs.product_sidecar_receipt_refs_ref, '/product_sidecar_receipt_refs');
    assert.equal(sidecar.source_manifest_refs.controlled_visual_stage_attempt_ref, '/controlled_visual_stage_attempt');
    assert.equal(sidecar.source_manifest_refs.controlled_memory_apply_proof_ref, '/controlled_memory_apply_proof');
    assert.equal(sidecar.runtime_residue_retirement.status, 'active_path_retired');
    assert.equal(sidecar.runtime_residue_retirement.active_path_policy.hermes_agent_default_runtime, false);
    assert.equal(sidecar.runtime_residue_retirement.active_path_policy.gateway_first_public_entry, false);
    assert.equal(sidecar.runtime_residue_retirement.active_path_policy.repo_local_manager_default, false);
    assert.equal(
      sidecar.mapped_surfaces.controlled_soak_no_regression_attempt.ref,
      '/controlled_soak_no_regression_attempt',
    );
    assert.equal(sidecar.mapped_surfaces.controlled_soak_no_regression_attempt.state, 'deferred_typed_blocker');
    assert.equal(
      sidecar.mapped_surfaces.controlled_soak_no_regression_attempt.source_contract,
      'opl_temporal_controlled_visual_stage_attempt_apply_contract',
    );
    assert.deepEqual(sidecar.mapped_surfaces.controlled_soak_no_regression_attempt.required_return_shapes, [
      'domain_owner_receipt_ref',
      'typed_blocker',
      'no_regression_evidence_ref',
    ]);
    assert.equal(sidecar.mapped_surfaces.owner_receipt_contract.ref, '/domain_owner_receipt_contract');
    assert.equal(sidecar.mapped_surfaces.owner_receipt_contract.owner, 'redcube_ai');
    assert.deepEqual(sidecar.mapped_surfaces.owner_receipt_contract.allowed_return_shapes, [
      'domain_receipt',
      'typed_blocker',
      'no_regression_evidence',
    ]);
    assert.equal(sidecar.mapped_surfaces.owner_receipt_contract.writable_by_sidecar, true);
    assert.equal(
      sidecar.mapped_surfaces.no_regression_owner_receipt_opl_consumption_proof.ref,
      '/no_regression_owner_receipt_opl_consumption_proof',
    );
    assert.equal(
      sidecar.mapped_surfaces.no_regression_owner_receipt_opl_consumption_proof.status,
      'repo_local_focused_proof_landed_production_soak_pending',
    );
    assert.equal(
      sidecar.mapped_surfaces.no_regression_owner_receipt_opl_consumption_proof.opl_consumption_policy.opl_can_store_no_regression_evidence_ref,
      true,
    );
    assert.equal(
      sidecar.mapped_surfaces.no_regression_owner_receipt_opl_consumption_proof.opl_consumption_policy.opl_can_store_domain_owner_receipt_ref,
      true,
    );
    assert.equal(
      sidecar.mapped_surfaces.no_regression_owner_receipt_opl_consumption_proof.opl_consumption_policy.opl_can_claim_production_soak_complete,
      false,
    );
    assert.equal(
      sidecar.mapped_surfaces.no_regression_owner_receipt_opl_consumption_proof.opl_consumption_policy.opl_can_store_visual_truth,
      false,
    );
    assert.equal(sidecar.mapped_surfaces.lifecycle_guarded_apply.ref, '/lifecycle_guarded_apply_proof');
    assert.deepEqual(sidecar.mapped_surfaces.lifecycle_guarded_apply.operations, [
      'cleanup',
      'restore',
      'retention',
    ]);
    assert.equal(sidecar.mapped_surfaces.lifecycle_guarded_apply.opl_can_apply_domain_artifact_mutation, false);
    assert.equal(sidecar.mapped_surfaces.lifecycle_guarded_apply.domain_receipt_required, true);
    assert.equal(sidecar.mapped_surfaces.visual_transition_spec.ref, '/visual_transition_spec');
    assert.equal(sidecar.mapped_surfaces.visual_transition_spec.spec_id, 'rca.visual_transition_spec.v1');
    assert.equal(sidecar.mapped_surfaces.visual_transition_spec.status, 'contract_landed_runner_integration_pending');
    assert.equal(sidecar.mapped_surfaces.visual_transition_spec.transition_count, 5);
    assert.equal(
      sidecar.mapped_surfaces.visual_transition_spec.oracle_fixture_id,
      'rca.visual_transition_oracle.fixture.v1',
    );
    assert.equal(sidecar.mapped_surfaces.visual_transition_spec.opl_can_execute_transition_spec, true);
    assert.equal(sidecar.mapped_surfaces.visual_transition_spec.opl_can_declare_visual_ready, false);
    assert.equal(sidecar.mapped_surfaces.visual_transition_spec.opl_can_declare_exportable, false);
    assert.equal(
      sidecar.mapped_surfaces.visual_pattern_memory_writeback.runtime_receipt_instances_ref,
      '/controlled_memory_apply_proof/runtime_receipt_instances',
    );
    assert.equal(
      sidecar.source_manifest_refs.controlled_soak_no_regression_attempt_ref,
      '/controlled_soak_no_regression_attempt',
    );
    assert.equal(sidecar.source_manifest_refs.domain_owner_receipt_contract_ref, '/domain_owner_receipt_contract');
    assert.equal(
      sidecar.source_manifest_refs.no_regression_owner_receipt_opl_consumption_proof_ref,
      '/no_regression_owner_receipt_opl_consumption_proof',
    );
    assert.equal(sidecar.source_manifest_refs.lifecycle_guarded_apply_proof_ref, '/lifecycle_guarded_apply_proof');
    assert.equal(sidecar.source_manifest_refs.visual_transition_spec_ref, '/visual_transition_spec');
    assert.equal(sidecar.source_manifest_refs.family_scheduler_replacement_ref, '/family_scheduler_replacement');
    assert.deepEqual(
      sidecar.guarded_actions.map((entry) => entry.action),
      sidecarGuardedActionMetadata.guardedActionIds,
    );
    assert.deepEqual(sidecar.guarded_actions, sidecarGuardedActionMetadata.guardedActions);
    assert.deepEqual(sidecar.blocked_actions, sidecarGuardedActionMetadata.blockedActions);

    const receipt = await dispatchProductSidecar({
      task: {
        action: 'notification_receipt',
        notification_id: 'notice-1',
      },
    });
    assert.equal(receipt.ok, true);
    assert.equal(receipt.surface_kind, 'product_sidecar_dispatch');
    assert.equal(receipt.result_surface.surface_kind, 'notification_receipt');
    assert.equal(receipt.sidecar_policy.writes_visual_truth, false);
    assert.equal(receipt.sidecar_policy.writes_review_verdict, false);
    assert.equal(receipt.sidecar_policy.writes_publication_gate, false);

    const evidence = await dispatchProductSidecar({
      task: {
        action: 'emit_no_regression_evidence',
        workspace_root: workspaceRoot,
        evidence_id: 'unit-no-regression',
      },
    });
    assert.equal(evidence.ok, true);
    assert.equal(evidence.result_surface.surface_kind, 'no_regression_evidence');
    assert.equal(evidence.result_surface.evidence_ref, 'rca-no-regression:visual-stage:unit-no-regression');
    assert.equal(
      evidence.result_surface.runtime_locator_ref,
      'workspace-runtime-ref:no-regression-evidence:unit-no-regression',
    );
    assert.equal(evidence.result_surface.coverage.long_visual_soak_claimed, false);
    assert.equal(evidence.result_surface.coverage.visual_artifact_blob_written, false);
    assert.equal(evidence.result_surface.coverage.review_export_verdict_written, false);
    assert.equal(evidence.result_surface.coverage.memory_content_body_written, false);
    assert.equal(evidence.result_surface.repository_boundary.repo_tracks_runtime_evidence_instance, false);
    assert.equal(evidence.result_surface.repository_boundary.repo_tracks_visual_or_export_artifacts, false);
    assert.equal(evidence.result_surface.authority_boundary.opl_can_store_no_regression_evidence_ref, true);
    assert.equal(evidence.result_surface.authority_boundary.opl_can_store_visual_truth, false);
    const evidenceFile = readJson(evidence.result_surface.evidence_file);
    assert.equal(evidenceFile.surface_kind, 'no_regression_evidence');
    assert.equal(evidenceFile.evidence_ref, evidence.result_surface.evidence_ref);
    assert.equal(evidenceFile.source_manifest_refs.runtime_residue_retirement_status, 'active_path_retired');
    assert.equal(evidenceFile.source_manifest_refs.skeleton_repo_source_layout_audit_status, 'pass');
    assert.equal(evidenceFile.coverage.verifies_legacy_default_active_path_retired, true);
    assert.equal(evidenceFile.coverage.long_visual_soak_claimed, false);

    const missingReceiptRefs = await dispatchProductSidecar({
      task: {
        action: 'emit_domain_owner_receipt',
        workspace_root: workspaceRoot,
        receipt_id: 'missing-domain-refs',
      },
    });
    assert.equal(missingReceiptRefs.result_surface.surface_kind, 'typed_blocker');
    assert.equal(missingReceiptRefs.result_surface.return_shape, 'typed_blocker');
    assert.equal(missingReceiptRefs.result_surface.blocker_kind, 'domain_owner_receipt_missing_required_refs');
    assert.equal(missingReceiptRefs.result_surface.owner, 'redcube_ai');
    assert.equal(missingReceiptRefs.result_surface.visual_ready_claimed, false);

    const domainReceipt = await dispatchProductSidecar({
      task: {
        action: 'emit_domain_owner_receipt',
        workspace_root: workspaceRoot,
        receipt_id: 'unit-domain-receipt',
        attempt_ref: 'workspace-runtime-ref:attempt:run-a',
        artifact_locator_ref: '/artifact_locator_contract',
        memory_receipt_ref: 'rca-memory-receipt:visual-pattern:accepted-a',
        lifecycle_receipt_ref: 'rca-lifecycle-receipt:retention:unit-lifecycle',
        review_export_ref: 'workspace-runtime-ref:review-export:run-a',
        forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
        artifact_refs: [
          {
            artifact_kind: 'png_page',
            ref_kind: 'workspace_runtime_artifact',
            artifact_ref: 'workspace-runtime-ref:artifact:slide-1',
            sha256: 'sha256-slide-1',
          },
        ],
        repair_target_refs: ['workspace-runtime-ref:repair:slide-1'],
        handoff_packet_ref: 'workspace-runtime-ref:handoff:run-a',
        residual_risk_refs: ['workspace-runtime-ref:risk:manual-review'],
      },
    });
    assert.equal(domainReceipt.result_surface.surface_kind, 'domain_owner_receipt');
    assert.equal(domainReceipt.result_surface.return_shape, 'domain_receipt');
    assert.equal(domainReceipt.result_surface.receipt_ref, 'rca-owner-receipt:visual-stage:unit-domain-receipt');
    assert.equal(
      domainReceipt.result_surface.runtime_locator_ref,
      'workspace-runtime-ref:domain-owner-receipt:unit-domain-receipt',
    );
    assert.equal(domainReceipt.result_surface.coverage.visual_ready_claimed, false);
    assert.equal(domainReceipt.result_surface.coverage.opl_completion_promoted_to_visual_ready, false);
    assert.equal(domainReceipt.result_surface.coverage.exportable_claimed, false);
    assert.equal(domainReceipt.result_surface.coverage.handoffable_claimed, false);
    assert.equal(domainReceipt.result_surface.coverage.visual_artifact_blob_written, false);
    assert.equal(domainReceipt.result_surface.coverage.review_export_verdict_written, false);
    assert.equal(domainReceipt.result_surface.repository_boundary.repo_tracks_live_receipt_instances, false);
    assert.equal(domainReceipt.result_surface.authority_boundary.opl_can_store_receipt_ref, true);
    assert.equal(domainReceipt.result_surface.authority_boundary.opl_can_store_visual_truth, false);
    assert.equal(domainReceipt.result_surface.authority_boundary.opl_can_mutate_domain_artifacts, false);
    const domainReceiptFile = readJson(domainReceipt.result_surface.receipt_file);
    assert.equal(domainReceiptFile.surface_kind, 'domain_owner_receipt');
    assert.equal(domainReceiptFile.required_refs.attempt_ref, 'workspace-runtime-ref:attempt:run-a');
    assert.equal(domainReceiptFile.artifact_delta.artifact_refs.length, 1);
    assert.equal(domainReceiptFile.coverage.visual_ready_claimed, false);

    const memoryReceipt = await dispatchProductSidecar({
      task: {
        action: 'apply_visual_memory_writeback',
        workspace_root: workspaceRoot,
        proposal_id: 'proposal-a',
        decision: 'accepted',
        decision_owner: 'redcube_ai',
        source_review_ref: 'workspace-runtime-ref:review:run-a',
        candidate_memory_ref: 'rca-memory:visual-pattern:memory-a',
        memory_locator_ref: 'rca-memory:visual-pattern:memory-a',
        memory_content_body_ref: 'rca-memory-content-ref:visual-pattern:memory-a',
      },
    });
    assert.equal(memoryReceipt.result_surface.surface_kind, 'visual_pattern_memory_writeback_receipt');
    assert.equal(memoryReceipt.result_surface.writeback_status, 'accepted');
    assert.equal(memoryReceipt.result_surface.receipt_ref, 'rca-memory-receipt:visual-pattern:proposal-a-accepted');
    assert.equal(memoryReceipt.result_surface.memory_content_body, undefined);
    assert.equal(memoryReceipt.result_surface.review_verdict, undefined);
    const memoryReceiptFile = readJson(memoryReceipt.result_surface.receipt_file);
    assert.equal(memoryReceiptFile.writeback_status, 'accepted');
    assert.equal(memoryReceiptFile.memory_content_body, undefined);
    assert.equal(memoryReceiptFile.repository_boundary.repo_tracks_receipt_instance, false);

    const blockedMemory = await dispatchProductSidecar({
      task: {
        action: 'apply_visual_memory_writeback',
        workspace_root: workspaceRoot,
        proposal_id: 'proposal-blocked',
        decision: 'accepted',
        decision_owner: 'opl',
        source_review_ref: 'workspace-runtime-ref:review:run-a',
        candidate_memory_ref: 'rca-memory:visual-pattern:memory-a',
      },
    });
    assert.equal(blockedMemory.result_surface.surface_kind, 'typed_blocker');
    assert.equal(blockedMemory.result_surface.blocker_kind, 'visual_memory_writeback_owner_required');

    const lifecycleReceipt = await dispatchProductSidecar({
      task: {
        action: 'apply_visual_workspace_lifecycle',
        workspace_root: workspaceRoot,
        operation: 'retention',
        receipt_id: 'unit-lifecycle',
        domain_receipt_ref: 'rca-owner-receipt:visual-stage:unit-domain-receipt',
        artifact_locator_ref: '/artifact_locator_contract',
        artifact_refs: ['workspace-runtime-ref:artifact:slide-1'],
      },
    });
    assert.equal(lifecycleReceipt.result_surface.surface_kind, 'visual_workspace_lifecycle_receipt');
    assert.equal(lifecycleReceipt.result_surface.operation, 'retention');
    assert.equal(lifecycleReceipt.result_surface.receipt_ref, 'rca-lifecycle-receipt:retention:unit-lifecycle');
    assert.equal(lifecycleReceipt.result_surface.artifact_mutation_applied, false);
    assert.equal(lifecycleReceipt.result_surface.review_export_verdict_written, false);
    const lifecycleReceiptFile = readJson(lifecycleReceipt.result_surface.receipt_file);
    assert.equal(lifecycleReceiptFile.operation, 'retention');
    assert.equal(lifecycleReceiptFile.artifact_mutation_applied, false);

    const blockedLifecycle = await dispatchProductSidecar({
      task: {
        action: 'apply_visual_workspace_lifecycle',
        workspace_root: workspaceRoot,
        operation: 'cleanup',
        receipt_id: 'blocked-cleanup',
        requested_artifact_mutation: true,
      },
    });
    assert.equal(blockedLifecycle.result_surface.surface_kind, 'typed_blocker');
    assert.equal(blockedLifecycle.result_surface.blocker_kind, 'lifecycle_domain_receipt_required');

    await assert.rejects(
      () => dispatchProductSidecar({
        task: {
          action: 'write_publication_gate',
          workspace_root: workspaceRoot,
        },
      }),
      /product sidecar action 不允许/,
    );
  });
});

test('default product-entry path stays on codex_cli without requiring Hermes API server', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    assert.equal(Boolean(process.env.REDCUBE_HERMES_AGENT_API_BASE_URL), false);
    assert.equal(Boolean(process.env.REDCUBE_HERMES_AGENT_LOOP_BRIDGE_COMMAND), false);

    const manifest = await getProductEntryManifest({
      workspace_root: workspaceRoot,
    });
    assert.equal(manifest.runtime.runtime_owner, 'codex_cli');
    assert.equal(manifest.runtime_inventory.executor_owner, 'codex_cli');
    assert.equal(manifest.managed_runtime_contract.runtime_owner, 'codex_cli');
    assert.equal(manifest.managed_runtime_contract.executor_owner, 'codex_cli');
    assert.equal(manifest.route_equivalence.downstream_runtime_truth.runtime_owner, 'codex_cli');
    assert.equal(manifest.route_equivalence.downstream_runtime_truth.executor_owner, 'codex_cli');
    assert.equal(manifest.runtime_inventory.substrate, 'codex_cli_runtime');
    assert.equal(
      manifest.skill_catalog.skills[0].domain_projection.runtime_continuity.runtime_owner,
      'codex_cli',
    );

    const status = await getProductStatus({
      workspace_root: workspaceRoot,
    });
    assert.equal(status.runtime.runtime_owner, 'codex_cli');
    assert.equal(status.runtime_loop_closure.loop_owner.runtime_owner, 'codex_cli');

    const start = await getProductStart({
      workspace_root: workspaceRoot,
    });
    assert.equal(start.runtime_loop_closure.loop_owner.runtime_owner, 'codex_cli');

    const invoked = await invokeProductEntry({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      entry_session_contract: {
        entry_session_id: 'session-codex-default',
      },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-codex-default',
        profile_id: 'lecture_student',
        title: 'Codex default product entry proof',
        goal: '验证未配置 Hermes 时默认 product-entry 只走 Codex CLI',
        user_intent: '先给我主线故事',
        stop_after_stage: 'storyline',
      },
    });
    assert.equal(invoked.entry_session.runtime_owner, 'codex_cli');
    assert.equal(invoked.session_continuity.runtime_owner, 'codex_cli');
    assert.equal(invoked.runtime_loop_closure.loop_owner.runtime_owner, 'codex_cli');
    assert.equal(invoked.domain_entry_surface.runtime_session_contract.runtime_owner, 'codex_cli');
    assert.equal(invoked.domain_entry_surface.runtime_session_contract.adapter_surface, '@redcube/codex-cli-client');
    assert.equal(invoked.domain_entry_surface.result_surface.managed_run.adapter, 'codex_cli');
    assert.equal(invoked.domain_entry_surface.result_surface.managed_run.runtime_bridge.owner, 'codex_cli');

    const session = await getProductEntrySession({
      entry_session_id: 'session-codex-default',
    });
    assert.equal(session.entry_session.runtime_owner, 'codex_cli');
    assert.equal(session.session_continuity.runtime_owner, 'codex_cli');
    assert.equal(session.runtime_loop_closure.loop_owner.runtime_owner, 'codex_cli');
  });
});

test('product status exposes overlay stage sequence for ppt_deck callers', async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const status = await getProductStatus({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
    });

    assert.deepEqual(
      status.overlay_stage_sequences.ppt_deck.protected_stage_sequence,
      [
        'storyline',
        'detailed_outline',
        'slide_blueprint',
        'visual_direction',
        'author_image_pages',
        'visual_director_review',
        'screenshot_review',
        'repair_image_pages',
        'export_pptx',
      ],
    );
    assert.equal(status.overlay_stage_sequences.ppt_deck.default_visual_route, 'author_image_pages');
    assert.equal(status.overlay_stage_sequences.ppt_deck.route_selection_policy.style_reference_dir_input, 'delivery_request.style_reference_dir');
    assert.equal(status.ppt_deck_visual_route_truth.default_visual_route, 'author_image_pages');
    assert.equal(status.overlay_stage_sequences.ppt_deck.route_gate_policy, 'fail_closed_against_overlay_stage_sequence');
    assert.deepEqual(
      status.overlay_stage_sequences.xiaohongshu.protected_stage_sequence,
      [
        'research',
        'storyline',
        'single_note_plan',
        'visual_direction',
        'author_image_pages',
        'visual_director_review',
        'screenshot_review',
        'repair_image_pages',
        'publish_copy',
        'export_bundle',
      ],
    );
    assert.equal(status.overlay_stage_sequences.xiaohongshu.default_visual_route, 'author_image_pages');
    assert.equal(status.overlay_stage_sequences.xiaohongshu.default_visual_policy, 'image_first');
    assert.equal(status.overlay_stage_sequences.xiaohongshu.route_selection_policy.style_reference_dir_input, 'delivery_request.style_reference_dir');
  });
});

test('invokeProductEntry rejects route and stop_after_stage outside hydrated stage sequence', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    await assert.rejects(
      () => invokeProductEntry({
        workspace_locator: {
          workspace_root: workspaceRoot,
        },
        entry_session_contract: {
          entry_session_id: 'session-invalid-stage',
        },
        delivery_request: {
          deliverable_family: 'ppt_deck',
          topic_id: 'topic-invalid-stage',
          deliverable_id: 'deck-invalid-stage',
          profile_id: 'lecture_student',
          title: 'Invalid stage proof',
          goal: '校验 product-entry fail closed',
          stop_after_stage: 'native_pptx',
        },
      }),
      /delivery_request\.stop_after_stage=native_pptx is not allowed by the hydrated overlay stage_sequence/,
    );
  });
});

test('getProductStart exposes the same direct-entry start companion as the manifest', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const start = await getProductStart({
      workspace_root: workspaceRoot,
    });

    assert.equal(start.ok, true);
    assert.equal(start.surface_kind, 'product_entry_start');
    assert.equal(start.recommended_mode_id, 'open_status');
    assert.deepEqual(
      start.modes.map((mode) => mode.mode_id),
      ['open_status', 'start_direct_session', 'opl_hosted_handoff', 'resume_session'],
    );
    assert.equal(
      start.modes[0].command,
      `redcube product status --workspace-root ${workspaceRoot}`,
    );
    assert.equal(start.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
    assert.equal(start.runtime_loop_closure.source_linkage.current_source, 'start');
    assert.equal(start.runtime_loop_closure.source_linkage.entry_mode, 'start_projection');
    assert.equal(start.resume_surface.surface_kind, 'product_entry_session');
    assert.deepEqual(start.human_gate_ids, ['redcube_operator_review_gate']);
  });
});

test('product preflight consumes OPL shared program builders from the pinned owner commit', async () => {
  const gatewayPackage = readJson(GATEWAY_PACKAGE_JSON);
  assert.match(
    gatewayPackage.dependencies['opl-framework-shared'],
    /^git\+https:\/\/github\.com\/gaofeng21cn\/one-person-lab\.git#[0-9a-f]{40}$/,
  );
  const companions = await importGatewaySharedModule(PRODUCT_ENTRY_PROGRAM_COMPANIONS_SPECIFIER);
  assert.equal(typeof companions.buildProductEntryPreflight, 'function');
  assert.equal(typeof companions.buildProgramCheck, 'function');
});
