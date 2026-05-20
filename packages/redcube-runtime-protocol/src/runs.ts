import type {
  CreateRunRecordInput,
  RerunLinkage,
  RunRecord,
  RunTelemetryEnvelope,
} from './types.js';

export const RUN_LOCATOR_ENVELOPE_BOUNDARY = Object.freeze({
  surface_kind: 'run_locator_envelope_boundary',
  boundary_contract_id: 'rca.run_locator_envelope_refs_only.v1',
  owner: 'redcube_ai',
  consumer: 'opl',
  role: 'run_locator_envelope_refs_only_adapter',
  classification: 'refs_only_read_model',
  refs_only: true,
  active_caller_status: 'domain_handler_and_opl_stage_runtime_run_locator_refs',
  owns_generic_runner: false,
  owns_generic_attempt_ledger: false,
  owns_generic_scheduler: false,
  owns_generic_session_runtime: false,
  writes_visual_truth: false,
  writes_artifact_blob: false,
  writes_memory_body: false,
  compatibility_alias_allowed: false,
  no_resurrection_gate: {
    generic_runner_owner_allowed: false,
    generic_attempt_ledger_owner_allowed: false,
    generic_runtime_owner_allowed: false,
  },
  exports_only: [
    'run_id',
    'route_ref',
    'topic_deliverable_locator_refs',
    'artifact_locator_refs',
    'telemetry_summary_refs',
  ],
});

function requireIdentity(name: string, value: unknown): string {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  return text;
}

function toNullableString(value: unknown): string | null {
  const text = String(value || '').trim();
  return text || null;
}

function toNonNegativeInteger(value: unknown): number {
  const numeric = Number.parseInt(String(value ?? 0), 10);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
}

function createRunTelemetryEnvelope({
  run_id,
  route,
  scope,
  target,
  overlay,
}: Pick<RunTelemetryEnvelope, 'run_id' | 'route' | 'scope' | 'target' | 'overlay'>): RunTelemetryEnvelope {
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

function createRerunLinkage(input: CreateRunRecordInput = {}): RerunLinkage {
  return {
    rerun_count: toNonNegativeInteger(input.rerunCount),
    previous_run_id: toNullableString(input.previousRunId),
    source_stage: toNullableString(input.sourceStage),
    blocking_review: toNullableString(input.blockingReview),
    baseline_deliverable_id: toNullableString(input.baselineDeliverableId),
  };
}

export function createRunRecord(input: CreateRunRecordInput = {}): RunRecord {
  const run_id = requireIdentity('runId', input.runId);
  const route = requireIdentity('route', input.route);
  const scope = requireIdentity('scope', input.scope);
  const target = requireIdentity('target', input.target);
  const overlay = requireIdentity('overlay', input.overlay);

  return {
    run_id,
    route,
    scope,
    target,
    overlay,
    topic_id: toNullableString(input.topicId),
    deliverable_id: toNullableString(input.deliverableId),
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
