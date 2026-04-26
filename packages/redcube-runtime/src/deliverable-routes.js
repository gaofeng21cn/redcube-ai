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
import { runCandidateRaceRoute } from './candidate-racing.js';
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

function candidateCountForRoute({ route, candidateCount }) {
  const count = Number(candidateCount || 0);
  if (Number.isInteger(count) && count > 0) return count;
  return route === 'visual_direction' && process.env.REDCUBE_VISUAL_DIRECTION_CANDIDATES
    ? Math.max(1, Number(process.env.REDCUBE_VISUAL_DIRECTION_CANDIDATES) || 1)
    : 1;
}

function compactArray(value) {
  return Array.isArray(value)
    ? Array.from(new Set(value.map((item) => String(item || '').trim()).filter(Boolean))).sort()
    : [];
}

function numberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function generationRuntimeFromArtifact(artifact = {}) {
  return artifact?.creative_execution?.generation_runtime
    || artifact?.review_execution?.generation_runtime
    || artifact?.render_execution?.generation_runtime
    || artifact?.html_bundle?.render_execution?.generation_runtime
    || artifact?.generation_runtime
    || null;
}

function buildRoutePromptTelemetry(routeResult = {}) {
  const artifact = routeResult?.artifact || {};
  const generationRuntime = generationRuntimeFromArtifact(artifact) || {};
  const reviewExecution = artifact?.review_execution || {};
  const renderExecution = artifact?.render_execution || artifact?.html_bundle?.render_execution || {};
  const targetedRerun = artifact?.targeted_rerun || {};
  const slideScope = {
    ...(generationRuntime?.slide_scope || {}),
    target_slide_ids: compactArray([
      ...compactArray(generationRuntime?.slide_scope?.target_slide_ids),
      ...compactArray(generationRuntime?.target_slide_scope?.target_slide_ids),
      ...compactArray(reviewExecution?.target_slide_ids),
      ...compactArray(renderExecution?.targeted_slide_ids),
      ...compactArray(targetedRerun?.target_slide_ids),
    ]),
    reviewed_slide_ids: compactArray([
      ...compactArray(generationRuntime?.slide_scope?.reviewed_slide_ids),
      ...compactArray(reviewExecution?.reviewed_slide_ids),
    ]),
    reused_slide_ids: compactArray([
      ...compactArray(generationRuntime?.slide_scope?.reused_slide_ids),
      ...compactArray(reviewExecution?.reused_slide_ids),
      ...compactArray(renderExecution?.reused_slide_ids),
      ...compactArray(targetedRerun?.reused_slide_ids),
    ]),
  };
  slideScope.slide_ids = compactArray([
    ...compactArray(generationRuntime?.slide_scope?.slide_ids),
    ...slideScope.target_slide_ids,
    ...slideScope.reviewed_slide_ids,
    ...slideScope.reused_slide_ids,
  ]);

  return {
    prompt_pack_file: String(generationRuntime?.prompt_pack_file || artifact?.prompt_pack?.relative_path || '').trim() || null,
    prompt_files: compactArray(generationRuntime?.prompt_files),
    prompt_bytes: numberOrNull(generationRuntime?.prompt_bytes),
    context_bytes: numberOrNull(generationRuntime?.context_bytes),
    prompt_tokens: numberOrNull(generationRuntime?.prompt_tokens),
    completion_tokens: numberOrNull(generationRuntime?.completion_tokens),
    total_tokens: numberOrNull(generationRuntime?.total_tokens),
    estimated_prompt_tokens: numberOrNull(generationRuntime?.estimated_prompt_tokens),
    provider_usage: generationRuntime?.provider_usage || generationRuntime?.usage || null,
    slide_scope: slideScope,
    target_slide_scope: {
      target_slide_ids: slideScope.target_slide_ids,
    },
  };
}

export async function runDeliverableRoute({
  workspaceRoot,
  overlay,
  topicId,
  deliverableId,
  route,
  runId = null,
  managedRunId = null,
  adapter = CODEX_DEFAULT_ADAPTER, userIntent = '',
  mode = 'draft_new',
  baselineDeliverableId = '',
  candidateCount = 1,
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
    const routeCandidateCount = candidateCountForRoute({ route: safeRoute, candidateCount });
    const raced = await runCandidateRaceRoute({
      family: overlay,
      route: safeRoute,
      candidateCount: routeCandidateCount,
      qualityGate: 'structured_contract_validation',
      runCandidate: async () => executeDeliverableRouteLocally({
        workspaceRoot,
        overlay,
        topicId,
        deliverableId,
        route: safeRoute,
        adapter, userIntent,
        mode,
        baselineDeliverableId,
      }),
      scoreCandidate: (candidate) => Number(candidate?.artifact?.visual_direction?.rhythm_curve?.length || 1),
    });
    const routeResult = raced.artifact;
    routeResult.artifact = {
      ...(routeResult.artifact || {}),
      candidate_race: raced.race,
    };
    writeFileSync(routeResult.artifact_file, JSON.stringify(routeResult.artifact, null, 2), 'utf-8');
    routeResult.artifact_refs = Array.from(new Set([
      ...(Array.isArray(routeResult.artifact_refs) ? routeResult.artifact_refs : []),
    ]));
    patchArtifactExecutionModel(routeResult.artifact_file, executor);
    const completedRun = completeHermesRun({
      workspaceRoot,
      runId: run.run_id,
      currentStage: safeRoute,
      stageResults: [{
        stage: safeRoute,
        status: routeResult.cache_status === 'hit' ? 'cached' : 'completed',
      }],
      artifactRefs: routeResult.artifact_refs,
      executor,
      telemetry: buildRoutePromptTelemetry(routeResult),
    });

    appendHermesEvent(workspaceRoot, completedRun.run_id, {
      type: 'run_completed',
      route: safeRoute,
      overlay,
      deliverable_id: deliverableId,
      profile_id: routeResult.artifact?.contract?.profile_id || null,
      artifact_file: routeResult.artifact_file,
      cache_status: routeResult.cache_status || 'miss',
    });

    return {
      ok: true,
      run: completedRun,
      events: readHermesEvents(workspaceRoot, completedRun.run_id),
      artifactFile: routeResult.artifact_file,
      artifact: routeResult.artifact,
      cache_status: routeResult.cache_status || 'miss',
    };
  } catch (error) {
    const failureMessage = String(
      error instanceof Error ? error.message : error,
    ).trim() || 'Codex route execution failed';
    const failure = new Error(failureMessage);
    failure.code = error?.code || null;
    failure.failure_kind = error?.failure_kind || error?.failureKind || null;
    failure.target_slide_ids = Array.isArray(error?.target_slide_ids) ? error.target_slide_ids : [];
    failure.blocking_reasons = Array.isArray(error?.blocking_reasons) ? error.blocking_reasons : [];
    failure.recommended_action = String(error?.recommended_action || '').trim() || null;
    failure.artifact_file = String(error?.artifact_file || '').trim() || null;
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
