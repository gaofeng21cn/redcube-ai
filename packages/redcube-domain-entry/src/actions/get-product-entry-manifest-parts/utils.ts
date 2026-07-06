// @ts-nocheck
import {
  readJson,
  requireField,
} from '../action-utils.js';
export { safeText } from '../action-utils.js';

const CURRENT_PROGRAM_CONTRACT_URL = new URL(
  '../../../../../contracts/runtime-program/current-program.json',
  import.meta.url,
);

export function normalizeWorkspaceRoot(request) {
  return requireField(
    'workspace_root',
    request?.workspace_root || request?.workspaceRoot || request?.workspace_locator?.workspace_root,
  );
}

export function readCurrentProgramContract() {
  return readJson(CURRENT_PROGRAM_CONTRACT_URL);
}
