// @ts-nocheck
import {
  SERIAL_ENV_TEST,
  assert,
  dispatchDomainActionAdapter,
  exportDomainActionAdapter,
  getDomainActionAdapterGuardedActionMetadata,
  prepareProductEntryWorkspace,
  readJson,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';
import {
  assertEvery,
  assertIds,
  assertPathValues,
  list,
} from './surface-fixture-assertions.ts';

const FUNCTIONAL_MODULE_FORBIDDEN_OWNER_FLAGS_REF =
  'contracts/functional_privatization_audit.json#/forbidden_generic_owner_flags';

test('domain-handler export and dispatch preserve RCA authority while allowing guarded control-plane actions', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const domain_action_adapter = await exportDomainActionAdapter({ workspace_root: workspaceRoot });
    const domain_action_adapterGuardedActionMetadata = await getDomainActionAdapterGuardedActionMetadata();
    const adapterSourceClassification = readJson('contracts/physical_source_morphology_policy.json')
      .active_surface_classifications.find((entry) => entry.surface_id === 'domain_action_adapter_guarded_actions');

    assertPathValues(domain_action_adapter, {
      ok: true,
      surface_kind: 'domain_action_adapter_export',
      'runtime_framework.runtime_owner': 'configured_family_runtime_provider',
      'runtime_framework.provider_transport_owner': 'opl_family_runtime_provider',
      'runtime_framework.managed_by': 'opl_runtime_manager',
      'runtime_framework.queue_owner': 'opl',
      'runtime_framework.family_scheduler_replacement.owner': 'opl',
      'runtime_framework.family_scheduler_replacement.consumer': 'redcube_ai',
      'runtime_framework.family_scheduler_replacement.projection_scope': 'consumer_projection_and_visual_domain_authority_refs_only',
      'runtime_framework.rca_thin_surface_policy.generic_surfaces_owner': 'opl',
      'runtime_framework.rca_thin_surface_policy.opl_generic_primitive_consumption.status': 'functional_consumer_follow_through_landed',
      'runtime_framework.rca_thin_surface_policy.opl_stability_read_model_consumption.status': 'refs_only_consumer_projection_landed',
      'runtime_framework.rca_thin_surface_policy.privatized_functional_module_audit.status': 'machine_audit_projection_landed',
      'runtime_framework.rca_thin_surface_policy.opl_generic_primitive_consumption.functional_harness_consumer_coverage.pass_claim_scope': 'consumer_contract_coverage_only',
      'runtime_framework.rca_thin_surface_policy.route_stage_handoff_boundary.surface_kind': 'rca_route_stage_handoff_boundary',
      'runtime_framework.rca_thin_surface_policy.route_stage_handoff_boundary.route_semantics_owner': 'redcube_ai',
      'runtime_framework.rca_thin_surface_policy.route_stage_handoff_boundary.stage_graph_owner': 'one-person-lab',
      'source_manifest_refs.route_stage_handoff_boundary_ref': '/route_stage_handoff_boundary',
      'owner_boundary.rca_surface_role': 'visual_domain_authority_pack_plus_thin_program_surface',
      'mapped_surfaces.artifact_locator_contract.ref': '/artifact_locator_contract',
      'mapped_surfaces.artifact_locator_contract.locator_model': 'opl_stage_folder_contract_refs_only',
      'mapped_surfaces.receipt_refs.ref': '/domain_action_adapter_receipt_refs',
      'mapped_surfaces.runtime_watch.owner': 'one-person-lab',
      'mapped_surfaces.runtime_watch.rca_direct_read_model_owner': 'redcube_ai',
      'mapped_surfaces.runtime_watch.owner_boundary.classification': 'retained_current_refs_only_boundary',
      'mapped_surfaces.runtime_watch.dispatch_surface': 'opl_status_workbench_runtime_read_model',
      'mapped_surfaces.visual_pattern_memory_writeback.descriptor_ref': '/domain_memory_descriptor_locator',
      'mapped_surfaces.visual_pattern_memory_writeback.transport_owner': 'opl',
      'mapped_surfaces.native_helper_implementation.ref': '/native_ppt_operator_ux',
      'mapped_surfaces.native_helper_implementation.implementation_owner': 'redcube_ai',
      'mapped_surfaces.controlled_visual_stage_attempt.ref': '/controlled_visual_stage_attempt',
      'mapped_surfaces.controlled_visual_stage_attempt.apply_proof_state': 'controlled_apply_proof_landed_memory_body_external',
      'mapped_surfaces.family_scheduler_replacement.owner': 'opl',
      'mapped_surfaces.opl_generic_primitive_consumption.status': 'functional_consumer_follow_through_landed',
      'mapped_surfaces.opl_stability_read_model_consumption.status': 'refs_only_consumer_projection_landed',
      'mapped_surfaces.privatized_functional_module_audit.ref': '/privatized_functional_module_audit',
      'mapped_surfaces.privatized_functional_module_audit.closed_retirement_summary.closed_retirement_count': 8,
      'mapped_surfaces.privatized_functional_module_audit.closed_retirement_summary.closed_default_caller_retirement_count': 5,
      'mapped_surfaces.privatized_functional_module_audit.replacement_expectation_mode': 'opl_replacement_expectation_or_refs_only_projection',
      'mapped_surfaces.privatized_functional_module_audit.functional_structure_gap_closure.status': 'functional_structure_gaps_closed_evidence_gates_open',
      'mapped_surfaces.privatized_functional_module_audit.functional_structure_gap_closure.functional_structure_gap_count': 0,
      'mapped_surfaces.visual_pack_compiler_handoff.ref': '/visual_pack_compiler_handoff',
      'mapped_surfaces.visual_pack_compiler_handoff.consumer': 'opl_pack_compiler',
      'mapped_surfaces.visual_pack_compiler_handoff.generated_surface_handoff.repo_local_launcher_policy.cli_mcp_skill_product_status_workbench_metadata_owner': 'one-person-lab',
      'mapped_surfaces.visual_pack_compiler_handoff.visual_pack_discipline.surface_kind': 'visual_pack_discipline_refs',
      'mapped_surfaces.visual_pack_compiler_handoff.markdown_marp_route_policy.route_default': false,
      'mapped_surfaces.visual_pack_compiler_handoff.package_distribution_gate.policy_ref': 'agent/quality_gates/package_distribution.md',
      'mapped_surfaces.visual_pack_compiler_handoff.render_review_gate_contract.surface_kind': 'render_review_gate_contract_refs',
      'mapped_surfaces.controlled_soak_no_regression_attempt.long_soak_evidence_action': 'emit_temporal_controlled_visual_stage_long_soak_evidence',
      'mapped_surfaces.owner_receipt_contract.owner': 'redcube_ai',
      'mapped_surfaces.owner_receipt_contract.writable_by_domain_action_adapter': true,
      'mapped_surfaces.lifecycle_guarded_apply.domain_receipt_required': true,
      'mapped_surfaces.visual_transition_spec.spec_id': 'rca.visual_transition_spec.v1',
      'mapped_surfaces.visual_transition_spec.transition_count': 5,
      'mapped_surfaces.visual_transition_evaluator.callable_action': 'evaluate_visual_transition',
      'runtime_residue_retirement.status': 'active_path_retired',
    });
    assert.equal(domain_action_adapter.mapped_surfaces.standard_domain_agent_skeleton, undefined);
    assertPathValues(adapterSourceClassification, {
      classification: 'domain_handler_target',
      current_rca_role: 'guarded_domain_action_target_and_refs_only_domain_action_adapter_adapter_not_domain_action_adapter_owner',
      'no_resurrection_gate.generic_dispatch_owner_allowed': false,
      'no_resurrection_gate.generic_domain_action_adapter_owner_allowed': false,
    });
    assert.equal(adapterSourceClassification.source_refs.includes('packages/redcube-domain-entry/src/actions/domain-action-adapter-parts/'), true);
    for (const forbiddenClaim of [
      '"visual_ready":true',
      '"exportable":true',
      '"handoffable":true',
      '"production_soak_complete":true',
      '"compatibility_alias_allowed":true',
      '"generic_domain_action_adapter_owner_allowed":true',
    ]) {
      assert.equal(JSON.stringify(domain_action_adapter).includes(forbiddenClaim), false, forbiddenClaim);
    }
    assertPathValues(domain_action_adapter.owner_boundary, {
      rca_owns_visual_truth: true,
      rca_owns_review_publication_projection: true,
      rca_owns_visual_memory_body: true,
      rca_owns_owner_receipt: true,
      rca_owns_native_helper_implementation: true,
    });
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.runtime_watch.retired_domain_action_adapter_dispatch_ref,
      'retired_domain_action_adapter.runtime_watch_dispatch_tombstone',
    );
    assert.deepEqual(domain_action_adapter.mapped_surfaces.visual_pattern_memory_writeback.rca_retained_authority, ['visual_memory_body']);
    assert.deepEqual(domain_action_adapter.mapped_surfaces.family_scheduler_replacement.rca_retained_authority, list('visual_truth review_export_verdict artifact_authority visual_memory_body owner_receipt native_helper_implementation typed_blocker safe_action_refs'));
    assert.deepEqual(domain_action_adapter.mapped_surfaces.opl_generic_primitive_consumption.rca_does_not_own, list('standard_domain_agent_scaffold functional_harness generic_runtime generic_scheduler daemon typed_queue stage_attempt_orchestrator attempt_ledger typed_closeout_transport generic_runner generic_transition_runner workbench_shell memory_transport memory_refs_only_writeback_chain artifact_lifecycle review_repair_transport restart_dead_letter_repair_human_gate_state_chain native_helper_generic_envelope generated_cli_mcp_product_entry_domain_handler_descriptor_status_session_workbench_wrapper'));
    assertIds(domain_action_adapter.mapped_surfaces.privatized_functional_module_audit.modules, 'module_id', list('product_entry_continuity_refs_adapter workspace_source_intake memory_writeback_receipt_transport artifact_export_lifecycle review_repair_transport native_helper_envelope operator_projection_shell generic_cli_mcp_wrappers codex_executor_adapter observability_stability_read_model visual_pack_compiler_handoff visual_authority_functions'));
    assert.deepEqual(domain_action_adapter.mapped_surfaces.privatized_functional_module_audit.classification_values, list('domain_handler_target refs_only_adapter minimal_authority_function native_helper_implementation provenance'));
    const modulesById = Object.fromEntries(
      domain_action_adapter.mapped_surfaces.privatized_functional_module_audit.modules.map((entry) => [entry.module_id, entry]),
    );
    for (const entry of Object.values(modulesById)) {
      assert.equal(entry.opl_replacement_expectation.rca_owns_replacement_runtime, false, entry.module_id);
      assert.equal(entry.physical_deletion_guard.safe_to_delete_now, false, entry.module_id);
      assert.equal(entry.forbidden_generic_owner_flags, undefined, entry.module_id);
      assert.equal(entry.forbidden_generic_owner_flags_ref, FUNCTIONAL_MODULE_FORBIDDEN_OWNER_FLAGS_REF, entry.module_id);
    }
    assert.deepEqual(domain_action_adapter.mapped_surfaces.visual_pack_compiler_handoff.generated_surface_handoff.generated_descriptor_scope, list('cli mcp skill product_entry product_status product_session domain_handler workbench'));
    assertEvery(
      domain_action_adapter.mapped_surfaces.visual_pack_compiler_handoff
        .minimal_authority_function_contract.authority_surface_contracts,
      (surface) => surface.programmatic_verdict_generation_allowed === false,
      'authority contracts keep AI-first decision boundary',
    );
    assert.deepEqual(
      domain_action_adapter.guarded_actions.map((entry) => entry.action),
      domain_action_adapterGuardedActionMetadata.guardedActionIds,
    );
    assert.deepEqual(domain_action_adapter.guarded_actions, domain_action_adapterGuardedActionMetadata.guardedActions);
    assert.deepEqual(domain_action_adapter.blocked_actions, domain_action_adapterGuardedActionMetadata.blockedActions);
    for (const retiredAction of ['supervise_managed_run', 'runtime_watch', 'product_entry_continuation']) {
      assert.equal(domain_action_adapter.guarded_actions.some((entry) => entry.action === retiredAction), false, retiredAction);
    }

    const receipt = await dispatchDomainActionAdapter({ task: { action: 'notification_receipt', notification_id: 'notice-1' } });
    assertPathValues(receipt, {
      ok: true,
      surface_kind: 'domain_action_adapter_dispatch',
      'result_surface.surface_kind': 'notification_receipt',
      'domain_action_adapter_policy.writes_visual_truth': false,
      'domain_action_adapter_policy.writes_review_verdict': false,
      'domain_action_adapter_policy.writes_publication_gate': false,
    });

    const transitionEvaluation = await dispatchDomainActionAdapter({
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
    assertPathValues(transitionEvaluation.result_surface, {
      surface_kind: 'visual_transition_evaluation',
      next_stage: 'package_and_handoff',
      owner_action: 'export_or_return_typed_blocker',
      required_guard_refs_present: true,
      'coverage.visual_ready_claimed': false,
      'coverage.exportable_claimed': false,
      'coverage.writes_runner_state': false,
      'bridge_evidence_refs.domain_owner_receipt_ref': 'rca-owner-receipt:visual-stage:review-ready',
      'authority_boundary.implements_opl_generic_transition_runner': false,
    });

    const blockedTransition = await dispatchDomainActionAdapter({
      task: {
        action: 'evaluate_visual_transition',
        workspace_root: workspaceRoot,
        transition_id: 'review_ready_to_package',
        current_stage: 'review_and_revision',
        guard_refs: { review_state_ref: 'workspace-runtime-ref:review:blocked' },
      },
    });
    assertPathValues(blockedTransition.result_surface, {
      surface_kind: 'typed_blocker',
      blocker_kind: 'visual_transition_missing_guard_refs',
      missing_required_fields: ['blocked_item_ref', 'export_proof_ref'],
      visual_ready_claimed: false,
      exportable_claimed: false,
    });

    for (const retiredAction of [
      { action: 'supervise_managed_run', managed_run_id: 'managed-removed' },
      { action: 'runtime_watch', topic_id: 'topic-removed', deliverable_id: 'deck-removed', run_id: 'run-removed' },
      { action: 'product_entry_continuation', entry_session_id: 'session-removed' },
    ]) {
      await assert.rejects(
        () => dispatchDomainActionAdapter({ task: { workspace_root: workspaceRoot, ...retiredAction } }),
        new RegExp(`domain-handler action 不允许: ${retiredAction.action}`),
      );
    }
    await assert.rejects(
      () => dispatchDomainActionAdapter({ task: { action: 'write_publication_gate', workspace_root: workspaceRoot } }),
      /domain-handler action 不允许/,
    );
  });
});
