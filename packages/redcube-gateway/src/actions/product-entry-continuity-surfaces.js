function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

const PRODUCT_ENTRY_SESSION_COMMAND_TEMPLATE = 'redcube product session --entry-session-id <entry-session-id>';
const REDCUBE_LOOP_OWNER = 'redcube_ai';

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

function buildLoopOwner(runtimeOwner) {
  return {
    runtime_owner: safeText(runtimeOwner),
    domain_owner: REDCUBE_LOOP_OWNER,
    product_entry_owner: REDCUBE_LOOP_OWNER,
  };
}

export function buildRuntimeLoopClosureSurface({
  entrySessionId,
  sessionFile,
  runtimeOwner,
  deliveryIdentity,
  continuationSnapshot,
  source,
  entryMode,
}) {
  const restorePoint = buildRestorePoint({ continuationSnapshot });
  const projection = continuationSnapshot?.managed_progress_projection || null;
  const artifactRefs = Array.isArray(projection?.final_artifact_refs)
    ? projection.final_artifact_refs
    : [];

  return {
    surface_kind: 'runtime_loop_closure',
    loop_owner: buildLoopOwner(runtimeOwner),
    resume_point: {
      entry_session_id: safeText(entrySessionId) || null,
      session_file: safeText(sessionFile) || null,
      latest_managed_run_id: restorePoint.latest_managed_run_id,
      latest_run_id: restorePoint.latest_run_id,
      latest_handle: restorePoint.latest_handle,
      resume_command_template: PRODUCT_ENTRY_SESSION_COMMAND_TEMPLATE,
      checkpoint_locator_field: 'continuation_snapshot.latest_managed_run_id',
    },
    progress_cursor: {
      surface_kind: 'progress_projection',
      surface_ref: '/progress_projection',
      managed_run_id: continuationSnapshot?.latest_managed_run_id || null,
      current_stage: projection?.current_stage ?? null,
      content_status: projection?.content_status ?? null,
      needs_user_decision: Boolean(projection?.needs_user_decision),
    },
    artifact_pickup: {
      surface_kind: 'artifact_inventory',
      surface_ref: '/artifact_inventory',
      deliverable_family: safeText(deliveryIdentity?.deliverable_family),
      topic_id: safeText(deliveryIdentity?.topic_id),
      deliverable_id: safeText(deliveryIdentity?.deliverable_id),
      artifact_refs: artifactRefs,
      artifact_ref_count: artifactRefs.length,
    },
    control_policy: {
      approval_gate_id: 'redcube_operator_review_gate',
      approval_required: Boolean(projection?.needs_user_decision),
      interrupt_policy: 'human_gate_required_before_continuation',
      continue_action: {
        command: PRODUCT_ENTRY_SESSION_COMMAND_TEMPLATE,
        surface_kind: 'product_entry_session',
      },
      human_gate_ids: ['redcube_operator_review_gate'],
    },
    source_linkage: {
      current_source: safeText(source),
      entry_mode: safeText(entryMode) || null,
      direct_surface_kind: 'product_entry',
      federated_surface_kind: 'federated_product_entry',
      session_surface_kind: 'product_entry_session',
      downstream_entry_surface_kind: 'domain_entry',
    },
  };
}

export function buildRuntimeLoopClosureManifestSurface({
  runtimeOwner,
}) {
  return {
    surface_kind: 'runtime_loop_closure',
    loop_owner: buildLoopOwner(runtimeOwner),
    resume_point: {
      entry_session_id: null,
      session_file: null,
      latest_managed_run_id: null,
      latest_run_id: null,
      latest_handle: null,
      resume_command_template: PRODUCT_ENTRY_SESSION_COMMAND_TEMPLATE,
      checkpoint_locator_field: 'continuation_snapshot.latest_managed_run_id',
    },
    progress_cursor: {
      surface_kind: 'progress_projection',
      surface_ref: '/progress_projection',
      managed_run_id: null,
      current_stage: null,
      content_status: null,
      needs_user_decision: false,
    },
    artifact_pickup: {
      surface_kind: 'artifact_inventory',
      surface_ref: '/artifact_inventory',
      deliverable_family: null,
      topic_id: null,
      deliverable_id: null,
      artifact_refs: [],
      artifact_ref_count: 0,
    },
    control_policy: {
      approval_gate_id: 'redcube_operator_review_gate',
      approval_required: true,
      interrupt_policy: 'human_gate_required_before_continuation',
      continue_action: {
        command: PRODUCT_ENTRY_SESSION_COMMAND_TEMPLATE,
        surface_kind: 'product_entry_session',
      },
      human_gate_ids: ['redcube_operator_review_gate'],
    },
    source_linkage: {
      current_source: 'manifest',
      entry_mode: 'manifest_projection',
      direct_surface_kind: 'product_entry',
      federated_surface_kind: 'federated_product_entry',
      session_surface_kind: 'product_entry_session',
      downstream_entry_surface_kind: 'domain_entry',
    },
  };
}
