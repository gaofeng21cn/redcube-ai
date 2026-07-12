import type { RunDeliverableRouteRequest } from '../types.js';
import type { RouteRunDomainEntryResponse } from './run-deliverable-route-parts/shared.js';

import { buildRouteRunDomainEntryResponse } from './run-deliverable-route-parts/domain-entry-response.js';
import {
  runRouteWithRecoveryAndContinuation,
} from './run-deliverable-route-parts/recovery.js';
import { safeText } from './run-deliverable-route-parts/shared.js';
import { hydrateResultArtifactFromStage } from './run-deliverable-route-parts/stage-artifacts.js';

export async function runDeliverableRoute(request: RunDeliverableRouteRequest): Promise<RouteRunDomainEntryResponse> {
  const routedRequest = request.route === 'fix_html' && !safeText(request.stopAfterStage)
    ? { ...request, stopAfterStage: 'screenshot_review' }
    : request;
  const routed = await runRouteWithRecoveryAndContinuation(routedRequest);
  let result = routed.result;
  if (request.route === 'fix_html') {
    if (!safeText(request.stopAfterStage)) {
      result = hydrateResultArtifactFromStage(request, result, 'fix_html');
    }
  }
  return buildRouteRunDomainEntryResponse({
    request: routedRequest,
    result,
    dependencyRouteRuns: routed.dependencyRouteRuns,
    continuationRouteRuns: routed.continuationRouteRuns,
    recoveryTerminalReason: routed.recoveryTerminalReason,
  });
}
