import path from 'node:path';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';

import { resolveWorkspaceContract } from '@redcube/runtime-protocol';

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

function eventFile(workspaceRoot, runId) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const eventsDir = path.join(contract.runtimeDir, 'events');
  mkdirSync(eventsDir, { recursive: true });
  return path.join(eventsDir, `${requireSafeSegment('runId', runId)}.jsonl`);
}

export function appendEvent(workspaceRoot, runId, event) {
  appendFileSync(eventFile(workspaceRoot, runId), `${JSON.stringify(event)}\n`, 'utf-8');
}

export function readEvents(workspaceRoot, runId) {
  const file = eventFile(workspaceRoot, runId);
  if (!existsSync(file)) {
    return [];
  }

  return readFileSync(file, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
