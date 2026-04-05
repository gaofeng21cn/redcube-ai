import { existsSync } from 'node:fs';

import { resolveWorkspaceContract } from '@redcube/runtime-protocol';

export async function doctorWorkspace({ workspaceRoot }) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const workspaceFileExists = existsSync(contract.workspaceFile);

  return {
    ok: true,
    surface_kind: 'workspace_doctor',
    recommended_action: workspaceFileExists ? 'continue' : 'initialize_workspace_contract',
    summary: {
      workspace_file_exists: workspaceFileExists,
      canonical_topics_dir: contract.topicsDir,
      canonical_runs_dir: contract.runsDir,
    },
    workspaceRoot: contract.workspaceRoot,
    workspaceFileExists,
    contract,
  };
}
