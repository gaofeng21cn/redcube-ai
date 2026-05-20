import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { resolveRuntimeStatePath } from './runtime-state.js';
import type { RuntimeProductEntrySessionRecord } from './types.js';

export const PRODUCT_ENTRY_SESSION_SNAPSHOT_REF_ADAPTER_BOUNDARY = Object.freeze({
  surface_kind: 'product_entry_session_snapshot_ref_adapter_boundary',
  owner: 'redcube_ai',
  generated_session_shell_owner: 'one-person-lab',
  role: 'entry_session_domain_snapshot_refs_only_adapter',
  retained_semantic_contract_id: 'product_entry_session_store',
  refs_only: true,
  owns_generic_session_shell: false,
  owns_generic_session_store: false,
  owns_generic_workbench: false,
  writes_visual_truth: false,
  writes_artifact_blob: false,
  writes_memory_body: false,
  exports_only: [
    'entry_session_id',
    'topic_deliverable_run_locator_refs',
    'latest_visual_run_ref',
    'domain_snapshot_ref',
  ],
});

function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

function readJson(file: string): RuntimeProductEntrySessionRecord {
  return JSON.parse(readFileSync(file, 'utf-8')) as RuntimeProductEntrySessionRecord;
}

function writeJson(file: string, value: unknown): void {
  writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
}

export function productEntrySessionDir(): string {
  return resolveRuntimeStatePath('product-entry-sessions');
}

export function productEntrySessionFile(entrySessionId: string): string {
  return path.join(productEntrySessionDir(), `${safeText(entrySessionId)}.json`);
}

export function loadProductEntrySessionSnapshotRef({ entrySessionId }: {
  entrySessionId: string;
}): RuntimeProductEntrySessionRecord | null {
  const file = productEntrySessionFile(entrySessionId);
  if (!existsSync(file)) {
    return null;
  }
  return readJson(file);
}

export function saveProductEntrySessionSnapshotRef({ session }: { session: RuntimeProductEntrySessionRecord }): {
  session: RuntimeProductEntrySessionRecord;
  file: string;
} {
  mkdirSync(productEntrySessionDir(), { recursive: true });
  const file = productEntrySessionFile(session.entry_session_id);
  const nextSession = {
    ...session,
    updated_at: safeText(session.updated_at, new Date().toISOString()),
  };
  writeJson(file, nextSession);
  return {
    session: nextSession,
    file,
  };
}
