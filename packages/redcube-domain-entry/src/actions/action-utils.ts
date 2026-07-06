import { readFileSync } from 'node:fs';

export function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

export function requireField(name: string, value: unknown): string {
  const text = safeText(value);
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  return text;
}

export function readJson<T = unknown>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf-8')) as T;
}
