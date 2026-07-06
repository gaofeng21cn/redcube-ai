import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export function readJson(file: string): any {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function ensureParentDir(file: string): void {
  mkdirSync(path.dirname(file), { recursive: true });
}

export function writeJson(file: string, data: unknown): void {
  ensureParentDir(file);
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}
