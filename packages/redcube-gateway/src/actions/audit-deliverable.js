import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import {
  pptDeckOverlay,
} from '@redcube/overlay-ppt';
import {
  createOverlayRegistry,
} from '@redcube/overlay-core';
import { auditDeliverableRequest, getReviewState as getRuntimeReviewState, isBaselineApprovedState } from '@redcube/runtime';
import { getDeliverablePaths } from '@redcube/runtime-protocol';
import { xiaohongshuOverlay } from '@redcube/overlay-xiaohongshu';

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

const overlayRegistry = createOverlayRegistry({
  ppt_deck: pptDeckOverlay,
  xiaohongshu: xiaohongshuOverlay,
});

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
  const reports = [auditDeliverableRequest(request)];
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
  return {
    ...mergeAuditReports(reports),
    quality_summary: qualitySummary,
  };
}
