import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import {
  createManagedRunRecord,
  resolveWorkspaceContract,
} from '@redcube/runtime-protocol';

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

function managedRunsDir(workspaceRoot) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const dir = path.join(contract.runtimeDir, 'managed-runs');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function managedRunFile(workspaceRoot, managedRunId) {
  return path.join(
    managedRunsDir(workspaceRoot),
    `${requireSafeSegment('managedRunId', managedRunId)}.json`,
  );
}

function managedProgressDir(workspaceRoot) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const dir = path.join(contract.runtimeDir, 'managed-progress');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function progressProjectionDir(workspaceRoot) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const dir = path.join(contract.runtimeDir, 'progress_projection');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function runtimeSupervisionDir(workspaceRoot) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const dir = path.join(contract.runtimeDir, 'runtime_supervision');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function managedSupervisionDir(workspaceRoot) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const dir = path.join(contract.runtimeDir, 'managed-supervision');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function escalationDir(workspaceRoot) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const dir = path.join(contract.runtimeDir, 'escalation');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function managedEscalationDir(workspaceRoot) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const dir = path.join(contract.runtimeDir, 'managed-escalation');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function managedStageRecordsDir(workspaceRoot, managedRunId) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const dir = path.join(
    contract.runtimeDir,
    'managed-stage-records',
    requireSafeSegment('managedRunId', managedRunId),
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

function stageRecordFile(workspaceRoot, managedRunId, stageId, attempt, suffix) {
  return path.join(
    managedStageRecordsDir(workspaceRoot, managedRunId),
    `${String(attempt).padStart(2, '0')}-${requireSafeSegment('stageId', stageId)}.${suffix}.json`,
  );
}

export function managedRunFilePath({ workspaceRoot, managedRunId }) {
  return managedRunFile(workspaceRoot, managedRunId);
}

export function managedProgressLatestFile(workspaceRoot) {
  return path.join(progressProjectionDir(workspaceRoot), 'latest.json');
}

export function runtimeSupervisionLatestFile(workspaceRoot) {
  return path.join(runtimeSupervisionDir(workspaceRoot), 'latest.json');
}

export function managedEscalationLatestFile(workspaceRoot) {
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
}) {
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

export function saveManagedRun({ workspaceRoot, managedRun }) {
  writeFileSync(
    managedRunFile(workspaceRoot, managedRun.managed_run_id),
    JSON.stringify(managedRun, null, 2),
    'utf-8',
  );
  return managedRun;
}

export function loadManagedRun({ workspaceRoot, managedRunId }) {
  const file = managedRunFile(workspaceRoot, managedRunId);
  if (!existsSync(file)) {
    throw new Error(`Managed run not found: ${managedRunId}`);
  }
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function managedPromptAuditFile({
  workspaceRoot,
  managedRunId,
  stageId,
  attempt,
}) {
  return stageRecordFile(workspaceRoot, managedRunId, stageId, attempt, 'prompt');
}

export function managedResultFile({
  workspaceRoot,
  managedRunId,
  stageId,
  attempt,
}) {
  return stageRecordFile(workspaceRoot, managedRunId, stageId, attempt, 'result');
}

export function saveManagedProgressProjection({
  workspaceRoot,
  managedRunId,
  projection,
}) {
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
}) {
  const file = managedProgressLatestFile(workspaceRoot);
  writeFileSync(file, JSON.stringify(projection, null, 2), 'utf-8');
  return file;
}

export function loadManagedProgressProjection({ workspaceRoot, managedRunId }) {
  const file = path.join(
    managedProgressDir(workspaceRoot),
    `${requireSafeSegment('managedRunId', managedRunId)}.json`,
  );
  if (!existsSync(file)) {
    return null;
  }
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function saveManagedRuntimeSupervision({
  workspaceRoot,
  managedRunId,
  runtimeSupervision,
}) {
  const file = path.join(
    managedSupervisionDir(workspaceRoot),
    `${requireSafeSegment('managedRunId', managedRunId)}.json`,
  );
  writeFileSync(file, JSON.stringify(runtimeSupervision, null, 2), 'utf-8');
  return file;
}

export function loadManagedRuntimeSupervision({ workspaceRoot, managedRunId }) {
  const file = path.join(
    managedSupervisionDir(workspaceRoot),
    `${requireSafeSegment('managedRunId', managedRunId)}.json`,
  );
  if (!existsSync(file)) {
    return null;
  }
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function saveRuntimeSupervisionLatest({
  workspaceRoot,
  runtimeSupervision,
}) {
  const file = runtimeSupervisionLatestFile(workspaceRoot);
  writeFileSync(file, JSON.stringify(runtimeSupervision, null, 2), 'utf-8');
  return file;
}

export function loadRuntimeSupervisionLatest({ workspaceRoot }) {
  const file = runtimeSupervisionLatestFile(workspaceRoot);
  if (!existsSync(file)) {
    return null;
  }
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function saveManagedEscalationRecord({
  workspaceRoot,
  managedRunId,
  escalationRecord,
}) {
  const file = path.join(
    managedEscalationDir(workspaceRoot),
    `${requireSafeSegment('managedRunId', managedRunId)}.json`,
  );
  writeFileSync(file, JSON.stringify(escalationRecord, null, 2), 'utf-8');
  return file;
}

export function loadManagedEscalationRecord({ workspaceRoot, managedRunId }) {
  const file = path.join(
    managedEscalationDir(workspaceRoot),
    `${requireSafeSegment('managedRunId', managedRunId)}.json`,
  );
  if (!existsSync(file)) {
    return null;
  }
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function saveManagedEscalationLatest({
  workspaceRoot,
  escalationRecord,
}) {
  const file = managedEscalationLatestFile(workspaceRoot);
  writeFileSync(file, JSON.stringify(escalationRecord, null, 2), 'utf-8');
  return file;
}

export function loadManagedEscalationLatest({ workspaceRoot }) {
  const file = managedEscalationLatestFile(workspaceRoot);
  if (!existsSync(file)) {
    return null;
  }
  return JSON.parse(readFileSync(file, 'utf-8'));
}
