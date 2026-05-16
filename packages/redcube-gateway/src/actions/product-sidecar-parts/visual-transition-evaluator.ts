// @ts-nocheck

const DOMAIN_ID = 'redcube_ai';
const DESCRIPTOR_ID = 'rca.visual_transition_evaluator.v1';
const SPEC_REF = '/visual_transition_spec';

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function camelField(name) {
  return name.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeGuardRefs(task) {
  const explicit = task?.guard_refs || task?.guardRefs || {};
  const normalized = { ...explicit };
  for (const [key, value] of Object.entries(task || {})) {
    if (/_ref$|_refs$/.test(key) && !['guard_refs', 'guardRefs'].includes(key)) {
      normalized[key] = value;
    }
  }
  return normalized;
}

function guardRefPresent(guardRefs, guardId) {
  const value = guardRefs[guardId] ?? guardRefs[camelField(guardId)];
  if (Array.isArray(value)) {
    return value.some((entry) => safeText(entry));
  }
  return Boolean(safeText(value));
}

function transitionById(visualTransitionSpec, transitionId) {
  return (visualTransitionSpec?.transition_table || [])
    .find((transition) => transition.transition_id === transitionId) || null;
}

export function buildVisualTransitionEvaluatorProjection({ visualTransitionSpec } = {}) {
  return {
    surface_kind: 'visual_transition_evaluator',
    evaluator_id: DESCRIPTOR_ID,
    owner: DOMAIN_ID,
    status: 'thin_evaluator_landed_runner_owned_by_opl',
    source_spec_ref: SPEC_REF,
    source_spec_id: visualTransitionSpec?.spec_id || 'rca.visual_transition_spec.v1',
    source_manifest_surface: 'redcube product manifest#/visual_transition_spec',
    descriptor_model: 'rca_owned_transition_guard_evaluator_refs_only',
    callable_action: 'evaluate_visual_transition',
    expected_inputs: [
      'workspace_root',
      'transition_id',
      'current_stage',
      'guard_refs',
      'optional domain_owner_receipt_ref',
      'optional no_regression_evidence_ref',
    ],
    expected_return_shapes: [
      'visual_transition_evaluation',
      'typed_blocker',
    ],
    transition_count: visualTransitionSpec?.transition_table?.length || 0,
    covered_transition_ids: (visualTransitionSpec?.transition_table || [])
      .map((transition) => transition.transition_id),
    output_refs: [
      'next_stage',
      'repair_action',
      'typed_blocker',
      'domain_owner_receipt_ref',
      'no_regression_evidence_ref',
      'transition_result_ref',
      'owner_route_ref',
    ],
    bridge_evidence_projection: {
      projection_id: 'rca.visual_transition_bridge_evidence_refs.v1',
      source: 'sidecar_evaluate_visual_transition_result',
      fields: [
        'provider_attempt_ref',
        'domain_owner_receipt_ref',
        'no_regression_evidence_ref',
        'typed_blocker_ref',
        'transition_result_ref',
      ],
      refs_only: true,
      opl_projection_owner: 'opl',
    },
    authority_boundary: {
      rca_owns_transition_table: true,
      rca_owns_guard_semantics: true,
      rca_owns_owner_action: true,
      opl_owns_generic_transition_runner: true,
      implements_opl_generic_transition_runner: false,
      implements_retry_or_dead_letter: false,
      implements_workbench: false,
      writes_runner_state: false,
      writes_visual_truth: false,
      writes_artifact_blob: false,
      writes_memory_body: false,
      declares_visual_ready: false,
      declares_exportable: false,
      declares_handoffable: false,
      declares_production_soak_complete: false,
    },
  };
}

export function evaluateVisualTransition({
  task,
  workspaceRoot,
  visualTransitionSpec,
  buildTypedBlocker,
}) {
  const transitionId = safeText(task?.transition_id || task?.transitionId);
  const currentStage = safeText(task?.current_stage || task?.currentStage);
  const blockerId = transitionId || currentStage || task?.task_id || task?.id || 'visual-transition';

  if (!transitionId) {
    return buildTypedBlocker({
      blockerKind: 'visual_transition_missing_transition_id',
      blockerId,
      missing: ['transition_id'],
      sourceContract: 'rca.visual_transition_evaluator.v1',
      nextRequiredOwnerAction: 'provide_rca_visual_transition_id',
      workspaceRoot,
    });
  }

  const transition = transitionById(visualTransitionSpec, transitionId);
  if (!transition) {
    return buildTypedBlocker({
      blockerKind: 'visual_transition_unknown_transition',
      blockerId: transitionId,
      sourceContract: 'rca.visual_transition_spec.v1',
      nextRequiredOwnerAction: 'choose_transition_from_rca_visual_transition_spec',
      workspaceRoot,
      details: {
        transition_id: transitionId,
        known_transition_ids: (visualTransitionSpec?.transition_table || [])
          .map((entry) => entry.transition_id),
      },
    });
  }

  if (!currentStage) {
    return buildTypedBlocker({
      blockerKind: 'visual_transition_missing_current_stage',
      blockerId: transitionId,
      missing: ['current_stage'],
      sourceContract: 'rca.visual_transition_evaluator.v1',
      nextRequiredOwnerAction: 'provide_current_rca_stage_kind',
      workspaceRoot,
    });
  }

  if (currentStage !== transition.from_stage) {
    return buildTypedBlocker({
      blockerKind: 'visual_transition_stage_mismatch',
      blockerId: transitionId,
      sourceContract: 'rca.visual_transition_spec.v1',
      nextRequiredOwnerAction: 'route_attempt_to_matching_rca_visual_stage',
      workspaceRoot,
      details: {
        transition_id: transitionId,
        expected_current_stage: transition.from_stage,
        provided_current_stage: currentStage,
      },
    });
  }

  const guardRefs = normalizeGuardRefs(task);
  const requiredGuardRefs = transition.required_guard_refs || [];
  const missingGuardRefs = requiredGuardRefs.filter((guardId) => !guardRefPresent(guardRefs, guardId));
  if (missingGuardRefs.length > 0) {
    return buildTypedBlocker({
      blockerKind: 'visual_transition_missing_guard_refs',
      blockerId: transitionId,
      missing: missingGuardRefs,
      sourceContract: 'rca.visual_transition_spec.v1',
      nextRequiredOwnerAction: transition.owner_action,
      workspaceRoot,
      details: {
        transition_id: transitionId,
        current_stage: transition.from_stage,
        expected_next_stage: transition.to_stage,
        owner_action: transition.owner_action,
        required_guard_refs: requiredGuardRefs,
      },
    });
  }

  const domainOwnerReceiptRef = safeText(
    task?.domain_owner_receipt_ref || task?.domainOwnerReceiptRef,
  );
  const noRegressionEvidenceRef = safeText(
    task?.no_regression_evidence_ref || task?.noRegressionEvidenceRef,
  );
  const providerAttemptRef = safeText(task?.provider_attempt_ref || task?.providerAttemptRef);
  const transitionResultRef = `rca-visual-transition-evaluation:${visualTransitionSpec?.spec_id || 'rca.visual_transition_spec.v1'}:${transitionId}`;
  const repairAction = transition.to_stage === 'review_and_revision'
    ? 'run_review_and_repair_gate'
    : null;

  return {
    ok: true,
    surface_kind: 'visual_transition_evaluation',
    return_shape: 'visual_transition_evaluation',
    evaluator_id: DESCRIPTOR_ID,
    owner: DOMAIN_ID,
    spec_id: visualTransitionSpec?.spec_id || 'rca.visual_transition_spec.v1',
    transition_id: transitionId,
    from_stage: transition.from_stage,
    current_stage: currentStage,
    next_stage: transition.to_stage,
    owner_action: transition.owner_action,
    repair_action: repairAction,
    required_guard_refs: requiredGuardRefs,
    required_guard_refs_present: true,
    guard_refs: Object.fromEntries(
      requiredGuardRefs.map((guardId) => [
        guardId,
        guardRefs[guardId] ?? guardRefs[camelField(guardId)],
      ]),
    ),
    optional_receipt_refs: {
      domain_owner_receipt_ref: domainOwnerReceiptRef || null,
      no_regression_evidence_ref: noRegressionEvidenceRef || null,
      provider_attempt_ref: providerAttemptRef || null,
    },
    transition_result_ref: transitionResultRef,
    owner_route_ref: `rca-visual-transition:${transitionId}`,
    owner_route: {
      owner: DOMAIN_ID,
      route_ref: `rca-visual-transition:${transitionId}`,
      action_refs: [transition.owner_action],
    },
    bridge_evidence_refs: {
      provider_attempt_ref: providerAttemptRef || null,
      domain_owner_receipt_ref: domainOwnerReceiptRef || null,
      no_regression_evidence_ref: noRegressionEvidenceRef || null,
      typed_blocker_ref: null,
      transition_result_ref: transitionResultRef,
    },
    source_manifest_refs: {
      visual_transition_spec_ref: SPEC_REF,
      visual_transition_evaluator_ref: '/visual_transition_evaluator',
      domain_owner_receipt_contract_ref: '/domain_owner_receipt_contract',
      no_regression_owner_receipt_opl_consumption_proof_ref: '/no_regression_owner_receipt_opl_consumption_proof',
    },
    coverage: {
      guard_refs_present: true,
      writes_visual_truth: false,
      writes_review_export_verdict: false,
      writes_canonical_artifact_blob: false,
      writes_memory_body: false,
      writes_runner_state: false,
      visual_ready_claimed: false,
      exportable_claimed: false,
      handoffable_claimed: false,
      production_soak_complete_claimed: false,
    },
    authority_boundary: {
      rca_owns_transition_guard_evaluation: true,
      opl_owns_generic_transition_runner: true,
      implements_opl_generic_transition_runner: false,
      opl_can_store_transition_metadata: true,
      opl_can_declare_visual_ready: false,
      opl_can_declare_exportable: false,
      opl_can_mutate_artifacts: false,
    },
    repository_boundary: {
      repo_tracks_evaluator_contract: true,
      repo_tracks_transition_spec: true,
      repo_tracks_runner_state: false,
      repo_tracks_visual_or_export_artifacts: false,
      repo_tracks_receipt_instances: false,
    },
    context_refs: asArray(task?.context_refs || task?.contextRefs),
  };
}
