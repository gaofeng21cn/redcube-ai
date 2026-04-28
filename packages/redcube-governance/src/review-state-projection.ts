// @ts-nocheck
import path from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

import { getDeliverablePaths } from '@redcube/runtime-protocol';
import { buildGovernanceSurface, validatePublicationProjection } from './governance-surface.js';
import {
  defaultState,
  loadSourceReadinessSummary,
  normalizeList,
  normalizeObjectMap,
  safeMtimeMs,
  safeReadJson,
  safeText,
  stageArtifactPath,
  stageIndex,
  stageSequence,
  uniqueList,
  writeState,
  nowIso,
} from './review-state-shared.js';

function derivePreExportReviewFreshness({ contract, deliverablePaths, reviewState }) {
  const requiredExportRoute = safeText(contract?.delivery_contract?.required_export_route);
  if (!requiredExportRoute) {
    return {
      export_artifact_file: null,
      export_artifact_mtime_ms: 0,
      stale: true,
      stale_reasons: ['missing_required_export_route'],
    };
  }

  const exportArtifactFile = stageArtifactPath(contract, deliverablePaths, requiredExportRoute);
  const exportArtifactMtimeMs = safeMtimeMs(exportArtifactFile);
  if (!exportArtifactMtimeMs) {
    return {
      export_artifact_file: exportArtifactFile,
      export_artifact_mtime_ms: 0,
      stale: true,
      stale_reasons: ['missing_export_artifact'],
    };
  }

  const exportRouteIndex = stageIndex(contract, requiredExportRoute);
  const latestReviewStage = safeText(reviewState?.latest_review_stage);
  const latestReviewStageIndex = stageIndex(contract, latestReviewStage);
  const staleReasons = [];

  if (!reviewState?.ready_for_export) {
    staleReasons.push('review_state_not_ready_for_export');
  }
  if (safeText(reviewState?.current_status) === 'blocked_for_revision') {
    staleReasons.push('review_state_blocked_for_revision');
  }
  if (latestReviewStage && latestReviewStageIndex !== -1 && latestReviewStageIndex < exportRouteIndex) {
    staleReasons.push(`latest_review_stage_before_${requiredExportRoute}`);
  }

  let newestUpstreamStage = null;
  let newestUpstreamMtimeMs = 0;
  for (const stageId of stageSequence(contract)) {
    const stageOrder = stageIndex(contract, stageId);
    if (stageOrder === -1 || stageOrder >= exportRouteIndex) continue;
    const artifactMtimeMs = safeMtimeMs(stageArtifactPath(contract, deliverablePaths, stageId));
    if (artifactMtimeMs > newestUpstreamMtimeMs) {
      newestUpstreamMtimeMs = artifactMtimeMs;
      newestUpstreamStage = stageId;
    }
  }
  if (newestUpstreamMtimeMs > exportArtifactMtimeMs) {
    staleReasons.push(`upstream_stage_newer_than_${requiredExportRoute}:${newestUpstreamStage}`);
  }

  return {
    export_artifact_file: exportArtifactFile,
    export_artifact_mtime_ms: exportArtifactMtimeMs,
    newest_upstream_stage: newestUpstreamStage,
    newest_upstream_mtime_ms: newestUpstreamMtimeMs,
    stale: staleReasons.length > 0,
    stale_reasons: staleReasons,
  };
}

function loadDeliveryArtifact({ contract, deliverablePaths }) {
  const route = safeText(contract?.delivery_contract?.required_export_route);
  if (!route) return null;
  return safeReadJson(stageArtifactPath(contract, deliverablePaths, route));
}

function derivePublishNext(current) {
  if (current === 'draft') return 'approval_pending';
  if (current === 'approval_pending') return 'approved_pending_publish';
  if (current === 'approved_pending_publish') return 'published';
  return null;
}

export function buildGateSummary({
  sourceReadinessSummary,
  reviewState,
  contract,
  publicationProjectionEntry,
  operatorHandoff,
}) {
  return {
    source_readiness_status: sourceReadinessSummary?.status || null,
    source_planning_ready: sourceReadinessSummary?.planning_ready === true,
    source_sufficiency_status: safeText(sourceReadinessSummary?.sufficiency_status) || null,
    source_deep_research_state: safeText(sourceReadinessSummary?.deep_research_state) || null,
    source_blocking_evidence_gaps: uniqueList(sourceReadinessSummary?.blocking_evidence_gaps),
    source_next_required_surface: safeText(sourceReadinessSummary?.next_required_surface) || null,
    review_status: safeText(reviewState?.current_status) || null,
    approval_status: safeText(reviewState?.approval_state?.status) || null,
    latest_review_stage: safeText(reviewState?.latest_review_stage) || null,
    export_status: reviewState ? (reviewState.ready_for_export ? 'ready' : 'not_ready') : null,
    required_export_route: safeText(contract?.delivery_contract?.required_export_route) || null,
    required_export_bundle_id: safeText(
      contract?.delivery_contract?.required_export_bundle_id || contract?.export_bundle?.bundle_id,
    ) || null,
    approval_required: Boolean(contract?.delivery_contract?.human_gate?.required),
    delivery_projection_current: safeText(publicationProjectionEntry?.current) || null,
    delivery_projection_next: safeText(publicationProjectionEntry?.next) || null,
    operator_handoff_status: safeText(operatorHandoff?.gate_status) || null,
    delivery_state_owner: safeText(operatorHandoff?.delivery_state_owner) || null,
  };
}

function toDirectDeliveryNext(current) {
  if (current === 'draft') return 'export_ready';
  if (current === 'export_ready') return 'output_ready';
  return null;
}

function buildProjectionState({ reviewState, contract, deliveryArtifact, deliverablePaths }) {
  const deliveryContract = contract?.delivery_contract || null;
  const projectionModel = safeText(deliveryContract?.projection_model);
  const artifactDeliveryState = deliveryArtifact?.export_bundle?.delivery_state || null;
  const exportFreshness = derivePreExportReviewFreshness({ contract, deliverablePaths, reviewState });
  if (projectionModel === 'human_publication') {
    const current = safeText(reviewState?.publish_state?.current, 'draft');
    return {
      current,
      next: derivePublishNext(current),
      delivery_state: exportFreshness.stale ? null : artifactDeliveryState,
    };
  }

  if (!exportFreshness.stale && artifactDeliveryState?.current) {
    return {
      current: safeText(artifactDeliveryState.current),
      next: safeText(artifactDeliveryState.next) || null,
      delivery_state: artifactDeliveryState,
    };
  }

  if (reviewState?.ready_for_export) {
    return {
      current: safeText(deliveryContract?.projection_states?.ready_for_export, 'export_ready'),
      next: safeText(deliveryContract?.projection_states?.output_ready) || null,
      delivery_state: null,
    };
  }

  return {
    current: 'draft',
    next: safeText(deliveryContract?.projection_states?.ready_for_export, toDirectDeliveryNext('draft')) || null,
    delivery_state: null,
  };
}

function buildOperatorHandoffSummary({
  sourceReadinessSummary,
  reviewState,
  contract,
  publicationProjectionEntry,
}) {
  const handoffContract = contract?.delivery_contract?.operator_handoff || null;
  if (!handoffContract) {
    return null;
  }

  const readyState = safeText(
    handoffContract?.handoff_ready_state,
    safeText(contract?.delivery_contract?.projection_states?.output_ready, 'output_ready'),
  );
  const deliveryStateCurrent = safeText(publicationProjectionEntry?.delivery_state?.current);
  const projectionCurrent = safeText(publicationProjectionEntry?.current);
  const blockingReasons = [];

  if (sourceReadinessSummary?.status !== 'pass') {
    const sourceBlocks = uniqueList(sourceReadinessSummary?.blocking_reasons);
    blockingReasons.push(...(sourceBlocks.length > 0 ? sourceBlocks : [`source_readiness_${safeText(sourceReadinessSummary?.status, 'unknown')}`]));
  }

  const reviewBlocks = uniqueList([
    ...(reviewState?.current_status === 'blocked_for_revision' ? reviewState?.blocking_reasons : []),
    ...reviewState?.pending_reviews,
  ]);
  if (reviewBlocks.length > 0) {
    blockingReasons.push(...reviewBlocks);
  }

  if (!reviewState?.ready_for_export) {
    blockingReasons.push('export_not_ready');
  }

  if (deliveryStateCurrent !== readyState && projectionCurrent !== readyState) {
    blockingReasons.push(`handoff_state_not_${readyState}`);
  }

  return {
    handoff_kind: 'direct_delivery_operator',
    gate_status: blockingReasons.length === 0 ? 'ready' : 'blocked',
    blocking_reasons: uniqueList(blockingReasons),
    delivery_state_owner: safeText(handoffContract?.owner_surface) || null,
    required_export_route: safeText(contract?.delivery_contract?.required_export_route) || null,
    required_export_bundle_id: safeText(contract?.delivery_contract?.required_export_bundle_id) || null,
    canonical_export_artifact: publicationProjectionEntry?.canonical_export_artifact || null,
    delivery_state_current: deliveryStateCurrent || null,
    delivery_state_next: safeText(publicationProjectionEntry?.delivery_state?.next) || null,
    reopen_mutation_surface: safeText(handoffContract?.reopen_mutation_surface) || null,
    closeout_mutation_surface: safeText(handoffContract?.closeout_mutation_surface) || null,
    gate_surfaces: Array.isArray(handoffContract?.gate_surfaces)
      ? handoffContract.gate_surfaces.map((surface) => safeText(surface)).filter(Boolean)
      : [],
    handoff_ready_state: readyState,
  };
}

function buildLifecycleStageSummary(contract) {
  const lifecycleStageContract = contract?.lifecycle_stage_contract || null;
  if (!lifecycleStageContract) {
    return null;
  }

  return {
    stage_model: safeText(lifecycleStageContract.stage_model) || null,
    human_workline: normalizeList(lifecycleStageContract.human_workline),
    macro_lifecycle: normalizeList(lifecycleStageContract.macro_lifecycle),
    human_to_macro_stage: normalizeObjectMap(lifecycleStageContract.human_to_macro_stage),
    review_overlay_within: safeText(lifecycleStageContract.review_overlay_within) || null,
    operator_handoff_within: safeText(lifecycleStageContract.operator_handoff_within) || null,
    closeout_within: safeText(lifecycleStageContract.closeout_within) || null,
    route_to_human_stage: normalizeObjectMap(lifecycleStageContract.route_to_human_stage),
  };
}

export function toPublicationProjectionEntry({
  reviewState,
  deliverableId,
  contract,
  deliverablePaths,
  sourceReadinessSummary,
}) {
  const deliveryContract = contract?.delivery_contract || null;
  const deliveryArtifact = loadDeliveryArtifact({ contract, deliverablePaths });
  const projectionState = buildProjectionState({
    reviewState,
    contract,
    deliveryArtifact,
    deliverablePaths,
  });
  const lifecycleStageSummary = buildLifecycleStageSummary(contract);
  const governanceSurface = buildGovernanceSurface(contract);
  const entry = {
    deliverable_id: deliverableId,
    overlay: safeText(contract?.overlay) || null,
    profile_id: safeText(contract?.profile_id) || null,
    projection_model: safeText(deliveryContract?.projection_model) || null,
    current: projectionState.current,
    next: projectionState.next,
    current_status: safeText(reviewState?.current_status, 'idle'),
    ready_for_export: Boolean(reviewState?.ready_for_export),
    approval_status: safeText(reviewState?.approval_state?.status, 'not_required'),
    approval_required: Boolean(deliveryContract?.human_gate?.required),
    latest_review_stage: safeText(reviewState?.latest_review_stage) || null,
    required_export_route: safeText(deliveryContract?.required_export_route) || null,
    required_export_bundle_id: safeText(deliveryContract?.required_export_bundle_id) || null,
    canonical_export_artifact: deliveryContract?.required_export_route
      ? stageArtifactPath(contract, deliverablePaths, deliveryContract.required_export_route)
      : null,
    delivery_state: projectionState.delivery_state,
    governance_surface: governanceSurface,
    source_readiness_summary: sourceReadinessSummary,
    lifecycle_stage_summary: lifecycleStageSummary,
    updated_at: safeText(reviewState?.last_updated_at) || null,
  };
  const operatorHandoff = buildOperatorHandoffSummary({
    sourceReadinessSummary,
    reviewState,
    contract,
    publicationProjectionEntry: entry,
  });
  return {
    ...entry,
    operator_handoff: operatorHandoff,
    gate_summary: buildGateSummary({
      sourceReadinessSummary,
      reviewState,
      contract,
      publicationProjectionEntry: entry,
      operatorHandoff,
    }),
  };
}

function publicationPriority(current) {
  if (current === 'published') return 6;
  if (current === 'approved_pending_publish') return 5;
  if (current === 'approval_pending') return 4;
  if (current === 'output_ready') return 3;
  if (current === 'completed') return 3;
  if (current === 'export_ready') return 2;
  if (current === 'publish_ready') return 2;
  if (current === 'draft') return 1;
  return 0;
}

function sortPublicationEntries(left, right) {
  const priorityDelta = publicationPriority(right?.current) - publicationPriority(left?.current);
  if (priorityDelta !== 0) return priorityDelta;
  return String(right?.updated_at || '').localeCompare(String(left?.updated_at || ''));
}

export function rebuildTopicPublicationProjection({ workspaceRoot, topicId }) {
  const topicDir = path.join(workspaceRoot, 'topics', topicId);
  const deliverablesDir = path.join(topicDir, 'deliverables');
  const projectionFile = path.join(topicDir, 'publication-state.json');
  const entries = {};
  const sourceReadinessSummary = loadSourceReadinessSummary({ workspaceRoot, topicId });

  if (existsSync(deliverablesDir)) {
    for (const item of readdirSync(deliverablesDir, { withFileTypes: true })) {
      if (!item.isDirectory()) continue;
      const deliverableId = item.name;
      const deliverableDir = path.join(deliverablesDir, deliverableId);
      const deliverable = safeReadJson(path.join(deliverableDir, 'deliverable.json'));
      if (!deliverable) continue;
      const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
      const contractRef = safeText(deliverable?.hydrated_contract_ref, 'contracts/hydrated-deliverable.json');
      const contract = safeReadJson(path.join(deliverableDir, contractRef));
      if (!contract) continue;
      const reviewState = safeReadJson(path.join(deliverableDir, 'reports', 'review-state.json'))
        || defaultState({ contract, topicId, deliverableId });
      entries[deliverableId] = toPublicationProjectionEntry({
        reviewState,
        deliverableId,
        contract,
        deliverablePaths,
        sourceReadinessSummary,
      });
    }
  }

  const orderedEntries = Object.values(entries).sort(sortPublicationEntries);
  const topEntry = orderedEntries[0] || null;
  const publication = {
    schema_version: 2,
    projection_kind: 'topic_delivery_projection',
    topic_id: topicId,
    current: topEntry?.current || 'input_ready',
    next: topEntry?.next || null,
    deliverables: entries,
    updated_at: nowIso(),
  };
  validatePublicationProjection(publication);
  writeState(projectionFile, publication);
  return projectionFile;
}
