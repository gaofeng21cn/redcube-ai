// @ts-nocheck
import { safeText } from './action-utils.js';
import type { ProductEntrySessionResponse } from '../types.js';

const OPL_DOMAIN_ID = 'rca';
const OPL_DOMAIN_OWNER = 'redcube_ai';
const OPL_RUNTIME_OWNER = 'configured_family_runtime_provider';
const OPL_GENERATED_SESSION_VERSION = 'opl-generated-product-entry-session.v1';

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

function requireExactValue(value, expected, field) {
  if (value !== expected) {
    throw new Error(`${field} must be ${String(expected)}`);
  }
}

function stringRefs(value, field) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`${field} must be string[]`);
  return [...new Set(value.map((entry) => requiredText(entry, field)))];
}

function isStageFolderLocatorRef(value) {
  const segments = value.replaceAll('\\', '/').split('/').filter(Boolean);
  const stagesIndex = segments.lastIndexOf('stages');
  if (stagesIndex >= 0) {
    const stageTail = segments.slice(stagesIndex + 1);
    if (stageTail.length === 2) {
      return ['stage.json', 'current.json', 'latest'].includes(stageTail[1]);
    }
    return stageTail.length === 4
      && stageTail[1] === 'attempts'
      && ['attempt.json', 'manifest.json'].includes(stageTail[3]);
  }
  const deliverablesIndex = segments.lastIndexOf('deliverables');
  const deliverableTail = deliverablesIndex >= 0 ? segments.slice(deliverablesIndex + 1) : [];
  return deliverableTail.length === 4
    && ['deliverable.json', 'current.json', 'latest.json'].includes(deliverableTail[3]);
}

function currentnessRefs(value, field = 'domain_projection.currentness_refs') {
  const refs = record(value, field);
  const crossProviderAttemptIndex = refs.cross_provider_attempt_index == null
    ? null
    : record(refs.cross_provider_attempt_index, `${field}.cross_provider_attempt_index`);
  const providerAttemptRef = safeText(
    refs.provider_attempt_ref || crossProviderAttemptIndex?.provider_attempt_ref,
  ) || null;
  const providerAttemptLedgerRef = safeText(
    refs.provider_attempt_ledger_ref || crossProviderAttemptIndex?.provider_attempt_ledger_ref,
  ) || null;
  if (Boolean(providerAttemptRef) !== Boolean(providerAttemptLedgerRef)) {
    throw new Error('OPL provider attempt currentness requires both provider refs');
  }
  if (crossProviderAttemptIndex) {
    if (requiredText(
      crossProviderAttemptIndex.surface_kind,
      `${field}.cross_provider_attempt_index.surface_kind`,
    ) !== 'cross_provider_attempt_index') {
      throw new Error(`${field}.cross_provider_attempt_index.surface_kind must be cross_provider_attempt_index`);
    }
    if (safeText(crossProviderAttemptIndex.provider_attempt_ref) !== providerAttemptRef) {
      throw new Error(`${field}.cross_provider_attempt_index.provider_attempt_ref does not match currentness`);
    }
    if (safeText(crossProviderAttemptIndex.provider_attempt_ledger_ref) !== providerAttemptLedgerRef) {
      throw new Error(`${field}.cross_provider_attempt_index.provider_attempt_ledger_ref does not match currentness`);
    }
  }
  return {
    latest_surface_kind: safeText(refs.latest_surface_kind) || null,
    latest_stage_execution_plan_ref: safeText(refs.latest_stage_execution_plan_ref) || null,
    latest_visual_run_ref: safeText(refs.latest_visual_run_ref) || null,
    provider_attempt_ref: providerAttemptRef,
    provider_attempt_ledger_ref: providerAttemptLedgerRef,
    cross_provider_attempt_index: crossProviderAttemptIndex
      ? { ...crossProviderAttemptIndex }
      : null,
    typed_blocker_ref: safeText(refs.typed_blocker_ref) || null,
    next_forced_delta_refs: stringRefs(refs.next_forced_delta_refs, `${field}.next_forced_delta_refs`),
  };
}

function assertSameLocator(generatedDelivery, domainDelivery, field) {
  const generated = safeText(generatedDelivery[field]);
  const domain = safeText(domainDelivery[field]);
  if (generated && domain && generated !== domain) {
    throw new Error(`opl_generated_session_surface.delivery_identity.${field} does not match domain_projection`);
  }
}

export function normalizeOplGeneratedProductSessionSurface(
  value,
  entrySessionId,
  { required = false } = {},
) {
  if (value === undefined || value === null) {
    if (required) throw new Error('opl_generated_session_surface is required');
    return null;
  }
  const generated = record(value, 'opl_generated_session_surface');
  if (requiredText(
    generated.surface_kind,
    'opl_generated_session_surface.surface_kind',
  ) !== 'opl_generated_product_entry_session_surface') {
    throw new Error(
      'opl_generated_session_surface.surface_kind must be opl_generated_product_entry_session_surface',
    );
  }
  if (requiredText(
    generated.version,
    'opl_generated_session_surface.version',
  ) !== OPL_GENERATED_SESSION_VERSION) {
    throw new Error(
      `opl_generated_session_surface.version must be ${OPL_GENERATED_SESSION_VERSION}`,
    );
  }
  if (requiredText(generated.domain_id, 'opl_generated_session_surface.domain_id') !== OPL_DOMAIN_ID) {
    throw new Error(`opl_generated_session_surface.domain_id must be ${OPL_DOMAIN_ID}`);
  }
  if (requiredText(
    generated.domain_owner,
    'opl_generated_session_surface.domain_owner',
  ) !== OPL_DOMAIN_OWNER) {
    throw new Error(`opl_generated_session_surface.domain_owner must be ${OPL_DOMAIN_OWNER}`);
  }
  if (requiredText(
    generated.runtime_owner,
    'opl_generated_session_surface.runtime_owner',
  ) !== OPL_RUNTIME_OWNER) {
    throw new Error(`opl_generated_session_surface.runtime_owner must be ${OPL_RUNTIME_OWNER}`);
  }
  const generatedEntrySession = record(
    generated.entry_session,
    'opl_generated_session_surface.entry_session',
  );
  const generatedEntrySessionId = requiredText(
    generatedEntrySession.entry_session_id,
    'opl_generated_session_surface.entry_session.entry_session_id',
  );
  if (generatedEntrySessionId !== entrySessionId) {
    throw new Error(
      'opl_generated_session_surface.entry_session.entry_session_id does not match entry_session_contract',
    );
  }
  const generatedSessionFile = requiredText(
    generatedEntrySession.session_file,
    'opl_generated_session_surface.entry_session.session_file',
  );
  requireExactValue(
    generatedEntrySession.runtime_owner,
    OPL_RUNTIME_OWNER,
    'opl_generated_session_surface.entry_session.runtime_owner',
  );
  if (generatedEntrySession.resumed_from_session != null
    && typeof generatedEntrySession.resumed_from_session !== 'boolean') {
    throw new Error('opl_generated_session_surface.entry_session.resumed_from_session must be boolean');
  }
  const sessionContinuity = record(
    generated.session_continuity,
    'opl_generated_session_surface.session_continuity',
  );
  requireExactValue(
    sessionContinuity.surface_kind,
    'opl_generated_session_continuity',
    'opl_generated_session_surface.session_continuity.surface_kind',
  );
  requireExactValue(
    sessionContinuity.domain_agent_id,
    OPL_DOMAIN_ID,
    'opl_generated_session_surface.session_continuity.domain_agent_id',
  );
  requireExactValue(
    sessionContinuity.domain_owner,
    OPL_DOMAIN_OWNER,
    'opl_generated_session_surface.session_continuity.domain_owner',
  );
  requireExactValue(
    sessionContinuity.runtime_owner,
    OPL_RUNTIME_OWNER,
    'opl_generated_session_surface.session_continuity.runtime_owner',
  );
  requireExactValue(
    sessionContinuity.entry_session_id,
    entrySessionId,
    'opl_generated_session_surface.session_continuity.entry_session_id',
  );
  requireExactValue(
    sessionContinuity.session_file,
    generatedSessionFile,
    'opl_generated_session_surface.session_continuity.session_file',
  );
  requiredText(
    sessionContinuity.status,
    'opl_generated_session_surface.session_continuity.status',
  );
  const artifactInventory = record(
    generated.artifact_inventory,
    'opl_generated_session_surface.artifact_inventory',
  );
  requireExactValue(
    artifactInventory.surface_kind,
    'opl_generated_artifact_locator_projection',
    'opl_generated_session_surface.artifact_inventory.surface_kind',
  );
  requireExactValue(
    artifactInventory.body_included,
    false,
    'opl_generated_session_surface.artifact_inventory.body_included',
  );
  requireExactValue(
    artifactInventory.write_permitted,
    false,
    'opl_generated_session_surface.artifact_inventory.write_permitted',
  );
  const authorityBoundary = record(
    generated.authority_boundary,
    'opl_generated_session_surface.authority_boundary',
  );
  for (const [field, expected] of Object.entries({
    generated_surface_only: true,
    diagnostic_and_refs_only: true,
    can_write_domain_truth: false,
    can_write_artifact_body: false,
    can_write_memory_body: false,
    can_sign_owner_receipt: false,
    can_create_typed_blocker: false,
    can_issue_domain_or_quality_or_export_verdict: false,
  })) {
    requireExactValue(
      authorityBoundary[field],
      expected,
      `opl_generated_session_surface.authority_boundary.${field}`,
    );
  }
  requiredText(generated.source, 'opl_generated_session_surface.source');
  requiredText(generated.entry_mode, 'opl_generated_session_surface.entry_mode');
  const projection = record(
    generated.domain_projection,
    'opl_generated_session_surface.domain_projection',
  );
  if (requiredText(
    projection.surface_kind,
    'opl_generated_session_surface.domain_projection.surface_kind',
  ) !== 'rca_product_entry_session_handoff_refs') {
    throw new Error(
      'opl_generated_session_surface.domain_projection.surface_kind must be rca_product_entry_session_handoff_refs',
    );
  }
  if (requiredText(
    projection.entry_session_id,
    'opl_generated_session_surface.domain_projection.entry_session_id',
  ) !== entrySessionId) {
    throw new Error(
      'opl_generated_session_surface.domain_projection.entry_session_id does not match entry_session_contract',
    );
  }
  const delivery = record(
    projection.delivery_locator_refs,
    'opl_generated_session_surface.domain_projection.delivery_locator_refs',
  );
  const generatedDelivery = record(
    generated.delivery_identity,
    'opl_generated_session_surface.delivery_identity',
  );
  for (const field of ['workspace_ref', 'deliverable_family', 'topic_id', 'deliverable_id', 'profile_id']) {
    assertSameLocator(generatedDelivery, delivery, field);
  }
  const currentness = currentnessRefs(
    projection.currentness_refs,
    'opl_generated_session_surface.domain_projection.currentness_refs',
  );
  return {
    surface_kind: 'opl_generated_product_entry_session_surface',
    domain_id: OPL_DOMAIN_ID,
    domain_owner: OPL_DOMAIN_OWNER,
    runtime_owner: OPL_RUNTIME_OWNER,
    entry_session_id: generatedEntrySessionId,
    domain_snapshot_ref: requiredText(
      projection.domain_snapshot_ref,
      'opl_generated_session_surface.domain_projection.domain_snapshot_ref',
    ),
    delivery_locator_refs: {
      workspace_ref: requiredText(delivery.workspace_ref, 'delivery_locator_refs.workspace_ref'),
      deliverable_family: requiredText(delivery.deliverable_family, 'delivery_locator_refs.deliverable_family'),
      topic_id: requiredText(delivery.topic_id, 'delivery_locator_refs.topic_id'),
      deliverable_id: requiredText(delivery.deliverable_id, 'delivery_locator_refs.deliverable_id'),
      profile_id: safeText(delivery.profile_id) || null,
    },
    currentness_refs: currentness,
    stage_folder_locator_refs: stringRefs(
      projection.stage_folder_locator_refs,
      'opl_generated_session_surface.domain_projection.stage_folder_locator_refs',
    ),
    artifact_authority_refs: stringRefs(
      projection.artifact_authority_refs,
      'opl_generated_session_surface.domain_projection.artifact_authority_refs',
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
  const previous = entrySession.oplGeneratedSessionSurface;
  const domainSnapshotRef = [
    'domain-snapshot:rca/product-entry',
    encodeURIComponent(entrySession.entrySessionId),
    encodeURIComponent(current.targetHandle || resultSurface.surface_kind || 'result'),
  ].join('/');
  const runtimeArtifactRefs = stringRefs(
    resultSurface.run?.artifact_refs,
    'result_surface.run.artifact_refs',
  );
  const resultArtifactRefs = stringRefs([
    ...(Array.isArray(resultSurface.artifact_refs) ? resultSurface.artifact_refs : []),
    ...runtimeArtifactRefs,
    ...(Array.isArray(resultSurface.runtime_progress_projection?.final_artifact_refs)
      ? resultSurface.runtime_progress_projection.final_artifact_refs
      : []),
    safeText(resultSurface.artifactFile),
  ].filter(Boolean), 'result_surface.artifact_refs');
  const resultStageFolderRefs = stringRefs([
    ...(Array.isArray(resultSurface.stage_folder_locator_refs)
      ? resultSurface.stage_folder_locator_refs
      : []),
    ...runtimeArtifactRefs.filter(isStageFolderLocatorRef),
  ], 'result_surface.stage_folder_locator_refs');
  const resultAttemptIndex = resultSurface.run?.cross_provider_attempt_index || null;
  const providerAttemptRef = safeText(resultAttemptIndex?.provider_attempt_ref)
    || previous?.currentness_refs.provider_attempt_ref
    || entrySession.providerAttemptRef
    || null;
  const providerAttemptLedgerRef = safeText(resultAttemptIndex?.provider_attempt_ledger_ref)
    || previous?.currentness_refs.provider_attempt_ledger_ref
    || entrySession.providerAttemptLedgerRef
    || null;
  const crossProviderAttemptIndex = resultAttemptIndex
    || previous?.currentness_refs.cross_provider_attempt_index
    || null;

  return {
    surface_kind: 'rca_product_entry_session_handoff_refs',
    entry_session_id: entrySession.entrySessionId,
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
      cross_provider_attempt_index: crossProviderAttemptIndex,
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

export function buildProductEntrySessionDomainSnapshotRefs(
  generatedSession,
): ProductEntrySessionResponse {
  return {
    ok: true,
    surface_kind: 'product_entry_session',
    projection_kind: 'rca_product_entry_session_domain_snapshot_refs',
    recommended_action: 'consume_with_opl_generated_product_session',
    owner: 'redcube_ai',
    entry_session_ref: {
      entry_session_id: generatedSession.entry_session_id,
      generated_session_surface_kind: generatedSession.surface_kind,
      domain_snapshot_ref: generatedSession.domain_snapshot_ref,
      runtime_owner: generatedSession.runtime_owner,
    },
    delivery_locator_refs: generatedSession.delivery_locator_refs,
    currentness_refs: {
      domain_snapshot_ref: generatedSession.domain_snapshot_ref,
      ...generatedSession.currentness_refs,
    },
    stage_folder_locator_refs: generatedSession.stage_folder_locator_refs,
    artifact_authority_refs: generatedSession.artifact_authority_refs,
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
      entry_session_id: generatedSession.entry_session_id,
      deliverable_id: generatedSession.delivery_locator_refs.deliverable_id,
      latest_visual_run_ref: generatedSession.currentness_refs.latest_visual_run_ref,
      typed_blocker_ref: generatedSession.currentness_refs.typed_blocker_ref,
    },
  };
}
