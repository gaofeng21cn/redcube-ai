import { readFileSync } from 'node:fs';

import type { JsonObject } from '@redcube/overlay-core';
import type { RuntimeRunRouteResponse } from '@redcube/runtime';
import type { RouteRunResponse } from '../../types.js';

export type RuntimeRouteResult = RuntimeRunRouteResponse & {
  artifact?: unknown;
  artifactFile?: string;
  cache_status?: unknown;
};

export type RouteRunDomainEntryResponse = Omit<RouteRunResponse, 'run' | 'summary' | 'surface_kind'> & {
  surface_kind: 'route_run' | 'typed_blocker';
  return_shape?: 'typed_blocker';
  run: RuntimeRunRouteResponse['run'];
  artifact?: unknown;
  summary: RouteRunResponse['summary'] & {
    cache_status: string;
    requested_route: string;
    executed_route: string;
    route_selection_owner: 'codex_cli';
    programmatic_route_continuation: false;
    next_stage_may_start: boolean;
  };
};

export function readJsonRecord(file: string): JsonObject {
  return JSON.parse(readFileSync(file, 'utf-8')) as JsonObject;
}

export function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

export function routeResultArtifactFile(result: RuntimeRouteResult): string | null {
  const snakeCaseArtifactFile = (result as { artifact_file?: unknown }).artifact_file;
  const error = result.error as { artifact_file?: unknown } | undefined;
  const run = result.run as { error?: { artifact_file?: unknown } } | undefined;
  return safeText(result.artifactFile || snakeCaseArtifactFile || error?.artifact_file || run?.error?.artifact_file) || null;
}
