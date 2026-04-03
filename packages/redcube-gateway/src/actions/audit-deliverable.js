import path from 'node:path';
import { existsSync } from 'node:fs';

import { listDeckSurfaceArtifactPaths } from '@redcube/overlay-ppt';
import { auditDeliverableRequest } from '@redcube/runtime';
import { getDeliverablePaths } from '@redcube/runtime-protocol';

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

function auditPptDeckSurface({
  workspaceRoot,
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

  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const missingIssues = listDeckSurfaceArtifactPaths()
    .filter((relativePath) => !existsSync(path.join(deliverablePaths.deliverableDir, relativePath)))
    .map((relativePath) => `deliverable_contract_missing:${artifactKey(relativePath)}`);

  if (missingIssues.length > 0) {
    return {
      status: 'block',
      issues: missingIssues,
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

  if (request?.overlay === 'ppt_deck') {
    reports.push(auditPptDeckSurface(request));
  }

  return mergeAuditReports(reports);
}
