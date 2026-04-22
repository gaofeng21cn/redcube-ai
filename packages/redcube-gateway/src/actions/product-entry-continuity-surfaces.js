function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function buildRestorePoint({ continuationSnapshot }) {
  const latestManagedRunId = continuationSnapshot?.latest_managed_run_id || null;
  const latestRunId = continuationSnapshot?.latest_run_id || null;
  return {
    latest_handle: latestManagedRunId || latestRunId || null,
    latest_managed_run_id: latestManagedRunId,
    latest_run_id: latestRunId,
  };
}

export function buildSessionContinuitySurface({
  entrySessionId,
  sessionFile,
  runtimeOwner,
  deliveryIdentity,
  continuationSnapshot,
}) {
  const restorePoint = buildRestorePoint({ continuationSnapshot });
  return {
    surface_kind: 'session_continuity',
    entry_session_id: entrySessionId,
    session_file: sessionFile,
    runtime_owner: runtimeOwner,
    delivery_identity: {
      deliverable_family: safeText(deliveryIdentity?.deliverable_family),
      topic_id: safeText(deliveryIdentity?.topic_id),
      deliverable_id: safeText(deliveryIdentity?.deliverable_id),
      profile_id: deliveryIdentity?.profile_id ?? null,
    },
    restore_point: restorePoint,
    summary: {
      entry_session_id: entrySessionId,
      latest_handle: restorePoint.latest_handle,
    },
  };
}

export function buildProgressProjectionSurface({ continuationSnapshot }) {
  const projection = continuationSnapshot?.managed_progress_projection || null;
  if (!projection) {
    return null;
  }

  const refs = continuationSnapshot?.runtime_supervision?.refs || null;
  return {
    surface_kind: 'progress_projection',
    managed_run_id: continuationSnapshot?.latest_managed_run_id || null,
    projection,
    refs,
    summary: {
      current_stage: projection.current_stage ?? null,
      content_status: projection.content_status ?? null,
      needs_user_decision: Boolean(projection.needs_user_decision),
    },
  };
}

export function buildArtifactInventorySurface({
  entrySessionId,
  sessionFile,
  continuationSnapshot,
}) {
  const restorePoint = buildRestorePoint({ continuationSnapshot });
  const projection = continuationSnapshot?.managed_progress_projection || null;
  const artifactRefs = Array.isArray(projection?.final_artifact_refs)
    ? projection.final_artifact_refs
    : [];

  return {
    surface_kind: 'artifact_inventory',
    entry_session_id: entrySessionId,
    session_file: sessionFile,
    restore_point: restorePoint,
    artifact_refs: artifactRefs,
    refs: continuationSnapshot?.runtime_supervision?.refs || null,
    summary: {
      latest_handle: restorePoint.latest_handle,
      artifact_ref_count: artifactRefs.length,
    },
  };
}

