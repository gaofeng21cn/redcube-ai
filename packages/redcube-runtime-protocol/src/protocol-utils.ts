import { mkdirSync, readFileSync } from 'node:fs';

import type { ValidationResult } from './types.js';

export type JsonRecord = Record<string, unknown>;

export function safeText(value: unknown, fallback = ''): string {
  const text = String(value ?? '').trim();
  return text || fallback;
}

export function isPlainObject(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function uniqueStrings(values: unknown): string[] {
  const items = Array.isArray(values) ? values : [];
  return [...new Set(items.map((item) => String(item || '').trim()).filter(Boolean))];
}

export function pushArrayStringErrors(
  errors: string[],
  value: unknown,
  label: string,
  { allowEmpty = true }: { allowEmpty?: boolean } = {},
): string[] {
  if (!Array.isArray(value)) {
    errors.push(`${label} 必须是数组`);
    return [];
  }
  if (!allowEmpty && value.length === 0) {
    errors.push(`${label} 不能为空数组`);
  }
  if (!value.every(isNonEmptyString)) {
    errors.push(`${label} 必须是非空字符串数组`);
    return [];
  }
  return uniqueStrings(value);
}

export function buildValidation(errors: string[]): ValidationResult {
  return {
    ok: errors.length === 0,
    errors,
  };
}

export function ensureDir(dir: string): string {
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function readJson<T = unknown>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf-8')) as T;
}
