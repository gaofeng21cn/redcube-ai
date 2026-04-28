// @ts-nocheck
import path from 'node:path';
import { existsSync } from 'node:fs';

import { getDeliverablePaths } from '@redcube/runtime-protocol';
import { getReviewState } from '@redcube/governance';

import {
  readJson,
  readJsonIfExists,
  safeArray,
  safeText,
} from './managed-run-shared.js';

export function loadRouteReviewRerunPolicy({ workspaceRoot, topicId, deliverableId, stageId }) {
  try {
    const reviewState = getReviewState({ workspaceRoot, topicId, deliverableId }).state || null;
    const rerunPolicy = reviewState?.rerun_policy || null;
    if (safeText(reviewState?.latest_review_stage) !== safeText(stageId)) {
      return null;
    }
    if (safeText(rerunPolicy?.status) !== 'rerun_required') {
      return null;
    }
    const rerunFromStage = safeText(rerunPolicy?.rerun_from_stage);
    if (!rerunFromStage) {
      return null;
    }
    return {
      currentStatus: safeText(reviewState?.current_status),
      rerunFromStage,
      rerunPolicy,
      reviewState,
    };
  } catch {
    return null;
  }
}

export function loadHydratedContract({ workspaceRoot, topicId, deliverableId }) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const deliverable = readJson(deliverablePaths.deliverableFile);
  const contractRef = safeText(
    deliverable?.hydrated_contract_ref,
    'contracts/hydrated-deliverable.json',
  );
  return {
    deliverablePaths,
    deliverable,
    contract: readJson(path.join(deliverablePaths.deliverableDir, contractRef)),
    contractFile: path.join(deliverablePaths.deliverableDir, contractRef),
  };
}

export function assertManagedOverlayMatchesContract({ requestedOverlay, contractOverlay }) {
  if (requestedOverlay !== contractOverlay) {
    throw new Error(`overlay mismatch: expected ${contractOverlay}, got ${requestedOverlay}`);
  }
}

export function assertManagedStopAfterStageDeclared({ stopAfterStage, stages }) {
  if (!stopAfterStage) {
    return;
  }
  if (!safeArray(stages).some((stage) => safeText(stage?.stage_id) === stopAfterStage)) {
    throw new Error(
      `stopAfterStage mismatch: ${stopAfterStage} is not declared by hydrated deliverable contract`,
    );
  }
}

export function stageArtifactPath(contract, deliverablePaths, stageId) {
  const stage = safeArray(contract?.stage_sequence?.stages).find((item) => item?.stage_id === stageId);
  return path.join(
    deliverablePaths.artifactsDir,
    safeText(stage?.output_artifact, `${stageId}.json`),
  );
}

export function shouldSkipAutoToTerminalStage({
  contract,
  deliverablePaths,
  managedRun,
  stageId,
}) {
  if (managedRun?.mode !== 'auto_to_terminal') {
    return false;
  }
  if (stageId !== 'fix_html') {
    return false;
  }
  const reviewStageId = safeText(contract?.review_surface?.artifact_stage, 'screenshot_review');
  const reviewArtifact = readJsonIfExists(
    stageArtifactPath(contract, deliverablePaths, reviewStageId),
  );
  const rerunPolicy = reviewArtifact?.review_state_patch?.rerun_policy || null;
  return !(
    safeText(rerunPolicy?.status) === 'rerun_required'
    && safeText(rerunPolicy?.rerun_from_stage) === stageId
  );
}

export function shouldSkipManagedStage({
  contract,
  deliverablePaths,
  managedRun,
  stageId,
}) {
  if (managedRun?.mode !== 'auto_to_terminal') {
    return false;
  }
  if (stageId !== 'fix_html') {
    return false;
  }
  const reviewStageId = safeText(contract?.review_surface?.artifact_stage, 'screenshot_review');
  if (!reviewStageId) {
    return false;
  }
  const reviewArtifactPath = stageArtifactPath(contract, deliverablePaths, reviewStageId);
  if (!existsSync(reviewArtifactPath)) {
    return false;
  }
  const reviewArtifact = readJson(reviewArtifactPath);
  const rerunPolicy = reviewArtifact?.review_state_patch?.rerun_policy || null;
  return !(
    safeText(rerunPolicy?.status) === 'rerun_required'
    && safeText(rerunPolicy?.rerun_from_stage) === stageId
  );
}
