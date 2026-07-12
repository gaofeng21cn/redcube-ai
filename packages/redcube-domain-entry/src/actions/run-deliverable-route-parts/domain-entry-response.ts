import { buildGovernanceSurfaceContract } from '@redcube/overlay-core';
import { getDeliverablePaths } from '@redcube/runtime-protocol';
import path from 'node:path';

import type { RunDeliverableRouteRequest } from '../../types.js';
import type {
  DependencyRouteRun,
  RouteRunDomainEntryResponse,
  RuntimeRouteResult,
} from './shared.js';

import {
  readJsonRecord,
  routeResultArtifactFile,
  safeText,
} from './shared.js';

export function buildRouteRunDomainEntryResponse({
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
}): RouteRunDomainEntryResponse {
  const deliverablePaths = getDeliverablePaths(
    request.workspaceRoot,
    request.topicId,
    request.deliverableId,
  );
  const deliverable = readJsonRecord(deliverablePaths.deliverableFile);
  const contractRef = String(deliverable.hydrated_contract_ref || 'contracts/hydrated-deliverable.json').trim();
  const hydratedContract = readJsonRecord(path.join(deliverablePaths.deliverableDir, contractRef));
  const run = result.run as { current_stage?: unknown; run_id?: unknown; status?: unknown } | undefined;
  const typedBlocker = result.ok !== true && (
    safeText((result as { surface_kind?: unknown }).surface_kind) === 'typed_blocker'
    || safeText((result as { return_shape?: unknown }).return_shape) === 'typed_blocker'
    || safeText(run?.status) === 'typed_blocker'
  );

  return {
    ...result,
    surface_kind: typedBlocker ? 'typed_blocker' : 'route_run',
    ...(typedBlocker ? { return_shape: 'typed_blocker' } : {}),
    recommended_action: result.ok
      ? 'continue'
      : (typedBlocker ? 'submit_route_to_opl_stage_attempt_or_record_domain_owned_typed_blocker' : 'inspect_run_failure'),
    error_kind: result.ok ? null : (typedBlocker ? 'typed_blocker' : 'route_failure'),
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
    artifactFile: routeResultArtifactFile(result) || undefined,
    artifact: result.artifact || null,
    governance_surface: buildGovernanceSurfaceContract(hydratedContract),
  };
}
