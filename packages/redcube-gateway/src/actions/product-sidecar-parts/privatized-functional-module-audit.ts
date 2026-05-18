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
  product_entry_session_store: {
    expectation_ref: '/opl_generic_primitive_consumption',
    opl_replacement_surface: 'opl_app_session_shell_and_workbench',
    rca_projection_mode: 'entry_session_domain_snapshot_refs_only',
    rca_exports_only: [
      'entry_session_id',
      'topic_deliverable_run_locator_refs',
      'latest_visual_run_ref',
      'domain_snapshot_ref',
    ],
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
    rca_exports_only: [
      'family_action_catalog_refs',
      'guarded_action_refs',
      'domain_handler_refs',
      'direct_domain_entry_refs',
    ],
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

export const RCA_BRIDGE_EXIT_REQUIRED_GATES = Object.freeze([
  'domain_authority_refs_preserved',
  'no_regression_proof_recorded',
]);

export const RCA_BRIDGE_EXIT_AUTHORITY_ALLOWLIST = Object.freeze([
  'source_readiness_verdict',
  'communication_visual_direction_decision',
  'review_export_verdict',
  'artifact_mutation_authorization',
  'visual_memory_accept_reject',
  'owner_receipt_signer',
  'native_helper_implementation',
  'typed_blocker',
  'safe_action_refs',
]);

const MODULE_BRIDGE_EXIT_PROFILES = Object.freeze({
  product_entry_session_store: {
    bridge_role: 'entry_session_snapshot_adapter_until_opl_generated_session_shell_live',
    replacement_owner: 'opl',
    exit_gate_ref: '/opl_generated_interface_consumption',
    retained_authority: ['entry_session_domain_refs', 'deliverable_locator_refs', 'latest_visual_run_ref'],
    after_exit_rca_surface: 'domain_session_snapshot_refs_only',
  },
  workspace_source_intake: {
    bridge_role: 'source_readiness_adapter_until_opl_workspace_source_shell_live',
    replacement_owner: 'opl',
    exit_gate_ref: '/opl_substrate_adapter_export',
    retained_authority: ['source_readiness_verdict', 'communication_strategy_inputs', 'visual_source_pack_refs'],
    after_exit_rca_surface: 'source_readiness_verdict_and_source_pack_refs',
  },
  memory_writeback_receipt_transport: {
    bridge_role: 'memory_receipt_locator_adapter_until_opl_memory_transport_live',
    replacement_owner: 'opl',
    exit_gate_ref: '/opl_generic_primitive_consumption/functional_harness_consumer_coverage/chain_authority/memory_refs_only_writeback_chain',
    retained_authority: ['visual_memory_accept_reject', 'visual_memory_body', 'owner_receipt_refs'],
    after_exit_rca_surface: 'visual_memory_decision_and_receipt_refs',
  },
  artifact_export_lifecycle: {
    bridge_role: 'artifact_locator_authority_adapter_until_opl_gallery_handoff_shell_live',
    replacement_owner: 'opl',
    exit_gate_ref: '/opl_generic_primitive_consumption/consumed_projection_surfaces/artifact_lifecycle',
    retained_authority: ['artifact_mutation_authorization', 'review_export_verdict', 'artifact_locator_refs'],
    after_exit_rca_surface: 'artifact_authority_and_export_verdict_refs',
  },
  review_repair_transport: {
    bridge_role: 'review_repair_refs_adapter_until_opl_review_repair_transport_live',
    replacement_owner: 'opl',
    exit_gate_ref: '/opl_generic_primitive_consumption/consumed_projection_surfaces/review_repair_transport',
    retained_authority: ['review_export_verdict', 'repair_decision_refs', 'typed_blocker'],
    after_exit_rca_surface: 'review_export_verdict_and_repair_refs',
  },
  native_helper_envelope: {
    bridge_role: 'native_helper_execution_adapter_until_opl_generic_envelope_live',
    replacement_owner: 'opl',
    exit_gate_ref: '/opl_generic_primitive_consumption/consumed_projection_surfaces/native_helper_generic_envelope',
    retained_authority: ['native_helper_implementation', 'helper_proof_refs'],
    after_exit_rca_surface: 'native_helper_package_module_implementation',
  },
  operator_projection_shell: {
    bridge_role: 'operator_evidence_refs_adapter_until_opl_app_workbench_shell_live',
    replacement_owner: 'opl',
    exit_gate_ref: '/operator_evidence_readiness_projection',
    retained_authority: ['evidence_gap_refs', 'typed_blocker_refs', 'safe_repair_hint_refs'],
    after_exit_rca_surface: 'operator_evidence_refs_only',
  },
  generic_cli_mcp_wrappers: {
    bridge_role: 'domain_handler_target_until_opl_generated_wrappers_are_default_callers',
    replacement_owner: 'one-person-lab',
    exit_gate_ref: '/visual_pack_compiler_handoff/generated_surface_handoff',
    retained_authority: ['domain_handler_refs', 'safe_action_refs'],
    after_exit_rca_surface: 'domain_handler_target_only',
  },
  codex_executor_adapter: {
    bridge_role: 'route_executor_policy_adapter_until_opl_executor_adapter_live',
    replacement_owner: 'opl',
    exit_gate_ref: '/domain_entry_contract/executor',
    retained_authority: ['route_policy_refs', 'executor_requirement_refs', 'executor_receipt_refs'],
    after_exit_rca_surface: 'route_level_executor_policy_refs',
  },
  observability_stability_read_model: {
    bridge_role: 'stability_refs_consumer_until_opl_observability_read_model_live',
    replacement_owner: 'opl',
    exit_gate_ref: '/opl_stability_read_model_consumption',
    retained_authority: ['owner_receipt_refs', 'typed_blocker_refs', 'no_regression_evidence_refs'],
    after_exit_rca_surface: 'visual_domain_status_refs_only',
  },
  visual_pack_compiler_handoff: {
    bridge_role: 'declarative_visual_pack_input_required_by_opl_pack_compiler',
    replacement_owner: 'redcube_ai',
    exit_gate_ref: '/visual_pack_compiler_handoff',
    retained_authority: ['visual_stage_pack', 'action_metadata', 'receipt_schema_refs'],
    after_exit_rca_surface: 'declarative_visual_pack_input',
  },
  visual_authority_functions: {
    bridge_role: 'not_a_bridge_minimal_domain_authority',
    replacement_owner: 'redcube_ai',
    exit_gate_ref: '/visual_pack_compiler_handoff/minimal_authority_function_contract',
    retained_authority: [...RCA_BRIDGE_EXIT_AUTHORITY_ALLOWLIST],
    after_exit_rca_surface: 'minimal_domain_authority_functions',
  },
});

export function buildBridgeExitGate(entry, replacementGuard = {}) {
  const profile = MODULE_BRIDGE_EXIT_PROFILES[entry.module_id] || {};
  const replacementSurface = replacementGuard.opl_replacement_surface || entry.opl_generic_primitive || 'domain_authority_function';
  const isAuthorityFunction = entry.module_id === 'visual_authority_functions';
  const isDeclarativePack = entry.module_id === 'visual_pack_compiler_handoff';
  return {
    gate_id: `${entry.module_id}_bridge_exit_gate`,
    bridge_role: profile.bridge_role || 'refs_only_adapter_until_opl_replacement_live',
    bridge_owner: isAuthorityFunction || isDeclarativePack ? 'redcube_ai' : 'redcube_ai_migration_bridge',
    replacement_owner: profile.replacement_owner || 'opl',
    replacement_surface: replacementSurface,
    exit_gate_ref: profile.exit_gate_ref || replacementGuard.expectation_ref || '/opl_generic_primitive_consumption',
    current_status: isAuthorityFunction ? 'retained_domain_authority' : 'bridge_until_exit_gates_pass',
    required_before_retire: isAuthorityFunction || isDeclarativePack
      ? []
      : [...RCA_BRIDGE_EXIT_REQUIRED_GATES],
    retained_rca_authority: profile.retained_authority || entry.rcaRetains || [],
    after_exit_rca_surface: profile.after_exit_rca_surface || 'refs_only_domain_authority_adapter',
    can_delete_without_no_active_caller_proof: false,
    declares_replacement_complete: false,
    rca_can_own_replacement_runtime: false,
    opl_can_write_visual_truth: false,
    opl_can_store_artifact_blob: false,
    opl_can_write_memory_body: false,
    opl_can_authorize_review_export_verdict: false,
    opl_can_issue_owner_receipt: false,
  };
}

export function buildFunctionalModulePhysicalDeletionGuard(entry) {
  return {
    safe_to_delete_now: false,
    reason: `${entry.module_id} is a retained RCA domain authority or refs-only projection; physical deletion would remove current domain behavior.`,
    required_before_delete: [
      'domain_authority_refs_preserved',
      'no_regression_proof_recorded',
    ],
  };
}

export function buildPrivateGenericResidueBridgeExitGate(moduleItems) {
  return {
    gate_id: 'rca.private_generic_residue_bridge_exit.v1',
    status: 'functional_bridge_exited_physical_cleanup_closed_evidence_open',
    owner: 'redcube_ai',
    replacement_owner: 'opl',
    required_before_retiring_remaining_repo_local_bridges: [...RCA_BRIDGE_EXIT_REQUIRED_GATES],
    remaining_bridge_module_ids: moduleItems.map((entry) => entry.module_id),
    allowed_after_exit_rca_surface_classes: [
      'declarative_pack',
      'minimal_authority_function',
      'refs_only_locator_projection',
      'diagnostic_direct_surface',
    ],
    forbidden_after_exit_rca_surface_classes: [
      'generic_scheduler',
      'generic_attempt_ledger',
      'generic_session_shell',
      'generic_cli_mcp_product_wrapper',
      'generic_workbench_shell',
      'generic_review_repair_transport',
      'generic_native_helper_envelope',
    ],
    declares_generated_surface_consumption_complete: true,
    declares_production_consumption_complete: true,
    production_consumption_scope: 'opl_generated_surface_consumption_only_not_visual_stage_live_soak',
    declares_visual_stage_long_soak_complete: false,
    declares_no_active_callers: true,
    remaining_blocker_ids: [
      'production_live_soak_and_evidence',
    ],
  };
}

export function buildVisualPackCompilerHandoffAuditModule() {
  return {
    module_id: 'visual_pack_compiler_handoff',
    surface_ref: '/visual_pack_compiler_handoff/declarative_visual_pack_input',
    status: 'declarative_pack_input_landed',
    classification: 'declarative_pack',
    migration_class: 'declarative_pack',
    owner: 'redcube_ai',
    opl_owned_generic_primitive_consumer: false,
    rca_owned_visual_domain_authority: false,
    opl_absorb_candidate: false,
    opl_replacement_expectation: {
      owner: 'opl',
      expectation_ref: '/visual_pack_compiler_handoff/generated_surface_handoff',
      replacement_surface: 'opl_pack_compiler_generated_surface',
      expected_mode: 'opl_generated_surface_from_declarative_pack',
      rca_consumes_as: 'declarative_pack_provider',
      rca_owns_replacement_runtime: false,
    },
    codePaths: [
      'packages/redcube-gateway/src/actions/product-sidecar-parts/visual-pack-compiler-handoff.ts',
    ],
    activeCallers: ['product-entry manifest', 'product sidecar export', 'product status'],
    activeCallerStatus: 'declarative_pack_input_active',
    migrationAction: 'Provide declarative visual pack input for OPL-generated CLI/MCP/product-entry/sidecar/status/session/workbench/harness surfaces.',
    retentionReason: 'RCA retains visual stage, action, policy, receipt and fixture declarations as domain pack input.',
    cannotAbsorbReason: 'OPL can generate wrappers from this input, but cannot own RCA visual truth, review/export verdicts or artifact authority.',
    rca_projection_mode: 'declarative_pack_refs_only',
    rca_exports_only: ['stage_refs', 'action_metadata_refs', 'visual_transition_refs', 'receipt_schema_refs'],
    forbidden_generic_owner_flags: { ...FUNCTIONAL_MODULE_FORBIDDEN_OWNER_FLAGS },
    physical_deletion_guard: {
      safe_to_delete_now: false,
      reason: 'Declarative pack input is a required RCA domain package surface, not a generic runtime shell.',
      required_before_delete: ['domain_package_replaced_by_new_rca_pack_contract'],
    },
    bridge_exit_gate: buildBridgeExitGate({
      module_id: 'visual_pack_compiler_handoff',
      opl_generic_primitive: 'visual_pack_compiler_handoff',
      rcaRetains: ['visual_stage_pack', 'action_metadata', 'authority_policy', 'oracle_fixtures'],
    }, {
      expectation_ref: '/visual_pack_compiler_handoff/generated_surface_handoff',
      opl_replacement_surface: 'opl_pack_compiler_generated_surface',
    }),
    rca_retains: ['visual_stage_pack', 'action_metadata', 'authority_policy', 'oracle_fixtures'],
    retire_tombstone: false,
    tombstone_required: false,
    writes_visual_truth: false,
    writes_artifact_blob: false,
    writes_memory_body: false,
    declares_visual_ready: false,
    declares_exportable: false,
    declares_handoffable: false,
    declares_production_soak_complete: false,
  };
}

export function buildVisualAuthorityFunctionsAuditModule() {
  const rcaRetains = [
    'source_readiness_verdict',
    'communication_visual_direction_decision',
    'review_export_verdict',
    'artifact_mutation_authorization',
    'visual_memory_accept_reject',
    'owner_receipt_signer',
    'native_helper_implementation',
  ];
  return {
    module_id: 'visual_authority_functions',
    surface_ref: '/visual_pack_compiler_handoff/minimal_authority_function_contract',
    status: 'minimal_authority_function_manifest_landed',
    classification: 'minimal_authority_function',
    migration_class: 'minimal_authority_function',
    owner: 'redcube_ai',
    opl_owned_generic_primitive_consumer: false,
    rca_owned_visual_domain_authority: true,
    opl_absorb_candidate: false,
    opl_replacement_expectation: {
      owner: 'redcube_ai',
      expectation_ref: '/visual_pack_compiler_handoff/minimal_authority_function_contract',
      replacement_surface: 'not_absorbable_domain_authority_function',
      expected_mode: 'domain_authority_function_called_by_generated_surface',
      rca_consumes_as: 'authority_function_owner',
      rca_owns_replacement_runtime: false,
    },
    codePaths: [
      'packages/redcube-gateway/src/actions/product-sidecar-parts/visual-pack-compiler-handoff.ts',
      'packages/redcube-gateway/src/actions/product-sidecar.ts',
      'packages/redcube-runtime/src',
    ],
    activeCallers: ['visual route execution', 'review/export gates', 'memory writeback acceptance', 'owner receipt signing'],
    activeCallerStatus: 'minimal_authority_functions_active',
    migrationAction: 'Retain only visual authority functions while OPL generates generic wrappers and runtime shells.',
    retentionReason: 'RCA must decide visual source readiness, visual direction, review/export verdicts, artifact mutation, visual memory acceptance and owner receipts.',
    cannotAbsorbReason: 'These functions are RCA domain authority and cannot be moved to OPL without moving visual truth.',
    rca_projection_mode: 'authority_receipt_refs_only',
    rca_exports_only: ['verdict_refs', 'owner_receipt_refs', 'typed_blocker_refs', 'safe_action_refs'],
    forbidden_generic_owner_flags: { ...FUNCTIONAL_MODULE_FORBIDDEN_OWNER_FLAGS },
    physical_deletion_guard: {
      safe_to_delete_now: false,
      reason: 'Minimal authority functions are the allowed RCA retention surface.',
      required_before_delete: ['visual_domain_authority_moved_by_explicit_product_decision'],
    },
    bridge_exit_gate: buildBridgeExitGate({
      module_id: 'visual_authority_functions',
      opl_generic_primitive: 'minimal_authority_functions',
      rcaRetains,
    }, {
      expectation_ref: '/visual_pack_compiler_handoff/minimal_authority_function_contract',
      opl_replacement_surface: 'not_absorbable_domain_authority_function',
    }),
    rca_retains: rcaRetains,
    retire_tombstone: false,
    tombstone_required: false,
    writes_visual_truth: false,
    writes_artifact_blob: false,
    writes_memory_body: false,
    declares_visual_ready: false,
    declares_exportable: false,
    declares_handoffable: false,
    declares_production_soak_complete: false,
  };
}
