import { existsSync, readFileSync } from 'node:fs';

import { getSourceArtifactPaths } from './source-truth.js';

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function normalizeList(value) {
  return Array.isArray(value) ? value.map((item) => safeText(item)).filter(Boolean) : [];
}

function uniqueList(items) {
  return [...new Set(normalizeList(items))];
}

function safeReadJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

function nextRequiredSurface({
  auditExists,
  auditValid,
  readinessExists,
  readinessValid,
  planningReady,
}) {
  if (planningReady) return null;
  if (!auditExists || !auditValid) return 'source_research';
  if (!readinessExists || !readinessValid) return 'source_research';
  return 'source_research';
}

export function loadSourceReadinessSummary(workspaceRoot, topicId) {
  if (!workspaceRoot || !topicId) {
    return null;
  }

  const sourcePaths = getSourceArtifactPaths(workspaceRoot, topicId);
  const auditExists = existsSync(sourcePaths.sourceAuditFile);
  const readinessExists = existsSync(sourcePaths.sourceReadinessPackFile);
  const sourceAudit = auditExists ? safeReadJson(sourcePaths.sourceAuditFile) : null;
  const sourceReadinessPack = readinessExists ? safeReadJson(sourcePaths.sourceReadinessPackFile) : null;
  const auditValid = Boolean(sourceAudit);
  const readinessValid = Boolean(sourceReadinessPack);
  const auditStatus = safeText(sourceAudit?.status, auditExists ? 'invalid' : 'missing');
  const sufficiencyStatus = safeText(
    sourceReadinessPack?.readiness?.sufficiency_status,
    readinessExists ? 'invalid' : 'missing',
  );
  const planningReady = auditStatus === 'pass'
    && (sourceReadinessPack?.readiness?.planning_ready === true || sufficiencyStatus === 'planning_ready');
  const blockingEvidenceGaps = uniqueList(
    sourceReadinessPack?.fact_library?.blocking_evidence_gaps?.length > 0
      ? sourceReadinessPack.fact_library.blocking_evidence_gaps
      : sourceReadinessPack?.fact_library?.evidence_gaps,
  );
  const residualEvidenceGaps = uniqueList(sourceReadinessPack?.fact_library?.residual_evidence_gaps);
  const auditBlockingReasons = uniqueList(sourceAudit?.blocking_reasons);

  const blockingReasons = uniqueList([
    ...auditBlockingReasons,
    ...(!planningReady ? blockingEvidenceGaps : []),
    ...(!auditExists ? ['source_audit_missing'] : []),
    ...(auditExists && !auditValid ? ['source_audit_invalid'] : []),
    ...(!readinessExists ? ['source_readiness_pack_missing'] : []),
    ...(readinessExists && !readinessValid ? ['source_readiness_pack_invalid'] : []),
    ...(!planningReady && auditExists && auditValid && readinessExists && readinessValid && blockingEvidenceGaps.length === 0
      ? ['source_readiness_not_planning_ready']
      : []),
  ]);

  const status = !auditExists || !readinessExists
    ? 'missing'
    : (!auditValid || !readinessValid)
      ? 'invalid'
      : (planningReady ? 'pass' : 'block');

  return {
    canonical_source: {
      kind: 'shared_source_truth.source_readiness_gate',
      audit_kind: 'shared_source_truth.source_audit',
      readiness_kind: 'shared_source_truth.source_readiness_pack',
    },
    authoritative_artifacts: {
      source_audit: sourcePaths.sourceAuditFile,
      source_readiness_pack: sourcePaths.sourceReadinessPackFile,
    },
    status,
    readiness_target: 'planning_ready',
    planning_ready: planningReady,
    audit_status: auditStatus,
    sufficiency_status: sufficiencyStatus,
    deep_research_state: safeText(sourceReadinessPack?.readiness?.deep_research_state, 'not_required'),
    completed_stages: normalizeList(sourceAudit?.completed_stages),
    blocking_evidence_gaps: blockingEvidenceGaps,
    residual_evidence_gaps: residualEvidenceGaps,
    blocking_reasons: blockingReasons,
    checks: sourceAudit?.checks && typeof sourceAudit.checks === 'object' ? sourceAudit.checks : {},
    next_required_surface: nextRequiredSurface({
      auditExists,
      auditValid,
      readinessExists,
      readinessValid,
      planningReady,
    }),
  };
}
