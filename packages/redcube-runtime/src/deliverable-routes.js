import { readFileSync, writeFileSync } from 'node:fs';

import {
  CODEX_DEFAULT_ADAPTER,
  appendHermesEvent,
  completeHermesRun,
  failHermesRun,
  readHermesEvents,
  startHermesRun,
} from '@redcube/hermes-substrate';

import { readCodexCliContract } from '@redcube/codex-cli-client';
import { executeDeliverableRouteLocally, validateDeliverableRouteInput } from './deliverable-route-local.js';
import { resolveExecutorAdapter } from './executors.js';

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

function buildExecutorDescriptor(executor, codexContract) {
  return {
    ...(executor || {}),
    codex_cli_runtime: {
      owner: 'codex_cli',
      adapter_surface: '@redcube/codex-cli-client',
      model_selection: codexContract.model_selection,
      reasoning_selection: codexContract.reasoning_selection,
      sandbox: codexContract.sandbox,
      command: [...codexContract.command],
    },
  };
}

function patchArtifactExecutionModel(artifactFile, codexRuntime) {
  const artifact = JSON.parse(readFileSync(artifactFile, 'utf-8'));
  artifact.execution_model = {
    ...(artifact.execution_model || {}),
    codex_cli_runtime: codexRuntime,
  };
  writeFileSync(artifactFile, JSON.stringify(artifact, null, 2), 'utf-8');
}

export async function runDeliverableRoute({
  workspaceRoot,
  overlay,
  topicId,
  deliverableId,
  route,
  runId = null,
  managedRunId = null,
  adapter = CODEX_DEFAULT_ADAPTER,
  mode = 'draft_new',
  baselineDeliverableId = '',
}) {
  const safeRoute = requireSafeSegment('route', route);
  validateDeliverableRouteInput({
    workspaceRoot,
    overlay,
    topicId,
    deliverableId,
    route: safeRoute,
  });
  const codexContract = readCodexCliContract();
  const fallbackExecutor = resolveExecutorAdapter({ adapter });
  const executor = buildExecutorDescriptor(
    {
      adapter: fallbackExecutor.adapter,
      primary: fallbackExecutor.primary,
      execution_surface: fallbackExecutor.execution_surface,
      creative_execution: fallbackExecutor.creative_execution,
      external_llm_role: fallbackExecutor.external_llm_role,
      compatibility_role: fallbackExecutor.compatibility_role,
      execution_model: fallbackExecutor.execution_model,
    },
    codexContract,
  );

  const run = startHermesRun({
    workspaceRoot,
    runId: String(runId || '').trim() || null,
    route: safeRoute,
    overlay,
    target: deliverableId,
    topicId,
    deliverableId,
    managedRunId,
    baselineDeliverableId,
    executor,
  });

  appendHermesEvent(workspaceRoot, run.run_id, {
    type: 'codex_route_started',
    route: safeRoute,
    overlay,
    deliverable_id: deliverableId,
    codex_cli_runtime: executor.codex_cli_runtime,
  });

  try {
    const routeResult = await executeDeliverableRouteLocally({
      workspaceRoot,
      overlay,
      topicId,
      deliverableId,
      route: safeRoute,
      adapter,
      mode,
      baselineDeliverableId,
    });
    patchArtifactExecutionModel(
      routeResult.artifact_file,
      executor.codex_cli_runtime,
    );
    const completedRun = completeHermesRun({
      workspaceRoot,
      runId: run.run_id,
      currentStage: safeRoute,
      stageResults: [{ stage: safeRoute, status: 'completed' }],
      artifactRefs: routeResult.artifact_refs,
      executor,
    });

    appendHermesEvent(workspaceRoot, completedRun.run_id, {
      type: 'run_completed',
      route: safeRoute,
      overlay,
      deliverable_id: deliverableId,
      profile_id: routeResult.artifact?.contract?.profile_id || null,
      artifact_file: routeResult.artifact_file,
    });

    return {
      ok: true,
      run: completedRun,
      events: readHermesEvents(workspaceRoot, completedRun.run_id),
      artifactFile: routeResult.artifact_file,
    };
  } catch (error) {
    const failureMessage = String(
      error instanceof Error ? error.message : error,
    ).trim() || 'Codex route execution failed';
    const failure = new Error(failureMessage);
    failure.code = error?.code || null;
    failure.requiresHumanConfirmation = error?.requiresHumanConfirmation === true;
    failure.requiresExternalSecret = error?.requiresExternalSecret === true;
    const failedRun = failHermesRun({
      workspaceRoot,
      runId: run.run_id,
      currentStage: safeRoute,
      error: failure,
      executor,
    });

    appendHermesEvent(workspaceRoot, failedRun.run_id, {
      type: 'run_failed',
      route: safeRoute,
      overlay,
      deliverable_id: deliverableId,
      error: failedRun.error,
    });

    return {
      ok: false,
      run: failedRun,
      events: readHermesEvents(workspaceRoot, failedRun.run_id),
      error: failedRun.error,
    };
  }
}
