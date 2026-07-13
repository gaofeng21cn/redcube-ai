// @ts-nocheck
import { canonicalStageForRoute } from '@redcube/runtime-protocol';
import { getDeliverable } from './get-deliverable.js';
import { safeText } from './action-utils.js';

const OPL_STAGE_EXECUTION_OWNER = 'one-person-lab';
const OPL_STAGE_ATTEMPT_OWNER = 'opl_family_runtime_provider';
const OPL_ATTEMPT_LEDGER_OWNER = 'one-person-lab';
const RCA_DOMAIN_OWNER = 'redcube_ai';
const RCA_STAGE_QUALITY_PROFILE_REF = 'contracts/stage_quality_cycle_policy.json';
const CANONICAL_STAGES = Object.freeze([
  { stage_id: 'source_intake', title: 'Source intake', stage_kind: 'intake', output_artifact: 'source_truth_pack' },
  { stage_id: 'communication_strategy', title: 'Communication strategy', stage_kind: 'planning', output_artifact: 'strategy_brief' },
  { stage_id: 'visual_direction', title: 'Visual direction', stage_kind: 'planning', output_artifact: 'visual_direction' },
  { stage_id: 'artifact_creation', title: 'Artifact creation', stage_kind: 'creation', output_artifact: 'render_manifest' },
  { stage_id: 'review_and_revision', title: 'Cross-stage Meta Review', stage_kind: 'review', output_artifact: 'review_verdict' },
  { stage_id: 'package_and_handoff', title: 'Package and handoff', stage_kind: 'packaging', output_artifact: 'export_bundle' },
]);

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function stageSequenceFromContract(contract) {
  const routeStages = safeArray(contract?.stage_sequence?.stages)
    .map((stage, index) => ({
      route_id: safeText(stage?.stage_id),
      output_artifact: safeText(stage?.output_artifact) || null,
      requires_routes: safeArray(stage?.requires_stages).map((dependency) => safeText(dependency)).filter(Boolean),
      sequence_index: index,
    }))
    .filter((stage) => stage.route_id);
  return CANONICAL_STAGES.map((stage, index) => {
    const routes = routeStages.filter((route) => canonicalStageForRoute(route.route_id) === stage.stage_id);
    return {
      ...stage,
      requires_stages: index === 0 ? [] : [CANONICAL_STAGES[index - 1].stage_id],
      route_handler_refs: routes.map((route) => `redcube.route_handler:${route.route_id}`),
      route_ids: routes.map((route) => route.route_id),
      stage_handler_ref: `redcube.stage_handler:${stage.stage_id}`,
      stage_attempt_ref: `opl.stage_attempt:${stage.stage_id}`,
      sequence_index: index,
    };
  });
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

function plannedStagesForStop({ stages, stopAfterStage }) {
  const requestedStop = safeText(stopAfterStage);
  const stopStage = CANONICAL_STAGES.some((stage) => stage.stage_id === requestedStop)
    ? requestedStop
    : canonicalStageForRoute(requestedStop);
  if (!stopStage) return stages;
  const stopIndex = stages.findIndex((stage) => stage.stage_id === stopStage);
  if (stopIndex < 0) return stages;
  return stages.slice(0, stopIndex + 1);
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
  const stages = stageSequenceFromContract(contract);
  const plannedStages = plannedStagesForStop({ stages, stopAfterStage });
  const planRef = stagePlanRef({
    overlay: contractOverlay,
    topicId,
    deliverableId,
    stopAfterStage,
  });
  const approvalRequired = Boolean(safeText(stopAfterStage));

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
      canonical_stage_source: 'agent/stages/manifest.json',
      domain_routes_are_stage_internal_handlers: true,
      route_ids_are_not_opl_stage_ids: true,
    },
    control_policy: {
      mode: safeText(stopAfterStage) ? 'stop_after_stage' : 'auto_to_terminal',
      requested_stop_after_stage: safeText(stopAfterStage) || null,
      approval_required: approvalRequired,
      gate_status: approvalRequired ? 'requested' : 'approved',
      stop_policy: 'opl_provider_runs_until_explicit_stop_after_stage_or_hard_stop_boundary',
      progress_first_policy: {
        contract_id: 'rca.progress_first_stage_admission.v1',
        artifact_advances_stage: true,
        retries_are_quality_budget: true,
        quality_debt_blocks_transition: false,
        review_gate_blocks_transition: false,
        hard_stop_kinds: [
          'missing_consumable_artifact',
          'permission_or_credential_boundary',
          'explicit_human_gate',
          'authority_boundary_violation',
          'stale_or_mismatched_stage_identity',
        ],
      },
      stage_quality_cycle_profile_ref: RCA_STAGE_QUALITY_PROFILE_REF,
      user_intent: safeText(userIntent) || null,
      requested_mode: safeText(mode, 'draft_new'),
      baseline_deliverable_id: safeText(baselineDeliverableId) || null,
    },
    stage_attempts: plannedStages.map((stage) => ({
      stage_id: stage.stage_id,
      stage_kind: stage.stage_kind,
      title: stage.title,
      stage_handler_ref: stage.stage_handler_ref,
      route_handler_refs: stage.route_handler_refs,
      route_ids: stage.route_ids,
      provider_attempt_ref: `${planRef}:${stage.stage_id}`,
      depends_on: stage.requires_stages,
      output_artifact_ref: stage.output_artifact,
      transition_policy: {
        consumable_artifact_advances: true,
        quality_budget_not_transition_gate: true,
      },
      stage_quality_cycle_policy_ref: `${RCA_STAGE_QUALITY_PROFILE_REF}#/stage_policies/${stage.stage_id}`,
      attempt_roles: stage.stage_id === 'review_and_revision'
        ? ['producer']
        : ['producer', 'reviewer', 'repairer', 're_reviewer'],
      context_isolation_required: true,
      ...(stage.stage_id === 'review_and_revision' ? {
        stage_role: 'cross_stage_meta_review',
        meta_review_handler_ref: 'redcube.meta_review_handler:review_and_revision',
        no_context_inheritance: true,
      } : {}),
      owner_split: {
        stage_attempt_owner: OPL_STAGE_ATTEMPT_OWNER,
        route_handler_owner: RCA_DOMAIN_OWNER,
        visual_truth_owner: RCA_DOMAIN_OWNER,
        review_export_verdict_owner: RCA_DOMAIN_OWNER,
        artifact_authority_owner: RCA_DOMAIN_OWNER,
      },
    })),
    full_stage_sequence_refs: stages.map((stage) => stage.stage_id),
    full_route_sequence_refs: stages.flatMap((stage) => stage.route_ids),
    authority_refs: {
      domain_handler_ref: '/product_entry_shell/domain_handler',
      domain_action_adapter_ref: '/product_entry_shell/domain_handler',
      family_action_catalog_ref: 'contracts/action_catalog.json',
      family_stage_control_plane_ref: 'opl-generated:family_stage_control_plane',
      domain_memory_descriptor_ref: '/domain_memory_descriptor',
      ai_route_policy_ref: '/ai_route_policy',
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
