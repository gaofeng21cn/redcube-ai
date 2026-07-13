// @ts-nocheck
import {
  buildStageReviewContextManifest,
  buildStageReviewReceipt,
  collectExecutionSessionRefs,
} from '@redcube/runtime-protocol';

const REPAIR_ROUTES = new Set(['repair_image_pages', 'repair_pptx_native', 'fix_html']);
const QUALITY_RUBRIC_REFS = Object.freeze([
  'agent/quality_gates/artifact_authority.md',
  'agent/quality_gates/review_export_memory.md',
  'agent/quality_gates/visual_authority_boundaries.md',
]);

const safeText = (value, fallback = '') => String(value || '').trim() || fallback;
const safeArray = (value) => Array.isArray(value) ? value : [];

export function buildPptStageReviewIsolation({
  deliverableId,
  contract,
  renderArtifact,
  reviewRoute,
  lineageRefs = [],
  priorFindingRefs = [],
}) {
  const attemptRole = REPAIR_ROUTES.has(safeText(renderArtifact?.route)) ? 're_reviewer' : 'reviewer';
  const reviewContextManifestRef = `rca-stage-review-context:ppt_deck:${safeText(deliverableId, 'deliverable')}:${reviewRoute}`;
  return {
    attemptRole,
    producerSessionRefs: collectExecutionSessionRefs(renderArtifact),
    qualityRoundIndex: attemptRole === 're_reviewer'
      ? Math.max(1, Number(renderArtifact?.stage_quality_attempt?.quality_round_index || 1))
      : 0,
    reviewContextManifestRef,
    reviewContextManifest: buildStageReviewContextManifest({
      stageRunRef: `rca-stage-run:artifact_creation:${safeText(deliverableId, 'deliverable')}`,
      reviewerAttemptRole: attemptRole,
      artifactRefs: safeArray(renderArtifact?.artifact_refs),
      sourceRefs: safeArray(contract?.source_truth?.source_refs || contract?.source_refs),
      qualityRubricRefs: QUALITY_RUBRIC_REFS,
      lineageRefs: [safeText(renderArtifact?.route), ...lineageRefs].filter(Boolean),
      priorFindingRefs,
    }),
  };
}

export function buildPptStageReviewReceipt({
  deliverableId,
  renderArtifact,
  generationRuntime,
  reviewIsolation,
  currentVisualStage,
  status,
  artifactRefs,
}) {
  const reviewerSessionRef = generationRuntime?.stage_quality_attempt?.execution_session_ref
    || generationRuntime?.session_id;
  if (reviewIsolation.producerSessionRefs.length === 0 || !reviewerSessionRef) return null;
  return buildStageReviewReceipt({
    stageRunRef: `rca-stage-run:artifact_creation:${safeText(deliverableId, 'deliverable')}`,
    producerAttemptRef: safeText(renderArtifact?.creative_execution?.generation_runtime?.run_id)
      || `rca-artifact:${safeText(currentVisualStage || renderArtifact?.route, 'visual_candidate')}`,
    reviewerAttemptRef: generationRuntime?.run_id,
    producerSessionRefs: reviewIsolation.producerSessionRefs,
    reviewerSessionRef,
    reviewedArtifactRefs: reviewIsolation.reviewContextManifest.exact_artifact_refs,
    reviewedArtifactHashes: reviewIsolation.reviewContextManifest.exact_artifact_hashes,
    rubricRefs: reviewIsolation.reviewContextManifest.quality_rubric_refs,
    contextManifestRef: reviewIsolation.reviewContextManifestRef,
    attemptRole: reviewIsolation.attemptRole,
    verdict: status === 'pass' ? 'pass' : 'repair_required',
    findingRefs: artifactRefs,
    routeBackStage: status === 'pass' ? null : 'artifact_creation',
  });
}
