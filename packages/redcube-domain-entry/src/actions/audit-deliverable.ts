// @ts-nocheck
import path from 'node:path';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';

import {
  auditDeliverableRequest,
  buildGateSummary,
  buildSourceReadinessReport,
  getDefaultOverlayRegistry,
  getPublicationProjection as getRuntimePublicationProjection,
  getReviewState as getRuntimeReviewState,
  isBaselineApprovedState,
} from '@redcube/runtime';
import { getDeliverablePaths, loadSourceReadinessSummary as loadCanonicalSourceReadinessSummary } from '@redcube/runtime-protocol';

function mergeAuditReports(reports) {
  const normalized = reports.filter(Boolean);
  const issues = [];

  for (const report of normalized) {
    for (const issue of report.issues || []) {
      if (!issues.includes(issue)) {
        issues.push(issue);
      }
    }
  }

  const blockingReport = normalized.find((report) => report.status === 'block');
  if (blockingReport) {
    return {
      status: 'block',
      issues,
      rerun_from_stage: blockingReport.rerun_from_stage,
      recommended_action: blockingReport.recommended_action,
    };
  }

  return {
    status: 'pass',
    issues,
    rerun_from_stage: null,
    recommended_action: 'continue',
  };
}

function artifactKey(relativePath) {
  return path.basename(relativePath, '.json').replace(/-/g, '_');
}

function toRelativeSurfacePath(rootDir, absolutePath) {
  return path.relative(rootDir, absolutePath).split(path.sep).join('/');
}

function collectJsonSurfacePaths(rootDir) {
  if (!existsSync(rootDir)) {
    return [];
  }

  const entries = [];
  for (const entry of readdirSync(rootDir)) {
    const absolutePath = path.join(rootDir, entry);
    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      entries.push(...collectJsonSurfacePaths(absolutePath));
      continue;
    }
    if (stats.isFile() && absolutePath.endsWith('.json')) {
      entries.push(absolutePath);
    }
  }
  return entries;
}

function loadHydratedContract({ workspaceRoot, topicId, deliverableId }) {
  if (!workspaceRoot || !topicId || !deliverableId) {
    return null;
  }

  try {
    const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
    const deliverable = JSON.parse(readFileSync(deliverablePaths.deliverableFile, 'utf-8'));
    const contractRef = String(
      deliverable?.hydrated_contract_ref || 'contracts/hydrated-deliverable.json',
    ).trim();
    return JSON.parse(readFileSync(path.join(deliverablePaths.deliverableDir, contractRef), 'utf-8'));
  } catch {
    return null;
  }
}

function loadReviewState({ workspaceRoot, topicId, deliverableId }) {
  if (!workspaceRoot || !topicId || !deliverableId) {
    return null;
  }

  try {
    return getRuntimeReviewState({
      workspaceRoot,
      topicId,
      deliverableId,
    });
  } catch (error) {
    if (error?.code === 'ENOENT' && String(error?.path || '').endsWith('hydrated-deliverable.json')) {
      return null;
    }
    throw error;
  }
}

function loadPublicationProjectionEntry({ workspaceRoot, topicId, deliverableId }) {
  if (!workspaceRoot || !topicId || !deliverableId) {
    return null;
  }

  const publicationProjection = getRuntimePublicationProjection({
    workspaceRoot,
    topicId,
  });
  return publicationProjection?.deliverables?.[deliverableId] || null;
}

function loadPublicationProjection({ workspaceRoot, topicId }) {
  if (!workspaceRoot || !topicId) {
    return null;
  }

  return getRuntimePublicationProjection({
    workspaceRoot,
    topicId,
  })?.publication || null;
}

function loadSourceReadinessSummary({ workspaceRoot, topicId }) {
  return workspaceRoot && topicId ? loadCanonicalSourceReadinessSummary(workspaceRoot, topicId) : null;
}

const overlayRegistry = getDefaultOverlayRegistry();

function auditOverlaySurface({
  workspaceRoot,
  overlay,
  topicId,
  deliverableId,
}) {
  if (!workspaceRoot || !topicId || !deliverableId) {
    return {
      status: 'pass',
      issues: [],
      rerun_from_stage: null,
      recommended_action: 'continue',
    };
  }
  const overlayDefinition = overlayRegistry.getOverlay(overlay);
  if (typeof overlayDefinition.listSurfaceArtifactPaths !== 'function') {
    return {
      status: 'pass',
      issues: [],
      rerun_from_stage: null,
      recommended_action: 'continue',
    };
  }

  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const missingIssues = [];
  const invalidIssues = [];
  const extraIssues = [];
  const expectedSurfacePaths = overlayDefinition.listSurfaceArtifactPaths();
  const expectedSurfacePathSet = new Set(expectedSurfacePaths);

  for (const relativePath of expectedSurfacePaths) {
    const absolutePath = path.join(deliverablePaths.deliverableDir, relativePath);
    if (!existsSync(absolutePath)) {
      missingIssues.push(`deliverable_contract_missing:${artifactKey(relativePath)}`);
      continue;
    }

    try {
      const content = JSON.parse(readFileSync(absolutePath, 'utf-8'));
      if (!overlayDefinition.validateSurfaceArtifact(relativePath, content)) {
        invalidIssues.push(`deliverable_contract_invalid:${artifactKey(relativePath)}`);
      }
    } catch {
      invalidIssues.push(`deliverable_contract_invalid:${artifactKey(relativePath)}`);
    }
  }

  const surfaceRoots = [
    ...new Set(
      expectedSurfacePaths
        .filter((relativePath) => relativePath.startsWith('contracts/'))
        .map((relativePath) => relativePath.split('/')[0])
        .filter(Boolean),
    ),
  ];
  for (const surfaceRoot of surfaceRoots) {
    for (const absolutePath of collectJsonSurfacePaths(path.join(deliverablePaths.deliverableDir, surfaceRoot))) {
      const relativePath = toRelativeSurfacePath(deliverablePaths.deliverableDir, absolutePath);
      if (!expectedSurfacePathSet.has(relativePath)) {
        extraIssues.push(`deliverable_contract_extra:${artifactKey(relativePath)}`);
      }
    }
  }
  extraIssues.sort();

  if (missingIssues.length > 0 || invalidIssues.length > 0 || extraIssues.length > 0) {
    return {
      status: 'block',
      issues: [...missingIssues, ...invalidIssues, ...extraIssues],
      rerun_from_stage: 'intake',
      recommended_action: 'rehydrate_deliverable_surface',
    };
  }

  return {
    status: 'pass',
    issues: [],
    rerun_from_stage: null,
    recommended_action: 'continue',
  };
}

export async function auditDeliverable(request) {
  const overlaySurfaceReport = auditOverlaySurface(request);
  const canLoadGovernanceState = overlaySurfaceReport.status !== 'block';
  const contract = canLoadGovernanceState ? loadHydratedContract(request) : null;
  const reviewResponse = canLoadGovernanceState ? loadReviewState(request) : null;
  const sourceReadinessSummary = reviewResponse?.source_readiness_summary || loadSourceReadinessSummary(request);
  const reviewState = reviewResponse?.state || null;
  const publicationProjection = canLoadGovernanceState ? loadPublicationProjection(request) : null;
  const publicationProjectionEntry = publicationProjection?.deliverables?.[request?.deliverableId] || null;
  const operatorHandoff = reviewResponse?.operator_handoff || publicationProjectionEntry?.operator_handoff || null;
  const lifecycleStageSummary = reviewResponse?.lifecycle_stage_summary || publicationProjectionEntry?.lifecycle_stage_summary || null;
  const reports = [auditDeliverableRequest(request), buildSourceReadinessReport(sourceReadinessSummary)];
  let qualitySummary = {
    baseline_promotion_state: null,
    promoted_reference_id: null,
  };
  if (request?.mode === 'optimize_existing' && request?.baselineDeliverableId && request?.workspaceRoot && request?.topicId) {
    const baselineState = getRuntimeReviewState({
      workspaceRoot: request.workspaceRoot,
      topicId: request.topicId,
      deliverableId: request.baselineDeliverableId,
    }).state;
    qualitySummary = {
      baseline_promotion_state: baselineState?.baseline?.promotion_state || null,
      promoted_reference_id: baselineState?.baseline?.promoted_reference_id || null,
    };
    if (!isBaselineApprovedState(baselineState)) {
      reports.push({
        status: 'block',
        issues: ['baseline_not_approved'],
        rerun_from_stage: 'intake',
        recommended_action: 'approve_or_publish_baseline',
      });
    }
  }
  reports.push(overlaySurfaceReport);
  const mergedReport = mergeAuditReports(reports);

  return {
    surface_kind: 'audit',
    ...mergedReport,
    recommended_action: mergedReport.status === 'pass' ? 'run_deliverable_route' : mergedReport.recommended_action,
    quality_summary: qualitySummary,
    review_state: reviewState,
    publication_projection: publicationProjection,
    source_readiness_summary: sourceReadinessSummary,
    gate_summary: reviewResponse?.gate_summary || publicationProjectionEntry?.gate_summary || (
      contract
        ? buildGateSummary({
            sourceReadinessSummary,
            reviewState,
            contract,
            publicationProjectionEntry,
            operatorHandoff,
          })
        : null
    ),
    operator_handoff: operatorHandoff,
    lifecycle_stage_summary: lifecycleStageSummary,
    governance_surface: reviewResponse?.governance_surface || null,
    delivery_contract: contract?.delivery_contract || null,
  };
}
