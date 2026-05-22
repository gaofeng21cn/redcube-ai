import { buildGovernanceSurfaceContract } from '@redcube/overlay-core';
import { getDeliverablePaths } from '@redcube/runtime-protocol';
import path from 'node:path';

import type { RunDeliverableRouteRequest } from '../../types.js';
import type {
  DependencyRouteRun,
  FixHtmlExecutionProof,
  RouteRunGatewayResponse,
  RuntimeRouteResult,
} from './shared.js';

import {
  readJsonRecord,
  safeText,
} from './shared.js';

export function buildRouteRunGatewayResponse({
  request,
  result,
  dependencyRouteRuns,
  continuationRouteRuns,
  recoveryTerminalReason,
  executionProof = null,
}: {
  request: RunDeliverableRouteRequest;
  result: RuntimeRouteResult;
  dependencyRouteRuns: DependencyRouteRun[];
  continuationRouteRuns: DependencyRouteRun[];
  recoveryTerminalReason: string | null;
  executionProof?: FixHtmlExecutionProof | null;
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
  const qualityBlocked = result.ok !== true && safeText(run?.status) === 'quality_blocked';

  return {
    ...result,
    surface_kind: 'route_run',
    recommended_action: result.ok ? 'continue' : (qualityBlocked ? 'run_recommended_repair' : 'inspect_run_failure'),
    error_kind: result.ok ? null : (qualityBlocked ? 'quality_blocked' : 'route_failure'),
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
      fix_html_escalation_status: executionProof?.escalation_status || null,
    },
    dependency_route_runs: dependencyRouteRuns,
    continuation_route_runs: continuationRouteRuns,
    ...(executionProof ? { execution_proof: executionProof } : {}),
    artifact: result.artifact || null,
    governance_surface: buildGovernanceSurfaceContract(hydratedContract),
  };
}
