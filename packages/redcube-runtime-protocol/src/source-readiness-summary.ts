import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { getTopicPaths } from './workspace.js';
import type { SourceReadinessSummary } from './types.js';

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

function normalizeList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => safeText(item)).filter(Boolean) : [];
}

function uniqueList(items: unknown): string[] {
  return [...new Set(normalizeList(items))];
}

function safeReadJson(file: string): JsonRecord | null {
  try {
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

function getSourceReadinessArtifactPaths(workspaceRoot: string, topicId: string) {
  const topicPaths = getTopicPaths(workspaceRoot, topicId);
  return {
    sourceAuditFile: path.join(topicPaths.canonicalDir, 'source-audit.json'),
    sourceReadinessPackFile: path.join(topicPaths.canonicalDir, 'source-readiness-pack.json'),
  };
}

function nextRequiredSurface({
  auditExists,
  auditValid,
  readinessExists,
  readinessValid,
  planningReady,
}: {
  auditExists: boolean;
  auditValid: boolean;
  readinessExists: boolean;
  readinessValid: boolean;
  planningReady: boolean;
}): 'source_research' | null {
  if (planningReady) return null;
  if (!auditExists || !auditValid) return 'source_research';
  if (!readinessExists || !readinessValid) return 'source_research';
  return 'source_research';
}

export function loadSourceReadinessSummary(workspaceRoot: string, topicId: string): SourceReadinessSummary | null {
  if (!workspaceRoot || !topicId) {
    return null;
  }

  const sourcePaths = getSourceReadinessArtifactPaths(workspaceRoot, topicId);
  const auditExists = existsSync(sourcePaths.sourceAuditFile);
  const readinessExists = existsSync(sourcePaths.sourceReadinessPackFile);
  const sourceAudit = auditExists ? safeReadJson(sourcePaths.sourceAuditFile) : null;
  const sourceReadinessPack = readinessExists ? safeReadJson(sourcePaths.sourceReadinessPackFile) : null;
  const auditValid = Boolean(sourceAudit);
  const readinessValid = Boolean(sourceReadinessPack);
  const sourceAuditRecord = asRecord(sourceAudit);
  const sourceReadinessPackRecord = asRecord(sourceReadinessPack);
  const readinessRecord = asRecord(sourceReadinessPackRecord.readiness);
  const factLibrary = asRecord(sourceReadinessPackRecord.fact_library);
  const auditStatus = safeText(sourceAuditRecord.status, auditExists ? 'invalid' : 'missing');
  const sufficiencyStatus = safeText(
    readinessRecord.sufficiency_status,
    readinessExists ? 'invalid' : 'missing',
  );
  const planningReady = auditStatus === 'pass'
    && (readinessRecord.planning_ready === true || sufficiencyStatus === 'planning_ready');
  const blockingEvidenceGaps = uniqueList(
    Array.isArray(factLibrary.blocking_evidence_gaps) && factLibrary.blocking_evidence_gaps.length > 0
      ? factLibrary.blocking_evidence_gaps
      : factLibrary.evidence_gaps,
  );
  const residualEvidenceGaps = uniqueList(factLibrary.residual_evidence_gaps);
  const auditBlockingReasons = uniqueList(sourceAuditRecord.blocking_reasons);

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
    deep_research_state: safeText(readinessRecord.deep_research_state, 'not_required'),
    completed_stages: normalizeList(sourceAuditRecord.completed_stages),
    blocking_evidence_gaps: blockingEvidenceGaps,
    residual_evidence_gaps: residualEvidenceGaps,
    blocking_reasons: blockingReasons,
    checks: sourceAuditRecord.checks && typeof sourceAuditRecord.checks === 'object' ? asRecord(sourceAuditRecord.checks) : {},
    next_required_surface: nextRequiredSurface({
      auditExists,
      auditValid,
      readinessExists,
      readinessValid,
      planningReady,
    }),
  };
}
