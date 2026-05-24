import { runDeliverableRoute as runHostedDeliverableRoute } from '@redcube/runtime';

import type { JsonObject } from '@redcube/overlay-core';
import type { RunDeliverableRouteRequest } from '../../types.js';
import type {
  DependencyRouteRun,
  RuntimeRouteResult,
} from './shared.js';

import {
  routeResultErrorMessage,
  safeText,
  summarizeDependencyRoute,
} from './shared.js';
import {
  artifactRequestsFixHtml,
  nextLinearStageId,
  readHydratedContractForRequest,
  readStageArtifactForRequest,
  routeSequenceStageIds,
  stageDefinitions,
} from './stage-artifacts.js';

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
    return 'visual_director_review';
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

export async function runHostedRoute(request: RunDeliverableRouteRequest): Promise<RuntimeRouteResult> {
  return await runHostedDeliverableRoute(request) as RuntimeRouteResult;
}

export async function runWithRecoverableDependencies(request: RunDeliverableRouteRequest): Promise<{
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

export async function continueToStopAfterStage({
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
  const declaredStageIds = stageDefinitions(contract, true)
    .map((stage) => safeText((stage as { stage_id?: unknown })?.stage_id))
    .filter(Boolean);
  const requestedRoute = safeText(request.route);
  if (!declaredStageIds.includes(requestedRoute) || !declaredStageIds.includes(stopAfterStage)) {
    return { result, continuationRouteRuns: [] };
  }

  let currentRoute = requestedRoute;
  let currentResult = result;
  const continuationRouteRuns: DependencyRouteRun[] = [];
  const visited = new Set([currentRoute]);
  const maxContinuationHops = declaredStageIds.length + 2;

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
