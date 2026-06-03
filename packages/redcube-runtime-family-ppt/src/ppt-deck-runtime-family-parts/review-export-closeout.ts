type JsonRecord = Record<string, any>;

interface ReviewExportCloseoutInput {
  family?: string;
  route: string;
  deliverableId: unknown;
  status: unknown;
  blockerKind?: string;
  blockingReasons?: unknown[];
  nextRequiredOwnerAction?: string | null;
  reviewExportRefs?: unknown[];
  artifactRefs?: unknown[];
}

function safeText(value: unknown, fallback = ''): string {
  const text = String(value ?? '').trim();
  return text || fallback;
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

function ownerReceiptRef(family: string, route: string, deliverableId: string): string {
  return `rca-owner-receipt:review-export:${family}:${route}:${deliverableId}`;
}

function typedBlockerRef(family: string, route: string, deliverableId: string): string {
  return `rca-typed-blocker:review-export:${family}:${route}:${deliverableId}`;
}

function commonRefs(family: string, route: string, deliverableId: string): JsonRecord {
  return {
    attempt_ref: `workspace-runtime-ref:review-export:${family}:${route}:${deliverableId}`,
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
  if (isBlockedStatus(input.status)) {
    const blockerRef = typedBlockerRef(family, route, deliverableId);
    const blockingReasons = uniqueStrings(input.blockingReasons || ['review_export_gate_blocked']);
    return {
      owner_receipt_refs: [],
      typed_blocker_refs: [blockerRef],
      review_export_refs: uniqueStrings([...explicitReviewExportRefs, blockerRef]),
      owner_receipt: null,
      typed_blocker: {
        surface_kind: 'typed_blocker',
        return_shape: 'typed_blocker',
        owner: 'redcube_ai',
        source_contract: 'rca.domain_owner_receipt.v1',
        blocker_ref: blockerRef,
        blocker_kind: safeText(input.blockerKind, 'review_export_gate_blocked'),
        route_stage_id: route,
        deliverable_id: deliverableId,
        review_export_ref: gateRef,
        blocking_reasons: blockingReasons,
        next_required_owner_action: safeText(input.nextRequiredOwnerAction, 'rerun_required'),
        ...refs,
        authority_boundary: {
          rca_owns_typed_blocker: true,
          opl_can_store_typed_blocker: true,
          opl_can_write_visual_truth: false,
          opl_can_write_review_export_verdict: false,
          opl_can_issue_owner_receipt: false,
        },
      },
      blocking_reasons: blockingReasons,
    };
  }
  const receiptRef = ownerReceiptRef(family, route, deliverableId);
  return {
    owner_receipt_refs: [receiptRef],
    typed_blocker_refs: [],
    review_export_refs: explicitReviewExportRefs,
    owner_receipt: {
      surface_kind: 'domain_owner_receipt',
      return_shape: 'domain_receipt',
      owner: 'redcube_ai',
      source_contract: 'rca.domain_owner_receipt.v1',
      receipt_ref: receiptRef,
      route_stage_id: route,
      deliverable_id: deliverableId,
      review_export_ref: gateRef,
      artifact_refs: artifactRefs,
      ...refs,
      authority_boundary: {
        rca_owns_owner_receipt: true,
        opl_can_store_receipt_refs: true,
        opl_can_write_visual_truth: false,
        opl_can_write_review_export_verdict: false,
        opl_can_write_domain_artifact_body: false,
      },
    },
    typed_blocker: null,
    blocking_reasons: [],
  };
}

export function reviewExportBlockerKind(input: {
  route: string;
  failedChecks?: unknown[];
  slideReviews?: JsonRecord[];
  artifactMissing?: boolean;
}): string {
  const failedChecks = uniqueStrings(input.failedChecks || []);
  const issues = safeArray(input.slideReviews)
    .flatMap((slide: any) => safeArray(slide?.issues))
    .map((issue) => safeText(issue))
    .filter(Boolean);
  if (
    input.artifactMissing
    || issues.some((issue) => issue.includes('missing'))
    || failedChecks.some((check) => check.includes('missing'))
  ) {
    return 'missing_required_artifact';
  }
  return `${refSegment(input.route, 'review_export')}_gate_blocked`;
}
