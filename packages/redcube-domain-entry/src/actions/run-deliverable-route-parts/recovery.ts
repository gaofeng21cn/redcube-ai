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
  artifactRerunFromStage,
  artifactRequestsFixHtml,
  nextLinearStageId,
  readHydratedContractForRequest,
  readStageArtifactForRequest,
  routeSequenceStageIds,
  stageDefinitions,
} from './stage-artifacts.js';

const VISUAL_AUTHOR_ALTERNATE_ROUTES = new Set(['render_html', 'author_pptx_native']);
const VISUAL_REVISION_ROUTES = new Set([
  'fix_html',
  'render_html',
  'repair_image_pages',
  'repair_pptx_native',
]);

function canRevisitContinuationEdgeAfterRepair({
  currentRoute,
  nextRoute,
  currentResult,
  continuationRouteRuns,
}: {
  currentRoute: string;
  nextRoute: string;
  currentResult: RuntimeRouteResult;
  continuationRouteRuns: DependencyRouteRun[];
}): boolean {
  if (currentResult.ok !== true) return false;
  if (currentRoute !== 'visual_director_review' || nextRoute !== 'screenshot_review') return false;
  const lastRoute = continuationRouteRuns.at(-1)?.route || '';
  const previousRoute = lastRoute === currentRoute
    ? continuationRouteRuns.at(-2)?.route || ''
    : lastRoute;
  return VISUAL_REVISION_ROUTES.has(previousRoute);
}

function recoverableDependencyRoutes(request: RunDeliverableRouteRequest, result: RuntimeRouteResult): string[] {
  const route = request.route;
  const message = routeResultErrorMessage(result);
  if (VISUAL_AUTHOR_ALTERNATE_ROUTES.has(route) && /requires completed stage artifacts:/i.test(message)) {
    const requestedMissing = ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction']
      .filter((stageId) => new RegExp(`\\b${stageId}\\b`).test(message));
    if (requestedMissing.length > 0) {
      return ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction']
        .filter((stageId) => !readStageArtifactForRequest(request, stageId));
    }
  }
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
  if (VISUAL_REVISION_ROUTES.has(currentRoute) || VISUAL_AUTHOR_ALTERNATE_ROUTES.has(currentRoute)) {
    return 'visual_director_review';
  }
  const nextStage = nextLinearStageId(contract, currentRoute);
  if (currentRoute === 'screenshot_review' && nextStage && VISUAL_REVISION_ROUTES.has(nextStage)) {
    const reviewArtifact = readStageArtifactForRequest(request, 'screenshot_review');
    if (artifactRerunFromStage(reviewArtifact) !== nextStage) {
      return nextLinearStageId(contract, nextStage);
    }
  }
  return nextStage;
}

function blockedStageRecommendedRepairRoute({
  request,
  currentRoute,
  result,
}: {
  request: RunDeliverableRouteRequest;
  currentRoute: string;
  result: RuntimeRouteResult;
}): string | null {
  if (result.ok === true) return null;
  const artifact = readStageArtifactForRequest(request, currentRoute) as { status?: unknown } | null;
  if (safeText(artifact?.status) !== 'block') return null;
  const repairRoute = artifactRerunFromStage(artifact);
  return VISUAL_REVISION_ROUTES.has(repairRoute) ? repairRoute : null;
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
    const nextRoute = currentResult.ok === true
      ? nextContinuationStageId({
          request,
          contract,
          currentRoute,
        })
      : blockedStageRecommendedRepairRoute({
          request,
          currentRoute,
          result: currentResult,
        });
    if (!nextRoute) {
      return { result: currentResult, continuationRouteRuns };
    }
    const edgeKey = `${currentRoute}->${nextRoute}`;
    const canRevisitEdge = canRevisitContinuationEdgeAfterRepair({
      currentRoute,
      nextRoute,
      currentResult,
      continuationRouteRuns,
    });
    if (visited.has(edgeKey) && !canRevisitEdge) {
      return { result: currentResult, continuationRouteRuns };
    }
    visited.add(edgeKey);

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
