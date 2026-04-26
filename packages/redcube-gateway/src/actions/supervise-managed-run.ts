import { superviseManagedRun as runManagedSupervisorTick } from '@redcube/runtime';

import type { ManagedSupervisionResponse, SuperviseManagedRunRequest } from '../types.js';

/**
 * @param {import('../types.js').SuperviseManagedRunRequest} request
 * @returns {Promise<import('../types.js').ManagedSupervisionResponse>}
 */
export async function superviseManagedRun({
  workspaceRoot,
  managedRunId,
}: SuperviseManagedRunRequest): Promise<ManagedSupervisionResponse> {
  const result = await runManagedSupervisorTick({ workspaceRoot, managedRunId });
  return {
    ...result,
    surface_kind: 'managed_supervision',
    recommended_action: result.runtime_supervision?.needs_human_intervention
      ? 'inspect_managed_blockers'
      : 'review_managed_progress',
    summary: {
      managed_run_id: result.managed_run?.managed_run_id || null,
      status: result.managed_run?.status || null,
      current_stage: result.managed_run?.current_stage || null,
    },
  } as unknown as ManagedSupervisionResponse;
}
