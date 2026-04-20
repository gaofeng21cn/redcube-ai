import {
  buildFamilyFrontdeskProductEntryOrchestration,
} from 'opl-gateway-shared/family-orchestration';

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

const PRODUCT_ENTRY_ACTION_GRAPH_REF = Object.freeze({
  ref_kind: 'json_pointer',
  ref: '/family_orchestration/action_graph',
  label: 'redcube family action graph',
});

const PRODUCT_ENTRY_FAMILY_ORCHESTRATION_SPEC = Object.freeze({
  graph_id: 'redcube_frontdoor_product_entry_graph',
  target_domain_id: 'redcube_ai',
  graph_kind: 'visual_deliverable_orchestration',
  graph_version: '2026-04-13',
  frontdesk_title: 'Open RedCube frontdesk',
  frontdesk_surface_kind: 'product_frontdesk',
  direct_title: 'Start or continue the direct product loop',
  direct_surface_kind: 'product_entry',
  federated_title: 'Enter the same loop through internal OPL bridge',
  federated_surface_kind: 'federated_product_entry',
  progress_title: 'Inspect current product-entry progress',
  progress_surface_kind: 'product_entry_session',
  review_gate_id: 'redcube_operator_review_gate',
  review_gate_title: 'RedCube operator review gate',
  resume_surface_kind: 'product_entry_session',
  checkpoint_locator_field: 'continuation_snapshot.latest_managed_run_id',
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

  return buildFamilyFrontdeskProductEntryOrchestration({
    ...PRODUCT_ENTRY_FAMILY_ORCHESTRATION_SPEC,
    review_gate_status: safeText(gateStatus, 'requested'),
    ...(reviewSurfaceRef ? { review_surface: reviewSurfaceRef } : {}),
    action_graph_ref: PRODUCT_ENTRY_ACTION_GRAPH_REF,
    session_locator_field: sessionField,
    ...(eventEnvelopeSurfaceRef ? { event_envelope_surface: eventEnvelopeSurfaceRef } : {}),
    ...(checkpointLineageSurfaceRef ? { checkpoint_lineage_surface: checkpointLineageSurfaceRef } : {}),
  });
}
