import { readFileSync, writeFileSync } from 'node:fs';

import {
  CODEX_DEFAULT_ADAPTER,
  HERMES_NATIVE_PROOF_ADAPTER,
  appendHermesEvent,
  completeHermesRun,
  failHermesRun,
  readHermesNativeProofContract,
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

function buildCodexRuntimeDescriptor(codexContract) {
  return {
    owner: 'codex_cli',
    adapter_surface: '@redcube/codex-cli-client',
    model_selection: codexContract.model_selection,
    reasoning_selection: codexContract.reasoning_selection,
    sandbox: codexContract.sandbox,
    command: [...codexContract.command],
  };
}

function buildHermesNativeRuntimeDescriptor(hermesContract) {
  return {
    owner: HERMES_NATIVE_PROOF_ADAPTER,
    adapter_surface: '@redcube/hermes-substrate',
    model_selection: hermesContract.model_selection,
    reasoning_selection: hermesContract.reasoning_selection,
    model: hermesContract.model,
    provider: hermesContract.provider,
    base_url: hermesContract.base_url,
    api_mode: hermesContract.api_mode,
    reasoning_effort: hermesContract.reasoning_effort,
    entrypoint: hermesContract.entrypoint,
  };
}

function buildExecutorDescriptor(executor, runtimeDescriptor) {
  if (executor?.adapter === HERMES_NATIVE_PROOF_ADAPTER) {
    return {
      ...(executor || {}),
      hermes_native_runtime: runtimeDescriptor,
    };
  }
  return {
    ...(executor || {}),
    codex_cli_runtime: runtimeDescriptor,
  };
}

function patchArtifactExecutionModel(artifactFile, executor) {
  const artifact = JSON.parse(readFileSync(artifactFile, 'utf-8'));
  artifact.execution_model = {
    ...(artifact.execution_model || {}),
    ...(executor?.codex_cli_runtime
      ? {
          codex_cli_runtime: executor.codex_cli_runtime,
        }
      : {}),
    ...(executor?.hermes_native_runtime
      ? {
          hermes_native_runtime: executor.hermes_native_runtime,
        }
      : {}),
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
  const fallbackExecutor = resolveExecutorAdapter({ adapter });
  const runtimeDescriptor = fallbackExecutor.adapter === HERMES_NATIVE_PROOF_ADAPTER
    ? buildHermesNativeRuntimeDescriptor(readHermesNativeProofContract({ cwd: workspaceRoot }))
    : buildCodexRuntimeDescriptor(readCodexCliContract());
  const executor = buildExecutorDescriptor(
    {
      adapter: fallbackExecutor.adapter,
      primary: fallbackExecutor.primary,
      execution_surface: fallbackExecutor.execution_surface,
      creative_execution: fallbackExecutor.creative_execution,
      execution_model: fallbackExecutor.execution_model,
    },
    runtimeDescriptor,
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
    type: executor.adapter === HERMES_NATIVE_PROOF_ADAPTER
      ? 'hermes_native_route_started'
      : 'codex_route_started',
    route: safeRoute,
    overlay,
    deliverable_id: deliverableId,
    ...(executor.codex_cli_runtime
      ? {
          codex_cli_runtime: executor.codex_cli_runtime,
        }
      : {}),
    ...(executor.hermes_native_runtime
      ? {
          hermes_native_runtime: executor.hermes_native_runtime,
        }
      : {}),
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
    patchArtifactExecutionModel(routeResult.artifact_file, executor);
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
