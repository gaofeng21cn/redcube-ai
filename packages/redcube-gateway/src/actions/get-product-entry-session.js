import { existsSync, readFileSync } from 'node:fs';

import {
  getPublicationProjection,
  getReviewState,
  loadProductEntrySession,
  loadRuntimeSupervisionLatest,
  productEntrySessionFile,
  saveProductEntrySession,
} from '@redcube/runtime';
import {
  buildDeliveryIdentitySurface,
  buildEntrySessionSurface,
  buildProductEntryContinuationSnapshot,
} from 'opl-gateway-shared/product-entry-companions';

import {
  buildSessionContinuationFamilyOrchestration,
} from './family-orchestration-companion.js';
import { getManagedRun } from './get-managed-run.js';
import {
  buildArtifactInventorySurface,
  buildProgressProjectionSurface,
  buildRuntimeLoopClosureSurface,
  buildSessionContinuitySurface,
} from './product-entry-continuity-surfaces.js';

const MANAGED_RUNTIME_OWNER = 'upstream_hermes_agent';

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function readJsonRecord(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function parseTimestampMs(value) {
  const text = safeText(value);
  if (!text) return null;
  const ms = Date.parse(text);
  return Number.isNaN(ms) ? null : ms;
}

function runtimeSupervisionIsNewerThanSession(runtimeSupervision, session) {
  const runtimeMs = parseTimestampMs(
    runtimeSupervision?.recorded_at
      || runtimeSupervision?.checked_at
      || runtimeSupervision?.updated_at,
  );
  if (runtimeMs == null) return false;

  const sessionMs = parseTimestampMs(session?.updated_at);
  if (sessionMs == null) return true;

  return runtimeMs > sessionMs;
}

function shouldPreserveRouteCheckpoint(runtimeSupervision, session) {
  if (safeText(session.latest_surface_kind) !== 'route_run' || !safeText(session.latest_run_id)) {
    return false;
  }
  return !runtimeSupervisionIsNewerThanSession(runtimeSupervision, session);
}

function publicationProjectionForDeliverable(publicationProjection, deliverableId) {
  const deliverables = publicationProjection?.publication?.deliverables || {};
  return deliverables[safeText(deliverableId)] || null;
}

function deliveryProjectionIsOutputReady({ reviewState, publicationProjection, deliverableId }) {
  const deliverableProjection = publicationProjectionForDeliverable(publicationProjection, deliverableId);
  const gateSummary = deliverableProjection?.gate_summary || reviewState?.gate_summary || {};
  const operatorHandoff = deliverableProjection?.operator_handoff || {};
  const reviewStatePayload = reviewState?.state || {};

  return safeText(deliverableProjection?.current) === 'output_ready'
    || safeText(gateSummary?.operator_handoff_status) === 'ready'
    || safeText(operatorHandoff?.gate_status) === 'ready'
    || (
      safeText(reviewStatePayload?.current_status) === 'completed'
      && safeText(reviewStatePayload?.latest_review_stage) === 'export_pptx'
      && reviewStatePayload?.ready_for_export === true
    );
}

function buildRecommendedAction({
  managedRun,
  runtimeLoopClosure,
  reviewState,
  publicationProjection,
  deliverableId,
}) {
  const projection = managedRun?.progress_projection || null;
  if (projection?.needs_user_decision) {
    return 'decide_product_next_step';
  }
  if (projection?.content_status === 'completed') {
    return 'pick_up_artifacts';
  }
  if (deliveryProjectionIsOutputReady({ reviewState, publicationProjection, deliverableId })) {
    return 'pick_up_artifacts';
  }
  return runtimeLoopClosure?.control_policy?.recommended_action || 'continue_product_entry';
}

function collectArtifactRefsFromPublishBundle(publishBundleFile) {
  const file = safeText(publishBundleFile);
  if (!file || !existsSync(file)) return [];
  const artifact = readJsonRecord(file);
  const exportBundle = artifact?.export_bundle || {};
  return [
    file,
    ...(Array.isArray(artifact?.artifact_refs) ? artifact.artifact_refs : []),
    exportBundle?.source_html,
    exportBundle?.pptx_file,
    exportBundle?.pdf_file,
    exportBundle?.presenter_notes_file,
  ].map((entry) => safeText(entry)).filter(Boolean);
}

function artifactRefsFromPublicationProjection(publicationProjection, deliverableId) {
  const deliverableProjection = publicationProjectionForDeliverable(publicationProjection, deliverableId);
  const publishBundleFile = safeText(
    deliverableProjection?.canonical_export_artifact
      || deliverableProjection?.operator_handoff?.canonical_export_artifact,
  );
  return [...new Set(collectArtifactRefsFromPublishBundle(publishBundleFile))];
}

function mergeArtifactInventoryWithPublicationRefs({ artifactInventory, publicationProjection, deliverableId }) {
  if (Array.isArray(artifactInventory?.artifact_refs) && artifactInventory.artifact_refs.length > 0) {
    return artifactInventory;
  }
  const artifactRefs = artifactRefsFromPublicationProjection(publicationProjection, deliverableId);
  if (artifactRefs.length === 0) {
    return artifactInventory;
  }
  return {
    ...artifactInventory,
    artifact_refs: artifactRefs,
    summary: {
      ...artifactInventory.summary,
      artifact_ref_count: artifactRefs.length,
      artifact_source: 'publication_projection',
    },
  };
}

function requireField(name, value) {
  const text = safeText(value);
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  return text;
}

function latestManagedRunMatchesSession(runtimeSupervision, session) {
  if (!runtimeSupervision?.managed_run_id) return false;
  return safeText(runtimeSupervision.topic_id) === safeText(session.topic_id)
    && safeText(runtimeSupervision.deliverable_id) === safeText(session.deliverable_id);
}

function reconcileSessionCheckpointWithWorkspaceLatest(session) {
  const runtimeSupervision = loadRuntimeSupervisionLatest({
    workspaceRoot: session.workspace_root,
  });
  if (!latestManagedRunMatchesSession(runtimeSupervision, session)) {
    return session;
  }

  const latestManagedRunId = safeText(runtimeSupervision.managed_run_id);
  if (!latestManagedRunId || latestManagedRunId === safeText(session.latest_managed_run_id)) {
    return session;
  }
  if (shouldPreserveRouteCheckpoint(runtimeSupervision, session)) {
    return session;
  }

  return saveProductEntrySession({
    session: {
      ...session,
      latest_managed_run_id: latestManagedRunId,
      latest_run_id: null,
      latest_surface_kind: 'managed_run',
      checkpoint_reconciled_at: new Date().toISOString(),
      checkpoint_reconciliation_source: 'workspace_latest_runtime_supervision',
    },
  }).session;
}

export async function getProductEntrySession(request) {
  const entrySessionId = requireField(
    'entry_session_id',
    request?.entry_session_id || request?.entrySessionId,
  );
  const storedSession = loadProductEntrySession({ entrySessionId });
  if (!storedSession) {
    throw new Error(`product entry session 不存在: ${entrySessionId}`);
  }
  const session = reconcileSessionCheckpointWithWorkspaceLatest(storedSession);
  if (safeText(session.runtime_owner) !== MANAGED_RUNTIME_OWNER) {
    throw new Error('product entry session runtime_owner 漂移');
  }

  const [reviewState, publicationProjection, managedRun] = await Promise.all([
    getReviewState({
      workspaceRoot: session.workspace_root,
      topicId: session.topic_id,
      deliverableId: session.deliverable_id,
    }),
    getPublicationProjection({
      workspaceRoot: session.workspace_root,
      topicId: session.topic_id,
    }),
    session.latest_managed_run_id
      ? getManagedRun({
        workspaceRoot: session.workspace_root,
        managedRunId: session.latest_managed_run_id,
      })
      : Promise.resolve(null),
  ]);
  const continuationSnapshot = buildProductEntryContinuationSnapshot({
    latest_managed_run_id: session.latest_managed_run_id || null,
    latest_run_id: session.latest_run_id || null,
    managed_progress_projection: managedRun?.progress_projection || null,
    runtime_supervision: managedRun?.runtime_supervision || null,
  });
  const familyOrchestration = buildSessionContinuationFamilyOrchestration({
    continuationSnapshot,
  });
  const sessionContinuity = buildSessionContinuitySurface({
    entrySessionId,
    sessionFile: productEntrySessionFile(entrySessionId),
    runtimeOwner: session.runtime_owner,
    deliveryIdentity: {
      deliverable_family: session.deliverable_family,
      topic_id: session.topic_id,
      deliverable_id: session.deliverable_id,
      profile_id: session.profile_id || null,
    },
    continuationSnapshot,
  });
  const progressProjection = buildProgressProjectionSurface({ continuationSnapshot });
  const artifactInventory = mergeArtifactInventoryWithPublicationRefs({
    artifactInventory: buildArtifactInventorySurface({
      entrySessionId,
      sessionFile: productEntrySessionFile(entrySessionId),
      continuationSnapshot,
    }),
    publicationProjection,
    deliverableId: session.deliverable_id,
  });
  const runtimeLoopClosure = buildRuntimeLoopClosureSurface({
    entrySessionId,
    sessionFile: productEntrySessionFile(entrySessionId),
    runtimeOwner: session.runtime_owner,
    deliveryIdentity: {
      deliverable_family: session.deliverable_family,
      topic_id: session.topic_id,
      deliverable_id: session.deliverable_id,
    },
    continuationSnapshot,
    source: 'session',
    entryMode: safeText(session.last_entry_mode, 'redcube_product_entry'),
  });

  return {
    ok: true,
    surface_kind: 'product_entry_session',
    recommended_action: buildRecommendedAction({
      managedRun,
      runtimeLoopClosure,
      reviewState,
      publicationProjection,
      deliverableId: session.deliverable_id,
    }),
    product_entry_contract_id: 'managed_product_entry_hardening',
    entry_session: buildEntrySessionSurface({
      entry_session_id: entrySessionId,
      session_file: productEntrySessionFile(entrySessionId),
      runtime_owner: session.runtime_owner,
    }),
    delivery_identity: buildDeliveryIdentitySurface({
      deliverable_family: session.deliverable_family,
      topic_id: session.topic_id,
      deliverable_id: session.deliverable_id,
      profile_id: session.profile_id || undefined,
      extra_payload: session.profile_id
        ? undefined
        : {
          profile_id: null,
        },
    }),
    continuation_snapshot: continuationSnapshot,
    session_continuity: sessionContinuity,
    progress_projection: progressProjection,
    artifact_inventory: artifactInventory,
    runtime_loop_closure: runtimeLoopClosure,
    review_state: reviewState,
    publication_projection: publicationProjection,
    family_orchestration: familyOrchestration,
    summary: {
      entry_session_id: entrySessionId,
      deliverable_id: session.deliverable_id,
      latest_handle: session.latest_managed_run_id || session.latest_run_id || null,
      target_handle: session.latest_managed_run_id || session.latest_run_id || null,
      approval_required: Boolean(runtimeLoopClosure?.control_policy?.approval_required),
      gate_status: runtimeLoopClosure?.control_policy?.gate_status || null,
      resume_command: runtimeLoopClosure?.control_policy?.continue_action?.command || null,
      session_locator_field: familyOrchestration?.resume_contract?.session_locator_field || null,
      checkpoint_locator_field: familyOrchestration?.resume_contract?.checkpoint_locator_field || null,
    },
  };
}
