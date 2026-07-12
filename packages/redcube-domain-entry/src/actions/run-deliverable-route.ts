import { runDeliverableRoute as runHostedDeliverableRoute } from '@redcube/runtime';

import type { RunDeliverableRouteRequest } from '../types.js';
import type {
  RouteRunDomainEntryResponse,
  RuntimeRouteResult,
} from './run-deliverable-route-parts/shared.js';

import { buildRouteRunDomainEntryResponse } from './run-deliverable-route-parts/domain-entry-response.js';

export async function runDeliverableRoute(request: RunDeliverableRouteRequest): Promise<RouteRunDomainEntryResponse> {
  const result = await runHostedDeliverableRoute(request) as RuntimeRouteResult;
  return buildRouteRunDomainEntryResponse({
    request,
    result,
  });
}
