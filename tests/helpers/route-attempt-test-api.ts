// @ts-nocheck
import {
  dispatchDomainHandler,
  runDeliverableRoute as runDomainDeliverableRoute,
} from '@redcube/domain-entry';
import { persistReviewStatePatch } from '@redcube/governance';

const EXPORT_ROUTE_BY_OVERLAY = {
  ppt_deck: 'export_pptx',
  xiaohongshu: 'export_bundle',
  poster_onepager: 'export_bundle',
};

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
  const reviewAttempt = ['reviewer', 're_reviewer'].includes(attemptRole);
  const qualityRoundIndex = request?.qualityRoundIndex === undefined
    ? (['repairer', 're_reviewer'].includes(attemptRole) ? 1 : 0)
    : Number(request.qualityRoundIndex);
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
    missing_provider_ledger_policy: 'record_quality_debt_and_continue',
    local_session_ref_is_not_provider_attempt_ref: true,
    rca_does_not_own_provider_attempt_ledger: true,
    can_claim_current_without_provider_ledger: false,
    attempt_role: attemptRole,
    quality_round_index: qualityRoundIndex,
    no_context_inheritance: true,
    ...(reviewAttempt ? {
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

export async function prepareFormalPackageReviewEvidenceForTest({
  workspaceRoot,
  overlay,
  topicId = 'topic-a',
  deliverableId,
  attemptRole = 'reviewer',
  qualityRoundIndex = 0,
}) {
  const exportRoute = EXPORT_ROUTE_BY_OVERLAY[overlay];
  if (!exportRoute) throw new Error(`missing export route for ${overlay}`);
  const candidateAttemptRole = attemptRole === 're_reviewer' ? 'repairer' : 'producer';
  const exported = await runDeliverableRoute({
    workspaceRoot,
    overlay,
    topicId,
    deliverableId,
    route: exportRoute,
    attemptRole: candidateAttemptRole,
    qualityRoundIndex,
    runId: `${topicId}/${deliverableId}/package-and-handoff/${candidateAttemptRole}/${qualityRoundIndex}`,
  });
  if (exported?.ok !== true) throw new Error(`package export failed: ${JSON.stringify(exported)}`);

  const identityReceipt = exported.artifact?.artifact_identity_receipt;
  const identityReceiptRefs = exported.artifact?.artifact_identity_receipt_refs || [];
  const exactArtifactMetadata = identityReceipt?.exact_artifact_ref_metadata || [];
  if (identityReceipt?.surface_kind !== 'artifact_identity_receipt'
    || identityReceipt?.hash_metadata_complete !== true
    || !identityReceiptRefs.includes(identityReceipt?.receipt_ref)
    || exactArtifactMetadata.length === 0) {
    throw new Error(`package artifact identity receipt invalid: ${JSON.stringify(identityReceipt)}`);
  }

  const producerSessionRef = `codex://threads/test/${topicId}/${deliverableId}/${candidateAttemptRole}/${qualityRoundIndex}`;
  const reviewerSessionRef = `codex://threads/test/${topicId}/${deliverableId}/${attemptRole}/${qualityRoundIndex}`;
  const reviewReceiptRef = `opl-stage-review-receipt:redcube_ai:${topicId}:${deliverableId}:package_and_handoff:${attemptRole}:${qualityRoundIndex}`;
  const formalReviewReceipt = {
    surface_kind: 'opl_stage_review_receipt',
    version: 'stage-review-receipt.v1',
    stage_run_id: `stage-run:test/redcube_ai/${topicId}/${deliverableId}/package_and_handoff`,
    quality_cycle_id: `quality-cycle:test/redcube_ai/${topicId}/${deliverableId}/package_and_handoff`,
    producer_attempt_ref: `opl-stage-attempt:test/redcube_ai/${topicId}/${deliverableId}/package_and_handoff/${candidateAttemptRole}/${qualityRoundIndex}`,
    reviewer_attempt_ref: `opl-stage-attempt:test/redcube_ai/${topicId}/${deliverableId}/package_and_handoff/${attemptRole}/${qualityRoundIndex}`,
    producer_session_ref: producerSessionRef,
    reviewer_session_ref: reviewerSessionRef,
    no_context_inheritance: true,
    reviewed_artifact_refs: exactArtifactMetadata.map((entry) => entry.ref),
    reviewed_artifact_hashes: exactArtifactMetadata.map((entry) => entry.sha256),
    rubric_refs: ['agent/quality_gates/review_export_memory.md'],
    verdict: 'pass',
  };
  return {
    identityReceipt,
    identityReceiptRefs,
    exactArtifactMetadata,
    producerSessionRef,
    reviewerSessionRef,
    reviewReceiptRef,
    formalReviewReceipt,
    ownerReceiptTask: {
      action: 'emit_domain_owner_receipt',
      workspace_root: workspaceRoot,
      task_id: `${topicId}-${deliverableId}-${attemptRole}-${qualityRoundIndex}`,
      receipt_id: `${topicId}-${deliverableId}-${attemptRole}-${qualityRoundIndex}`,
      attempt_ref: formalReviewReceipt.reviewer_attempt_ref,
      artifact_locator_ref: identityReceipt.receipt_ref,
      memory_receipt_ref: `rca-memory-receipt:not-applicable:package-and-handoff:${deliverableId}`,
      lifecycle_receipt_ref: `rca-lifecycle-receipt:package-and-handoff:${deliverableId}`,
      review_export_ref: reviewReceiptRef,
      forbidden_write_proof_ref: `rca-forbidden-write-proof:package-and-handoff:${deliverableId}`,
      artifact_refs: exactArtifactMetadata.map((entry) => entry.ref),
      export_proof_refs: identityReceiptRefs,
      formal_review_receipt: formalReviewReceipt,
      artifact_identity_receipt: identityReceipt,
    },
  };
}

export async function applyFormalPackageReviewCloseoutForTest(options) {
  const evidence = await prepareFormalPackageReviewEvidenceForTest(options);
  const ownerReceiptDispatch = await dispatchDomainHandler({ task: evidence.ownerReceiptTask });
  const ownerReceipt = ownerReceiptDispatch?.result_surface;
  if (ownerReceipt?.ok !== true
    || ownerReceipt?.surface_kind !== 'domain_owner_receipt'
    || ownerReceipt?.formal_stage_review_binding?.status !== 'validated') {
    throw new Error(`formal package owner receipt invalid: ${JSON.stringify(ownerReceiptDispatch)}`);
  }
  return persistReviewStatePatch({
    workspaceRoot: options.workspaceRoot,
    topicId: options.topicId || 'topic-a',
    deliverableId: options.deliverableId,
    patch: {
      current_status: options.overlay === 'xiaohongshu' ? 'publish_ready' : 'export_ready',
      ready_for_export: true,
      latest_review_stage: EXPORT_ROUTE_BY_OVERLAY[options.overlay],
      pending_reviews: [],
      blocking_reasons: [],
      rerun_from_stage: null,
      handoff_review_closeout: {
        surface_kind: 'rca_handoff_review_closeout',
        status: 'pass',
        attempt_role: options.attemptRole || 'reviewer',
        reviewer_session_ref: evidence.reviewerSessionRef,
        producer_session_refs: [evidence.producerSessionRef],
        no_context_inheritance: true,
        artifact_identity_receipt_refs: evidence.identityReceiptRefs,
        reviewed_artifact_ref_metadata: evidence.exactArtifactMetadata,
        review_receipt_refs: [evidence.reviewReceiptRef],
        owner_receipt_refs: [ownerReceipt.receipt_ref],
        domain_owner_receipt: ownerReceipt,
      },
    },
  });
}
