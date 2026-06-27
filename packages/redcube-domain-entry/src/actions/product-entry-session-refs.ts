// @ts-nocheck
import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { resolveRuntimeStatePath } from '@redcube/runtime';

export const PRODUCT_ENTRY_SESSION_REFS_BOUNDARY = Object.freeze({
  surface_kind: 'product_entry_session_refs_boundary',
  owner: 'redcube_ai',
  generated_session_shell_owner: 'one-person-lab',
  role: 'entry_session_domain_snapshot_refs',
  semantic_contract_id: 'product_entry_continuity_refs_adapter',
  retired_semantic_contract_ids: ['product_entry_session_store'],
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

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

export function productEntrySessionDir() {
  return resolveRuntimeStatePath('product-entry-sessions');
}

export function productEntrySessionFile(entrySessionId) {
  return path.join(productEntrySessionDir(), `${safeText(entrySessionId)}.json`);
}

export function loadProductEntrySessionRef({ entrySessionId }) {
  const file = productEntrySessionFile(entrySessionId);
  if (!existsSync(file)) {
    return null;
  }
  return readJson(file);
}

export function saveProductEntrySessionRef({ session }) {
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
