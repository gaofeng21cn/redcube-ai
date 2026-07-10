import path from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

import { resolveWorkspaceContract } from '@redcube/runtime-protocol';

type JsonRecord = Record<string, any>;

interface PerformanceReportInput {
  workspaceRoot: string;
  topicId?: string | null;
  deliverableId?: string | null;
}

function safeText(value: unknown, fallback = ''): string {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function safeArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function uniqueSorted(values: unknown[]): string[] {
  return [...new Set(values.map((value) => safeText(value)).filter(Boolean))].sort();
}

function increment(counter: JsonRecord, key: unknown, amount = 1): void {
  const normalized = safeText(key);
  if (!normalized) return;
  counter[normalized] = numberValue(counter[normalized]) + amount;
}

function addMetric(bucket: JsonRecord, key: string, value: unknown): void {
  const number = numberValue(value);
  if (number > 0) {
    bucket[key] = numberValue(bucket[key]) + number;
  }
}

function readJsonFile(file: string): JsonRecord | null {
  try {
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

function listFiles(root: string, predicate: (file: string) => boolean): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name))
    .filter(predicate)
    .sort();
}

function childCallsFromTelemetry(telemetry: JsonRecord): JsonRecord[] {
  return safeArray<JsonRecord>(telemetry?.child_calls || telemetry?.structured_calls)
    .filter((call) => call && typeof call === 'object');
}

function sumChildMetric(childCalls: JsonRecord[], key: string): number {
  return childCalls.reduce((total, call) => total + numberValue(call?.[key]), 0);
}

function metricWithChildFallback(telemetry: JsonRecord, childCalls: JsonRecord[], key: string): number {
  const direct = numberValue(telemetry?.[key]);
  return direct > 0 ? direct : sumChildMetric(childCalls, key);
}

function ensureRouteBucket(report: JsonRecord, route: string): JsonRecord {
  if (!report.routes[route]) {
    report.routes[route] = {
      count: 0,
      status_counts: {},
      latency_ms: 0,
      prompt_bytes: 0,
      context_bytes: 0,
      estimated_prompt_tokens: 0,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      provider_usage_missing_count: 0,
      review_scope_counts: {},
      cache_status_counts: {},
      blocked_checks: {},
      target_slide_ids: [],
      reviewed_slide_ids: [],
      reused_slide_ids: [],
      child_calls: {
        count: 0,
        prompt_bytes: 0,
        context_bytes: 0,
        estimated_prompt_tokens: 0,
        provider_usage_missing_count: 0,
      },
    };
  }
  return report.routes[route];
}

function collectTelemetrySlideIds(telemetry: JsonRecord, childCalls: JsonRecord[]): {
  target: string[];
  reviewed: string[];
  reused: string[];
} {
  const slideScope = telemetry?.slide_scope || {};
  return {
    target: uniqueSorted([
      ...safeArray(slideScope?.target_slide_ids),
      ...safeArray(telemetry?.target_slide_ids),
      ...childCalls.flatMap((call) => safeArray(call?.target_slide_ids)),
    ]),
    reviewed: uniqueSorted([
      ...safeArray(slideScope?.reviewed_slide_ids),
      ...safeArray(telemetry?.reviewed_slide_ids),
    ]),
    reused: uniqueSorted([
      ...safeArray(slideScope?.reused_slide_ids),
      ...safeArray(telemetry?.reused_slide_ids),
    ]),
  };
}

function addRun(report: JsonRecord, run: JsonRecord): void {
  const telemetry = (run?.telemetry && typeof run.telemetry === 'object') ? run.telemetry : {};
  const route = safeText(telemetry.route || run.route, 'unknown');
  const status = safeText(telemetry.status || run.status, 'unknown');
  const childCalls = childCallsFromTelemetry(telemetry);
  const bucket = ensureRouteBucket(report, route);
  const estimatedPromptTokens = metricWithChildFallback(telemetry, childCalls, 'estimated_prompt_tokens');

  bucket.count += 1;
  increment(bucket.status_counts, status);
  increment(bucket.review_scope_counts, telemetry.review_scope);
  increment(bucket.cache_status_counts, telemetry.cache_status);
  addMetric(bucket, 'latency_ms', telemetry.latency_ms);
  addMetric(bucket, 'prompt_bytes', metricWithChildFallback(telemetry, childCalls, 'prompt_bytes'));
  addMetric(bucket, 'context_bytes', metricWithChildFallback(telemetry, childCalls, 'context_bytes'));
  addMetric(bucket, 'estimated_prompt_tokens', estimatedPromptTokens);
  addMetric(bucket, 'prompt_tokens', metricWithChildFallback(telemetry, childCalls, 'prompt_tokens'));
  addMetric(bucket, 'completion_tokens', metricWithChildFallback(telemetry, childCalls, 'completion_tokens'));
  addMetric(bucket, 'total_tokens', metricWithChildFallback(telemetry, childCalls, 'total_tokens'));
  if (!telemetry.provider_usage) {
    bucket.provider_usage_missing_count += 1;
  }
  for (const check of safeArray(telemetry.blocked_checks)) {
    increment(bucket.blocked_checks, check);
  }
  const slideIds = collectTelemetrySlideIds(telemetry, childCalls);
  bucket.target_slide_ids = uniqueSorted([...bucket.target_slide_ids, ...slideIds.target]);
  bucket.reviewed_slide_ids = uniqueSorted([...bucket.reviewed_slide_ids, ...slideIds.reviewed]);
  bucket.reused_slide_ids = uniqueSorted([...bucket.reused_slide_ids, ...slideIds.reused]);

  bucket.child_calls.count += childCalls.length;
  addMetric(bucket.child_calls, 'prompt_bytes', sumChildMetric(childCalls, 'prompt_bytes'));
  addMetric(bucket.child_calls, 'context_bytes', sumChildMetric(childCalls, 'context_bytes'));
  addMetric(bucket.child_calls, 'estimated_prompt_tokens', sumChildMetric(childCalls, 'estimated_prompt_tokens'));
  for (const call of childCalls) {
    increment(bucket.review_scope_counts, call.review_scope);
    if (!call.provider_usage) {
      bucket.child_calls.provider_usage_missing_count += 1;
    }
  }

  report.totals.route_run_count += 1;
  addMetric(report.totals, 'latency_ms', telemetry.latency_ms);
  addMetric(report.totals, 'prompt_bytes', metricWithChildFallback(telemetry, childCalls, 'prompt_bytes'));
  addMetric(report.totals, 'context_bytes', metricWithChildFallback(telemetry, childCalls, 'context_bytes'));
  addMetric(report.totals, 'estimated_prompt_tokens', estimatedPromptTokens);
}

function runMatchesFilters(run: JsonRecord, topicId: string, deliverableId: string): boolean {
  if (topicId && safeText(run?.topic_id) !== topicId) return false;
  if (deliverableId && safeText(run?.deliverable_id) !== deliverableId) return false;
  return true;
}

function deliverableRoots(workspaceRoot: string, topicId: string, deliverableId: string): string[] {
  const topicsRoot = path.join(workspaceRoot, 'topics');
  if (!existsSync(topicsRoot)) return [];
  const topicIds = topicId
    ? [topicId]
    : readdirSync(topicsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const roots: string[] = [];
  for (const currentTopicId of topicIds) {
    const deliverablesRoot = path.join(topicsRoot, currentTopicId, 'deliverables');
    if (!existsSync(deliverablesRoot)) continue;
    const deliverableIds = deliverableId
      ? [deliverableId]
      : readdirSync(deliverablesRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    for (const currentDeliverableId of deliverableIds) {
      const root = path.join(deliverablesRoot, currentDeliverableId);
      if (existsSync(root)) roots.push(root);
    }
  }
  return roots.sort();
}

function addRenderBatch(report: JsonRecord, file: string): void {
  const payload = readJsonFile(file);
  if (!payload) return;
  report.render_batches.count += 1;
  increment(report.render_batches.cache_status_counts, payload.cache_status);
  addMetric(report.render_batches, 'estimated_prompt_tokens', payload?.generationRuntime?.estimated_prompt_tokens);
  for (const slideId of safeArray(payload.slide_ids)) {
    report.render_batches.slide_ids = uniqueSorted([...report.render_batches.slide_ids, slideId]);
  }
}

function addCaptureManifest(report: JsonRecord, file: string): void {
  const payload = readJsonFile(file);
  if (!payload) return;
  report.capture_manifests.count += 1;
  increment(report.capture_manifests.capture_mode_counts, payload.capture_mode || 'full');
  addMetric(report.capture_manifests, 'slide_count', payload.slide_count);
}

function addReviewHistory(report: JsonRecord, file: string): void {
  if (!existsSync(file)) return;
  const lines = readFileSync(file, 'utf-8').split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    let entry: JsonRecord;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    report.review_history.count += 1;
    const latestChecks = entry?.latest_checks || entry?.checks || {};
    for (const [check, value] of Object.entries(latestChecks)) {
      if (value === false) increment(report.review_history.blocked_checks, check);
    }
  }
}

export function buildPerformanceReport({
  workspaceRoot,
  topicId = null,
  deliverableId = null,
}: PerformanceReportInput): JsonRecord {
  const topicFilter = safeText(topicId);
  const deliverableFilter = safeText(deliverableId);
  const workspace = resolveWorkspaceContract({ workspaceRoot });
  const report: JsonRecord = {
    schema_version: 1,
    surface_kind: 'redcube_performance_report',
    workspace_root: workspace.workspaceRoot,
    filters: {
      topic_id: topicFilter || null,
      deliverable_id: deliverableFilter || null,
    },
    totals: {
      route_run_count: 0,
      latency_ms: 0,
      prompt_bytes: 0,
      context_bytes: 0,
      estimated_prompt_tokens: 0,
    },
    routes: {},
    render_batches: {
      count: 0,
      cache_status_counts: {},
      estimated_prompt_tokens: 0,
      slide_ids: [],
    },
    capture_manifests: {
      count: 0,
      capture_mode_counts: {},
      slide_count: 0,
    },
    review_history: {
      count: 0,
      blocked_checks: {},
    },
  };

  for (const file of listFiles(path.join(workspace.runtimeDir, 'runs'), (entry) => entry.endsWith('.json'))) {
    const run = readJsonFile(file);
    if (run && runMatchesFilters(run, topicFilter, deliverableFilter)) {
      addRun(report, run);
    }
  }

  for (const deliverableRoot of deliverableRoots(workspace.workspaceRoot, topicFilter, deliverableFilter)) {
    for (const file of listFiles(path.join(deliverableRoot, 'artifacts', 'render_batches'), (entry) => entry.endsWith('.json'))) {
      addRenderBatch(report, file);
    }
    for (const file of listFiles(path.join(deliverableRoot, 'reports', 'screenshots'), (entry) => path.basename(entry) === 'capture-manifest.json')) {
      addCaptureManifest(report, file);
    }
    addReviewHistory(report, path.join(deliverableRoot, 'reports', 'review-history.jsonl'));
  }

  return report;
}
