// @ts-nocheck
import path from 'node:path';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';

import {
  resolveWorkspaceContract,
} from '../workspace.js';

function requireSafeSegment(name, value) {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  if (/[\\/]/.test(text)) {
    throw new Error(`${name} 不能包含路径分隔符`);
  }
  if (text.includes('..')) {
    throw new Error(`${name} 不能包含父目录引用`);
  }
  return text;
}

function routeRunFile(workspaceRoot, runId) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const runsDir = path.join(contract.runtimeDir, 'runs');
  mkdirSync(runsDir, { recursive: true });
  return path.join(runsDir, `${requireSafeSegment('runId', runId)}.json`);
}

function routeRunEventFile(workspaceRoot, runId) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const eventsDir = path.join(contract.runtimeDir, 'events');
  mkdirSync(eventsDir, { recursive: true });
  return path.join(eventsDir, `${requireSafeSegment('runId', runId)}.jsonl`);
}

export function readStoredRouteRuns(workspaceRoot) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const runsDir = path.join(contract.runtimeDir, 'runs');
  mkdirSync(runsDir, { recursive: true });
  return readdirSync(runsDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      try {
        return JSON.parse(readFileSync(path.join(runsDir, file), 'utf-8'));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export function loadRouteRunRecord({ workspaceRoot, runId }) {
  const file = routeRunFile(workspaceRoot, runId);
  if (!existsSync(file)) {
    throw new Error(`Run not found: ${runId}`);
  }
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function writeRouteRunRecord({ workspaceRoot, runId, run }) {
  writeFileSync(routeRunFile(workspaceRoot, runId), JSON.stringify(run, null, 2), 'utf-8');
  return run;
}

export function appendRouteRunEventRecord({ workspaceRoot, runId, event }) {
  appendFileSync(routeRunEventFile(workspaceRoot, runId), `${JSON.stringify(event)}\n`, 'utf-8');
}

export function readRouteRunEventRecords({ workspaceRoot, runId }) {
  const file = routeRunEventFile(workspaceRoot, runId);
  if (!existsSync(file)) {
    return [];
  }

  return readFileSync(file, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
