import { existsSync } from 'node:fs';
import path from 'node:path';

import {
  canonicalStageForRoute,
  getDeliverablePaths,
  readStageFolderArtifact,
  stageFolderArtifactPath,
  stageOrderForCanonicalStage,
} from '@redcube/runtime-protocol';

import type { JsonObject } from '@redcube/overlay-core';
import type { RunDeliverableRouteRequest } from '../../types.js';
import type { RuntimeRouteResult } from './shared.js';

import {
  readJsonRecord,
  runCurrentStage,
  safeText,
} from './shared.js';

export function artifactRequestsFixHtml(artifact: unknown): boolean {
  const record = artifact as {
    status?: unknown;
    review_state_patch?: {
      rerun_from_stage?: unknown;
      rerun_policy?: {
        status?: unknown;
        rerun_from_stage?: unknown;
      };
    };
  } | undefined;
  const rerunPolicy = record?.review_state_patch?.rerun_policy;
  return safeText(record?.status) === 'block'
    && (
      safeText(record?.review_state_patch?.rerun_from_stage) === 'fix_html'
      || (
        safeText(rerunPolicy?.status) === 'rerun_required'
        && safeText(rerunPolicy?.rerun_from_stage) === 'fix_html'
      )
    );
}

export function artifactRerunFromStage(artifact: unknown): string {
  const record = artifact as {
    review_state_patch?: {
      rerun_from_stage?: unknown;
      rerun_policy?: {
        status?: unknown;
        rerun_from_stage?: unknown;
      };
    };
  } | undefined;
  const rerunPolicy = record?.review_state_patch?.rerun_policy;
  return safeText(record?.review_state_patch?.rerun_from_stage)
    || (
      safeText(rerunPolicy?.status) === 'rerun_required'
        ? safeText(rerunPolicy?.rerun_from_stage)
        : ''
    );
}

export function readHydratedContractForRequest(request: RunDeliverableRouteRequest): JsonObject {
  const deliverablePaths = getDeliverablePaths(
    request.workspaceRoot,
    request.topicId,
    request.deliverableId,
  );
  const deliverable = readJsonRecord(deliverablePaths.deliverableFile);
  const contractRef = String(deliverable.hydrated_contract_ref || 'contracts/hydrated-deliverable.json').trim();
  return readJsonRecord(path.join(deliverablePaths.deliverableDir, contractRef));
}

export function stageDefinitions(contract: JsonObject, includeAlternates = true): unknown[] {
  const stages = [
    ...(Array.isArray((contract as { stage_sequence?: { stages?: unknown[] } }).stage_sequence?.stages)
      ? (contract as { stage_sequence?: { stages?: unknown[] } }).stage_sequence?.stages || []
      : []),
  ];
  if (includeAlternates) {
    stages.push(
      ...(Array.isArray((contract as { stage_sequence?: { alternate_stages?: unknown[] } }).stage_sequence?.alternate_stages)
        ? (contract as { stage_sequence?: { alternate_stages?: unknown[] } }).stage_sequence?.alternate_stages || []
        : []),
    );
  }
  return stages;
}

function routeSequenceStageIds(contract: JsonObject): string[] {
  return stageDefinitions(contract, false)
    .map((stage) => safeText((stage as { stage_id?: unknown })?.stage_id))
    .filter(Boolean);
}

export function stageArtifactFileForRequest(request: RunDeliverableRouteRequest, stageId: string): string {
  const deliverablePaths = getDeliverablePaths(
    request.workspaceRoot,
    request.topicId,
    request.deliverableId,
  );
  const hydratedContract = readHydratedContractForRequest(request);
  const stages = stageDefinitions(hydratedContract, true);
  const stage = stages.find((item) => safeText((item as { stage_id?: unknown })?.stage_id) === stageId) as {
    output_artifact?: unknown;
  } | undefined;
  const canonicalStageId = canonicalStageForRoute(stageId);
  return stageFolderArtifactPath({
    deliverablePaths,
    domainId: 'redcube_ai',
    programId: deliverablePaths.programId,
    topicId: request.topicId,
    deliverableId: request.deliverableId,
    routeStageId: stageId,
    canonicalStageId,
    stageOrder: stageOrderForCanonicalStage(canonicalStageId),
    outputName: safeText(stage?.output_artifact) || `${stageId}.json`,
  });
}

export function readStageArtifactForRequest(request: RunDeliverableRouteRequest, stageId: string): JsonObject | null {
  const deliverablePaths = getDeliverablePaths(
    request.workspaceRoot,
    request.topicId,
    request.deliverableId,
  );
  const loaded = readStageFolderArtifact({
    deliverablePaths,
    routeStageId: stageId,
    canonicalStageId: canonicalStageForRoute(stageId),
  });
  return loaded?.status === 'success' || loaded?.status === 'blocked'
    ? loaded.artifact as JsonObject
    : null;
}

export function nextLinearStageId(contract: JsonObject, currentRoute: string): string | null {
  const stageIds = routeSequenceStageIds(contract);
  const currentIndex = stageIds.indexOf(currentRoute);
  if (currentIndex < 0) return null;
  return stageIds[currentIndex + 1] || null;
}

export function hydrateResultArtifactFromStage(
  request: RunDeliverableRouteRequest,
  result: RuntimeRouteResult,
  preferredStageId: string | null = null,
): RuntimeRouteResult {
  const preferred = safeText(preferredStageId);
  if (!preferred && result.artifact && result.artifactFile) return result;
  const stageId = preferred || runCurrentStage(result) || safeText(request.stopAfterStage) || safeText(request.route);
  if (!stageId) return result;
  const artifactFile = stageArtifactFileForRequest(request, stageId);
  if (!existsSync(artifactFile)) return result;
  return {
    ...result,
    artifactFile,
    artifact: readJsonRecord(artifactFile),
  };
}
