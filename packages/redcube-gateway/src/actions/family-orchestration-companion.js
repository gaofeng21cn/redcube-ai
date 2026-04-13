function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

const PRODUCT_ENTRY_ACTION_GRAPH_REF = Object.freeze({
  ref_kind: 'repo_path',
  ref: 'contracts/runtime-program/redcube-product-entry-mvp.json',
  label: 'redcube product entry operator loop',
});

function cloneReference(reference) {
  if (!reference) {
    return null;
  }
  return {
    ref_kind: reference.ref_kind,
    ref: reference.ref,
    ...(safeText(reference.label) ? { label: reference.label } : {}),
  };
}

export function resolveHumanGateStatusFromContinuation(continuationSnapshot) {
  const needsUserDecision = Boolean(continuationSnapshot?.managed_progress_projection?.needs_user_decision);
  return needsUserDecision ? 'requested' : 'approved';
}

export function buildFamilyOrchestrationCompanion({
  sessionLocatorField,
  gateStatus = 'requested',
  reviewSurfaceRef = null,
  eventEnvelopeSurfaceRef = null,
  checkpointLineageSurfaceRef = null,
}) {
  const sessionField = safeText(sessionLocatorField);
  if (!sessionField) {
    throw new Error('family_orchestration.resume_contract.session_locator_field 不能为空');
  }

  const reviewSurface = cloneReference(reviewSurfaceRef);
  const eventEnvelopeSurface = cloneReference(eventEnvelopeSurfaceRef);
  const checkpointLineageSurface = cloneReference(checkpointLineageSurfaceRef);

  return {
    action_graph_ref: {
      ...PRODUCT_ENTRY_ACTION_GRAPH_REF,
    },
    human_gates: [
      {
        gate_id: 'redcube_operator_review_gate',
        title: 'RedCube operator review gate',
        status: safeText(gateStatus, 'requested'),
        ...(reviewSurface ? { review_surface: reviewSurface } : {}),
      },
    ],
    resume_contract: {
      surface_kind: 'product_entry_session',
      session_locator_field: sessionField,
      checkpoint_locator_field: 'continuation_snapshot.latest_managed_run_id',
    },
    ...(eventEnvelopeSurface ? { event_envelope_surface: eventEnvelopeSurface } : {}),
    ...(checkpointLineageSurface ? { checkpoint_lineage_surface: checkpointLineageSurface } : {}),
  };
}
