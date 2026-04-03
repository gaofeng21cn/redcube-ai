import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import {
  listDeckSurfaceArtifactPaths,
  validateDeckSurfaceArtifact,
} from '@redcube/overlay-ppt';
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
  const missingIssues = [];
  const invalidIssues = [];

  for (const relativePath of listDeckSurfaceArtifactPaths()) {
    const absolutePath = path.join(deliverablePaths.deliverableDir, relativePath);
    if (!existsSync(absolutePath)) {
      missingIssues.push(`deliverable_contract_missing:${artifactKey(relativePath)}`);
      continue;
    }

    try {
      const content = JSON.parse(readFileSync(absolutePath, 'utf-8'));
      if (!validateDeckSurfaceArtifact(relativePath, content)) {
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

  if (request?.overlay === 'ppt_deck') {
    reports.push(auditPptDeckSurface(request));
  }

  return mergeAuditReports(reports);
}
