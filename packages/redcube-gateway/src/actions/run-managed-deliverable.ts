import { runManagedDeliverable as runHostedManagedDeliverable } from '@redcube/runtime';

import type { ManagedRunResponse, RunManagedDeliverableRequest } from '../types.js';
import type { RuntimeManagedRunRequest } from '@redcube/runtime';

export async function runManagedDeliverable(request: RunManagedDeliverableRequest): Promise<ManagedRunResponse> {
  const result = await runHostedManagedDeliverable(request as unknown as RuntimeManagedRunRequest);
  return {
    ...result,
    surface_kind: 'managed_run',
    recommended_action: result.ok ? 'review_managed_progress' : 'inspect_managed_blockers',
    summary: {
      managed_run_id: result.managed_run.managed_run_id || null,
      status: result.managed_run.status || null,
      current_stage: result.managed_run.current_stage || null,
    },
  };
}
