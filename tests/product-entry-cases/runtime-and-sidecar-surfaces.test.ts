// @ts-nocheck
import { readFileSync, writeFileSync } from 'node:fs';

import { SERIAL_ENV_TEST, assert, getProductEntryManifest, getProductSidecarGuardedActionMetadata, exportProductSidecar, dispatchProductSidecar, readJson, test, withMockCodexRuntimeState, prepareProductEntryWorkspace } from '../product-domain-action-case-shared.ts';


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
      sidecar.runtime_framework.family_scheduler_replacement.visual_stage_descriptor_scope,
      'opl_stage_execution_plan_route_handler_refs_only',
    );
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.generic_surfaces_owner, 'opl');
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_functional_harness_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_generic_runtime_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_generic_scheduler_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_generic_daemon_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_generic_lifecycle_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_generic_queue_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_stage_attempt_orchestrator_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_generic_attempt_ledger_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_typed_closeout_transport_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_generic_runner_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_generic_transition_runner_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_generic_workbench_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_memory_transport_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_memory_refs_only_writeback_chain_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_artifact_lifecycle_owner, false);
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_review_repair_transport_owner, false);
    assert.equal(
      sidecar.runtime_framework.rca_thin_surface_policy.rca_is_restart_dead_letter_repair_human_gate_state_chain_owner,
      false,
    );
    assert.equal(sidecar.runtime_framework.rca_thin_surface_policy.rca_is_native_helper_generic_envelope_owner, false);
    assert.equal(
      sidecar.runtime_framework.rca_thin_surface_policy.opl_generic_primitive_consumption.status,
      'functional_consumer_follow_through_landed',
    );
    assert.equal(
      sidecar.runtime_framework.rca_thin_surface_policy.opl_generic_primitive_consumption.live_soak_claimed,
      false,
    );
    assert.equal(
      sidecar.runtime_framework.rca_thin_surface_policy.opl_stability_read_model_consumption.status,
      'refs_only_consumer_projection_landed',
    );
    assert.equal(
      sidecar.runtime_framework.rca_thin_surface_policy.opl_stability_read_model_consumption.observability_only,
      true,
    );
    assert.equal(
      sidecar.runtime_framework.rca_thin_surface_policy.opl_stability_read_model_consumption.authority_boundary.opl_can_execute_rca_domain_action,
      false,
    );
    assert.equal(
      sidecar.runtime_framework.rca_thin_surface_policy.opl_stability_read_model_consumption.authority_boundary.opl_can_authorize_visual_ready,
      false,
    );
    assert.equal(
      sidecar.runtime_framework.rca_thin_surface_policy.privatized_functional_module_audit.status,
      'machine_audit_projection_landed',
    );
    assert.equal(
      sidecar.runtime_framework.rca_thin_surface_policy.privatized_functional_module_audit.authority_boundary.rca_generic_scheduler_owner,
      false,
    );
    assert.equal(
      sidecar.runtime_framework.rca_thin_surface_policy.privatized_functional_module_audit.authority_boundary.opl_can_claim_production_soak_complete,
      false,
    );
    assert.equal(
      sidecar.runtime_framework.rca_thin_surface_policy.opl_generic_primitive_consumption.functional_harness_consumer_coverage.pass_claim_scope,
      'consumer_contract_coverage_only',
    );
    assert.equal(
      sidecar.runtime_framework.rca_thin_surface_policy.opl_generic_primitive_consumption.functional_harness_consumer_coverage.opl_harness_pass_is_artifact_producing_owner_receipt,
      false,
    );
    assert.equal(sidecar.owner_boundary.provider_owns_visual_truth, false);
    assert.equal(sidecar.owner_boundary.opl_owns_review_verdict, false);
    assert.equal(sidecar.owner_boundary.opl_owns_publication_gate, false);
    assert.equal(sidecar.owner_boundary.rca_surface_role, 'visual_domain_authority_pack_plus_thin_program_surface');
    assert.equal(sidecar.owner_boundary.rca_owns_functional_harness, false);
    assert.equal(sidecar.owner_boundary.rca_owns_generic_runtime, false);
    assert.equal(sidecar.owner_boundary.rca_owns_generic_scheduler, false);
    assert.equal(sidecar.owner_boundary.rca_owns_generic_daemon, false);
    assert.equal(sidecar.owner_boundary.rca_owns_generic_lifecycle, false);
    assert.equal(sidecar.owner_boundary.rca_owns_generic_queue, false);
    assert.equal(sidecar.owner_boundary.rca_owns_stage_attempt_orchestrator, false);
    assert.equal(sidecar.owner_boundary.rca_owns_generic_attempt_ledger, false);
    assert.equal(sidecar.owner_boundary.rca_owns_typed_closeout_transport, false);
    assert.equal(sidecar.owner_boundary.rca_owns_generic_runner, false);
    assert.equal(sidecar.owner_boundary.rca_owns_generic_transition_runner, false);
    assert.equal(sidecar.owner_boundary.rca_owns_generic_workbench, false);
    assert.equal(sidecar.owner_boundary.rca_owns_memory_transport, false);
    assert.equal(sidecar.owner_boundary.rca_owns_memory_refs_only_writeback_chain, false);
    assert.equal(sidecar.owner_boundary.rca_owns_artifact_lifecycle, false);
    assert.equal(sidecar.owner_boundary.rca_owns_review_repair_transport, false);
    assert.equal(sidecar.owner_boundary.rca_owns_restart_dead_letter_repair_human_gate_state_chain, false);
    assert.equal(sidecar.owner_boundary.rca_owns_native_helper_generic_envelope, false);
    assert.equal(sidecar.owner_boundary.rca_owns_visual_truth, true);
    assert.equal(sidecar.owner_boundary.rca_owns_review_publication_projection, true);
    assert.equal(sidecar.owner_boundary.rca_owns_visual_memory_body, true);
    assert.equal(sidecar.owner_boundary.rca_owns_owner_receipt, true);
    assert.equal(sidecar.owner_boundary.rca_owns_native_helper_implementation, true);
    assert.equal(sidecar.mapped_surfaces.standard_domain_agent_skeleton.ref, '/standard_domain_agent_skeleton');
    assert.equal(sidecar.mapped_surfaces.standard_domain_agent_skeleton.mapping_model, 'physical_skeleton_repo_source_layout_with_manifest_projection');
    assert.equal(sidecar.mapped_surfaces.standard_domain_agent_skeleton.repo_source_layout_audit_ref, '/standard_domain_agent_skeleton/repo_source_boundary/audit_surface');
    assert.equal(sidecar.mapped_surfaces.standard_domain_agent_skeleton.repo_source_layout_audit_status, 'pass');
    assert.equal(sidecar.mapped_surfaces.artifact_locator_contract.ref, '/artifact_locator_contract');
    assert.equal(sidecar.mapped_surfaces.artifact_locator_contract.locator_model, 'workspace_runtime_artifact_root_refs_only');
    assert.equal(sidecar.mapped_surfaces.artifact_locator_contract.lifecycle_transport_owner, 'opl');
    assert.equal(sidecar.mapped_surfaces.receipt_refs.ref, '/product_sidecar_receipt_refs');
    assert.equal(sidecar.mapped_surfaces.receipt_refs.forbidden_receipt_fields.includes('export_verdict'), true);
    assert.equal(sidecar.mapped_surfaces.visual_pattern_memory_writeback.descriptor_ref, '/domain_memory_descriptor_locator');
    assert.equal(sidecar.mapped_surfaces.visual_pattern_memory_writeback.transport_owner, 'opl');
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
    assert.deepEqual(sidecar.mapped_surfaces.visual_pattern_memory_writeback.rca_retained_authority, ['visual_memory_body']);
    assert.equal(sidecar.mapped_surfaces.native_helper_implementation.ref, '/native_ppt_operator_ux');
    assert.equal(sidecar.mapped_surfaces.native_helper_implementation.generic_envelope_owner, 'opl');
    assert.equal(sidecar.mapped_surfaces.native_helper_implementation.implementation_owner, 'redcube_ai');
    assert.equal(sidecar.mapped_surfaces.native_helper_implementation.package_module_only, true);
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
      'native_helper_implementation',
      'typed_blocker',
      'safe_action_refs',
    ]);
    assert.equal(sidecar.mapped_surfaces.opl_generic_primitive_consumption.ref, '/opl_generic_primitive_consumption');
    assert.equal(sidecar.mapped_surfaces.opl_generic_primitive_consumption.owner, 'opl');
    assert.equal(sidecar.mapped_surfaces.opl_generic_primitive_consumption.status, 'functional_consumer_follow_through_landed');
    assert.deepEqual(
      sidecar.mapped_surfaces.opl_generic_primitive_consumption.rca_does_not_own,
      [
        'standard_domain_agent_scaffold',
        'functional_harness',
        'generic_runtime',
        'generic_scheduler',
        'daemon',
        'typed_queue',
        'stage_attempt_orchestrator',
        'attempt_ledger',
        'typed_closeout_transport',
        'generic_runner',
        'generic_transition_runner',
        'workbench_shell',
        'memory_transport',
        'memory_refs_only_writeback_chain',
        'artifact_lifecycle',
        'review_repair_transport',
        'restart_dead_letter_repair_human_gate_state_chain',
        'native_helper_generic_envelope',
        'generated_cli_mcp_product_entry_sidecar_status_session_workbench_wrapper',
      ],
    );
    assert.equal(
      sidecar.mapped_surfaces.opl_stability_read_model_consumption.ref,
      '/opl_stability_read_model_consumption',
    );
    assert.equal(sidecar.mapped_surfaces.opl_stability_read_model_consumption.owner, 'opl');
    assert.equal(sidecar.mapped_surfaces.opl_stability_read_model_consumption.consumer, 'redcube_ai');
    assert.deepEqual(
      sidecar.mapped_surfaces.opl_stability_read_model_consumption.consumed_read_model_surfaces.map((entry) => entry.surface),
      [
        'family_conflict_envelope',
        'control_loop_summary',
        'usage_projection',
        'resource_pressure',
        'observability_export',
        'external_stability_policy',
      ],
    );
    assert.equal(
      sidecar.mapped_surfaces.opl_stability_read_model_consumption.authority_boundary.generic_fallback_can_mark_success,
      false,
    );
    assert.equal(
      sidecar.mapped_surfaces.opl_stability_read_model_consumption.authority_boundary.event_bus_can_be_truth_source,
      false,
    );
    assert.equal(sidecar.mapped_surfaces.privatized_functional_module_audit.ref, '/privatized_functional_module_audit');
    assert.deepEqual(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.map((entry) => entry.module_id),
      [
        'product_entry_session_store',
        'workspace_source_intake',
        'memory_writeback_receipt_transport',
        'artifact_export_lifecycle',
        'review_repair_transport',
        'native_helper_envelope',
        'operator_projection_shell',
        'generic_cli_mcp_wrappers',
        'codex_executor_adapter',
        'observability_stability_read_model',
        'visual_pack_compiler_handoff',
        'visual_authority_functions',
      ],
    );
    assert.deepEqual(
      sidecar.mapped_surfaces.privatized_functional_module_audit.retire_tombstone_candidates.map((entry) => entry.surface_id),
      [
        'product_sidecar_dispatch.supervise_managed_run',
        'product_sidecar_dispatch.product_entry_continuation',
      ],
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.replacement_expectation_mode,
      'opl_replacement_expectation_or_refs_only_projection',
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.physical_deletion_guard.current_safe_tombstone_candidate_count,
      0,
    );
    assert.deepEqual(sidecar.mapped_surfaces.privatized_functional_module_audit.classification_values, [
      'opl_hosted_surface',
      'opl_generated_surface',
      'refs_only_adapter',
      'declarative_pack',
      'minimal_authority_function',
      'retire_tombstone',
    ]);
    assert.deepEqual(
      sidecar.mapped_surfaces.privatized_functional_module_audit.functional_structure_gap_closure,
      {
        status: 'functional_structure_gaps_closed_evidence_gates_open',
        closed_at: '2026-05-17',
        closure_scope: 'rca_functional_structure_gap_classification',
        functional_structure_gap_count: 0,
        completed_functional_structure_gap_count: 8,
        completed_functional_structure_gap_ids: ['opl_generated_surface_production_consumption', 'repo_local_wrapper_active_caller_migration', 'focused_hosted_attempt_real_path_cutover', 'artifact_gallery_handoff_shell', 'review_repair_transport', 'opl_app_operator_drilldown', 'workspace_source_lifecycle_receipt_shell', 'legacy_physical_cleanup'],
        unclassified_private_generic_residue_count: 0,
        long_term_rca_generic_owner_claim_count: 0,
        remaining_gap_class: 'none',
        remaining_functional_structure_gap_ids: [],
        remaining_functional_structure_gaps: [],
        evidence_gap_class: 'production_live_soak_evidence_only',
        remaining_evidence_gate_ids: [
          'real_artifact_producing_domain_owner_receipt',
          'opl_hosted_controlled_visual_stage_long_soak',
          'real_memory_lifecycle_receipt_instances',
          'cross_family_repeated_no_regression_evidence',
        ],
        closure_basis_refs: [
          '/family_scheduler_replacement',
          '/opl_generic_primitive_consumption',
          '/opl_stability_read_model_consumption',
          '/opl_generated_interface_consumption',
          '/visual_pack_compiler_handoff',
          '/operator_evidence_readiness_projection',
          '/opl_substrate_adapter_export',
        ],
        allowed_remaining_module_classes: [
          'opl_hosted_surface',
          'opl_generated_surface',
          'refs_only_adapter',
          'declarative_pack',
          'minimal_authority_function',
        ],
      },
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.visual_pack_compiler_handoff_ref,
      '/visual_pack_compiler_handoff',
    );
    assert.deepEqual(
      sidecar.mapped_surfaces.privatized_functional_module_audit.physical_deletion_guard.deleted_or_thinned_default_surfaces,
      [
        'product_sidecar_dispatch.supervise_managed_run',
        'product_sidecar_dispatch.product_entry_continuation',
        'public_cli_mcp_gateway.get_managed_run',
        'public_cli_mcp_gateway.supervise_managed_run',
        'repo_local_visual_runtime.legacy_deliverable_runner_deleted',
        'repo_local_visual_runtime.legacy_run_store_deleted',
        'repo_local_visual_runtime.legacy_dag_runtime_deleted',
      ],
    );
    assert.ok(sidecar.mapped_surfaces.privatized_functional_module_audit.must_not_retire.includes('visual_review_export_gate'));
    assert.ok(sidecar.mapped_surfaces.privatized_functional_module_audit.must_not_retire.includes('native_helper_implementation'));
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.must_not_retire.includes('sidecar_status_action_metadata_projection'),
      false,
    );
    assert.deepEqual(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'codex_executor_adapter').codePaths,
      [
        'packages/redcube-runtime/src/executors.ts',
        'packages/redcube-gateway/src/actions/run-deliverable-route.ts',
        'packages/redcube-gateway/src/actions/domain-entry-contract.ts',
        'tests/rca-executor-backend-contract.test.ts',
      ],
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'product_entry_session_store').opl_replacement_expectation.replacement_surface,
      'opl_app_session_shell_and_workbench',
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'product_entry_session_store').status,
      'opl_generated_workbench_session_surface_consumed',
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'product_entry_session_store').activeCallerStatus,
      'opl_generated_session_shell_domain_refs',
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'product_entry_session_store').migration_class,
      'opl_generated_surface',
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'artifact_export_lifecycle').cannotAbsorbReason,
      'OPL may index artifact refs but cannot publish, mutate or declare RCA visual artifacts exportable.',
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'artifact_export_lifecycle').status,
      'opl_artifact_lifecycle_shell_consumed_refs_only',
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'artifact_export_lifecycle').activeCallerStatus,
      'refs_only_artifact_authority_adapter_consuming_opl_lifecycle_shell',
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'artifact_export_lifecycle').opl_replacement_expectation.replacement_surface,
      'opl_artifact_lifecycle_gallery_handoff_shell',
    );
    const closedFunctionalModuleIds = [
      'product_entry_session_store',
      'artifact_export_lifecycle',
    ];
    for (const moduleId of closedFunctionalModuleIds) {
      const entry = sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((moduleEntry) => moduleEntry.module_id === moduleId);
      assert.ok(entry, moduleId);
      assert.doesNotMatch(
        [entry.status, entry.activeCallerStatus, entry.migrationAction, entry.rca_scope, entry.audit_readout].join(' '),
        /active_private|pending|should_move|handoff_required|lifecycle_candidate|migration_candidate|until_opl_generic_runner_exists/i,
        moduleId,
      );
    }
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'review_repair_transport').opl_replacement_expectation.replacement_surface,
      'opl_review_repair_transport',
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'review_repair_transport').migration_class,
      'refs_only_adapter',
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'native_helper_envelope').opl_replacement_expectation.replacement_surface,
      'opl_native_helper_execution_envelope',
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'operator_projection_shell').rca_projection_mode,
      'operator_evidence_readiness_refs_only',
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'operator_projection_shell').activeCallerStatus,
      'opl_app_workbench_shell_domain_evidence_refs',
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'generic_cli_mcp_wrappers').opl_replacement_expectation.replacement_surface,
      'opl_standard_domain_agent_generated_cli_mcp_wrappers',
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'generic_cli_mcp_wrappers').activeCallerStatus,
      'opl_generated_wrappers_domain_handler_targets',
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'generic_cli_mcp_wrappers').migration_class,
      'opl_generated_surface',
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'visual_pack_compiler_handoff').migration_class,
      'declarative_pack',
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'visual_authority_functions').migration_class,
      'minimal_authority_function',
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'observability_stability_read_model').rca_owned_visual_domain_authority,
      false,
    );
    assert.equal(
      sidecar.mapped_surfaces.privatized_functional_module_audit.modules.find((entry) => entry.module_id === 'observability_stability_read_model').opl_replacement_expectation.replacement_surface,
      'opl_stability_read_model_and_observability_export',
    );
    for (const entry of sidecar.mapped_surfaces.privatized_functional_module_audit.modules) {
      if (entry.module_id === 'visual_authority_functions') {
        assert.equal(entry.opl_replacement_expectation.owner, 'redcube_ai', entry.module_id);
      } else {
        assert.equal(entry.opl_replacement_expectation.owner, 'opl', entry.module_id);
      }
      assert.equal(entry.opl_replacement_expectation.rca_owns_replacement_runtime, false, entry.module_id);
      assert.equal(entry.physical_deletion_guard.safe_to_delete_now, false, entry.module_id);
      assert.ok(Array.isArray(entry.rca_exports_only) && entry.rca_exports_only.length > 0, entry.module_id);
      for (const value of Object.values(entry.forbidden_generic_owner_flags)) {
        assert.equal(value, false, entry.module_id);
      }
    }
    assert.equal(sidecar.source_manifest_refs.standard_domain_agent_skeleton_ref, '/standard_domain_agent_skeleton');
    assert.equal(sidecar.source_manifest_refs.artifact_locator_contract_ref, '/artifact_locator_contract');
    assert.equal(sidecar.source_manifest_refs.domain_memory_descriptor_locator_ref, '/domain_memory_descriptor_locator');
    assert.equal(sidecar.source_manifest_refs.product_sidecar_receipt_refs_ref, '/product_sidecar_receipt_refs');
    assert.equal(sidecar.source_manifest_refs.controlled_visual_stage_attempt_ref, '/controlled_visual_stage_attempt');
    assert.equal(sidecar.source_manifest_refs.controlled_memory_apply_proof_ref, '/controlled_memory_apply_proof');
    assert.equal(sidecar.runtime_residue_retirement.status, 'active_path_retired');
    assert.equal(sidecar.mapped_surfaces.visual_pack_compiler_handoff.ref, '/visual_pack_compiler_handoff');
    assert.equal(sidecar.mapped_surfaces.visual_pack_compiler_handoff.consumer, 'opl_pack_compiler');
    assert.equal(
      sidecar.mapped_surfaces.visual_pack_compiler_handoff.declarative_visual_pack_input.compiler_owner,
      'opl',
    );
    assert.equal(
      sidecar.mapped_surfaces.visual_pack_compiler_handoff.declarative_visual_pack_input.repository_boundary.repo_tracks_generated_wrapper_outputs,
      false,
    );
    assert.deepEqual(
      sidecar.mapped_surfaces.visual_pack_compiler_handoff.generated_surface_handoff.generated_surface_targets,
      [
        'cli_wrapper',
        'mcp_wrapper',
        'skill_wrapper',
        'product_entry_wrapper',
        'product_sidecar_wrapper',
        'status_projection_wrapper',
        'session_wrapper',
        'workbench_wrapper',
        'functional_harness_wrapper',
      ],
    );
    assert.deepEqual(
      sidecar.mapped_surfaces.visual_pack_compiler_handoff.generated_surface_handoff.generated_descriptor_scope,
      [
        'cli',
        'mcp',
        'skill',
        'product_entry',
        'product_status',
        'product_session',
        'sidecar',
        'workbench',
      ],
    );
    assert.equal(
      sidecar.mapped_surfaces.visual_pack_compiler_handoff.generated_surface_handoff.repo_local_launcher_policy.cli_mcp_skill_product_status_workbench_metadata_owner,
      'one-person-lab',
    );
    assert.equal(
      sidecar.mapped_surfaces.visual_pack_compiler_handoff.generated_surface_handoff.wrappers.skill.owner,
      'opl',
    );
    assert.equal(
      sidecar.mapped_surfaces.visual_pack_compiler_handoff.generated_surface_handoff.generated_surfaces_are_not_rca_long_term_owner,
      true,
    );
    assert.equal(
      sidecar.mapped_surfaces.visual_pack_compiler_handoff.generated_surface_handoff.authority_boundary.opl_can_authorize_review_export_verdict,
      false,
    );
    assert.deepEqual(
      sidecar.mapped_surfaces.visual_pack_compiler_handoff.minimal_authority_function_contract.allowed_functions,
      [
        'source_readiness_verdict',
        'communication_visual_direction_decision',
        'review_export_verdict',
        'artifact_mutation_authorization',
        'visual_memory_accept_reject',
        'owner_receipt_signer',
        'native_helper_implementation',
      ],
    );
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
    assert.equal(
      sidecar.mapped_surfaces.visual_transition_spec.status,
      'contract_landed_thin_evaluator_landed_runner_owned_by_opl',
    );
    assert.equal(sidecar.mapped_surfaces.visual_transition_spec.transition_count, 5);
    assert.equal(
      sidecar.mapped_surfaces.visual_transition_spec.oracle_fixture_id,
      'rca.visual_transition_oracle.fixture.v1',
    );
    assert.equal(sidecar.mapped_surfaces.visual_transition_spec.opl_can_execute_transition_spec, true);
    assert.equal(sidecar.mapped_surfaces.visual_transition_spec.opl_can_declare_visual_ready, false);
    assert.equal(sidecar.mapped_surfaces.visual_transition_spec.opl_can_declare_exportable, false);
    assert.equal(sidecar.mapped_surfaces.visual_transition_spec.evaluator_ref, '/visual_transition_evaluator');
    assert.equal(sidecar.mapped_surfaces.visual_transition_evaluator.evaluator_id, 'rca.visual_transition_evaluator.v1');
    assert.equal(sidecar.mapped_surfaces.visual_transition_evaluator.callable_action, 'evaluate_visual_transition');
    assert.equal(sidecar.mapped_surfaces.visual_transition_evaluator.authority_boundary.implements_opl_generic_transition_runner, false);
    assert.equal(sidecar.mapped_surfaces.visual_transition_evaluator.authority_boundary.writes_runner_state, false);
    assert.equal(sidecar.mapped_surfaces.visual_transition_evaluator.authority_boundary.declares_visual_ready, false);
    assert.equal(sidecar.mapped_surfaces.visual_transition_evaluator.bridge_evidence_projection.refs_only, true);
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
    assert.equal(sidecar.source_manifest_refs.visual_transition_evaluator_ref, '/visual_transition_evaluator');
    assert.equal(sidecar.source_manifest_refs.family_scheduler_replacement_ref, '/family_scheduler_replacement');
    assert.equal(sidecar.source_manifest_refs.opl_generic_primitive_consumption_ref, '/opl_generic_primitive_consumption');
    assert.equal(
      sidecar.source_manifest_refs.opl_stability_read_model_consumption_ref,
      '/opl_stability_read_model_consumption',
    );
    assert.equal(
      sidecar.source_manifest_refs.privatized_functional_module_audit_ref,
      '/privatized_functional_module_audit',
    );
    assert.deepEqual(
      sidecar.guarded_actions.map((entry) => entry.action),
      sidecarGuardedActionMetadata.guardedActionIds,
    );
    assert.equal(
      sidecar.guarded_actions.some((entry) => entry.action === 'supervise_managed_run'),
      false,
    );
    assert.equal(
      sidecar.guarded_actions.some((entry) => entry.action === 'product_entry_continuation'),
      false,
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

    const transitionEvaluation = await dispatchProductSidecar({
      task: {
        action: 'evaluate_visual_transition',
        workspace_root: workspaceRoot,
        transition_id: 'review_ready_to_package',
        current_stage: 'review_and_revision',
        guard_refs: {
          review_state_ref: 'workspace-runtime-ref:review:ok',
          blocked_item_ref: 'workspace-runtime-ref:blocker:none',
          export_proof_ref: 'workspace-runtime-ref:export-proof:ok',
        },
        provider_attempt_ref: 'opl-provider-attempt:review-ready',
        domain_owner_receipt_ref: 'rca-owner-receipt:visual-stage:review-ready',
      },
    });
    assert.equal(transitionEvaluation.result_surface.surface_kind, 'visual_transition_evaluation');
    assert.equal(transitionEvaluation.result_surface.next_stage, 'package_and_handoff');
    assert.equal(transitionEvaluation.result_surface.owner_action, 'export_or_return_typed_blocker');
    assert.equal(transitionEvaluation.result_surface.required_guard_refs_present, true);
    assert.equal(transitionEvaluation.result_surface.coverage.visual_ready_claimed, false);
    assert.equal(transitionEvaluation.result_surface.coverage.exportable_claimed, false);
    assert.equal(transitionEvaluation.result_surface.coverage.writes_runner_state, false);
    assert.equal(
      transitionEvaluation.result_surface.bridge_evidence_refs.domain_owner_receipt_ref,
      'rca-owner-receipt:visual-stage:review-ready',
    );
    assert.equal(
      transitionEvaluation.result_surface.authority_boundary.implements_opl_generic_transition_runner,
      false,
    );

    const blockedTransition = await dispatchProductSidecar({
      task: {
        action: 'evaluate_visual_transition',
        workspace_root: workspaceRoot,
        transition_id: 'review_ready_to_package',
        current_stage: 'review_and_revision',
        guard_refs: {
          review_state_ref: 'workspace-runtime-ref:review:blocked',
        },
      },
    });
    assert.equal(blockedTransition.result_surface.surface_kind, 'typed_blocker');
    assert.equal(blockedTransition.result_surface.blocker_kind, 'visual_transition_missing_guard_refs');
    assert.deepEqual(blockedTransition.result_surface.missing_required_fields, [
      'blocked_item_ref',
      'export_proof_ref',
    ]);
    assert.equal(blockedTransition.result_surface.visual_ready_claimed, false);
    assert.equal(blockedTransition.result_surface.exportable_claimed, false);

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

    const workspaceReceiptProof = await dispatchProductSidecar({
      task: {
        action: 'emit_workspace_receipt_proof',
        workspace_root: workspaceRoot,
        proof_id: 'unit-workspace-receipts',
        attempt_ref: 'workspace-runtime-ref:attempt:run-proof',
        artifact_locator_ref: '/artifact_locator_contract',
        review_export_ref: 'workspace-runtime-ref:review-export:run-proof',
        forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
        artifact_refs: ['workspace-runtime-ref:artifact:slide-proof'],
      },
    });
    assert.equal(workspaceReceiptProof.result_surface.surface_kind, 'workspace_receipt_proof');
    assert.equal(workspaceReceiptProof.result_surface.return_shape, 'workspace_receipt_proof');
    assert.equal(
      workspaceReceiptProof.result_surface.proof_ref,
      'rca-workspace-receipt-proof:visual-stage:unit-workspace-receipts',
    );
    assert.equal(
      workspaceReceiptProof.result_surface.receipt_refs.accepted_memory_receipt_ref,
      'rca-memory-receipt:visual-pattern:unit-workspace-receipts-accepted-memory-accepted',
    );
    assert.equal(
      workspaceReceiptProof.result_surface.receipt_refs.rejected_memory_receipt_ref,
      'rca-memory-receipt:visual-pattern:unit-workspace-receipts-rejected-memory-rejected',
    );
    assert.equal(
      workspaceReceiptProof.result_surface.receipt_refs.cleanup_lifecycle_receipt_ref,
      'rca-lifecycle-receipt:cleanup:unit-workspace-receipts-cleanup',
    );
    assert.equal(
      workspaceReceiptProof.result_surface.receipt_refs.restore_lifecycle_receipt_ref,
      'rca-lifecycle-receipt:restore:unit-workspace-receipts-restore',
    );
    assert.equal(
      workspaceReceiptProof.result_surface.receipt_refs.retention_lifecycle_receipt_ref,
      'rca-lifecycle-receipt:retention:unit-workspace-receipts-retention',
    );
    assert.equal(
      workspaceReceiptProof.result_surface.receipt_refs.no_regression_evidence_ref,
      'rca-no-regression:visual-stage:unit-workspace-receipts-no-regression',
    );
    assert.equal(
      workspaceReceiptProof.result_surface.receipt_refs.domain_owner_receipt_ref,
      'rca-owner-receipt:visual-stage:unit-workspace-receipts-domain-owner',
    );
    assert.equal(workspaceReceiptProof.result_surface.coverage.accepted_memory_receipt_written, true);
    assert.equal(workspaceReceiptProof.result_surface.coverage.rejected_memory_receipt_written, true);
    assert.equal(workspaceReceiptProof.result_surface.coverage.cleanup_lifecycle_receipt_written, true);
    assert.equal(workspaceReceiptProof.result_surface.coverage.restore_lifecycle_receipt_written, true);
    assert.equal(workspaceReceiptProof.result_surface.coverage.retention_lifecycle_receipt_written, true);
    assert.equal(workspaceReceiptProof.result_surface.coverage.no_regression_evidence_written, true);
    assert.equal(workspaceReceiptProof.result_surface.coverage.domain_owner_receipt_written, true);
    assert.equal(workspaceReceiptProof.result_surface.coverage.visual_ready_claimed, false);
    assert.equal(workspaceReceiptProof.result_surface.coverage.exportable_claimed, false);
    assert.equal(workspaceReceiptProof.result_surface.coverage.handoffable_claimed, false);
    assert.equal(workspaceReceiptProof.result_surface.coverage.production_soak_claimed, false);
    assert.equal(workspaceReceiptProof.result_surface.coverage.visual_artifact_blob_written, false);
    assert.equal(workspaceReceiptProof.result_surface.coverage.memory_content_body_written, false);
    assert.equal(workspaceReceiptProof.result_surface.coverage.generic_runtime_state_written, false);
    assert.equal(workspaceReceiptProof.result_surface.repository_boundary.repo_tracks_live_receipt_instances, false);
    assert.equal(workspaceReceiptProof.result_surface.authority_boundary.opl_can_store_receipt_refs, true);
    assert.equal(workspaceReceiptProof.result_surface.authority_boundary.opl_can_store_visual_truth, false);
    assert.equal(workspaceReceiptProof.result_surface.authority_boundary.opl_can_write_visual_memory_body, false);
    const workspaceReceiptProofFile = readJson(workspaceReceiptProof.result_surface.proof_file);
    assert.equal(workspaceReceiptProofFile.surface_kind, 'workspace_receipt_proof');
    assert.equal(workspaceReceiptProofFile.coverage.production_soak_claimed, false);
    assert.equal(
      readJson(workspaceReceiptProof.result_surface.runtime_files.accepted_memory_receipt_file).writeback_status,
      'accepted',
    );
    assert.equal(
      readJson(workspaceReceiptProof.result_surface.runtime_files.rejected_memory_receipt_file).writeback_status,
      'rejected',
    );
    assert.equal(
      readJson(workspaceReceiptProof.result_surface.runtime_files.cleanup_lifecycle_receipt_file).operation,
      'cleanup',
    );
    assert.equal(
      readJson(workspaceReceiptProof.result_surface.runtime_files.restore_lifecycle_receipt_file).operation,
      'restore',
    );
    assert.equal(
      readJson(workspaceReceiptProof.result_surface.runtime_files.retention_lifecycle_receipt_file).operation,
      'retention',
    );
    assert.equal(
      readJson(workspaceReceiptProof.result_surface.runtime_files.domain_owner_receipt_file).required_refs.memory_receipt_ref,
      workspaceReceiptProof.result_surface.receipt_refs.accepted_memory_receipt_ref,
    );

    const manifestWithReceipts = await getProductEntryManifest({
      workspace_root: workspaceRoot,
    });
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.surface_kind,
      'workspace_receipt_inventory_projection',
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.projection_id,
      'rca.workspace_receipt_inventory.v1',
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.status,
      'workspace_receipt_instances_visible_refs_only',
    );
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.read_only, true);
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.refs_only, true);
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.writes_visual_truth, false);
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.writes_artifact_blob, false);
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.writes_memory_body, false);
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.declares_production_soak_complete,
      false,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.implements_opl_artifact_gallery,
      false,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.implements_opl_workbench,
      false,
    );
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.receipt_counts.domain_owner, 2);
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.receipt_counts.memory_visual_pattern, 3);
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.receipt_counts.lifecycle_cleanup, 1);
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.receipt_counts.lifecycle_restore, 1);
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.receipt_counts.lifecycle_retention, 2);
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.coverage.required_memory_lifecycle_receipts_visible,
      true,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.coverage.required_receipt_kinds_visible,
      true,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.coverage.invalid_receipt_payloads_detected,
      false,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.coverage.no_forbidden_payload_fields_detected,
      true,
    );
    assert.deepEqual(
      manifestWithReceipts.workspace_receipt_inventory_projection.gap_projection,
      {
        gap_id: 'real_memory_lifecycle_receipt_instances',
        status: 'runtime_receipt_instances_visible_not_production_soak',
        current_best_ref: '/workspace_receipt_inventory_projection',
        missing_receipt_kinds: [],
      },
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.authority_boundary.opl_app_can_index_receipt_refs,
      true,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.authority_boundary.opl_app_can_write_receipt_instance,
      false,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.authority_boundary.opl_app_can_claim_production_soak_complete,
      false,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.repository_boundary.repo_tracks_live_receipt_instances,
      false,
    );
    assert.ok(
      manifestWithReceipts.workspace_receipt_inventory_projection.receipt_refs.some(
        (receiptRef) => receiptRef.receipt_ref === workspaceReceiptProof.result_surface.receipt_refs.domain_owner_receipt_ref,
      ),
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.source_refs.some(
        (source) => source.source_id === 'workspace_receipt_inventory_projection'
          && source.required_memory_lifecycle_receipts_visible === true,
      ),
      true,
    );
    const memoryLifecycleGap = manifestWithReceipts.operator_evidence_readiness_projection.next_evidence_gaps.find(
      (gap) => gap.gap_id === 'real_memory_lifecycle_receipt_instances',
    );
    assert.deepEqual(
      manifestWithReceipts.operator_evidence_readiness_projection.remaining_gap_classification,
      {
        functional_structure_gap_status: 'functional_structure_gaps_closed_evidence_gates_open',
        functional_structure_gap_count: 0,
        completed_functional_structure_gap_count: 8,
        completed_functional_structure_gap_ids: [
          'opl_generated_surface_production_consumption',
          'repo_local_wrapper_active_caller_migration',
          'focused_hosted_attempt_real_path_cutover',
          'artifact_gallery_handoff_shell',
          'review_repair_transport',
          'opl_app_operator_drilldown',
          'workspace_source_lifecycle_receipt_shell',
          'legacy_physical_cleanup',
        ],
        remaining_gap_class: 'none',
        remaining_functional_structure_gap_ids: [],
        evidence_gap_class: 'production_live_soak_evidence_only',
        remaining_evidence_gate_ids: [
          'real_artifact_producing_domain_owner_receipt',
          'opl_hosted_controlled_visual_stage_long_soak',
          'real_memory_lifecycle_receipt_instances',
          'cross_family_repeated_no_regression_evidence',
        ],
      },
    );
    assert.equal(memoryLifecycleGap.status, 'runtime_receipt_instances_visible_not_production_soak');
    assert.equal(memoryLifecycleGap.current_best_ref, '/workspace_receipt_inventory_projection');
    assert.deepEqual(memoryLifecycleGap.missing_receipt_kinds, []);

    const sidecarWithReceipts = await exportProductSidecar({
      workspace_root: workspaceRoot,
    });
    assert.equal(
      sidecarWithReceipts.mapped_surfaces.workspace_receipt_inventory_projection.ref,
      '/workspace_receipt_inventory_projection',
    );
    assert.equal(
      sidecarWithReceipts.mapped_surfaces.workspace_receipt_inventory_projection.status,
      'workspace_receipt_instances_visible_refs_only',
    );
    assert.equal(
      sidecarWithReceipts.mapped_surfaces.workspace_receipt_inventory_projection.opl_can_write_receipt_instance,
      false,
    );
    assert.equal(
      sidecarWithReceipts.source_manifest_refs.workspace_receipt_inventory_projection_ref,
      '/workspace_receipt_inventory_projection',
    );

    const acceptedMemoryReceiptPayload = readJson(workspaceReceiptProof.result_surface.runtime_files.accepted_memory_receipt_file);
    writeFileSync(
      workspaceReceiptProof.result_surface.runtime_files.accepted_memory_receipt_file,
      `${JSON.stringify({
        ...acceptedMemoryReceiptPayload,
        memory_content_body: 'forbidden body payload must stay out of OPL-facing inventory',
      }, null, 2)}\n`,
      'utf-8',
    );
    const manifestWithForbiddenReceiptPayload = await getProductEntryManifest({
      workspace_root: workspaceRoot,
    });
    assert.equal(
      manifestWithForbiddenReceiptPayload.workspace_receipt_inventory_projection.status,
      'blocked_forbidden_receipt_payload_fields',
    );
    assert.equal(
      manifestWithForbiddenReceiptPayload.workspace_receipt_inventory_projection.coverage.required_receipt_kinds_visible,
      true,
    );
    assert.equal(
      manifestWithForbiddenReceiptPayload.workspace_receipt_inventory_projection.coverage.required_memory_lifecycle_receipts_visible,
      false,
    );
    assert.deepEqual(
      manifestWithForbiddenReceiptPayload.workspace_receipt_inventory_projection.coverage.forbidden_payload_fields_detected,
      ['memory_content_body'],
    );
    assert.equal(
      manifestWithForbiddenReceiptPayload.workspace_receipt_inventory_projection.coverage.memory_content_body_projected,
      false,
    );
    assert.equal(
      manifestWithForbiddenReceiptPayload.workspace_receipt_inventory_projection.gap_projection.status,
      'blocked_forbidden_receipt_payload_fields',
    );
    assert.deepEqual(
      manifestWithForbiddenReceiptPayload.workspace_receipt_inventory_projection.gap_projection.missing_receipt_kinds,
      [],
    );
    assert.equal(
      manifestWithForbiddenReceiptPayload.operator_evidence_readiness_projection.next_evidence_gaps.find(
        (gap) => gap.gap_id === 'real_memory_lifecycle_receipt_instances',
      ).status,
      'blocked_forbidden_receipt_payload_fields',
    );
    writeFileSync(
      workspaceReceiptProof.result_surface.runtime_files.accepted_memory_receipt_file,
      readFileSync(workspaceReceiptProof.result_surface.runtime_files.accepted_memory_receipt_file, 'utf-8')
        .replace(/,\n  "memory_content_body": "forbidden body payload must stay out of OPL-facing inventory"/, ''),
      'utf-8',
    );

    const blockedWorkspaceReceiptProof = await dispatchProductSidecar({
      task: {
        action: 'emit_workspace_receipt_proof',
        workspace_root: workspaceRoot,
        proof_id: 'blocked-workspace-receipts',
      },
    });
    assert.equal(blockedWorkspaceReceiptProof.result_surface.surface_kind, 'typed_blocker');
    assert.equal(
      blockedWorkspaceReceiptProof.result_surface.blocker_kind,
      'workspace_receipt_proof_missing_required_refs',
    );
    assert.equal(blockedWorkspaceReceiptProof.result_surface.visual_ready_claimed, false);

    await assert.rejects(
      () => dispatchProductSidecar({
        task: {
          action: 'supervise_managed_run',
          workspace_root: workspaceRoot,
          managed_run_id: 'managed-removed',
        },
      }),
      /product sidecar action 不允许/,
    );

    await assert.rejects(
      () => dispatchProductSidecar({
        task: {
          action: 'product_entry_continuation',
          workspace_root: workspaceRoot,
          entry_session_id: 'session-removed',
        },
      }),
      /product sidecar action 不允许/,
    );

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
