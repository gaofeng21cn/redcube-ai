// @ts-nocheck

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

export function deliveryProjectionIsOutputReady({ reviewState, publicationProjection, deliverableId, publicationProjectionForDeliverable }) {
  const deliverableProjection = publicationProjectionForDeliverable(publicationProjection, deliverableId);
  const gateSummary = deliverableProjection?.gate_summary || reviewState?.gate_summary || {};
  const operatorHandoff = deliverableProjection?.operator_handoff || {};
  const reviewStatePayload = reviewState?.state || {};

  return safeText(deliverableProjection?.current) === 'output_ready'
    || safeText(gateSummary?.operator_handoff_status) === 'ready'
    || safeText(operatorHandoff?.gate_status) === 'ready'
    || (
      safeText(reviewStatePayload?.current_status) === 'completed'
      && safeText(reviewStatePayload?.latest_review_stage) === 'export_pptx'
      && reviewStatePayload?.ready_for_export === true
    );
}

export function buildRecommendedAction({
  runtimeProjectionSurface,
  runtimeLoopClosure,
  reviewState,
  publicationProjection,
  deliverableId,
  publicationProjectionForDeliverable,
}) {
  const projection = runtimeProjectionSurface?.progress_projection || null;
  if (projection?.needs_user_decision) {
    return 'decide_product_next_step';
  }
  if (projection?.content_status === 'completed') {
    return 'pick_up_artifacts';
  }
  if (deliveryProjectionIsOutputReady({
    reviewState,
    publicationProjection,
    deliverableId,
    publicationProjectionForDeliverable,
  })) {
    return 'pick_up_artifacts';
  }
  return runtimeLoopClosure?.control_policy?.recommended_action || 'continue_product_entry';
}

export function buildPptImageRouteSessionSurface({ session }) {
  if (safeText(session.deliverable_family) !== 'ppt_deck') {
    return null;
  }
  return {
    surface_kind: 'ppt_deck_visual_route_session',
    default_visual_route: 'author_image_pages',
    default_visual_policy: 'image_first',
    repair_route: 'repair_image_pages',
    selectable_explicit_routes: ['render_html', 'fix_html', 'author_pptx_native', 'repair_pptx_native'],
    route_selection_policy: {
      html_routes: ['render_html', 'fix_html'],
      native_routes: ['author_pptx_native', 'repair_pptx_native'],
      explicit_selection_required_for: ['render_html', 'fix_html', 'author_pptx_native', 'repair_pptx_native'],
      style_reference_dir_input: 'delivery_request.style_reference_dir',
    },
    provider_diagnostics: {
      surface_kind: 'image_provider_diagnostics',
      provider_status: 'runtime_checked',
      blocked_reason: null,
    },
  };
}

export function buildSessionDeliveryIdentityPayload(session, { includeProfile = true } = {}) {
  const payload = {
    deliverable_family: session.deliverable_family,
    topic_id: session.topic_id,
    deliverable_id: session.deliverable_id,
  };
  if (includeProfile) {
    payload.profile_id = session.profile_id || null;
  }
  return payload;
}

export function buildProductEntrySessionSummary({
  entrySessionId,
  session,
  nativeProofArtifactInventory,
  pptImageRouteSession,
  runtimeLoopClosure,
  familyOrchestration,
}) {
  const latestHandle = session.latest_stage_execution_plan_ref
    || session.latest_run_id
    || null;
  return {
    entry_session_id: entrySessionId,
    deliverable_id: session.deliverable_id,
    latest_handle: latestHandle,
    target_handle: latestHandle,
    native_proof_artifact_ref_count: nativeProofArtifactInventory.summary.artifact_ref_count,
    ppt_deck_default_visual_route: pptImageRouteSession?.default_visual_route || null,
    ppt_deck_default_visual_policy: pptImageRouteSession?.default_visual_policy || null,
    approval_required: Boolean(runtimeLoopClosure?.control_policy?.approval_required),
    gate_status: runtimeLoopClosure?.control_policy?.gate_status || null,
    resume_command: runtimeLoopClosure?.control_policy?.continue_action?.command || null,
    session_locator_field: familyOrchestration?.resume_contract?.session_locator_field || null,
    checkpoint_locator_field: familyOrchestration?.resume_contract?.checkpoint_locator_field || null,
  };
}
