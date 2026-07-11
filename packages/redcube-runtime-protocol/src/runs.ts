import { createDomainRunRecord } from 'opl-framework/domain-task-runtime';

import type { CreateRunRecordInput, RunRecord } from './types.js';

export const RUN_LOCATOR_ENVELOPE_BOUNDARY = Object.freeze({
  surface_kind: 'run_locator_envelope_boundary',
  boundary_contract_id: 'rca.run_locator_envelope_refs_only.v1',
  owner: 'one-person-lab',
  consumer: 'redcube_ai',
  role: 'domain_route_projection_adapter',
  classification: 'refs_only_read_model',
  refs_only: true,
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

function text(value: unknown): string | null {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

export function createRunRecord(input: CreateRunRecordInput = {}): RunRecord {
  const runId = text(input.runId);
  const route = text(input.route);
  const scope = text(input.scope);
  const target = text(input.target);
  const overlay = text(input.overlay);
  if (!runId || !route || !scope || !target || !overlay) {
    throw new Error('runId, route, scope, target, overlay 不能为空');
  }
  const canonical = createDomainRunRecord({
    domain_id: 'redcube_ai',
    program_id: route,
    topic_id: text(input.topicId) ?? target,
    deliverable_id: text(input.deliverableId) ?? target,
    run_id: runId,
  }, {
    status: 'running',
    attempt: Number.parseInt(String(input.rerunCount ?? 0), 10) || 0,
    parent_run_id: text(input.previousRunId),
    metadata: { route, scope, target, overlay },
  });
  return {
    run_id: canonical.run_id,
    route,
    scope,
    target,
    overlay,
    topic_id: text(input.topicId),
    deliverable_id: text(input.deliverableId),
    status: 'running',
    started_at: null,
    finished_at: null,
    current_stage: null,
    stage_results: [],
    artifact_refs: [],
    telemetry: {
      run_id: canonical.run_id,
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
    },
    error_kind: null,
    rerun_linkage: {
      rerun_count: canonical.attempt,
      previous_run_id: canonical.parent_run_id,
      source_stage: text(input.sourceStage),
      blocking_review: text(input.blockingReview),
      baseline_deliverable_id: text(input.baselineDeliverableId),
    },
    error: null,
  };
}
