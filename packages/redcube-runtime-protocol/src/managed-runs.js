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

function normalizeMode(value) {
  return String(value || '').trim() === 'stop_after_stage'
    ? 'stop_after_stage'
    : 'auto_to_terminal';
}

function normalizeAdapter(value) {
  const text = String(value || '').trim();
  if (!text || text === 'host_agent' || text === 'hermes') {
    return 'host_agent';
  }
  return text;
}

export function createManagedRunRecord(input = {}) {
  const managed_run_id = requireIdentity('managedRunId', input.managedRunId);
  const overlay = requireIdentity('overlay', input.overlay);
  const topic_id = requireIdentity('topicId', input.topicId);
  const deliverable_id = requireIdentity('deliverableId', input.deliverableId);
  const mode = normalizeMode(input.mode);
  const requested_adapter = normalizeAdapter(input.adapter);

  return {
    managed_run_id,
    overlay,
    topic_id,
    deliverable_id,
    status: 'running',
    mode,
    stop_after_stage: mode === 'stop_after_stage'
      ? requireIdentity('stopAfterStage', input.stopAfterStage)
      : null,
    user_intent: {
      request: toNullableString(input.userIntent),
    },
    adapter: toNullableString(input.adapter),
    requested_adapter,
    active_adapter: requested_adapter,
    adapter_switches: [],
    started_at: null,
    finished_at: null,
    current_stage: null,
    active_run_id: null,
    worker_running: false,
    runtime_liveness_audit: {
      status: 'none',
      checked_at: null,
      reason_code: 'managed_run_not_started',
    },
    runtime_health_status: 'degraded',
    parking_reason_code: null,
    requires_human_confirmation: false,
    requires_external_secret: false,
    route_runs: [],
    stage_results: [],
    latest_events: [],
    current_blockers: [],
    next_system_action: null,
    needs_user_decision: false,
    final_artifact_refs: [],
  };
}
