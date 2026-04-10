import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import { getDefaultOverlayRegistry } from '@redcube/overlay-registry';
import {
  auditDeliverableRequest,
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
  } catch {
    return null;
  }
}

function loadPublicationProjectionEntry({ workspaceRoot, topicId, deliverableId }) {
  if (!workspaceRoot || !topicId || !deliverableId) {
    return null;
  }

  try {
    const publicationProjection = getRuntimePublicationProjection({
      workspaceRoot,
      topicId,
    });
    return publicationProjection?.deliverables?.[deliverableId] || null;
  } catch {
    return null;
  }
}

function loadPublicationProjection({ workspaceRoot, topicId }) {
  if (!workspaceRoot || !topicId) {
    return null;
  }

  try {
    return getRuntimePublicationProjection({
      workspaceRoot,
      topicId,
    })?.publication || null;
  } catch {
    return null;
  }
}

function loadSourceReadinessSummary({ workspaceRoot, topicId }) {
  return workspaceRoot && topicId ? loadCanonicalSourceReadinessSummary(workspaceRoot, topicId) : null;
}

function buildSourceReadinessReport(summary) {
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

function buildGateSummary({
  sourceReadinessSummary,
  reviewState,
  contract,
  publicationProjectionEntry,
  operatorHandoff,
}) {
  return {
    source_readiness_status: sourceReadinessSummary?.status || null,
    source_planning_ready: sourceReadinessSummary?.planning_ready === true,
    source_sufficiency_status: String(sourceReadinessSummary?.sufficiency_status || '').trim() || null,
    source_deep_research_state: String(sourceReadinessSummary?.deep_research_state || '').trim() || null,
    source_blocking_evidence_gaps: Array.isArray(sourceReadinessSummary?.blocking_evidence_gaps)
      ? sourceReadinessSummary.blocking_evidence_gaps
      : [],
    source_next_required_surface: String(sourceReadinessSummary?.next_required_surface || '').trim() || null,
    review_status: String(reviewState?.current_status || '').trim() || null,
    approval_status: String(reviewState?.approval_state?.status || '').trim() || null,
    latest_review_stage: String(reviewState?.latest_review_stage || '').trim() || null,
    export_status: reviewState ? (reviewState.ready_for_export ? 'ready' : 'not_ready') : null,
    required_export_route: String(contract?.delivery_contract?.required_export_route || '').trim() || null,
    required_export_bundle_id: String(
      contract?.delivery_contract?.required_export_bundle_id || contract?.export_bundle?.bundle_id || '',
    ).trim() || null,
    approval_required: Boolean(contract?.delivery_contract?.human_gate?.required),
    delivery_projection_current: String(publicationProjectionEntry?.current || '').trim() || null,
    delivery_projection_next: String(publicationProjectionEntry?.next || '').trim() || null,
    operator_handoff_status: String(operatorHandoff?.gate_status || '').trim() || null,
    delivery_state_owner: String(operatorHandoff?.delivery_state_owner || '').trim() || null,
  };
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

  for (const relativePath of overlayDefinition.listSurfaceArtifactPaths()) {
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

  if (missingIssues.length > 0 || invalidIssues.length > 0) {
    return {
      status: 'block',
      issues: [...missingIssues, ...invalidIssues],
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
  const contract = loadHydratedContract(request);
  const reviewResponse = loadReviewState(request);
  const sourceReadinessSummary = reviewResponse?.source_readiness_summary || loadSourceReadinessSummary(request);
  const reviewState = reviewResponse?.state || null;
  const publicationProjection = loadPublicationProjection(request);
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
  reports.push(auditOverlaySurface(request));
  const mergedReport = mergeAuditReports(reports);

  return {
    surface_kind: 'audit',
    ...mergedReport,
    recommended_action: mergedReport.status === 'pass' ? 'run_deliverable_route' : mergedReport.recommended_action,
    quality_summary: qualitySummary,
    review_state: reviewState,
    publication_projection: publicationProjection,
    source_readiness_summary: sourceReadinessSummary,
    gate_summary: reviewResponse?.gate_summary || publicationProjectionEntry?.gate_summary || buildGateSummary({
      sourceReadinessSummary,
      reviewState,
      contract,
      publicationProjectionEntry,
      operatorHandoff,
    }),
    operator_handoff: operatorHandoff,
    lifecycle_stage_summary: lifecycleStageSummary,
    delivery_contract: contract?.delivery_contract || null,
  };
}
