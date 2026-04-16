import type { spawnSync } from 'node:child_process';

export interface ResolveRedCubePythonCommandOptions {
  env?: Record<string, string | undefined>;
  spawnSyncImpl?: typeof spawnSync;
}

export interface ResolvedRedCubePythonCommand {
  command: string;
  source: 'env' | 'python3_with_playwright' | 'managed_python_runtime';
}

export interface WorkspaceContract {
  workspaceRoot: string;
  workspaceFile: string;
  topicsDir: string;
  runtimeDir: string;
  publishDir: string;
  overlaysDir: string;
}

export interface TopicPaths {
  topicId: string;
  topicDir: string;
  topicFile: string;
  inputsDir: string;
  canonicalDir: string;
  deliverablesDir: string;
  notesDir: string;
  runsDir: string;
}

export interface DeliverablePaths {
  deliverableId: string;
  deliverableDir: string;
  deliverableFile: string;
  artifactsDir: string;
  contractsDir: string;
  reportsDir: string;
  viewsDir: string;
}

export interface NotePaths {
  noteId: string;
  noteDir: string;
  noteFile: string;
  artifactsDir: string;
  reportsDir: string;
  viewsDir: string;
}

export interface SourceArtifactPaths {
  topicPaths: TopicPaths;
  sourceIndexFile: string;
  extractedMaterialsFile: string;
  sourceAuditFile: string;
  sourceBriefFile: string;
  sourceReadinessPackFile: string;
  sourceAugmentationRequestFile: string;
  sourceAugmentationResultFile: string;
  sourceResearchReportFile: string;
  sourceAugmentationReportFile: string;
}

export interface SourceReadinessSummary {
  canonical_source: {
    kind: string;
    audit_kind: string;
    readiness_kind: string;
  };
  authoritative_artifacts: {
    source_audit: string;
    source_readiness_pack: string;
  };
  status: 'pass' | 'block' | 'missing' | 'invalid';
  readiness_target: 'planning_ready';
  planning_ready: boolean;
  audit_status: string;
  sufficiency_status: string;
  deep_research_state: string;
  completed_stages: string[];
  blocking_evidence_gaps: string[];
  residual_evidence_gaps: string[];
  blocking_reasons: string[];
  checks: Record<string, unknown>;
  next_required_surface: string | null;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export interface SourceAugmentationInvestigationLane {
  lane_id: string;
  priority: 'required' | 'suggested';
  objective: string;
  deliverable_value: string;
  focus_terms: string[];
}

export interface SourceAugmentationRequestContract {
  schema_version: 1;
  topic_id: string;
  title: string;
  request_kind: 'shared_source_readiness_augmentation';
  status: 'required' | 'recommended' | 'not_required';
  execution_mode: 'auto_required' | 'operator_optional' | 'not_needed';
  readiness_target: 'planning_ready';
  authoritative_inputs: {
    source_brief: string;
    source_audit: string;
    source_readiness_pack: string;
  };
  trigger: {
    input_mode: string;
    confidence: string;
    source_audit_status: string;
    source_sufficiency_status: string;
    deep_research_state: string;
    blocking_evidence_gaps: string[];
    residual_evidence_gaps: string[];
    evidence_gaps: string[];
  };
  focus: {
    topic_summary: string;
    brief_text: string;
    keywords: string[];
    required_outputs: string[];
  };
  investigation_lanes: SourceAugmentationInvestigationLane[];
}

export interface SourceAugmentationReferenceSource {
  reference_id: string;
  label: string;
  url: string;
}

export interface SourceAugmentationFactGroup {
  fact_id: string;
  label: string;
  reference_id: string;
}

export interface SourceAugmentationEvidenceGapResolution {
  gap_id: string;
  status: 'resolved' | 'unresolved';
  note: string;
}

export interface SourceAugmentationResultContract {
  schema_version: 1;
  topic_id: string;
  request_kind: 'shared_source_readiness_augmentation_result';
  status: 'completed';
  readiness_target: 'planning_ready';
  topic_summary: string;
  reference_source_list: SourceAugmentationReferenceSource[];
  key_fact_groups: SourceAugmentationFactGroup[];
  source_quality_notes: string[];
  evidence_gap_resolution: SourceAugmentationEvidenceGapResolution[];
}

export interface ValidateSourceAugmentationResultOptions {
  expectedTopicId?: string;
  requiredEvidenceGaps?: string[];
}

export interface SourceTruthConsumptionSummary {
  authoritative_source_kind: 'shared_source_truth';
  consumption_role: string;
  input_mode: string;
  confidence: string;
  material_count: number;
  material_ids: string[];
  source_labels: string[];
  source_audit_status: string;
  source_audit_blocking_reasons: string[];
  planning_ready: boolean;
  sufficiency_status: string;
  deep_research_state: string;
  blocking_evidence_gaps: string[];
  residual_evidence_gaps: string[];
}

export interface BuildSourceTruthConsumptionSummaryOptions {
  consumptionRole: string;
  defaultInputMode?: string;
  defaultConfidence?: string;
  defaultAuditStatus?: string;
  defaultBlockingReasons?: string[];
  defaultSourceLabels?: string[];
}

export interface CreateRunRecordInput {
  runId?: string;
  managedRunId?: string | null;
  route?: string;
  scope?: string;
  target?: string;
  overlay?: string;
  topicId?: string | null;
  deliverableId?: string | null;
  rerunCount?: number;
  previousRunId?: string | null;
  sourceStage?: string | null;
  blockingReview?: string | null;
  baselineDeliverableId?: string | null;
}

export type RuntimeErrorKind =
  | 'contract_error'
  | 'validation_error'
  | 'execution_error'
  | 'review_gate_error'
  | 'publish_gate_error'
  | 'environment_error';

export interface RunTelemetryEnvelope {
  run_id: string;
  route: string;
  scope: string;
  target: string;
  overlay: string;
  executor_kind: string | null;
  execution_surface: string | null;
  status: 'running' | 'completed' | 'failed';
  started_at: string | null;
  finished_at: string | null;
  latency_ms: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  estimated_cost: number | null;
}

export interface RerunLinkage {
  rerun_count: number;
  previous_run_id: string | null;
  source_stage: string | null;
  blocking_review: string | null;
  baseline_deliverable_id: string | null;
}

export interface RunRecord {
  run_id: string;
  managed_run_id?: string | null;
  route: string;
  scope: string;
  target: string;
  overlay: string;
  topic_id: string | null;
  deliverable_id: string | null;
  status: 'running' | 'completed' | 'failed';
  started_at: string | null;
  finished_at: string | null;
  current_stage: string | null;
  stage_results: unknown[];
  artifact_refs: string[];
  telemetry: RunTelemetryEnvelope | null;
  error_kind: RuntimeErrorKind | null;
  rerun_linkage: RerunLinkage;
  error: unknown;
}

export interface ManagedProgressEvent {
  at: string;
  stage_id: string | null;
  kind: string;
  summary: string;
}

export type ManagedRunMode = 'auto_to_terminal' | 'stop_after_stage';

export type ManagedRunStatus =
  | 'running'
  | 'completed'
  | 'stopped_after_stage'
  | 'escalated'
  | 'needs_user_decision';

export interface ManagedRuntimeLivenessAudit {
  status: 'live' | 'none';
  checked_at: string | null;
  reason_code: string;
}

export interface ManagedAdapterSwitchRecord {
  at: string;
  from_adapter: string;
  to_adapter: string;
  reason_code: string;
  stage_id: string | null;
}

export interface ManagedControllerDecisionRecord {
  decision:
    | 'advance_to_next_stage'
    | 'complete_managed_run'
    | 'pause_for_user_request'
    | 'retry_same_stage'
    | 'switch_to_primary_adapter'
    | 'escalate_runtime'
    | 'require_human_confirmation';
  reason_code: string;
  requires_human_confirmation: boolean;
  requires_external_secret: boolean;
}

export interface ManagedStageResultRecord {
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
    | 'switch_to_primary_adapter'
    | 'escalate_runtime'
    | 'require_human_confirmation';
  next_action: string;
  blocking_reason: string | null;
  controller_decision: ManagedControllerDecisionRecord | null;
  recorded_at: string;
}

export interface ManagedRouteRunLink {
  stage_id: string;
  attempt: number;
  route_run_id: string | null;
  status: string;
  prompt_audit_ref: string;
  result_ref: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface ManagedProgressProjection {
  current_stage: string | null;
  latest_events: ManagedProgressEvent[];
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

export interface ManagedRuntimeSupervisionRecord {
  schema_version: 1;
  recorded_at: string;
  managed_run_id: string;
  overlay: string;
  topic_id: string;
  deliverable_id: string;
  health_status: 'live' | 'recovering' | 'degraded' | 'paused' | 'completed' | 'escalated';
  runtime_liveness_audit: ManagedRuntimeLivenessAudit;
  worker_running: boolean;
  active_run_id: string | null;
  current_stage: string | null;
  content_status: ManagedProgressProjection['content_status'];
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

export interface ManagedEscalationRecord {
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

export interface CreateManagedRunRecordInput {
  managedRunId?: string;
  overlay?: string;
  topicId?: string;
  deliverableId?: string;
  mode?: ManagedRunMode;
  stopAfterStage?: string | null;
  userIntent?: string | null;
  adapter?: string | null;
}

export interface ManagedRunRecord {
  managed_run_id: string;
  overlay: string;
  topic_id: string;
  deliverable_id: string;
  status: ManagedRunStatus;
  mode: ManagedRunMode;
  stop_after_stage: string | null;
  user_intent: {
    request: string | null;
  };
  adapter: string | null;
  requested_adapter: string;
  active_adapter: string;
  adapter_switches: ManagedAdapterSwitchRecord[];
  started_at: string | null;
  finished_at: string | null;
  current_stage: string | null;
  active_run_id: string | null;
  worker_running: boolean;
  runtime_liveness_audit: ManagedRuntimeLivenessAudit;
  runtime_health_status: ManagedRuntimeSupervisionRecord['health_status'];
  parking_reason_code: string | null;
  requires_human_confirmation: boolean;
  requires_external_secret: boolean;
  route_runs: ManagedRouteRunLink[];
  stage_results: ManagedStageResultRecord[];
  latest_events: ManagedProgressEvent[];
  current_blockers: string[];
  next_system_action: string | null;
  needs_user_decision: boolean;
  final_artifact_refs: string[];
}
