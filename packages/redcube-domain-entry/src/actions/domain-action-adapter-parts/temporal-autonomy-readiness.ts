// @ts-nocheck

const DOMAIN_ID = 'redcube_ai';
const OPL_OWNER = 'one-person-lab';
const TEMPORAL_PROVIDER = 'temporal';
const OPL_TEMPORAL_RUNTIME_OWNER = 'one-person-lab/OPL';

function ref(value, fallback) {
  return String(value || fallback);
}

export function buildTemporalAutonomyReadinessProjection({
  familySchedulerReplacement,
  oplGenericPrimitiveConsumption,
  oplStabilityReadModelConsumption,
  domainAuthorityRefs,
  runtimeInventory,
  taskLifecycle,
  domainActionAdapterGuardedActionIds = [],
} = {}) {
  const controlledSoak = domainAuthorityRefs?.controlled_soak_no_regression_attempt || {};
  const domainOwnerReceiptContract = domainAuthorityRefs?.domain_owner_receipt_contract || {};
  const noRegressionProof = domainAuthorityRefs?.no_regression_owner_receipt_opl_consumption_proof || {};

  return {
    surface_kind: 'temporal_autonomy_readiness',
    readiness_id: 'rca.temporal_autonomy_readiness.v1',
    target_domain_id: DOMAIN_ID,
    owner: DOMAIN_ID,
    provider_owner: OPL_OWNER,
    temporal_runtime_owner: OPL_TEMPORAL_RUNTIME_OWNER,
    temporal_attempt_ledger_owner: OPL_TEMPORAL_RUNTIME_OWNER,
    provider_kind_required_for_production: TEMPORAL_PROVIDER,
    status: 'standard_default_opl_temporal_hosted_autonomy_enabled_evidence_pending',
    can_be_opl_temporal_hosted: true,
    default_opl_temporal_hosted_autonomy_enabled: true,
    task_start_handoff_is_persistent_opl_temporal_scheduling: true,
    codex_app_outer_loop_required_after_task_start: false,
    long_time_autonomy_claimed: true,
    production_visual_stage_long_soak_complete: false,
    default_executor: 'codex_cli',
    rca_owns_generic_scheduler_or_daemon: false,
    rca_owns_generic_attempt_loop: false,
    rca_owns_generic_attempt_ledger: false,
    domain_repo_can_own_temporal_runtime: false,
    rca_writes_opl_stage_attempts: false,
    source_refs: {
      family_scheduler_replacement_ref: '/family_scheduler_replacement',
      opl_generic_primitive_consumption_ref: '/opl_generic_primitive_consumption',
      opl_stability_read_model_consumption_ref: '/opl_stability_read_model_consumption',
      family_stage_control_plane_ref: 'contracts/stage_control_plane.json',
      runtime_inventory_ref: '/runtime_inventory',
      task_lifecycle_ref: '/task_lifecycle',
      controlled_soak_no_regression_attempt_ref: '/controlled_soak_no_regression_attempt',
      domain_owner_receipt_contract_ref: '/domain_owner_receipt_contract',
      no_regression_owner_receipt_opl_consumption_proof_ref: '/no_regression_owner_receipt_opl_consumption_proof',
      workspace_receipt_inventory_projection_ref: '/workspace_receipt_inventory_projection',
      provider_proof_command_ref: 'opl family-runtime residency proof --provider temporal --production',
    },
    required_success_evidence: [
      {
        evidence_id: 'temporal_provider_production_residency',
        owner: OPL_OWNER,
        required_status: 'production_residency_proven',
        current_rca_status: 'external_provider_proof_required',
      },
      {
        evidence_id: 'provider_hosted_visual_stage_attempt',
        owner: OPL_OWNER,
        required_surface: 'provider_hosted_stage_attempt',
        current_rca_status: 'descriptor_and_domain_action_adapter_contract_ready_live_soak_pending',
      },
      {
        evidence_id: 'worker_restart_requery_resume',
        owner: OPL_OWNER,
        required_surface: 'temporal_worker_restart_requery_resume_proof',
        current_rca_status: 'live_visual_stage_evidence_pending',
      },
      {
        evidence_id: 'retry_dead_letter_repair_projection',
        owner: OPL_OWNER,
        required_surface: 'retry_dead_letter_repair_human_gate_state_chain',
        current_rca_status: 'contract_ready_live_visual_stage_evidence_pending',
      },
      {
        evidence_id: 'artifact_producing_owner_receipt',
        owner: DOMAIN_ID,
        required_surface: 'domain_owner_receipt',
        current_rca_status: domainOwnerReceiptContract.allowed_return_shapes?.includes('domain_receipt')
          ? 'receipt_contract_ready'
          : 'receipt_contract_missing',
      },
      {
        evidence_id: 'cross_family_no_regression',
        owner: DOMAIN_ID,
        required_surface: 'no_regression_evidence',
        current_rca_status: noRegressionProof.status || 'unknown',
      },
    ],
    capability_gates: [
      {
        gate_id: 'provider_online_management',
        owner: OPL_OWNER,
        status: 'default_enabled',
        required_provider: TEMPORAL_PROVIDER,
        rca_surface_ref: '/opl_generic_primitive_consumption',
        live_proof_required: true,
        rca_can_provide_provider: false,
      },
      {
        gate_id: 'stage_descriptor_handoff',
        owner: DOMAIN_ID,
        status: 'ready',
        rca_surface_ref: 'contracts/stage_control_plane.json',
        opl_consumes_stage_descriptors: true,
      },
      {
        gate_id: 'queue_wakeup_handoff',
        owner: OPL_OWNER,
        status: 'ready',
        rca_surface_ref: '/product_entry_shell/domain_handler',
        required_domain_action_adapter_actions: [
          'emit_no_regression_evidence',
          'emit_temporal_controlled_visual_stage_long_soak_evidence',
          'emit_domain_owner_receipt',
          'emit_workspace_receipt_proof',
        ],
        available_domain_action_adapter_actions: domainActionAdapterGuardedActionIds,
      },
      {
        gate_id: 'progress_requery',
        owner: OPL_OWNER,
        status: 'ready',
        rca_surface_ref: '/runtime_inventory',
        projection_target: 'opl_status_workbench_runtime_read_model',
        retained_rca_read_model_ref: 'runtimeWatch direct review/progress read model',
        domain_action_adapter_dispatch_action_required: false,
        progress_surface_ref: ref(runtimeInventory?.status_surface?.ref, '/product_entry_preflight'),
        resume_surface_ref: ref(taskLifecycle?.resume_surface?.surface_kind, 'product_entry_session'),
      },
      {
        gate_id: 'restart_resume_recovery',
        owner: OPL_OWNER,
        status: 'contract_ready_live_evidence_pending',
        rca_surface_ref: '/task_lifecycle',
        required_probe_ref: 'recovery-probe:longline/temporal-worker-restart-requery',
      },
      {
        gate_id: 'retry_dead_letter_repair',
        owner: OPL_OWNER,
        status: 'contract_ready_live_evidence_pending',
        rca_surface_ref: '/opl_generic_primitive_consumption/functional_harness_consumer_coverage/chain_authority/restart_dead_letter_repair_human_gate_state_chain',
        rca_is_chain_owner: false,
      },
      {
        gate_id: 'domain_closeout_receipts',
        owner: DOMAIN_ID,
        status: 'ready',
        rca_surface_ref: '/domain_owner_receipt_contract',
        allowed_return_shapes: domainOwnerReceiptContract.allowed_return_shapes || [
          'domain_receipt',
          'typed_blocker',
          'no_regression_evidence',
        ],
      },
    ],
    typed_blockers: [
      {
        blocker_ref: controlledSoak.deferred_blocker?.blocker_ref
          || 'rca-typed-blocker:controlled-soak:temporal-long-soak-pending',
        blocker_kind: 'controlled_visual_soak_runtime_evidence_pending',
        remaining_gap_id: 'opl_hosted_controlled_visual_stage_long_soak',
        owner: DOMAIN_ID,
      },
    ],
    current_best_next_actions: [
      {
        owner: OPL_OWNER,
        action_ref: 'opl family-runtime residency proof --provider temporal --production',
        purpose: 'prove provider production residency and restart/re-query substrate',
      },
      {
        owner: OPL_OWNER,
        action_ref: 'agent-lab-longline-task:rca/visual-controlled-soak',
        purpose: 'run provider-hosted visual-stage controlled soak against RCA domain_action_adapter refs',
      },
      {
        owner: DOMAIN_ID,
        action_ref: 'opl_generated:domain_action_adapter dispatch:emit_temporal_controlled_visual_stage_long_soak_evidence',
        purpose: 'return RCA-owned refs-only long-soak evidence or typed blocker for the hosted attempt',
      },
    ],
    projection_inputs: {
      family_scheduler_replacement_status: familySchedulerReplacement?.status || 'unknown',
      generic_primitive_consumption_status: oplGenericPrimitiveConsumption?.status || 'unknown',
      stability_read_model_status: oplStabilityReadModelConsumption?.status || 'unknown',
      controlled_soak_state: controlledSoak.state || 'deferred_typed_blocker',
    },
    authority_boundary: {
      opl_can_schedule_wakeup_retry_dead_letter: true,
      opl_can_query_and_rehydrate_attempt: true,
      opl_can_store_receipt_refs: true,
      opl_can_write_rca_visual_truth: false,
      opl_can_write_rca_memory_body: false,
      opl_can_store_artifact_blob: false,
      opl_can_authorize_review_export_verdict: false,
      rca_owns_generic_daemon_scheduler_attempt_loop: false,
      provider_completion_is_visual_ready: false,
      provider_completion_is_domain_completion: false,
      provider_completion_is_exportable: false,
      provider_completion_is_handoffable: false,
      provider_completion_is_production_soak_complete: false,
      generated_surface_ready_can_claim_domain_ready: false,
      domain_repo_can_own_temporal_runtime: false,
      rca_writes_opl_stage_attempts: false,
    },
  };
}
