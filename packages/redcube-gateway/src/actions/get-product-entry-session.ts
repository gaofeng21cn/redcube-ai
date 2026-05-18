// @ts-nocheck
import { existsSync, readFileSync } from 'node:fs';
import {
  getPublicationProjection,
  getReviewState,
  loadProductEntrySession,
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

const DEFAULT_RUNTIME_OWNER = 'configured_family_runtime_provider';
const HOSTED_RUNTIME_OWNER = 'configured_family_runtime_provider';
const SUPPORTED_RUNTIME_OWNERS = new Set([DEFAULT_RUNTIME_OWNER, HOSTED_RUNTIME_OWNER]);

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function readJsonRecord(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
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
    exportBundle?.final_delivery?.pptx_file,
    exportBundle?.final_delivery?.pdf_file,
    exportBundle?.final_delivery?.manifest_file,
    exportBundle?.final_delivery?.readme_file,
  ].map((entry) => safeText(entry)).filter(Boolean);
}

function classifyArtifact(path) {
  const text = safeText(path);
  if (/\.pptx$/i.test(text)) return 'pptx';
  if (/\.pdf$/i.test(text)) return 'pdf';
  if (/\.png$/i.test(text)) return 'preview_png';
  if (/shape[_-]manifest.*\.json$/i.test(text) || /native_ppt_shape_manifest.*\.json$/i.test(text)) return 'shape_manifest';
  if (/manifest.*\.json$/i.test(text)) return 'manifest';
  if (/readme\.md$/i.test(text)) return 'readme';
  return 'artifact';
}

function buildNativeProofArtifactInventory({ artifactInventory, publicationProjection, deliverableId }) {
  const refs = Array.isArray(artifactInventory?.artifact_refs) ? artifactInventory.artifact_refs : [];
  const classifiedRefs = refs.map((entry) => ({
    artifact_kind: classifyArtifact(entry),
    path: entry,
  }));
  const nativeRefs = classifiedRefs.filter((entry) => (
    ['pptx', 'pdf', 'preview_png', 'shape_manifest', 'manifest'].includes(entry.artifact_kind)
    || /native[_-]ppt|shape[_-]manifest|final[_-]delivery/i.test(entry.path)
  ));
  const deliverableProjection = publicationProjectionForDeliverable(publicationProjection, deliverableId);
  return {
    surface_kind: 'native_ppt_proof_artifact_inventory',
    artifact_refs: nativeRefs,
    source_artifact_inventory: artifactInventory,
    publication_projection_ref: deliverableProjection
      ? {
        ref_kind: 'publication_projection_deliverable',
        deliverable_id: deliverableId,
      }
      : null,
    summary: {
      artifact_ref_count: nativeRefs.length,
      has_pptx: nativeRefs.some((entry) => entry.artifact_kind === 'pptx'),
      has_pdf: nativeRefs.some((entry) => entry.artifact_kind === 'pdf'),
      has_preview_png: nativeRefs.some((entry) => entry.artifact_kind === 'preview_png'),
      has_shape_manifest: nativeRefs.some((entry) => entry.artifact_kind === 'shape_manifest'),
      blocked_reason: nativeRefs.length > 0 ? null : 'native_proof_artifacts_not_found_in_session_inventory',
    },
  };
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

function buildPptImageRouteSessionSurface({ session }) {
  if (safeText(session.deliverable_family) !== 'ppt_deck') {
    return null;
  }
  return {
    surface_kind: 'ppt_deck_visual_route_session',
    default_visual_route: 'author_image_pages',
    default_visual_policy: 'image_first',
    repair_route: 'repair_image_pages',
    selectable_explicit_routes: ['render_html', 'fix_html', 'author_pptx_native', 'repair_pptx_native'],
    route_selection_policy: {
      html_routes: ['render_html', 'fix_html'],
      native_routes: ['author_pptx_native', 'repair_pptx_native'],
      explicit_selection_required_for: ['render_html', 'fix_html', 'author_pptx_native', 'repair_pptx_native'],
      style_reference_dir_input: 'delivery_request.style_reference_dir',
    },
    provider_diagnostics: {
      surface_kind: 'image_provider_diagnostics',
      provider_status: 'runtime_checked',
      blocked_reason: null,
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

function buildSessionDeliveryIdentityPayload(session, { includeProfile = true } = {}) {
  const payload = {
    deliverable_family: session.deliverable_family,
    topic_id: session.topic_id,
    deliverable_id: session.deliverable_id,
  };
  if (includeProfile) {
    payload.profile_id = session.profile_id || null;
  }
  return payload;
}

function productEntrySessionPath(entrySessionId) {
  return productEntrySessionFile(entrySessionId);
}

function buildProductEntrySessionSummary({
  entrySessionId,
  session,
  nativeProofArtifactInventory,
  pptImageRouteSession,
  runtimeLoopClosure,
  familyOrchestration,
}) {
  const latestHandle = session.latest_stage_execution_plan_ref
    || session.latest_run_id
    || null;
  return {
    entry_session_id: entrySessionId,
    deliverable_id: session.deliverable_id,
    latest_handle: latestHandle,
    target_handle: latestHandle,
    native_proof_artifact_ref_count: nativeProofArtifactInventory.summary.artifact_ref_count,
    ppt_deck_default_visual_route: pptImageRouteSession?.default_visual_route || null,
    ppt_deck_default_visual_policy: pptImageRouteSession?.default_visual_policy || null,
    approval_required: Boolean(runtimeLoopClosure?.control_policy?.approval_required),
    gate_status: runtimeLoopClosure?.control_policy?.gate_status || null,
    resume_command: runtimeLoopClosure?.control_policy?.continue_action?.command || null,
    session_locator_field: familyOrchestration?.resume_contract?.session_locator_field || null,
    checkpoint_locator_field: familyOrchestration?.resume_contract?.checkpoint_locator_field || null,
  };
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
      managedRun: null,
      runtimeLoopClosure,
      reviewState,
      publicationProjection,
      deliverableId: session.deliverable_id,
    }),
    product_entry_contract_id: 'managed_product_entry_hardening',
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
