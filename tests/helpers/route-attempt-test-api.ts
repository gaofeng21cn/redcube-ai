// @ts-nocheck
import { runDeliverableRoute as runDomainDeliverableRoute } from '@redcube/domain-entry';

function safeText(value) {
  return String(value || '').trim();
}

export function buildOplRouteAttemptIndexForTest(request) {
  const route = safeText(request?.route) || 'unknown_route';
  const runId = safeText(request?.runId)
    || `${safeText(request?.topicId) || 'topic'}/${safeText(request?.deliverableId) || 'deliverable'}/${route}`;
  const reviewRoute = ['visual_director_review', 'screenshot_review'].includes(route);
  const repairRoute = ['repair_image_pages', 'repair_pptx_native', 'fix_html'].includes(route);
  const attemptRole = safeText(request?.attemptRole)
    || (reviewRoute ? 'reviewer' : repairRoute ? 'repairer' : 'producer');
  return {
    surface_kind: 'cross_provider_attempt_index',
    version: 'cross-provider-attempt-index.v1',
    owner: 'one-person-lab',
    provider_attempt_owner: 'one-person-lab',
    domain_adapter_owner: 'redcube_ai',
    provider_attempt_ref: `opl-provider-attempt:test/redcube_ai/${runId}`,
    provider_attempt_ledger_ref: `attempt-ledger:opl/test/redcube_ai/${route}`,
    stage_attempt_ref: `opl-stage-attempt:test/redcube_ai/${runId}`,
    attempt_lease_ref: `opl-attempt-lease:test/redcube_ai/${runId}`,
    provider_attempt_ref_required: true,
    provider_attempt_ledger_ref_required: true,
    missing_provider_ledger_policy: 'fail_closed_typed_blocker_projection',
    local_session_ref_is_not_provider_attempt_ref: true,
    rca_does_not_own_provider_attempt_ledger: true,
    can_claim_current_without_provider_ledger: false,
    attempt_role: attemptRole,
    quality_round_index: Number(request?.qualityRoundIndex || 0),
    no_context_inheritance: reviewRoute,
    ...(reviewRoute ? {
      producer_session_ref: safeText(request?.producerSessionRef) || `codex://threads/test-producer/${safeText(request?.deliverableId) || 'deliverable'}`,
    } : {}),
  };
}

export async function runDeliverableRoute(request): Promise<any> {
  return runDomainDeliverableRoute({
    ...request,
    crossProviderAttemptIndex: request?.crossProviderAttemptIndex
      || request?.cross_provider_attempt_index
      || buildOplRouteAttemptIndexForTest(request),
  });
}
