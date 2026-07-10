// @ts-nocheck
import { safeText } from './action-utils.js';
import type { ProductEntrySessionResponse } from '../types.js';

const OPL_SESSION_OWNER = 'one-person-lab';
const OPL_RUNTIME_OWNER = 'configured_family_runtime_provider';
const FORBIDDEN_PERSISTENCE_FIELDS = new Set([
  'resumed_from_session',
  'runtime_state_path',
  'session_file',
  'session_file_ref',
  'session_store_root',
]);

function record(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
  return value;
}

function requiredText(value, field) {
  const text = safeText(value);
  if (!text) throw new Error(`${field} is required`);
  return text;
}

function stringRefs(value, field) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`${field} must be string[]`);
  return [...new Set(value.map((entry) => requiredText(entry, field)))];
}

function rejectPersistenceFields(value, field) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => rejectPersistenceFields(entry, `${field}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    if (FORBIDDEN_PERSISTENCE_FIELDS.has(key)) {
      throw new Error(`${field}.${key} is not accepted by the RCA refs adapter`);
    }
    rejectPersistenceFields(entry, `${field}.${key}`);
  }
}

function currentnessRefs(value) {
  const refs = record(value, 'opl_session_envelope.currentness_refs');
  const providerAttemptRef = safeText(refs.provider_attempt_ref) || null;
  const providerAttemptLedgerRef = safeText(refs.provider_attempt_ledger_ref) || null;
  if (Boolean(providerAttemptRef) !== Boolean(providerAttemptLedgerRef)) {
    throw new Error('OPL provider attempt currentness requires both provider refs');
  }
  return {
    latest_surface_kind: safeText(refs.latest_surface_kind) || null,
    latest_stage_execution_plan_ref: safeText(refs.latest_stage_execution_plan_ref) || null,
    latest_visual_run_ref: safeText(refs.latest_visual_run_ref) || null,
    provider_attempt_ref: providerAttemptRef,
    provider_attempt_ledger_ref: providerAttemptLedgerRef,
    typed_blocker_ref: safeText(refs.typed_blocker_ref) || null,
    next_forced_delta_refs: stringRefs(refs.next_forced_delta_refs, 'currentness_refs.next_forced_delta_refs'),
  };
}

export function normalizeOplProductSessionEnvelope(value, entrySessionId, { required = false } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new Error('opl_session_envelope is required');
    return null;
  }
  const envelope = record(value, 'opl_session_envelope');
  rejectPersistenceFields(envelope, 'opl_session_envelope');
  if (requiredText(envelope.surface_kind, 'opl_session_envelope.surface_kind') !== 'opl_product_session_envelope') {
    throw new Error('opl_session_envelope.surface_kind must be opl_product_session_envelope');
  }
  if (requiredText(envelope.owner, 'opl_session_envelope.owner') !== OPL_SESSION_OWNER) {
    throw new Error(`opl_session_envelope.owner must be ${OPL_SESSION_OWNER}`);
  }
  if (requiredText(envelope.runtime_owner, 'opl_session_envelope.runtime_owner') !== OPL_RUNTIME_OWNER) {
    throw new Error(`opl_session_envelope.runtime_owner must be ${OPL_RUNTIME_OWNER}`);
  }
  const envelopeEntrySessionId = requiredText(
    envelope.entry_session_id,
    'opl_session_envelope.entry_session_id',
  );
  if (envelopeEntrySessionId !== entrySessionId) {
    throw new Error('opl_session_envelope.entry_session_id does not match entry_session_contract');
  }
  const delivery = record(envelope.delivery_locator_refs, 'opl_session_envelope.delivery_locator_refs');
  return {
    surface_kind: 'opl_product_session_envelope',
    owner: OPL_SESSION_OWNER,
    runtime_owner: OPL_RUNTIME_OWNER,
    session_ref: requiredText(envelope.session_ref, 'opl_session_envelope.session_ref'),
    entry_session_id: envelopeEntrySessionId,
    domain_snapshot_ref: requiredText(
      envelope.domain_snapshot_ref,
      'opl_session_envelope.domain_snapshot_ref',
    ),
    delivery_locator_refs: {
      workspace_ref: requiredText(delivery.workspace_ref, 'delivery_locator_refs.workspace_ref'),
      deliverable_family: requiredText(delivery.deliverable_family, 'delivery_locator_refs.deliverable_family'),
      topic_id: requiredText(delivery.topic_id, 'delivery_locator_refs.topic_id'),
      deliverable_id: requiredText(delivery.deliverable_id, 'delivery_locator_refs.deliverable_id'),
      profile_id: safeText(delivery.profile_id) || null,
    },
    currentness_refs: currentnessRefs(envelope.currentness_refs),
    stage_folder_locator_refs: stringRefs(
      envelope.stage_folder_locator_refs,
      'opl_session_envelope.stage_folder_locator_refs',
    ),
    artifact_authority_refs: stringRefs(
      envelope.artifact_authority_refs,
      'opl_session_envelope.artifact_authority_refs',
    ),
  };
}

function resultCurrentness(resultSurface) {
  const latestStageExecutionPlanRef = safeText(
    resultSurface?.summary?.stage_execution_plan_ref
      || resultSurface?.plan_ref
      || resultSurface?.plan_id,
  ) || null;
  const latestRunId = safeText(resultSurface?.summary?.run_id || resultSurface?.run?.run_id) || null;
  return {
    latestStageExecutionPlanRef,
    latestRunId,
    targetHandle: latestStageExecutionPlanRef || latestRunId,
  };
}

export function buildProductEntrySessionHandoffRefs({
  entrySession,
  workspaceRoot,
  deliveryIdentity,
  domainEntrySurface,
}) {
  const resultSurface = domainEntrySurface?.result_surface || {};
  const current = resultCurrentness(resultSurface);
  const previous = entrySession.oplSessionEnvelope;
  const domainSnapshotRef = [
    'domain-snapshot:rca/product-entry',
    encodeURIComponent(entrySession.entrySessionId),
    encodeURIComponent(current.targetHandle || resultSurface.surface_kind || 'result'),
  ].join('/');
  const resultArtifactRefs = stringRefs(
    resultSurface.artifact_refs || resultSurface.runtime_progress_projection?.final_artifact_refs,
    'result_surface.artifact_refs',
  );
  const resultStageFolderRefs = stringRefs(
    resultSurface.stage_folder_locator_refs,
    'result_surface.stage_folder_locator_refs',
  );
  const providerAttemptRef = entrySession.providerAttemptRef
    || previous?.currentness_refs.provider_attempt_ref
    || null;
  const providerAttemptLedgerRef = entrySession.providerAttemptLedgerRef
    || previous?.currentness_refs.provider_attempt_ledger_ref
    || null;

  return {
    surface_kind: 'rca_product_entry_session_handoff_refs',
    entry_session_id: entrySession.entrySessionId,
    opl_session_ref: previous?.session_ref || null,
    previous_domain_snapshot_ref: previous?.domain_snapshot_ref || null,
    domain_snapshot_ref: domainSnapshotRef,
    delivery_locator_refs: {
      workspace_ref: workspaceRoot,
      deliverable_family: deliveryIdentity.deliverableFamily,
      topic_id: deliveryIdentity.topicId,
      deliverable_id: deliveryIdentity.deliverableId,
      profile_id: deliveryIdentity.profileId || null,
    },
    currentness_refs: {
      domain_snapshot_ref: domainSnapshotRef,
      latest_surface_kind: safeText(resultSurface.surface_kind) || null,
      latest_stage_execution_plan_ref: current.latestStageExecutionPlanRef,
      latest_visual_run_ref: current.latestRunId ? `route-run:${current.latestRunId}` : null,
      provider_attempt_ref: providerAttemptRef,
      provider_attempt_ledger_ref: providerAttemptLedgerRef,
      typed_blocker_ref: safeText(resultSurface.blocker_ref || resultSurface.typed_blocker_ref) || null,
      next_forced_delta_refs: previous?.currentness_refs.next_forced_delta_refs || [],
    },
    stage_folder_locator_refs: [...new Set([
      ...(previous?.stage_folder_locator_refs || []),
      ...resultStageFolderRefs,
    ])],
    artifact_authority_refs: [...new Set([
      ...(previous?.artifact_authority_refs || []),
      ...resultArtifactRefs,
    ])],
    authority_refs: resultSurface.authority_refs || {},
  };
}

export function buildProductEntrySessionDomainSnapshotRefs(envelope): ProductEntrySessionResponse {
  return {
    ok: true,
    surface_kind: 'product_entry_session',
    projection_kind: 'rca_product_entry_session_domain_snapshot_refs',
    recommended_action: 'consume_with_opl_generated_product_session',
    owner: 'redcube_ai',
    entry_session_ref: {
      entry_session_id: envelope.entry_session_id,
      opl_session_ref: envelope.session_ref,
      domain_snapshot_ref: envelope.domain_snapshot_ref,
      runtime_owner: envelope.runtime_owner,
    },
    delivery_locator_refs: envelope.delivery_locator_refs,
    currentness_refs: {
      domain_snapshot_ref: envelope.domain_snapshot_ref,
      ...envelope.currentness_refs,
    },
    stage_folder_locator_refs: envelope.stage_folder_locator_refs,
    artifact_authority_refs: envelope.artifact_authority_refs,
    authority_refs: {
      review_state_ref: 'domain-handler:getReviewState',
      publication_projection_ref: 'domain-handler:getPublicationProjection',
      artifact_locator_contract_ref: 'contracts/artifact_locator_contract.json',
      owner_receipt_contract_ref: 'contracts/owner_receipt_contract.json',
    },
    operator_navigation_refs: {
      generated_session_surface_ref: 'opl_generated:product_session',
      domain_snapshot_action_ref: 'domain-handler:getProductEntrySession',
      direct_entry_action_ref: 'domain-handler:invokeProductEntry',
    },
    authority_boundary: {
      refs_only: true,
      domain_snapshot_owner: 'redcube_ai',
      visual_truth_owner: 'redcube_ai',
      review_export_verdict_owner: 'redcube_ai',
      artifact_authority_owner: 'redcube_ai',
      visual_memory_owner: 'redcube_ai',
      owner_receipt_owner: 'redcube_ai',
      rca_owns_generic_session_shell: false,
      rca_owns_generic_workbench: false,
      writes_visual_truth: false,
      writes_artifact_body: false,
      writes_memory_body: false,
      issues_review_or_export_verdict: false,
      creates_owner_receipt: false,
      creates_typed_blocker: false,
    },
    summary: {
      entry_session_id: envelope.entry_session_id,
      deliverable_id: envelope.delivery_locator_refs.deliverable_id,
      latest_visual_run_ref: envelope.currentness_refs.latest_visual_run_ref,
      typed_blocker_ref: envelope.currentness_refs.typed_blocker_ref,
    },
  };
}
