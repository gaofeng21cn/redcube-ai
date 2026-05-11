// @ts-nocheck
import {
  buildFamilyProductEntryPresetOrchestration,
} from 'opl-framework-shared/family-orchestration';

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
  graph_id: 'redcube_product_entry_overview_graph',
  target_domain_id: 'redcube_ai',
  graph_kind: 'visual_deliverable_orchestration',
  graph_version: '2026-04-13',
  entry_node_id: 'step:open_status',
  entry_title: 'Open RedCube product-entry overview',
  entry_surface_kind: 'product_status',
  direct_title: 'Start or continue the direct product loop',
  direct_surface_kind: 'product_entry',
  opl_hosted_node_id: 'step:opl_hosted_handoff',
  opl_hosted_title: 'Enter the same loop through OPL-hosted stage runtime handoff',
  opl_hosted_surface_kind: 'opl_hosted_product_entry',
  opl_hosted_transition_event: 'enter_via_opl_hosted_handoff',
  progress_title: 'Inspect current product-entry progress',
  progress_surface_kind: 'product_entry_session',
  review_gate_id: 'redcube_operator_review_gate',
  review_gate_title: 'RedCube operator review gate',
  resume_surface_kind: 'product_entry_session',
  checkpoint_locator_field: 'continuation_snapshot.latest_managed_run_id',
});

const SESSION_CONTINUATION_REVIEW_SURFACE_REF = Object.freeze({
  ref_kind: 'json_pointer',
  ref: '/review_state',
  label: 'current review state surface',
});

const SESSION_CONTINUATION_EVENT_ENVELOPE_SURFACE_REF = Object.freeze({
  ref_kind: 'json_pointer',
  ref: '/continuation_snapshot/managed_progress_projection/latest_events',
  label: 'managed run event companion',
});

const SESSION_CONTINUATION_CHECKPOINT_LINEAGE_SURFACE_REF = Object.freeze({
  ref_kind: 'json_pointer',
  ref: '/continuation_snapshot/latest_managed_run_id',
  label: 'latest managed-run continuation locator',
});

export function resolveHumanGateStatusFromContinuation(continuationSnapshot) {
  const needsUserDecision = Boolean(continuationSnapshot?.managed_progress_projection?.needs_user_decision);
  return needsUserDecision ? 'requested' : 'approved';
}

export function buildSessionContinuationFamilyOrchestration({
  continuationSnapshot,
  sessionLocatorField = 'entry_session.entry_session_id',
}) {
  return buildFamilyOrchestrationCompanion({
    sessionLocatorField,
    gateStatus: resolveHumanGateStatusFromContinuation(continuationSnapshot),
    reviewSurfaceRef: SESSION_CONTINUATION_REVIEW_SURFACE_REF,
    eventEnvelopeSurfaceRef: SESSION_CONTINUATION_EVENT_ENVELOPE_SURFACE_REF,
    checkpointLineageSurfaceRef: SESSION_CONTINUATION_CHECKPOINT_LINEAGE_SURFACE_REF,
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

  return buildFamilyProductEntryPresetOrchestration({
    ...PRODUCT_ENTRY_FAMILY_ORCHESTRATION_SPEC,
    product_entry_node_id: PRODUCT_ENTRY_FAMILY_ORCHESTRATION_SPEC.entry_node_id,
    product_entry_title: PRODUCT_ENTRY_FAMILY_ORCHESTRATION_SPEC.entry_title,
    product_entry_surface_kind: PRODUCT_ENTRY_FAMILY_ORCHESTRATION_SPEC.entry_surface_kind,
    federated_node_id: PRODUCT_ENTRY_FAMILY_ORCHESTRATION_SPEC.opl_hosted_node_id,
    federated_transition_event: PRODUCT_ENTRY_FAMILY_ORCHESTRATION_SPEC.opl_hosted_transition_event,
    federated_title: PRODUCT_ENTRY_FAMILY_ORCHESTRATION_SPEC.opl_hosted_title,
    federated_surface_kind: PRODUCT_ENTRY_FAMILY_ORCHESTRATION_SPEC.opl_hosted_surface_kind,
    review_gate_status: safeText(gateStatus, 'requested'),
    ...(reviewSurfaceRef ? { review_surface: reviewSurfaceRef } : {}),
    action_graph_ref: PRODUCT_ENTRY_ACTION_GRAPH_REF,
    session_locator_field: sessionField,
    ...(eventEnvelopeSurfaceRef ? { event_envelope_surface: eventEnvelopeSurfaceRef } : {}),
    ...(checkpointLineageSurfaceRef ? { checkpoint_lineage_surface: checkpointLineageSurfaceRef } : {}),
  });
}
