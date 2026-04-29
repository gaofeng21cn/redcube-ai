// @ts-nocheck
import { readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT_URL = new URL(
  '../../../../../contracts/runtime-program/current-program.json',
  import.meta.url,
);

export function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function requireField(name, value) {
  const text = safeText(value);
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  return text;
}

export function normalizeWorkspaceRoot(request) {
  return requireField(
    'workspace_root',
    request?.workspace_root || request?.workspaceRoot || request?.workspace_locator?.workspace_root,
  );
}

export function readCurrentProgramContract() {
  return JSON.parse(readFileSync(CURRENT_PROGRAM_CONTRACT_URL, 'utf8'));
}
