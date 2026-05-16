// @ts-nocheck

export const FUNCTIONAL_MODULE_FORBIDDEN_OWNER_FLAGS = Object.freeze({
  rca_owns_generic_runtime: false,
  rca_owns_generic_attempt_ledger: false,
  rca_owns_generic_session_shell: false,
  rca_owns_generic_workbench: false,
  rca_owns_native_helper_generic_envelope: false,
  rca_owns_generic_cli_mcp_wrapper_generator: false,
  rca_owns_generic_executor_adapter: false,
  rca_owns_observability_exporter: false,
});

export const RCA_FUNCTIONAL_MODULE_REPLACEMENT_GUARDS = Object.freeze({
  managed_dag_scheduler: {
    expectation_ref: '/family_scheduler_replacement',
    opl_replacement_surface: 'opl_family_scheduler',
    rca_projection_mode: 'visual_stage_dag_refs_only',
    rca_exports_only: ['stage_dag_ref', 'route_policy_refs', 'visual_stage_order_refs'],
  },
  attempt_state_machine_runner: {
    expectation_ref: '/opl_generic_primitive_consumption/functional_harness_consumer_coverage/chain_authority/generic_transition_runner',
    opl_replacement_surface: 'opl_generic_transition_runner',
    rca_projection_mode: 'transition_spec_and_guard_result_refs_only',
    rca_exports_only: ['visual_transition_spec_ref', 'guard_result_refs', 'owner_receipt_refs', 'typed_blocker_refs'],
  },
  managed_run_json_store: {
    expectation_ref: '/opl_generic_primitive_consumption/functional_harness_consumer_coverage/chain_authority/queue_stage_attempt_typed_closeout',
    opl_replacement_surface: 'opl_attempt_ledger_provider_receipts',
    rca_projection_mode: 'managed_run_locator_and_visual_summary_refs_only',
    rca_exports_only: ['managed_run_locator_refs', 'visual_run_projection_refs', 'provider_receipt_correlation_refs'],
  },
  product_entry_session_store: {
    expectation_ref: '/opl_generic_primitive_consumption',
    opl_replacement_surface: 'opl_app_session_shell_and_workbench',
    rca_projection_mode: 'entry_session_domain_snapshot_refs_only',
    rca_exports_only: ['entry_session_id', 'topic_deliverable_run_locator_refs', 'latest_visual_run_ref'],
  },
  workspace_source_intake: {
    expectation_ref: '/opl_substrate_adapter_export',
    opl_replacement_surface: 'opl_workspace_source_intake_shell',
    rca_projection_mode: 'source_readiness_and_source_pack_refs_only',
    rca_exports_only: ['source_locator_refs', 'source_readiness_verdict_ref', 'communication_strategy_input_refs'],
  },
  memory_writeback_receipt_transport: {
    expectation_ref: '/opl_generic_primitive_consumption/functional_harness_consumer_coverage/chain_authority/memory_refs_only_writeback_chain',
    opl_replacement_surface: 'opl_memory_locator_writeback_transport',
    rca_projection_mode: 'memory_receipt_locator_refs_only',
    rca_exports_only: ['memory_locator_refs', 'writeback_receipt_refs', 'accept_reject_receipt_refs'],
  },
  artifact_export_lifecycle: {
    expectation_ref: '/opl_generic_primitive_consumption/consumed_projection_surfaces/artifact_lifecycle',
    opl_replacement_surface: 'opl_artifact_lifecycle_gallery_handoff_shell',
    rca_projection_mode: 'artifact_locator_export_verdict_refs_only',
    rca_exports_only: ['artifact_locator_refs', 'export_verdict_refs', 'lifecycle_receipt_refs'],
  },
  review_repair_transport: {
    expectation_ref: '/opl_generic_primitive_consumption/consumed_projection_surfaces/review_repair_transport',
    opl_replacement_surface: 'opl_review_repair_transport',
    rca_projection_mode: 'review_export_verdict_and_repair_target_refs_only',
    rca_exports_only: ['review_state_refs', 'blocked_item_refs', 'repair_hint_refs', 'export_verdict_refs'],
  },
  native_helper_envelope: {
    expectation_ref: '/opl_generic_primitive_consumption/consumed_projection_surfaces/native_helper_generic_envelope',
    opl_replacement_surface: 'opl_native_helper_execution_envelope',
    rca_projection_mode: 'native_helper_implementation_and_proof_refs_only',
    rca_exports_only: ['helper_catalog_refs', 'package_module_refs', 'helper_proof_refs'],
  },
  operator_projection_shell: {
    expectation_ref: '/operator_evidence_readiness_projection',
    opl_replacement_surface: 'opl_app_operator_workbench_shell',
    rca_projection_mode: 'operator_evidence_readiness_refs_only',
    rca_exports_only: ['evidence_gap_refs', 'typed_blocker_refs', 'safe_repair_hint_refs'],
  },
  generic_cli_mcp_wrappers: {
    expectation_ref: '/family_action_catalog',
    opl_replacement_surface: 'opl_standard_domain_agent_generated_cli_mcp_wrappers',
    rca_projection_mode: 'canonical_action_metadata_refs_only',
    rca_exports_only: ['family_action_catalog_refs', 'guarded_action_refs', 'domain_handler_refs'],
  },
  codex_executor_adapter: {
    expectation_ref: '/domain_entry_contract/executor',
    opl_replacement_surface: 'opl_agent_executor_adapter',
    rca_projection_mode: 'route_level_executor_policy_refs_only',
    rca_exports_only: ['executor_requirement_refs', 'executor_receipt_refs', 'route_policy_refs'],
  },
  observability_stability_read_model: {
    expectation_ref: '/opl_stability_read_model_consumption',
    opl_replacement_surface: 'opl_stability_read_model_and_observability_export',
    rca_projection_mode: 'observability_refs_only',
    rca_exports_only: ['owner_receipt_refs', 'typed_blocker_refs', 'no_regression_evidence_refs', 'resource_pressure_signal_refs'],
  },
});

export function buildFunctionalModulePhysicalDeletionGuard(entry) {
  return {
    safe_to_delete_now: false,
    reason: `${entry.module_id} still has active callers or retained RCA visual authority refs; physical deletion waits for OPL replacement adoption and no-active-caller proof.`,
    required_before_delete: [
      'opl_replacement_surface_live',
      'active_callers_migrated',
      'domain_authority_refs_preserved',
      'no_regression_proof_recorded',
    ],
  };
}
