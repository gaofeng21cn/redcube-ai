// @ts-nocheck

const DOMAIN_ID = 'redcube_ai';
const OPL_OWNER = 'one-person-lab';
const OPL_TEMPORAL_RUNTIME_OWNER = 'one-person-lab/OPL';

export function buildTemporalStageRunConsumptionPolicy() {
  return {
    surface_kind: 'temporal_stage_run_consumption_policy',
    policy_id: 'rca.temporal_stage_run_consumption_policy.v1',
    target_domain_id: DOMAIN_ID,
    owner: DOMAIN_ID,
    temporal_runtime_owner: OPL_TEMPORAL_RUNTIME_OWNER,
    temporal_attempt_ledger_owner: OPL_TEMPORAL_RUNTIME_OWNER,
    provider_owner: OPL_OWNER,
    consumer_role: 'refs_only_domain_agent_consumer',
    stage_run_ref_policy: 'consume_opl_temporal_backed_stage_run_and_provider_attempt_refs_only',
    provider_completion_is_domain_completion: false,
    provider_completion_is_visual_ready: false,
    provider_completion_is_exportable: false,
    provider_completion_is_handoffable: false,
    generated_surface_ready_can_claim_domain_ready: false,
    domain_repo_can_own_temporal_runtime: false,
    domain_repo_can_write_opl_stage_attempts: false,
    rca_writes_opl_stage_attempts: false,
    rca_owns_generic_runner: false,
    rca_owns_provider_queue: false,
    rca_owns_provider_attempt_ledger: false,
    allowed_consumed_refs: [
      'opl_stage_run_ref',
      'provider_attempt_ref',
      'provider_attempt_ledger_ref',
      'stage_attempt_ref',
      'stage_attempt_lease_ref',
      'stage_attempt_receipt_ref',
      'provider_completion_ref',
    ],
    domain_completion_closeout_refs: [
      'owner_receipt_ref',
      'typed_blocker_ref',
      'human_gate_ref',
      'route_back_ref',
      'review_export_receipt_ref',
      'artifact_authority_receipt_ref',
      'no_regression_evidence_ref',
    ],
    forbidden_domain_completion_sources: [
      'provider_completion',
      'generated_surface_ready',
      'stage_run_terminal_state',
      'queue_empty',
      'attempt_ledger_written',
      'workbench_projection_current',
      'descriptor_conformance_pass',
    ],
    forbidden_domain_writes: [
      'opl_stage_attempt',
      'opl_provider_attempt_ledger',
      'opl_queue_state',
      'provider_completion_record',
      'visual_truth_body',
      'artifact_body',
      'review_export_verdict_body',
      'visual_memory_body',
    ],
    route_back_policy: {
      owner: DOMAIN_ID,
      route_back_ref_required_when_domain_cannot_close: true,
      typed_blocker_ref_required_for_non_human_blocker: true,
      human_gate_ref_required_for_human_decision: true,
      owner_receipt_ref_required_for_domain_completion: true,
    },
    source_refs: {
      temporal_autonomy_readiness_ref: '/temporal_autonomy_readiness',
      family_stage_control_plane_ref: 'contracts/stage_control_plane.json',
      domain_owner_receipt_contract_ref: '/domain_owner_receipt_contract',
      domain_action_adapter_ref: '/mapped_surfaces/temporal_stage_run_consumption_policy',
    },
  };
}
