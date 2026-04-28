// @ts-nocheck
export function buildReviewGateSummary({
  sourceReadinessSummary,
  reviewState,
  contract,
  publicationProjectionEntry,
  operatorHandoff,
}) {
  return {
    source_readiness_status: sourceReadinessSummary?.status || null,
    source_planning_ready: sourceReadinessSummary?.planning_ready === true,
    source_sufficiency_status: String(sourceReadinessSummary?.sufficiency_status || '').trim() || null,
    source_deep_research_state: String(sourceReadinessSummary?.deep_research_state || '').trim() || null,
    source_blocking_evidence_gaps: Array.isArray(sourceReadinessSummary?.blocking_evidence_gaps)
      ? sourceReadinessSummary.blocking_evidence_gaps
      : [],
    source_next_required_surface: String(sourceReadinessSummary?.next_required_surface || '').trim() || null,
    review_status: String(reviewState?.current_status || '').trim() || null,
    approval_status: String(reviewState?.approval_state?.status || '').trim() || null,
    latest_review_stage: String(reviewState?.latest_review_stage || '').trim() || null,
    export_status: reviewState ? (reviewState.ready_for_export ? 'ready' : 'not_ready') : null,
    required_export_route: String(contract?.delivery_contract?.required_export_route || '').trim() || null,
    required_export_bundle_id: String(
      contract?.delivery_contract?.required_export_bundle_id || contract?.export_bundle?.bundle_id || '',
    ).trim() || null,
    approval_required: Boolean(contract?.delivery_contract?.human_gate?.required),
    delivery_projection_current: String(publicationProjectionEntry?.current || '').trim() || null,
    delivery_projection_next: String(publicationProjectionEntry?.next || '').trim() || null,
    operator_handoff_status: String(operatorHandoff?.gate_status || '').trim() || null,
    delivery_state_owner: String(operatorHandoff?.delivery_state_owner || '').trim() || null,
  };
}
