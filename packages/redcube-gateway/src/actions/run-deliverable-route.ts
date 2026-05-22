import type { RunDeliverableRouteRequest } from '../types.js';
import type { RouteRunGatewayResponse } from './run-deliverable-route-parts/shared.js';

import { runFixHtmlWithAgenticEscalation } from './run-deliverable-route-parts/fix-html-escalation.js';
import { buildRouteRunGatewayResponse } from './run-deliverable-route-parts/gateway-response.js';
import {
  continueToStopAfterStage,
  runWithRecoverableDependencies,
} from './run-deliverable-route-parts/recovery.js';
import { safeText } from './run-deliverable-route-parts/shared.js';

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
