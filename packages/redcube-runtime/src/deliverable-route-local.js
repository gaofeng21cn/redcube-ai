import path from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { getDeliverablePaths } from '@redcube/runtime-protocol';
import { persistReviewStatePatch } from '@redcube/governance';
import { HERMES_DEFAULT_ADAPTER } from '@redcube/hermes-substrate';

import { resolveExecutorAdapter } from './executors.js';
import { loadSharedSourceTruth } from './shared-source-truth.js';

function requireSafeSegment(name, value) {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  if (/[\\/]/.test(text)) {
    throw new Error(`${name} 不能包含路径分隔符`);
  }
  if (text.includes('..')) {
    throw new Error(`${name} 不能包含父目录引用`);
  }
  return text;
}

function loadHydratedContract(deliverablePaths, storedDeliverable) {
  const contractRef = String(
    storedDeliverable?.hydrated_contract_ref || 'contracts/hydrated-deliverable.json',
  ).trim();
  const contractFile = path.join(deliverablePaths.deliverableDir, contractRef);
  return JSON.parse(readFileSync(contractFile, 'utf-8'));
}

export function validateDeliverableRouteInput({
  workspaceRoot,
  overlay,
  topicId,
  deliverableId,
  route,
}) {
  const safeRoute = requireSafeSegment('route', route);
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const storedDeliverable = JSON.parse(
    readFileSync(deliverablePaths.deliverableFile, 'utf-8'),
  );

  if (storedDeliverable.overlay !== overlay) {
    throw new Error(
      `overlay mismatch: expected ${storedDeliverable.overlay}, got ${overlay}`,
    );
  }

  const baseContract = loadHydratedContract(deliverablePaths, storedDeliverable);
  const contract = {
    ...baseContract,
    shared_source_truth: loadSharedSourceTruth(workspaceRoot, topicId),
  };
  const stageContract = contract.stage_sequence?.stages?.find(
    (stage) => stage?.stage_id === safeRoute,
  ) || null;

  if (!stageContract) {
    throw new Error(`Route ${safeRoute} is not declared by hydrated deliverable contract`);
  }

  return {
    safeRoute,
  };
}

export async function executeDeliverableRouteLocally({
  workspaceRoot,
  overlay,
  topicId,
  deliverableId,
  route,
  adapter = HERMES_DEFAULT_ADAPTER,
  mode = 'draft_new',
  baselineDeliverableId = '',
}) {
  const { safeRoute } = validateDeliverableRouteInput({
    workspaceRoot,
    overlay,
    topicId,
    deliverableId,
    route,
  });
  const executor = resolveExecutorAdapter({ adapter });
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const storedDeliverable = JSON.parse(
    readFileSync(deliverablePaths.deliverableFile, 'utf-8'),
  );
  const baseContract = loadHydratedContract(deliverablePaths, storedDeliverable);
  const contract = {
    ...baseContract,
    shared_source_truth: loadSharedSourceTruth(workspaceRoot, topicId),
  };
  const stageContract = contract.stage_sequence?.stages?.find(
    (stage) => stage?.stage_id === safeRoute,
  ) || null;

  const artifact = await executor.runRoute({
    workspaceRoot,
    overlay,
    route: safeRoute,
    topicId,
    deliverableId,
    contract,
    stageContract,
    deliverablePaths,
    mode,
    baselineDeliverableId,
  });

  mkdirSync(deliverablePaths.artifactsDir, { recursive: true });
  const artifactFile = path.join(
    deliverablePaths.artifactsDir,
    String(stageContract.output_artifact || `${safeRoute}.json`).trim(),
  );
  writeFileSync(artifactFile, JSON.stringify(artifact, null, 2), 'utf-8');

  if (artifact?.review_state_patch) {
    persistReviewStatePatch({
      workspaceRoot,
      topicId,
      deliverableId,
      patch: {
        latest_review_artifact: artifactFile,
        ...artifact.review_state_patch,
      },
    });
  }

  if (artifact?.status === 'block' || artifact?.status === 'failed') {
    throw new Error(
      safeRoute === 'screenshot_review'
        ? `Route ${safeRoute} blocked: ${JSON.stringify(artifact?.checks || artifact?.issues || {})}`
        : `Route ${safeRoute} blocked`,
    );
  }

  return {
    ok: true,
    route: safeRoute,
    overlay,
    topic_id: topicId,
    deliverable_id: deliverableId,
    artifact,
    artifact_file: artifactFile,
    artifact_refs: Array.from(new Set([
      artifactFile,
      ...(Array.isArray(artifact?.artifact_refs) ? artifact.artifact_refs : []),
    ])),
    executor: {
      adapter: executor.adapter,
      primary: executor.primary,
      execution_surface: executor.execution_surface,
      creative_execution: executor.creative_execution,
      external_llm_role: executor.external_llm_role,
      compatibility_role: executor.compatibility_role,
      execution_model: executor.execution_model,
    },
  };
}
