// @ts-nocheck
import path from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import {
  CODEX_DEFAULT_ADAPTER,
  HERMES_AGENT_EXECUTOR_BACKEND,
  HERMES_DEFAULT_ADAPTER,
  HERMES_NATIVE_PROOF_ADAPTER,
  appendHermesEvent,
  completeHermesRun,
  failHermesRun,
  readHermesNativeProofContract,
  readHermesEvents,
  startHermesRun,
} from '@redcube/hermes-substrate';

import { readCodexCliContract } from '@redcube/codex-cli-client';
import { resolveExecutorRouting } from '@redcube/redcube-config';
import { getDeliverablePaths } from '@redcube/runtime-protocol';
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

function buildHermesAgentRuntimeDescriptor(env = process.env, executionShape = 'agent_loop', hermesProfile = null) {
  return {
    owner: HERMES_AGENT_EXECUTOR_BACKEND,
    adapter_surface: '@redcube/hermes-substrate',
    api_surface: 'hermes_agent_api_server',
    model_selection: 'hermes_agent_server_runtime',
    reasoning_selection: 'hermes_agent_server_runtime',
    model: String(env.REDCUBE_HERMES_AGENT_API_COMPAT_MODEL || 'redcube-api-compat').trim(),
    base_url: String(env.REDCUBE_HERMES_AGENT_API_BASE_URL || '').trim() || null,
    hermes_profile: String(hermesProfile || '').trim() || null,
    api_mode: executionShape === 'structured_call' ? 'structured_call' : 'agent_loop',
  };
}

function buildExecutorDescriptor(executor, runtimeDescriptor) {
  if (executor?.adapter === HERMES_NATIVE_PROOF_ADAPTER) {
    return {
      ...(executor || {}),
      hermes_native_runtime: runtimeDescriptor,
    };
  }
  if (executor?.adapter === HERMES_DEFAULT_ADAPTER || executor?.adapter === HERMES_AGENT_EXECUTOR_BACKEND) {
    return {
      ...(executor || {}),
      hermes_agent_runtime: runtimeDescriptor,
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
    ...(executor?.hermes_agent_runtime
      ? {
          hermes_agent_runtime: executor.hermes_agent_runtime,
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

function readHydratedContractProfileId({ workspaceRoot, topicId, deliverableId }) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const deliverable = JSON.parse(readFileSync(deliverablePaths.deliverableFile, 'utf-8'));
  const contractRef = String(deliverable.hydrated_contract_ref || 'contracts/hydrated-deliverable.json').trim();
  const hydratedContract = JSON.parse(readFileSync(path.join(deliverablePaths.deliverableDir, contractRef), 'utf-8'));
  return String(hydratedContract.profile_id || deliverable.profile_id || '').trim() || null;
}

function compactArray(value) {
  return Array.isArray(value)
    ? Array.from(new Set(value.map((item) => String(item || '').trim()).filter(Boolean))).sort()
    : [];
}

function numberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function sumNumber(values) {
  const total = values.reduce((sum, value) => (
    typeof value === 'number' && Number.isFinite(value) ? sum + value : sum
  ), 0);
  return total > 0 ? total : null;
}

function normalizeGenerationChildCalls(generationRuntime = {}) {
  return Array.isArray(generationRuntime?.child_calls)
    ? generationRuntime.child_calls.filter((call) => call && typeof call === 'object')
    : [];
}

function runtimeMetric(generationRuntime, childCalls, key) {
  const direct = numberOrNull(generationRuntime?.[key]);
  if (direct != null) return direct;
  return sumNumber(childCalls.map((call) => call?.[key]));
}

function blockedChecksFromArtifact(artifact = {}) {
  return compactArray([
    ...compactArray(artifact?.blocking_reasons),
    ...compactArray(artifact?.review_state_patch?.blocking_reasons),
    ...compactArray(artifact?.review_state_patch?.pending_reviews),
    ...Object.entries(artifact?.checks || {})
      .filter(([, value]) => value === false)
      .map(([key]) => key),
  ]);
}

function isQualityBlockedArtifact(artifact = {}) {
  const rerunPolicy = artifact?.review_state_patch?.rerun_policy || {};
  return String(artifact?.status || '').trim() === 'block'
    || String(rerunPolicy?.status || '').trim() === 'rerun_required';
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
  const childCalls = normalizeGenerationChildCalls(generationRuntime);
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
    prompt_bytes: runtimeMetric(generationRuntime, childCalls, 'prompt_bytes'),
    context_bytes: runtimeMetric(generationRuntime, childCalls, 'context_bytes'),
    prompt_tokens: runtimeMetric(generationRuntime, childCalls, 'prompt_tokens'),
    completion_tokens: runtimeMetric(generationRuntime, childCalls, 'completion_tokens'),
    total_tokens: runtimeMetric(generationRuntime, childCalls, 'total_tokens'),
    estimated_prompt_tokens: runtimeMetric(generationRuntime, childCalls, 'estimated_prompt_tokens'),
    provider_usage: generationRuntime?.provider_usage || generationRuntime?.usage || null,
    cached_tokens: numberOrNull(generationRuntime?.cached_tokens),
    cache_hit: generationRuntime?.cache_hit === true ? true : null,
    child_calls: childCalls,
    review_scope: String(reviewExecution?.review_scope || generationRuntime?.review_scope || '').trim() || null,
    cache_status: routeResult?.cache_status || artifact?.route_cache?.cache_status || artifact?.mechanical_cache?.cache_status || null,
    blocked_checks: blockedChecksFromArtifact(artifact),
    slide_scope: slideScope,
    target_slide_scope: {
      target_slide_ids: slideScope.target_slide_ids,
    },
  };
}

export async function runDeliverableRoute(request) {
  const {
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
  } = request;
  const safeRoute = requireSafeSegment('route', route);
  validateDeliverableRouteInput({
    workspaceRoot,
    overlay,
    topicId,
    deliverableId,
    route: safeRoute,
  });
  const requestHasExplicitAdapter = Object.prototype.hasOwnProperty.call(request, 'adapter')
    && String(request.adapter || '').trim();
  const profileId = readHydratedContractProfileId({ workspaceRoot, topicId, deliverableId });
  const executorRouting = resolveExecutorRouting({
    family: overlay,
    profileId,
    route: safeRoute,
    requestAdapter: requestHasExplicitAdapter ? adapter : null,
    requestExecutorBackend: request.executorBackend || request.executor_backend || null,
    oplDefaultExecutorBackend: request.oplDefaultExecutorBackend || request.opl_default_executor_backend || null,
  });
  const selectedExecutor = executorRouting.selected_executor;
  const fallbackExecutor = resolveExecutorAdapter({
    adapter: selectedExecutor.adapter,
    executorBackend: selectedExecutor.executor_backend,
    executionShape: selectedExecutor.execution_shape,
    hermesProfile: selectedExecutor.hermes_profile,
    executorRouting,
  });
  const runtimeDescriptor = fallbackExecutor.adapter === HERMES_NATIVE_PROOF_ADAPTER
    ? buildHermesNativeRuntimeDescriptor(readHermesNativeProofContract({ cwd: workspaceRoot }))
    : (
        fallbackExecutor.adapter === HERMES_DEFAULT_ADAPTER || fallbackExecutor.adapter === HERMES_AGENT_EXECUTOR_BACKEND
          ? buildHermesAgentRuntimeDescriptor(process.env, selectedExecutor.execution_shape, selectedExecutor.hermes_profile)
          : buildCodexRuntimeDescriptor(readCodexCliContract())
      );
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
      : (
          executor.adapter === HERMES_DEFAULT_ADAPTER || executor.adapter === HERMES_AGENT_EXECUTOR_BACKEND
            ? 'hermes_agent_route_started'
            : 'codex_route_started'
        ),
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
    ...(executor.hermes_agent_runtime
      ? {
          hermes_agent_runtime: executor.hermes_agent_runtime,
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
        adapter: selectedExecutor.adapter,
        executionShape: selectedExecutor.execution_shape,
        hermesProfile: selectedExecutor.hermes_profile,
        executorRouting,
        userIntent,
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
    const routeRunStatus = isQualityBlockedArtifact(routeResult.artifact) ? 'quality_blocked' : 'completed';
    const completedRun = completeHermesRun({
      workspaceRoot,
      runId: run.run_id,
      currentStage: safeRoute,
      stageResults: [{
        stage: safeRoute,
        status: routeResult.cache_status === 'hit' ? 'cached' : routeRunStatus,
      }],
      artifactRefs: routeResult.artifact_refs,
      executor,
      telemetry: buildRoutePromptTelemetry(routeResult),
      status: routeRunStatus,
      errorKind: routeRunStatus === 'quality_blocked' ? 'quality_blocked' : null,
    });

    appendHermesEvent(workspaceRoot, completedRun.run_id, {
      type: routeRunStatus === 'quality_blocked' ? 'run_quality_blocked' : 'run_completed',
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
    const failureKind = String(failure.failure_kind || failure.code || '').trim();
    const qualityBlocked = failureKind === 'quality_blocked' || /^Route .+ blocked/.test(failureMessage);
    if (qualityBlocked) {
      failure.code = failure.code || 'quality_blocked';
      failure.failure_kind = 'quality_blocked';
    }
    const failedArtifact = failure.artifact_file && existsSync(failure.artifact_file)
      ? JSON.parse(readFileSync(failure.artifact_file, 'utf-8'))
      : (error?.artifact || null);
    const failedRun = failHermesRun({
      workspaceRoot,
      runId: run.run_id,
      currentStage: safeRoute,
      error: failure,
      executor,
      errorKind: qualityBlocked ? 'quality_blocked' : 'execution_error',
      status: qualityBlocked ? 'quality_blocked' : 'failed',
      telemetry: failedArtifact
        ? buildRoutePromptTelemetry({
            artifact: failedArtifact,
            cache_status: failedArtifact?.route_cache?.cache_status || 'miss',
          })
        : {},
    });

    appendHermesEvent(workspaceRoot, failedRun.run_id, {
      type: qualityBlocked ? 'run_quality_blocked' : 'run_failed',
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
