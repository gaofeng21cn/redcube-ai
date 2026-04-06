function toNullableString(value) {
  const text = String(value || '').trim();
  return text || null;
}

function toNullableNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toStringArray(value) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

const POSTER_METRIC_IDS = Object.freeze([
  'far_view_readability',
  'scan_path_clarity',
  'figure_claim_alignment',
  'density_balance',
  'citation_visibility',
  'venue_metadata_complete',
  'print_export_safe',
]);

export function buildRunTelemetrySummary(source = {}) {
  const telemetry = source?.run_telemetry || source?.telemetry || {};
  return {
    run_id: toNullableString(telemetry.run_id || source?.run_id),
    route: toNullableString(telemetry.route || source?.route),
    overlay: toNullableString(telemetry.overlay || source?.overlay),
    scope: toNullableString(telemetry.scope || source?.scope),
    target: toNullableString(telemetry.target || source?.target),
    executor_kind: toNullableString(telemetry.executor_kind || source?.executor?.adapter),
    execution_surface: toNullableString(telemetry.execution_surface || source?.executor?.execution_surface),
    status: toNullableString(telemetry.status || source?.status),
    started_at: toNullableString(telemetry.started_at || source?.started_at),
    finished_at: toNullableString(telemetry.finished_at || source?.finished_at),
    latency_ms: toNullableNumber(telemetry.latency_ms),
    prompt_tokens: toNullableNumber(telemetry.prompt_tokens),
    completion_tokens: toNullableNumber(telemetry.completion_tokens),
    estimated_cost: toNullableNumber(telemetry.estimated_cost),
  };
}

export function buildErrorTaxonomySummary(source = {}) {
  return {
    error_kind: toNullableString(source?.error_kind),
    error_message: toNullableString(source?.error?.message),
    current_stage: toNullableString(source?.current_stage),
    failed: String(source?.status || '').trim() === 'failed',
  };
}

export function buildRerunAnalyticsSummary(source = {}) {
  const linkage = source?.rerun_linkage || {};
  return {
    rerun_count: Number.isFinite(linkage?.rerun_count) ? linkage.rerun_count : 0,
    previous_run_id: toNullableString(linkage?.previous_run_id),
    source_stage: toNullableString(linkage?.source_stage),
    blocking_review: toNullableString(linkage?.blocking_review),
    baseline_deliverable_id: toNullableString(linkage?.baseline_deliverable_id),
  };
}

export function buildCostSummary(source = {}) {
  const telemetry = buildRunTelemetrySummary(source);
  return {
    executor_identity: telemetry.execution_surface,
    executor_kind: telemetry.executor_kind,
    latency_ms: telemetry.latency_ms,
    prompt_tokens: telemetry.prompt_tokens,
    completion_tokens: telemetry.completion_tokens,
    estimated_cost: telemetry.estimated_cost,
  };
}

export function buildQualityDriftSummary({ qualitySummary = {} } = {}) {
  const degradations = toStringArray(qualitySummary?.degradations);
  const improvements = toStringArray(qualitySummary?.improvements);
  const acceptableChanges = toStringArray(qualitySummary?.acceptable_changes);
  return {
    relative_quality_verdict: toNullableString(qualitySummary?.relative_quality_verdict),
    degradation_count: degradations.length,
    improvement_count: improvements.length,
    acceptable_change_count: acceptableChanges.length,
    baseline_promotion_state: toNullableString(qualitySummary?.baseline_promotion_state),
    promoted_reference_id: toNullableString(qualitySummary?.promoted_reference_id),
  };
}

export function buildApprovalThroughputSummary({
  status,
  pendingReviews = [],
  reviewState = null,
} = {}) {
  const normalizedPendingReviews = toStringArray(pendingReviews);
  const publishState = toNullableString(reviewState?.publish_state?.current || reviewState?.current_status);
  const normalizedStatus = String(status || '').trim();
  return {
    publish_state: publishState,
    pending_review_count: normalizedPendingReviews.length,
    approval_pending: publishState === 'approval_pending',
    published: publishState === 'published',
    blocked: normalizedStatus === 'failed' || normalizedStatus === 'review_pending' || normalizedPendingReviews.length > 0,
  };
}

export function buildMetricExtensions({ overlay = null, profileId = null } = {}) {
  const normalizedOverlay = toNullableString(overlay);
  const normalizedProfileId = toNullableString(profileId);
  const isPosterFamily = normalizedOverlay === 'poster_onepager'
    || normalizedOverlay === 'paper_poster'
    || normalizedProfileId === 'knowledge_poster'
    || normalizedProfileId === 'conference_poster';
  if (!isPosterFamily) {
    return [];
  }

  return [
    {
      extension_id: 'poster_specific_metrics',
      overlay_scope: [normalizedOverlay],
      profile_scope: normalizedProfileId ? [normalizedProfileId] : [],
      status: 'declared',
      metrics: POSTER_METRIC_IDS.map((metricId) => ({
        metric_id: metricId,
        value: null,
        status: 'not_evaluated',
      })),
    },
  ];
}
