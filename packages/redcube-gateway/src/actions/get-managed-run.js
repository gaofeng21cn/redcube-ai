import { getManagedRun as loadManagedRun } from '@redcube/runtime';

/**
 * @param {import('../types.js').SuperviseManagedRunRequest} request
 * @returns {Promise<import('../types.js').ManagedRunRecordResponse>}
 */
export async function getManagedRun({ workspaceRoot, managedRunId }) {
  const result = await loadManagedRun({ workspaceRoot, managedRunId });
  return {
    ...result,
    surface_kind: 'managed_run_record',
    recommended_action: result.managed_run?.needs_user_decision
      ? 'decide_managed_next_step'
      : 'review_managed_progress',
    summary: {
      managed_run_id: result.managed_run?.managed_run_id || null,
      status: result.managed_run?.status || null,
      current_stage: result.managed_run?.current_stage || null,
    },
  };
}
