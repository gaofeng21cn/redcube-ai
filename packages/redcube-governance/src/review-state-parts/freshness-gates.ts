// @ts-nocheck
import path from 'node:path';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import {
  canonicalStageForRoute,
  stageFolderArtifactPath,
  stageOrderForCanonicalStage,
} from '@redcube/runtime-protocol';

import {
  normalizeList,
  safeReadJson,
  safeText,
  uniqueList,
} from './state-io.js';

const DECISIVE_HANDOFF_REVIEW_ROLES = new Set(['reviewer', 're_reviewer']);

function refHashMetadata(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => ({
      ref: safeText(entry?.ref || entry?.uri),
      sha256: safeText(entry?.sha256),
    }))
    .filter((entry) => entry.ref && entry.sha256)
    .sort((left, right) => left.ref.localeCompare(right.ref));
}

function exactRefMetadata(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const ref = safeText(entry?.ref || entry?.uri);
      const sha256 = safeText(entry?.sha256);
      const sizeBytes = typeof entry?.size_bytes === 'number' ? entry.size_bytes : Number.NaN;
      return {
        ref,
        sha256,
        ...(Number.isInteger(sizeBytes) && sizeBytes >= 0 ? { size_bytes: sizeBytes } : {}),
      };
    })
    .filter((entry) => entry.ref && entry.sha256);
}

function reviewedRefHashMetadata(closeout) {
  const explicit = refHashMetadata(closeout?.reviewed_artifact_ref_metadata);
  if (explicit.length > 0) return explicit;
  const structuredHashes = refHashMetadata(closeout?.reviewed_artifact_hashes);
  if (structuredHashes.length > 0) return structuredHashes;
  const refs = normalizeList(closeout?.reviewed_artifact_refs);
  const hashes = normalizeList(closeout?.reviewed_artifact_hashes);
  if (refs.length === 0 || refs.length !== hashes.length) return [];
  return refs.map((ref, index) => ({ ref, sha256: hashes[index] }))
    .sort((left, right) => left.ref.localeCompare(right.ref));
}

function sameRefHashMetadata(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sameExactRefMetadata(left, right) {
  const canonical = (value) => exactRefMetadata(value)
    .sort((leftEntry, rightEntry) => leftEntry.ref.localeCompare(rightEntry.ref));
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

function currentArtifactIdentityReasons(metadata) {
  const reasons = [];
  for (const entry of metadata) {
    if (!existsSync(entry.ref) || !statSync(entry.ref).isFile()) {
      reasons.push('candidate_artifact_ref_missing');
      continue;
    }
    const currentBody = readFileSync(entry.ref);
    const currentHash = createHash('sha256').update(currentBody).digest('hex');
    if (currentHash !== entry.sha256) reasons.push('candidate_artifact_hash_changed_after_review');
    if (Number.isInteger(entry.size_bytes) && currentBody.length !== entry.size_bytes) {
      reasons.push('candidate_artifact_size_changed_after_review');
    }
  }
  return uniqueList(reasons);
}

export function evaluateDecisiveHandoffReview({ deliveryArtifact, reviewState }) {
  const candidateReceipt = deliveryArtifact?.artifact_identity_receipt || null;
  const candidateReceiptRefs = normalizeList(deliveryArtifact?.artifact_identity_receipt_refs);
  const rawCandidateMetadata = Array.isArray(candidateReceipt?.exact_artifact_ref_metadata)
    ? candidateReceipt.exact_artifact_ref_metadata
    : [];
  const candidateExactMetadata = exactRefMetadata(rawCandidateMetadata);
  const candidateMetadata = refHashMetadata(candidateExactMetadata);
  const closeout = reviewState?.handoff_review_closeout || null;
  const reviewedMetadata = reviewedRefHashMetadata(closeout);
  const reasons = [];
  const role = safeText(closeout?.attempt_role || closeout?.stage_quality_attempt?.attempt_role);
  const reviewerSessionRef = safeText(
    closeout?.reviewer_session_ref
      || closeout?.stage_quality_attempt?.reviewer_session_ref
      || closeout?.stage_quality_attempt?.execution_session_ref,
  );
  const producerSessionRefs = uniqueList([
    ...normalizeList(closeout?.producer_session_refs),
    safeText(closeout?.producer_session_ref),
    ...normalizeList(closeout?.stage_quality_attempt?.producer_session_refs),
    safeText(closeout?.stage_quality_attempt?.producer_session_ref),
  ]);
  const noContextInheritance = closeout?.no_context_inheritance
    ?? closeout?.stage_quality_attempt?.no_context_inheritance;
  const reviewReceiptRefs = uniqueList([
    ...normalizeList(closeout?.review_receipt_refs),
    safeText(closeout?.review_receipt_ref),
  ]);
  const ownerReceiptRefs = uniqueList([
    ...normalizeList(closeout?.owner_receipt_refs),
    safeText(closeout?.owner_receipt_ref),
  ]);
  const boundCandidateReceiptRefs = uniqueList([
    ...normalizeList(closeout?.artifact_identity_receipt_refs),
    safeText(closeout?.artifact_identity_receipt_ref),
  ]);
  const ownerReceipt = closeout?.domain_owner_receipt || closeout?.owner_receipt || null;
  const ownerBinding = ownerReceipt?.formal_stage_review_binding || null;
  const formalReviewReceipt = ownerBinding?.formal_review_receipt || null;
  const formalReviewMetadata = reviewedRefHashMetadata({
    reviewed_artifact_refs: formalReviewReceipt?.reviewed_artifact_refs,
    reviewed_artifact_hashes: formalReviewReceipt?.reviewed_artifact_hashes,
  });

  if (!candidateReceipt || safeText(candidateReceipt?.surface_kind) !== 'artifact_identity_receipt') {
    reasons.push('candidate_artifact_identity_receipt_missing');
  }
  if (candidateReceipt?.hash_metadata_complete !== true || candidateMetadata.length === 0) {
    reasons.push('candidate_exact_hash_metadata_incomplete');
  }
  if (rawCandidateMetadata.length !== candidateExactMetadata.length
    || candidateExactMetadata.some((entry) => !Number.isInteger(entry.size_bytes))) {
    reasons.push('candidate_exact_size_metadata_incomplete');
  }
  reasons.push(...currentArtifactIdentityReasons(candidateExactMetadata));
  if (candidateReceiptRefs.length === 0
    || !candidateReceiptRefs.includes(safeText(candidateReceipt?.receipt_ref))) {
    reasons.push('candidate_artifact_identity_receipt_ref_missing');
  }
  if (!closeout || safeText(closeout?.surface_kind) !== 'rca_handoff_review_closeout') {
    reasons.push('decisive_handoff_review_closeout_missing');
  }
  if (safeText(closeout?.status || closeout?.verdict) !== 'pass') {
    reasons.push('decisive_handoff_review_not_passed');
  }
  if (safeText(deliveryArtifact?.status) === 'completed_with_quality_debt'
    || deliveryArtifact?.quality_debt?.blocks_ready_claims === true) {
    reasons.push('delivery_artifact_quality_debt_blocks_ready_claim');
  }
  if (!DECISIVE_HANDOFF_REVIEW_ROLES.has(role)) {
    reasons.push('decisive_attempt_role_invalid');
  }
  if (noContextInheritance !== true) {
    reasons.push('review_context_isolation_missing');
  }
  if (!reviewerSessionRef || producerSessionRefs.length === 0) {
    reasons.push('review_session_lineage_missing');
  } else if (producerSessionRefs.includes(reviewerSessionRef)) {
    reasons.push('reviewer_session_matches_producer_session');
  }
  if (reviewReceiptRefs.length === 0) {
    reasons.push('stage_review_receipt_ref_missing');
  }
  if (ownerReceiptRefs.length === 0) {
    reasons.push('domain_owner_receipt_ref_missing');
  }
  if (!ownerReceipt || safeText(ownerReceipt?.surface_kind) !== 'domain_owner_receipt') {
    reasons.push('domain_owner_receipt_body_missing');
  } else if (!ownerReceiptRefs.includes(safeText(ownerReceipt?.receipt_ref))) {
    reasons.push('domain_owner_receipt_ref_not_bound_to_body');
  }
  if (!ownerBinding || safeText(ownerBinding?.status) !== 'validated') {
    reasons.push('domain_owner_formal_review_binding_missing');
  }
  if (safeText(ownerBinding?.artifact_identity_receipt_ref) !== safeText(candidateReceipt?.receipt_ref)) {
    reasons.push('domain_owner_receipt_not_bound_to_candidate_identity');
  }
  if (!sameExactRefMetadata(candidateExactMetadata, ownerBinding?.exact_artifact_ref_metadata)) {
    reasons.push('domain_owner_receipt_hashes_do_not_match_candidate');
  }
  if (!formalReviewReceipt
    || safeText(formalReviewReceipt?.surface_kind) !== 'opl_stage_review_receipt'
    || safeText(formalReviewReceipt?.version) !== 'stage-review-receipt.v1'
    || safeText(formalReviewReceipt?.verdict) !== 'pass') {
    reasons.push('formal_stage_review_receipt_not_passed');
  }
  if (formalReviewReceipt?.no_context_inheritance !== true
    || !safeText(formalReviewReceipt?.producer_session_ref)
    || !safeText(formalReviewReceipt?.reviewer_session_ref)
    || safeText(formalReviewReceipt?.producer_session_ref) === safeText(formalReviewReceipt?.reviewer_session_ref)) {
    reasons.push('formal_stage_review_receipt_isolation_invalid');
  }
  if (!reviewReceiptRefs.includes(safeText(ownerBinding?.formal_review_receipt_ref))) {
    reasons.push('formal_stage_review_receipt_ref_not_bound');
  }
  if (!sameRefHashMetadata(candidateMetadata, formalReviewMetadata)) {
    reasons.push('formal_stage_review_hashes_do_not_match_candidate');
  }
  if (!boundCandidateReceiptRefs.includes(safeText(candidateReceipt?.receipt_ref))) {
    reasons.push('review_not_bound_to_candidate_identity_receipt');
  }
  if (!sameRefHashMetadata(candidateMetadata, reviewedMetadata)) {
    reasons.push('reviewed_artifact_hashes_do_not_match_candidate');
  }

  const passed = reasons.length === 0;
  return {
    passed,
    ready_claim_authorized: passed,
    reasons: uniqueList(reasons),
    attempt_role: role || null,
    reviewer_session_ref: reviewerSessionRef || null,
    producer_session_refs: producerSessionRefs,
    candidate_artifact_identity_receipt_refs: candidateReceiptRefs,
    reviewed_artifact_ref_metadata: reviewedMetadata,
    owner_receipt_refs: ownerReceiptRefs,
    review_receipt_refs: reviewReceiptRefs,
    formal_stage_review_binding: ownerBinding,
  };
}

export function stageArtifactPath(contract, deliverablePaths, stageId) {
  const stage = Array.isArray(contract?.stage_sequence?.stages)
    ? contract.stage_sequence.stages.find((item) => item?.stage_id === stageId)
    : null;
  const artifactName = safeText(stage?.output_artifact, `${stageId}.json`);
  const canonicalStageId = canonicalStageForRoute(stageId);
  return stageFolderArtifactPath({
    deliverablePaths,
    domainId: 'redcube_ai',
    programId: safeText(deliverablePaths.programId),
    topicId: safeText(deliverablePaths.topicId),
    deliverableId: deliverablePaths.deliverableId,
    routeStageId: stageId,
    canonicalStageId,
    stageOrder: stageOrderForCanonicalStage(canonicalStageId),
    outputName: artifactName,
  });
}

function stageSequence(contract) {
  return Array.isArray(contract?.stage_sequence?.stages)
    ? contract.stage_sequence.stages
      .map((stage) => safeText(stage?.stage_id))
      .filter(Boolean)
    : [];
}

function stageIndex(contract, stageId) {
  const sequence = stageSequence(contract);
  return sequence.indexOf(safeText(stageId));
}

function safeMtimeMs(file) {
  if (!safeText(file) || !existsSync(file)) {
    return 0;
  }
  try {
    return Number(statSync(file).mtimeMs || 0);
  } catch {
    return 0;
  }
}

export function derivePreExportReviewFreshness({ contract, deliverablePaths, reviewState }) {
  const requiredExportRoute = safeText(contract?.delivery_contract?.required_export_route);
  if (!requiredExportRoute) {
    return {
      export_artifact_file: null,
      export_artifact_mtime_ms: 0,
      stale: true,
      stale_reasons: ['missing_required_export_route'],
    };
  }

  const exportArtifactFile = stageArtifactPath(contract, deliverablePaths, requiredExportRoute);
  const exportArtifactMtimeMs = safeMtimeMs(exportArtifactFile);
  if (!exportArtifactMtimeMs) {
    return {
      export_artifact_file: exportArtifactFile,
      export_artifact_mtime_ms: 0,
      stale: true,
      stale_reasons: ['missing_export_artifact'],
    };
  }

  const exportRouteIndex = stageIndex(contract, requiredExportRoute);
  const latestReviewStage = safeText(reviewState?.latest_review_stage);
  const latestReviewStageIndex = stageIndex(contract, latestReviewStage);
  const staleReasons = [];
  const deliveryArtifact = safeReadJson(exportArtifactFile);
  const handoffReview = evaluateDecisiveHandoffReview({ deliveryArtifact, reviewState });

  if (!reviewState?.ready_for_export) {
    staleReasons.push('review_state_not_ready_for_export');
  }
  if (safeText(reviewState?.current_status) === 'blocked_for_revision') {
    staleReasons.push('review_state_blocked_for_revision');
  }
  if (!handoffReview.passed) {
    staleReasons.push(...handoffReview.reasons.map((reason) => `handoff_review:${reason}`));
  }
  if (latestReviewStage && latestReviewStageIndex !== -1 && latestReviewStageIndex < exportRouteIndex) {
    staleReasons.push(`latest_review_stage_before_${requiredExportRoute}`);
  }

  let newestUpstreamStage = null;
  let newestUpstreamMtimeMs = 0;
  for (const stageId of stageSequence(contract)) {
    const stageOrder = stageIndex(contract, stageId);
    if (stageOrder === -1 || stageOrder >= exportRouteIndex) continue;
    const artifactMtimeMs = safeMtimeMs(stageArtifactPath(contract, deliverablePaths, stageId));
    if (artifactMtimeMs > newestUpstreamMtimeMs) {
      newestUpstreamMtimeMs = artifactMtimeMs;
      newestUpstreamStage = stageId;
    }
  }
  if (newestUpstreamMtimeMs > exportArtifactMtimeMs) {
    staleReasons.push(`upstream_stage_newer_than_${requiredExportRoute}:${newestUpstreamStage}`);
  }

  return {
    export_artifact_file: exportArtifactFile,
    export_artifact_mtime_ms: exportArtifactMtimeMs,
    newest_upstream_stage: newestUpstreamStage,
    newest_upstream_mtime_ms: newestUpstreamMtimeMs,
    handoff_review: handoffReview,
    stale: staleReasons.length > 0,
    stale_reasons: staleReasons,
  };
}

export function buildQualitySummary(state) {
  const relativeQuality = state?.baseline?.relative_quality || null;
  return {
    relative_quality_verdict: relativeQuality?.verdict || null,
    degradations: Array.isArray(relativeQuality?.degradations) ? relativeQuality.degradations : [],
    improvements: Array.isArray(relativeQuality?.improvements) ? relativeQuality.improvements : [],
    acceptable_changes: Array.isArray(relativeQuality?.acceptable_changes) ? relativeQuality.acceptable_changes : [],
    baseline_promotion_state: state?.baseline?.promotion_state || null,
    promoted_reference_id: state?.baseline?.promoted_reference_id || null,
  };
}

export function buildGateSummary({
  sourceReadinessSummary,
  reviewState,
  contract,
  publicationProjectionEntry,
  operatorHandoff,
}) {
  return {
    source_readiness_status: sourceReadinessSummary?.status || null,
    source_planning_ready: sourceReadinessSummary?.planning_ready === true,
    source_sufficiency_status: safeText(sourceReadinessSummary?.sufficiency_status) || null,
    source_deep_research_state: safeText(sourceReadinessSummary?.deep_research_state) || null,
    source_blocking_evidence_gaps: uniqueList(sourceReadinessSummary?.blocking_evidence_gaps),
    source_next_required_surface: safeText(sourceReadinessSummary?.next_required_surface) || null,
    review_status: safeText(reviewState?.current_status) || null,
    approval_status: safeText(reviewState?.approval_state?.status) || null,
    latest_review_stage: safeText(reviewState?.latest_review_stage) || null,
    export_status: reviewState ? (reviewState.ready_for_export ? 'ready' : 'not_ready') : null,
    required_export_route: safeText(contract?.delivery_contract?.required_export_route) || null,
    required_export_bundle_id: safeText(
      contract?.delivery_contract?.required_export_bundle_id || contract?.export_bundle?.bundle_id,
    ) || null,
    approval_required: Boolean(contract?.delivery_contract?.human_gate?.required),
    delivery_projection_current: safeText(publicationProjectionEntry?.current) || null,
    delivery_projection_next: safeText(publicationProjectionEntry?.next) || null,
    operator_handoff_status: safeText(operatorHandoff?.gate_status) || null,
    delivery_state_owner: safeText(operatorHandoff?.delivery_state_owner) || null,
  };
}

export function buildSourceReadinessReport(summary) {
  if (!summary) {
    return {
      status: 'pass',
      issues: [],
      rerun_from_stage: null,
      recommended_action: 'continue',
    };
  }

  if (summary.status === 'missing') {
    return {
      status: 'quality_debt',
      issues: uniqueList(summary.blocking_reasons).length > 0
        ? uniqueList(summary.blocking_reasons)
        : ['source_readiness_missing'],
      rerun_from_stage: 'source_readiness',
      recommended_action: 'run_source_research',
      blocks_stage_transition: false,
      blocks_ready_claims: true,
    };
  }

  if (summary.status !== 'pass') {
    return {
      status: 'quality_debt',
      issues: summary.status === 'invalid'
        ? (uniqueList(summary.blocking_reasons).length > 0
            ? uniqueList(summary.blocking_reasons)
            : ['source_readiness_invalid'])
        : ['source_readiness_not_planning_ready', ...uniqueList(summary.blocking_evidence_gaps)],
      rerun_from_stage: 'source_readiness',
      recommended_action: 'run_source_research',
      blocks_stage_transition: false,
      blocks_ready_claims: true,
    };
  }

  return {
    status: 'pass',
    issues: [],
    rerun_from_stage: null,
    recommended_action: 'continue',
  };
}
