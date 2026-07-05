// @ts-nocheck
import {
  getPublicationProjection,
  getReviewState,
} from '@redcube/runtime';
import { buildProductEntryContinuationSnapshot } from 'opl-framework-shared/product-entry-companions';

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
import {
  buildContinuationSnapshotFromSessionRecord,
  resolveProductEntryCurrentness,
} from './product-entry-currentness-resolver.js';
import { buildWorkspaceReceiptInventoryProjection } from './get-product-entry-manifest-parts/workspace-receipt-inventory.js';
import {
  buildNativeProofArtifactInventory,
  mergeArtifactInventoryWithPublicationRefs,
} from './get-product-entry-session-parts/session-artifacts.js';
import type { ProductEntrySessionResponse } from '../types.js';
import {
  buildProductEntrySessionSurfaceContext,
  buildProductEntrySessionResponse,
  buildPptImageRouteSessionSurface,
} from './get-product-entry-session-parts/session-surfaces.js';
import {
  loadProductEntrySessionRef,
} from './product-entry-session-refs.js';

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

export async function getProductEntrySession(request): Promise<ProductEntrySessionResponse> {
  const entrySessionId = requireField(
    'entry_session_id',
    request?.entry_session_id || request?.entrySessionId,
  );
  const storedSession = loadProductEntrySessionRef({ entrySessionId });
  if (!storedSession) {
    throw new Error(`product entry session 不存在: ${entrySessionId}`);
  }
  const { session } = resolveProductEntryCurrentness({ session: storedSession, persist: false });
  const {
    sessionFile,
    runtimeOwner,
    deliveryIdentity,
    runtimeLoopClosureDeliveryIdentity,
    entryMode,
  } = buildProductEntrySessionSurfaceContext({ entrySessionId, session });

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
    extra_payload: buildContinuationSnapshotFromSessionRecord(session),
  });
  const familyOrchestration = buildSessionContinuationFamilyOrchestration({
    continuationSnapshot,
  });
  const sessionContinuity = buildSessionContinuitySurface({
    entrySessionId,
    sessionFile,
    runtimeOwner,
    deliveryIdentity,
    continuationSnapshot,
  });
  const progressProjection = buildProgressProjectionSurface({ continuationSnapshot });
  const artifactInventory = mergeArtifactInventoryWithPublicationRefs({
    artifactInventory: buildArtifactInventorySurface({
      entrySessionId,
      sessionFile,
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
    workspaceReceiptScaleoutRoots: request?.workspace_receipt_scaleout_roots,
  });
  const runtimeLoopClosure = buildRuntimeLoopClosureSurface({
    entrySessionId,
    sessionFile,
    runtimeOwner,
    deliveryIdentity: runtimeLoopClosureDeliveryIdentity,
    continuationSnapshot,
    source: 'session',
    entryMode,
  });
  const pptImageRouteSession = buildPptImageRouteSessionSurface({ session });
  const oplFamilyLifecycleAdapter = buildOplFamilyLifecycleAdapterSurface({
    runtimeOwner,
    entrySessionId,
    sessionFile,
    deliveryIdentity,
    continuationSnapshot,
    runtimeLoopClosure,
    reviewState,
    publicationProjection,
    source: 'session',
    entryMode,
  });

  return buildProductEntrySessionResponse({
    entrySessionId,
    sessionFile,
    session,
    continuationSnapshot,
    sessionContinuity,
    progressProjection,
    artifactInventory,
    workspaceReceiptInventoryProjection,
    nativeProofArtifactInventory,
    pptImageRouteSession,
    runtimeLoopClosure,
    reviewState,
    publicationProjection,
    oplFamilyLifecycleAdapter,
    familyOrchestration,
  });
}
