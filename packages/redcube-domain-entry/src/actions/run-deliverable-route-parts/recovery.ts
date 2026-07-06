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
const REVISION_ROUTES_REQUIRING_SCREENSHOT_FEEDBACK = new Set([
  'fix_html',
  'repair_pptx_native',
]);
const MAX_REPAIR_CONTINUATION_CYCLES = 3;

function buildRouteRunProviderAttemptIndex(existingIndex: unknown): JsonObject | null {
  const index = existingIndex && typeof existingIndex === 'object' && !Array.isArray(existingIndex)
    ? existingIndex as JsonObject
    : null;
  if (!index) return null;
  return {
    ...index,
    surface_kind: 'cross_provider_attempt_index',
    version: 'cross-provider-attempt-index.v1',
    owner: safeText(index.owner) || safeText(index.runtime_owner),
    provider_attempt_owner: safeText(index.provider_attempt_owner) || safeText(index.providerAttemptOwner),
    domain_adapter_owner: 'redcube_ai',
    provider_attempt_ref: safeText(index.provider_attempt_ref)
      || safeText(index.opl_provider_attempt_ref)
      || safeText(index.providerAttemptRef)
      || safeText(index.oplProviderAttemptRef),
    provider_attempt_ledger_ref: safeText(index.provider_attempt_ledger_ref)
      || safeText(index.opl_provider_attempt_ledger_ref)
      || safeText(index.providerAttemptLedgerRef)
      || safeText(index.oplProviderAttemptLedgerRef),
    stage_attempt_ref: safeText(index.stage_attempt_ref)
      || safeText(index.opl_stage_attempt_ref)
      || safeText(index.stageAttemptRef)
      || safeText(index.oplStageAttemptRef),
    attempt_lease_ref: safeText(index.attempt_lease_ref)
      || safeText(index.lease_ref)
      || safeText(index.provider_attempt_lease_ref)
      || safeText(index.attemptLeaseRef)
      || safeText(index.leaseRef)
      || safeText(index.providerAttemptLeaseRef),
    attempt_receipt_ref: safeText(index.attempt_receipt_ref)
      || safeText(index.closeout_receipt_ref)
      || safeText(index.attemptReceiptRef)
      || safeText(index.closeoutReceiptRef),
    provider_attempt_ref_required: true,
    provider_attempt_ledger_ref_required: true,
    missing_provider_ledger_policy: 'fail_closed_typed_blocker_projection',
    local_session_ref_is_not_provider_attempt_ref: true,
    rca_does_not_own_provider_attempt_ledger: true,
    can_claim_current_without_provider_ledger: false,
  };
}

function routeRequestForProviderAttempt(
  request: RunDeliverableRouteRequest,
  route: string,
  overrides: Partial<RunDeliverableRouteRequest> = {},
): RunDeliverableRouteRequest {
  return {
    ...request,
    ...overrides,
    route,
    crossProviderAttemptIndex: buildRouteRunProviderAttemptIndex(request.crossProviderAttemptIndex) || undefined,
  };
}

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

function continuationRouteCount(route: string, continuationRouteRuns: DependencyRouteRun[]): number {
  return continuationRouteRuns.filter((entry) => entry.route === route).length;
}

function blockedDirectorRepairRouteRequiringScreenshotFeedback(request: RunDeliverableRouteRequest): string | null {
  const artifact = readStageArtifactForRequest(request, 'visual_director_review') as { status?: unknown } | null;
  if (safeText(artifact?.status) !== 'block') return null;
  const repairRoute = artifactRerunFromStage(artifact);
  return REVISION_ROUTES_REQUIRING_SCREENSHOT_FEEDBACK.has(repairRoute) ? repairRoute : null;
}

function canContinueNativePptRepairCycle({
  request,
  nextRoute,
  continuationRouteRuns,
}: {
  request: RunDeliverableRouteRequest;
  nextRoute: string;
  continuationRouteRuns: DependencyRouteRun[];
}): boolean {
  if (nextRoute !== 'repair_pptx_native') return false;
  if (blockedDirectorRepairRouteRequiringScreenshotFeedback(request) !== 'repair_pptx_native') return false;
  return continuationRouteCount(nextRoute, continuationRouteRuns) < MAX_REPAIR_CONTINUATION_CYCLES;
}

function recoverableDependencyRoutes(request: RunDeliverableRouteRequest, result: RuntimeRouteResult): string[] {
  const route = request.route;
  const overlay = safeText(request.overlay);
  const message = routeResultErrorMessage(result);
  if (overlay === 'ppt_deck' && VISUAL_AUTHOR_ALTERNATE_ROUTES.has(route) && /requires completed stage artifacts:/i.test(message)) {
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
  if (currentRoute === 'screenshot_review') {
    const pendingDirectorRepairRoute = blockedDirectorRepairRouteRequiringScreenshotFeedback(request);
    if (pendingDirectorRepairRoute) return pendingDirectorRepairRoute;
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
  if (currentRoute === 'visual_director_review' && blockedDirectorRepairRouteRequiringScreenshotFeedback(request)) {
    return 'screenshot_review';
  }
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

async function runHostedRoute(request: RunDeliverableRouteRequest): Promise<RuntimeRouteResult> {
  return await runHostedDeliverableRoute(
    routeRequestForProviderAttempt(request, request.route),
  ) as RuntimeRouteResult;
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

export async function runRouteWithRecoveryAndContinuation(request: RunDeliverableRouteRequest): Promise<{
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
    }) || canContinueNativePptRepairCycle({ request, nextRoute, continuationRouteRuns });
    if (visited.has(edgeKey) && !canRevisitEdge) {
      return { result: currentResult, continuationRouteRuns };
    }
    visited.add(edgeKey);

    currentResult = await runHostedRoute(routeRequestForProviderAttempt(request, nextRoute, {
      route: nextRoute,
      stopAfterStage: undefined,
    }));
    currentRoute = nextRoute;
    continuationRouteRuns.push(summarizeDependencyRoute(nextRoute, currentResult));
  }

  return { result: currentResult, continuationRouteRuns };
}
