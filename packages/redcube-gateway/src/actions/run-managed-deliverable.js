import { runManagedDeliverable as runHostedManagedDeliverable } from '@redcube/runtime';

/**
 * @param {import('../types.js').RunManagedDeliverableRequest} request
 * @returns {Promise<import('../types.js').ManagedRunResponse>}
 */
export async function runManagedDeliverable(request) {
  const result = await runHostedManagedDeliverable(request);
  return {
    ...result,
    surface_kind: 'managed_run',
    recommended_action: result.ok ? 'review_managed_progress' : 'inspect_managed_blockers',
    summary: {
      managed_run_id: result.managed_run?.managed_run_id || null,
      status: result.managed_run?.status || null,
      current_stage: result.managed_run?.current_stage || null,
    },
  };
}
