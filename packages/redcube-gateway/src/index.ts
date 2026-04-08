import {
  doctorWorkspace as doctorWorkspaceJs,
  listTopics as listTopicsJs,
  getOverlayCatalog as getOverlayCatalogJs,
  intakeSource as intakeSourceJs,
  prepareSourceAugmentation as prepareSourceAugmentationJs,
  executeSourceAugmentation as executeSourceAugmentationJs,
  importLegacyProject as importLegacyProjectJs,
  createDeliverable as createDeliverableJs,
  getDeliverable as getDeliverableJs,
  getPublicationProjection as getPublicationProjectionJs,
  getRun as getRunJs,
  runDeliverableRoute as runDeliverableRouteJs,
  auditDeliverable as auditDeliverableJs,
  reviewRenderOutput as reviewRenderOutputJs,
  runtimeWatch as runtimeWatchJs,
  getReviewState as getReviewStateJs,
  applyReviewMutation as applyReviewMutationJs,
} from './index.js';

import type {
  CreateDeliverableRequest,
  DeliverableAuditRequest,
  DeliverableAuditResponse,
  DeliverableCreateResponse,
  DeliverableRecordResponse,
  DeliverableRequest,
  LegacyImportResponse,
  OverlayCatalogResponse,
  PublicationProjectionResponse,
  ReviewMutationRequest,
  ReviewMutationResponse,
  ReviewRenderOutputRequest,
  ReviewRenderOutputResponse,
  RouteRunResponse,
  RunDeliverableRouteRequest,
  RunRecordResponse,
  RuntimeWatchResponse,
  SourceIntakeResponse,
  SourceAugmentationResponse,
  SourceAugmentationExecutionResponse,
  TopicRequest,
  TopicCatalogResponse,
  WorkspaceDoctorResponse,
  WorkspaceRootRequest,
  ReviewStateResponse,
} from './types.js';

export function doctorWorkspace(request: WorkspaceRootRequest): Promise<WorkspaceDoctorResponse> {
  return doctorWorkspaceJs(request) as Promise<WorkspaceDoctorResponse>;
}

export function listTopics(request: WorkspaceRootRequest): Promise<TopicCatalogResponse> {
  return listTopicsJs(request) as Promise<TopicCatalogResponse>;
}

export function getOverlayCatalog(request?: unknown): Promise<OverlayCatalogResponse> {
  return getOverlayCatalogJs(request) as Promise<OverlayCatalogResponse>;
}

export function intakeSource(request: Record<string, unknown>): Promise<SourceIntakeResponse> {
  return intakeSourceJs(request) as Promise<SourceIntakeResponse>;
}

export function prepareSourceAugmentation(request: Record<string, unknown>): Promise<SourceAugmentationResponse> {
  return prepareSourceAugmentationJs(request) as Promise<SourceAugmentationResponse>;
}

export function executeSourceAugmentation(request: Record<string, unknown>): Promise<SourceAugmentationExecutionResponse> {
  return executeSourceAugmentationJs(request) as Promise<SourceAugmentationExecutionResponse>;
}

export function importLegacyProject(request: Record<string, unknown>): Promise<LegacyImportResponse> {
  return importLegacyProjectJs(request) as Promise<LegacyImportResponse>;
}

export function createDeliverable(request: CreateDeliverableRequest): Promise<DeliverableCreateResponse> {
  return createDeliverableJs(request) as Promise<DeliverableCreateResponse>;
}

export function getDeliverable(request: DeliverableRequest): Promise<DeliverableRecordResponse> {
  return getDeliverableJs(request) as Promise<DeliverableRecordResponse>;
}

export function getPublicationProjection(request: TopicRequest): Promise<PublicationProjectionResponse> {
  return getPublicationProjectionJs(request) as Promise<PublicationProjectionResponse>;
}

export function getRun(request: WorkspaceRootRequest & { runId: string }): Promise<RunRecordResponse> {
  return getRunJs(request) as Promise<RunRecordResponse>;
}

export function runDeliverableRoute(request: RunDeliverableRouteRequest): Promise<RouteRunResponse> {
  return runDeliverableRouteJs(request) as Promise<RouteRunResponse>;
}

export function auditDeliverable(request: DeliverableAuditRequest): Promise<DeliverableAuditResponse> {
  return auditDeliverableJs(request) as Promise<DeliverableAuditResponse>;
}

export function reviewRenderOutput(request: ReviewRenderOutputRequest): Promise<ReviewRenderOutputResponse> {
  return reviewRenderOutputJs(request) as Promise<ReviewRenderOutputResponse>;
}

export function runtimeWatch(request: Record<string, unknown>): Promise<RuntimeWatchResponse> {
  return runtimeWatchJs(request) as Promise<RuntimeWatchResponse>;
}

export function getReviewState(request: DeliverableRequest): Promise<ReviewStateResponse> {
  return getReviewStateJs(request) as Promise<ReviewStateResponse>;
}

export function applyReviewMutation(request: ReviewMutationRequest): Promise<ReviewMutationResponse> {
  return applyReviewMutationJs(request) as Promise<ReviewMutationResponse>;
}

export type {
  CreateDeliverableRequest,
  DeliverableAuditRequest,
  DeliverableAuditResponse,
  DeliverableCreateResponse,
  DeliverableRecordResponse,
  DeliverableRequest,
  LegacyImportResponse,
  OverlayCatalogResponse,
  PublicationProjectionResponse,
  ReviewMutationRequest,
  ReviewMutationResponse,
  ReviewRenderOutputRequest,
  ReviewRenderOutputResponse,
  ReviewStateResponse,
  RouteRunResponse,
  RunDeliverableRouteRequest,
  RunRecordResponse,
  RuntimeWatchResponse,
  SourceIntakeResponse,
  SourceAugmentationResponse,
  SourceAugmentationExecutionResponse,
  TopicCatalogResponse,
  TopicRequest,
  WorkspaceDoctorResponse,
  WorkspaceRootRequest,
} from './types.js';
