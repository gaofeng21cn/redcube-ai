import {
  auditDeliverableRequest as auditDeliverableRequestJs,
  reviewRenderedDeliverable as reviewRenderedDeliverableJs,
  watchRuntimeReviewLoop as watchRuntimeReviewLoopJs,
  applyReviewMutation as applyReviewMutationJs,
  getPublicationProjection as getPublicationProjectionJs,
  getReviewState as getReviewStateJs,
  isBaselineApprovedState as isBaselineApprovedStateJs,
  persistReviewStatePatch as persistReviewStatePatchJs,
  rebuildTopicPublicationProjection as rebuildTopicPublicationProjectionJs,
} from '@redcube/governance';
import {
  loadReferenceSampleFixture as loadReferenceSampleFixtureJs,
  listPromotedReferences as listPromotedReferencesJs,
  listReferenceSamples as listReferenceSamplesJs,
  summarizeReferenceCoverage as summarizeReferenceCoverageJs,
  validateReferenceSampleMeta as validateReferenceSampleMetaJs,
  buildReferencePromotionReport as buildReferencePromotionReportJs,
  buildReferenceQualityReport as buildReferenceQualityReportJs,
  buildReferenceReplacementReport as buildReferenceReplacementReportJs,
  buildRelativeQualityRubric as buildRelativeQualityRubricJs,
  compareFailuresAndDensity as compareFailuresAndDensityJs,
  summarizeRelativeQuality as summarizeRelativeQualityJs,
} from '@redcube/reference-os';

import { appendEvent as appendEventJs, readEvents as readEventsJs } from './event-log.js';
import { runDeliverableRoute as runDeliverableRouteJs } from './deliverable-routes.js';
import { resolveExecutorAdapter as resolveExecutorAdapterJs } from './executors.js';
import { completeRun as completeRunJs, failRun as failRunJs, loadRun as loadRunJs, startRun as startRunJs } from './run-store.js';
import { intakeSource as intakeSourceJs } from './source-intake.js';

import type {
  RuntimeCompleteRunRequest,
  RuntimeEventRecord,
  RuntimeFailRunRequest,
  RuntimeRunLookupRequest,
  RuntimeRunRecord,
  RuntimeRunRouteRequest,
  RuntimeRunRouteResponse,
  RuntimeSourceIntakeRequest,
  RuntimeSourceIntakeResponse,
  RuntimeStartRunRequest,
} from './types.js';

export const auditDeliverableRequest = auditDeliverableRequestJs;
export const reviewRenderedDeliverable = reviewRenderedDeliverableJs;
export const watchRuntimeReviewLoop = watchRuntimeReviewLoopJs;
export const applyReviewMutation = applyReviewMutationJs;
export const getPublicationProjection = getPublicationProjectionJs;
export const getReviewState = getReviewStateJs;
export const isBaselineApprovedState = isBaselineApprovedStateJs;
export const persistReviewStatePatch = persistReviewStatePatchJs;
export const rebuildTopicPublicationProjection = rebuildTopicPublicationProjectionJs;

export const loadReferenceSampleFixture = loadReferenceSampleFixtureJs;
export const listPromotedReferences = listPromotedReferencesJs;
export const listReferenceSamples = listReferenceSamplesJs;
export const summarizeReferenceCoverage = summarizeReferenceCoverageJs;
export const validateReferenceSampleMeta = validateReferenceSampleMetaJs;
export const buildReferencePromotionReport = buildReferencePromotionReportJs;
export const buildReferenceQualityReport = buildReferenceQualityReportJs;
export const buildReferenceReplacementReport = buildReferenceReplacementReportJs;
export const buildRelativeQualityRubric = buildRelativeQualityRubricJs;
export const compareFailuresAndDensity = compareFailuresAndDensityJs;
export const summarizeRelativeQuality = summarizeRelativeQualityJs;

export function appendEvent(workspaceRoot: string, runId: string, event: RuntimeEventRecord): void {
  return appendEventJs(workspaceRoot, runId, event);
}

export function readEvents(workspaceRoot: string, runId: string): unknown[] {
  return readEventsJs(workspaceRoot, runId) as unknown[];
}

export async function runDeliverableRoute(request: RuntimeRunRouteRequest): Promise<RuntimeRunRouteResponse> {
  return runDeliverableRouteJs(request) as Promise<RuntimeRunRouteResponse>;
}

export const resolveExecutorAdapter = resolveExecutorAdapterJs;

export function completeRun(request: RuntimeCompleteRunRequest): RuntimeRunRecord {
  return completeRunJs(request) as RuntimeRunRecord;
}

export function loadRun(request: RuntimeRunLookupRequest): RuntimeRunRecord {
  return loadRunJs(request) as RuntimeRunRecord;
}

export function startRun(request: RuntimeStartRunRequest): RuntimeRunRecord {
  return startRunJs(request) as RuntimeRunRecord;
}

export function failRun(request: RuntimeFailRunRequest): RuntimeRunRecord {
  return failRunJs(request) as RuntimeRunRecord;
}

export async function intakeSource(request: RuntimeSourceIntakeRequest): Promise<RuntimeSourceIntakeResponse> {
  const intake = intakeSourceJs as unknown as (request: RuntimeSourceIntakeRequest) => Promise<RuntimeSourceIntakeResponse>;
  return intake(request);
}

export type {
  RuntimeCompleteRunRequest,
  RuntimeEventRecord,
  RuntimeFailRunRequest,
  RuntimeRunLookupRequest,
  RuntimeRunRecord,
  RuntimeRunRouteRequest,
  RuntimeRunRouteResponse,
  RuntimeSourceIntakeRequest,
  RuntimeSourceIntakeResponse,
  RuntimeStartRunRequest,
} from './types.js';
