import { readFileSync } from 'node:fs';

export function readJson<T = unknown>(file: string | URL): T {
  return JSON.parse(readFileSync(file, 'utf-8')) as T;
}
