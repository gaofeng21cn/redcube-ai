import path from 'node:path';
import { readFileSync } from 'node:fs';

import { buildGovernanceSurfaceContract } from '@redcube/overlay-core';
import { getDeliverablePaths } from '@redcube/runtime-protocol';
import { runDeliverableRoute as runHostedDeliverableRoute } from '@redcube/runtime';

export async function runDeliverableRoute(request) {
  const deliverablePaths = getDeliverablePaths(
    request.workspaceRoot,
    request.topicId,
    request.deliverableId,
  );
  const result = await runHostedDeliverableRoute(request);
  const deliverable = JSON.parse(readFileSync(deliverablePaths.deliverableFile, 'utf-8'));
  const contractRef = String(deliverable?.hydrated_contract_ref || 'contracts/hydrated-deliverable.json').trim();
  const hydratedContract = JSON.parse(
    readFileSync(path.join(deliverablePaths.deliverableDir, contractRef), 'utf-8'),
  );
  return {
    ...result,
    surface_kind: 'route_run',
    recommended_action: result.ok ? 'continue' : 'inspect_run_failure',
    error_kind: result.ok ? null : 'route_failure',
    summary: {
      route: request.route,
      run_id: result.run?.run_id || null,
      status: result.run?.status || null,
    },
    governance_surface: buildGovernanceSurfaceContract(hydratedContract),
  };
}
