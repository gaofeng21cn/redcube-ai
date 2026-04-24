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
import { appendManagedEvent as appendManagedEventJs, readManagedEvents as readManagedEventsJs } from './managed-event-log.js';
import {
  planCandidateRace as planCandidateRaceJs,
  selectCandidateRaceWinner as selectCandidateRaceWinnerJs,
} from './candidate-racing.js';
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
import {
  getManagedRun as getManagedRunJs,
  runManagedDeliverable as runManagedDeliverableJs,
  superviseManagedRun as superviseManagedRunJs,
} from './managed-deliverable.js';
import {
  executeManagedDagLayers as executeManagedDagLayersJs,
  planManagedDeliverableDag as planManagedDeliverableDagJs,
} from './managed-dag-scheduler.js';
import {
  loadProductEntrySession as loadProductEntrySessionJs,
  productEntrySessionDir as productEntrySessionDirJs,
  productEntrySessionFile as productEntrySessionFileJs,
  saveProductEntrySession as saveProductEntrySessionJs,
} from './product-entry-session-store.js';
import { resolveExecutorAdapter as resolveExecutorAdapterJs } from './executors.js';
import { completeRun as completeRunJs, failRun as failRunJs, loadRun as loadRunJs, startRun as startRunJs } from './run-store.js';
import {
  createManagedRun as createManagedRunJs,
  loadManagedProgressProjection as loadManagedProgressProjectionJs,
  loadManagedRun as loadManagedRunJs,
  managedPromptAuditFile as managedPromptAuditFileJs,
  managedResultFile as managedResultFileJs,
  saveManagedProgressProjection as saveManagedProgressProjectionJs,
  saveManagedRun as saveManagedRunJs,
} from './managed-run-store.js';
import { executeSourceAugmentation as executeSourceAugmentationJs } from './source-augmentation-execution.js';
import { resolveSourceAugmentationAdapter as resolveSourceAugmentationAdapterJs } from './source-augmentation-executor.js';
import { prepareSourceAugmentation as prepareSourceAugmentationJs } from './source-augmentation-request.js';
import {
  prepareSourceAugmentationResult as prepareSourceAugmentationResultJs,
  writeSourceAugmentationResult as writeSourceAugmentationResultJs,
} from './source-augmentation-result.js';
import { researchSource as researchSourceJs } from './source-research.js';
import { intakeSource as intakeSourceJs } from './source-intake.js';

import type {
  RuntimeCompleteRunRequest,
  RuntimeEventRecord,
  RuntimeFailRunRequest,
  RuntimeManagedProgressProjection,
  RuntimeManagedRunLookupRequest,
  RuntimeManagedRunRecord,
  RuntimeManagedRunRequest,
  RuntimeManagedRunResponse,
  RuntimeManagedSupervisionRequest,
  RuntimeProductEntrySessionRecord,
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
  RuntimeSourceResearchRequest,
  RuntimeSourceResearchResponse,
  RuntimeSourceAugmentationRequest,
  RuntimeSourceAugmentationResponse,
  RuntimeSourceAugmentationResultPreparationRequest,
  RuntimeSourceAugmentationResultPreparationResponse,
  RuntimeSourceAugmentationResultWriteRequest,
  RuntimeSourceAugmentationResultWriteResponse,
  RuntimeSourceAugmentationExecutionRequest,
  RuntimeSourceAugmentationExecutionResponse,
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

export function appendManagedEvent(workspaceRoot: string, managedRunId: string, event: RuntimeEventRecord): void {
  return appendManagedEventJs(workspaceRoot, managedRunId, event);
}

export function readManagedEvents(workspaceRoot: string, managedRunId: string): unknown[] {
  return readManagedEventsJs(workspaceRoot, managedRunId) as unknown[];
}

export function planCandidateRace(request: Record<string, unknown>): Record<string, unknown> {
  return planCandidateRaceJs(request) as Record<string, unknown>;
}

export function selectCandidateRaceWinner(request: Record<string, unknown>): Record<string, unknown> {
  return selectCandidateRaceWinnerJs(request) as Record<string, unknown>;
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
  const runRoute = runDeliverableRouteJs as unknown as (
    request: RuntimeRunRouteRequest,
  ) => Promise<RuntimeRunRouteResponse>;
  return runRoute(request);
}

export async function runManagedDeliverable(
  request: RuntimeManagedRunRequest,
): Promise<RuntimeManagedRunResponse> {
  const runManaged = runManagedDeliverableJs as unknown as (
    request: RuntimeManagedRunRequest,
  ) => Promise<RuntimeManagedRunResponse>;
  return runManaged(request);
}

export async function getManagedRun(
  request: RuntimeManagedRunLookupRequest,
): Promise<RuntimeManagedRunResponse> {
  return getManagedRunJs(request) as Promise<RuntimeManagedRunResponse>;
}

export async function superviseManagedRun(
  request: RuntimeManagedSupervisionRequest,
): Promise<RuntimeManagedRunResponse> {
  return superviseManagedRunJs(request) as Promise<RuntimeManagedRunResponse>;
}

export function planManagedDeliverableDag(request: Record<string, unknown>): Record<string, unknown> {
  return planManagedDeliverableDagJs(request) as Record<string, unknown>;
}

export function executeManagedDagLayers(request: Record<string, unknown>): Promise<Record<string, unknown>> {
  return executeManagedDagLayersJs(request) as Promise<Record<string, unknown>>;
}

export function productEntrySessionDir(): string {
  return productEntrySessionDirJs() as string;
}

export function productEntrySessionFile(entrySessionId: string): string {
  return productEntrySessionFileJs(entrySessionId) as string;
}

export function loadProductEntrySession(request: {
  entrySessionId: string;
}): RuntimeProductEntrySessionRecord | null {
  return loadProductEntrySessionJs(request) as RuntimeProductEntrySessionRecord | null;
}

export function saveProductEntrySession(request: {
  session: RuntimeProductEntrySessionRecord;
}): {
  session: RuntimeProductEntrySessionRecord;
  file: string;
} {
  return saveProductEntrySessionJs(request) as {
    session: RuntimeProductEntrySessionRecord;
    file: string;
  };
}

export const resolveExecutorAdapter = resolveExecutorAdapterJs;
export const resolveSourceAugmentationAdapter = resolveSourceAugmentationAdapterJs;

export function completeRun(request: RuntimeCompleteRunRequest): RuntimeRunRecord {
  const complete = completeRunJs as unknown as (
    request: RuntimeCompleteRunRequest,
  ) => RuntimeRunRecord;
  return complete(request);
}

export function loadRun(request: RuntimeRunLookupRequest): RuntimeRunRecord {
  const load = loadRunJs as unknown as (
    request: RuntimeRunLookupRequest,
  ) => RuntimeRunRecord;
  return load(request);
}

export function startRun(request: RuntimeStartRunRequest): RuntimeRunRecord {
  const start = startRunJs as unknown as (request: RuntimeStartRunRequest) => RuntimeRunRecord;
  return start(request);
}

export function failRun(request: RuntimeFailRunRequest): RuntimeRunRecord {
  const fail = failRunJs as unknown as (
    request: RuntimeFailRunRequest,
  ) => RuntimeRunRecord;
  return fail(request);
}

export function createManagedRun(request: RuntimeManagedRunRequest): RuntimeManagedRunRecord {
  const create = createManagedRunJs as unknown as (
    request: RuntimeManagedRunRequest,
  ) => RuntimeManagedRunRecord;
  return create(request);
}

export function loadManagedRun(request: RuntimeManagedRunLookupRequest): RuntimeManagedRunRecord {
  return loadManagedRunJs(request) as RuntimeManagedRunRecord;
}

export function saveManagedRun(request: {
  workspaceRoot: string;
  managedRun: RuntimeManagedRunRecord;
}): RuntimeManagedRunRecord {
  return saveManagedRunJs(request) as RuntimeManagedRunRecord;
}

export function loadManagedProgressProjection(
  request: RuntimeManagedRunLookupRequest,
): RuntimeManagedProgressProjection | null {
  return loadManagedProgressProjectionJs(request) as RuntimeManagedProgressProjection | null;
}

export function saveManagedProgressProjection(request: {
  workspaceRoot: string;
  managedRunId: string;
  projection: RuntimeManagedProgressProjection;
}): string {
  return saveManagedProgressProjectionJs(request) as string;
}

export function managedPromptAuditFile(request: {
  workspaceRoot: string;
  managedRunId: string;
  stageId: string;
  attempt: number;
}): string {
  return managedPromptAuditFileJs(request) as string;
}

export function managedResultFile(request: {
  workspaceRoot: string;
  managedRunId: string;
  stageId: string;
  attempt: number;
}): string {
  return managedResultFileJs(request) as string;
}

export async function intakeSource(request: RuntimeSourceIntakeRequest): Promise<RuntimeSourceIntakeResponse> {
  const intake = intakeSourceJs as unknown as (request: RuntimeSourceIntakeRequest) => Promise<RuntimeSourceIntakeResponse>;
  return intake(request);
}

export async function researchSource(request: RuntimeSourceResearchRequest): Promise<RuntimeSourceResearchResponse> {
  const research = researchSourceJs as unknown as (
    request: RuntimeSourceResearchRequest,
  ) => Promise<RuntimeSourceResearchResponse>;
  return research(request);
}

export async function prepareSourceAugmentation(
  request: RuntimeSourceAugmentationRequest,
): Promise<RuntimeSourceAugmentationResponse> {
  const prepare = prepareSourceAugmentationJs as unknown as (
    request: RuntimeSourceAugmentationRequest,
  ) => Promise<RuntimeSourceAugmentationResponse>;
  return prepare(request);
}

export async function executeSourceAugmentation(
  request: RuntimeSourceAugmentationExecutionRequest,
): Promise<RuntimeSourceAugmentationExecutionResponse> {
  const execute = executeSourceAugmentationJs as unknown as (
    request: RuntimeSourceAugmentationExecutionRequest,
  ) => Promise<RuntimeSourceAugmentationExecutionResponse>;
  return execute(request);
}

export async function prepareSourceAugmentationResult(
  request: RuntimeSourceAugmentationResultPreparationRequest,
): Promise<RuntimeSourceAugmentationResultPreparationResponse> {
  const prepare = prepareSourceAugmentationResultJs as unknown as (
    request: RuntimeSourceAugmentationResultPreparationRequest,
  ) => Promise<RuntimeSourceAugmentationResultPreparationResponse>;
  return prepare(request);
}

export async function writeSourceAugmentationResult(
  request: RuntimeSourceAugmentationResultWriteRequest,
): Promise<RuntimeSourceAugmentationResultWriteResponse> {
  const write = writeSourceAugmentationResultJs as unknown as (
    request: RuntimeSourceAugmentationResultWriteRequest,
  ) => Promise<RuntimeSourceAugmentationResultWriteResponse>;
  return write(request);
}

export type {
  RuntimeCompleteRunRequest,
  RuntimeEventRecord,
  RuntimeFailRunRequest,
  RuntimeManagedProgressProjection,
  RuntimeManagedRunLookupRequest,
  RuntimeManagedRunRecord,
  RuntimeManagedRunRequest,
  RuntimeManagedRunResponse,
  RuntimeManagedSupervisionRequest,
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
  RuntimeSourceResearchRequest,
  RuntimeSourceResearchResponse,
  RuntimeSourceAugmentationRequest,
  RuntimeSourceAugmentationResponse,
  RuntimeSourceAugmentationResultPreparationRequest,
  RuntimeSourceAugmentationResultPreparationResponse,
  RuntimeSourceAugmentationResultWriteRequest,
  RuntimeSourceAugmentationResultWriteResponse,
  RuntimeSourceAugmentationExecutionRequest,
  RuntimeSourceAugmentationExecutionResponse,
  RuntimeStartRunRequest,
} from './types.js';
