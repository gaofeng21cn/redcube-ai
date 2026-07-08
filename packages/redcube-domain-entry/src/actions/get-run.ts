import type { RunRecordResponse, WorkspaceRootRequest } from '../types.js';
import { requireSafeSegment } from './action-utils.js';

function buildRunLookupRetiredBlocker(runId: string) {
  return {
    surface_kind: 'typed_blocker',
    blocker_kind: 'rca_local_route_run_lookup_retired',
    typed_blocker_ref: `rca-typed-blocker:route-run-lookup-retired:${runId}`,
    run_id: runId,
    reason: 'RCA-local route-run lookup has been retired.',
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
    next_required_owner_action: 'read_opl_stage_attempt_or_provider_ledger_refs',
  };
}

function routeRunLookupRetiredError(runId: string): Error {
  const blocker = buildRunLookupRetiredBlocker(runId);
  const error = new Error(
    'RCA-local route-run lookup is retired; use OPL stage attempt and provider ledger refs.',
  ) as Error & Record<string, unknown>;
  error.surface_kind = 'typed_blocker';
  error.blocker_kind = blocker.blocker_kind;
  error.typed_blocker = blocker;
  error.owner_boundary = blocker.owner_boundary;
  return error;
}

export async function getRun({
  runId,
}: WorkspaceRootRequest & { runId: string }): Promise<RunRecordResponse> {
  throw routeRunLookupRetiredError(requireSafeSegment('runId', runId));
}
