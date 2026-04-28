// @ts-nocheck
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import { getDeliverablePaths } from '@redcube/runtime-protocol';
import { buildGovernanceSurface } from './governance-surface.js';
import { getReviewState as loadReviewState } from './review-state.js';
import { buildReviewGateSummary } from './reviews-gate-summary.js';
import {
  buildSourceReadinessReport,
  loadHydratedContract,
  loadPlatformReviewState,
  loadPublicationProjectionEntry,
  loadSourceReadinessSummary,
} from './reviews-shared.js';

const SURFACE_CONTRACT_PARTS = [
  ['contracts/stage-sequence.json', 'stage_sequence'],
  ['contracts/stage-requirements.json', 'stage_requirements'],
  ['contracts/lifecycle-stage-contract.json', 'lifecycle_stage_contract'],
  ['contracts/prompt-pack.json', 'prompt_pack'],
  ['contracts/review-surface.json', 'review_surface'],
  ['contracts/layout-rules.json', 'layout_rules'],
  ['contracts/baseline-policy.json', 'baseline_policy'],
  ['contracts/export-bundle.json', 'export_bundle'],
  ['contracts/delivery-contract.json', 'delivery_contract'],
  ['contracts/governance-surface.json', 'governance_surface'],
  ['contracts/hydrated-deliverable.json', 'hydrated_contract'],
];

function artifactKey(relativePath) {
  return path.basename(relativePath, '.json').replace(/-/g, '_');
}

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

function auditOverlaySurface({
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
  const contract = loadHydratedContract({ workspaceRoot, topicId, deliverableId });
  const missingIssues = [];
  const invalidIssues = [];

  for (const [relativePath, contractKey] of SURFACE_CONTRACT_PARTS) {
    if (contractKey !== 'hydrated_contract' && contractKey !== 'governance_surface' && contract?.[contractKey] === undefined) {
      continue;
    }

    const absolutePath = path.join(deliverablePaths.deliverableDir, relativePath);
    if (!existsSync(absolutePath)) {
      missingIssues.push(`deliverable_contract_missing:${artifactKey(relativePath)}`);
      continue;
    }

    try {
      const content = JSON.parse(readFileSync(absolutePath, 'utf-8'));
      if (contractKey === 'hydrated_contract' && content?.overlay !== contract?.overlay) {
        invalidIssues.push(`deliverable_contract_invalid:${artifactKey(relativePath)}`);
      }
      if (contractKey === 'governance_surface' && content?.schema_version !== buildGovernanceSurface(contract)?.schema_version) {
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

export function auditDeliverableRequest({ mode, baselineDeliverableId }) {
  if (mode === 'optimize_existing' && !String(baselineDeliverableId || '').trim()) {
    return {
      status: 'block',
      issues: ['baseline_missing'],
      rerun_from_stage: 'intake',
      recommended_action: 'bind_baseline_deliverable',
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
  const reviewResponse = loadPlatformReviewState(request);
  const sourceReadinessSummary = reviewResponse?.source_readiness_summary || loadSourceReadinessSummary(request);
  const reviewState = reviewResponse?.state || null;
  const contract = loadHydratedContract(request);
  const governanceSurface = reviewResponse?.governance_surface || (contract ? buildGovernanceSurface(contract) : null);
  const publicationProjectionEntry = loadPublicationProjectionEntry(request);
  const operatorHandoff = reviewResponse?.operator_handoff || publicationProjectionEntry?.operator_handoff || null;
  const lifecycleStageSummary = reviewResponse?.lifecycle_stage_summary || publicationProjectionEntry?.lifecycle_stage_summary || null;
  const reports = [auditDeliverableRequest(request), buildSourceReadinessReport(sourceReadinessSummary)];
  let qualitySummary = {
    baseline_promotion_state: null,
    promoted_reference_id: null,
  };
  if (request?.mode === 'optimize_existing' && request?.baselineDeliverableId && request?.workspaceRoot && request?.topicId) {
    const baselineState = loadReviewState({
      workspaceRoot: request.workspaceRoot,
      topicId: request.topicId,
      deliverableId: request.baselineDeliverableId,
    }).state;
    qualitySummary = {
      baseline_promotion_state: baselineState?.baseline?.promotion_state || null,
      promoted_reference_id: baselineState?.baseline?.promoted_reference_id || null,
    };
    if (baselineState) {
      if (baselineState.approval_state?.required) {
        if (!(baselineState.approval_state.status === 'approved' || baselineState.publish_state?.current === 'published')) {
          reports.push({
            status: 'block',
            issues: ['baseline_not_approved'],
            rerun_from_stage: 'intake',
            recommended_action: 'approve_or_publish_baseline',
          });
        }
      } else if (!baselineState.ready_for_export) {
        reports.push({
          status: 'block',
          issues: ['baseline_not_approved'],
          rerun_from_stage: 'intake',
          recommended_action: 'approve_or_publish_baseline',
        });
      }
    }
  }
  reports.push(auditOverlaySurface(request));
  return {
    surface_kind: 'audit',
    ...mergeAuditReports(reports),
    quality_summary: qualitySummary,
    source_readiness_summary: sourceReadinessSummary,
    gate_summary: reviewResponse?.gate_summary || publicationProjectionEntry?.gate_summary || buildReviewGateSummary({
      sourceReadinessSummary,
      reviewState,
      contract,
      publicationProjectionEntry,
      operatorHandoff,
    }),
    operator_handoff: operatorHandoff,
    lifecycle_stage_summary: lifecycleStageSummary,
    governance_surface: governanceSurface,
  };
}
