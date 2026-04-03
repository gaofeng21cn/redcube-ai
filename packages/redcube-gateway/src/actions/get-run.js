import { loadRun } from '@redcube/runtime';

export async function getRun({ workspaceRoot, runId }) {
  return {
    ok: true,
    run: loadRun({ workspaceRoot, runId }),
  };
}
