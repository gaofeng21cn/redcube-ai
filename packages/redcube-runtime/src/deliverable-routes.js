import path from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { getDeliverablePaths } from '@redcube/runtime-protocol';

import { appendEvent, readEvents } from './event-log.js';
import { resolveExecutorAdapter } from './executors.js';
import { completeRun, failRun, startRun } from './run-store.js';

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

export async function runDeliverableRoute({
  workspaceRoot,
  overlay,
  topicId,
  deliverableId,
  route,
  adapter = 'host_agent',
  mode = 'draft_new',
  baselineDeliverableId = '',
}) {
  const safeRoute = requireSafeSegment('route', route);
  const executor = resolveExecutorAdapter({ adapter });
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const storedDeliverable = JSON.parse(
    readFileSync(deliverablePaths.deliverableFile, 'utf-8'),
  );
  if (storedDeliverable.overlay !== overlay) {
    throw new Error(
      `overlay mismatch: expected ${storedDeliverable.overlay}, got ${overlay}`,
    );
  }
  const contract = loadHydratedContract(deliverablePaths, storedDeliverable);
  const stageContract = contract.stage_sequence?.stages?.find(
    (stage) => stage?.stage_id === safeRoute,
  ) || null;
  if (!stageContract) {
    throw new Error(`Route ${safeRoute} is not declared by hydrated deliverable contract`);
  }

  const run = startRun({
    workspaceRoot,
    route: safeRoute,
    overlay,
    target: deliverableId,
    executor: { adapter: executor.adapter },
  });

  appendEvent(workspaceRoot, run.run_id, {
    type: 'run_started',
    route: safeRoute,
    overlay,
    deliverable_id: deliverableId,
  });

  try {
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

    if (artifact?.status === 'block' || artifact?.status === 'failed') {
      throw new Error(
        safeRoute === 'screenshot_review'
          ? `Route ${safeRoute} blocked: ${JSON.stringify(artifact?.checks || artifact?.issues || {})}`
          : `Route ${safeRoute} blocked`,
      );
    }

    const artifactRefs = Array.from(new Set([
      artifactFile,
      ...(Array.isArray(artifact?.artifact_refs) ? artifact.artifact_refs : []),
    ]));

    const completedRun = completeRun({
      workspaceRoot,
      runId: run.run_id,
      currentStage: safeRoute,
      stageResults: [{ stage: safeRoute, status: 'completed' }],
      artifactRefs,
      executor: { adapter: executor.adapter },
    });

    appendEvent(workspaceRoot, completedRun.run_id, {
      type: 'run_completed',
      route: safeRoute,
      overlay,
      deliverable_id: deliverableId,
      profile_id: contract.profile_id,
      artifact_file: artifactFile,
    });

    return {
      ok: true,
      run: completedRun,
      events: readEvents(workspaceRoot, completedRun.run_id),
      artifactFile,
    };
  } catch (error) {
    const failedRun = failRun({
      workspaceRoot,
      runId: run.run_id,
      currentStage: safeRoute,
      error,
      executor: { adapter: executor.adapter },
    });

    appendEvent(workspaceRoot, failedRun.run_id, {
      type: 'run_failed',
      route: safeRoute,
      overlay,
      deliverable_id: deliverableId,
      profile_id: contract.profile_id,
      error: failedRun.error,
    });

    return {
      ok: false,
      run: failedRun,
      events: readEvents(workspaceRoot, failedRun.run_id),
      error: failedRun.error,
    };
  }
}
