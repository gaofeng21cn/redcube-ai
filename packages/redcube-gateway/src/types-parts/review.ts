import type { GovernanceSurfaceContract } from '@redcube/overlay-core';

import type {
  ApprovalThroughputSummary,
  CostSummary,
  ErrorTaxonomySummary,
  MetricExtensionSummary,
  QualityDriftSummary,
  RerunAnalyticsSummary,
  RunTelemetrySummary,
} from './telemetry.js';
import type {
  DeliverableRequest,
  OverlayRequest,
  SurfaceBase,
} from './foundation.js';

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
