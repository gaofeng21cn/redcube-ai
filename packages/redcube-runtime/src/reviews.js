export function auditDeliverableRequest({ mode, baselineDeliverableId }) {
  if (mode === 'optimize_existing' && !String(baselineDeliverableId || '').trim()) {
    return {
      status: 'block',
      issues: ['baseline_missing'],
      rerun_from_stage: 'intake',
      recommended_action: 'bind_baseline_deliverable',
    };
  }

  return {
    status: 'pass',
    issues: [],
    rerun_from_stage: null,
    recommended_action: 'continue',
  };
}

export function reviewRenderedDeliverable({ checks }) {
  if (!Object.hasOwn(checks || {}, 'visual_density_ok')) {
    return {
      status: 'block',
      issues: ['visual_density_check_missing'],
      rerun_from_stage: 'render_review',
      recommended_action: 'supply_render_checks',
    };
  }

  if (!checks.visual_density_ok) {
    return {
      status: 'block',
      issues: ['visual_density_too_high'],
      rerun_from_stage: 'visual_direction',
      recommended_action: 'revise_visual_direction',
    };
  }

  return {
    status: 'pass',
    issues: [],
    rerun_from_stage: null,
    recommended_action: 'continue',
  };
}

export function watchRuntimeReviewLoop({ run }) {
  const pendingReviews = Array.isArray(run?.pending_reviews)
    ? run.pending_reviews.map((item) => String(item).trim()).filter(Boolean)
    : [];

  return {
    ok: true,
    run_id: String(run?.run_id || '').trim(),
    current_stage: String(run?.current_stage || '').trim() || null,
    status: pendingReviews.length > 0 ? 'review_pending' : String(run?.status || 'idle'),
    pending_reviews: pendingReviews,
    resumable: Boolean(run?.resumable),
  };
}
