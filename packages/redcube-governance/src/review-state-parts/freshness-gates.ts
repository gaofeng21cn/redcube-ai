// @ts-nocheck
import path from 'node:path';
import { existsSync, statSync } from 'node:fs';

import {
  normalizeList,
  safeText,
  uniqueList,
} from './state-io.js';

export function stageArtifactPath(contract, deliverablePaths, stageId) {
  const stage = Array.isArray(contract?.stage_sequence?.stages)
    ? contract.stage_sequence.stages.find((item) => item?.stage_id === stageId)
    : null;
  const artifactName = safeText(stage?.output_artifact, `${stageId}.json`);
  return path.join(deliverablePaths.artifactsDir, artifactName);
}

export function stageSequence(contract) {
  return Array.isArray(contract?.stage_sequence?.stages)
    ? contract.stage_sequence.stages
      .map((stage) => safeText(stage?.stage_id))
      .filter(Boolean)
    : [];
}

export function stageIndex(contract, stageId) {
  const sequence = stageSequence(contract);
  return sequence.indexOf(safeText(stageId));
}

export function safeMtimeMs(file) {
  if (!safeText(file) || !existsSync(file)) {
    return 0;
  }
  try {
    return Number(statSync(file).mtimeMs || 0);
  } catch {
    return 0;
  }
}

export function derivePreExportReviewFreshness({ contract, deliverablePaths, reviewState }) {
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

export function buildQualitySummary(state) {
  const relativeQuality = state?.baseline?.relative_quality || null;
  return {
    relative_quality_verdict: relativeQuality?.verdict || null,
    degradations: Array.isArray(relativeQuality?.degradations) ? relativeQuality.degradations : [],
    improvements: Array.isArray(relativeQuality?.improvements) ? relativeQuality.improvements : [],
    acceptable_changes: Array.isArray(relativeQuality?.acceptable_changes) ? relativeQuality.acceptable_changes : [],
    baseline_promotion_state: state?.baseline?.promotion_state || null,
    promoted_reference_id: state?.baseline?.promoted_reference_id || null,
  };
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
