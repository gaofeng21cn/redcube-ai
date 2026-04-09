import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import { getDeliverablePaths, getSourceArtifactPaths } from '@redcube/runtime-protocol';
import { getPublicationProjection as loadPublicationProjection, getReviewState as loadReviewState } from './review-state.js';

function loadHydratedContract({ workspaceRoot, topicId, deliverableId }) {
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

function safeReadJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

function normalizeList(value) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

function loadPublicationProjectionEntry(request) {
  if (!request?.workspaceRoot || !request?.topicId || !request?.deliverableId) return null;
  try {
    const projection = loadPublicationProjection({
      workspaceRoot: request.workspaceRoot,
      topicId: request.topicId,
    }).publication;
    return projection?.deliverables?.[request.deliverableId] || null;
  } catch {
    return null;
  }
}


function loadPlatformReviewState(request) {
  if (!request?.workspaceRoot || !request?.topicId || !request?.deliverableId) return null;
  try {
    return loadReviewState(request);
  } catch {
    return null;
  }
}

function loadReviewArtifact(request, contract) {
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

function toMissingIssue(check) {
  if (check === 'visual_density_ok') {
    return 'visual_density_check_missing';
  }
  return `${check}_missing`;
}

function toFailedIssue(check) {
  if (check === 'visual_density_ok') {
    return 'visual_density_too_high';
  }
  return `${check}_failed`;
}

function loadSourceReadinessSummary({ workspaceRoot, topicId }) {
  if (!workspaceRoot || !topicId) {
    return null;
  }

  const sourcePaths = getSourceArtifactPaths(workspaceRoot, topicId);
  if (!existsSync(sourcePaths.sourceAuditFile)) {
    return {
      canonical_source: {
        kind: 'shared_source_truth.source_audit',
      },
      authoritative_artifact: sourcePaths.sourceAuditFile,
      status: 'missing',
      completed_stages: [],
      blocking_reasons: ['source_audit_missing'],
      checks: {
        source_audit_written: false,
      },
    };
  }

  const sourceAudit = safeReadJson(sourcePaths.sourceAuditFile);
  if (!sourceAudit) {
    return {
      canonical_source: {
        kind: 'shared_source_truth.source_audit',
      },
      authoritative_artifact: sourcePaths.sourceAuditFile,
      status: 'invalid',
      completed_stages: [],
      blocking_reasons: ['source_audit_invalid'],
      checks: {
        source_audit_written: true,
      },
    };
  }

  return {
    canonical_source: {
      kind: 'shared_source_truth.source_audit',
    },
    authoritative_artifact: sourcePaths.sourceAuditFile,
    status: String(sourceAudit.status || '').trim() || 'unknown',
    completed_stages: normalizeList(sourceAudit.completed_stages),
    blocking_reasons: normalizeList(sourceAudit.blocking_reasons),
    checks: sourceAudit.checks && typeof sourceAudit.checks === 'object' ? sourceAudit.checks : {},
  };
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
      issues: ['source_audit_missing'],
      rerun_from_stage: 'intake',
      recommended_action: 'run_source_intake',
    };
  }

  if (summary.status !== 'pass') {
    return {
      status: 'block',
      issues: summary.status === 'invalid' ? ['source_audit_invalid'] : ['source_audit_not_sufficient'],
      rerun_from_stage: 'intake',
      recommended_action: summary.status === 'invalid' ? 'rerun_source_intake' : 'resolve_source_blocks',
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
  const sourceReadinessSummary = loadSourceReadinessSummary(request);
  const reviewResponse = loadPlatformReviewState(request);
  const reviewState = reviewResponse?.state || null;
  const contract = loadHydratedContract(request);
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
    gate_summary: buildGateSummary({
      sourceReadinessSummary,
      reviewState,
      contract,
      publicationProjectionEntry,
      operatorHandoff,
    }),
    operator_handoff: operatorHandoff,
    lifecycle_stage_summary: lifecycleStageSummary,
  };
}

export function reviewRenderedDeliverable(request) {
  const contract = loadHydratedContract(request);
  const reviewArtifact = loadReviewArtifact(request, contract);
  const reviewState = loadPlatformReviewState(request)?.state || null;
  const suppliedChecks = request?.checks && typeof request.checks === 'object'
    ? request.checks
    : null;
  const checks = suppliedChecks || reviewState?.latest_checks || reviewArtifact?.checks || {};
  const reviewSurface = contract?.review_surface || null;
  const baseChecks = Array.isArray(reviewSurface?.required_checks)
    ? reviewSurface.required_checks
    : ['visual_density_ok'];
  const conditionalChecks = Array.isArray(reviewSurface?.conditional_checks?.[request?.mode])
    ? reviewSurface.conditional_checks[request.mode]
    : [];
  const requiredChecks = [...baseChecks, ...conditionalChecks];
  if (!suppliedChecks && reviewState?.pending_reviews?.length > 0) {
    return {
      status: 'block',
      issues: reviewState.pending_reviews,
      rerun_from_stage: reviewState.rerun_from_stage || null,
      recommended_action: 'revise_render_output',
    };
  }
  const rerunFromStage = reviewSurface?.rerun_from_stage || {
    visual_density_ok: 'visual_direction',
  };

  const missingChecks = requiredChecks.filter(
    (check) => !Object.hasOwn(checks, check),
  );
  if (missingChecks.length > 0) {
    const firstMissing = missingChecks[0];
    return {
      status: 'block',
      issues: missingChecks.map((check) => toMissingIssue(check)),
      rerun_from_stage:
        firstMissing === 'visual_density_ok'
          ? 'render_review'
          : rerunFromStage[firstMissing] || 'render_review',
      recommended_action: 'supply_render_checks',
    };
  }

  const failedChecks = requiredChecks.filter((check) => checks[check] === false);
  if (failedChecks.length > 0) {
    const firstFailed = failedChecks[0];
    return {
      status: 'block',
      issues: failedChecks.map((check) => toFailedIssue(check)),
      rerun_from_stage: rerunFromStage[firstFailed] || 'render_review',
      recommended_action:
        firstFailed === 'visual_density_ok'
          ? 'revise_visual_direction'
          : 'revise_render_output',
    };
  }

  return {
    status: (reviewState?.current_status === 'publish_ready' || reviewState?.current_status === 'export_ready') ? 'pass' : (reviewArtifact?.status || 'pass'),
    issues: [],
    rerun_from_stage: null,
    recommended_action: 'continue',
  };
}

export function watchRuntimeReviewLoop(request) {
  const run = request?.run || {};
  const pendingReviews = Array.isArray(run?.pending_reviews)
    ? run.pending_reviews.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const contract = loadHydratedContract(request);
  const reviewResponse = loadPlatformReviewState(request);
  const reviewState = reviewResponse?.state || null;
  const sourceReadinessSummary = loadSourceReadinessSummary(request);
  const publicationProjection = request?.workspaceRoot && request?.topicId
    ? loadPublicationProjection({ workspaceRoot: request.workspaceRoot, topicId: request.topicId }).publication
    : null;
  const publicationProjectionEntry = publicationProjection?.deliverables?.[request?.deliverableId] || null;
  const operatorHandoff = reviewResponse?.operator_handoff || publicationProjectionEntry?.operator_handoff || null;
  const lifecycleStageSummary = reviewResponse?.lifecycle_stage_summary || publicationProjectionEntry?.lifecycle_stage_summary || null;
  const relativeQuality = reviewState?.baseline?.relative_quality || null;

  return {
    ok: true,
    surface_kind: 'runtime_watch',
    run_id: String(run?.run_id || '').trim(),
    current_stage: String(run?.current_stage || '').trim() || null,
    status: reviewState?.pending_reviews?.length > 0 ? 'review_pending' : (pendingReviews.length > 0 ? 'review_pending' : String(run?.status || reviewState?.current_status || 'idle')),
    pending_reviews: reviewState?.pending_reviews || pendingReviews,
    review_state: reviewState,
    quality_summary: {
      relative_quality_verdict: relativeQuality?.verdict || null,
      degradations: Array.isArray(relativeQuality?.degradations) ? relativeQuality.degradations : [],
      improvements: Array.isArray(relativeQuality?.improvements) ? relativeQuality.improvements : [],
      acceptable_changes: Array.isArray(relativeQuality?.acceptable_changes) ? relativeQuality.acceptable_changes : [],
      baseline_promotion_state: reviewState?.baseline?.promotion_state || null,
      promoted_reference_id: reviewState?.baseline?.promoted_reference_id || null,
    },
    publication_projection: publicationProjection,
    source_readiness_summary: sourceReadinessSummary,
    gate_summary: buildGateSummary({
      sourceReadinessSummary,
      reviewState,
      contract,
      publicationProjectionEntry,
      operatorHandoff,
    }),
    operator_handoff: operatorHandoff,
    lifecycle_stage_summary: lifecycleStageSummary,
    resumable: Boolean(run?.resumable),
    profile_id: String(contract?.profile_id || '').trim() || null,
    delivery_contract: contract?.delivery_contract || null,
    required_export_bundle: contract?.export_bundle || null,
  };
}
