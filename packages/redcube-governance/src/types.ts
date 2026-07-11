import type { GovernanceSurfaceContract as OverlayGovernanceSurfaceContract } from '@redcube/overlay-core';

export interface GovernanceSurfaceContract extends OverlayGovernanceSurfaceContract {}

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
  source_readiness_summary: Record<string, unknown> | null;
  gate_summary: Record<string, unknown> | null;
  operator_handoff: Record<string, unknown> | null;
  lifecycle_stage_summary: Record<string, unknown> | null;
  governance_surface: GovernanceSurfaceContract;
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

export interface VisualReviewRefProjectionResponse {
  ok: boolean;
  surface_kind: 'rca_visual_review_refs_projection';
  delivery_locator_refs: Record<string, unknown>;
  visual_review_semantics: Record<string, unknown>;
  review_state_refs: Record<string, unknown>;
  artifact_locator_refs: Record<string, unknown>;
  typed_blocker_refs: Record<string, unknown>;
  owner_evidence_refs: Record<string, unknown>;
}

interface MetricExtensionRegistration {
  extension_id: string;
  overlay_scope: string[];
  profile_scope: string[];
  metric_ids: string[];
  status: 'declared' | 'inactive';
}
