import { getManagedRun as loadManagedRun } from '@redcube/runtime';

import type { ManagedRunRecordResponse, SuperviseManagedRunRequest } from '../types.js';

type RuntimeManagedRunRecordResponse = Omit<ManagedRunRecordResponse, 'managed_run'> & {
  managed_run: Awaited<ReturnType<typeof loadManagedRun>>['managed_run'];
};

export async function getManagedRun({
  workspaceRoot,
  managedRunId,
}: SuperviseManagedRunRequest): Promise<RuntimeManagedRunRecordResponse> {
  const result = await loadManagedRun({ workspaceRoot, managedRunId });

  return {
    ...result,
    surface_kind: 'managed_run_record',
    recommended_action: result.managed_run.needs_user_decision
      ? 'decide_managed_next_step'
      : 'review_managed_progress',
    summary: {
      managed_run_id: result.managed_run.managed_run_id || null,
      status: result.managed_run.status || null,
      current_stage: result.managed_run.current_stage || null,
    },
  };
}
