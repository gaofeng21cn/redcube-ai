import path from 'node:path';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

function memoryDir(rootDir) {
  const dir = path.join(rootDir, '.redcube_pi', 'runs');
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function createRunId() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `run-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-${Math.random().toString(36).slice(2, 8)}`;
}

export function saveRunState(rootDir, state) {
  const file = path.join(memoryDir(rootDir), `${state.runId}.json`);
  writeFileSync(file, JSON.stringify(state, null, 2), 'utf-8');
  return file;
}

export function loadRunState(rootDir, runId) {
  const file = path.join(memoryDir(rootDir), `${runId}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function listRunStates(rootDir, limit = 20) {
  const dir = memoryDir(rootDir);
  const files = readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort((a, b) => b.localeCompare(a))
    .slice(0, limit);

  return files
    .map((name) => JSON.parse(readFileSync(path.join(dir, name), 'utf-8')))
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
}
