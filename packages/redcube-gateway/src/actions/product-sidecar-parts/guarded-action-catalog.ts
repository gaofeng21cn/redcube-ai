// @ts-nocheck

export const SIDECAR_GUARDED_ACTIONS = Object.freeze([
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
    action: 'evaluate_visual_transition',
    effect: 'read_only_transition_guard_evaluation',
    summary: 'Evaluate an RCA-owned visual_transition_spec transition against explicit guard refs and return next-stage metadata or a typed blocker; OPL keeps generic runner ownership.',
    required_fields: ['workspace_root', 'transition_id', 'current_stage'],
    api_surface: 'productSidecarEvaluateVisualTransition',
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
    api_surface: 'productSidecarEmitExternalWorkOrderOwnerCloseout',
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
