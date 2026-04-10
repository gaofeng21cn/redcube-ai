import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

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

function getRunsDir(workspaceRoot) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const runsDir = path.join(contract.runtimeDir, 'runs');
  mkdirSync(runsDir, { recursive: true });
  return runsDir;
}

function readStoredRuns(workspaceRoot) {
  const runsDir = getRunsDir(workspaceRoot);
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

function findPriorRuns({ workspaceRoot, route, scope, target, overlay }) {
  return readStoredRuns(workspaceRoot)
    .filter((run) => run?.route === route
      && run?.scope === scope
      && run?.target === target
      && run?.overlay === overlay)
    .sort((left, right) => {
      const leftTime = Date.parse(left?.started_at || '') || 0;
      const rightTime = Date.parse(right?.started_at || '') || 0;
      return leftTime - rightTime;
    });
}

function computeLatencyMs(startedAt, finishedAt) {
  const startMs = Date.parse(String(startedAt || ''));
  const finishMs = Date.parse(String(finishedAt || ''));
  if (!Number.isFinite(startMs) || !Number.isFinite(finishMs)) {
    return null;
  }
  return Math.max(finishMs - startMs, 0);
}

function buildRunTelemetry(run, executor, status, finishedAt = run.finished_at) {
  return {
    ...(run?.telemetry || {}),
    run_id: run.run_id,
    route: run.route,
    scope: run.scope,
    target: run.target,
    overlay: run.overlay,
    executor_kind: String(
      executor?.adapter
      || run?.telemetry?.executor_kind
      || '',
    ).trim() || null,
    execution_surface: String(
      executor?.execution_surface
      || run?.telemetry?.execution_surface
      || '',
    ).trim() || null,
    status,
    started_at: run.started_at || null,
    finished_at: finishedAt || null,
    latency_ms: computeLatencyMs(run.started_at, finishedAt),
    prompt_tokens: run?.telemetry?.prompt_tokens ?? null,
    completion_tokens: run?.telemetry?.completion_tokens ?? null,
    estimated_cost: run?.telemetry?.estimated_cost ?? null,
  };
}

function normalizeError(error) {
  if (error && typeof error === 'object') {
    return {
      code: String(error.code || '').trim() || null,
      message: error instanceof Error ? error.message : String(error.message || error),
      requires_human_confirmation: error.requiresHumanConfirmation === true,
      requires_external_secret: error.requiresExternalSecret === true,
    };
  }
  return {
    code: null,
    message: error instanceof Error ? error.message : String(error),
    requires_human_confirmation: false,
    requires_external_secret: false,
  };
}

export function startRun({
  workspaceRoot,
  runId = null,
  route,
  overlay,
  scope = 'deliverable',
  target,
  managedRunId = null,
  baselineDeliverableId = '',
  executor,
}) {
  const resolvedRunId = String(runId || '').trim() || `run-${randomUUID()}`;
  const priorRuns = findPriorRuns({
    workspaceRoot,
    route,
    scope,
    target,
    overlay,
  });
  const run = {
    ...createRunRecord({
      runId: resolvedRunId,
      managedRunId,
      route,
      scope,
      target,
      overlay,
      rerunCount: priorRuns.length,
      previousRunId: priorRuns.at(-1)?.run_id || null,
      sourceStage: priorRuns.at(-1)?.current_stage || null,
      baselineDeliverableId,
    }),
    started_at: new Date().toISOString(),
    current_stage: route,
    executor,
  };
  run.telemetry = buildRunTelemetry(run, executor, 'running', null);

  writeFileSync(runFile(workspaceRoot, resolvedRunId), JSON.stringify(run, null, 2), 'utf-8');
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
    error_kind: null,
    executor,
  };
  completedRun.telemetry = buildRunTelemetry(
    completedRun,
    executor,
    'completed',
    completedRun.finished_at,
  );

  writeFileSync(runFile(workspaceRoot, runId), JSON.stringify(completedRun, null, 2), 'utf-8');
  return completedRun;
}

export function failRun({
  workspaceRoot,
  runId,
  currentStage,
  error,
  errorKind = 'execution_error',
  executor,
}) {
  const run = loadRun({ workspaceRoot, runId });
  const failedRun = {
    ...run,
    status: 'failed',
    finished_at: new Date().toISOString(),
    current_stage: currentStage,
    error_kind: errorKind,
    executor,
    error: normalizeError(error),
  };
  failedRun.telemetry = buildRunTelemetry(
    failedRun,
    executor,
    'failed',
    failedRun.finished_at,
  );

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
