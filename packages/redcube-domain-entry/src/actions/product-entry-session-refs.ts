// @ts-nocheck
import path from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

import { resolveRuntimeStatePath } from '@redcube/runtime';
import { readJson, safeText } from './action-utils.js';

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
