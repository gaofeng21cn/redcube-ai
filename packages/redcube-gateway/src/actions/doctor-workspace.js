import path from 'node:path';
import { existsSync } from 'node:fs';

import { resolveWorkspaceContract } from '@redcube/runtime-protocol';

export async function doctorWorkspace({ workspaceRoot }) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const workspaceFileExists = existsSync(contract.workspaceFile);

  return {
    ok: true,
    surface_kind: 'workspace_doctor',
    recommended_action: workspaceFileExists ? 'continue' : 'run_source_intake',
    recommended_actions: workspaceFileExists ? ['continue'] : ['run_source_intake', 'run_source_research'],
    summary: {
      workspace_file_exists: workspaceFileExists,
      workspace_bootstrap_needed: workspaceFileExists !== true,
      bootstrap_via: workspaceFileExists ? null : ['source_intake', 'source_research'],
      canonical_topics_dir: contract.topicsDir,
      canonical_runs_dir: path.join(contract.runtimeDir, 'runs'),
    },
    workspaceRoot: contract.workspaceRoot,
    workspaceFileExists,
    contract,
  };
}
