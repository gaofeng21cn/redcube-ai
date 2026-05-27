// @ts-nocheck
import {
  PRODUCT_ENTRY_COMPANIONS_SPECIFIER,
  SERIAL_ENV_TEST,
  assert,
  assertFamilyOrchestrationCompanion,
  assertRuntimeLoopClosureShape,
  getProductEntryManifest,
  getDomainActionAdapterGuardedActionMetadata,
  importDomainEntrySharedModule,
  test,
  withMockCodexRuntimeState,
  prepareProductEntryWorkspace,
} from '../product-domain-action-case-shared.ts';
import { assertManifestActionAndStageControlPlane } from './manifest-stage-control-plane-assertions.ts';


test('getProductEntryManifest projects the current direct-entry shell and shared OPL handoff truth', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async ({ runtimeStateRoot }) => {
    const sharedCompanions = await importDomainEntrySharedModule(PRODUCT_ENTRY_COMPANIONS_SPECIFIER);
    const workspaceRoot = await prepareProductEntryWorkspace();

    const manifest = await getProductEntryManifest({
      workspace_root: workspaceRoot,
    });
    const domain_action_adapterGuardedActionMetadata = await getDomainActionAdapterGuardedActionMetadata();

    assert.equal(manifest.ok, true);
    assert.equal(manifest.surface_kind, 'product_entry_manifest');
    assert.equal(manifest.manifest_version, 2);
    assert.equal(manifest.manifest_kind, 'redcube_product_entry_manifest');
    assert.equal(manifest.target_domain_id, 'redcube_ai');
    assert.equal(manifest.formal_entry.default, 'CLI');
    assert.deepEqual(manifest.formal_entry.supported_protocols, ['MCP']);
    assert.equal(manifest.formal_entry.internal_surface, 'domain_entry_protocol_boundary');
    assert.equal(
      manifest.formal_entry.internal_surface_role,
      'service_safe_domain_entry_and_protocol_adapter',
    );
    assert.deepEqual(manifest.formal_entry.retired_internal_surface_ids, [
      'retired_gateway_protocol_boundary_public_entry',
    ]);
    assert.deepEqual(manifest.formal_entry.retired_internal_surface_policy, {
      surface_kind: 'retired_internal_surface_policy',
      semantic_id_required: true,
      required_id_prefix: 'retired_',
      legacy_raw_surface_ids_forbidden: [
        'managed',
        'runtime',
        'gateway',
        'session',
        'domain_action_adapter',
      ],
      legacy_terms_allowed_only_inside_retired_semantic_ids: true,
      compatibility_alias_allowed: false,
      callable_alias_allowed: false,
      active_caller_allowed: false,
      production_readiness_claim_allowed: false,
    });
    for (const retiredSurfaceId of manifest.formal_entry.retired_internal_surface_ids) {
      assert.equal(retiredSurfaceId.startsWith('retired_'), true, retiredSurfaceId);
      assert.equal(
        manifest.formal_entry.retired_internal_surface_policy.legacy_raw_surface_ids_forbidden.includes(
          retiredSurfaceId,
        ),
        false,
        retiredSurfaceId,
      );
    }
    assert.equal(manifest.formal_entry.compatibility_alias_allowed, false);
    assert.equal(manifest.workspace_locator.workspace_surface_kind, 'redcube_workspace');
    assert.equal(manifest.workspace_locator.workspace_root, workspaceRoot);
    assert.equal(manifest.recommended_shell, 'direct');
    assert.equal(manifest.recommended_command, 'redcube product invoke');
    assert.equal(manifest.entry_status_surface.shell_key, 'status');
    assert.equal(manifest.entry_status_surface.command, 'opl_generated:product_status');
    assert.equal(manifest.entry_status_surface.surface_kind, 'product_status');
    assert.match(manifest.entry_status_surface.summary, /product-entry overview/i);
    assert.deepEqual(manifest.product_entry_surface, manifest.entry_status_surface);
    assert.equal(manifest.operator_loop_surface.shell_key, 'direct');
    assert.equal(manifest.operator_loop_surface.command, 'redcube product invoke');
    assert.equal(manifest.operator_loop_surface.surface_kind, 'product_entry');
    assert.equal(manifest.operator_loop_surface.continuation_shell_key, 'session');
    assert.equal(manifest.operator_loop_surface.continuation_command, 'opl_generated:product_session');
    assert.match(manifest.operator_loop_surface.summary, /entry_session_id/);
    assert.equal(manifest.operator_loop_actions.start_deliverable.command, 'redcube product invoke');
    assert.equal(manifest.operator_loop_actions.start_deliverable.surface_kind, 'product_entry');
    assert.deepEqual(manifest.operator_loop_actions.start_deliverable.requires, ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id']);
    assert.equal(manifest.operator_loop_actions.continue_session.command, 'opl_generated:product_session');
    assert.deepEqual(manifest.operator_loop_actions.continue_session.requires, ['entry_session_id']);
    assert.equal(manifest.operator_loop_actions.opl_hosted_handoff.command, 'opl_framework:hosted_product_entry');
    assert.equal(manifest.product_entry_quickstart.surface_kind, 'product_entry_quickstart');
    assert.equal(manifest.product_entry_quickstart.recommended_step_id, 'continue_current_loop');
    assert.deepEqual(manifest.product_entry_quickstart.human_gate_ids, ['redcube_operator_review_gate']);
    assert.deepEqual(
      manifest.product_entry_quickstart.steps.map((step) => step.step_id),
      ['continue_current_loop', 'inspect_current_progress', 'default_image_ppt_proof', 'optional_native_ppt_proof'],
    );
    assert.equal(
      manifest.product_entry_quickstart.steps[0].command,
      `redcube product invoke --workspace-root ${workspaceRoot} --entry-session-id <entry-session-id> --overlay <overlay-id> --topic-id <topic-id> --deliverable-id <deliverable-id>`,
    );
    assert.equal(manifest.product_entry_quickstart.steps[1].command, 'opl_generated:product_session --entry-session-id <entry-session-id>');
    assert.deepEqual(manifest.product_entry_quickstart.steps[1].requires, ['entry_session_id']);
    assert.equal(manifest.product_entry_quickstart.steps[2].surface_kind, 'image_ppt_product_entry_proof');
    assert.match(manifest.product_entry_quickstart.steps[2].command, /redcube image-ppt proof/);
    assert.equal(manifest.product_entry_quickstart.steps[3].surface_kind, 'native_ppt_product_entry_proof');
    assert.match(manifest.product_entry_quickstart.steps[3].command, /redcube native-ppt proof/);
    assert.equal(manifest.product_entry_overview.surface_kind, 'product_entry_overview');
    assert.equal(typeof manifest.product_entry_overview.summary, 'string');
    assert.match(manifest.product_entry_overview.summary, /direct product-entry domain handler target/);
    assert.equal(manifest.product_entry_overview.product_entry_command, 'redcube product invoke');
    assert.equal(manifest.product_entry_overview.entry_status_command, 'opl_generated:product_status');
    assert.equal(manifest.product_entry_overview.recommended_command, 'redcube product invoke');
    assert.equal(manifest.product_entry_overview.operator_loop_command, 'redcube product invoke');
    assert.deepEqual(manifest.product_entry_overview.progress_surface, {
      surface_kind: 'product_entry_session',
      command: 'opl_generated:product_session --entry-session-id <entry-session-id>',
      step_id: 'inspect_current_progress',
    });
    assert.deepEqual(manifest.product_entry_overview.resume_surface, {
      surface_kind: 'product_entry_session',
      command: 'opl_generated:product_session --entry-session-id <entry-session-id>',
      session_locator_field: 'entry_session_contract.entry_session_id',
      checkpoint_locator_field: 'continuation_snapshot.latest_stage_execution_plan_ref',
    });
    assert.equal(manifest.product_entry_overview.recommended_step_id, 'continue_current_loop');
    assert.deepEqual(manifest.product_entry_overview.human_gate_ids, ['redcube_operator_review_gate']);
    assert.equal(manifest.product_entry_start.surface_kind, 'product_entry_start');
    assert.equal(manifest.product_entry_start.recommended_mode_id, 'start_direct_session');
    assert.deepEqual(
      manifest.product_entry_start.modes.map((mode) => mode.mode_id),
      ['start_direct_session', 'opl_hosted_handoff', 'resume_session'],
    );
    assert.match(manifest.product_entry_start.modes[0].command, /redcube product invoke/);
    assert.deepEqual(
      manifest.product_entry_start.modes[0].requires,
      ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
    );
    assert.equal(manifest.product_entry_start.modes[1].surface_kind, 'opl_hosted_product_entry');
    assert.equal(manifest.product_entry_start.modes[2].surface_kind, 'product_entry_session');
    assert.deepEqual(manifest.product_entry_start.resume_surface, {
      surface_kind: 'product_entry_session',
      command: 'opl_generated:product_session --entry-session-id <entry-session-id>',
      session_locator_field: 'entry_session_contract.entry_session_id',
      checkpoint_locator_field: 'continuation_snapshot.latest_stage_execution_plan_ref',
    });
    assert.deepEqual(manifest.product_entry_start.human_gate_ids, ['redcube_operator_review_gate']);
    assert.equal(manifest.product_entry_preflight.surface_kind, 'product_entry_preflight');
    assert.equal(typeof manifest.product_entry_preflight.summary, 'string');
    assert.match(manifest.product_entry_preflight.summary, /product-entry preflight passed/i);
    assert.equal(manifest.product_entry_preflight.ready_to_try_now, true);
    assert.equal(
      manifest.product_entry_preflight.recommended_check_command,
      `redcube workspace doctor --workspace-root ${workspaceRoot}`,
    );
    assert.equal(
      manifest.product_entry_preflight.recommended_start_command,
      `redcube product invoke --workspace-root ${workspaceRoot} --entry-session-id <entry-session-id> --overlay <overlay-id> --topic-id <topic-id> --deliverable-id <deliverable-id>`,
    );
    assert.deepEqual(manifest.product_entry_preflight.blocking_check_ids, []);
    assert.deepEqual(
      manifest.product_entry_preflight.checks.map((check) => check.check_id),
      [
        'workspace_root_resolved',
        'workspace_contract_present',
        'runtime_state_root_ready',
        'product_entry_overview_contract_landed',
      ],
    );
    assert.equal(manifest.product_entry_preflight.checks[0].status, 'pass');
    assert.equal(manifest.product_entry_preflight.checks[1].status, 'pass');
    assert.equal(manifest.product_entry_preflight.checks[2].status, 'pass');
    assert.equal(manifest.product_entry_preflight.checks[3].status, 'pass');
    assert.equal(manifest.repo_mainline.program_id, 'redcube-runtime-program');
    assert.equal(manifest.repo_mainline.phase_id, 'repo_verified_product_entry_and_opl_hosted_handoff');
    assert.equal(manifest.repo_mainline.active_baton_provenance_id, 'product_entry_session_continuity');
    assert.equal(manifest.repo_mainline.active_baton_role, 'session_continuity_provenance');
    assert.equal(
      manifest.current_truth.session_continuity_provenance_contract,
      'contracts/runtime-program/product-entry-session-continuity.json',
    );
    assert.equal(
      manifest.current_truth.provenance_contract_name_policy,
      'neutral_session_continuity_contract_with_legacy_managed_tombstone',
    );
    assert.equal(typeof manifest.product_entry_status.summary, 'string');
    assert.match(manifest.product_entry_status.summary, /product-entry overview\/intake surface/);
    assert.equal(manifest.product_entry_status.remaining_gaps_count, 2);
    assert.equal(manifest.product_entry_status.next_focus.length, manifest.product_entry_status.remaining_gaps_count);
    assert.equal(manifest.product_entry_status.next_focus.every((gap) => typeof gap === 'string' && gap.length > 0), true);
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_acceptance.status,
      'closed_by_domain_owned_acceptance_receipt',
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_acceptance.receipt_chain_scope,
      'rca_owned_refs_only_artifact_producing_receipt_chain',
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_acceptance.evidence_receipt_fixture_ref,
      'contracts/production_acceptance/rca-evidence-receipt-fixture.json',
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.declares_artifact_producing_owner_receipt,
      true,
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.declares_artifact_producing_owner_receipt_scope,
      'refs_only_receipt_chain_closed_not_visual_ready',
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.remaining_gap_classification.remaining_evidence_gate_ids.includes(
        'real_artifact_producing_domain_owner_receipt',
      ),
      false,
    );
    assert.equal(manifest.operator_evidence_readiness_projection.declares_visual_ready, false);
    assert.equal(manifest.operator_evidence_readiness_projection.declares_exportable, false);
    assert.equal(manifest.operator_evidence_readiness_projection.declares_handoffable, false);
    assert.equal(manifest.operator_evidence_readiness_projection.declares_domain_ready, false);
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_evidence_scaleout_refs.surface_kind,
      'rca_visual_production_evidence_scaleout_refs',
    );
    assert.deepEqual(
      manifest.operator_evidence_readiness_projection.production_evidence_scaleout_refs.selected_artifact_producing_visual_route.stage_sequence_refs,
      [
        'author_image_pages',
        'visual_director_review',
        'screenshot_review',
        'export_pptx',
      ],
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_evidence_scaleout_refs.selected_artifact_producing_visual_route.route_id,
      'ppt_deck.image_first.artifact_producing.v1',
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_evidence_scaleout_refs.selected_artifact_producing_visual_route.visual_verdict_owner,
      'redcube_ai',
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.workspace_receipt_scaleout_claimed,
      false,
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.emits_owner_receipt_ref,
      true,
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_evidence_scaleout_refs.visual_memory_body_reuse_refs.projected_body_to_opl,
      false,
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_evidence_scaleout_refs.visual_memory_body_reuse_refs.reuse_ref_scope,
      'visual_pattern_memory_locator_and_content_ref_only',
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_evidence_scaleout_refs.repeated_no_regression_evidence_refs.evidence_refs.length >= 2,
      true,
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_evidence_scaleout_refs.repeated_no_regression_evidence_refs.evidence_cadence,
      'cross_route_cross_window_repeated_refs_only',
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_evidence_scaleout_refs.naming_tombstone_follow_through_refs.active_caller_compatibility_alias_restored,
      false,
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_evidence_scaleout_refs.authority_boundary.opl_can_store_memory_body,
      false,
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.rca_efficiency_handoff_projection.source_work_order_ref,
      'oma_developer_patch_work_order_5a1b68cacbd4',
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.rca_efficiency_handoff_projection.target_agent_owner_surface_refs.refs_only,
      true,
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.rca_efficiency_handoff_projection.patch_traceability_matrix.length,
      5,
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_evidence_tail_workorder.surface_kind,
      'rca_production_evidence_tail_workorder',
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_evidence_tail_workorder.workorder_id,
      'rca.production_evidence_tail_workorder.v1',
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_evidence_tail_workorder.payload_body_allowed,
      false,
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_evidence_tail_workorder.success_boundary.production_soak_complete_claimed,
      false,
    );
    assert.deepEqual(
      manifest.operator_evidence_readiness_projection.production_evidence_tail_workorder.work_items.map(
        (item) => item.item_id,
      ),
      [
        'owner_chain_apply',
        'memory_lifecycle_receipt_scaleout',
        'temporal_controlled_visual_stage_long_soak',
        'cross_family_repeated_no_regression',
      ],
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.authority_boundary.opl_app_can_declare_domain_ready,
      false,
    );
    assert.equal(manifest.product_entry_readiness.surface_kind, 'product_entry_readiness');
    assert.equal(manifest.product_entry_readiness.verdict, 'service_surface_ready_not_end_user_shell');
    assert.equal(manifest.product_entry_readiness.usable_now, true);
    assert.equal(manifest.product_entry_readiness.good_to_use_now, false);
    assert.equal(manifest.product_entry_readiness.fully_automatic, false);
    assert.equal(manifest.product_entry_readiness.recommended_start_surface, 'product_entry');
    assert.equal(manifest.product_entry_readiness.recommended_start_command, 'redcube product invoke');
    assert.equal(manifest.product_entry_readiness.recommended_loop_surface, 'product_entry');
    assert.equal(manifest.product_entry_readiness.recommended_loop_command, 'redcube product invoke');
    assert.deepEqual(manifest.product_entry_readiness.blocking_gaps, [
      '成熟的最终用户前台壳仍未 landed。',
      'production evidence tail 仍需 Temporal long soak、真实 memory/lifecycle receipt scaleout 与跨 family no-regression evidence。',
    ]);
    assert.equal(manifest.runtime.runtime_owner, 'configured_family_runtime_provider');
    assert.equal(manifest.runtime.runtime_state_root, runtimeStateRoot);
    assert.deepEqual(manifest.opl_provider_runtime_contract, {
      shared_contract_ref: 'contracts/opl-framework/runtime-manager-contract.json',
      runtime_owner: 'configured_family_runtime_provider',
      domain_owner: 'redcube_ai',
      executor_owner: 'configured_by_opl_runtime_provider',
      supervision_status_surface: {
        surface_kind: 'product_entry_session',
        owner: 'redcube_ai',
      },
      attention_queue_surface: {
        surface_kind: 'product_status',
        owner: 'redcube_ai',
      },
      recovery_contract_surface: {
        surface_kind: 'product_entry_session',
        owner: 'redcube_ai',
      },
      fail_closed_rules: [
        'domain_supervision_cannot_bypass_runtime',
        'executor_cannot_declare_global_gate_clear',
        'runtime_cannot_invent_domain_publishability_truth',
      ],
    });
    assert.equal(manifest.runtime_inventory.surface_kind, 'runtime_inventory');
    assert.equal(manifest.runtime_inventory.runtime_owner, 'configured_family_runtime_provider');
    assert.equal(manifest.runtime_inventory.domain_owner, 'redcube_ai');
    assert.equal(manifest.runtime_inventory.executor_owner, 'configured_by_opl_runtime_provider');
    assert.equal(manifest.runtime_inventory.status_surface.ref, '/product_entry_preflight');
    assert.equal(manifest.runtime_inventory.attention_surface.ref, '/status_surface');
    assert.equal(manifest.runtime_inventory.recovery_surface.ref, '/operator_loop_actions/continue_session');
    assert.equal(manifest.runtime_inventory.workspace_binding.workspace_root, workspaceRoot);
    assert.equal(manifest.runtime_inventory.workspace_binding.runtime_state_root, runtimeStateRoot);
    assert.equal(manifest.runtime_inventory.workspace_binding.session_continuity_root, manifest.runtime.session_continuity_root);
    assert.equal(manifest.task_lifecycle.surface_kind, 'task_lifecycle');
    assert.equal(manifest.task_lifecycle.task_kind, 'visual_deliverable_loop');
    assert.equal(manifest.task_lifecycle.task_id, 'redcube_opl_stage_execution_plan_loop');
    assert.equal(manifest.task_lifecycle.status, 'resumable');
    assert.equal(
      manifest.task_lifecycle.progress_surface.command,
      'opl_generated:product_session --entry-session-id <entry-session-id>',
    );
    assert.equal(
      manifest.task_lifecycle.resume_surface.command,
      'opl_generated:product_session --entry-session-id <entry-session-id>',
    );
    assert.equal(manifest.task_lifecycle.checkpoint_summary.surface_kind, 'checkpoint_summary');
    assert.equal(manifest.task_lifecycle.checkpoint_summary.status, 'operator_review_required');
    assert.deepEqual(manifest.task_lifecycle.human_gate_ids, ['redcube_operator_review_gate']);
    assert.equal(manifest.persistence_policy.surface_kind, 'family_persistence_policy');
    assert.equal(manifest.persistence_policy.policy_id, 'redcube_product_entry_persistence_policy');
    assert.equal(manifest.persistence_policy.authority_surfaces[0].storage_role, 'file_authority');
    assert.equal(manifest.lifecycle_ledger.surface_kind, 'family_lifecycle_ledger');
    assert.equal(manifest.lifecycle_ledger.actions[0].action_id, 'verify_redcube_product_entry_manifest');
    assert.equal(manifest.owner_route.surface_kind, 'family_owner_route');
    assert.equal(manifest.owner_route.next_owner, 'redcube_ai');
    assert.equal(
      manifest.owner_route.projection_refs.some((entry) => entry.ref === '/rca_efficiency_handoff_projection'),
      true,
    );
    assert.equal(
      manifest.owner_route.projection_refs.some(
        (entry) => entry.ref === '/operator_evidence_readiness_projection/rca_efficiency_handoff_projection',
      ),
      true,
    );
    assertManifestActionAndStageControlPlane({
      manifest,
      domain_action_adapterGuardedActionMetadata,
    });
    assert.equal(manifest.standard_domain_agent_skeleton.surface_kind, 'standard_domain_agent_skeleton');
    assert.equal(manifest.standard_domain_agent_skeleton.skeleton_id, 'rca.standard_domain_agent_skeleton.v1');
    assert.equal(manifest.standard_domain_agent_skeleton.mapping_model, 'physical_skeleton_repo_source_layout_with_manifest_projection');
    assert.equal(manifest.standard_domain_agent_skeleton.repo_source_boundary.physical_relayout_required_now, false);
    assert.deepEqual(
      manifest.standard_domain_agent_skeleton.repo_source_boundary.allowed_roots.map((root) => root.boundary_id),
      ['agent', 'contracts', 'runtime', 'docs'],
    );
    assert.equal(manifest.standard_domain_agent_skeleton.repo_source_boundary.repo_tracks_runtime_artifact_blobs, false);
    assert.deepEqual(manifest.standard_domain_agent_skeleton.runtime_declarations.declares_only, [
      'domain_handler_target',
      'projection_builder',
      'lifecycle_adapter',
      'visual_transition_spec',
      'visual_transition_evaluator',
      'domain_memory_descriptor_locator',
      'domain_owner_receipt_contract',
      'lifecycle_guarded_apply_proof',
    ]);
    assert.equal(manifest.standard_domain_agent_skeleton.runtime_declarations.domain_handler_target_ref, '/product_entry_shell/domain_handler');
    assert.equal(manifest.standard_domain_agent_skeleton.runtime_declarations.projection_builder_ref, '/family_stage_control_plane');
    assert.equal(manifest.standard_domain_agent_skeleton.runtime_declarations.lifecycle_adapter_ref, '/opl_family_lifecycle_adapter');
    assert.equal(manifest.standard_domain_agent_skeleton.runtime_declarations.visual_transition_spec_ref, '/visual_transition_spec');
    assert.equal(manifest.standard_domain_agent_skeleton.runtime_declarations.visual_transition_evaluator_ref, '/visual_transition_evaluator');
    assert.equal(manifest.standard_domain_agent_skeleton.runtime_declarations.domain_memory_descriptor_locator_ref, '/domain_memory_descriptor_locator');
    assert.equal(manifest.artifact_locator_contract.contract_id, 'rca.workspace_runtime_artifact_locator.v1');
    assert.equal(manifest.artifact_locator_contract.locator_model, 'workspace_runtime_artifact_root_refs_only');
    assert.equal(manifest.artifact_locator_contract.workspace_runtime_artifact_root.workspace_root, workspaceRoot);
    assert.equal(manifest.artifact_locator_contract.workspace_runtime_artifact_root.runtime_state_root, runtimeStateRoot);
    assert.equal(manifest.artifact_locator_contract.workspace_runtime_artifact_root.session_continuity_root, manifest.runtime.session_continuity_root);
    assert.equal(manifest.artifact_locator_contract.repo_source_boundary.repo_tracks_visual_or_export_artifact_blobs, false);
    assert.equal(manifest.artifact_locator_contract.opl_consumption_policy.forbidden.includes('declare_visual_export_verdict'), true);
    assert.equal(manifest.opl_generic_primitive_consumption.ref, '/opl_generic_primitive_consumption');
    assert.equal(manifest.opl_generic_primitive_consumption.owner, 'opl');
    assert.equal(manifest.opl_generic_primitive_consumption.consumer, 'redcube_ai');
    assert.equal(manifest.opl_generic_primitive_consumption.status, 'functional_consumer_follow_through_landed');
    assert.equal(
      manifest.opl_generic_primitive_consumption.completion_scope,
      'functional_consumer_follow_through_complete_not_live_soak',
    );
    assert.equal(manifest.opl_generic_primitive_consumption.live_soak_claimed, false);
    assert.deepEqual(
      manifest.opl_generic_primitive_consumption.rca_does_not_own,
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
        'generated_cli_mcp_product_entry_domain_handler_descriptor_status_session_workbench_wrapper',
      ],
    );
    assert.deepEqual(
      manifest.opl_generic_primitive_consumption.functional_harness_consumer_coverage.covered_chains,
      [
        'memory_refs_only_writeback_chain',
        'queue_stage_attempt_typed_closeout',
        'generic_transition_runner',
        'restart_dead_letter_repair_human_gate_state_chain',
      ],
    );
    assert.equal(
      manifest.opl_generic_primitive_consumption.functional_harness_consumer_coverage.opl_harness_pass_is_visual_ready,
      false,
    );
    assert.equal(
      manifest.opl_generic_primitive_consumption.functional_harness_consumer_coverage.opl_harness_pass_is_exportable,
      false,
    );
    assert.equal(
      manifest.opl_generic_primitive_consumption.functional_harness_consumer_coverage.opl_harness_pass_is_handoffable,
      false,
    );
    assert.equal(
      manifest.opl_generic_primitive_consumption.functional_harness_consumer_coverage.opl_harness_pass_is_artifact_producing_owner_receipt,
      false,
    );
    assert.deepEqual(
      manifest.opl_generic_primitive_consumption.rca_retained_authority,
      [
        'visual_truth',
        'review_export_verdict',
        'artifact_authority',
        'visual_memory_body',
        'owner_receipt',
        'native_helper_implementation',
        'typed_blocker',
        'safe_action_refs',
      ],
    );
    assert.equal(manifest.opl_stability_read_model_consumption.ref, '/opl_stability_read_model_consumption');
    assert.equal(manifest.opl_stability_read_model_consumption.owner, 'opl');
    assert.equal(manifest.opl_stability_read_model_consumption.consumer, 'redcube_ai');
    assert.equal(
      manifest.opl_stability_read_model_consumption.status,
      'refs_only_consumer_projection_landed',
    );
    assert.equal(manifest.opl_stability_read_model_consumption.observability_only, true);
    assert.equal(manifest.opl_stability_read_model_consumption.live_soak_claimed, false);
    assert.deepEqual(
      manifest.opl_stability_read_model_consumption.consumed_read_model_surfaces.map((entry) => entry.surface),
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
      manifest.opl_stability_read_model_consumption.authority_boundary.opl_can_write_rca_domain_truth,
      false,
    );
    assert.equal(
      manifest.opl_stability_read_model_consumption.authority_boundary.opl_can_authorize_visual_ready,
      false,
    );
    assert.equal(
      manifest.opl_stability_read_model_consumption.authority_boundary.generic_fallback_can_mark_success,
      false,
    );
    assert.equal(manifest.opl_family_lifecycle_adapter.persistence.artifact_locator_contract_ref.ref, '/artifact_locator_contract');
    assert.deepEqual(
      manifest.action_metadata.product_entry.map((entry) => [entry.action_key, entry.command, entry.surface_kind]),
      [
        ['start_deliverable', 'redcube product invoke', 'product_entry'],
        ['run_image_ppt_proof', 'redcube image-ppt proof', 'image_ppt_product_entry_proof'],
        ['run_native_ppt_proof', 'redcube native-ppt proof', 'native_ppt_product_entry_proof'],
        ['invoke_domain_entry', 'redcube service-safe domain entry', 'domain_entry'],
      ],
    );
    assert.equal(manifest.skill_catalog.surface_kind, 'skill_catalog');
    assert.equal(manifest.skill_catalog.skills.length, 1); assert.equal(manifest.skill_catalog.skills.some((skill) => skill.skill_id === 'ui-ux-pro-max'), false);
    assert.deepEqual(manifest.skill_catalog.supported_commands, [
      'redcube product invoke',
      'redcube image-ppt proof',
      'redcube native-ppt proof',
    ]);
    assert.equal(manifest.skill_catalog.command_contracts.length, 3);
    assert.deepEqual(
      manifest.skill_catalog.command_contracts.map((contract) => [
        contract.action_id,
        contract.command,
        contract.target_surface_kind,
      ]),
      [
        ['invoke_product_entry', 'redcube product invoke', 'product_entry'],
        ['run_image_ppt_proof', 'redcube image-ppt proof', 'image_ppt_product_entry_proof'],
        ['run_native_ppt_proof', 'redcube native-ppt proof', 'native_ppt_product_entry_proof'],
      ],
    );
    assert.equal(manifest.skill_catalog.skills[0].skill_id, 'redcube-ai');
    assert.equal(manifest.skill_catalog.skills[0].title, 'RedCube AI');
    assert.equal(manifest.skill_catalog.skills[0].command, 'redcube product invoke');
    assert.equal(manifest.skill_catalog.skills[0].target_surface_kind, 'product_entry');
    assert.deepEqual(manifest.skill_catalog.skills[0].tags, ['domain-app', 'product-entry', 'visual-deliverables']);
    assert.deepEqual(
      manifest.skill_catalog.skills[0].domain_projection.domain_memory_descriptor_locator_ref,
      {
        ref_kind: 'json_pointer',
        ref: '/domain_memory_descriptor_locator',
        label: 'RCA visual pattern memory descriptor locator',
      },
    );
    assert.deepEqual(
      manifest.skill_catalog.skills[0].domain_projection.skill_activation,
      {
        plugin_name: 'redcube-ai',
        skill_semantics: 'single_domain_app_skill',
        canonical_entry_semantics: 'agent_facing_product_entry_overview',
        generated_interface_owner: 'one-person-lab',
        domain_handler_owner: 'redcube_ai',
        repo_local_redcube_cli_role: 'domain_handler_target_or_direct_domain_entry_only',
        repo_local_redcube_mcp_role: 'domain_handler_target_or_direct_protocol_adapter_only',
        entry_shell_key: 'direct',
        entry_command: 'redcube product invoke',
        supporting_shell_keys: ['direct', 'session', 'native_ppt_proof', 'image_ppt_proof'],
        opl_generated_shell_keys: ['status', 'session'],
        domain_handler_keys: ['domain_handler'],
        shell_commands: {
          status: {
            command: 'opl_generated:product_status',
            target_surface_kind: 'product_status',
            owner: 'one-person-lab',
            repo_local_command_available: false,
          },
          direct: {
            command: 'redcube product invoke',
            target_surface_kind: 'product_entry',
          },
          session: {
            command: 'opl_generated:product_session',
            target_surface_kind: 'product_entry_session',
            owner: 'one-person-lab',
            repo_local_command_available: false,
          },
          image_ppt_proof: {
            command: 'redcube image-ppt proof',
            target_surface_kind: 'image_ppt_product_entry_proof',
            role: 'controlled_operator_helper',
          },
          native_ppt_proof: {
            command: 'redcube native-ppt proof',
            target_surface_kind: 'native_ppt_product_entry_proof',
            role: 'controlled_operator_helper',
          },
        },
      },
    );
    assert.deepEqual(
      manifest.skill_catalog.skills[0].domain_projection.runtime_continuity,
      {
        surface_kind: 'skill_runtime_continuity',
        runtime_owner: 'configured_family_runtime_provider',
        domain_owner: 'redcube_ai',
        executor_owner: 'configured_by_opl_runtime_provider',
        session_locator_field: 'entry_session_contract.entry_session_id',
        session_surface_ref: {
          ref_kind: 'json_pointer',
          ref: '/entry_session',
          label: 'entry session surface',
        },
        progress_surface_ref: {
          ref_kind: 'json_pointer',
          ref: '/progress_projection',
          label: 'progress projection surface',
        },
        artifact_surface_ref: {
          ref_kind: 'json_pointer',
          ref: '/artifact_inventory',
          label: 'artifact inventory surface',
        },
        restore_point_surface_ref: {
          ref_kind: 'json_pointer',
          ref: '/session_continuity/restore_point',
          label: 'restore point surface',
        },
        recommended_resume_command: 'opl_generated:product_session --entry-session-id <entry-session-id>',
        recommended_progress_command: 'opl_generated:product_session --entry-session-id <entry-session-id>',
        recommended_artifact_command: 'opl_generated:product_session --entry-session-id <entry-session-id>',
      },
    );
    assert.equal(manifest.automation.surface_kind, 'automation');
    assert.equal(manifest.automation.automations.length, 2);
    assert.equal(manifest.automation.automations[0].automation_id, 'redcube_autopilot_continuation_board');
    assert.equal(manifest.automation.automations[0].trigger_kind, 'continuation_board');
    assert.equal(manifest.automation.automations[0].readiness_status, 'tracked_follow_on');
    assert.equal(manifest.automation.automations[0].gate_policy, 'operator_review_gated');
    assert.equal(manifest.automation.automations[1].automation_id, 'redcube_operator_review_gate');
    assert.equal(manifest.automation.automations[1].trigger_kind, 'operator_review_gate');
    assert.equal(manifest.automation.automations[1].readiness_status, 'repo_tracked');
    assert.equal(manifest.automation.automations[1].gate_policy, 'human_gate_required');
    assert.equal(manifest.product_entry_shell.status.command, 'opl_generated:product_status');
    assert.equal(manifest.product_entry_shell.direct.command, 'redcube product invoke');
    assert.equal(manifest.product_entry_shell.opl_hosted.command, 'opl_framework:hosted_product_entry');
    assert.equal(manifest.product_entry_shell.session.command, 'opl_generated:product_session');
    assert.equal(manifest.product_entry_shell.domain_handler.command, 'redcube domain-handler export');
    assert.equal(manifest.product_entry_shell.domain_handler.runtime_owner, 'configured_family_runtime_provider');
    assert.equal(manifest.product_entry_shell.domain_handler.provider_transport_owner, 'opl_family_runtime_provider');
    assert.equal(manifest.product_entry_shell.domain_handler.control_plane_owner, 'opl');
    assert.equal(
      manifest.product_entry_shell.domain_handler.opl_generic_primitive_consumption.status,
      'functional_consumer_follow_through_landed',
    );
    assert.deepEqual(
      manifest.product_entry_shell.domain_handler.allowed_actions,
      domain_action_adapterGuardedActionMetadata.guardedActionIds,
    );
    assert.deepEqual(
      manifest.product_entry_shell.domain_handler.forbidden_writes,
      domain_action_adapterGuardedActionMetadata.forbiddenWrites,
    );
    assert.match(manifest.product_entry_shell.status.purpose, /product-entry overview/i);
    assert.equal(
      manifest.product_entry_shell.status.canonical_entry_semantics,
      'agent_facing_product_entry_overview',
    );
    assert.equal(manifest.product_entry_shell.status.command_key, 'status');
    assert.equal(manifest.product_entry_shell.status.claims_gui_shell, false);
    assert.match(manifest.product_entry_shell.direct.purpose, /deliverable loop/i);
    assert.equal(manifest.route_equivalence.surface_kind, 'route_equivalence_contract');
    assert.equal(manifest.route_equivalence.public_skill_policy.skill_count, 1);
    assert.deepEqual(manifest.route_equivalence.public_skill_policy.skill_ids, ['redcube-ai']);
    assert.deepEqual(
      manifest.route_equivalence.equivalent_routes.map((route) => route.route_id),
      ['product_status', 'product_invoke', 'session_continuation', 'opl_hosted_stage_runtime'],
    );
    assert.deepEqual(
      manifest.route_equivalence.shared_truth_surfaces,
      [
        'domain_entry_surface',
        'session_continuity',
        'progress_projection',
        'artifact_inventory',
        'runtime_loop_closure',
        'review_state',
        'publication_projection',
      ],
    );
    assert.equal(
      manifest.route_equivalence.downstream_runtime_truth.entry_surface_kind,
      'domain_entry',
    );
    assert.equal(
      manifest.route_equivalence.downstream_runtime_truth.runtime_owner,
      'configured_family_runtime_provider',
    );
    assert.equal(manifest.deliverable_facade.surface_kind, 'deliverable_facade_contract');
    assert.deepEqual(manifest.deliverable_facade.covered_families, ['ppt_deck', 'xiaohongshu']);
    assert.deepEqual(manifest.deliverable_facade.facade_truth_surfaces, [
      'createDeliverable',
      'buildOplStageExecutionPlan',
      'runDeliverableRoute',
      'auditDeliverable',
      'runtimeWatch',
      'getReviewState',
      'getPublicationProjection',
    ]);
    assert.equal(manifest.deliverable_facade.public_entry_policy.new_public_entry_allowed, false);
    assert.equal(manifest.deliverable_facade.public_entry_policy.canonical_skill_id, 'redcube-ai');
    assert.deepEqual(
      manifest.deliverable_facade.family_route_policy.ppt_deck.protected_stage_sequence,
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
    assert.equal(manifest.deliverable_facade.family_route_policy.ppt_deck.default_visual_route, 'author_image_pages');
    assert.equal(manifest.deliverable_facade.family_route_policy.ppt_deck.default_visual_policy, 'image_first');
    assert.equal(manifest.deliverable_facade.family_route_policy.ppt_deck.route_selection_policy.style_reference_dir_input, 'delivery_request.style_reference_dir');
    assert.deepEqual(manifest.deliverable_facade.family_route_policy.ppt_deck.route_selection_policy.explicit_selection_required_for, ['render_html', 'fix_html', 'author_pptx_native', 'repair_pptx_native']);
    for (const family of ['ppt_deck', 'xiaohongshu']) { const companion = manifest.deliverable_facade.family_route_policy[family].html_design_companion; assert.equal(companion.source_skill_id, 'ui-ux-pro-max'); assert.equal(companion.activation_surface, 'internal_stage_context'); assert.equal(companion.public_skill_policy, 'do_not_register_as_public_redcube_skill'); }
    assert.equal(manifest.deliverable_facade.family_route_policy.ppt_deck.default_run_mode, 'auto_to_terminal');
    assert.equal(
      manifest.deliverable_facade.family_route_policy.ppt_deck.stop_policy,
      'stop_only_on_explicit_stop_after_stage_or_runtime_review_gate',
    );
    assert.equal(
      manifest.deliverable_facade.family_route_policy.ppt_deck.bypass_policy,
      'forbid_generic_presentation_or_native_pptx_bypass_unless_user_explicitly_selects_html_or_native_route',
    );
    assert.equal(manifest.shared_handoff.opl_return_surface.surface_kind, 'product_entry');
    assert.equal(manifest.domain_entry_contract.entry_adapter, 'RedCubeDomainEntry');
    assert.equal(manifest.domain_entry_contract.service_safe_surface_kind, 'domain_entry');
    assert.equal(manifest.domain_entry_contract.product_entry_builder_command, 'redcube product invoke');
    assert.deepEqual(manifest.domain_entry_contract.supported_entry_modes, ['direct', 'opl_hosted']);
    assert.deepEqual(manifest.domain_entry_contract.supported_commands, [
      'redcube product invoke',
    ]);
    assert.equal(manifest.domain_entry_contract.command_contracts.length, 1);
    assert.equal(manifest.domain_entry_contract.command_contracts[0].command, 'redcube product invoke');
    assert.deepEqual(manifest.domain_entry_contract.command_contracts[0].required_fields, ['workspace_root', 'entry_session_id', 'overlay', 'topic_id', 'deliverable_id']);
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.surface_kind,
      'domain_agent_entry_spec',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.agent_id,
      'rca',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.default_engine,
      'codex',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.workspace_requirement,
      'required',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.codex_entry_strategy,
      'domain_agent_entry',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.artifact_conventions,
      'deck_and_visual_delivery',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.progress_conventions,
      'deliverable_build_narration',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.entry_command,
      'redcube product invoke',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.manifest_command,
      'opl_generated:product_entry_manifest',
    );
    assert.deepEqual(
      manifest.domain_entry_contract.domain_agent_entry_spec.locator_schema,
      {
        required_fields: ['workspace_root'],
        optional_fields: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
      },
    );
    assert.equal(manifest.user_interaction_contract.surface_kind, 'user_interaction_contract');
    assert.equal(manifest.user_interaction_contract.entry_owner, 'redcube_agent_entry_shell');
    assert.equal(manifest.user_interaction_contract.user_interaction_mode, 'agent_facing_product_entry_overview');
	    assert.equal(manifest.user_interaction_contract.user_commands_required, false);
	    assert.equal(manifest.user_interaction_contract.command_surfaces_for_agent_consumption_only, true);
	    assert.equal(manifest.user_interaction_contract.shared_downstream_entry, 'RedCubeDomainEntry');
    assert.deepEqual(manifest.user_interaction_contract.shared_handoff_envelope, [
      'target_domain_id',
      'task_intent',
      'entry_mode',
      'workspace_locator',
      'runtime_session_contract',
      'return_surface_contract',
      'entry_session_contract',
      'delivery_request',
	    ]);
	    assert.equal(manifest.current_truth.product_entry_contract, 'contracts/runtime-program/redcube-product-entry-mvp.json');
      assert.equal(manifest.native_ppt_operator_ux.surface_kind, 'native_ppt_operator_ux');
      assert.equal(manifest.native_ppt_operator_ux.route_selection.default_visual_route, 'author_image_pages');
      assert.equal(manifest.native_ppt_operator_ux.route_selection.style_reference_dir_input, 'delivery_request.style_reference_dir');
      assert.equal(manifest.native_ppt_operator_ux.image_provider_diagnostics.surface_kind, 'image_provider_diagnostics');
      assert.equal(manifest.ppt_deck_visual_route_truth.default_visual_route, 'author_image_pages');
      assert.equal(manifest.native_ppt_operator_ux.proof_runner.helper_command, 'redcube native-ppt proof');
      assert.equal(manifest.native_ppt_operator_ux.image_proof_runner.helper_command, 'redcube image-ppt proof');
      assert.equal(manifest.native_ppt_operator_ux.image_proof_runner.downstream_action_ref, 'repo_owned_image_ppt_proof_runner');
      assert.equal(manifest.native_ppt_operator_ux.image_proof_runner.delegates_to, 'tools/image-ppt-proof/run.sh');
      assert.doesNotMatch(manifest.native_ppt_operator_ux.image_proof_runner.command_template, /--workspace-root/);
      assert.equal(manifest.native_ppt_operator_ux.proof_runner.public_skill_policy, 'do_not_register_as_second_public_skill');
      assert.equal(manifest.native_ppt_operator_ux.dependency_diagnostics.checks[2].check_id, 'native_true_render_capability');
      assert.equal(manifest.native_ppt_operator_ux.dependency_diagnostics.checks[2].typed_blocker, 'missing_renderer_dependency');
      assert.equal(manifest.native_ppt_operator_ux.dependency_diagnostics.checks[3].check_id, 'renderer_auto_bootstrap');
      assert.equal(manifest.native_ppt_operator_ux.dependency_diagnostics.checks[3].user_preinstall_required, false);
	    assert.equal(manifest.session_continuity.surface_kind, 'session_continuity');
	    assert.equal(manifest.session_continuity.owner, 'redcube_ai');
	    assert.equal(manifest.session_continuity.status, 'repo_tracked');
	    assert.equal(manifest.session_continuity.session_command_template, 'opl_generated:product_session --entry-session-id <entry-session-id>');
	    assert.equal(manifest.session_continuity.restore_point_surface_ref.ref, '/session_continuity/restore_point');
	    assert.equal(manifest.session_continuity.progress_surface_ref.ref, '/progress_projection');
	    assert.equal(manifest.session_continuity.artifact_surface_ref.ref, '/artifact_inventory');
	    assert.deepEqual(
	      manifest.session_continuity.truth_surfaces.map((surface) => surface.surface_kind),
	      ['product_entry', 'product_entry_session'],
	    );
	    assert.equal(manifest.progress_projection.surface_kind, 'progress_projection');
	    assert.equal(manifest.progress_projection.owner, 'redcube_ai');
	    assert.equal(manifest.progress_projection.status, 'repo_tracked');
	    assert.equal(manifest.progress_projection.projection_field_ref.ref, '/progress_projection/projection');
	    assert.equal(manifest.progress_projection.fallback_projection_ref.ref, '/continuation_snapshot/runtime_progress_projection');
	    assert.equal(manifest.artifact_inventory.surface_kind, 'artifact_inventory');
	    assert.equal(manifest.artifact_inventory.owner, 'redcube_ai');
	    assert.equal(manifest.artifact_inventory.status, 'repo_tracked');
	    assert.equal(manifest.artifact_inventory.artifact_refs_ref.ref, '/artifact_inventory/artifact_refs');
	    assert.equal(
	      manifest.artifact_inventory.artifact_refs_fallback_ref.ref,
	      '/continuation_snapshot/runtime_progress_projection/final_artifact_refs',
	    );
      assert.equal(manifest.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
      assert.equal(manifest.runtime_loop_closure.loop_owner.runtime_owner, 'configured_family_runtime_provider');
      assert.equal(manifest.runtime_loop_closure.loop_owner.domain_owner, 'redcube_ai');
      assert.equal(manifest.runtime_loop_closure.loop_owner.product_entry_owner, 'redcube_ai');
      assert.equal(
        manifest.runtime_loop_closure.resume_point.resume_command_template,
        'opl_generated:product_session --entry-session-id <entry-session-id>',
      );
      assert.equal(manifest.runtime_loop_closure.continuity_cursor.surface_ref, '/session_continuity');
      assert.equal(manifest.runtime_loop_closure.progress_cursor.surface_ref, '/progress_projection');
      assert.equal(manifest.runtime_loop_closure.artifact_pickup.surface_ref, '/artifact_inventory');
      assert.equal(manifest.runtime_loop_closure.control_policy.approval_gate_id, 'redcube_operator_review_gate');
      assert.equal(manifest.runtime_loop_closure.control_policy.default_run_mode, 'auto_to_terminal');
      assert.equal(
        manifest.runtime_loop_closure.control_policy.stop_policy,
        'stop_only_on_explicit_stop_after_stage_or_runtime_review_gate',
      );
      assert.equal(manifest.runtime_loop_closure.control_policy.approval_required, false);
      assert.equal(manifest.runtime_loop_closure.control_policy.gate_status, 'approved');
      assert.equal(manifest.runtime_loop_closure.control_policy.interrupt_policy, 'continue_autonomously_until_runtime_gate');
      assert.equal(manifest.runtime_loop_closure.control_policy.recommended_action, 'invoke_product_entry_auto_to_terminal');
      assert.equal(manifest.runtime_loop_closure.source_linkage.current_source, 'manifest');
      assert.equal(manifest.runtime_loop_closure.source_linkage.entry_mode, 'manifest_projection');
      assert.equal(manifest.runtime_loop_closure.source_linkage.direct_surface_kind, 'product_entry');
      assert.equal(manifest.runtime_loop_closure.source_linkage.opl_hosted_surface_kind, 'opl_hosted_product_entry');
      assert.equal(manifest.runtime_loop_closure.source_linkage.session_surface_kind, 'product_entry_session');
      assert.equal(manifest.runtime_loop_closure.source_linkage.downstream_entry_surface_kind, 'domain_entry');
      assert.equal(manifest.opl_family_lifecycle_adapter.surface_kind, 'opl_family_lifecycle_adapter');
      assert.equal(manifest.opl_family_lifecycle_adapter.adapter_id, 'rca.opl.family.lifecycle.adapter.v1');
      assert.equal(manifest.opl_family_lifecycle_adapter.discovery.adoption_state, 'discoverable_manifest_projection');
      assert.equal(manifest.opl_family_lifecycle_adapter.persistence.sqlite.status, 'not_domain_owned_generic_persistence');
      assert.equal(manifest.opl_family_lifecycle_adapter.persistence.authority_model, 'file_authority_plus_rebuildable_artifact_indexes');
      assert.deepEqual(
        manifest.opl_family_lifecycle_adapter.discovery.owner_split,
        {
          family_persistence_owner: 'one-person-lab',
          session_shell_owner: 'one-person-lab',
          stage_attempt_owner: 'one-person-lab',
          attempt_ledger_owner: 'one-person-lab',
          lifecycle_projection_owner: 'redcube_ai',
          domain_truth_owner: 'redcube_ai',
          review_publication_owner: 'redcube_ai',
          runtime_manager_consumer: 'opl_runtime_manager',
          executor_owner: 'configured_by_opl_runtime_provider',
        },
      );
      assert.deepEqual(
        manifest.opl_family_lifecycle_adapter.discovery.route_surfaces.map((surface) => surface.surface_id),
        [
          'product_entry_registration',
          'opl_hosted_stage_runtime',
          'product_entry_session',
          'opl_stage_execution_plan',
          'review_state',
          'publication_projection',
        ],
      );
      assert.equal(
        manifest.opl_family_lifecycle_adapter.adoption.required_input_fields.includes('entry_session_id'),
        true,
      );
      assert.equal(manifest.opl_family_lifecycle_adapter.authority_boundary.owns_domain_truth, false);
      assert.equal(manifest.opl_family_lifecycle_adapter.authority_boundary.owns_canonical_artifacts, false);
      assert.equal(manifest.opl_family_lifecycle_adapter.authority_boundary.owns_review_truth, false);
      assert.equal(manifest.opl_family_lifecycle_adapter.authority_boundary.owns_publication_projection, false);
	    const validatedManifest = sharedCompanions.validateFamilyProductEntryManifest(manifest, {
	      requireRuntimeCompanions: true,
	    });
    assert.equal(validatedManifest.domain_entry_contract.entry_adapter, 'RedCubeDomainEntry');
    assert.equal(validatedManifest.user_interaction_contract.entry_owner, 'redcube_agent_entry_shell');
    assertFamilyOrchestrationCompanion(manifest, {
      sessionLocatorField: 'entry_session_contract.entry_session_id',
    });
    assert.equal(manifest.family_orchestration.action_graph.edges.length, 4);
    assert.deepEqual(manifest.family_orchestration.action_graph.human_gates, [
      {
        gate_id: 'redcube_operator_review_gate',
        trigger_nodes: ['step:inspect_current_progress'],
        blocking: true,
      },
    ]);
  });
});
