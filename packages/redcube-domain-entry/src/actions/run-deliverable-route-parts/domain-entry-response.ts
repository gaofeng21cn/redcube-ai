import { buildGovernanceSurfaceContract } from '@redcube/overlay-core';
import { getDeliverablePaths } from '@redcube/runtime-protocol';
import path from 'node:path';

import type { RunDeliverableRouteRequest } from '../../types.js';
import type {
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
}: {
  request: RunDeliverableRouteRequest;
  result: RuntimeRouteResult;
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
  const typedBlockerRecommendedAction = safeText(
    (result as { error?: { recommended_action?: unknown } }).error?.recommended_action
      || (result as { typed_blocker?: { next_required_owner_action?: unknown } }).typed_blocker?.next_required_owner_action
      || (run as { error?: { recommended_action?: unknown } } | undefined)?.error?.recommended_action,
  );

  return {
    ...result,
    surface_kind: typedBlocker ? 'typed_blocker' : 'route_run',
    ...(typedBlocker ? { return_shape: 'typed_blocker' } : {}),
    recommended_action: result.ok
      ? 'continue'
      : (typedBlocker ? (typedBlockerRecommendedAction || 'resolve_typed_blocker_at_owner_boundary') : 'inspect_run_failure'),
    error_kind: result.ok ? null : (typedBlocker ? 'typed_blocker' : 'route_failure'),
    summary: {
      route: request.route,
      run_id: result.run?.run_id || null,
      status: result.run?.status || null,
      cache_status: typeof result.cache_status === 'string' ? result.cache_status : 'miss',
      requested_route: request.route,
      executed_route: safeText(run?.current_stage) || request.route,
      route_selection_owner: 'codex_cli',
      route_selection_owner_scope: 'intra_stage_domain_route_only',
      cross_stage_decision_owner: 'stage_run_decisive_codex_attempt',
      route_execution_grants_stage_transition_authority: false,
      programmatic_route_continuation: false,
      next_stage_may_start: result.ok === true,
    },
    artifactFile: routeResultArtifactFile(result) || undefined,
    artifact: result.artifact || null,
    governance_surface: buildGovernanceSurfaceContract(hydratedContract),
  };
}
