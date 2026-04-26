import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { resolveRuntimeStatePath } from './runtime-state.js';
import type { RuntimeProductEntrySessionRecord } from './types.js';

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

export function loadProductEntrySession({ entrySessionId }: { entrySessionId: string }): RuntimeProductEntrySessionRecord | null {
  const file = productEntrySessionFile(entrySessionId);
  if (!existsSync(file)) {
    return null;
  }
  return readJson(file);
}

export function saveProductEntrySession({ session }: { session: RuntimeProductEntrySessionRecord }): {
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
