import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { buildGovernanceSurfaceContract } from '@redcube/overlay-core';
import { runDeliverableRoute as runHostedDeliverableRoute } from '@redcube/runtime';
import { getDeliverablePaths } from '@redcube/runtime-protocol';

import type { RouteRunResponse, RunDeliverableRouteRequest } from '../types.js';
import type { JsonObject } from '@redcube/overlay-core';
import type { RuntimeRunRouteResponse } from '@redcube/runtime';

type RuntimeRouteResult = RuntimeRunRouteResponse & {
  artifact?: unknown;
  cache_status?: unknown;
};
type DependencyRouteRun = {
  route: string;
  ok: boolean;
  run_id: string | null;
  status: string | null;
};

type RouteRunGatewayResponse = Omit<RouteRunResponse, 'run' | 'summary'> & {
  run: RuntimeRunRouteResponse['run'];
  artifact?: unknown;
  dependency_route_runs?: DependencyRouteRun[];
  continuation_route_runs?: DependencyRouteRun[];
  summary: RouteRunResponse['summary'] & {
    cache_status: string;
    requested_route: string;
    executed_route: string;
    auto_recovered_dependency_routes: string[];
    continued_route_sequence: string[];
    stop_after_stage: string | null;
    recovery_terminal_reason: string | null;
  };
};

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

function recoverableDependencyRoutes(route: string, result: RuntimeRouteResult): string[] {
  const message = routeResultErrorMessage(result);
  if (route === 'fix_html' && /requires screenshot_review based on the current HTML/i.test(message)) {
    return ['visual_director_review', 'screenshot_review'];
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

function readStageArtifactForRequest(request: RunDeliverableRouteRequest, stageId: string): JsonObject | null {
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
  const dependencyRoutes = initialResult.ok === true ? [] : recoverableDependencyRoutes(request.route, initialResult);
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

function buildRouteRunGatewayResponse({
  request,
  result,
  dependencyRouteRuns,
  continuationRouteRuns,
  recoveryTerminalReason,
}: {
  request: RunDeliverableRouteRequest;
  result: RuntimeRouteResult;
  dependencyRouteRuns: DependencyRouteRun[];
  continuationRouteRuns: DependencyRouteRun[];
  recoveryTerminalReason: string | null;
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
    },
    dependency_route_runs: dependencyRouteRuns,
    continuation_route_runs: continuationRouteRuns,
    artifact: result.artifact || null,
    governance_surface: buildGovernanceSurfaceContract(hydratedContract),
  };
}

export async function runDeliverableRoute(request: RunDeliverableRouteRequest): Promise<RouteRunGatewayResponse> {
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
  });
}
