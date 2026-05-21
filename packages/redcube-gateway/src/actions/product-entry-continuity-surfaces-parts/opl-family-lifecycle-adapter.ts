// @ts-nocheck
function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildRestorePoint({ continuationSnapshot }) {
  const latestStageExecutionPlanRef = continuationSnapshot?.latest_stage_execution_plan_ref || null;
  const latestRunId = continuationSnapshot?.latest_run_id || null;
  return {
    latest_handle: latestStageExecutionPlanRef || latestRunId || null,
    latest_stage_execution_plan_ref: latestStageExecutionPlanRef,
    latest_run_id: latestRunId,
  };
}

function projectionFromStageExecutionPlan(stageExecutionPlan) {
  if (!stageExecutionPlan) return null;
  const summary = stageExecutionPlan.summary || {};
  return {
    projection_kind: 'opl_stage_execution_plan_projection',
    content_status: 'planned_for_opl_stage_execution',
    current_stage: summary.first_stage || null,
    terminal_stage: summary.terminal_stage || null,
    planned_stage_count: summary.planned_stage_count || 0,
    needs_user_decision: Boolean(stageExecutionPlan.control_policy?.approval_required),
    completed_stages: [],
    remaining_stages: safeArray(stageExecutionPlan.stage_attempts).map((stage) => stage.stage_id).filter(Boolean),
    final_artifact_refs: [],
  };
}

function buildOplFamilyOwnerSplit({ runtimeOwner, domainOwner }) {
  void runtimeOwner;
  return {
    family_persistence_owner: 'one-person-lab',
    session_shell_owner: 'one-person-lab',
    stage_attempt_owner: 'one-person-lab',
    attempt_ledger_owner: 'one-person-lab',
    lifecycle_projection_owner: domainOwner,
    domain_truth_owner: domainOwner,
    review_publication_owner: domainOwner,
    runtime_manager_consumer: 'opl_runtime_manager',
    executor_owner: 'configured_by_opl_runtime_provider',
  };
}

function buildOplFamilyRouteSurfaces({ domainOwner }) {
  return [
    {
      surface_id: 'product_entry_registration',
      surface_kind: 'skill_catalog',
      ref: '/skill_catalog/skills/0/domain_projection/opl_runtime_manager_registration',
      owner: domainOwner,
    },
    {
      surface_id: 'opl_hosted_stage_runtime',
      surface_kind: 'opl_hosted_product_entry',
      ref: '/product_entry_shell/opl_hosted',
      owner: domainOwner,
    },
    {
      surface_id: 'product_entry_session',
      surface_kind: 'opl_generated_product_entry_session',
      ref: '/session_continuity',
      owner: 'one-person-lab',
    },
    {
      surface_id: 'opl_stage_execution_plan',
      surface_kind: 'opl_stage_execution_plan',
      ref: '/continuation_snapshot/latest_stage_execution_plan_ref',
      owner: 'one-person-lab',
    },
    {
      surface_id: 'review_state',
      surface_kind: 'review_state',
      ref: '/review_state',
      owner: domainOwner,
    },
    {
      surface_id: 'publication_projection',
      surface_kind: 'publication_projection',
      ref: '/publication_projection',
      owner: domainOwner,
    },
  ];
}

function buildOplFamilyPersistence({
  domainOwner,
  entrySessionId,
  sessionFile,
  continuationSnapshot,
  runtimeLoopClosure,
  artifactLocatorContract = null,
}) {
  const restorePoint = buildRestorePoint({ continuationSnapshot });
  const runtimeRefs = continuationSnapshot?.runtime_projection?.refs || null;
  return {
    authority_model: 'file_authority_plus_rebuildable_artifact_indexes',
    sqlite: {
      status: 'deferred_for_rca',
      decision: 'do_not_add_sqlite_until_measured_rca_file_growth_or_cross_deliverable_query_pressure',
      allowed_future_scope: [
        'session index',
        'deliverable index',
        'route run index',
        'artifact path and hash index',
        'review and export bundle projection',
        'retention ledger projection',
      ],
      must_not_own: [
        'visual-domain truth',
        'canonical artifact truth',
        'review/export judgment',
        'PNG/PPTX/PDF blob storage',
      ],
    },
    session: {
      surface_kind: 'opl_generated_product_entry_session',
      entry_session_id: safeText(entrySessionId) || null,
      session_file: safeText(sessionFile) || null,
      latest_handle: restorePoint.latest_handle,
    },
    stage_execution_plan: {
      surface_kind: 'opl_stage_execution_plan',
      plan_ref: restorePoint.latest_stage_execution_plan_ref,
      provider_owner: 'opl_family_runtime_provider',
      attempt_ledger_owner: 'one-person-lab',
    },
    stage_runtime_projection: {
      surface_kind: 'opl_stage_execution_plan',
      stage_execution_plan_ref: restorePoint.latest_stage_execution_plan_ref,
      latest_run_id: restorePoint.latest_run_id,
      stage_execution_plan_path: runtimeRefs?.stage_execution_plan_path || null,
      progress_projection_path: runtimeRefs?.progress_projection_path || null,
      runtime_projection_path: runtimeRefs?.runtime_projection_path || null,
      escalation_record_path: runtimeRefs?.escalation_record_path || null,
    },
    artifact_index: {
      surface_kind: 'artifact_inventory',
      artifact_refs: safeArray(runtimeLoopClosure?.artifact_pickup?.artifact_refs),
      artifact_ref_count: Number(runtimeLoopClosure?.artifact_pickup?.artifact_ref_count || 0),
      source_ref: '/artifact_inventory',
    },
    artifact_locator_contract_ref: {
      surface_kind: artifactLocatorContract?.surface_kind || 'artifact_locator_contract',
      ref: '/artifact_locator_contract',
      owner: domainOwner,
      locator_model: artifactLocatorContract?.locator_model || 'workspace_runtime_artifact_root_refs_only',
      opl_consumption: 'descriptor_and_refs_only',
    },
  };
}

function buildReviewPublicationRefs({ domainOwner, reviewState, publicationProjection }) {
  return {
    review_state_ref: {
      surface_kind: safeText(reviewState?.surface_kind, 'review_state'),
      ref: '/review_state',
      owner: domainOwner,
      status: reviewState ? 'hydrated' : 'runtime_projection_ref',
    },
    publication_projection_ref: {
      surface_kind: safeText(publicationProjection?.surface_kind, 'publication_projection'),
      ref: '/publication_projection',
      owner: domainOwner,
      status: publicationProjection ? 'hydrated' : 'runtime_projection_ref',
    },
    route_rule: 'must_use_redcube_product_entry_and_review_export_gates',
  };
}

function buildOplFamilyLifecycle({
  domainOwner,
  continuationSnapshot,
  runtimeLoopClosure,
  reviewState,
  publicationProjection,
}) {
  const projection = continuationSnapshot?.runtime_progress_projection
    || projectionFromStageExecutionPlan(continuationSnapshot?.stage_execution_plan)
    || null;
  const runtimeProjection = continuationSnapshot?.runtime_projection || null;
  return {
    lifecycle_contract_id: 'opl_family_runtime_attempt_contract.v1',
    current_stage: projection?.current_stage ?? runtimeLoopClosure?.progress_cursor?.current_stage ?? null,
    content_status: projection?.content_status ?? runtimeLoopClosure?.progress_cursor?.content_status ?? null,
    needs_user_decision: Boolean(projection?.needs_user_decision),
    current_blockers: safeArray(projection?.current_blockers),
    completed_stages: safeArray(projection?.completed_stages),
    remaining_stages: safeArray(projection?.remaining_stages),
    latest_events: safeArray(projection?.latest_events).slice(-12),
    runtime_projection: runtimeProjection
      ? {
        health_status: safeText(runtimeProjection.health_status) || null,
        worker_running: runtimeProjection.worker_running === true,
        active_run_id: runtimeProjection.active_run_id || null,
        runtime_liveness_audit: runtimeProjection.runtime_liveness_audit || null,
        needs_human_intervention: runtimeProjection.needs_human_intervention === true,
        next_action: safeText(runtimeProjection.next_action) || null,
      }
      : null,
    review_publication: buildReviewPublicationRefs({
      domainOwner,
      reviewState,
      publicationProjection,
    }),
  };
}

function recommendedOwnerRoute({ runtimeLoopClosure, continuationSnapshot }) {
  const projection = continuationSnapshot?.runtime_progress_projection || null;
  if (runtimeLoopClosure?.control_policy?.approval_required === true || projection?.needs_user_decision === true) {
    return 'resolve_review_gate';
  }
  if (safeText(projection?.content_status) === 'completed') {
    return 'pick_up_artifacts';
  }
  return 'continue_autonomous_run';
}

function buildOplOwnerRouteDiscovery({
  domainOwner,
  source,
  entryMode,
  runtimeLoopClosure,
  continuationSnapshot,
  productEntrySessionCommandTemplate,
  oplHostedHandoffRef,
}) {
  const restorePoint = buildRestorePoint({ continuationSnapshot });
  return {
    current_source: safeText(source, 'manifest'),
    entry_mode: safeText(entryMode) || null,
    recommended_owner_route: recommendedOwnerRoute({ runtimeLoopClosure, continuationSnapshot }),
    candidate_routes: [
      {
        route_id: 'product_entry_session',
        surface_kind: 'product_entry_session',
        command: productEntrySessionCommandTemplate,
        locator_field: 'entry_session_id',
        latest_handle: restorePoint.latest_handle,
      },
      {
        route_id: 'direct_product_entry',
        surface_kind: 'product_entry',
        command: 'redcube product invoke',
        owner: domainOwner,
      },
      {
        route_id: 'opl_hosted_handoff',
        surface_kind: 'opl_hosted_product_entry',
        action_ref: oplHostedHandoffRef,
        owner: domainOwner,
      },
    ],
    route_equivalence_ref: '/route_equivalence',
    downstream_entry_surface_kind: 'domain_entry',
  };
}

function buildOplFamilyAdoption({
  entrySessionId,
  sessionFile,
  runtimeLoopClosure,
  productEntrySessionCommandTemplate,
}) {
  return {
    adoption_contract_id: 'opl_family_product_operator_projection.v1',
    adoption_command: productEntrySessionCommandTemplate,
    required_input_fields: [
      'entry_session_id',
      'workspace_root',
      'topic_id',
      'deliverable_id',
    ],
    resume_surface: {
      surface_kind: 'opl_generated_product_entry_session',
      command: productEntrySessionCommandTemplate,
      entry_session_id: safeText(entrySessionId) || null,
      session_file: safeText(sessionFile) || null,
      checkpoint_locator_field: runtimeLoopClosure?.resume_point?.checkpoint_locator_field
        || 'continuation_snapshot.latest_stage_execution_plan_ref',
    },
    next_surface_ref: runtimeLoopClosure?.control_policy?.continue_action?.surface_kind === 'product_entry_session'
      ? '/session_continuity'
      : '/runtime_loop_closure',
    human_gate_reason: runtimeLoopClosure?.control_policy?.approval_required === true
      ? 'operator_review_gate_requested'
      : null,
    source_refs: [
      '/session_continuity',
      '/progress_projection',
      '/artifact_inventory',
      '/runtime_loop_closure',
      '/review_state',
      '/publication_projection',
    ],
  };
}

function buildOplFamilyAuthorityBoundary() {
  return {
    owns_visual_truth: false,
    owns_canonical_artifacts: false,
    owns_review_truth: false,
    owns_publication_projection: false,
    owns_concrete_executor: false,
    allowed_authority: [
      'discover_product_entry_registration',
      'read_product_entry_session',
      'read_runtime_progress_projection',
      'read_artifact_inventory',
      'read_review_publication_projection_refs',
      'adopt_session_resume_cursor',
    ],
  };
}

export function buildOplFamilyLifecycleAdapterSurface({
  domainOwner,
  runtimeOwner,
  entrySessionId = null,
  sessionFile = null,
  deliveryIdentity = null,
  continuationSnapshot = null,
  runtimeLoopClosure = null,
  reviewState = null,
  publicationProjection = null,
  artifactLocatorContract = null,
  source = 'manifest',
  entryMode = 'manifest_projection',
  manifestProjection = false,
  productEntrySessionCommandTemplate,
  oplHostedHandoffRef,
}) {
  const hydrated = !manifestProjection && Boolean(entrySessionId);
  return {
    surface_kind: 'opl_family_lifecycle_adapter',
    adapter_id: 'rca.opl.family.lifecycle.adapter.v1',
    version: 'v1',
    domain_id: 'redcube_ai',
    domain_owner: domainOwner,
    discovery: {
      adoption_state: hydrated ? 'hydrated_session_projection' : 'discoverable_manifest_projection',
      owner_split: buildOplFamilyOwnerSplit({ runtimeOwner, domainOwner }),
      route_surfaces: buildOplFamilyRouteSurfaces({ domainOwner }),
      delivery_identity: {
        deliverable_family: safeText(deliveryIdentity?.deliverable_family) || null,
        topic_id: safeText(deliveryIdentity?.topic_id) || null,
        deliverable_id: safeText(deliveryIdentity?.deliverable_id) || null,
        profile_id: deliveryIdentity?.profile_id ?? null,
      },
    },
    persistence: buildOplFamilyPersistence({
      domainOwner,
      entrySessionId,
      sessionFile,
      continuationSnapshot,
      runtimeLoopClosure,
      artifactLocatorContract,
    }),
    lifecycle: buildOplFamilyLifecycle({
      domainOwner,
      continuationSnapshot,
      runtimeLoopClosure,
      reviewState,
      publicationProjection,
    }),
    owner_route_discovery: buildOplOwnerRouteDiscovery({
      domainOwner,
      source,
      entryMode,
      runtimeLoopClosure,
      continuationSnapshot,
      productEntrySessionCommandTemplate,
      oplHostedHandoffRef,
    }),
    adoption: buildOplFamilyAdoption({
      entrySessionId,
      sessionFile,
      runtimeLoopClosure,
      productEntrySessionCommandTemplate,
    }),
    authority_boundary: buildOplFamilyAuthorityBoundary(),
    non_goals: [
      'not_a_visual_domain_truth_owner',
      'not_a_canonical_artifact_owner',
      'not_a_review_or_publication_projection_owner',
      'not_a_concrete_executor',
      'not_a_sqlite_authority',
    ],
  };
}
