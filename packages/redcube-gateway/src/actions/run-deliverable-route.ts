import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { buildGovernanceSurfaceContract } from '@redcube/overlay-core';
import { runDeliverableRoute as runHostedDeliverableRoute } from '@redcube/runtime';
import { getDeliverablePaths } from '@redcube/runtime-protocol';

import type { RouteRunResponse, RunDeliverableRouteRequest } from '../types.js';
import type { JsonObject } from '@redcube/overlay-core';
import type { RuntimeRunRouteResponse } from '@redcube/runtime';

type RuntimeRouteResult = RuntimeRunRouteResponse & {
  artifact?: unknown;
  artifactFile?: string;
  cache_status?: unknown;
};
type DependencyRouteRun = {
  route: string;
  ok: boolean;
  run_id: string | null;
  status: string | null;
};

type FixHtmlEscalationAttempt = {
  attempt_index: number;
  route: 'fix_html';
  executor_backend: 'codex_cli' | 'hermes_agent';
  execution_shape: 'structured_call' | 'agent_loop';
  adapter: string;
  ok: boolean;
  run_id: string | null;
  status: string | null;
  executed_route: string | null;
  review_requires_fix_html: boolean;
  dependency_route_runs: DependencyRouteRun[];
  continuation_route_runs: DependencyRouteRun[];
};

type FixHtmlExecutionProof = {
  proof_kind: 'fix_html_agentic_escalation';
  policy: 'structured_call_then_single_agent_loop_escalation';
  escalation_status: 'not_required' | 'escalated' | 'escalated_still_requires_fix_html' | 'already_agent_loop';
  stop_after_stage: string;
  attempts: FixHtmlEscalationAttempt[];
};

type RouteRunGatewayResponse = Omit<RouteRunResponse, 'run' | 'summary'> & {
  run: RuntimeRunRouteResponse['run'];
  artifact?: unknown;
  dependency_route_runs?: DependencyRouteRun[];
  continuation_route_runs?: DependencyRouteRun[];
  execution_proof?: FixHtmlExecutionProof;
  summary: RouteRunResponse['summary'] & {
    cache_status: string;
    requested_route: string;
    executed_route: string;
    auto_recovered_dependency_routes: string[];
    continued_route_sequence: string[];
    stop_after_stage: string | null;
    recovery_terminal_reason: string | null;
    fix_html_escalation_status: FixHtmlExecutionProof['escalation_status'] | null;
  };
};

const CODEX_STRUCTURED_ADAPTER = 'host_agent';
const HERMES_AGENT_LOOP_ADAPTER = 'hermes_agent';

function readJsonRecord(file: string): JsonObject {
  return JSON.parse(readFileSync(file, 'utf-8')) as JsonObject;
}

function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

function routeResultErrorMessage(result: RuntimeRouteResult): string {
  const error = result.error as { message?: unknown } | undefined;
  const run = result.run as { error?: { message?: unknown } } | undefined;
  return safeText(error?.message || run?.error?.message);
}

function recoverableDependencyRoutes(request: RunDeliverableRouteRequest, result: RuntimeRouteResult): string[] {
  const route = request.route;
  const message = routeResultErrorMessage(result);
  if (route === 'fix_html' && /requires screenshot_review based on the current HTML/i.test(message)) {
    return ['visual_director_review', 'screenshot_review'];
  }
  if (route === 'fix_html' && /requires completed stage artifacts: .*screenshot_review/i.test(message)) {
    return readStageArtifactForRequest(request, 'visual_director_review')
      ? ['screenshot_review']
      : [];
  }
  if (route === 'screenshot_review' && /requires visual_director_review to be rerun after the latest visual changes/i.test(message)) {
    return ['visual_director_review'];
  }
  if (route === 'export_pptx' && /requires screenshot_review to be rerun after the latest visual changes/i.test(message)) {
    return ['visual_director_review', 'screenshot_review'];
  }
  if (route === 'repair_pptx_native' && /requires screenshot_review based on the current native PPTX/i.test(message)) {
    return ['visual_director_review', 'screenshot_review'];
  }
  return [];
}

function summarizeDependencyRoute(route: string, result: RuntimeRouteResult): DependencyRouteRun {
  const run = result.run as { run_id?: unknown; status?: unknown } | undefined;
  return {
    route,
    ok: result.ok === true,
    run_id: safeText(run?.run_id) || null,
    status: safeText(run?.status) || null,
  };
}

function artifactRequestsFixHtml(artifact: unknown): boolean {
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

function readHydratedContractForRequest(request: RunDeliverableRouteRequest): JsonObject {
  const deliverablePaths = getDeliverablePaths(
    request.workspaceRoot,
    request.topicId,
    request.deliverableId,
  );
  const deliverable = readJsonRecord(deliverablePaths.deliverableFile);
  const contractRef = String(deliverable.hydrated_contract_ref || 'contracts/hydrated-deliverable.json').trim();
  return readJsonRecord(path.join(deliverablePaths.deliverableDir, contractRef));
}

function stageDefinitions(contract: JsonObject, includeAlternates = true): unknown[] {
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

function stageArtifactFileForRequest(request: RunDeliverableRouteRequest, stageId: string): string {
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
  const artifactFile = path.join(
    deliverablePaths.artifactsDir,
    safeText(stage?.output_artifact) || `${stageId}.json`,
  );
  return artifactFile;
}

function readStageArtifactForRequest(request: RunDeliverableRouteRequest, stageId: string): JsonObject | null {
  const artifactFile = stageArtifactFileForRequest(request, stageId);
  return existsSync(artifactFile) ? readJsonRecord(artifactFile) : null;
}

function nextLinearStageId(contract: JsonObject, currentRoute: string): string | null {
  const stageIds = routeSequenceStageIds(contract);
  const currentIndex = stageIds.indexOf(currentRoute);
  if (currentIndex < 0) return null;
  return stageIds[currentIndex + 1] || null;
}

function reviewRerunStageAfterFixHtml(contract: JsonObject): string | null {
  const reviewStageId = safeText((contract as { review_surface?: { artifact_stage?: unknown } }).review_surface?.artifact_stage);
  if (!reviewStageId) return null;
  const hardStops = Array.isArray((contract as { stage_sequence?: { hard_stops?: unknown[] } }).stage_sequence?.hard_stops)
    ? (contract as { stage_sequence?: { hard_stops?: unknown[] } }).stage_sequence?.hard_stops || []
    : [];
  const reviewHardStop = hardStops.find(
    (entry) => safeText((entry as { stage_id?: unknown })?.stage_id) === reviewStageId,
  ) as { rerun_from_stage?: unknown } | undefined;
  return safeText(reviewHardStop?.rerun_from_stage, reviewStageId) || null;
}

function nextContinuationStageId({
  request,
  contract,
  currentRoute,
}: {
  request: RunDeliverableRouteRequest;
  contract: JsonObject;
  currentRoute: string;
}): string | null {
  if (currentRoute === 'fix_html') {
    return reviewRerunStageAfterFixHtml(contract) || nextLinearStageId(contract, currentRoute);
  }
  const nextStage = nextLinearStageId(contract, currentRoute);
  if (currentRoute === 'screenshot_review' && nextStage === 'fix_html') {
    const reviewArtifact = readStageArtifactForRequest(request, 'screenshot_review');
    if (!artifactRequestsFixHtml(reviewArtifact)) {
      return nextLinearStageId(contract, 'fix_html');
    }
  }
  return nextStage;
}

function dependencyRouteCanContinue({
  request,
  requestedRoute,
  dependencyRoute,
  result,
}: {
  request: RunDeliverableRouteRequest;
  requestedRoute: string;
  dependencyRoute: string;
  result: RuntimeRouteResult;
}): boolean {
  if (result.ok === true) {
    return true;
  }
  if (requestedRoute !== 'fix_html' || dependencyRoute !== 'screenshot_review') {
    return false;
  }
  if (!/Route screenshot_review blocked:/i.test(routeResultErrorMessage(result))) {
    return false;
  }
  return artifactRequestsFixHtml(readStageArtifactForRequest(request, 'screenshot_review'));
}

async function runHostedRoute(request: RunDeliverableRouteRequest): Promise<RuntimeRouteResult> {
  return await runHostedDeliverableRoute(request) as RuntimeRouteResult;
}

async function runWithRecoverableDependencies(request: RunDeliverableRouteRequest): Promise<{
  result: RuntimeRouteResult;
  dependencyRouteRuns: DependencyRouteRun[];
  recoveryTerminalReason: string | null;
}> {
  const initialResult = await runHostedRoute(request);
  const dependencyRoutes = initialResult.ok === true ? [] : recoverableDependencyRoutes(request, initialResult);
  if (dependencyRoutes.length === 0) {
    return {
      result: initialResult,
      dependencyRouteRuns: [],
      recoveryTerminalReason: null,
    };
  }

  const dependencyRouteRuns: DependencyRouteRun[] = [];
  let latestDependencyResult: RuntimeRouteResult | null = null;
  for (const route of dependencyRoutes) {
    latestDependencyResult = await runHostedRoute({
      ...request,
      route,
    });
    dependencyRouteRuns.push(summarizeDependencyRoute(route, latestDependencyResult));
    if (!dependencyRouteCanContinue({
      request,
      requestedRoute: request.route,
      dependencyRoute: route,
      result: latestDependencyResult,
    })) {
      return {
        result: latestDependencyResult,
        dependencyRouteRuns,
        recoveryTerminalReason: `dependency_route_failed:${route}`,
      };
    }
  }

  if (request.route === 'fix_html'
    && latestDependencyResult
    && !artifactRequestsFixHtml(readStageArtifactForRequest(request, 'screenshot_review'))) {
    return {
      result: latestDependencyResult,
      dependencyRouteRuns,
      recoveryTerminalReason: 'fresh_screenshot_review_did_not_request_fix_html',
    };
  }

  const recoveredResult = await runHostedRoute(request);
  return {
    result: recoveredResult,
    dependencyRouteRuns,
    recoveryTerminalReason: null,
  };
}

async function continueToStopAfterStage({
  request,
  result,
}: {
  request: RunDeliverableRouteRequest;
  result: RuntimeRouteResult;
}): Promise<{
  result: RuntimeRouteResult;
  continuationRouteRuns: DependencyRouteRun[];
}> {
  const stopAfterStage = safeText(request.stopAfterStage);
  if (!stopAfterStage) {
    return { result, continuationRouteRuns: [] };
  }

  const contract = readHydratedContractForRequest(request);
  const stageIds = routeSequenceStageIds(contract);
  const requestedRoute = safeText(request.route);
  if (!stageIds.includes(requestedRoute) || !stageIds.includes(stopAfterStage)) {
    return { result, continuationRouteRuns: [] };
  }

  let currentRoute = requestedRoute;
  let currentResult = result;
  const continuationRouteRuns: DependencyRouteRun[] = [];
  const visited = new Set([currentRoute]);
  const maxContinuationHops = stageIds.length + 2;

  for (let hop = 0; hop < maxContinuationHops; hop += 1) {
    if (currentRoute === stopAfterStage) {
      return { result: currentResult, continuationRouteRuns };
    }
    if (currentResult.ok !== true) {
      return { result: currentResult, continuationRouteRuns };
    }

    const nextRoute = nextContinuationStageId({
      request,
      contract,
      currentRoute,
    });
    if (!nextRoute || visited.has(`${currentRoute}->${nextRoute}`)) {
      return { result: currentResult, continuationRouteRuns };
    }
    visited.add(`${currentRoute}->${nextRoute}`);

    currentResult = await runHostedRoute({
      ...request,
      route: nextRoute,
      stopAfterStage: undefined,
    });
    currentRoute = nextRoute;
    continuationRouteRuns.push(summarizeDependencyRoute(nextRoute, currentResult));
  }

  return { result: currentResult, continuationRouteRuns };
}

function runAdapter(request: RunDeliverableRouteRequest): string {
  return safeText(request.adapter, CODEX_STRUCTURED_ADAPTER);
}

function executorBackendForAdapter(adapter: string): 'codex_cli' | 'hermes_agent' {
  return adapter === HERMES_AGENT_LOOP_ADAPTER || adapter === 'hermes_agent' || adapter === 'hermes'
    ? 'hermes_agent'
    : 'codex_cli';
}

function executionShapeForBackend(executorBackend: 'codex_cli' | 'hermes_agent'): 'structured_call' | 'agent_loop' {
  return executorBackend === 'hermes_agent' ? 'agent_loop' : 'structured_call';
}

function runCurrentStage(result: RuntimeRouteResult): string | null {
  const run = result.run as { current_stage?: unknown } | undefined;
  return safeText(run?.current_stage) || null;
}

function resultOrStoredReviewRequestsFixHtml(request: RunDeliverableRouteRequest, result: RuntimeRouteResult): boolean {
  return artifactRequestsFixHtml(result.artifact)
    || artifactRequestsFixHtml(readStageArtifactForRequest(request, 'screenshot_review'));
}

function summarizeFixHtmlAttempt({
  request,
  result,
  dependencyRouteRuns,
  continuationRouteRuns,
  attemptIndex,
}: {
  request: RunDeliverableRouteRequest;
  result: RuntimeRouteResult;
  dependencyRouteRuns: DependencyRouteRun[];
  continuationRouteRuns: DependencyRouteRun[];
  attemptIndex: number;
}): FixHtmlEscalationAttempt {
  const adapter = runAdapter(request);
  const executorBackend = executorBackendForAdapter(adapter);
  const run = result.run as { run_id?: unknown; status?: unknown } | undefined;
  return {
    attempt_index: attemptIndex,
    route: 'fix_html',
    executor_backend: executorBackend,
    execution_shape: executionShapeForBackend(executorBackend),
    adapter,
    ok: result.ok === true,
    run_id: safeText(run?.run_id) || null,
    status: safeText(run?.status) || null,
    executed_route: runCurrentStage(result),
    review_requires_fix_html: resultOrStoredReviewRequestsFixHtml(request, result),
    dependency_route_runs: dependencyRouteRuns,
    continuation_route_runs: continuationRouteRuns,
  };
}

function hydrateResultArtifactFromStage(request: RunDeliverableRouteRequest, result: RuntimeRouteResult): RuntimeRouteResult {
  if (result.artifact && result.artifactFile) return result;
  const stageId = runCurrentStage(result) || safeText(request.stopAfterStage) || safeText(request.route);
  if (!stageId) return result;
  const artifactFile = stageArtifactFileForRequest(request, stageId);
  if (!existsSync(artifactFile)) return result;
  return {
    ...result,
    artifactFile,
    artifact: readJsonRecord(artifactFile),
  };
}

function persistFixHtmlExecutionProof({
  request,
  result,
  proof,
}: {
  request: RunDeliverableRouteRequest;
  result: RuntimeRouteResult;
  proof: FixHtmlExecutionProof;
}): RuntimeRouteResult {
  const hydrated = hydrateResultArtifactFromStage(request, result);
  const artifact = hydrated.artifact && typeof hydrated.artifact === 'object' && !Array.isArray(hydrated.artifact)
    ? {
        ...(hydrated.artifact as JsonObject),
        execution_proof: proof as unknown as JsonObject,
      }
    : { execution_proof: proof as unknown as JsonObject };
  if (hydrated.artifactFile) {
    writeFileSync(hydrated.artifactFile, JSON.stringify(artifact, null, 2), 'utf-8');
  }
  return {
    ...hydrated,
    artifact,
  };
}

async function runFixHtmlAttempt(request: RunDeliverableRouteRequest): Promise<{
  result: RuntimeRouteResult;
  dependencyRouteRuns: DependencyRouteRun[];
  continuationRouteRuns: DependencyRouteRun[];
  recoveryTerminalReason: string | null;
}> {
  const routed = await runWithRecoverableDependencies(request);
  const continued = await continueToStopAfterStage({
    request,
    result: routed.result,
  });
  return {
    result: continued.result,
    dependencyRouteRuns: routed.dependencyRouteRuns,
    continuationRouteRuns: continued.continuationRouteRuns,
    recoveryTerminalReason: routed.recoveryTerminalReason,
  };
}

async function runFixHtmlWithAgenticEscalation(request: RunDeliverableRouteRequest): Promise<{
  result: RuntimeRouteResult;
  dependencyRouteRuns: DependencyRouteRun[];
  continuationRouteRuns: DependencyRouteRun[];
  recoveryTerminalReason: string | null;
  executionProof: FixHtmlExecutionProof;
}> {
  const stopAfterStage = safeText(request.stopAfterStage, 'screenshot_review');
  const initialAdapter = runAdapter(request);
  const firstRequest = {
    ...request,
    adapter: initialAdapter,
    stopAfterStage,
  };
  const first = await runFixHtmlAttempt(firstRequest);
  const attempts = [
    summarizeFixHtmlAttempt({
      request: firstRequest,
      result: first.result,
      dependencyRouteRuns: first.dependencyRouteRuns,
      continuationRouteRuns: first.continuationRouteRuns,
      attemptIndex: 1,
    }),
  ];

  let result = first.result;
  let dependencyRouteRuns = first.dependencyRouteRuns;
  let continuationRouteRuns = first.continuationRouteRuns;
  let recoveryTerminalReason = first.recoveryTerminalReason;
  let escalationStatus: FixHtmlExecutionProof['escalation_status'] = 'not_required';
  const shouldEscalate = resultOrStoredReviewRequestsFixHtml(firstRequest, first.result);

  if (shouldEscalate && executorBackendForAdapter(initialAdapter) !== 'hermes_agent') {
    const escalationRequest = {
      ...firstRequest,
      adapter: HERMES_AGENT_LOOP_ADAPTER,
    };
    const escalated = await runFixHtmlAttempt(escalationRequest);
    const secondAttempt = summarizeFixHtmlAttempt({
      request: escalationRequest,
      result: escalated.result,
      dependencyRouteRuns: escalated.dependencyRouteRuns,
      continuationRouteRuns: escalated.continuationRouteRuns,
      attemptIndex: 2,
    });
    attempts.push(secondAttempt);
    result = escalated.result;
    dependencyRouteRuns = [...dependencyRouteRuns, ...escalated.dependencyRouteRuns];
    continuationRouteRuns = [...continuationRouteRuns, ...escalated.continuationRouteRuns];
    recoveryTerminalReason = escalated.recoveryTerminalReason;
    escalationStatus = secondAttempt.review_requires_fix_html
      ? 'escalated_still_requires_fix_html'
      : 'escalated';
  } else if (shouldEscalate) {
    escalationStatus = 'already_agent_loop';
  }

  const executionProof: FixHtmlExecutionProof = {
    proof_kind: 'fix_html_agentic_escalation',
    policy: 'structured_call_then_single_agent_loop_escalation',
    escalation_status: escalationStatus,
    stop_after_stage: stopAfterStage,
    attempts,
  };
  return {
    result: persistFixHtmlExecutionProof({
      request: { ...request, stopAfterStage },
      result,
      proof: executionProof,
    }),
    dependencyRouteRuns,
    continuationRouteRuns,
    recoveryTerminalReason,
    executionProof,
  };
}

function buildRouteRunGatewayResponse({
  request,
  result,
  dependencyRouteRuns,
  continuationRouteRuns,
  recoveryTerminalReason,
  executionProof = null,
}: {
  request: RunDeliverableRouteRequest;
  result: RuntimeRouteResult;
  dependencyRouteRuns: DependencyRouteRun[];
  continuationRouteRuns: DependencyRouteRun[];
  recoveryTerminalReason: string | null;
  executionProof?: FixHtmlExecutionProof | null;
}): RouteRunGatewayResponse {
  const deliverablePaths = getDeliverablePaths(
    request.workspaceRoot,
    request.topicId,
    request.deliverableId,
  );
  const deliverable = readJsonRecord(deliverablePaths.deliverableFile);
  const contractRef = String(deliverable.hydrated_contract_ref || 'contracts/hydrated-deliverable.json').trim();
  const hydratedContract = readJsonRecord(path.join(deliverablePaths.deliverableDir, contractRef));
  const run = result.run as { current_stage?: unknown; run_id?: unknown; status?: unknown } | undefined;

  return {
    ...result,
    surface_kind: 'route_run',
    recommended_action: result.ok ? 'continue' : 'inspect_run_failure',
    error_kind: result.ok ? null : 'route_failure',
    summary: {
      route: request.route,
      run_id: result.run?.run_id || null,
      status: result.run?.status || null,
      cache_status: typeof result.cache_status === 'string' ? result.cache_status : 'miss',
      requested_route: request.route,
      executed_route: safeText(run?.current_stage) || request.route,
      auto_recovered_dependency_routes: dependencyRouteRuns.map((entry) => entry.route),
      continued_route_sequence: continuationRouteRuns.map((entry) => entry.route),
      stop_after_stage: safeText(request.stopAfterStage) || null,
      recovery_terminal_reason: recoveryTerminalReason,
      fix_html_escalation_status: executionProof?.escalation_status || null,
    },
    dependency_route_runs: dependencyRouteRuns,
    continuation_route_runs: continuationRouteRuns,
    ...(executionProof ? { execution_proof: executionProof } : {}),
    artifact: result.artifact || null,
    governance_surface: buildGovernanceSurfaceContract(hydratedContract),
  };
}

export async function runDeliverableRoute(request: RunDeliverableRouteRequest): Promise<RouteRunGatewayResponse> {
  if (request.route === 'fix_html') {
    const escalated = await runFixHtmlWithAgenticEscalation(request);
    return buildRouteRunGatewayResponse({
      request: {
        ...request,
        stopAfterStage: safeText(request.stopAfterStage, escalated.executionProof.stop_after_stage),
      },
      result: escalated.result,
      dependencyRouteRuns: escalated.dependencyRouteRuns,
      continuationRouteRuns: escalated.continuationRouteRuns,
      recoveryTerminalReason: escalated.recoveryTerminalReason,
      executionProof: escalated.executionProof,
    });
  }
  const routed = await runWithRecoverableDependencies(request);
  const continued = await continueToStopAfterStage({
    request,
    result: routed.result,
  });
  return buildRouteRunGatewayResponse({
    request,
    result: continued.result,
    dependencyRouteRuns: routed.dependencyRouteRuns,
    continuationRouteRuns: continued.continuationRouteRuns,
    recoveryTerminalReason: routed.recoveryTerminalReason,
    executionProof: null,
  });
}
