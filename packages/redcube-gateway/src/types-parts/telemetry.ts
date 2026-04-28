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
