import { readFileSync } from 'node:fs';
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

function readJsonRecord(file: string): JsonObject {
  return JSON.parse(readFileSync(file, 'utf-8')) as JsonObject;
}

export async function runDeliverableRoute(request: RunDeliverableRouteRequest): Promise<RouteRunResponse> {
  const deliverablePaths = getDeliverablePaths(
    request.workspaceRoot,
    request.topicId,
    request.deliverableId,
  );
  const result = await runHostedDeliverableRoute(request) as RuntimeRouteResult;
  const deliverable = readJsonRecord(deliverablePaths.deliverableFile);
  const contractRef = String(deliverable.hydrated_contract_ref || 'contracts/hydrated-deliverable.json').trim();
  const hydratedContract = readJsonRecord(path.join(deliverablePaths.deliverableDir, contractRef));

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
    },
    artifact: result.artifact || null,
    governance_surface: buildGovernanceSurfaceContract(hydratedContract),
  };
}
