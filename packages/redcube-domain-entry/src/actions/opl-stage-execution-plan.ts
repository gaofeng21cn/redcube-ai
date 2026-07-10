// @ts-nocheck
import { getDeliverable } from './get-deliverable.js';
import { safeText } from './action-utils.js';

const OPL_STAGE_EXECUTION_OWNER = 'one-person-lab';
const OPL_STAGE_ATTEMPT_OWNER = 'opl_family_runtime_provider';
const OPL_ATTEMPT_LEDGER_OWNER = 'one-person-lab';
const RCA_DOMAIN_OWNER = 'redcube_ai';

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeStageSequence(stages, sequenceKind) {
  return safeArray(stages)
    .map((stage, index) => ({
      stage_id: safeText(stage?.stage_id),
      title: safeText(stage?.title || stage?.label || stage?.stage_id),
      stage_kind: safeText(stage?.stage_kind || stage?.kind, 'visual_domain_stage'),
      output_artifact: safeText(stage?.output_artifact) || null,
      requires_stages: safeArray(stage?.requires_stages).map((dependency) => safeText(dependency)).filter(Boolean),
      route_handler_ref: `redcube.route_handler:${safeText(stage?.stage_id)}`,
      stage_attempt_ref: `opl.stage_attempt:${safeText(stage?.stage_id)}`,
      sequence_kind: sequenceKind,
      sequence_index: index,
    }))
    .filter((stage) => stage.stage_id);
}

function stageSequencesFromContract(contract) {
  return {
    primaryStages: normalizeStageSequence(contract?.stage_sequence?.stages, 'primary'),
    alternateStages: normalizeStageSequence(contract?.stage_sequence?.alternate_stages, 'alternate'),
  };
}

function stagePlanRef({ overlay, topicId, deliverableId, stopAfterStage }) {
  return [
    'opl-stage-execution-plan',
    safeText(overlay, 'unknown-family'),
    safeText(topicId, 'unknown-topic'),
    safeText(deliverableId, 'unknown-deliverable'),
    safeText(stopAfterStage, 'auto-to-terminal'),
  ].join(':');
}

function dependencyPlan(stages, targetStageId) {
  const stagesById = new Map(stages.map((stage) => [stage.stage_id, stage]));
  const visiting = new Set();
  const included = new Set();
  const planned = [];

  function visit(stageId) {
    if (included.has(stageId)) return;
    if (visiting.has(stageId)) throw new Error(`Hydrated overlay stage_sequence contains a dependency cycle at ${stageId}`);
    const stage = stagesById.get(stageId);
    if (!stage) throw new Error(`Hydrated overlay stage_sequence is missing dependency stage ${stageId}`);
    visiting.add(stageId);
    stage.requires_stages.forEach(visit);
    visiting.delete(stageId);
    included.add(stageId);
    planned.push(stage);
  }

  visit(targetStageId);
  return planned;
}

function planStageSequence({ primaryStages, alternateStages, route, stopAfterStage }) {
  const requestedRoute = safeText(route);
  const requestedStop = safeText(stopAfterStage);
  const allStages = [...primaryStages, ...alternateStages];
  const stagesById = new Map(allStages.map((stage) => [stage.stage_id, stage]));
  const routeStage = requestedRoute ? stagesById.get(requestedRoute) : null;
  const stopStage = requestedStop ? stagesById.get(requestedStop) : null;

  if (requestedRoute && !routeStage) throw new Error(`Unknown delivery_request.route: ${requestedRoute}`);
  if (requestedStop && !stopStage) throw new Error(`Unknown delivery_request.stop_after_stage: ${requestedStop}`);

  if (routeStage && stopStage) {
    if (routeStage.sequence_kind === 'primary' && stopStage.sequence_kind === 'primary') {
      if (stopStage.sequence_index < routeStage.sequence_index) {
        throw new Error(`delivery_request.stop_after_stage=${requestedStop} precedes delivery_request.route=${requestedRoute}`);
      }
      return {
        plannedStages: primaryStages.slice(0, stopStage.sequence_index + 1),
        effectiveStopAfterStage: requestedStop,
        routeStrategy: 'primary_route_prefix',
        dependencyRecoveryApplied: false,
      };
    }

    const stopPlan = dependencyPlan(allStages, requestedStop);
    if (stopPlan.some((stage) => stage.stage_id === requestedRoute)) {
      return {
        plannedStages: stopPlan,
        effectiveStopAfterStage: requestedStop,
        routeStrategy: 'explicit_route_dependency_recovery',
        dependencyRecoveryApplied: true,
      };
    }
    const routePlan = dependencyPlan(allStages, requestedRoute);
    if (routePlan.some((stage) => stage.stage_id === requestedStop)) {
      throw new Error(`delivery_request.stop_after_stage=${requestedStop} precedes delivery_request.route=${requestedRoute}`);
    }
    throw new Error(
      `delivery_request.route=${requestedRoute} and delivery_request.stop_after_stage=${requestedStop} do not share an ordered stage path`,
    );
  }

  if (routeStage) {
    const alternateRoute = routeStage.sequence_kind === 'alternate';
    return {
      plannedStages: alternateRoute
        ? dependencyPlan(allStages, requestedRoute)
        : primaryStages.slice(0, routeStage.sequence_index + 1),
      effectiveStopAfterStage: requestedRoute,
      routeStrategy: alternateRoute ? 'alternate_route_dependency_recovery' : 'primary_route_prefix',
      dependencyRecoveryApplied: alternateRoute,
    };
  }

  if (stopStage) {
    const alternateStop = stopStage.sequence_kind === 'alternate';
    return {
      plannedStages: alternateStop
        ? dependencyPlan(allStages, requestedStop)
        : primaryStages.slice(0, stopStage.sequence_index + 1),
      effectiveStopAfterStage: requestedStop,
      routeStrategy: alternateStop ? 'alternate_stop_dependency_recovery' : 'primary_stop_prefix',
      dependencyRecoveryApplied: alternateStop,
    };
  }

  return {
    plannedStages: primaryStages,
    effectiveStopAfterStage: '',
    routeStrategy: 'primary_sequence',
    dependencyRecoveryApplied: false,
  };
}

export async function buildOplStageExecutionPlan({
  workspaceRoot,
  overlay,
  topicId,
  deliverableId,
  route = '',
  adapter = '',
  userIntent = '',
  stopAfterStage = '',
  mode = 'draft_new',
  baselineDeliverableId = '',
  entryMode = 'redcube_product_entry',
}) {
  const deliverableRecord = await getDeliverable({
    workspaceRoot,
    topicId,
    deliverableId,
  });
  const contract = deliverableRecord.hydrated_contract || {};
  const contractOverlay = safeText(contract.overlay || deliverableRecord.summary?.overlay, overlay);
  const { primaryStages, alternateStages } = stageSequencesFromContract(contract);
  const {
    plannedStages,
    effectiveStopAfterStage,
    routeStrategy,
    dependencyRecoveryApplied,
  } = planStageSequence({ primaryStages, alternateStages, route, stopAfterStage });
  const planRef = stagePlanRef({
    overlay: contractOverlay,
    topicId,
    deliverableId,
    stopAfterStage: effectiveStopAfterStage,
  });
  const approvalRequired = Boolean(effectiveStopAfterStage);

  return {
    ok: true,
    surface_kind: 'opl_stage_execution_plan',
    recommended_action: approvalRequired ? 'submit_to_opl_stage_attempt_until_review_gate' : 'submit_to_opl_stage_attempt_runtime',
    plan_ref: planRef,
    plan_id: planRef,
    owner: OPL_STAGE_EXECUTION_OWNER,
    provider_owner: OPL_STAGE_ATTEMPT_OWNER,
    attempt_ledger_owner: OPL_ATTEMPT_LEDGER_OWNER,
    domain_owner: RCA_DOMAIN_OWNER,
    entry_mode: safeText(entryMode),
    delivery_identity: {
      deliverable_family: contractOverlay,
      topic_id: safeText(topicId),
      deliverable_id: safeText(deliverableId),
      route: safeText(route) || null,
    },
    execution_model: {
      model: 'opl_provider_backed_stage_attempt_runtime',
      repo_local_stage_runner_active_caller: false,
      repo_local_stage_runner_role: 'tombstone_or_historical_regression_only',
      stage_attempt_orchestrator_owner: OPL_STAGE_ATTEMPT_OWNER,
      attempt_ledger_owner: OPL_ATTEMPT_LEDGER_OWNER,
      retry_liveness_queue_owner: OPL_STAGE_EXECUTION_OWNER,
      closeout_transport_owner: OPL_STAGE_EXECUTION_OWNER,
      rca_role: 'visual_domain_authority_functions_and_route_handler_refs',
    },
    control_policy: {
      mode: effectiveStopAfterStage ? 'stop_after_stage' : 'auto_to_terminal',
      requested_route: safeText(route) || null,
      explicit_stop_after_stage: safeText(stopAfterStage) || null,
      requested_stop_after_stage: effectiveStopAfterStage || null,
      route_strategy: routeStrategy,
      dependency_recovery_applied: dependencyRecoveryApplied,
      approval_required: approvalRequired,
      gate_status: approvalRequired ? 'requested' : 'approved',
      stop_policy: 'opl_provider_runs_until_explicit_stop_after_stage_or_rca_review_gate',
      user_intent: safeText(userIntent) || null,
      requested_mode: safeText(mode, 'draft_new'),
      baseline_deliverable_id: safeText(baselineDeliverableId) || null,
    },
    stage_attempts: plannedStages.map((stage) => ({
      stage_id: stage.stage_id,
      stage_kind: stage.stage_kind,
      title: stage.title,
      sequence_kind: stage.sequence_kind,
      route_handler_ref: stage.route_handler_ref,
      provider_attempt_ref: `${planRef}:${stage.stage_id}`,
      depends_on: stage.requires_stages,
      output_artifact_ref: stage.output_artifact,
      owner_split: {
        stage_attempt_owner: OPL_STAGE_ATTEMPT_OWNER,
        route_handler_owner: RCA_DOMAIN_OWNER,
        visual_truth_owner: RCA_DOMAIN_OWNER,
        review_export_verdict_owner: RCA_DOMAIN_OWNER,
        artifact_authority_owner: RCA_DOMAIN_OWNER,
      },
    })),
    full_stage_sequence_refs: primaryStages.map((stage) => stage.stage_id),
    alternate_stage_refs: alternateStages.map((stage) => stage.stage_id),
    authority_refs: {
      domain_handler_ref: '/product_entry_shell/domain_handler',
      domain_action_adapter_ref: '/product_entry_shell/domain_handler',
      family_action_catalog_ref: 'contracts/action_catalog.json',
      family_stage_control_plane_ref: 'contracts/stage_control_plane.json',
      domain_memory_descriptor_ref: '/domain_memory_descriptor',
      visual_transition_spec_ref: '/visual_transition_spec',
      artifact_locator_contract_ref: '/artifact_locator_contract',
      review_state_ref: '/review_state',
      publication_projection_ref: '/publication_projection',
      owner_receipt_contract_ref: '/domain_owner_receipt_contract',
      guarded_action_catalog_ref: 'contracts/action_catalog.json',
    },
    forbidden_opl_writes: [
      'visual_truth',
      'review_verdict',
      'publication_gate',
      'canonical_artifacts',
      'visual_memory_body',
      'owner_receipt_signature',
    ],
    adapter_boundary: {
      requested_adapter: safeText(adapter) || null,
      adapter_role: safeText(adapter) ? 'executor_preference_ref_only' : 'not_selected_by_rca',
      executor_selection_owner: OPL_STAGE_EXECUTION_OWNER,
      rca_can_force_executor_backend: false,
    },
    summary: {
      stage_execution_plan_ref: planRef,
      target_handle: planRef,
      planned_stage_count: plannedStages.length,
      first_stage: plannedStages[0]?.stage_id || null,
      terminal_stage: plannedStages.at(-1)?.stage_id || null,
      approval_required: approvalRequired,
    },
  };
}
