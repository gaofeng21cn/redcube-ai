// @ts-nocheck
import crypto from 'node:crypto';
import fs from 'node:fs';

const QUALITY_RUBRIC_REFS = Object.freeze([
  'agent/quality_gates/artifact_authority.md',
  'agent/quality_gates/review_export_memory.md',
  'agent/quality_gates/visual_authority_boundaries.md',
]);

const safeText = (value, fallback = '') => String(value || '').trim() || fallback;
const safeArray = (value) => Array.isArray(value) ? value : [];
const unique = (values) => [...new Set(safeArray(values).map((value) => safeText(value)).filter(Boolean))];

function executionSessionRef(value) {
  const session = safeText(value);
  if (!session) return '';
  return session.includes('://') ? session : `codex://threads/${session}`;
}

function collectExecutionSessionRefs(value) {
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

function hashFile(file) {
  const resolved = safeText(file);
  if (!resolved || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(resolved)).digest('hex');
}

export function buildPptInAttemptVisualQaContext({
  deliverableId,
  contract,
  renderArtifact,
  qaRoute,
  lineageRefs = [],
  priorFindingRefs = [],
}) {
  const contextRef = `rca-in-attempt-visual-qa-context:ppt_deck:${safeText(deliverableId, 'deliverable')}:${qaRoute}`;
  const exactArtifactRefs = unique(renderArtifact?.artifact_refs);
  return {
    contextRef,
    context: {
      surface_kind: 'rca_in_attempt_visual_qa_context',
      version: 'rca-in-attempt-visual-qa-context.v1',
      qa_route: safeText(qaRoute),
      exact_artifact_refs: exactArtifactRefs,
      exact_artifact_hashes: exactArtifactRefs
        .map((ref) => ({ ref, sha256: hashFile(ref) }))
        .filter((entry) => entry.sha256),
      source_refs: unique(contract?.source_truth?.source_refs || contract?.source_refs),
      quality_rubric_refs: QUALITY_RUBRIC_REFS,
      lineage_refs: unique([safeText(renderArtifact?.route), ...lineageRefs]),
      prior_finding_refs: unique(priorFindingRefs),
      source_execution_session_refs: collectExecutionSessionRefs(renderArtifact),
      authority_boundary: {
        authoritative: false,
        formal_stage_review_completed: false,
        review_receipt_materialization_allowed: false,
        stage_transition_authority: false,
      },
    },
  };
}

export function buildPptInAttemptVisualQaEvidence({
  generationRuntime,
  qaContext,
  status,
  artifactRefs = [],
  repairRoute = null,
}) {
  const qaExecutionSessionRefs = collectExecutionSessionRefs(generationRuntime);
  const sourceExecutionSessionRefs = unique(qaContext?.context?.source_execution_session_refs);
  return {
    surface_kind: 'rca_in_attempt_visual_qa',
    version: 'rca-in-attempt-visual-qa.v1',
    authoritative: false,
    formal_stage_review_completed: false,
    review_receipt_materialized: false,
    stage_transition_authority: false,
    qa_context_ref: safeText(qaContext?.contextRef) || null,
    qa_execution_session_refs: qaExecutionSessionRefs,
    source_execution_session_refs: sourceExecutionSessionRefs,
    observed_fresh_execution_identity: qaExecutionSessionRefs.length > 0
      && qaExecutionSessionRefs.every((ref) => !sourceExecutionSessionRefs.includes(ref)),
    outcome: status === 'pass' ? 'pass_candidate' : 'repair_recommended',
    evidence_refs: unique(artifactRefs),
    repair_route_recommendation: status === 'pass' ? null : safeText(repairRoute) || null,
  };
}
