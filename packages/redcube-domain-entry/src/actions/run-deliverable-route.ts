import type { RunDeliverableRouteRequest } from '../types.js';
import type { RouteRunDomainEntryResponse } from './run-deliverable-route-parts/shared.js';

import { runFixHtmlWithAgenticEscalation } from './run-deliverable-route-parts/fix-html-escalation.js';
import { buildRouteRunDomainEntryResponse } from './run-deliverable-route-parts/domain-entry-response.js';
import {
  runRouteWithRecoveryAndContinuation,
} from './run-deliverable-route-parts/recovery.js';
import { safeText } from './run-deliverable-route-parts/shared.js';

export async function runDeliverableRoute(request: RunDeliverableRouteRequest): Promise<RouteRunDomainEntryResponse> {
  if (request.route === 'fix_html') {
    const escalated = await runFixHtmlWithAgenticEscalation(request);
    return buildRouteRunDomainEntryResponse({
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

  const routed = await runRouteWithRecoveryAndContinuation(request);
  return buildRouteRunDomainEntryResponse({
    request,
    result: routed.result,
    dependencyRouteRuns: routed.dependencyRouteRuns,
    continuationRouteRuns: routed.continuationRouteRuns,
    recoveryTerminalReason: routed.recoveryTerminalReason,
    executionProof: null,
  });
}
