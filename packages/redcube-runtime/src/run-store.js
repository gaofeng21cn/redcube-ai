import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { createRunRecord, resolveWorkspaceContract } from '@redcube/runtime-protocol';

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

function runFile(workspaceRoot, runId) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const runsDir = path.join(contract.runtimeDir, 'runs');
  mkdirSync(runsDir, { recursive: true });
  return path.join(runsDir, `${requireSafeSegment('runId', runId)}.json`);
}

export function startRun({
  workspaceRoot,
  route,
  overlay,
  scope = 'deliverable',
  target,
  executor,
}) {
  const runId = `run-${randomUUID()}`;
  const run = {
    ...createRunRecord({
      runId,
      route,
      scope,
      target,
      overlay,
    }),
    started_at: new Date().toISOString(),
    current_stage: route,
    executor,
  };

  writeFileSync(runFile(workspaceRoot, runId), JSON.stringify(run, null, 2), 'utf-8');
  return run;
}

export function completeRun({
  workspaceRoot,
  runId,
  currentStage,
  stageResults,
  artifactRefs,
  executor,
}) {
  const run = loadRun({ workspaceRoot, runId });
  const completedRun = {
    ...run,
    status: 'completed',
    finished_at: new Date().toISOString(),
    current_stage: currentStage,
    stage_results: stageResults,
    artifact_refs: artifactRefs,
    executor,
  };

  writeFileSync(runFile(workspaceRoot, runId), JSON.stringify(completedRun, null, 2), 'utf-8');
  return completedRun;
}

export function failRun({
  workspaceRoot,
  runId,
  currentStage,
  error,
  executor,
}) {
  const run = loadRun({ workspaceRoot, runId });
  const failedRun = {
    ...run,
    status: 'failed',
    finished_at: new Date().toISOString(),
    current_stage: currentStage,
    executor,
    error: {
      message: error instanceof Error ? error.message : String(error),
    },
  };

  writeFileSync(runFile(workspaceRoot, runId), JSON.stringify(failedRun, null, 2), 'utf-8');
  return failedRun;
}

export function loadRun({ workspaceRoot, runId }) {
  const file = runFile(workspaceRoot, runId);
  if (!existsSync(file)) {
    throw new Error(`Run not found: ${runId}`);
  }

  return JSON.parse(readFileSync(file, 'utf-8'));
}
