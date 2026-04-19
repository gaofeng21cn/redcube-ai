import type {
  RerunLinkage,
  RunTelemetryEnvelope,
  RuntimeErrorKind,
} from '@redcube/runtime-protocol';

export interface RuntimeRunRecord {
  run_id: string;
  managed_run_id?: string | null;
  route: string;
  scope: string;
  target: string;
  overlay: string;
  topic_id: string | null;
  deliverable_id: string | null;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  current_stage: string | null;
  stage_results: unknown[];
  artifact_refs: string[];
  telemetry: RunTelemetryEnvelope | null;
  error_kind: RuntimeErrorKind | null;
  rerun_linkage: RerunLinkage;
  error: { message: string } | null;
  executor?: Record<string, unknown>;
}

export type RuntimeManagedRunAdapter = 'hermes' | 'host_agent' | 'hermes_native_proof';

export interface RuntimeCreativeOwnershipLifecycleFamilyMapping {
  source_readiness: string[];
  story_architecture: string[];
  visual_authorship: string[];
  delivery_packaging: string[];
  review_overlay: string[];
}

export interface RuntimeCreativeOwnershipResearchOwnershipContract {
  semantic_role?: 'shared_source_readiness_augmentation';
  positioning?: 'shared_source_readiness_optional_augmentation';
  trigger_conditions: string[];
}

export interface RuntimeCreativeOwnershipReviewOverlayContract {
  shared_layers: string[];
  family_mapping?: {
    xiaohongshu: string[];
    ppt_deck: string[];
  };
  xiaohongshu?: {
    status: 'active' | 'inactive';
    layers?: string[];
  };
  ppt_deck?: {
    status: 'active' | 'inactive';
    layers?: string[];
  };
}

export interface RuntimeCreativeOwnershipExecutionContract {
  program: 'P19';
  milestone: 'P19.A';
  tracking_model: 'unified_lifecycle';
  primary_executor: {
    adapter: 'host_agent';
    runtime: 'codex_native_host_agent';
    status: 'formal_primary_executor';
  };
  adapter_roles: {
    host_agent: 'formal_primary_executor';
  };
  proof_executor: {
    adapter: 'hermes_native_proof';
    runtime: 'hermes_native_full_agent_loop';
    status: 'opt_in_proof_executor';
  };
  protected_creative_routes: {
    xiaohongshu: RuntimeCreativeOwnershipLifecycleFamilyMapping;
    ppt_deck: RuntimeCreativeOwnershipLifecycleFamilyMapping;
  };
  primary_creative_routes: {
    xiaohongshu: string[];
    ppt_deck: string[];
  };
  unified_lifecycle: RuntimeCreativeOwnershipLifecycleContract;
  review_overlay: RuntimeCreativeOwnershipReviewOverlayContract;
  research_ownership: RuntimeCreativeOwnershipResearchOwnershipContract;
  mainline_topology: string[];
}

export interface RuntimeCreativeOwnershipLifecycleContract {
  tracking_model: 'unified_lifecycle';
  macro_lifecycle: Array<
    'source_readiness'
    | 'story_architecture'
    | 'visual_authorship'
    | 'delivery_packaging'
  >;
  review_overlay: string[];
  research_ownership: RuntimeCreativeOwnershipResearchOwnershipContract;
  stages: Array<
    'source_readiness'
    | 'story_architecture'
    | 'visual_authorship'
    | 'delivery_packaging'
  >;
  family_mapping: {
    xiaohongshu: RuntimeCreativeOwnershipLifecycleFamilyMapping;
    ppt_deck: RuntimeCreativeOwnershipLifecycleFamilyMapping;
  };
}

export interface RuntimeCreativeOwnershipForbiddenBoundaries {
  allowed_code_responsibilities: string[];
  forbidden_code_authorship: {
    xiaohongshu: string[];
    ppt_deck: string[];
  };
  fake_progress_conditions: string[];
}

export interface RuntimeCreativeOwnershipViolation {
  violation_id: string;
  stage: string;
  protected_surface: string;
  file: string;
  evidence_patterns: string[];
  why_blocked: string;
  status: 'present' | 'cleared';
}

export interface RuntimeCreativeOwnershipAudit {
  program: 'P19';
  milestone: 'P19.D';
  macro_lifecycle_stage: 'cross_lifecycle_closeout';
  completed_milestones: Array<'P19.A' | 'P19.B' | 'P19.C'>;
  closeout_ready: true;
  tracking_model: 'unified_lifecycle';
  shared_execution_contract: {
    primary_adapter: 'host_agent';
    primary_runtime: 'codex_native_host_agent';
    proof_executor: 'hermes_native_proof';
    proof_runtime: 'hermes_native_full_agent_loop';
    freeze_origin_milestone: 'P19.A';
    mainline_topology: string[];
  };
  unified_lifecycle: RuntimeCreativeOwnershipLifecycleContract;
  research_ownership: RuntimeCreativeOwnershipResearchOwnershipContract;
  review_overlay: RuntimeCreativeOwnershipReviewOverlayContract;
  shared_closeout: {
    story_architecture: 'cleared_across_families';
    visual_authorship: 'cleared_across_families';
    delivery_packaging: 'no_creative_residue_priority_deferred';
    review_overlay: 'dual_layer_active_across_families';
    remaining_shared_closeout: string[];
  };
  families: {
    xiaohongshu: {
      status: 'present' | 'cleared';
      protected_routes: string[];
      lifecycle_residue: Record<string, { status: 'present' | 'cleared'; violations: RuntimeCreativeOwnershipViolation[] }>;
      violations: RuntimeCreativeOwnershipViolation[];
    };
    ppt_deck: {
      status: 'present' | 'cleared';
      protected_routes: string[];
      lifecycle_residue: Record<string, { status: 'present' | 'cleared'; violations: RuntimeCreativeOwnershipViolation[] }>;
      violations: RuntimeCreativeOwnershipViolation[];
    };
  };
}

export interface RuntimeCreativeOwnershipCloseoutAuditFinding {
  file: string;
  protected_output: string;
  residue_kind: string;
  evidence_patterns: string[];
  summary: string;
}

export interface RuntimeCreativeOwnershipProgramCloseout {
  current_milestone: 'P19.D';
  macro_lifecycle_stage: 'cross_lifecycle_closeout';
  completed_milestones: Array<'P19.A' | 'P19.B' | 'P19.C'>;
  closeout_ready: true;
  closeout_scope: {
    story_architecture: 'cleared_across_families';
    visual_authorship: 'cleared_across_families';
    delivery_packaging: 'no_creative_residue_priority_deferred';
    review_overlay: 'dual_layer_active_across_families';
    remaining_shared_closeout: string[];
  };
}

export interface RuntimeCreativeOwnershipCloseoutAudit {
  milestone: 'P19.D';
  phase: 'shared_execution_and_audit_closeout';
  completed_milestones: Array<'P19.A' | 'P19.B' | 'P19.C'>;
  closeout_ready: true;
  execution_model: {
    mainline_adapter: 'host_agent';
    primary_surface: 'codex_native_host_agent';
    adapter_role: 'primary_creative_executor';
    proof_executor: 'hermes_native_proof';
    freeze_origin_milestone: 'P19.A';
  };
  unified_lifecycle: {
    stages: RuntimeCreativeOwnershipLifecycleContract['macro_lifecycle'];
    family_mapping: RuntimeCreativeOwnershipLifecycleContract['family_mapping'];
  };
  research_ownership: {
    positioning: 'shared_source_readiness_optional_augmentation';
    trigger_conditions: string[];
  };
  review_overlay: {
    shared_layers: string[];
    xiaohongshu: {
      status: 'active';
    };
    ppt_deck: {
      status: 'active' | 'missing_visual_director_review_contract';
    };
  };
  creative_ownership_boundary: {
    code_allowed_responsibilities: string[];
    code_forbidden_outputs: string[];
  };
  residue: {
    xiaohongshu: {
      status: 'open' | 'cleared';
      findings: RuntimeCreativeOwnershipCloseoutAuditFinding[];
    };
    ppt_deck: {
      status: 'open' | 'cleared';
      findings: RuntimeCreativeOwnershipCloseoutAuditFinding[];
    };
  };
  closeout_scope: {
    story_architecture: 'cleared_across_families';
    visual_authorship: 'cleared_across_families';
    delivery_packaging: 'no_creative_residue_priority_deferred';
    review_overlay: 'dual_layer_active_across_families';
    remaining_shared_closeout: string[];
  };
  team_lane_contract: {
    tracking_model: 'unified_lifecycle';
    lanes: Array<{
      lane_id: string;
      lifecycle_focus: string[];
      write_scopes: string[];
      verification_commands: string[];
    }>;
    overlapping_write_scopes: Array<{
      scope: string;
      lanes: string[];
    }>;
    final_convergence_order: string[];
  };
  team_gate: {
    shared_contract_frozen: boolean;
    shared_lifecycle_contract_frozen: boolean;
    research_ownership_frozen: boolean;
    lifecycle_alignment_red_tests_written: boolean;
    ppt_visual_director_review_contract_frozen: boolean;
    lane_write_scopes_by_shared_lifecycle: boolean;
    independent_verification_defined: boolean;
    final_convergence_order_defined: boolean;
    missing_gates: string[];
  };
}

export interface RuntimeCreativeOwnershipProgramStatus {
  program: 'P19';
  current_milestone: 'P19.D';
  completed_milestones: Array<'P19.A' | 'P19.B' | 'P19.C'>;
  closeout_ready: true;
  current_mode: string;
  macro_lifecycle_stage: 'cross_lifecycle_closeout';
  shared_execution_contract: RuntimeCreativeOwnershipAudit['shared_execution_contract'];
  unified_lifecycle: RuntimeCreativeOwnershipLifecycleContract;
  residue_by_family: RuntimeCreativeOwnershipAudit['families'];
  shared_closeout: RuntimeCreativeOwnershipCloseoutAudit['closeout_scope'];
  team_lane_contract: RuntimeCreativeOwnershipCloseoutAudit['team_lane_contract'];
  team_gate: {
    satisfied: boolean;
    missing_gates: string[];
  };
}

export interface RuntimeRunRouteRequest {
  workspaceRoot: string;
  overlay: string;
  topicId: string;
  deliverableId: string;
  route: string;
  runId?: string | null;
  managedRunId?: string | null;
  adapter?: string;
  mode?: string;
  baselineDeliverableId?: string;
}

export interface RuntimeRunRouteResponse {
  ok: boolean;
  run: RuntimeRunRecord;
  events: unknown[];
  artifactFile?: string;
  error?: unknown;
}

export interface RuntimeRunLookupRequest {
  workspaceRoot: string;
  runId: string;
}

export interface RuntimeEventRecord extends Record<string, unknown> {}

export interface RuntimeStartRunRequest {
  workspaceRoot: string;
  route: string;
  overlay: string;
  scope?: string;
  target: string;
  topicId?: string | null;
  deliverableId?: string | null;
  managedRunId?: string | null;
  baselineDeliverableId?: string;
  executor: Record<string, unknown>;
}

export interface RuntimeCompleteRunRequest {
  workspaceRoot: string;
  runId: string;
  currentStage: string;
  stageResults: unknown[];
  artifactRefs: string[];
  executor: Record<string, unknown>;
}

export interface RuntimeFailRunRequest {
  workspaceRoot: string;
  runId: string;
  currentStage: string;
  error: unknown;
  errorKind?: RuntimeErrorKind;
  executor: Record<string, unknown>;
}

export interface RuntimeManagedProgressProjection {
  current_stage: string | null;
  latest_events: Array<{
    at: string;
    stage_id: string | null;
    kind: string;
    summary: string;
  }>;
  current_blockers: string[];
  next_system_action: string | null;
  needs_user_decision: boolean;
  final_artifact_refs: string[];
  content_status: 'running' | 'completed' | 'paused_for_user_request' | 'blocked_by_runtime' | 'blocked_requires_human';
  completed_stages: string[];
  remaining_stages: string[];
  last_completed_stage: string | null;
  last_completed_at: string | null;
  human_report: {
    reported_at: string | null;
    recent_completion: string;
    mainline_status: string;
    runtime_health: string;
    current_blockers: string;
    next_system_action: string;
    needs_human_intervention: boolean;
  };
}

export interface RuntimeManagedRuntimeLivenessAudit {
  status: 'live' | 'none';
  checked_at: string | null;
  reason_code: string;
}

export interface RuntimeManagedRuntimeSupervisionRecord {
  schema_version: 1;
  recorded_at: string;
  managed_run_id: string;
  overlay: string;
  topic_id: string;
  deliverable_id: string;
  health_status: 'live' | 'recovering' | 'degraded' | 'paused' | 'completed' | 'escalated';
  runtime_liveness_audit: RuntimeManagedRuntimeLivenessAudit;
  worker_running: boolean;
  active_run_id: string | null;
  current_stage: string | null;
  content_status: RuntimeManagedProgressProjection['content_status'];
  current_blockers: string[];
  needs_human_intervention: boolean;
  summary: string;
  next_action: string | null;
  last_transition: string;
  recovery_attempt_count: number;
  consecutive_failure_count: number;
  refs: {
    managed_run_path: string;
    progress_projection_path: string;
    runtime_supervision_path: string;
    escalation_record_path: string;
  };
}

export interface RuntimeManagedEscalationRecord {
  schema_version: 1;
  recorded_at: string;
  managed_run_id: string;
  escalation_status: 'none' | 'escalated';
  reason_code: string | null;
  severity: 'none' | 'managed_runtime';
  recommended_actions: string[];
  evidence_refs: string[];
  runtime_context_refs: Record<string, string>;
  requires_human_intervention: boolean;
}

export interface RuntimeManagedRunRecord {
  managed_run_id: string;
  overlay: string;
  topic_id: string;
  deliverable_id: string;
  status: 'running' | 'completed' | 'stopped_after_stage' | 'escalated' | 'needs_user_decision';
  mode: 'auto_to_terminal' | 'stop_after_stage';
  stop_after_stage: string | null;
  user_intent: {
    request: string | null;
  };
  adapter: string | null;
  requested_adapter: string;
  active_adapter: string;
  started_at: string | null;
  finished_at: string | null;
  current_stage: string | null;
  active_run_id: string | null;
  worker_running: boolean;
  runtime_liveness_audit: RuntimeManagedRuntimeLivenessAudit;
  runtime_health_status: RuntimeManagedRuntimeSupervisionRecord['health_status'];
  parking_reason_code: string | null;
  requires_human_confirmation: boolean;
  requires_external_secret: boolean;
  route_runs: Array<{
    stage_id: string;
    attempt: number;
    route_run_id: string | null;
    status: string;
    prompt_audit_ref: string;
    result_ref: string;
    started_at: string | null;
    finished_at: string | null;
  }>;
  stage_results: Array<{
    stage_id: string;
    attempt: number;
    route_run_id: string | null;
    status: 'completed' | 'failed' | 'stopped_after_stage';
    summary: string;
    artifacts: string[];
    decision:
      | 'advance_to_next_stage'
      | 'complete_managed_run'
      | 'stop_after_stage'
      | 'retry_same_stage'
      | 'escalate_runtime'
      | 'require_human_confirmation';
    next_action: string;
    blocking_reason: string | null;
    controller_decision: {
      decision:
        | 'advance_to_next_stage'
        | 'complete_managed_run'
        | 'pause_for_user_request'
        | 'retry_same_stage'
        | 'escalate_runtime'
        | 'require_human_confirmation';
      reason_code: string;
      requires_human_confirmation: boolean;
      requires_external_secret: boolean;
    } | null;
    recorded_at: string;
  }>;
  latest_events: RuntimeManagedProgressProjection['latest_events'];
  current_blockers: string[];
  next_system_action: string | null;
  needs_user_decision: boolean;
  final_artifact_refs: string[];
}

export interface RuntimeManagedRunRequest {
  workspaceRoot: string;
  overlay: string;
  topicId: string;
  deliverableId: string;
  adapter?: RuntimeManagedRunAdapter;
  userIntent?: string;
  stopAfterStage?: string;
  mode?: string;
  baselineDeliverableId?: string;
}

export interface RuntimeManagedRunLookupRequest {
  workspaceRoot: string;
  managedRunId: string;
}

export interface RuntimeManagedSupervisionRequest extends RuntimeManagedRunLookupRequest {}

export interface RuntimeManagedRunResponse {
  ok: boolean;
  managed_run: RuntimeManagedRunRecord;
  progress_projection: RuntimeManagedProgressProjection;
  runtime_supervision: RuntimeManagedRuntimeSupervisionRecord;
  escalation_record: RuntimeManagedEscalationRecord;
}

export interface RuntimeProductEntrySessionRecord {
  schema_version: 1;
  entry_session_id: string;
  workspace_root: string;
  deliverable_family: string;
  topic_id: string;
  deliverable_id: string;
  profile_id: string | null;
  title: string | null;
  goal: string | null;
  runtime_owner: string;
  last_task_intent: string;
  last_entry_mode: string;
  latest_managed_run_id: string | null;
  latest_run_id: string | null;
  latest_surface_kind: string | null;
  updated_at: string;
}

export interface RuntimeSourceIntakeResponse {
  ok: boolean;
  topicId: string;
  artifactFiles: Record<string, string>;
  audit: Record<string, unknown>;
  augmentation: Record<string, unknown>;
}

export interface RuntimeSourceIntakeRequest {
  workspaceRoot: string;
  topicId: string;
  title?: string;
  brief?: string;
  keywords?: string[] | string;
  sourceFiles?: string[] | string;
  modeHint?: string;
}

export interface RuntimeSourceResearchResponse {
  ok: boolean;
  topicId: string;
  stage: string;
  planningReady: boolean;
  artifactFiles: Record<string, string>;
  report: Record<string, unknown>;
  intake: Record<string, unknown>;
  augmentation?: Record<string, unknown>;
  resultPreparation?: Record<string, unknown>;
  resultWrite?: Record<string, unknown>;
  execution?: Record<string, unknown>;
}

export interface RuntimeSourceResearchRequest extends RuntimeSourceIntakeRequest {
  inputFile?: string;
  payloadFile?: string;
  result?: Record<string, unknown> | null;
}

export interface RuntimeSourceAugmentationResponse {
  ok: boolean;
  topicId: string;
  artifactFiles: Record<string, string>;
  augmentation: Record<string, unknown>;
}

export interface RuntimeSourceAugmentationRequest {
  workspaceRoot: string;
  topicId: string;
  title?: string;
}

export interface RuntimeSourceAugmentationResultPreparationResponse {
  ok: boolean;
  topicId: string;
  artifactFiles: Record<string, string>;
  request: Record<string, unknown>;
  resultDraft: Record<string, unknown>;
}

export interface RuntimeSourceAugmentationResultPreparationRequest {
  workspaceRoot: string;
  topicId: string;
}

export interface RuntimeSourceAugmentationResultWriteResponse {
  ok: boolean;
  topicId: string;
  artifactFiles: Record<string, string>;
  resultContract: Record<string, unknown>;
}

export interface RuntimeSourceAugmentationResultWriteRequest {
  workspaceRoot: string;
  topicId: string;
  inputFile?: string;
  payloadFile?: string;
  result?: Record<string, unknown> | null;
}

export interface RuntimeSourceAugmentationExecutionResponse {
  ok: boolean;
  topicId: string;
  artifactFiles: Record<string, string>;
  report: Record<string, unknown>;
}

export interface RuntimeSourceAugmentationExecutionRequest {
  workspaceRoot: string;
  topicId: string;
}
