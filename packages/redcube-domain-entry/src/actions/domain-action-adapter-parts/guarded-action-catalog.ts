// @ts-nocheck

const DOMAIN_ACTION_ADAPTER_GUARDED_ACTIONS = Object.freeze([
  {
    action: 'emit_no_regression_evidence',
    effect: 'guarded_runtime_evidence_write',
    summary: 'Emit RCA-owned no-regression evidence refs for descriptor/runtime surfaces without writing visual artifacts or claiming long soak.',
    required_fields: ['workspace_root', 'evidence_id'],
    api_surface: 'domainActionAdapterEmitNoRegressionEvidence',
  },
  {
    action: 'emit_temporal_controlled_visual_stage_long_soak_evidence',
    effect: 'guarded_temporal_long_soak_evidence_write',
    summary: 'Emit RCA-owned refs-only Temporal controlled visual-stage long-soak evidence when OPL/Temporal attempt, recovery, independent AI task, owner receipt, review/export, and forbidden-write refs are present.',
    required_fields: [
      'workspace_root',
      'soak_id',
      'temporal_stage_attempt_ref',
      'retry_dead_letter_ref',
      'requery_resume_ref',
      'provider_residency_ref',
      'stage_execution_ai_task_ref',
      'stage_quality_ai_task_ref',
      'domain_owner_receipt_ref',
      'review_export_ref',
      'forbidden_write_proof_ref',
    ],
    api_surface: 'domainActionAdapterEmitTemporalControlledVisualStageLongSoakEvidence',
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
    api_surface: 'domainActionAdapterEmitDomainOwnerReceipt',
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
    api_surface: 'domainActionAdapterApplyVisualMemoryWriteback',
  },
  {
    action: 'apply_visual_workspace_lifecycle',
    effect: 'guarded_lifecycle_receipt_write',
    summary: 'Emit RCA-owned cleanup/restore/retention receipts for visual workspace lifecycle requests without mutating artifacts from the domain_action_adapter.',
    required_fields: [
      'workspace_root',
      'operation',
      'receipt_id',
      'domain_receipt_ref',
      'artifact_locator_ref',
    ],
    api_surface: 'domainActionAdapterApplyVisualWorkspaceLifecycle',
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
    api_surface: 'domainActionAdapterEmitWorkspaceReceiptProof',
  },
  {
    action: 'emit_external_work_order_owner_closeout',
    effect: 'guarded_owner_closeout_no_regression_or_typed_blocker',
    summary: 'Return RCA-owned refs-only no-regression evidence or a typed blocker for an absorbed external work order; never write visual truth, artifact bodies, memory bodies, or quality/export verdicts.',
    required_fields: [
      'workspace_root',
      'work_order_id',
      'execution_receipt_ref',
      'absorbed_head_ref',
      'target_verification_refs',
      'no_forbidden_write_refs',
    ],
    api_surface: 'domainActionAdapterEmitExternalWorkOrderOwnerCloseout',
  },
  {
    action: 'notification_receipt',
    effect: 'control_plane_ack_only',
    summary: 'Acknowledge an OPL/Hermes notification without writing RCA visual truth, review verdict, or publication gate.',
    required_fields: ['notification_id'],
    api_surface: 'none',
  },
]);

const DOMAIN_ACTION_ADAPTER_FORBIDDEN_WRITES = Object.freeze([
  'visual_truth',
  'review_verdict',
  'publication_gate',
  'canonical_artifacts',
]);

const DOMAIN_ACTION_ADAPTER_BLOCKED_ACTIONS = Object.freeze([
  'write_visual_truth',
  'write_canonical_artifacts',
  'write_review_verdict',
  'write_publication_gate',
  'mutate_review_state',
  'publish_export_bundle',
]);

export function listDomainActionAdapterGuardedActions() {
  return DOMAIN_ACTION_ADAPTER_GUARDED_ACTIONS.map((entry) => ({ ...entry }));
}

export function listDomainActionAdapterGuardedActionIds() {
  return DOMAIN_ACTION_ADAPTER_GUARDED_ACTIONS.map((entry) => entry.action);
}

export function listDomainActionAdapterForbiddenWrites() {
  return [...DOMAIN_ACTION_ADAPTER_FORBIDDEN_WRITES];
}

export function listDomainActionAdapterBlockedActions() {
  return [...DOMAIN_ACTION_ADAPTER_BLOCKED_ACTIONS];
}
