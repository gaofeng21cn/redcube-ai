function requireIdentity(name, value) {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  return text;
}

function toNullableString(value) {
  const text = String(value || '').trim();
  return text || null;
}

function toNonNegativeInteger(value) {
  const numeric = Number.parseInt(String(value ?? 0), 10);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
}

function createRunTelemetryEnvelope({
  run_id,
  route,
  scope,
  target,
  overlay,
}) {
  return {
    run_id,
    route,
    scope,
    target,
    overlay,
    executor_kind: null,
    execution_surface: null,
    status: 'running',
    started_at: null,
    finished_at: null,
    latency_ms: null,
    prompt_tokens: null,
    completion_tokens: null,
    estimated_cost: null,
  };
}

function createRerunLinkage(input = {}) {
  return {
    rerun_count: toNonNegativeInteger(input.rerunCount),
    previous_run_id: toNullableString(input.previousRunId),
    source_stage: toNullableString(input.sourceStage),
    blocking_review: toNullableString(input.blockingReview),
    baseline_deliverable_id: toNullableString(input.baselineDeliverableId),
  };
}

export function createRunRecord(input = {}) {
  const run_id = requireIdentity('runId', input.runId);
  const route = requireIdentity('route', input.route);
  const scope = requireIdentity('scope', input.scope);
  const target = requireIdentity('target', input.target);
  const overlay = requireIdentity('overlay', input.overlay);

  return {
    run_id,
    managed_run_id: toNullableString(input.managedRunId),
    route,
    scope,
    target,
    overlay,
    status: 'running',
    started_at: null,
    finished_at: null,
    current_stage: null,
    stage_results: [],
    artifact_refs: [],
    telemetry: createRunTelemetryEnvelope({
      run_id,
      route,
      scope,
      target,
      overlay,
    }),
    error_kind: null,
    rerun_linkage: createRerunLinkage(input),
    error: null,
  };
}
