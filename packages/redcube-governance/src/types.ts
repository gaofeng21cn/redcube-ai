export interface ReviewSurfaceResult {
  status: string;
  issues?: string[];
  rerun_from_stage?: string | null;
  recommended_action?: string;
}

export interface DeliverableReviewRequest {
  workspaceRoot?: string;
  overlay?: string;
  topicId?: string;
  deliverableId?: string;
  mode?: string;
  baselineDeliverableId?: string;
  checks?: Record<string, unknown>;
  run?: Record<string, unknown>;
}

export interface AuditDeliverableRequest {
  mode: string;
  baselineDeliverableId: string;
}

export interface ReviewMutationRequest {
  workspaceRoot: string;
  topicId: string;
  deliverableId: string;
  mutation: Record<string, unknown>;
}

export interface PersistReviewStatePatchRequest {
  workspaceRoot: string;
  topicId: string;
  deliverableId: string;
  patch: Record<string, unknown>;
  source?: string;
}

export interface CanonicalSourceRef {
  kind: string;
}

export interface ReviewStateResponse {
  ok: boolean;
  surface_kind: 'review_state';
  state_type: 'canonical';
  canonical_source: CanonicalSourceRef;
  state: Record<string, unknown>;
  quality_summary: Record<string, unknown>;
  state_file: string;
  history_file: string;
  operator_handoff?: Record<string, unknown> | null;
}

export interface PublicationProjectionResponse {
  ok: boolean;
  surface_kind: 'publication_projection';
  topic_id: string;
  state_type: 'projection';
  projection_file: string;
  publication: Record<string, unknown>;
  canonical_source: CanonicalSourceRef;
}

export interface ReviewMutationResponse {
  ok: boolean;
  state: Record<string, unknown>;
  quality_summary: Record<string, unknown>;
  state_file: string;
  history_file: string;
  publication_state_file: string | null;
}

export interface RuntimeWatchResponse {
  ok: boolean;
  surface_kind: 'runtime_watch';
  run_id: string;
  current_stage: string | null;
  status: string;
  pending_reviews: string[];
  review_state: Record<string, unknown> | null;
  quality_summary: Record<string, unknown>;
  publication_projection: Record<string, unknown> | null;
  source_readiness_summary: Record<string, unknown> | null;
  gate_summary: Record<string, unknown> | null;
  operator_handoff: Record<string, unknown> | null;
  resumable: boolean;
  profile_id: string | null;
  delivery_contract: Record<string, unknown> | null;
  required_export_bundle: Record<string, unknown> | null;
}

export interface MetricExtensionRegistration {
  extension_id: string;
  overlay_scope: string[];
  profile_scope: string[];
  metric_ids: string[];
  status: 'declared' | 'inactive';
}
