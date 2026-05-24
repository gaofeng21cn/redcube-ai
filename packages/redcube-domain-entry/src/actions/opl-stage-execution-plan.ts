// @ts-nocheck
import { getDeliverable } from './get-deliverable.js';

const OPL_STAGE_EXECUTION_OWNER = 'one-person-lab';
const OPL_STAGE_ATTEMPT_OWNER = 'opl_family_runtime_provider';
const OPL_ATTEMPT_LEDGER_OWNER = 'one-person-lab';
const RCA_DOMAIN_OWNER = 'redcube_ai';

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function stageSequenceFromContract(contract) {
  return safeArray(contract?.stage_sequence?.stages)
    .map((stage, index) => ({
      stage_id: safeText(stage?.stage_id),
      title: safeText(stage?.title || stage?.label || stage?.stage_id),
      stage_kind: safeText(stage?.stage_kind || stage?.kind, 'visual_domain_stage'),
      output_artifact: safeText(stage?.output_artifact) || null,
      requires_stages: safeArray(stage?.requires_stages).map((dependency) => safeText(dependency)).filter(Boolean),
      route_handler_ref: `redcube.route_handler:${safeText(stage?.stage_id)}`,
      stage_attempt_ref: `opl.stage_attempt:${safeText(stage?.stage_id)}`,
      sequence_index: index,
    }))
    .filter((stage) => stage.stage_id);
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
  const stopStage = safeText(stopAfterStage);
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
    },
    control_policy: {
      mode: safeText(stopAfterStage) ? 'stop_after_stage' : 'auto_to_terminal',
      requested_stop_after_stage: safeText(stopAfterStage) || null,
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
    full_stage_sequence_refs: stages.map((stage) => stage.stage_id),
    authority_refs: {
      domain_action_adapter_ref: '/domain_action_adapter',
      family_action_catalog_ref: '/family_action_catalog',
      family_stage_control_plane_ref: '/family_stage_control_plane',
      domain_memory_descriptor_ref: '/domain_memory_descriptor',
      visual_transition_spec_ref: '/visual_transition_spec',
      artifact_locator_contract_ref: '/artifact_locator_contract',
      review_state_ref: '/review_state',
      publication_projection_ref: '/publication_projection',
      owner_receipt_contract_ref: '/domain_owner_receipt_contract',
      guarded_action_catalog_ref: '/family_action_catalog/actions/dispatch_domain_action_adapter',
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
