import { existsSync, writeFileSync } from 'node:fs';

import type { JsonObject } from '@redcube/overlay-core';
import type { RunDeliverableRouteRequest } from '../../types.js';
import type {
  DependencyRouteRun,
  FixHtmlEscalationAttempt,
  FixHtmlExecutionProof,
  RuntimeRouteResult,
} from './shared.js';

import {
  CODEX_STRUCTURED_ADAPTER,
  HERMES_AGENT_LOOP_ADAPTER,
  routeResultArtifactFile,
  runCurrentStage,
  safeText,
  uniqueDependencyRouteRuns,
} from './shared.js';
import {
  artifactRequestsFixHtml,
  hydrateResultArtifactFromStage,
  readStageArtifactForRequest,
  stageArtifactFileForRequest,
} from './stage-artifacts.js';
import {
  runRouteWithRecoveryAndContinuation,
} from './recovery.js';
import { readJsonRecord } from './shared.js';

function runAdapter(request: RunDeliverableRouteRequest, result: RuntimeRouteResult | null = null): string {
  const run = result?.run as { executor?: { adapter?: unknown } } | undefined;
  return safeText(run?.executor?.adapter || request.adapter, CODEX_STRUCTURED_ADAPTER);
}

function executorBackendForAdapter(adapter: string): 'codex_cli' | 'hermes_agent' {
  const requestedAdapter = safeText(adapter, CODEX_STRUCTURED_ADAPTER);
  if (requestedAdapter === CODEX_STRUCTURED_ADAPTER) return 'codex_cli';
  if (requestedAdapter === HERMES_AGENT_LOOP_ADAPTER) return 'hermes_agent';
  throw new Error(`Unsupported executor adapter: ${requestedAdapter}`);
}

function hermesAgentLoopAvailable(): boolean {
  return Boolean(
    safeText(process.env.REDCUBE_HERMES_AGENT_API_BASE_URL)
    || safeText(process.env.REDCUBE_HERMES_AGENT_LOOP_BRIDGE_COMMAND),
  );
}

function executionShapeForBackend(
  executorBackend: 'codex_cli' | 'hermes_agent',
  result: RuntimeRouteResult | null = null,
): 'structured_call' | 'agent_loop' {
  const run = result?.run as { executor?: { execution_shape?: unknown } } | undefined;
  const shape = safeText(run?.executor?.execution_shape);
  if (shape === 'structured_call' || shape === 'agent_loop') return shape;
  return executorBackend === 'hermes_agent' ? 'agent_loop' : 'structured_call';
}

function resultOrStoredReviewRequestsFixHtml(request: RunDeliverableRouteRequest, result: RuntimeRouteResult): boolean {
  return artifactRequestsFixHtml(result.artifact)
    || artifactRequestsFixHtml(readStageArtifactForRequest(request, 'screenshot_review'));
}

function summarizeFixHtmlAttempt({
  request,
  result,
  dependencyRouteRuns,
  continuationRouteRuns,
  attemptIndex,
}: {
  request: RunDeliverableRouteRequest;
  result: RuntimeRouteResult;
  dependencyRouteRuns: DependencyRouteRun[];
  continuationRouteRuns: DependencyRouteRun[];
  attemptIndex: number;
}): FixHtmlEscalationAttempt {
  const adapter = runAdapter(request, result);
  const executorBackend = executorBackendForAdapter(adapter);
  const run = result.run as { run_id?: unknown; status?: unknown } | undefined;
  return {
    attempt_index: attemptIndex,
    route: 'fix_html',
    executor_backend: executorBackend,
    execution_shape: executionShapeForBackend(executorBackend, result),
    adapter,
    ok: result.ok === true,
    run_id: safeText(run?.run_id) || null,
    status: safeText(run?.status) || null,
    executed_route: runCurrentStage(result),
    review_requires_fix_html: resultOrStoredReviewRequestsFixHtml(request, result),
    dependency_route_runs: dependencyRouteRuns,
    continuation_route_runs: continuationRouteRuns,
  };
}

function attachExecutionProof(artifact: unknown, proof: FixHtmlExecutionProof): JsonObject {
  return artifact && typeof artifact === 'object' && !Array.isArray(artifact)
    ? {
        ...(artifact as JsonObject),
        execution_proof: proof as unknown as JsonObject,
      }
    : { execution_proof: proof as unknown as JsonObject };
}

function persistFixHtmlExecutionProof({
  request,
  result,
  proof,
}: {
  request: RunDeliverableRouteRequest;
  result: RuntimeRouteResult;
  proof: FixHtmlExecutionProof;
}): RuntimeRouteResult {
  const qualityBlockedAfterFix = safeText((result.run as { status?: unknown } | undefined)?.status) === 'quality_blocked';
  const explicitStopAfterStage = Boolean(safeText(request.stopAfterStage));
  const shouldReturnFixArtifact = qualityBlockedAfterFix || !explicitStopAfterStage;
  const hydrated = shouldReturnFixArtifact
    ? hydrateResultArtifactFromStage(request, result, 'fix_html')
    : result;
  const artifact = attachExecutionProof(hydrated.artifact, proof);
  if (hydrated.artifactFile) {
    writeFileSync(hydrated.artifactFile, JSON.stringify(artifact, null, 2), 'utf-8');
  }
  const resultArtifactFile = routeResultArtifactFile(result);
  if (resultArtifactFile && resultArtifactFile !== hydrated.artifactFile && existsSync(resultArtifactFile)) {
    writeFileSync(
      resultArtifactFile,
      JSON.stringify(attachExecutionProof(readJsonRecord(resultArtifactFile), proof), null, 2),
      'utf-8',
    );
  }
  const screenshotReviewArtifactFile = stageArtifactFileForRequest(request, 'screenshot_review');
  if (
    screenshotReviewArtifactFile
    && screenshotReviewArtifactFile !== hydrated.artifactFile
    && screenshotReviewArtifactFile !== resultArtifactFile
    && existsSync(screenshotReviewArtifactFile)
  ) {
    writeFileSync(
      screenshotReviewArtifactFile,
      JSON.stringify(attachExecutionProof(readJsonRecord(screenshotReviewArtifactFile), proof), null, 2),
      'utf-8',
    );
  }
  const persistedArtifact = hydrated.artifactFile && existsSync(hydrated.artifactFile)
    ? readJsonRecord(hydrated.artifactFile)
    : artifact;
  return {
    ...hydrated,
    ok: qualityBlockedAfterFix ? true : hydrated.ok,
    artifact: persistedArtifact,
  };
}

async function runFixHtmlAttempt(request: RunDeliverableRouteRequest): Promise<{
  result: RuntimeRouteResult;
  dependencyRouteRuns: DependencyRouteRun[];
  continuationRouteRuns: DependencyRouteRun[];
  recoveryTerminalReason: string | null;
}> {
  return await runRouteWithRecoveryAndContinuation(request);
}

export async function runFixHtmlWithAgenticEscalation(request: RunDeliverableRouteRequest): Promise<{
  result: RuntimeRouteResult;
  dependencyRouteRuns: DependencyRouteRun[];
  continuationRouteRuns: DependencyRouteRun[];
  recoveryTerminalReason: string | null;
  executionProof: FixHtmlExecutionProof;
}> {
  const stopAfterStage = safeText(request.stopAfterStage, 'screenshot_review');
  const initialAdapter = runAdapter(request);
  const firstRequest = {
    ...request,
    adapter: initialAdapter,
    stopAfterStage,
  };
  const first = await runFixHtmlAttempt(firstRequest);
  const attempts = [
    summarizeFixHtmlAttempt({
      request: firstRequest,
      result: first.result,
      dependencyRouteRuns: first.dependencyRouteRuns,
      continuationRouteRuns: first.continuationRouteRuns,
      attemptIndex: 1,
    }),
  ];

  let result = first.result;
  let dependencyRouteRuns = first.dependencyRouteRuns;
  let continuationRouteRuns = first.continuationRouteRuns;
  let recoveryTerminalReason = first.recoveryTerminalReason;
  let escalationStatus: FixHtmlExecutionProof['escalation_status'] = 'not_required';
  const shouldEscalate = resultOrStoredReviewRequestsFixHtml(firstRequest, first.result);

  if (
    shouldEscalate
    && executorBackendForAdapter(initialAdapter) !== 'hermes_agent'
    && hermesAgentLoopAvailable()
  ) {
    const escalationRequest = {
      ...firstRequest,
      adapter: HERMES_AGENT_LOOP_ADAPTER,
    };
    const escalated = await runFixHtmlAttempt(escalationRequest);
    const secondAttempt = summarizeFixHtmlAttempt({
      request: escalationRequest,
      result: escalated.result,
      dependencyRouteRuns: escalated.dependencyRouteRuns,
      continuationRouteRuns: escalated.continuationRouteRuns,
      attemptIndex: 2,
    });
    attempts.push(secondAttempt);
    result = escalated.result;
    dependencyRouteRuns = [...dependencyRouteRuns, ...escalated.dependencyRouteRuns];
    continuationRouteRuns = [...continuationRouteRuns, ...escalated.continuationRouteRuns];
    recoveryTerminalReason = escalated.recoveryTerminalReason;
    escalationStatus = secondAttempt.review_requires_fix_html
      ? 'escalated_still_requires_fix_html'
      : 'escalated';
  } else if (shouldEscalate) {
    escalationStatus = executorBackendForAdapter(initialAdapter) === 'hermes_agent'
      ? 'already_agent_loop'
      : 'escalation_unavailable';
  }

  const executionProof: FixHtmlExecutionProof = {
    proof_kind: 'fix_html_agentic_escalation',
    policy: 'structured_call_then_single_agent_loop_escalation',
    escalation_status: escalationStatus,
    stop_after_stage: stopAfterStage,
    attempts,
  };
  return {
    result: persistFixHtmlExecutionProof({
      request,
      result,
      proof: executionProof,
    }),
    dependencyRouteRuns: uniqueDependencyRouteRuns(dependencyRouteRuns),
    continuationRouteRuns,
    recoveryTerminalReason,
    executionProof,
  };
}
