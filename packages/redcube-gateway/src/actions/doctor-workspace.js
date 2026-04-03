import { existsSync } from 'node:fs';

import { resolveWorkspaceContract } from '@redcube/runtime-protocol';

export async function doctorWorkspace({ workspaceRoot }) {
  const contract = resolveWorkspaceContract({ workspaceRoot });

  return {
    ok: true,
    workspaceRoot: contract.workspaceRoot,
    workspaceFileExists: existsSync(contract.workspaceFile),
    contract,
  };
}
