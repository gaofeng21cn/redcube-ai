function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

const PRODUCT_ENTRY_SESSION_COMMAND_TEMPLATE = 'redcube product session --entry-session-id <entry-session-id>';
const REDCUBE_LOOP_OWNER = 'redcube_ai';
const REDCUBE_OPERATOR_REVIEW_GATE_ID = 'redcube_operator_review_gate';
const DEFAULT_INTERRUPT_POLICY = 'continue_autonomously_until_runtime_gate';
const REVIEW_INTERRUPT_POLICY = 'human_gate_required_before_continuation';

function buildControlPolicy({ projection, manifestProjection = false }) {
  const needsUserDecision = Boolean(projection?.needs_user_decision);
  const contentStatus = safeText(projection?.content_status);
  const completed = contentStatus === 'completed';
  const gateStatus = needsUserDecision ? 'requested' : 'approved';
  return {
    approval_gate_id: REDCUBE_OPERATOR_REVIEW_GATE_ID,
    approval_required: needsUserDecision,
    gate_status: gateStatus,
    default_run_mode: 'auto_to_terminal',
    stop_policy: 'stop_only_on_explicit_stop_after_stage_or_runtime_review_gate',
    interrupt_policy: needsUserDecision ? REVIEW_INTERRUPT_POLICY : DEFAULT_INTERRUPT_POLICY,
    recommended_action: needsUserDecision
      ? 'resolve_review_gate'
      : (completed ? 'pick_up_artifacts' : 'continue_autonomous_run'),
    continue_action: {
      command: PRODUCT_ENTRY_SESSION_COMMAND_TEMPLATE,
      surface_kind: 'product_entry_session',
    },
    human_gate_ids: manifestProjection || needsUserDecision ? [REDCUBE_OPERATOR_REVIEW_GATE_ID] : [],
  };
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
    continuity_cursor: {
      surface_kind: 'session_continuity',
      surface_ref: '/session_continuity',
      entry_session_id: safeText(entrySessionId) || null,
      latest_handle: restorePoint.latest_handle,
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
    control_policy: buildControlPolicy({ projection }),
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
  source = 'manifest',
  entryMode = 'manifest_projection',
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
    continuity_cursor: {
      surface_kind: 'session_continuity',
      surface_ref: '/session_continuity',
      entry_session_id: null,
      latest_handle: null,
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
      ...buildControlPolicy({ projection: null, manifestProjection: true }),
      approval_required: false,
      gate_status: 'approved',
      recommended_action: 'invoke_product_entry_auto_to_terminal',
    },
    source_linkage: {
      current_source: safeText(source, 'manifest'),
      entry_mode: safeText(entryMode, 'manifest_projection'),
      direct_surface_kind: 'product_entry',
      federated_surface_kind: 'federated_product_entry',
      session_surface_kind: 'product_entry_session',
      downstream_entry_surface_kind: 'domain_entry',
    },
  };
}

const PRODUCT_MANIFEST_COMMAND = 'redcube product manifest';
const PRODUCT_FRONTDESK_COMMAND = 'redcube product frontdesk';
const PRODUCT_FEDERATE_COMMAND = 'redcube product federate';

export function buildOplRuntimeManagerRegistration({
  runtimeContinuityEnvelope,
  productEntrySessionCommand,
}) {
  return {
    surface_kind: 'opl_runtime_manager_domain_registration',
    version: 'v1',
    registration_id: 'rca.opl_runtime_manager.registration.v1',
    manager_surface_id: 'opl_runtime_manager',
    domain_id: 'redcube',
    domain_owner: 'redcube_ai',
    runtime_owner: runtimeContinuityEnvelope.runtime_owner,
    executor_owner: runtimeContinuityEnvelope.executor_owner,
    domain_entry_surface: {
      surface_kind: 'product_frontdesk',
      command: PRODUCT_FRONTDESK_COMMAND,
      manifest_command: PRODUCT_MANIFEST_COMMAND,
    },
    registration_surface: {
      surface_kind: 'skill_catalog',
      ref: '/skill_catalog/skills/0/domain_projection/opl_runtime_manager_registration',
      command: PRODUCT_MANIFEST_COMMAND,
    },
    indexable_surfaces: [{ surface_id: 'product_entry_registration', surface_kind: 'skill_catalog', ref: '/skill_catalog/skills/0/domain_projection/opl_runtime_manager_registration' }, { surface_id: 'internal_opl_bridge', surface_kind: 'federated_product_entry', ref: '/product_entry_shell/opl_bridge' }, { surface_id: 'session_continuity', surface_kind: 'session_continuity', ref: '/session_continuity' }, { surface_id: 'artifact_inventory', surface_kind: 'artifact_inventory', ref: '/artifact_inventory' }, { surface_id: 'runtime_health', surface_kind: 'runtime_inventory', ref: '/runtime_inventory' }, { surface_id: 'review_publication_projection_refs', surface_kind: 'review_publication_refs', refs: ['/review_state', '/publication_projection'] }],
    consumable_projection_refs: ['/skill_catalog/skills/0/domain_projection/runtime_continuity', '/product_entry_shell/opl_bridge', '/session_continuity', '/artifact_inventory', '/runtime_inventory', '/review_state', '/publication_projection'],
    state_index_inputs: {
      workspace_registry_index: '/workspace_locator',
      managed_session_ledger_index: '/session_continuity',
      artifact_projection_index: '/artifact_inventory',
      attention_queue_index: '/automation/automations/0',
      runtime_health_snapshot_index: '/runtime_inventory',
    },
    resume_contract: {
      session_locator_field: runtimeContinuityEnvelope.session_locator_field,
      recommended_resume_command: runtimeContinuityEnvelope.recommended_resume_command,
      recommended_progress_command: runtimeContinuityEnvelope.recommended_progress_command,
      session_command_template: productEntrySessionCommand,
    },
    federated_handoff_surface: {
      surface_kind: 'federated_product_entry',
      command: PRODUCT_FEDERATE_COMMAND,
      ref: '/product_entry_shell/opl_bridge',
    },
    review_publication_truth: {
      review_state_ref: '/review_state',
      publication_projection_ref: '/publication_projection',
      route_rule: 'must_use_redcube_product_entry_and_review_export_gates',
    },
    route_equivalence: { ref: '/route_equivalence', downstream_domain_entry_ref: '/route_equivalence/downstream_runtime_truth', rule: 'direct_product_entry_and_internal_opl_bridge_share_the_same_downstream_domain_entry' },
    native_helper_index_consumption: { surface_kind: 'native_helper_index_consumption_proof', consumption_mode: 'index_only', input_refs: ['/runtime_inventory', '/artifact_inventory', '/skill_catalog/skills/0/domain_projection/runtime_continuity'], proof_summary: 'OPL Runtime Manager may index RCA native/helper availability and artifact pickup refs without writing RedCube visual truth, canonical artifacts, review/publication truth, or executor state.', writes_visual_truth: false, owns_canonical_artifacts: false, owns_executor: false },
    authority_boundary: { owns_visual_truth: false, owns_canonical_artifacts: false, owns_review_truth: false, owns_publication_projection: false, owns_concrete_executor: false, allowed_authority: ['read_product_entry_registration_index', 'read_internal_opl_bridge_index', 'read_session_continuity_index', 'read_artifact_inventory_index', 'read_runtime_health_index', 'read_review_publication_projection_refs'] },
    non_goals: ['not_a_visual_domain_truth_owner', 'not_a_canonical_artifact_owner', 'not_a_review_or_publication_projection_owner', 'not_a_concrete_executor'],
  };
}
