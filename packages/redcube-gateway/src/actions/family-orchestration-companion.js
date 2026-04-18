import {
  buildExplicitCheckpointPolicy as buildSharedExplicitCheckpointPolicy,
  buildFamilyActionGraph as buildSharedFamilyActionGraph,
  buildFamilyActionGraphEdge as buildSharedFamilyActionGraphEdge,
  buildFamilyActionGraphHumanGate as buildSharedFamilyActionGraphHumanGate,
  buildFamilyActionGraphNode as buildSharedFamilyActionGraphNode,
  buildFamilyOrchestrationTemplate,
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

function buildFamilyActionGraph() {
  return buildSharedFamilyActionGraph({
    graph_id: 'redcube_frontdoor_product_entry_graph',
    target_domain_id: 'redcube_ai',
    graph_kind: 'visual_deliverable_orchestration',
    graph_version: '2026-04-13',
    nodes: [
      buildSharedFamilyActionGraphNode({
        node_id: 'step:open_frontdesk',
        node_kind: 'frontdoor',
        title: 'Open RedCube frontdesk',
        surface_kind: 'product_frontdesk',
      }),
      buildSharedFamilyActionGraphNode({
        node_id: 'step:continue_current_loop',
        node_kind: 'deliverable_runtime',
        title: 'Start or continue the direct product loop',
        surface_kind: 'product_entry',
        produces_checkpoint: true,
      }),
      buildSharedFamilyActionGraphNode({
        node_id: 'step:federated_handoff',
        node_kind: 'federated_entry',
        title: 'Enter the same loop through OPL handoff',
        surface_kind: 'federated_product_entry',
        produces_checkpoint: true,
      }),
      buildSharedFamilyActionGraphNode({
        node_id: 'step:inspect_current_progress',
        node_kind: 'progress_read',
        title: 'Inspect current product-entry progress',
        surface_kind: 'product_entry_session',
        produces_checkpoint: true,
      }),
    ],
    edges: [
      buildSharedFamilyActionGraphEdge({
        from: 'step:open_frontdesk',
        to: 'step:continue_current_loop',
        on: 'start_direct',
      }),
      buildSharedFamilyActionGraphEdge({
        from: 'step:open_frontdesk',
        to: 'step:federated_handoff',
        on: 'enter_via_opl',
      }),
      buildSharedFamilyActionGraphEdge({
        from: 'step:continue_current_loop',
        to: 'step:inspect_current_progress',
        on: 'session_started',
      }),
      buildSharedFamilyActionGraphEdge({
        from: 'step:federated_handoff',
        to: 'step:inspect_current_progress',
        on: 'handoff_completed',
      }),
    ],
    entry_nodes: ['step:open_frontdesk'],
    exit_nodes: ['step:inspect_current_progress'],
    human_gates: [
      buildSharedFamilyActionGraphHumanGate({
        gate_id: 'redcube_operator_review_gate',
        trigger_nodes: ['step:inspect_current_progress'],
        blocking: true,
      }),
    ],
    checkpoint_policy: buildSharedExplicitCheckpointPolicy({
      checkpoint_nodes: [
        'step:continue_current_loop',
        'step:federated_handoff',
        'step:inspect_current_progress',
      ],
    }),
  });
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

  return buildFamilyOrchestrationTemplate({
    action_graph_ref: {
      ...PRODUCT_ENTRY_ACTION_GRAPH_REF,
    },
    action_graph: buildFamilyActionGraph(),
    human_gates: [
      {
        gate_id: 'redcube_operator_review_gate',
        title: 'RedCube operator review gate',
        status: safeText(gateStatus, 'requested'),
        ...(reviewSurface ? { review_surface: reviewSurface } : {}),
      },
    ],
    resume_surface_kind: 'product_entry_session',
    session_locator_field: sessionField,
    checkpoint_locator_field: 'continuation_snapshot.latest_managed_run_id',
    ...(eventEnvelopeSurface ? { event_envelope_surface: eventEnvelopeSurface } : {}),
    ...(checkpointLineageSurface ? { checkpoint_lineage_surface: checkpointLineageSurface } : {}),
  });
}
