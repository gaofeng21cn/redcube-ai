import { buildVisualReviewRefProjection } from '@redcube/runtime';

type AnyRecord = Record<string, any>;

export const RUNTIME_WATCH_BOUNDARY = Object.freeze({
  surface_kind: 'runtime_watch_boundary',
  boundary_contract_id: 'rca.runtime_watch_refs_only_projection.v1',
  owner: 'redcube_ai',
  consumer: 'opl',
  role: 'visual_review_artifact_blocker_owner_evidence_refs_projection',
  classification: 'retained_current_refs_only_boundary',
  refs_only: true,
  read_only: true,
  active_caller_status: 'direct_review_watch_and_opl_operator_projection_target',
  generic_supervisor_owner: 'opl',
  generic_session_shell_owner: 'opl',
  owns_generic_supervisor: false,
  owns_generic_runner: false,
  owns_generic_attempt_ledger: false,
  owns_generic_session_runtime: false,
  owns_generic_workbench: false,
  writes_visual_truth: false,
  writes_artifact_blob: false,
  writes_memory_body: false,
  declares_visual_ready: false,
  declares_exportable: false,
  declares_handoffable: false,
  declares_production_soak_complete: false,
  compatibility_alias_allowed: false,
  no_resurrection_gate: {
    generic_supervisor_owner_allowed: false,
    generic_runtime_owner_allowed: false,
    generic_session_runtime_owner_allowed: false,
    default_supervision_route_allowed: false,
  },
  exports_only: [
    'delivery_locator_refs',
    'artifact_locator_refs',
    'review_state_refs',
    'typed_blocker_refs',
    'owner_evidence_refs',
    'visual_review_semantics',
  ],
});

function buildGenericRuntimeInputMovedBlocker(request: AnyRecord) {
  const runId = String(request?.runId || request?.run?.run_id || '').trim() || null;
  return {
    surface_kind: 'typed_blocker',
    blocker_kind: 'generic_runtime_watch_input_moved_to_opl',
    typed_blocker_ref: `rca-typed-blocker:runtime-watch-input-moved-to-opl:${runId || 'unscoped'}`,
    run_id: runId,
    reason: 'RCA runtimeWatch no longer accepts generic run status or attempt input.',
    accepted_input: 'workspace_topic_deliverable_visual_review_locator',
    required_refs: [
      'opl_stage_attempt_ref',
      'provider_attempt_ref',
      'provider_attempt_ledger_ref',
    ],
    owner_boundary: {
      generic_stage_attempt_owner: 'one-person-lab',
      generic_provider_attempt_ledger_owner: 'one-person-lab',
      rca_local_route_run_record_store_retired: true,
      rca_owns_generic_runtime_record_store: false,
      rca_owns_generic_attempt_ledger: false,
    },
    next_required_owner_action: 'read_generic_runtime_status_from_opl_console_runway_or_ledger',
  };
}

function genericRuntimeInputMovedError(request: AnyRecord): Error {
  const blocker = buildGenericRuntimeInputMovedBlocker(request);
  const error = new Error(
    'RCA runtimeWatch only projects visual review refs; read generic run status from OPL Console, Runway, or Ledger.',
  ) as Error & Record<string, unknown>;
  error.surface_kind = 'typed_blocker';
  error.blocker_kind = blocker.blocker_kind;
  error.typed_blocker = blocker;
  error.owner_boundary = blocker.owner_boundary;
  return error;
}

export async function runtimeWatch(request: AnyRecord) {
  if (request?.run !== undefined || request?.runId !== undefined) {
    throw genericRuntimeInputMovedError(request);
  }
  const response = buildVisualReviewRefProjection(request);
  return {
    ...response,
    owner_boundary: RUNTIME_WATCH_BOUNDARY,
  };
}
