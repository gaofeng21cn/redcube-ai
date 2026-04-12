import { readFileSync, writeFileSync } from 'node:fs';

import {
  appendHermesEvent,
  completeHermesRun,
  failHermesRun,
  readHermesEvents,
  startHermesRun,
} from '@redcube/hermes-substrate';

import { HERMES_DEFAULT_ADAPTER } from '@redcube/hermes-substrate';
import { resolveExecutorAdapter } from './executors.js';
import { validateDeliverableRouteInput } from './deliverable-route-local.js';
import { executeServiceEntryViaUpstreamHermes } from './upstream-hermes-bridge.js';

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

function buildExecutorDescriptor(executor, upstreamRun, probe) {
  return {
    ...(executor || {}),
    upstream_runtime: {
      owner: 'upstream_hermes_agent',
      adapter_surface: '@redcube/hermes-agent-client',
      run_id: upstreamRun.run_id,
      session_id: upstreamRun.session_id,
      base_url: probe?.config?.base_url || probe?.steps?.health?.url?.replace(/\/v1\/health$/, '') || null,
      model_name: probe?.config?.model_name || null,
    },
  };
}

function patchArtifactExecutionModel(artifactFile, upstreamRuntime) {
  const artifact = JSON.parse(readFileSync(artifactFile, 'utf-8'));
  artifact.execution_model = {
    ...(artifact.execution_model || {}),
    upstream_runtime: upstreamRuntime,
  };
  writeFileSync(artifactFile, JSON.stringify(artifact, null, 2), 'utf-8');
}

function mirrorUpstreamEvents({ workspaceRoot, runId, route, overlay, deliverableId, upstreamEvents }) {
  for (const event of upstreamEvents) {
    appendHermesEvent(workspaceRoot, runId, {
      type: `upstream_${String(event?.event || 'unknown').replace(/\./g, '_')}`,
      upstream_event: event?.event || null,
      route,
      overlay,
      deliverable_id: deliverableId,
      payload: event,
    });
  }
}

export async function runDeliverableRoute({
  workspaceRoot,
  overlay,
  topicId,
  deliverableId,
  route,
  runId = null,
  managedRunId = null,
  adapter = HERMES_DEFAULT_ADAPTER,
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
  const upstreamExecution = await executeServiceEntryViaUpstreamHermes({
    workspaceRoot,
    entryKind: 'run_deliverable_route',
    request: {
      workspaceRoot,
      overlay,
      topicId,
      deliverableId,
      route: safeRoute,
      adapter,
      mode,
      baselineDeliverableId,
    },
  });
  const fallbackExecutor = resolveExecutorAdapter({ adapter });
  const executor = buildExecutorDescriptor(
    upstreamExecution.response?.result?.executor || {
      adapter: fallbackExecutor.adapter,
      primary: fallbackExecutor.primary,
      execution_surface: fallbackExecutor.execution_surface,
      creative_execution: fallbackExecutor.creative_execution,
      external_llm_role: fallbackExecutor.external_llm_role,
      compatibility_role: fallbackExecutor.compatibility_role,
      execution_model: fallbackExecutor.execution_model,
    },
    upstreamExecution.upstream_run,
    upstreamExecution.probe,
  );

  const run = startHermesRun({
    workspaceRoot,
    runId: String(runId || upstreamExecution.upstream_run.run_id).trim() || upstreamExecution.upstream_run.run_id,
    route: safeRoute,
    overlay,
    target: deliverableId,
    topicId,
    deliverableId,
    managedRunId,
    baselineDeliverableId,
    executor,
  });

  mirrorUpstreamEvents({
    workspaceRoot,
    runId: run.run_id,
    route: safeRoute,
    overlay,
    deliverableId,
    upstreamEvents: upstreamExecution.upstream_run.events,
  });

  const routeResult = upstreamExecution.response?.result || null;
  const success = upstreamExecution.upstream_run.terminal_event === 'run.completed'
    && upstreamExecution.response?.ok === true
    && routeResult;

  if (success) {
    patchArtifactExecutionModel(
      routeResult.artifact_file,
      executor.upstream_runtime,
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
  }

  const failureMessage = String(
    upstreamExecution.response?.error?.message
    || upstreamExecution.upstream_run.error
    || 'upstream Hermes-Agent route execution failed',
  ).trim();
  const failure = new Error(failureMessage);
  failure.code = upstreamExecution.response?.error?.code || null;
  failure.requiresHumanConfirmation = upstreamExecution.response?.error?.requires_human_confirmation === true;
  failure.requiresExternalSecret = upstreamExecution.response?.error?.requires_external_secret === true;
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
    profile_id: routeResult?.artifact?.contract?.profile_id || null,
    error: failedRun.error,
  });

  return {
    ok: false,
    run: failedRun,
    events: readHermesEvents(workspaceRoot, failedRun.run_id),
    error: failedRun.error,
  };
}
