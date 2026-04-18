import {
  buildFamilyProductEntryOrchestration,
} from 'opl-readonly-gateway/family-orchestration';

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

const PRODUCT_ENTRY_ACTION_GRAPH_REF = Object.freeze({
  ref_kind: 'json_pointer',
  ref: '/family_orchestration/action_graph',
  label: 'redcube family action graph',
});

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

  return buildFamilyProductEntryOrchestration({
    graph_id: 'redcube_frontdoor_product_entry_graph',
    target_domain_id: 'redcube_ai',
    graph_kind: 'visual_deliverable_orchestration',
    graph_version: '2026-04-13',
    nodes: [
      {
        node_id: 'step:open_frontdesk',
        node_kind: 'frontdoor',
        title: 'Open RedCube frontdesk',
        surface_kind: 'product_frontdesk',
      },
      {
        node_id: 'step:continue_current_loop',
        node_kind: 'deliverable_runtime',
        title: 'Start or continue the direct product loop',
        surface_kind: 'product_entry',
        produces_checkpoint: true,
      },
      {
        node_id: 'step:federated_handoff',
        node_kind: 'federated_entry',
        title: 'Enter the same loop through OPL handoff',
        surface_kind: 'federated_product_entry',
        produces_checkpoint: true,
      },
      {
        node_id: 'step:inspect_current_progress',
        node_kind: 'progress_read',
        title: 'Inspect current product-entry progress',
        surface_kind: 'product_entry_session',
        produces_checkpoint: true,
      },
    ],
    edges: [
      {
        from: 'step:open_frontdesk',
        to: 'step:continue_current_loop',
        on: 'start_direct',
      },
      {
        from: 'step:open_frontdesk',
        to: 'step:federated_handoff',
        on: 'enter_via_opl',
      },
      {
        from: 'step:continue_current_loop',
        to: 'step:inspect_current_progress',
        on: 'session_started',
      },
      {
        from: 'step:federated_handoff',
        to: 'step:inspect_current_progress',
        on: 'handoff_completed',
      },
    ],
    entry_nodes: ['step:open_frontdesk'],
    exit_nodes: ['step:inspect_current_progress'],
    human_gates: [
      {
        gate_id: 'redcube_operator_review_gate',
        trigger_nodes: ['step:inspect_current_progress'],
        blocking: true,
      },
    ],
    checkpoint_nodes: [
      'step:continue_current_loop',
      'step:federated_handoff',
      'step:inspect_current_progress',
    ],
    human_gate_previews: [
      {
        gate_id: 'redcube_operator_review_gate',
        title: 'RedCube operator review gate',
        status: safeText(gateStatus, 'requested'),
        ...(reviewSurfaceRef ? { review_surface: reviewSurfaceRef } : {}),
      },
    ],
    action_graph_ref: {
      ...PRODUCT_ENTRY_ACTION_GRAPH_REF,
    },
    resume_surface_kind: 'product_entry_session',
    session_locator_field: sessionField,
    checkpoint_locator_field: 'continuation_snapshot.latest_managed_run_id',
    ...(eventEnvelopeSurfaceRef ? { event_envelope_surface: eventEnvelopeSurfaceRef } : {}),
    ...(checkpointLineageSurfaceRef ? { checkpoint_lineage_surface: checkpointLineageSurfaceRef } : {}),
  });
}
