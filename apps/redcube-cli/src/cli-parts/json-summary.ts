import type { JsonMap } from './types.js';

function compactArray(value: unknown): string[] {
  return Array.isArray(value)
    ? Array.from(new Set(value.map((item) => String(item || '').trim()).filter(Boolean)))
    : [];
}

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return null;
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function firstArray(...values: unknown[]): string[] {
  for (const value of values) {
    const list = compactArray(value);
    if (list.length > 0) return list;
  }
  return [];
}

export function buildCliJsonSummary(result: JsonMap = {}): JsonMap {
  const summary = result?.summary || {};
  const run = result?.run || {};
  const runTelemetry = result?.run_telemetry || run?.telemetry || result?.telemetry || {};
  const managedRun = result?.managed_run || {};
  const reviewExecution = result?.review_execution
    || result?.artifact?.review_execution
    || result?.artifact?.html_bundle?.render_execution
    || result?.artifact?.render_execution
    || {};
  const reviewPatch = result?.review_state_patch || result?.artifact?.review_state_patch || {};
  const continuation = result?.continuation_snapshot || result?.product_entry_surface?.continuation_snapshot || {};
  const recommendedAction = firstText(
    result?.recommended_action,
    summary?.recommended_action,
    result?.runtime_loop_closure?.control_policy?.continue_action?.action,
  );
  const nextAction = firstText(
    result?.next_action,
    summary?.next_action,
    recommendedAction,
  );

  return {
    ok: result?.ok === true,
    status: firstText(
      result?.status,
      summary?.status,
      run?.status,
      managedRun?.status,
      result?.runtime_supervision?.health_status,
      reviewPatch?.current_status,
    ),
    surface_kind: firstText(result?.surface_kind),
    route: firstText(result?.route, summary?.route, run?.route, runTelemetry?.route),
    run_id: firstText(
      result?.run_id,
      summary?.run_id,
      run?.run_id,
      runTelemetry?.run_id,
      continuation?.latest_run_id,
    ),
    managed_run_id: firstText(
      result?.managed_run_id,
      summary?.managed_run_id,
      managedRun?.managed_run_id,
      result?.runtime_supervision?.managed_run_id,
      continuation?.latest_managed_run_id,
    ),
    elapsed_ms: firstNumber(
      result?.elapsed_ms,
      result?.elapsed,
      summary?.elapsed_ms,
      runTelemetry?.elapsed_ms,
    ),
    latency_ms: firstNumber(
      result?.latency_ms,
      summary?.latency_ms,
      runTelemetry?.latency_ms,
      reviewExecution?.latency_ms,
    ),
    target_slide_ids: firstArray(
      result?.target_slide_ids,
      summary?.target_slide_ids,
      reviewExecution?.target_slide_ids,
      result?.artifact?.targeted_rerun?.target_slide_ids,
      runTelemetry?.slide_scope?.target_slide_ids,
    ),
    reviewed_slide_ids: firstArray(
      result?.reviewed_slide_ids,
      summary?.reviewed_slide_ids,
      reviewExecution?.reviewed_slide_ids,
      runTelemetry?.slide_scope?.reviewed_slide_ids,
    ),
    reused_slide_ids: firstArray(
      result?.reused_slide_ids,
      summary?.reused_slide_ids,
      reviewExecution?.reused_slide_ids,
      result?.artifact?.targeted_rerun?.reused_slide_ids,
      runTelemetry?.slide_scope?.reused_slide_ids,
    ),
    blocking_reasons: firstArray(
      result?.blocking_reasons,
      summary?.blocking_reasons,
      reviewPatch?.blocking_reasons,
      result?.runtime_supervision?.blocking_reasons,
    ),
    next_action: nextAction,
    recommended_action: recommendedAction,
    cache_status: firstText(
      result?.cache_status,
      summary?.cache_status,
      result?.artifact?.route_cache?.cache_status,
    ),
    artifact_file: firstText(
      result?.artifact_file,
      result?.artifactFile,
      summary?.artifact_file,
      result?.artifact?.artifact_file,
    ),
  };
}
