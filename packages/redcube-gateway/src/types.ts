import type { GovernanceSurfaceContract } from '@redcube/overlay-core';
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
  governance_surface: GovernanceSurfaceContract;
  summary: {
    route: string;
    run_id: string | null;
    status: string | null;
  };
}

export interface DomainEntryRequest extends Record<string, unknown> {
  target_domain_id: string;
  task_intent: 'run_managed_deliverable' | 'run_deliverable_route' | string;
  entry_mode: string;
  workspace_locator: {
    workspace_root: string;
  };
  runtime_session_contract: {
    runtime_owner: string;
    adapter_surface?: string;
    session_mode?: string;
  };
  return_surface_contract: {
    surface_kind: string;
  };
  domain_payload: {
    deliverable_family: string;
    topic_id: string;
    deliverable_id: string;
    route?: string;
    adapter?: string;
    user_intent?: string;
    stop_after_stage?: string;
    mode?: string;
    baseline_deliverable_id?: string;
  };
}

export interface DomainEntryResponse extends SurfaceBase<'domain_entry'> {
  entry_contract_id: string;
  target_domain_id: string;
  task_intent: string;
  entry_mode: string;
  runtime_session_contract: Record<string, unknown>;
  return_surface_contract: Record<string, unknown>;
  domain_payload: Record<string, unknown>;
  result_surface: ManagedRunResponse | RouteRunResponse;
  summary: {
    task_intent: string;
    actual_surface_kind: string;
    target_handle: string | null;
  };
}

export interface ProductEntryRequest extends Record<string, unknown> {
  workspace_locator: {
    workspace_root: string;
  };
  entry_session_contract: {
    entry_session_id: string;
  };
  task_intent?: 'run_managed_deliverable' | 'run_deliverable_route' | string;
  entry_mode?: string;
  delivery_request: {
    deliverable_family?: string;
    topic_id?: string;
    deliverable_id?: string;
    profile_id?: string;
    title?: string;
    goal?: string;
    route?: string;
    adapter?: string;
    user_intent?: string;
    stop_after_stage?: string;
    mode?: string;
    baseline_deliverable_id?: string;
  };
}

export interface FamilyOrchestrationReferenceRef {
  ref_kind: 'repo_path' | 'json_pointer' | 'workspace_locator' | 'external_url' | string;
  ref: string;
  label?: string;
}

export interface FamilyOrchestrationGatePreview {
  gate_id: string;
  title?: string;
  status?: 'requested' | 'approved' | 'rejected' | 'changes_requested' | string;
  review_surface?: FamilyOrchestrationReferenceRef;
}

export interface FamilyOrchestrationResumeContract {
  surface_kind: string;
  session_locator_field: string;
  checkpoint_locator_field?: string;
}

export interface FamilyOrchestrationCompanion {
  action_graph_ref?: FamilyOrchestrationReferenceRef;
  human_gates: FamilyOrchestrationGatePreview[];
  resume_contract: FamilyOrchestrationResumeContract;
  event_envelope_surface?: FamilyOrchestrationReferenceRef;
  checkpoint_lineage_surface?: FamilyOrchestrationReferenceRef;
}

export interface ProductEntryQuickstartStep {
  step_id: string;
  title?: string;
  command: string;
  surface_kind: string;
  summary?: string;
  requires?: string[];
}

export interface ProductEntryQuickstartCompanion {
  surface_kind: 'product_entry_quickstart' | string;
  recommended_step_id: string;
  summary?: string;
  steps: ProductEntryQuickstartStep[];
  resume_contract?: FamilyOrchestrationResumeContract;
  human_gate_ids?: string[];
}

export interface ProductEntryResponse extends SurfaceBase<'product_entry'> {
  product_entry_contract_id: string;
  entry_session: {
    entry_session_id: string;
    session_file: string;
    resumed_from_session: boolean;
    created_deliverable: boolean;
    runtime_owner: string;
  };
  delivery_identity: {
    deliverable_family: string;
    topic_id: string;
    deliverable_id: string;
    profile_id: string | null;
  };
  domain_entry_surface: DomainEntryResponse;
  continuation_snapshot: {
    latest_managed_run_id: string | null;
    latest_run_id: string | null;
    managed_progress_projection: ManagedRunProjection | null;
    runtime_supervision: ManagedRuntimeSupervision | null;
  };
  review_state: ReviewStateResponse;
  publication_projection: PublicationProjectionResponse;
  family_orchestration: FamilyOrchestrationCompanion;
  summary: {
    entry_session_id: string;
    task_intent: string;
    actual_surface_kind: string | null;
    target_handle: string | null;
  };
}

export interface FederatedProductEntryRequest extends Record<string, unknown> {
  target_domain_id: string;
  task_intent: 'run_managed_deliverable' | 'run_deliverable_route' | string;
  entry_mode: string;
  workspace_locator: {
    workspace_root: string;
  };
  runtime_session_contract: {
    runtime_owner: string;
  };
  return_surface_contract: {
    surface_kind: string;
  };
  entry_session_contract: ProductEntryRequest['entry_session_contract'];
  delivery_request: ProductEntryRequest['delivery_request'];
}

export interface FederatedProductEntryResponse extends SurfaceBase<'federated_product_entry'> {
  federated_product_entry_contract_id: string;
  target_domain_id: string;
  entry_mode: string;
  runtime_session_contract: Record<string, unknown>;
  return_surface_contract: {
    requested_surface_kind: string;
    actual_surface_kind: string;
  };
  family_orchestration: FamilyOrchestrationCompanion;
  product_entry_surface: ProductEntryResponse;
  summary: {
    entry_session_id: string | null;
    actual_surface_kind: string;
    target_handle: string | null;
  };
}

export interface ProductEntrySessionResponse extends SurfaceBase<'product_entry_session'> {
  product_entry_contract_id: string;
  entry_session: {
    entry_session_id: string;
    session_file: string;
    runtime_owner: string;
  };
  delivery_identity: {
    deliverable_family: string;
    topic_id: string;
    deliverable_id: string;
    profile_id: string | null;
  };
  continuation_snapshot: {
    latest_managed_run_id: string | null;
    latest_run_id: string | null;
    managed_progress_projection: ManagedRunProjection | null;
    runtime_supervision: ManagedRuntimeSupervision | null;
  };
  review_state: ReviewStateResponse;
  publication_projection: PublicationProjectionResponse;
  family_orchestration: FamilyOrchestrationCompanion;
  summary: {
    entry_session_id: string;
    deliverable_id: string;
    latest_handle: string | null;
  };
}

export interface ProductEntryManifestResponse extends SurfaceBase<'product_entry_manifest'> {
  manifest_version: 2 | number;
  manifest_kind: string;
  target_domain_id: string;
  formal_entry: {
    default: 'CLI' | string;
    supported_protocols: string[];
    internal_surface: string;
  };
  workspace_locator: {
    workspace_surface_kind: string;
    workspace_root: string;
  };
  recommended_shell: 'direct' | 'federated' | 'session' | string;
  frontdesk_surface: {
    shell_key: 'frontdesk' | string;
    command: string;
    surface_kind: string;
    summary: string;
  };
  operator_loop_surface: {
    shell_key: 'direct' | 'federated' | 'session' | string;
    command: string;
    surface_kind: string;
    summary: string;
    continuation_shell_key?: 'direct' | 'federated' | 'session' | string;
    continuation_command?: string;
  };
  operator_loop_actions: Record<string, {
    command: string;
    surface_kind: string;
    summary: string;
    requires: string[];
  }>;
  product_entry_status: {
    summary: string;
    next_focus: string[];
    remaining_gaps_count: number;
  };
  runtime: {
    runtime_owner: string;
    runtime_state_root: string;
    session_store_root: string;
  };
  product_entry_shell: {
    frontdesk: {
      command: string;
      command_template: string;
      surface_kind: 'product_frontdesk' | string;
    };
    direct: {
      command: string;
      command_template: string;
      surface_kind: 'product_entry';
    };
    federated: {
      command: string;
      command_template: string;
      surface_kind: 'federated_product_entry';
    };
    session: {
      command: string;
      command_template: string;
      surface_kind: 'product_entry_session';
    };
  };
  shared_handoff: {
    opl_return_surface: {
      surface_kind: 'product_entry';
      target_domain_id: string;
    };
  };
  product_entry_quickstart: ProductEntryQuickstartCompanion;
  family_orchestration: FamilyOrchestrationCompanion;
  current_truth: {
    product_entry_contract: string;
    federated_product_entry_contract: string;
    managed_product_entry_contract: string;
  };
  notes: string[];
}

export interface ProductFrontdeskResponse extends SurfaceBase<'product_frontdesk'> {
  target_domain_id: string;
  frontdesk_surface: ProductEntryManifestResponse['frontdesk_surface'];
  workspace_locator: ProductEntryManifestResponse['workspace_locator'];
  runtime: ProductEntryManifestResponse['runtime'];
  product_entry_status: ProductEntryManifestResponse['product_entry_status'];
  operator_loop_surface: ProductEntryManifestResponse['operator_loop_surface'];
  operator_loop_actions: ProductEntryManifestResponse['operator_loop_actions'];
  product_entry_quickstart: ProductEntryManifestResponse['product_entry_quickstart'];
  family_orchestration: ProductEntryManifestResponse['family_orchestration'];
  product_entry_manifest: ProductEntryManifestResponse;
  entry_surfaces: {
    direct: ProductEntryManifestResponse['product_entry_shell']['direct'];
    federated: ProductEntryManifestResponse['product_entry_shell']['federated'];
    session: ProductEntryManifestResponse['product_entry_shell']['session'];
  };
  summary: {
    frontdesk_command: string | null;
    recommended_command: string;
    operator_loop_command: string | null;
  };
  notes: string[];
}

export interface ManagedRunProjection {
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

export interface ManagedRuntimeSupervision {
  schema_version: 1;
  recorded_at: string;
  managed_run_id: string;
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
  content_status: ManagedRunProjection['content_status'];
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

export interface ManagedRunResponse extends SurfaceBase<'managed_run'> {
  managed_run: Record<string, unknown>;
  progress_projection: ManagedRunProjection;
  runtime_supervision: ManagedRuntimeSupervision;
  escalation_record: ManagedEscalationRecord;
  summary: {
    managed_run_id: string | null;
    status: string | null;
    current_stage: string | null;
  };
}

export interface ManagedRunRecordResponse extends SurfaceBase<'managed_run_record'> {
  managed_run: ManagedRunResponse['managed_run'];
  progress_projection: ManagedRunProjection;
  runtime_supervision: ManagedRuntimeSupervision;
  escalation_record: ManagedEscalationRecord;
  summary: ManagedRunResponse['summary'];
}

export interface ManagedSupervisionResponse extends SurfaceBase<'managed_supervision'> {
  managed_run: ManagedRunResponse['managed_run'];
  progress_projection: ManagedRunProjection;
  runtime_supervision: ManagedRuntimeSupervision;
  escalation_record: ManagedEscalationRecord;
  summary: ManagedRunResponse['summary'];
}

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
  augmentation: Record<string, unknown>;
  summary: {
    topic_id: string;
    audit_status: string | null;
    blocking_reason_count: number;
  };
}

export interface SourceResearchResponse extends SurfaceBase<'source_research'> {
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

export interface SourceResearchResponse extends SurfaceBase<'source_research'> {
  stage: string;
  planningReady: boolean;
  artifactFiles: Record<string, string>;
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
  review_state?: Record<string, unknown> | null;
  publication_projection?: Record<string, unknown> | null;
  source_readiness_summary: Record<string, unknown> | null;
  gate_summary: Record<string, unknown> | null;
  operator_handoff: Record<string, unknown> | null;
  lifecycle_stage_summary: Record<string, unknown> | null;
  governance_surface: GovernanceSurfaceContract | null;
  delivery_contract?: Record<string, unknown> | null;
}

export interface RunDeliverableRouteRequest extends DeliverableRequest, OverlayRequest {
  route: string;
  adapter?: string;
  managedRunId?: string | null;
}

export interface RunManagedDeliverableRequest extends DeliverableRequest, OverlayRequest {
  adapter?: string;
  userIntent?: string;
  stopAfterStage?: string;
  mode?: string;
  baselineDeliverableId?: string;
}

export interface SuperviseManagedRunRequest extends WorkspaceRootRequest {
  managedRunId: string;
}
