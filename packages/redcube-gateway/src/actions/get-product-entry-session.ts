// @ts-nocheck
import {
  getPublicationProjection,
  getReviewState,
  loadProductEntrySessionSnapshotRef,
  productEntrySessionFile,
} from '@redcube/runtime';
import {
  buildDeliveryIdentitySurface,
  buildEntrySessionSurface,
  buildProductEntryContinuationSnapshot,
} from 'opl-framework-shared/product-entry-companions';

import {
  buildSessionContinuationFamilyOrchestration,
} from './family-orchestration-companion.js';
import {
  buildArtifactInventorySurface,
  buildOplFamilyLifecycleAdapterSurface,
  buildProgressProjectionSurface,
  buildRuntimeLoopClosureSurface,
  buildSessionContinuitySurface,
} from './product-entry-continuity-surfaces.js';
import { buildWorkspaceReceiptInventoryProjection } from './get-product-entry-manifest-parts/workspace-receipt-inventory.js';
import {
  buildNativeProofArtifactInventory,
  mergeArtifactInventoryWithPublicationRefs,
  publicationProjectionForDeliverable,
} from './get-product-entry-session-parts/session-artifacts.js';
import {
  buildProductEntrySessionSummary,
  buildPptImageRouteSessionSurface,
  buildRecommendedAction,
  buildSessionDeliveryIdentityPayload,
} from './get-product-entry-session-parts/session-surfaces.js';

const DEFAULT_RUNTIME_OWNER = 'configured_family_runtime_provider';
const HOSTED_RUNTIME_OWNER = 'configured_family_runtime_provider';
const SUPPORTED_RUNTIME_OWNERS = new Set([DEFAULT_RUNTIME_OWNER, HOSTED_RUNTIME_OWNER]);

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function requireField(name, value) {
  const text = safeText(value);
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  return text;
}

function productEntrySessionPath(entrySessionId) {
  return productEntrySessionFile(entrySessionId);
}

export async function getProductEntrySession(request) {
  const entrySessionId = requireField(
    'entry_session_id',
    request?.entry_session_id || request?.entrySessionId,
  );
  const storedSession = loadProductEntrySessionSnapshotRef({ entrySessionId });
  if (!storedSession) {
    throw new Error(`product entry session 不存在: ${entrySessionId}`);
  }
  const session = storedSession;
  if (!SUPPORTED_RUNTIME_OWNERS.has(safeText(session.runtime_owner))) {
    throw new Error('product entry session runtime_owner 漂移');
  }

  const [reviewState, publicationProjection] = await Promise.all([
    getReviewState({
      workspaceRoot: session.workspace_root,
      topicId: session.topic_id,
      deliverableId: session.deliverable_id,
    }),
    getPublicationProjection({
      workspaceRoot: session.workspace_root,
      topicId: session.topic_id,
    }),
  ]);
  const continuationSnapshot = buildProductEntryContinuationSnapshot({
    latest_run_id: session.latest_run_id || null,
    extra_payload: {
      latest_stage_execution_plan_ref: session.latest_stage_execution_plan_ref || null,
      stage_execution_plan: session.stage_execution_plan || null,
      runtime_progress_projection: null,
      runtime_projection: null,
      latest_surface_kind: session.latest_surface_kind || null,
    },
  });
  const familyOrchestration = buildSessionContinuationFamilyOrchestration({
    continuationSnapshot,
  });
  const sessionContinuity = buildSessionContinuitySurface({
    entrySessionId,
    sessionFile: productEntrySessionPath(entrySessionId),
    runtimeOwner: session.runtime_owner,
    deliveryIdentity: buildSessionDeliveryIdentityPayload(session),
    continuationSnapshot,
  });
  const progressProjection = buildProgressProjectionSurface({ continuationSnapshot });
  const artifactInventory = mergeArtifactInventoryWithPublicationRefs({
    artifactInventory: buildArtifactInventorySurface({
      entrySessionId,
      sessionFile: productEntrySessionPath(entrySessionId),
      continuationSnapshot,
    }),
    publicationProjection,
    deliverableId: session.deliverable_id,
  });
  const nativeProofArtifactInventory = buildNativeProofArtifactInventory({
    artifactInventory,
    publicationProjection,
    deliverableId: session.deliverable_id,
  });
  const workspaceReceiptInventoryProjection = buildWorkspaceReceiptInventoryProjection({
    workspaceRoot: session.workspace_root,
  });
  const runtimeLoopClosure = buildRuntimeLoopClosureSurface({
    entrySessionId,
    sessionFile: productEntrySessionPath(entrySessionId),
    runtimeOwner: session.runtime_owner,
    deliveryIdentity: buildSessionDeliveryIdentityPayload(session, { includeProfile: false }),
    continuationSnapshot,
    source: 'session',
    entryMode: safeText(session.last_entry_mode, 'redcube_product_entry'),
  });
  const pptImageRouteSession = buildPptImageRouteSessionSurface({ session });
  const oplFamilyLifecycleAdapter = buildOplFamilyLifecycleAdapterSurface({
    runtimeOwner: session.runtime_owner,
    entrySessionId,
    sessionFile: productEntrySessionPath(entrySessionId),
    deliveryIdentity: buildSessionDeliveryIdentityPayload(session),
    continuationSnapshot,
    runtimeLoopClosure,
    reviewState,
    publicationProjection,
    source: 'session',
    entryMode: safeText(session.last_entry_mode, 'redcube_product_entry'),
  });

  return {
    ok: true,
    surface_kind: 'product_entry_session',
    recommended_action: buildRecommendedAction({
      runtimeProjectionSurface: null,
      runtimeLoopClosure,
      reviewState,
      publicationProjection,
      deliverableId: session.deliverable_id,
      publicationProjectionForDeliverable,
    }),
    product_entry_contract_id: 'redcube_product_entry_session_continuity',
    entry_session: buildEntrySessionSurface({
      entry_session_id: entrySessionId,
      session_file: productEntrySessionPath(entrySessionId),
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
    workspace_receipt_inventory_projection: workspaceReceiptInventoryProjection,
    native_proof_artifact_inventory: nativeProofArtifactInventory,
    ppt_deck_visual_route_session: pptImageRouteSession,
    runtime_loop_closure: runtimeLoopClosure,
    review_state: reviewState,
    publication_projection: publicationProjection,
    opl_family_lifecycle_adapter: oplFamilyLifecycleAdapter,
    family_orchestration: familyOrchestration,
    summary: buildProductEntrySessionSummary({
      entrySessionId,
      session,
      nativeProofArtifactInventory,
      pptImageRouteSession,
      runtimeLoopClosure,
      familyOrchestration,
    }),
  };
}
