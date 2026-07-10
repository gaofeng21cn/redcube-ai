#!/usr/bin/env node
// @ts-nocheck
import { createHash } from 'node:crypto';

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasExactKeys(value, expectedKeys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function requireValue(condition, message) {
  if (!condition) throw new Error(`Invalid blind parity manifest: ${message}`);
}

function isSha256(value) {
  return /^[a-f0-9]{64}$/.test(String(value || ''));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort()
      .map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function assertSameSourceLock(contract, sourceLock) {
  const requiredFields = safeArray(contract?.benchmark_protocol?.same_source_lock?.required_fields);
  for (const field of Object.keys(sourceLock || {})) {
    requireValue(requiredFields.includes(field), `source_lock field ${field} is not allowed`);
  }
  for (const field of requiredFields) {
    requireValue(sourceLock?.[field] !== undefined && sourceLock?.[field] !== null, `source_lock.${field} is required`);
  }
  requireValue(String(sourceLock.material_bundle_ref || '').trim(), 'material_bundle_ref must be non-empty');
  requireValue(isSha256(sourceLock.material_bundle_sha256), 'material_bundle_sha256 must be a SHA-256');
  requireValue(Number.isInteger(sourceLock.page_count) && sourceLock.page_count > 0, 'page_count must be a positive integer');
  requireValue(String(sourceLock.audience || '').trim(), 'audience must be non-empty');
  requireValue(safeArray(sourceLock.brand_constraints).length > 0, 'brand_constraints must be non-empty');
  const editRequirements = safeArray(sourceLock.edit_requirements);
  const minimumEdits = Number(contract?.benchmark_protocol?.same_source_lock?.minimum_edit_requirement_count || 1);
  requireValue(editRequirements.length >= minimumEdits, `at least ${minimumEdits} edit requirement is required`);
  const taskIds = editRequirements.map((item) => String(item?.task_id || ''));
  requireValue(taskIds.every(Boolean) && new Set(taskIds).size === taskIds.length, 'edit task IDs must be non-empty and unique');
}

function assertAnonymousOutputs(contract, outputs) {
  const expectedCount = Number(contract?.benchmark_protocol?.anonymous_output_count || 2);
  requireValue(outputs.length === expectedCount, `exactly ${expectedCount} anonymous outputs are required`);
  const slotIds = outputs.map((output) => String(output?.slot_id || ''));
  requireValue(slotIds.every(Boolean) && new Set(slotIds).size === slotIds.length, 'slot IDs must be non-empty and unique');
  const allowedFields = new Set(safeArray(contract?.benchmark_protocol?.reviewer_visible_output_fields));
  for (const output of outputs) {
    for (const field of Object.keys(output || {})) {
      requireValue(allowedFields.has(field), `reviewer-visible output field ${field} is not allowed`);
    }
    requireValue(String(output.artifact_ref || '').trim(), 'artifact_ref must be non-empty');
    requireValue(String(output.render_manifest_ref || '').trim(), 'render_manifest_ref must be non-empty');
    requireValue(String(output.package_readback_ref || '').trim(), 'package_readback_ref must be non-empty');
    requireValue(isSha256(output.pptx_sha256), 'pptx_sha256 must be a SHA-256');
  }
}

function assertReviewerPacketIsBlind(contract, packet) {
  const serialized = JSON.stringify(packet).toLowerCase();
  for (const token of safeArray(contract?.benchmark_protocol?.forbidden_reviewer_identity_tokens)) {
    requireValue(!serialized.includes(String(token).toLowerCase()), `reviewer packet exposes provider token ${token}`);
  }
}

export function buildBlindParityReviewPacket({ contract, pairManifest }) {
  requireValue(
    pairManifest?.pair_manifest_kind === contract?.benchmark_protocol?.pair_manifest_kind,
    'pair_manifest_kind does not match the contract',
  );
  requireValue(String(pairManifest?.pair_id || '').trim(), 'pair_id must be non-empty');
  assertSameSourceLock(contract, pairManifest.source_lock);
  const outputs = safeArray(pairManifest.anonymous_outputs);
  assertAnonymousOutputs(contract, outputs);
  const packet = {
    schema_version: 1,
    review_packet_kind: 'ppt_same_source_blind_review',
    pair_id: pairManifest.pair_id,
    source_lock: clone(pairManifest.source_lock),
    anonymous_outputs: clone(outputs),
    review_dimensions: clone(contract.review_protocol.dimensions),
    score_scale: clone(contract.review_protocol.score_scale),
    critical_defects_required: contract.review_protocol.critical_defects_required === true,
  };
  assertReviewerPacketIsBlind(contract, packet);
  return {
    ...packet,
    review_packet_sha256: createHash('sha256').update(canonicalJson(packet)).digest('hex'),
  };
}


export function hashBlindParityReviewSet(reviews) {
  const ordered = clone(safeArray(reviews)).sort((left, right) => (
    String(left?.reviewer_id || '').localeCompare(String(right?.reviewer_id || ''))
    || String(left?.review_id || '').localeCompare(String(right?.review_id || ''))
  ));
  return createHash('sha256').update(canonicalJson(ordered)).digest('hex');
}

function candidateAuthority() {
  return {
    owner: 'RedCube AI',
    owner_verdict_claimed: false,
    can_sign_owner_receipt: false,
    owner_receipt_ref: null,
    candidate_only: true,
  };
}

function blockedEvidence(pairId, evidenceState, blockers) {
  return {
    schema_version: 1,
    evidence_kind: 'ppt_same_source_blind_parity_candidate',
    pair_id: pairId || null,
    status: 'blocked',
    evidence_state: evidenceState,
    blockers,
    authority: candidateAuthority(),
  };
}

function validateIdentityBinding(packet, binding, reviews) {
  const outputSlots = new Set(packet.anonymous_outputs.map((output) => output.slot_id));
  const baseValid = binding?.pair_id === packet.pair_id
    && binding?.review_packet_sha256 === packet.review_packet_sha256
    && String(binding?.sealed_binding_ref || '').trim()
    && binding?.revealed_after_scoring === true
    && outputSlots.has(binding?.candidate_slot_id)
    && outputSlots.has(binding?.reference_slot_id)
    && binding?.candidate_slot_id !== binding?.reference_slot_id;
  if (!baseValid) return { ok: false, code: 'invalid_or_missing_private_identity_binding' };
  if (!isSha256(binding?.review_set_sha256)
      || binding.review_set_sha256 !== hashBlindParityReviewSet(reviews)) {
    return { ok: false, code: 'review_set_binding_mismatch' };
  }
  return { ok: true, code: null };
}

function validBlindReview(contract, packet, review) {
  const dimensions = safeArray(contract?.review_protocol?.dimensions);
  const outputSlots = packet.anonymous_outputs.map((output) => output.slot_id);
  const scale = contract?.review_protocol?.score_scale || {};
  const serialized = JSON.stringify(review).toLowerCase();
  const exposesIdentity = safeArray(contract?.benchmark_protocol?.forbidden_reviewer_identity_tokens)
    .some((token) => serialized.includes(String(token).toLowerCase()));
  if (exposesIdentity
      || !hasExactKeys(review, [
        'review_id',
        'reviewer_id',
        'review_packet_sha256',
        'attestations',
        'scores',
        'critical_defects',
      ])
      || !hasExactKeys(review?.attestations, ['independent', 'provider_identity_unseen'])
      || !hasExactKeys(review?.scores, outputSlots)
      || !hasExactKeys(review?.critical_defects, outputSlots)
      || !String(review?.review_id || '').trim()
      || !String(review?.reviewer_id || '').trim()
      || review?.review_packet_sha256 !== packet.review_packet_sha256
      || review?.attestations?.independent !== true
      || review?.attestations?.provider_identity_unseen !== true) return false;
  return outputSlots.every((slotId) => (
    hasExactKeys(review?.scores?.[slotId], dimensions)
    && dimensions.every((dimension) => {
      const score = review?.scores?.[slotId]?.[dimension];
      return Number.isFinite(score) && score >= Number(scale.minimum) && score <= Number(scale.maximum);
    })
    && Array.isArray(review?.critical_defects?.[slotId])
  ));
}

function round(value) {
  return Number(value.toFixed(6));
}

function dimensionResults(contract, reviews, candidateSlotId, referenceSlotId) {
  const margin = Number(contract?.acceptance?.noninferiority_margin_percentage_points || 0);
  const multiplier = Number(contract?.acceptance?.confidence_multiplier || 1.96);
  return Object.fromEntries(safeArray(contract?.review_protocol?.dimensions).map((dimension) => {
    const differences = reviews.map((review) => (
      Number(review.scores[candidateSlotId][dimension])
      - Number(review.scores[referenceSlotId][dimension])
    ));
    const mean = differences.reduce((total, value) => total + value, 0) / differences.length;
    const variance = differences.length > 1
      ? differences.reduce((total, value) => total + ((value - mean) ** 2), 0) / (differences.length - 1)
      : 0;
    const standardError = Math.sqrt(variance) / Math.sqrt(differences.length);
    const lowerBound = mean - (multiplier * standardError);
    return [dimension, {
      sample_count: differences.length,
      mean_difference_percentage_points: round(mean),
      standard_error_percentage_points: round(standardError),
      lower_confidence_bound_percentage_points: round(lowerBound),
      noninferiority_floor_percentage_points: -margin,
      status: lowerBound >= -margin ? 'passed' : 'failed',
    }];
  }));
}

function criticalDefectRates(reviews, candidateSlotId, referenceSlotId) {
  const rate = (slotId) => reviews.filter((review) => review.critical_defects[slotId].length > 0).length / reviews.length;
  const candidate = round(rate(candidateSlotId));
  const reference = round(rate(referenceSlotId));
  return {
    candidate,
    reference,
    status: candidate <= reference ? 'passed' : 'failed',
  };
}

function evaluateEditRequirements(pairManifest, candidateSlotId, editTaskResults) {
  const expectedTaskIds = pairManifest.source_lock.edit_requirements.map((item) => item.task_id);
  const candidateResults = safeArray(editTaskResults)
    .filter((result) => result?.slot_id === candidateSlotId);
  const resultByTaskId = new Map();
  const duplicateTaskIds = [];
  for (const result of candidateResults) {
    if (resultByTaskId.has(result?.task_id)) duplicateTaskIds.push(result.task_id);
    resultByTaskId.set(result?.task_id, result);
  }
  const missingTaskIds = expectedTaskIds.filter((taskId) => !resultByTaskId.has(taskId));
  const invalidTaskIds = expectedTaskIds.filter((taskId) => {
    const result = resultByTaskId.get(taskId);
    if (!result) return false;
    if (!['passed', 'failed'].includes(result.status)) return true;
    return result.status === 'passed' && !isSha256(result.edited_artifact_sha256);
  });
  if (missingTaskIds.length > 0 || invalidTaskIds.length > 0 || duplicateTaskIds.length > 0) {
    return {
      complete: false,
      status: 'pending',
      expected_task_ids: expectedTaskIds,
      missing_task_ids: missingTaskIds,
      invalid_task_ids: invalidTaskIds,
      duplicate_task_ids: [...new Set(duplicateTaskIds)],
    };
  }
  const failedTaskIds = expectedTaskIds.filter((taskId) => resultByTaskId.get(taskId).status === 'failed');
  return {
    complete: true,
    status: failedTaskIds.length === 0 ? 'passed' : 'failed',
    expected_task_ids: expectedTaskIds,
    failed_task_ids: failedTaskIds,
    passed_task_ids: expectedTaskIds.filter((taskId) => !failedTaskIds.includes(taskId)),
  };
}

export function evaluateBlindPptParity({
  contract,
  pairManifest,
  identityBinding,
  reviews,
  editTaskResults,
}) {
  let packet;
  try {
    packet = buildBlindParityReviewPacket({ contract, pairManifest });
  } catch (error) {
    return blockedEvidence(pairManifest?.pair_id, 'invalid_pair_manifest', [{
      code: 'invalid_pair_manifest',
      detail: error instanceof Error ? error.message : String(error),
    }]);
  }
  const identityBindingValidation = validateIdentityBinding(packet, identityBinding, reviews);
  if (!identityBindingValidation.ok) {
    return blockedEvidence(packet.pair_id, 'pending_private_identity_binding', [{
      code: identityBindingValidation.code,
    }]);
  }
  const validReviews = safeArray(reviews).filter((review) => validBlindReview(contract, packet, review));
  const distinctReviewerCount = new Set(validReviews.map((review) => review.reviewer_id)).size;
  const minimumReviewers = Number(contract?.review_protocol?.minimum_independent_reviewers || 1);
  const minimumPairedScores = Number(contract?.review_protocol?.minimum_paired_scores_per_dimension || minimumReviewers);
  const minimumSample = Math.max(minimumReviewers, minimumPairedScores);
  if (validReviews.length !== safeArray(reviews).length) {
    return blockedEvidence(packet.pair_id, 'invalid_blind_review_evidence', [{
      code: 'invalid_or_identity_exposing_review_record',
      submitted_reviews: safeArray(reviews).length,
      valid_reviews: validReviews.length,
    }]);
  }
  if (distinctReviewerCount !== validReviews.length) {
    return blockedEvidence(packet.pair_id, 'invalid_blind_review_evidence', [{
      code: 'duplicate_reviewer_id',
      submitted_reviews: validReviews.length,
      distinct_reviewers: distinctReviewerCount,
    }]);
  }
  if (distinctReviewerCount < minimumSample) {
    return blockedEvidence(packet.pair_id, 'pending_independent_scoring', [{
      code: 'insufficient_independent_reviewers',
      actual: distinctReviewerCount,
      minimum: minimumSample,
      submitted_reviews: safeArray(reviews).length,
      valid_reviews: validReviews.length,
    }]);
  }
  const editRequirements = evaluateEditRequirements(
    pairManifest,
    identityBinding.candidate_slot_id,
    editTaskResults,
  );
  if (!editRequirements.complete) {
    return blockedEvidence(packet.pair_id, 'pending_edit_task_evidence', [{
      code: 'missing_edit_task_evidence',
      missing_task_ids: editRequirements.missing_task_ids,
      invalid_task_ids: editRequirements.invalid_task_ids,
      duplicate_task_ids: editRequirements.duplicate_task_ids,
    }]);
  }
  const dimensions = dimensionResults(
    contract,
    validReviews,
    identityBinding.candidate_slot_id,
    identityBinding.reference_slot_id,
  );
  const criticalRates = criticalDefectRates(
    validReviews,
    identityBinding.candidate_slot_id,
    identityBinding.reference_slot_id,
  );
  const failures = [];
  for (const [dimension, result] of Object.entries(dimensions)) {
    if (result.status === 'failed') failures.push({
      code: 'noninferiority_lower_bound_not_met',
      dimension,
      actual_lower_bound: result.lower_confidence_bound_percentage_points,
      required_floor: result.noninferiority_floor_percentage_points,
    });
  }
  if (criticalRates.status === 'failed') failures.push({
    code: 'candidate_critical_defect_rate_exceeds_reference',
    candidate_rate: criticalRates.candidate,
    reference_rate: criticalRates.reference,
  });
  if (editRequirements.status === 'failed') failures.push({
    code: 'candidate_edit_requirement_failed',
    failed_task_ids: editRequirements.failed_task_ids,
  });
  return {
    schema_version: 1,
    evidence_kind: 'ppt_same_source_blind_parity_candidate',
    pair_id: packet.pair_id,
    status: failures.length > 0 ? 'route_back_candidate' : 'pass_candidate',
    evidence_state: failures.length > 0 ? 'complete_route_back_evidence' : 'complete_candidate_evidence',
    review_packet_sha256: packet.review_packet_sha256,
    review_set_sha256: identityBinding.review_set_sha256,
    private_identity_binding_ref: identityBinding.sealed_binding_ref,
    review_sample: {
      independent_reviewer_count: distinctReviewerCount,
      minimum_required: minimumSample,
    },
    dimension_results: dimensions,
    critical_defect_rates: criticalRates,
    edit_requirements: editRequirements,
    failures,
    authority: candidateAuthority(),
  };
}
