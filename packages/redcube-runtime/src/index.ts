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
import {
  P19_CREATIVE_OWNERSHIP_PROGRAM_CLOSEOUT as P19CreativeOwnershipProgramCloseoutJs,
  P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT as P19CreativeOwnershipExecutionContractJs,
  P19_CREATIVE_OWNERSHIP_LIFECYCLE_CONTRACT as P19CreativeOwnershipLifecycleContractJs,
  P19_CREATIVE_OWNERSHIP_FORBIDDEN_BOUNDARIES as P19CreativeOwnershipForbiddenBoundariesJs,
  P19_RESEARCH_OWNERSHIP_CONTRACT as P19ResearchOwnershipContractJs,
  P19_REVIEW_OVERLAY_CONTRACT as P19ReviewOverlayContractJs,
  P19_TEAM_GATE_CONTRACT as P19TeamGateContractJs,
  P19_UNIFIED_LIFECYCLE_CONTRACT as P19UnifiedLifecycleContractJs,
  buildCreativeOwnershipResidueAudit as buildCreativeOwnershipResidueAuditJs,
} from './creative-ownership.js';
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
  RuntimeCreativeOwnershipAudit,
  RuntimeCreativeOwnershipCloseoutAudit,
  RuntimeCreativeOwnershipExecutionContract,
  RuntimeCreativeOwnershipLifecycleContract,
  RuntimeCreativeOwnershipForbiddenBoundaries,
  RuntimeCreativeOwnershipProgramCloseout,
  RuntimeCreativeOwnershipProgramStatus,
  RuntimeCreativeOwnershipResearchOwnershipContract,
  RuntimeCreativeOwnershipReviewOverlayContract,
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

export const P19_CREATIVE_OWNERSHIP_PROGRAM_CLOSEOUT
  = P19CreativeOwnershipProgramCloseoutJs as RuntimeCreativeOwnershipProgramCloseout;
export const P19_CREATIVE_OWNERSHIP_EXECUTION_CONTRACT
  = P19CreativeOwnershipExecutionContractJs as RuntimeCreativeOwnershipExecutionContract;
export const P19_CREATIVE_OWNERSHIP_LIFECYCLE_CONTRACT
  = P19CreativeOwnershipLifecycleContractJs as RuntimeCreativeOwnershipLifecycleContract;
export const P19_CREATIVE_OWNERSHIP_FORBIDDEN_BOUNDARIES
  = P19CreativeOwnershipForbiddenBoundariesJs as RuntimeCreativeOwnershipForbiddenBoundaries;
export const P19_RESEARCH_OWNERSHIP_CONTRACT
  = P19ResearchOwnershipContractJs as RuntimeCreativeOwnershipResearchOwnershipContract;
export const P19_REVIEW_OVERLAY_CONTRACT
  = P19ReviewOverlayContractJs as RuntimeCreativeOwnershipReviewOverlayContract;
export const P19_TEAM_GATE_CONTRACT = P19TeamGateContractJs;
export const P19_UNIFIED_LIFECYCLE_CONTRACT
  = P19UnifiedLifecycleContractJs as RuntimeCreativeOwnershipLifecycleContract;

export function buildCreativeOwnershipResidueAudit(): RuntimeCreativeOwnershipAudit {
  return buildCreativeOwnershipResidueAuditJs() as RuntimeCreativeOwnershipAudit;
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
  RuntimeCreativeOwnershipAudit,
  RuntimeCreativeOwnershipCloseoutAudit,
  RuntimeCreativeOwnershipExecutionContract,
  RuntimeCreativeOwnershipLifecycleContract,
  RuntimeCreativeOwnershipForbiddenBoundaries,
  RuntimeCreativeOwnershipProgramCloseout,
  RuntimeCreativeOwnershipProgramStatus,
  RuntimeCreativeOwnershipResearchOwnershipContract,
  RuntimeCreativeOwnershipReviewOverlayContract,
  RuntimeSourceIntakeRequest,
  RuntimeSourceIntakeResponse,
  RuntimeStartRunRequest,
} from './types.js';
