import type { GovernanceSurfaceContract } from '@redcube/overlay-core';
import type { WorkspaceContract } from '@redcube/runtime-protocol';
import type { FamilyDomainEntryContractSurface } from 'opl-framework/family-entry-contracts';


export interface WorkspaceRootRequest {
  workspaceRoot: string;
}

export interface TopicRequest extends WorkspaceRootRequest {
  topicId: string;
}

export interface DeliverableRequest extends TopicRequest {
  deliverableId: string;
}

export interface OverlayRequest {
  overlay: string;
}

export interface SurfaceSummary extends Record<string, unknown> {}

export interface OverlayCatalogEntry {
  overlay_id: string;
  default_profile_id: string | null;
  profiles: string[];
  route_sequence?: string[];
  deliverable_kind?: string;
  prompt_pack_id?: string;
}

export interface SurfaceBase<TKind extends string> {
  ok: boolean;
  surface_kind: TKind;
  recommended_action?: string | null;
  summary?: SurfaceSummary | string;
}

export interface DomainAgentEntrySpec {
  surface_kind: 'domain_agent_entry_spec' | string;
  agent_id: string;
  title: string;
  description: string;
  default_engine: string;
  workspace_requirement: 'required' | string;
  locator_schema: {
    required_fields: string[];
    optional_fields: string[];
  };
  codex_entry_strategy: 'domain_agent_entry' | string;
  artifact_conventions: string;
  progress_conventions: string;
  entry_command: string;
  manifest_command: string;
}

export type DomainEntryContractSurface = FamilyDomainEntryContractSurface & {
  domain_agent_entry_spec?: DomainAgentEntrySpec;
};

export interface WorkspaceDoctorResponse extends SurfaceBase<'workspace_doctor'> {
  workspaceRoot: string;
  workspaceFileExists: boolean;
  contract: WorkspaceContract;
  summary: {
    workspace_file_exists: boolean;
    canonical_topics_dir: string;
    canonical_runs_dir: string;
  };
}

interface TopicCatalogResponse extends SurfaceBase<'topic_catalog'> {
  workspaceRoot: string;
  total: number;
  topics: Array<Record<string, unknown>>;
  summary: {
    total_topics: number;
  };
}

export interface OverlayCatalogResponse extends SurfaceBase<'overlay_catalog'> {
  overlays: OverlayCatalogEntry[];
  summary: {
    total_overlays: number;
    total_profiles: number;
  };
}

interface CreateDeliverableRequest extends DeliverableRequest, OverlayRequest {
  profileId: string;
  title: string;
  goal: string;
}

interface DeliverableCreateResponse extends SurfaceBase<'deliverable_create'> {
  deliverableFile: string;
  deliverable: Record<string, unknown>;
  surfaceFiles: string[];
  hydratedContract: Record<string, unknown>;
  governance_surface: GovernanceSurfaceContract;
  summary: {
    overlay: string;
    deliverable_id: string;
    surface_file_count: number;
  };
}

export interface DeliverableRecordResponse extends SurfaceBase<'deliverable_record'> {
  deliverable: Record<string, unknown>;
  governance_surface: GovernanceSurfaceContract;
  summary: {
    deliverable_id: string;
    overlay: string;
    profile_id?: string;
  };
}

export interface PublicationProjectionResponse extends SurfaceBase<'publication_projection'> {
  topic_id: string;
  state_type: 'projection';
  projection_file: string;
  publication: Record<string, unknown>;
  canonical_source: {
    kind: string;
  };
}

export interface RouteRunResponse extends SurfaceBase<'route_run'> {
  run: Record<string, unknown>;
  events: unknown[];
  artifactFile?: string;
  error?: unknown;
  error_kind: string | null;
  governance_surface: GovernanceSurfaceContract;
  summary: {
    route: string;
    run_id: string | null;
    status: string | null;
  };
}

export interface RunDeliverableRouteRequest extends DeliverableRequest, OverlayRequest {
  route: string;
  adapter?: string;
  userIntent?: string;
  stopAfterStage?: string;
  crossProviderAttemptIndex?: Record<string, unknown>;
  cross_provider_attempt_index?: Record<string, unknown>;
}

// Telemetry summaries
type PosterMetricId =
  | 'far_view_readability'
  | 'scan_path_clarity'
  | 'figure_claim_alignment'
  | 'density_balance'
  | 'citation_visibility'
  | 'venue_metadata_complete'
  | 'print_export_safe';

interface MetricExtensionMetricSummary {
  metric_id: PosterMetricId | string;
  value: number | string | boolean | null;
  status: 'not_evaluated' | 'captured';
}

interface MetricExtensionSummary {
  extension_id: string;
  overlay_scope: string[];
  profile_scope: string[];
  status: 'declared' | 'inactive';
  metrics: MetricExtensionMetricSummary[];
}

interface RunTelemetrySummary {
  run_id: string | null;
  route: string | null;
  overlay: string | null;
  scope: string | null;
  target: string | null;
  executor_kind: string | null;
  execution_surface: string | null;
  status: string | null;
  started_at: string | null;
  finished_at: string | null;
  latency_ms: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  estimated_cost: number | null;
}

interface ErrorTaxonomySummary {
  error_kind: string | null;
  error_message: string | null;
  current_stage: string | null;
  failed: boolean;
}

interface RerunAnalyticsSummary {
  rerun_count: number;
  previous_run_id: string | null;
  source_stage: string | null;
  blocking_review: string | null;
  baseline_deliverable_id: string | null;
}

interface CostSummary {
  executor_identity: string | null;
  executor_kind: string | null;
  latency_ms: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  estimated_cost: number | null;
}

interface QualityDriftSummary {
  relative_quality_verdict: string | null;
  degradation_count: number;
  improvement_count: number;
  acceptable_change_count: number;
  baseline_promotion_state: string | null;
  promoted_reference_id: string | null;
}

interface ApprovalThroughputSummary {
  publish_state: string | null;
  pending_review_count: number;
  approval_pending: boolean;
  published: boolean;
  blocked: boolean;
}


// Runtime projection surfaces
export interface RuntimeProgressProjection {
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

export interface RuntimeProjection {
  schema_version: 1;
  recorded_at: string;
  runtime_handle: string;
  overlay: string;
  topic_id: string;
  deliverable_id: string;
  health_status: 'live' | 'recovering' | 'degraded' | 'paused' | 'completed' | 'escalated';
  runtime_liveness_audit: {
    status: 'live' | 'none';
    checked_at: string | null;
    reason_code: string;
  };
  worker_running: boolean;
  active_run_id: string | null;
  current_stage: string | null;
  content_status: RuntimeProgressProjection['content_status'];
  current_blockers: string[];
  needs_human_intervention: boolean;
  summary: string;
  next_action: string | null;
  last_transition: string;
  recovery_attempt_count: number;
  consecutive_failure_count: number;
  refs: {
    stage_execution_plan_path: string;
    progress_projection_path: string;
    runtime_projection_path: string;
    escalation_record_path: string;
  };
}

export interface RuntimeEscalationRecord {
  schema_version: 1;
  recorded_at: string;
  runtime_handle: string;
  escalation_status: 'none' | 'escalated';
  reason_code: string | null;
  severity: 'none' | 'runtime_projection';
  recommended_actions: string[];
  evidence_refs: string[];
  runtime_context_refs: Record<string, string>;
  requires_human_intervention: boolean;
}

export interface StageExecutionResponse extends SurfaceBase<'opl_stage_execution_plan'> {
  stage_execution_plan: Record<string, unknown>;
  progress_projection: RuntimeProgressProjection;
  runtime_projection: RuntimeProjection;
  escalation_record: RuntimeEscalationRecord;
  summary: {
    stage_execution_plan_ref: string | null;
    status: string | null;
    current_stage: string | null;
  };
}

interface RunStageDeliverableRequest extends DeliverableRequest, OverlayRequest {
  adapter?: string;
  userIntent?: string;
  stopAfterStage?: string;
  mode?: string;
  baselineDeliverableId?: string;
}


// Review surfaces
export interface ReviewStateResponse extends SurfaceBase<'review_state'> {
  state: Record<string, unknown>;
  state_type: 'canonical';
  canonical_source: {
    kind: string;
  };
  quality_summary: Record<string, unknown>;
  source_readiness_summary: Record<string, unknown> | null;
  gate_summary: Record<string, unknown> | null;
  operator_handoff: Record<string, unknown> | null;
  lifecycle_stage_summary: Record<string, unknown> | null;
  governance_surface: GovernanceSurfaceContract;
}

interface RuntimeWatchResponse extends SurfaceBase<'runtime_watch'> {
  owner_boundary: Record<string, unknown>;
  run_id: string;
  current_stage: string | null;
  status: string;
  pending_reviews: string[];
  review_state: Record<string, unknown>;
  quality_summary: Record<string, unknown>;
  publication_projection: Record<string, unknown> | null;
  source_readiness_summary: Record<string, unknown> | null;
  gate_summary: Record<string, unknown> | null;
  operator_handoff: Record<string, unknown> | null;
  lifecycle_stage_summary: Record<string, unknown> | null;
  governance_surface: GovernanceSurfaceContract;
  resumable: boolean;
  profile_id: string | null;
  delivery_contract: Record<string, unknown> | null;
  required_export_bundle: Record<string, unknown> | null;
  run_telemetry: RunTelemetrySummary;
  error_taxonomy: ErrorTaxonomySummary;
  rerun_analytics: RerunAnalyticsSummary;
  cost_summary: CostSummary;
  quality_drift_summary: QualityDriftSummary;
  approval_throughput_summary: ApprovalThroughputSummary;
  metric_extensions: MetricExtensionSummary[];
}

interface ReviewMutationRequest extends DeliverableRequest {
  mutation: Record<string, unknown>;
}

interface ReviewMutationResponse {
  ok: boolean;
  state: Record<string, unknown>;
  quality_summary?: Record<string, unknown>;
  state_file?: string;
  history_file?: string;
  publication_state_file?: string | null;
}

interface ReviewRenderOutputRequest extends Partial<DeliverableRequest>, Partial<OverlayRequest> {
  checks: Record<string, unknown>;
}

interface ReviewRenderOutputResponse {
  ok: boolean;
  status: string;
  issues?: string[];
  rerun_from_stage?: string | null;
  recommended_action?: string;
}

interface DeliverableAuditRequest extends Partial<DeliverableRequest>, OverlayRequest {
  mode: string;
  baselineDeliverableId?: string;
}

interface DeliverableAuditResponse extends SurfaceBase<'audit'> {
  status: string;
  issues: string[];
  rerun_from_stage: string | null;
  quality_summary: Record<string, unknown>;
  review_state?: Record<string, unknown> | null;
  publication_projection?: Record<string, unknown> | null;
  source_readiness_summary: Record<string, unknown> | null;
  gate_summary: Record<string, unknown> | null;
  operator_handoff: Record<string, unknown> | null;
  lifecycle_stage_summary: Record<string, unknown> | null;
  governance_surface: GovernanceSurfaceContract | null;
  delivery_contract?: Record<string, unknown> | null;
}


// Source surfaces
export interface SourceIntakeResponse extends SurfaceBase<'source_intake'> {
  artifactFiles: Record<string, string>;
  audit: Record<string, unknown>;
  augmentation: Record<string, unknown>;
  summary: {
    topic_id: string;
    audit_status: string | null;
    blocking_reason_count: number;
  };
}

interface SourceResearchResponse extends SurfaceBase<'source_research'> {
  artifactFiles: Record<string, string>;
  stage: string;
  planningReady: boolean;
  report: Record<string, unknown>;
  intake: Record<string, unknown>;
  augmentation?: Record<string, unknown>;
  resultPreparation?: Record<string, unknown>;
  resultWrite?: Record<string, unknown>;
  execution?: Record<string, unknown>;
  summary: {
    topic_id: string;
    stage: string | null;
    planning_ready: boolean;
  };
}

export interface SourceAugmentationResponse extends SurfaceBase<'source_augmentation'> {
  artifactFiles: Record<string, string>;
  augmentation: Record<string, unknown>;
  summary: {
    topic_id: string;
    status: string | null;
    readiness_target: string | null;
  };
}

export interface SourceAugmentationResultPreparationResponse extends SurfaceBase<'source_augmentation_result_preparation'> {
  artifactFiles: Record<string, string>;
  request: Record<string, unknown>;
  resultDraft: Record<string, unknown>;
  summary: {
    topic_id: string;
    readiness_target: string | null;
    evidence_gap_count: number;
  };
}

export interface SourceAugmentationResultWriteResponse extends SurfaceBase<'source_augmentation_result_write'> {
  artifactFiles: Record<string, string>;
  resultContract: Record<string, unknown>;
  summary: {
    topic_id: string;
    readiness_target: string | null;
    reference_source_count: number;
    fact_group_count: number;
  };
}

export interface SourceAugmentationExecutionResponse extends SurfaceBase<'source_augmentation_execution'> {
  artifactFiles: Record<string, string>;
  report: Record<string, unknown>;
  summary: {
    topic_id: string;
    status: string | null;
    readiness_target: string | null;
  };
}

interface SourceFirstFanoutDeliverableRequest extends OverlayRequest {
  deliverableId: string;
  profileId: string;
  title: string;
  goal: string;
  userIntent?: string;
  adapter?: string;
  stopAfterStage?: string;
  mode?: string;
  baselineDeliverableId?: string;
}

interface RunSourceFirstFanoutRequest extends TopicRequest {
  title?: string;
  brief?: string;
  keywords?: string[];
  sourceFiles?: string[];
  operatorFiles?: string[];
  deliverables: SourceFirstFanoutDeliverableRequest[];
}

interface SourceFirstFanoutResponse extends SurfaceBase<'source_first_fanout'> {
  source_barrier: SourceResearchResponse;
  source_pack_fanout?: Record<string, unknown>;
  source_pack_manifest?: Record<string, unknown>;
  planner?: Record<string, unknown>;
  created_deliverables?: DeliverableCreateResponse[];
  stage_execution_plans?: Record<string, unknown>[];
  stage_runtime_projections?: StageExecutionResponse[];
  summary: {
    topic_id: string;
    source_barrier_status: string;
    deliverable_count: number;
    stage_execution_plan_count?: number;
    stage_runtime_projection_count: number;
    parallel_family_ready?: boolean;
    max_parallel_width?: number;
  };
}
