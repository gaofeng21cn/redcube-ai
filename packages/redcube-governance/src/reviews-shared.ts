// @ts-nocheck
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import {
  getDeliverablePaths,
  loadSourceReadinessSummary as loadCanonicalSourceReadinessSummary,
} from '@redcube/runtime-protocol';
import {
  getPublicationProjection as loadPublicationProjection,
  getReviewState as loadReviewState,
} from './review-state.js';

export function loadHydratedContract({ workspaceRoot, topicId, deliverableId }) {
  if (!workspaceRoot || !topicId || !deliverableId) {
    return null;
  }

  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const deliverable = JSON.parse(readFileSync(deliverablePaths.deliverableFile, 'utf-8'));
  const contractRef = String(
    deliverable?.hydrated_contract_ref || 'contracts/hydrated-deliverable.json',
  ).trim();
  return JSON.parse(
    readFileSync(path.join(deliverablePaths.deliverableDir, contractRef), 'utf-8'),
  );
}

export function safeReadJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

export function loadPublicationProjectionEntry(request) {
  if (!request?.workspaceRoot || !request?.topicId || !request?.deliverableId) return null;
  const projection = loadPublicationProjection({
    workspaceRoot: request.workspaceRoot,
    topicId: request.topicId,
  }).publication;
  return projection?.deliverables?.[request.deliverableId] || null;
}

export function loadPlatformReviewState(request) {
  if (!request?.workspaceRoot || !request?.topicId || !request?.deliverableId) return null;
  return loadReviewState(request);
}

export function loadTopicPublicationProjection(request) {
  if (!request?.workspaceRoot || !request?.topicId) return null;
  return loadPublicationProjection({
    workspaceRoot: request.workspaceRoot,
    topicId: request.topicId,
  }).publication;
}

export function loadReviewArtifact(request, contract) {
  if (!request?.workspaceRoot || !request?.topicId || !request?.deliverableId || !contract) {
    return null;
  }
  const deliverablePaths = getDeliverablePaths(
    request.workspaceRoot,
    request.topicId,
    request.deliverableId,
  );
  const reviewFile = path.join(
    deliverablePaths.artifactsDir,
    String(contract?.review_surface?.artifact_file || 'quality_gate.json').trim(),
  );
  if (!existsSync(reviewFile)) {
    return null;
  }
  return JSON.parse(readFileSync(reviewFile, 'utf-8'));
}

export function toMissingIssue(check) {
  if (check === 'visual_density_ok') {
    return 'visual_density_check_missing';
  }
  return `${check}_missing`;
}

export function toFailedIssue(check) {
  if (check === 'visual_density_ok') {
    return 'visual_density_too_high';
  }
  return `${check}_failed`;
}

export function loadSourceReadinessSummary({ workspaceRoot, topicId }) {
  return workspaceRoot && topicId ? loadCanonicalSourceReadinessSummary(workspaceRoot, topicId) : null;
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
      status: 'block',
      issues: summary.blocking_reasons?.length > 0 ? summary.blocking_reasons : ['source_readiness_missing'],
      rerun_from_stage: 'source_readiness',
      recommended_action: 'run_source_research',
    };
  }

  if (summary.status !== 'pass') {
    return {
      status: 'block',
      issues: summary.status === 'invalid'
        ? (summary.blocking_reasons?.length > 0 ? summary.blocking_reasons : ['source_readiness_invalid'])
        : ['source_readiness_not_planning_ready', ...(summary.blocking_evidence_gaps || [])],
      rerun_from_stage: 'source_readiness',
      recommended_action: 'run_source_research',
    };
  }

  return {
    status: 'pass',
    issues: [],
    rerun_from_stage: null,
    recommended_action: 'continue',
  };
}
