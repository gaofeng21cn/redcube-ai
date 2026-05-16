// @ts-nocheck

export const SIDECAR_GUARDED_ACTIONS = Object.freeze([
  {
    action: 'runtime_watch',
    effect: 'read_only',
    summary: 'Read RCA runtimeWatch for an existing run locator.',
    required_fields: ['workspace_root', 'topic_id', 'deliverable_id', 'run_id'],
    api_surface: 'runtimeWatch',
  },
  {
    action: 'supervise_managed_run',
    effect: 'guarded_runtime_tick',
    summary: 'Run one RCA-owned superviseManagedRun tick for an existing managed run.',
    required_fields: ['workspace_root', 'managed_run_id'],
    api_surface: 'superviseManagedRun',
  },
  {
    action: 'product_entry_continuation',
    effect: 'guarded_product_entry_continuation',
    summary: 'Continue the same RCA product-entry session through RCA-owned gates.',
    required_fields: ['workspace_root', 'entry_session_id'],
    api_surface: 'invokeProductEntry',
  },
  {
    action: 'emit_no_regression_evidence',
    effect: 'guarded_runtime_evidence_write',
    summary: 'Emit RCA-owned no-regression evidence refs for descriptor/runtime surfaces without writing visual artifacts or claiming long soak.',
    required_fields: ['workspace_root', 'evidence_id'],
    api_surface: 'productSidecarEmitNoRegressionEvidence',
  },
  {
    action: 'emit_domain_owner_receipt',
    effect: 'guarded_domain_owner_receipt_write',
    summary: 'Emit an RCA-owned domain receipt instance into workspace runtime receipts when required refs are present; otherwise return a typed blocker.',
    required_fields: [
      'workspace_root',
      'receipt_id',
      'attempt_ref',
      'artifact_locator_ref',
      'memory_receipt_ref',
      'lifecycle_receipt_ref',
      'review_export_ref',
      'forbidden_write_proof_ref',
    ],
    api_surface: 'productSidecarEmitDomainOwnerReceipt',
  },
  {
    action: 'apply_visual_memory_writeback',
    effect: 'guarded_domain_memory_receipt_write',
    summary: 'Apply an RCA-owned visual pattern memory accept/reject decision and write a locator-only runtime receipt.',
    required_fields: [
      'workspace_root',
      'proposal_id',
      'decision',
      'decision_owner',
      'source_review_ref',
      'candidate_memory_ref',
    ],
    api_surface: 'productSidecarApplyVisualMemoryWriteback',
  },
  {
    action: 'apply_visual_workspace_lifecycle',
    effect: 'guarded_lifecycle_receipt_write',
    summary: 'Emit RCA-owned cleanup/restore/retention receipts for visual workspace lifecycle requests without mutating artifacts from the sidecar.',
    required_fields: [
      'workspace_root',
      'operation',
      'receipt_id',
      'domain_receipt_ref',
      'artifact_locator_ref',
    ],
    api_surface: 'productSidecarApplyVisualWorkspaceLifecycle',
  },
  {
    action: 'emit_workspace_receipt_proof',
    effect: 'guarded_workspace_receipt_proof_write',
    summary: 'Emit a workspace-runtime proof pack that chains RCA-owned memory, lifecycle, no-regression, and domain owner receipt refs without writing visual artifacts or OPL generic runtime state.',
    required_fields: [
      'workspace_root',
      'proof_id',
      'attempt_ref',
      'artifact_locator_ref',
      'review_export_ref',
      'forbidden_write_proof_ref',
    ],
    api_surface: 'productSidecarEmitWorkspaceReceiptProof',
  },
  {
    action: 'notification_receipt',
    effect: 'control_plane_ack_only',
    summary: 'Acknowledge an OPL/Hermes notification without writing RCA visual truth, review verdict, or publication gate.',
    required_fields: ['notification_id'],
    api_surface: 'none',
  },
]);

export const SIDECAR_FORBIDDEN_WRITES = Object.freeze([
  'visual_truth',
  'review_verdict',
  'publication_gate',
  'canonical_artifacts',
]);

export const SIDECAR_BLOCKED_ACTIONS = Object.freeze([
  'write_visual_truth',
  'write_canonical_artifacts',
  'write_review_verdict',
  'write_publication_gate',
  'mutate_review_state',
  'publish_export_bundle',
]);

export const RCA_RETAINED_VISUAL_AUTHORITY = Object.freeze([
  'visual_truth',
  'review_export_verdict',
  'artifact_authority',
  'visual_memory_body',
  'owner_receipt',
  'native_helper_implementation',
  'typed_blocker',
  'safe_action_refs',
]);

export const OPL_OWNED_GENERIC_PRIMITIVES = Object.freeze([
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
]);

export const OPL_STABILITY_READ_MODEL_SURFACES = Object.freeze([
  'family_conflict_envelope',
  'control_loop_summary',
  'usage_projection',
  'resource_pressure',
  'observability_export',
  'external_stability_policy',
]);

export const OPL_FUNCTIONAL_HARNESS_COVERAGE = Object.freeze({
  harness_role: 'functional_harness_consumer',
  coverage_status: 'domain_authority_pack_landed',
  pass_claim_scope: 'consumer_contract_coverage_only',
  opl_harness_pass_is_visual_ready: false,
  opl_harness_pass_is_exportable: false,
  opl_harness_pass_is_handoffable: false,
  opl_harness_pass_is_artifact_producing_owner_receipt: false,
  rca_generic_runtime_owner: false,
  covered_chains: [
    'memory_refs_only_writeback_chain',
    'queue_stage_attempt_typed_closeout',
    'generic_transition_runner',
    'restart_dead_letter_repair_human_gate_state_chain',
  ],
  chain_authority: {
    memory_refs_only_writeback_chain: {
      owner: 'opl',
      rca_retains: ['visual_memory_body', 'owner_receipt', 'typed_blocker'],
      rca_exports_only: ['memory_locator_refs', 'writeback_receipt_refs', 'safe_action_refs'],
      memory_body_written_by_opl: false,
    },
    queue_stage_attempt_typed_closeout: {
      owner: 'opl',
      rca_retains: ['visual_truth', 'review_export_verdict', 'artifact_authority', 'owner_receipt'],
      rca_exports_only: ['stage_descriptor_refs', 'attempt_source_refs', 'typed_closeout_receipt_refs'],
      artifact_produced_by_harness_pass: false,
    },
    generic_transition_runner: {
      owner: 'opl',
      rca_retains: ['visual_transition_spec', 'typed_blocker', 'safe_action_refs'],
      rca_exports_only: ['transition_spec_ref', 'transition_result_refs', 'owner_receipt_refs'],
      visual_ready_declared_by_runner: false,
    },
    restart_dead_letter_repair_human_gate_state_chain: {
      owner: 'opl',
      rca_retains: ['typed_blocker', 'safe_action_refs', 'review_export_verdict'],
      rca_exports_only: ['repair_hint_refs', 'human_gate_reason_refs', 'dead_letter_receipt_refs'],
      handoffable_declared_by_state_chain: false,
    },
  },
});

export function buildFamilySchedulerReplacementProjection() {
  return {
    ref: '/family_scheduler_replacement',
    contract_ref: 'opl.family_scheduler_replacement.v1',
    owner: 'opl',
    consumer: 'redcube_ai',
    projection_mode: 'consumer_projection_only',
    rca_generic_scheduler_owner: false,
    rca_generic_daemon_owner: false,
    rca_generic_lifecycle_owner: false,
    rca_generic_queue_owner: false,
    rca_generic_attempt_ledger_owner: false,
    rca_generic_runner_owner: false,
    rca_generic_workbench_owner: false,
    rca_thin_surface_role: 'visual_domain_authority_pack_plus_thin_program_surface',
    projection_scope: 'consumer_projection_and_visual_domain_authority_refs_only',
    opl_owned_generic_surfaces: [
      'family_scheduler',
      'daemon',
      'generic_lifecycle',
      'typed_queue',
      'attempt_ledger',
      'generic_runner',
      'workbench_shell',
    ],
    managed_dag_scheduler_scope: 'visual_deliverable_internal_dag_only',
    rca_retained_authority: [...RCA_RETAINED_VISUAL_AUTHORITY],
  };
}

export function buildOplStabilityReadModelConsumptionProjection() {
  return {
    ref: '/opl_stability_read_model_consumption',
    contract_ref: 'opl.family_operator_stability_read_model.v1',
    owner: 'opl',
    consumer: 'redcube_ai',
    status: 'refs_only_consumer_projection_landed',
    projection_mode: 'consumer_projection_only',
    observability_only: true,
    rca_surface_role: 'visual_domain_authority_pack_plus_thin_program_surface',
    completion_scope: 'stability_read_model_refs_projected_not_live_soak',
    live_soak_claimed: false,
    consumed_read_model_surfaces: [
      {
        surface: 'family_conflict_envelope',
        contract_ref: 'contracts/family-orchestration/family-conflict-envelope.schema.json',
        rca_consumes: 'typed_blocker_or_conflict_refs_only',
      },
      {
        surface: 'control_loop_summary',
        contract_ref: 'contracts/opl-framework/family-product-operator-projection.json#/required_projection_fields/control_loop_summary',
        rca_consumes: 'trigger_decision_route_receipt_blocker_refs_only',
      },
      {
        surface: 'usage_projection',
        contract_ref: 'contracts/opl-framework/family-runtime-attempt-contract.json#/stability_projection_fields/usage_projection',
        rca_consumes: 'observed_usage_refs_only',
      },
      {
        surface: 'resource_pressure',
        contract_ref: 'contracts/opl-framework/family-product-operator-projection.json#/required_projection_fields/resource_pressure',
        rca_consumes: 'observed_retry_budget_pressure_refs_only',
      },
      {
        surface: 'observability_export',
        contract_ref: 'opl runtime observability-export [--format json|openmetrics]',
        rca_consumes: 'read_only_counter_export_refs_only',
      },
      {
        surface: 'external_stability_policy',
        contract_ref: 'contracts/opl-framework/family-product-operator-projection.json#/external_stability_learning_policy',
        rca_consumes: 'policy_boundary_refs_only',
      },
    ],
    rca_does_not_own: [
      'family_conflict_envelope_schema',
      'control_loop_summary_builder',
      'usage_projection_aggregator',
      'resource_pressure_projection',
      'runtime_observability_exporter',
      'external_stability_policy_runtime',
      'generic_fallback_completion',
      'string_rule_retry_execution',
      'generic_event_bus_truth_source',
      'generic_runtime_adapter_success_semantics',
    ],
    rca_retained_authority: [...RCA_RETAINED_VISUAL_AUTHORITY],
    authority_boundary: {
      opl_can_execute_rca_domain_action: false,
      opl_can_write_rca_domain_truth: false,
      opl_can_authorize_visual_ready: false,
      opl_can_authorize_quality_verdict: false,
      opl_can_authorize_exportable: false,
      opl_can_write_artifact_blob: false,
      opl_can_write_visual_memory_body: false,
      provider_completion_is_visual_ready: false,
      generic_fallback_can_mark_success: false,
      string_retry_can_drive_execution: false,
      event_bus_can_be_truth_source: false,
      runtime_adapter_started_is_behavior_equivalent: false,
    },
    forbidden_rca_stability_owner_flags: {
      rca_family_conflict_envelope_owner: false,
      rca_control_loop_summary_owner: false,
      rca_usage_projection_owner: false,
      rca_resource_pressure_owner: false,
      rca_observability_export_owner: false,
      rca_external_stability_policy_owner: false,
      rca_generic_fallback_completion_owner: false,
      rca_string_rule_retry_execution_owner: false,
      rca_generic_event_bus_truth_owner: false,
      rca_runtime_adapter_success_semantics_owner: false,
    },
  };
}

export function buildOplGenericPrimitiveConsumptionProjection() {
  return {
    ref: '/opl_generic_primitive_consumption',
    contract_ref: 'opl.standard_domain_agent_scaffold_and_generic_primitives.v1',
    owner: 'opl',
    consumer: 'redcube_ai',
    status: 'functional_consumer_follow_through_landed',
    projection_mode: 'consumer_projection_only',
    rca_surface_role: 'visual_domain_authority_pack_plus_thin_program_surface',
    completion_scope: 'functional_consumer_follow_through_complete_not_live_soak',
    live_soak_claimed: false,
    rca_does_not_own: [...OPL_OWNED_GENERIC_PRIMITIVES],
    opl_owned_generic_primitives: [...OPL_OWNED_GENERIC_PRIMITIVES],
    rca_retained_authority: [...RCA_RETAINED_VISUAL_AUTHORITY],
    functional_harness_consumer_coverage: OPL_FUNCTIONAL_HARNESS_COVERAGE,
    rca_thin_program_surfaces: [
      'single redcube-ai app skill',
      'service-safe domain entry',
      'product sidecar projection',
      'stage control projection',
      'visual transition spec',
      'artifact locator refs',
      'review/export gate refs',
      'owner receipt refs',
      'native helper implementation refs',
    ],
    consumed_projection_surfaces: [
      {
        primitive: 'standard_domain_agent_scaffold',
        contract_ref: 'contracts/runtime-program/opl-family-contract-adoption.json#/standard_domain_agent_skeleton',
        manifest_ref: '/standard_domain_agent_skeleton',
        sidecar_ref: '/mapped_surfaces/standard_domain_agent_skeleton',
      },
      {
        primitive: 'generic_scheduler',
        contract_ref: 'contracts/runtime-program/opl-family-contract-adoption.json#/family_scheduler_replacement',
        manifest_ref: '/family_scheduler_replacement',
        sidecar_ref: '/runtime_framework/family_scheduler_replacement',
      },
      {
        primitive: 'memory_transport',
        contract_ref: 'contracts/runtime-program/opl-family-contract-adoption.json#/standard_domain_agent_skeleton/domain_memory_descriptor_locator',
        manifest_ref: '/domain_memory_descriptor_locator',
        sidecar_ref: '/mapped_surfaces/visual_pattern_memory_writeback',
      },
      {
        primitive: 'artifact_lifecycle',
        contract_ref: 'contracts/runtime-program/opl-family-contract-adoption.json#/standard_domain_agent_skeleton/lifecycle_guarded_apply_proof',
        manifest_ref: '/lifecycle_guarded_apply_proof',
        sidecar_ref: '/mapped_surfaces/lifecycle_guarded_apply',
      },
      {
        primitive: 'review_repair_transport',
        contract_ref: 'contracts/runtime-program/opl-family-contract-adoption.json#/quality_projection',
        manifest_ref: '/review_state',
        sidecar_ref: '/mapped_surfaces/review_projection',
      },
      {
        primitive: 'native_helper_generic_envelope',
        contract_ref: 'contracts/runtime-program/python-native-helper-catalog.json',
        manifest_ref: '/native_ppt_operator_ux',
        sidecar_ref: '/mapped_surfaces/native_helper_implementation',
      },
    ],
    forbidden_rca_generic_owner_flags: {
      rca_generic_scheduler_owner: false,
      rca_generic_runtime_owner: false,
      rca_generic_daemon_owner: false,
      rca_generic_queue_owner: false,
      rca_stage_attempt_orchestrator_owner: false,
      rca_generic_attempt_ledger_owner: false,
      rca_typed_closeout_transport_owner: false,
      rca_generic_runner_owner: false,
      rca_generic_transition_runner_owner: false,
      rca_generic_workbench_owner: false,
      rca_memory_transport_owner: false,
      rca_memory_refs_only_writeback_chain_owner: false,
      rca_artifact_lifecycle_owner: false,
      rca_review_repair_transport_owner: false,
      rca_restart_dead_letter_repair_human_gate_state_chain_owner: false,
      rca_native_helper_generic_envelope_owner: false,
    },
  };
}

export function listProductSidecarGuardedActions() {
  return SIDECAR_GUARDED_ACTIONS.map((entry) => ({ ...entry }));
}

export function listProductSidecarGuardedActionIds() {
  return SIDECAR_GUARDED_ACTIONS.map((entry) => entry.action);
}

export function productSidecarGuardedActionSet() {
  return new Set(listProductSidecarGuardedActionIds());
}

export function listProductSidecarForbiddenWrites() {
  return [...SIDECAR_FORBIDDEN_WRITES];
}

export function listProductSidecarBlockedActions() {
  return [...SIDECAR_BLOCKED_ACTIONS];
}
