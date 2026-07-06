import { mkdirSync, readFileSync } from 'node:fs';

export function safeText(value: unknown, fallback = ''): string {
  const text = String(value ?? '').trim();
  return text || fallback;
}

export function ensureDir(dir: string): string {
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function readJson<T = unknown>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf-8')) as T;
}
