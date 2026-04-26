import path from 'node:path';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';

import { resolveWorkspaceContract } from '@redcube/runtime-protocol';
import type { RuntimeEventRecord } from './types.js';

function requireSafeSegment(name: string, value: unknown): string {
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

function eventFile(workspaceRoot: string, managedRunId: string): string {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const eventsDir = path.join(contract.runtimeDir, 'managed-events');
  mkdirSync(eventsDir, { recursive: true });
  return path.join(eventsDir, `${requireSafeSegment('managedRunId', managedRunId)}.jsonl`);
}

export function appendManagedEvent(workspaceRoot: string, managedRunId: string, event: RuntimeEventRecord): void {
  appendFileSync(eventFile(workspaceRoot, managedRunId), `${JSON.stringify(event)}\n`, 'utf-8');
}

export function readManagedEvents(workspaceRoot: string, managedRunId: string): RuntimeEventRecord[] {
  const file = eventFile(workspaceRoot, managedRunId);
  if (!existsSync(file)) {
    return [];
  }

  return readFileSync(file, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as RuntimeEventRecord);
}
