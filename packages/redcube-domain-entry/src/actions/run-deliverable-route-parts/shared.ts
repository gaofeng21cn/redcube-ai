import { readFileSync } from 'node:fs';

import type { JsonObject } from '@redcube/overlay-core';
import type { RuntimeRunRouteResponse } from '@redcube/runtime';
import type { RouteRunResponse } from '../../types.js';

export type RuntimeRouteResult = RuntimeRunRouteResponse & {
  artifact?: unknown;
  artifactFile?: string;
  cache_status?: unknown;
};

export type DependencyRouteRun = {
  route: string;
  ok: boolean;
  run_id: string | null;
  status: string | null;
};

export type FixHtmlEscalationAttempt = {
  attempt_index: number;
  route: 'fix_html';
  executor_backend: 'codex_cli' | 'hermes_agent';
  execution_shape: 'structured_call' | 'agent_loop';
  adapter: string;
  ok: boolean;
  run_id: string | null;
  status: string | null;
  executed_route: string | null;
  review_requires_fix_html: boolean;
  dependency_route_runs: DependencyRouteRun[];
  continuation_route_runs: DependencyRouteRun[];
};

export type FixHtmlExecutionProof = {
  proof_kind: 'fix_html_agentic_escalation';
  policy: 'structured_call_then_single_agent_loop_escalation';
  escalation_status:
    | 'not_required'
    | 'escalated'
    | 'escalated_still_requires_fix_html'
    | 'escalation_unavailable'
    | 'already_agent_loop';
  stop_after_stage: string;
  attempts: FixHtmlEscalationAttempt[];
};

export type RouteRunDomainEntryResponse = Omit<RouteRunResponse, 'run' | 'summary'> & {
  run: RuntimeRunRouteResponse['run'];
  artifact?: unknown;
  dependency_route_runs?: DependencyRouteRun[];
  continuation_route_runs?: DependencyRouteRun[];
  execution_proof?: FixHtmlExecutionProof;
  summary: RouteRunResponse['summary'] & {
    cache_status: string;
    requested_route: string;
    executed_route: string;
    auto_recovered_dependency_routes: string[];
    continued_route_sequence: string[];
    stop_after_stage: string | null;
    recovery_terminal_reason: string | null;
    fix_html_escalation_status: FixHtmlExecutionProof['escalation_status'] | null;
  };
};

export const CODEX_STRUCTURED_ADAPTER = 'codex_cli';
export const HERMES_AGENT_LOOP_ADAPTER = 'hermes_agent';

export function readJsonRecord(file: string): JsonObject {
  return JSON.parse(readFileSync(file, 'utf-8')) as JsonObject;
}

export function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

export function routeResultErrorMessage(result: RuntimeRouteResult): string {
  const error = result.error as { message?: unknown } | undefined;
  const run = result.run as { error?: { message?: unknown } } | undefined;
  return safeText(error?.message || run?.error?.message);
}

export function routeResultArtifactFile(result: RuntimeRouteResult): string | null {
  const error = result.error as { artifact_file?: unknown } | undefined;
  const run = result.run as { error?: { artifact_file?: unknown } } | undefined;
  return safeText(result.artifactFile || error?.artifact_file || run?.error?.artifact_file) || null;
}

export function summarizeDependencyRoute(route: string, result: RuntimeRouteResult): DependencyRouteRun {
  const run = result.run as { run_id?: unknown; status?: unknown } | undefined;
  return {
    route,
    ok: result.ok === true,
    run_id: safeText(run?.run_id) || null,
    status: safeText(run?.status) || null,
  };
}

export function uniqueDependencyRouteRuns(entries: DependencyRouteRun[]): DependencyRouteRun[] {
  const seen = new Set<string>();
  const unique: DependencyRouteRun[] = [];
  for (const entry of entries) {
    const route = safeText(entry?.route);
    if (!route || seen.has(route)) continue;
    seen.add(route);
    unique.push(entry);
  }
  return unique;
}

export function runCurrentStage(result: RuntimeRouteResult): string | null {
  const run = result.run as { current_stage?: unknown } | undefined;
  return safeText(run?.current_stage) || null;
}
