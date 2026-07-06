import {
  auditDeliverableRequest as auditDeliverableRequestJs,
  reviewRenderedDeliverable as reviewRenderedDeliverableJs,
  watchRuntimeReviewLoop as watchRuntimeReviewLoopJs,
} from './reviews.js';
import {
  applyReviewMutation as applyReviewMutationJs,
  getPublicationProjection as getPublicationProjectionJs,
  getReviewState as getReviewStateJs,
  isBaselineApprovedState as isBaselineApprovedStateJs,
  persistReviewStatePatch as persistReviewStatePatchJs,
  rebuildTopicPublicationProjection as rebuildTopicPublicationProjectionJs,
} from './review-state.js';
import { buildGovernanceSurface as buildGovernanceSurfaceJs } from './governance-surface.js';
import {
  buildGateSummary as buildGateSummaryJs,
  buildSourceReadinessReport as buildSourceReadinessReportJs,
} from './review-state-parts/freshness-gates.js';

import type {
  AuditDeliverableRequest,
  DeliverableReviewRequest,
  GovernanceSurfaceContract,
  PersistReviewStatePatchRequest,
  PublicationProjectionResponse,
  ReviewMutationRequest,
  ReviewMutationResponse,
  ReviewStateResponse,
  ReviewSurfaceResult,
  RuntimeWatchResponse,
} from './types.js';

export function auditDeliverableRequest(request: AuditDeliverableRequest): ReviewSurfaceResult {
  return auditDeliverableRequestJs(request) as ReviewSurfaceResult;
}

export function reviewRenderedDeliverable(request: DeliverableReviewRequest): ReviewSurfaceResult {
  return reviewRenderedDeliverableJs(request) as ReviewSurfaceResult;
}

export function watchRuntimeReviewLoop(request: DeliverableReviewRequest): RuntimeWatchResponse {
  return watchRuntimeReviewLoopJs(request) as RuntimeWatchResponse;
}

export function getReviewState(request: DeliverableReviewRequest): ReviewStateResponse {
  return getReviewStateJs(request) as ReviewStateResponse;
}

export function getPublicationProjection(request: { workspaceRoot: string; topicId: string }): PublicationProjectionResponse {
  return getPublicationProjectionJs(request) as PublicationProjectionResponse;
}

export function applyReviewMutation(request: ReviewMutationRequest): ReviewMutationResponse {
  return applyReviewMutationJs(request) as ReviewMutationResponse;
}

export function persistReviewStatePatch(request: PersistReviewStatePatchRequest): ReviewMutationResponse {
  return persistReviewStatePatchJs(request) as ReviewMutationResponse;
}

export function isBaselineApprovedState(state: Record<string, unknown> | null | undefined): boolean {
  return isBaselineApprovedStateJs(state);
}

export function rebuildTopicPublicationProjection(request: { workspaceRoot: string; topicId: string }): string {
  return rebuildTopicPublicationProjectionJs(request);
}

export function buildGovernanceSurface(contract: Record<string, unknown>): GovernanceSurfaceContract {
  return buildGovernanceSurfaceJs(contract) as GovernanceSurfaceContract;
}

export function buildGateSummary(request: any): Record<string, unknown> {
  return buildGateSummaryJs(request);
}

export function buildSourceReadinessReport(summary: Record<string, unknown> | null | undefined): ReviewSurfaceResult {
  return buildSourceReadinessReportJs(summary) as ReviewSurfaceResult;
}

export type {
  AuditDeliverableRequest,
  CanonicalSourceRef,
  DeliverableReviewRequest,
  GovernanceSurfaceContract,
  PersistReviewStatePatchRequest,
  PublicationProjectionResponse,
  ReviewMutationRequest,
  ReviewMutationResponse,
  ReviewStateResponse,
  ReviewSurfaceResult,
  RuntimeWatchResponse,
} from './types.js';
