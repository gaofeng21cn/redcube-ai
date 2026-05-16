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
    rca_retained_authority: [
      'visual_truth',
      'review_export_verdict',
      'artifact_authority',
      'visual_memory_body',
      'owner_receipt',
      'typed_blocker',
      'safe_action_refs',
    ],
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
