import path from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

export type JsonRecord = Record<string, unknown>;

export function safeText(value: unknown, fallback: unknown = ''): string {
  const text = String(value || '').trim();
  return text || String(fallback || '').trim();
}

export function ensureDir(dir: string): string {
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function readJson<T = JsonRecord>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf-8')) as T;
}

export function writeJson(file: string, value: unknown): void {
  ensureDir(path.dirname(file));
  writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
}
