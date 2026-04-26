import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import {
  createManagedRunRecord,
  resolveWorkspaceContract,
} from '@redcube/runtime-protocol';
import type {
  ManagedRunMode,
  ManagedRunRecord,
} from '@redcube/runtime-protocol';

type JsonRecord = Record<string, unknown>;

interface ManagedRunLookup {
  workspaceRoot: string;
  managedRunId: string;
}

interface ManagedStageRecordLookup extends ManagedRunLookup {
  stageId: string;
  attempt: string | number;
}

interface CreateManagedRunRequest {
  workspaceRoot: string;
  overlay: string;
  topicId: string;
  deliverableId: string;
  mode?: ManagedRunMode;
  stopAfterStage?: string | null;
  userIntent?: string | null;
  adapter?: string | null;
}

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

function managedRunsDir(workspaceRoot: string): string {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const dir = path.join(contract.runtimeDir, 'managed-runs');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function managedRunFile(workspaceRoot: string, managedRunId: string): string {
  return path.join(
    managedRunsDir(workspaceRoot),
    `${requireSafeSegment('managedRunId', managedRunId)}.json`,
  );
}

function managedProgressDir(workspaceRoot: string): string {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const dir = path.join(contract.runtimeDir, 'managed-progress');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function progressProjectionDir(workspaceRoot: string): string {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const dir = path.join(contract.runtimeDir, 'progress_projection');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function runtimeSupervisionDir(workspaceRoot: string): string {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const dir = path.join(contract.runtimeDir, 'runtime_supervision');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function managedSupervisionDir(workspaceRoot: string): string {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const dir = path.join(contract.runtimeDir, 'managed-supervision');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function escalationDir(workspaceRoot: string): string {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const dir = path.join(contract.runtimeDir, 'escalation');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function managedEscalationDir(workspaceRoot: string): string {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const dir = path.join(contract.runtimeDir, 'managed-escalation');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function managedStageRecordsDir(workspaceRoot: string, managedRunId: string): string {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const dir = path.join(
    contract.runtimeDir,
    'managed-stage-records',
    requireSafeSegment('managedRunId', managedRunId),
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

function stageRecordFile(
  workspaceRoot: string,
  managedRunId: string,
  stageId: string,
  attempt: string | number,
  suffix: string,
): string {
  return path.join(
    managedStageRecordsDir(workspaceRoot, managedRunId),
    `${String(attempt).padStart(2, '0')}-${requireSafeSegment('stageId', stageId)}.${suffix}.json`,
  );
}

export function managedRunFilePath({ workspaceRoot, managedRunId }: ManagedRunLookup): string {
  return managedRunFile(workspaceRoot, managedRunId);
}

export function managedProgressLatestFile(workspaceRoot: string): string {
  return path.join(progressProjectionDir(workspaceRoot), 'latest.json');
}

export function runtimeSupervisionLatestFile(workspaceRoot: string): string {
  return path.join(runtimeSupervisionDir(workspaceRoot), 'latest.json');
}

export function managedEscalationLatestFile(workspaceRoot: string): string {
  return path.join(escalationDir(workspaceRoot), 'latest.json');
}

export function createManagedRun({
  workspaceRoot,
  overlay,
  topicId,
  deliverableId,
  mode = 'auto_to_terminal',
  stopAfterStage = null,
  userIntent = null,
  adapter = null,
}: CreateManagedRunRequest): ManagedRunRecord {
  const managedRunId = `managed-${randomUUID()}`;
  const managedRun = {
    ...createManagedRunRecord({
      managedRunId,
      overlay,
      topicId,
      deliverableId,
      mode,
      stopAfterStage,
      userIntent,
      adapter,
    }),
    started_at: new Date().toISOString(),
  };
  writeFileSync(
    managedRunFile(workspaceRoot, managedRunId),
    JSON.stringify(managedRun, null, 2),
    'utf-8',
  );
  return managedRun;
}

export function saveManagedRun({
  workspaceRoot,
  managedRun,
}: {
  workspaceRoot: string;
  managedRun: ManagedRunRecord;
}): ManagedRunRecord {
  writeFileSync(
    managedRunFile(workspaceRoot, managedRun.managed_run_id),
    JSON.stringify(managedRun, null, 2),
    'utf-8',
  );
  return managedRun;
}

export function loadManagedRun({ workspaceRoot, managedRunId }: ManagedRunLookup): ManagedRunRecord {
  const file = managedRunFile(workspaceRoot, managedRunId);
  if (!existsSync(file)) {
    throw new Error(`Managed run not found: ${managedRunId}`);
  }
  return JSON.parse(readFileSync(file, 'utf-8')) as ManagedRunRecord;
}

export function managedPromptAuditFile({
  workspaceRoot,
  managedRunId,
  stageId,
  attempt,
}: ManagedStageRecordLookup): string {
  return stageRecordFile(workspaceRoot, managedRunId, stageId, attempt, 'prompt');
}

export function managedResultFile({
  workspaceRoot,
  managedRunId,
  stageId,
  attempt,
}: ManagedStageRecordLookup): string {
  return stageRecordFile(workspaceRoot, managedRunId, stageId, attempt, 'result');
}

export function saveManagedProgressProjection({
  workspaceRoot,
  managedRunId,
  projection,
}: ManagedRunLookup & { projection: unknown }): string {
  const file = path.join(
    managedProgressDir(workspaceRoot),
    `${requireSafeSegment('managedRunId', managedRunId)}.json`,
  );
  writeFileSync(file, JSON.stringify(projection, null, 2), 'utf-8');
  return file;
}

export function saveLatestManagedProgressProjection({
  workspaceRoot,
  projection,
}: {
  workspaceRoot: string;
  projection: unknown;
}): string {
  const file = managedProgressLatestFile(workspaceRoot);
  writeFileSync(file, JSON.stringify(projection, null, 2), 'utf-8');
  return file;
}

export function loadManagedProgressProjection({ workspaceRoot, managedRunId }: ManagedRunLookup): JsonRecord | null {
  const file = path.join(
    managedProgressDir(workspaceRoot),
    `${requireSafeSegment('managedRunId', managedRunId)}.json`,
  );
  if (!existsSync(file)) {
    return null;
  }
  return JSON.parse(readFileSync(file, 'utf-8')) as JsonRecord;
}

export function saveManagedRuntimeSupervision({
  workspaceRoot,
  managedRunId,
  runtimeSupervision,
}: ManagedRunLookup & { runtimeSupervision: unknown }): string {
  const file = path.join(
    managedSupervisionDir(workspaceRoot),
    `${requireSafeSegment('managedRunId', managedRunId)}.json`,
  );
  writeFileSync(file, JSON.stringify(runtimeSupervision, null, 2), 'utf-8');
  return file;
}

export function loadManagedRuntimeSupervision({ workspaceRoot, managedRunId }: ManagedRunLookup): JsonRecord | null {
  const file = path.join(
    managedSupervisionDir(workspaceRoot),
    `${requireSafeSegment('managedRunId', managedRunId)}.json`,
  );
  if (!existsSync(file)) {
    return null;
  }
  return JSON.parse(readFileSync(file, 'utf-8')) as JsonRecord;
}

export function saveRuntimeSupervisionLatest({
  workspaceRoot,
  runtimeSupervision,
}: {
  workspaceRoot: string;
  runtimeSupervision: unknown;
}): string {
  const file = runtimeSupervisionLatestFile(workspaceRoot);
  writeFileSync(file, JSON.stringify(runtimeSupervision, null, 2), 'utf-8');
  return file;
}

export function loadRuntimeSupervisionLatest({ workspaceRoot }: { workspaceRoot: string }): JsonRecord | null {
  const file = runtimeSupervisionLatestFile(workspaceRoot);
  if (!existsSync(file)) {
    return null;
  }
  return JSON.parse(readFileSync(file, 'utf-8')) as JsonRecord;
}

export function saveManagedEscalationRecord({
  workspaceRoot,
  managedRunId,
  escalationRecord,
}: ManagedRunLookup & { escalationRecord: unknown }): string {
  const file = path.join(
    managedEscalationDir(workspaceRoot),
    `${requireSafeSegment('managedRunId', managedRunId)}.json`,
  );
  writeFileSync(file, JSON.stringify(escalationRecord, null, 2), 'utf-8');
  return file;
}

export function loadManagedEscalationRecord({ workspaceRoot, managedRunId }: ManagedRunLookup): JsonRecord | null {
  const file = path.join(
    managedEscalationDir(workspaceRoot),
    `${requireSafeSegment('managedRunId', managedRunId)}.json`,
  );
  if (!existsSync(file)) {
    return null;
  }
  return JSON.parse(readFileSync(file, 'utf-8')) as JsonRecord;
}

export function saveManagedEscalationLatest({
  workspaceRoot,
  escalationRecord,
}: {
  workspaceRoot: string;
  escalationRecord: unknown;
}): string {
  const file = managedEscalationLatestFile(workspaceRoot);
  writeFileSync(file, JSON.stringify(escalationRecord, null, 2), 'utf-8');
  return file;
}

export function loadManagedEscalationLatest({ workspaceRoot }: { workspaceRoot: string }): JsonRecord | null {
  const file = managedEscalationLatestFile(workspaceRoot);
  if (!existsSync(file)) {
    return null;
  }
  return JSON.parse(readFileSync(file, 'utf-8')) as JsonRecord;
}
