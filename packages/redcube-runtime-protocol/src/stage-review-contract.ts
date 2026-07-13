// @ts-nocheck
import crypto from 'node:crypto';
import fs from 'node:fs';

const REVIEW_ROLES = new Set(['reviewer', 're_reviewer']);
const ATTEMPT_ROLES = new Set(['producer', 'reviewer', 'repairer', 're_reviewer']);

function safeText(value) {
  return String(value || '').trim();
}

function unique(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => safeText(value)).filter(Boolean))];
}

function executionSessionRef(value) {
  const session = safeText(value);
  if (!session) return '';
  return session.includes('://') ? session : `codex://threads/${session}`;
}

function hashFile(file) {
  const resolved = safeText(file);
  if (!resolved || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(resolved)).digest('hex');
}

export const RCA_STAGE_QUALITY_ATTEMPT_ROLES = Object.freeze([...ATTEMPT_ROLES]);
export const RCA_MAX_QUALITY_REPAIR_ROUNDS = 3;

export function collectExecutionSessionRefs(value) {
  const sessions = new Set();
  const visit = (entry, key = '') => {
    if (!entry) return;
    if (Array.isArray(entry)) {
      entry.forEach((item) => visit(item, key));
      return;
    }
    if (typeof entry !== 'object') {
      if (['session_id', 'session_ref', 'execution_session_ref'].includes(key)) {
        const ref = executionSessionRef(entry);
        if (ref) sessions.add(ref);
      }
      return;
    }
    for (const [childKey, child] of Object.entries(entry)) visit(child, childKey);
  };
  visit(value);
  return [...sessions];
}

export function buildStageReviewContextManifest({
  stageRunRef,
  reviewerAttemptRole = 'reviewer',
  artifactRefs = [],
  sourceRefs = [],
  qualityRubricRefs = [],
  lineageRefs = [],
  priorFindingRefs = [],
} = {}) {
  if (!REVIEW_ROLES.has(safeText(reviewerAttemptRole))) {
    throw new Error(`Review context manifest requires a review attempt role, got: ${safeText(reviewerAttemptRole)}`);
  }
  const exactArtifactRefs = unique(artifactRefs);
  return {
    surface_kind: 'opl_stage_review_context_manifest',
    version: 'stage-review-context-manifest.v1',
    stage_run_ref: safeText(stageRunRef) || null,
    attempt_role: safeText(reviewerAttemptRole),
    no_context_inheritance: true,
    exact_artifact_refs: exactArtifactRefs,
    exact_artifact_hashes: exactArtifactRefs.map((ref) => ({ ref, sha256: hashFile(ref) })).filter((entry) => entry.sha256),
    source_refs: unique(sourceRefs),
    quality_rubric_refs: unique(qualityRubricRefs),
    lineage_refs: unique(lineageRefs),
    prior_finding_refs: unique(priorFindingRefs),
    forbidden_context: [
      'producer_conversation_history',
      'producer_thread_resume',
      'producer_reasoning_trace',
      'undeclared_transient_context',
    ],
  };
}

export function buildQualityAttemptRuntime({
  attemptRole,
  sessionId,
  attemptRef,
  parentAttemptRef = null,
  producerSessionRefs = [],
  qualityRoundIndex = 0,
  contextManifestRef = null,
} = {}) {
  const role = safeText(attemptRole);
  if (!ATTEMPT_ROLES.has(role)) throw new Error(`Unsupported RCA stage quality attempt role: ${role}`);
  const sessionRef = executionSessionRef(sessionId);
  if (!sessionRef) throw new Error('RCA stage quality attempt requires an execution session ref');
  const producerRefs = unique(producerSessionRefs).map(executionSessionRef);
  if (REVIEW_ROLES.has(role) && producerRefs.includes(sessionRef)) {
    throw new Error('Reviewer execution session must differ from producer execution session');
  }
  return {
    attempt_role: role,
    attempt_ref: safeText(attemptRef) || null,
    execution_session_ref: sessionRef,
    parent_attempt_ref: safeText(parentAttemptRef) || null,
    producer_session_refs: producerRefs,
    quality_round_index: Math.max(0, Number(qualityRoundIndex || 0)),
    no_context_inheritance: REVIEW_ROLES.has(role),
    context_manifest_ref: safeText(contextManifestRef) || null,
  };
}

export function buildStageReviewReceipt({
  stageRunRef,
  producerAttemptRef,
  reviewerAttemptRef,
  producerSessionRefs = [],
  reviewerSessionRef,
  reviewedArtifactRefs = [],
  reviewedArtifactHashes = [],
  rubricRefs = [],
  contextManifestRef = null,
  attemptRole = 'reviewer',
  verdict,
  findingRefs = [],
  routeBackStage = null,
} = {}) {
  const reviewerRef = executionSessionRef(reviewerSessionRef);
  const producerRefs = unique(producerSessionRefs).map(executionSessionRef);
  if (!REVIEW_ROLES.has(safeText(attemptRole))) throw new Error('Stage Review receipt requires a review attempt role');
  if (!reviewerRef) throw new Error('Stage Review receipt requires reviewer_session_ref');
  if (producerRefs.length === 0) throw new Error('Stage Review receipt requires producer_session_refs');
  if (producerRefs.includes(reviewerRef)) throw new Error('reviewer_session_ref must differ from every producer_session_ref');
  return {
    surface_kind: 'opl_stage_review_receipt',
    version: 'stage-review-receipt.v1',
    stage_run_ref: safeText(stageRunRef) || null,
    producer_attempt_ref: safeText(producerAttemptRef) || null,
    reviewer_attempt_ref: safeText(reviewerAttemptRef) || null,
    attempt_role: safeText(attemptRole),
    producer_session_refs: producerRefs,
    reviewer_session_ref: reviewerRef,
    no_context_inheritance: true,
    context_manifest_ref: safeText(contextManifestRef) || null,
    reviewed_artifact_refs: unique(reviewedArtifactRefs),
    reviewed_artifact_hashes: Array.isArray(reviewedArtifactHashes) ? reviewedArtifactHashes : [],
    rubric_refs: unique(rubricRefs),
    verdict: safeText(verdict),
    finding_refs: unique(findingRefs),
    route_back_stage: safeText(routeBackStage) || null,
  };
}
