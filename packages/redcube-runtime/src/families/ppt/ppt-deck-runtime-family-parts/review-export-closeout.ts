import { pptSafeText as safeText } from './core-helpers.js';

type JsonRecord = Record<string, any>;

interface ReviewExportCloseoutInput {
  family?: string;
  route: string;
  deliverableId: unknown;
  status: unknown;
  blockingReasons?: unknown[];
  nextRequiredOwnerAction?: string | null;
  reviewExportRefs?: unknown[];
  artifactRefs?: unknown[];
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function uniqueStrings(value: unknown[]): string[] {
  return [...new Set(safeArray(value).map((entry) => safeText(entry)).filter(Boolean))];
}

function refSegment(value: unknown, fallback: string): string {
  return safeText(value, fallback).replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || fallback;
}

function isBlockedStatus(status: unknown): boolean {
  return ['block', 'blocked', 'failed'].includes(safeText(status));
}

function reviewExportRef(family: string, route: string, deliverableId: string): string {
  return `rca-review-export:${family}:${route}:${deliverableId}`;
}

function commonRefs(family: string, route: string, deliverableId: string): JsonRecord {
  return {
    route_execution_ref: `workspace-runtime-ref:review-export:${family}:${route}:${deliverableId}`,
    artifact_locator_ref: `artifact-locator:redcube_ai:${family}:${route}:${deliverableId}`,
    memory_receipt_ref: `rca-memory-receipt:not-applicable:review-export:${family}:${route}:${deliverableId}`,
    lifecycle_receipt_ref: `rca-lifecycle-receipt:review-export:${family}:${route}:${deliverableId}`,
    forbidden_write_proof_ref: 'rca-forbidden-write-proof:review-export:refs-only',
  };
}

export function buildReviewExportCloseout(input: ReviewExportCloseoutInput): JsonRecord {
  const family = refSegment(input.family, 'ppt_deck');
  const route = refSegment(input.route, 'review_export');
  const deliverableId = refSegment(input.deliverableId, 'deliverable');
  const gateRef = reviewExportRef(family, route, deliverableId);
  const refs = commonRefs(family, route, deliverableId);
  const explicitReviewExportRefs = uniqueStrings([gateRef, ...safeArray(input.reviewExportRefs)]);
  const artifactRefs = uniqueStrings(safeArray(input.artifactRefs));
  const qualityDebt = isBlockedStatus(input.status);
  const qualityDebtReasons = uniqueStrings(input.blockingReasons || ['review_export_quality_gate_not_passed']);
  return {
    owner_receipt_refs: [],
    typed_blocker_refs: [],
    review_export_refs: explicitReviewExportRefs,
    review_verdict_candidate: {
      surface_kind: 'rca_review_export_verdict_candidate',
      return_shape: 'review_export_verdict_candidate',
      owner: 'redcube_ai',
      source_contract: 'rca.review_export_verdict_candidate.v1',
      route_stage_id: route,
      deliverable_id: deliverableId,
      review_export_ref: gateRef,
      artifact_refs: artifactRefs,
      verdict: safeText(input.status),
      ...refs,
      authority_boundary: {
        authoritative: false,
        formal_stage_review_completed: false,
        owner_receipt_materialized: false,
        decisive_reviewer_attempt_required: true,
      },
    },
    typed_blocker: null,
    blocking_reasons: [],
    quality_debt: qualityDebt ? {
      status: 'recorded_non_blocking',
      reasons: qualityDebtReasons,
      recommended_repair_stage: safeText(input.nextRequiredOwnerAction) || null,
      blocks_stage_transition: false,
      blocks_visual_ready_claim: true,
      blocks_export_ready_claim: true,
    } : null,
  };
}
