import type { WorkspaceContract } from '@redcube/runtime-protocol';

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
  packages?: Record<string, string>;
}

export interface SurfaceBase<TKind extends string> {
  ok: boolean;
  surface_kind: TKind;
  recommended_action?: string | null;
  summary?: SurfaceSummary;
}

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

export interface TopicCatalogResponse extends SurfaceBase<'topic_catalog'> {
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

export interface CreateDeliverableRequest extends DeliverableRequest, OverlayRequest {
  profileId: string;
  title: string;
  goal: string;
}

export interface DeliverableCreateResponse extends SurfaceBase<'deliverable_create'> {
  deliverableFile: string;
  deliverable: Record<string, unknown>;
  surfaceFiles: string[];
  hydratedContract: Record<string, unknown>;
  summary: {
    overlay: string;
    deliverable_id: string;
    surface_file_count: number;
  };
}

export interface DeliverableRecordResponse extends SurfaceBase<'deliverable_record'> {
  deliverable: Record<string, unknown>;
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

export interface RunRecordResponse extends SurfaceBase<'run_record'> {
  run: Record<string, unknown>;
  run_telemetry: RunTelemetrySummary;
  error_taxonomy: ErrorTaxonomySummary;
  rerun_analytics: RerunAnalyticsSummary;
  cost_summary: CostSummary;
  quality_drift_summary: QualityDriftSummary;
  approval_throughput_summary: ApprovalThroughputSummary;
  metric_extensions: MetricExtensionSummary[];
  summary: {
    run_id: string;
    status: string;
    current_stage: string | null;
  };
}

export interface RouteRunResponse extends SurfaceBase<'route_run'> {
  run: Record<string, unknown>;
  events: unknown[];
  artifactFile?: string;
  error?: unknown;
  error_kind: string | null;
  summary: {
    route: string;
    run_id: string | null;
    status: string | null;
  };
}

export interface ReviewStateResponse extends SurfaceBase<'review_state'> {
  state: Record<string, unknown>;
  state_type: 'canonical';
  canonical_source: {
    kind: string;
  };
  quality_summary: Record<string, unknown>;
}

export interface RuntimeWatchResponse extends SurfaceBase<'runtime_watch'> {
  run_id: string;
  current_stage: string | null;
  status: string;
  pending_reviews: string[];
  review_state: Record<string, unknown>;
  quality_summary: Record<string, unknown>;
  publication_projection: Record<string, unknown> | null;
  source_readiness_summary: Record<string, unknown> | null;
  gate_summary: Record<string, unknown> | null;
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

export type PosterMetricId =
  | 'far_view_readability'
  | 'scan_path_clarity'
  | 'figure_claim_alignment'
  | 'density_balance'
  | 'citation_visibility'
  | 'venue_metadata_complete'
  | 'print_export_safe';

export interface MetricExtensionMetricSummary {
  metric_id: PosterMetricId | string;
  value: number | string | boolean | null;
  status: 'not_evaluated' | 'captured';
}

export interface MetricExtensionSummary {
  extension_id: string;
  overlay_scope: string[];
  profile_scope: string[];
  status: 'declared' | 'inactive';
  metrics: MetricExtensionMetricSummary[];
}

export interface RunTelemetrySummary {
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

export interface ErrorTaxonomySummary {
  error_kind: string | null;
  error_message: string | null;
  current_stage: string | null;
  failed: boolean;
}

export interface RerunAnalyticsSummary {
  rerun_count: number;
  previous_run_id: string | null;
  source_stage: string | null;
  blocking_review: string | null;
  baseline_deliverable_id: string | null;
}

export interface CostSummary {
  executor_identity: string | null;
  executor_kind: string | null;
  latency_ms: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  estimated_cost: number | null;
}

export interface QualityDriftSummary {
  relative_quality_verdict: string | null;
  degradation_count: number;
  improvement_count: number;
  acceptable_change_count: number;
  baseline_promotion_state: string | null;
  promoted_reference_id: string | null;
}

export interface ApprovalThroughputSummary {
  publish_state: string | null;
  pending_review_count: number;
  approval_pending: boolean;
  published: boolean;
  blocked: boolean;
}

export interface SourceIntakeResponse extends SurfaceBase<'source_intake'> {
  artifactFiles: Record<string, string>;
  audit: Record<string, unknown>;
  summary: {
    topic_id: string;
    audit_status: string | null;
    blocking_reason_count: number;
  };
}

export interface LegacyImportResponse extends SurfaceBase<'legacy_import'> {
  mode: 'legacy_to_workspace';
  project: string;
  topicFile: string;
  importedInputsDir: string;
  artifactFiles: Record<string, string>;
  audit: Record<string, unknown>;
  summary: {
    project: string;
    overlay: string;
    audit_status: string | null;
  };
}

export interface ReviewMutationRequest extends DeliverableRequest {
  mutation: Record<string, unknown>;
}

export interface ReviewMutationResponse {
  ok: boolean;
  state: Record<string, unknown>;
  quality_summary?: Record<string, unknown>;
  state_file?: string;
  history_file?: string;
  publication_state_file?: string | null;
}

export interface ReviewRenderOutputRequest extends Partial<DeliverableRequest>, Partial<OverlayRequest> {
  checks: Record<string, unknown>;
}

export interface ReviewRenderOutputResponse {
  ok: boolean;
  status: string;
  issues?: string[];
  rerun_from_stage?: string | null;
  recommended_action?: string;
}

export interface DeliverableAuditRequest extends Partial<DeliverableRequest>, OverlayRequest {
  mode: string;
  baselineDeliverableId?: string;
}

export interface DeliverableAuditResponse extends SurfaceBase<'audit'> {
  status: string;
  issues: string[];
  rerun_from_stage: string | null;
  quality_summary: Record<string, unknown>;
  source_readiness_summary?: Record<string, unknown> | null;
  gate_summary?: Record<string, unknown> | null;
}

export interface RunDeliverableRouteRequest extends DeliverableRequest, OverlayRequest {
  route: string;
  adapter?: string;
}
