import { loadRun } from '@redcube/runtime';

export async function getRun({ workspaceRoot, runId }) {
  const run = loadRun({ workspaceRoot, runId });
  const recommendedAction = run.status === 'failed'
    ? 'inspect_run_failure'
    : (run.status === 'completed' ? 'review_runtime_state' : 'continue');
  return {
    ok: true,
    surface_kind: 'run_record',
    recommended_action: recommendedAction,
    summary: {
      run_id: run.run_id,
      status: run.status,
      current_stage: run.current_stage,
    },
    run,
  };
}
