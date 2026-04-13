import {
  doctorWorkspace as doctorWorkspaceJs,
  listTopics as listTopicsJs,
  getOverlayCatalog as getOverlayCatalogJs,
  intakeSource as intakeSourceJs,
  researchSource as researchSourceJs,
  prepareSourceAugmentation as prepareSourceAugmentationJs,
  prepareSourceAugmentationResult as prepareSourceAugmentationResultJs,
  writeSourceAugmentationResult as writeSourceAugmentationResultJs,
  executeSourceAugmentation as executeSourceAugmentationJs,
  importLegacyProject as importLegacyProjectJs,
  createDeliverable as createDeliverableJs,
  getDeliverable as getDeliverableJs,
  getPublicationProjection as getPublicationProjectionJs,
  getRun as getRunJs,
  invokeDomainEntry as invokeDomainEntryJs,
  invokeProductEntry as invokeProductEntryJs,
  invokeFederatedProductEntry as invokeFederatedProductEntryJs,
  getProductEntrySession as getProductEntrySessionJs,
  getProductEntryManifest as getProductEntryManifestJs,
  getManagedRun as getManagedRunJs,
  superviseManagedRun as superviseManagedRunJs,
  runDeliverableRoute as runDeliverableRouteJs,
  runManagedDeliverable as runManagedDeliverableJs,
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
  DomainEntryRequest,
  DomainEntryResponse,
  FamilyOrchestrationCompanion,
  FamilyOrchestrationGatePreview,
  FamilyOrchestrationReferenceRef,
  FamilyOrchestrationResumeContract,
  FederatedProductEntryRequest,
  FederatedProductEntryResponse,
  DeliverableRequest,
  LegacyImportResponse,
  ManagedRunRecordResponse,
  ManagedRunResponse,
  ManagedSupervisionResponse,
  ProductEntryRequest,
  ProductEntryResponse,
  ProductEntryManifestResponse,
  ProductEntrySessionResponse,
  OverlayCatalogResponse,
  PublicationProjectionResponse,
  ReviewMutationRequest,
  ReviewMutationResponse,
  ReviewRenderOutputRequest,
  ReviewRenderOutputResponse,
  RouteRunResponse,
  RunManagedDeliverableRequest,
  RunDeliverableRouteRequest,
  RunRecordResponse,
  SuperviseManagedRunRequest,
  RuntimeWatchResponse,
  SourceIntakeResponse,
  SourceResearchResponse,
  SourceAugmentationResponse,
  SourceAugmentationResultPreparationResponse,
  SourceAugmentationResultWriteResponse,
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

export function researchSource(request: Record<string, unknown>): Promise<SourceResearchResponse> {
  return researchSourceJs(request) as Promise<SourceResearchResponse>;
}

export function prepareSourceAugmentation(request: Record<string, unknown>): Promise<SourceAugmentationResponse> {
  return prepareSourceAugmentationJs(request) as Promise<SourceAugmentationResponse>;
}

export function prepareSourceAugmentationResult(
  request: Record<string, unknown>,
): Promise<SourceAugmentationResultPreparationResponse> {
  return prepareSourceAugmentationResultJs(request) as Promise<SourceAugmentationResultPreparationResponse>;
}

export function writeSourceAugmentationResult(
  request: Record<string, unknown>,
): Promise<SourceAugmentationResultWriteResponse> {
  return writeSourceAugmentationResultJs(request) as Promise<SourceAugmentationResultWriteResponse>;
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

export function invokeDomainEntry(request: DomainEntryRequest): Promise<DomainEntryResponse> {
  return invokeDomainEntryJs(request) as Promise<DomainEntryResponse>;
}

export function invokeProductEntry(request: ProductEntryRequest): Promise<ProductEntryResponse> {
  return invokeProductEntryJs(request) as Promise<ProductEntryResponse>;
}

export function invokeFederatedProductEntry(
  request: FederatedProductEntryRequest,
): Promise<FederatedProductEntryResponse> {
  return invokeFederatedProductEntryJs(request) as Promise<FederatedProductEntryResponse>;
}

export function getProductEntrySession(request: {
  entry_session_id?: string;
  entrySessionId?: string;
}): Promise<ProductEntrySessionResponse> {
  return getProductEntrySessionJs(request) as Promise<ProductEntrySessionResponse>;
}

export function getProductEntryManifest(request: Record<string, unknown>): Promise<ProductEntryManifestResponse> {
  return getProductEntryManifestJs(request) as Promise<ProductEntryManifestResponse>;
}

export function getManagedRun(request: WorkspaceRootRequest & { managedRunId: string }): Promise<ManagedRunRecordResponse> {
  return getManagedRunJs(request) as Promise<ManagedRunRecordResponse>;
}

export function superviseManagedRun(request: SuperviseManagedRunRequest): Promise<ManagedSupervisionResponse> {
  return superviseManagedRunJs(request) as Promise<ManagedSupervisionResponse>;
}

export function runDeliverableRoute(request: RunDeliverableRouteRequest): Promise<RouteRunResponse> {
  return runDeliverableRouteJs(request) as Promise<RouteRunResponse>;
}

export function runManagedDeliverable(request: RunManagedDeliverableRequest): Promise<ManagedRunResponse> {
  return runManagedDeliverableJs(request) as Promise<ManagedRunResponse>;
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
  DomainEntryRequest,
  DomainEntryResponse,
  FamilyOrchestrationCompanion,
  FamilyOrchestrationGatePreview,
  FamilyOrchestrationReferenceRef,
  FamilyOrchestrationResumeContract,
  FederatedProductEntryRequest,
  FederatedProductEntryResponse,
  DeliverableRequest,
  LegacyImportResponse,
  ManagedRunRecordResponse,
  ManagedRunResponse,
  ManagedSupervisionResponse,
  ProductEntryRequest,
  ProductEntryResponse,
  ProductEntryManifestResponse,
  ProductEntrySessionResponse,
  OverlayCatalogResponse,
  PublicationProjectionResponse,
  ReviewMutationRequest,
  ReviewMutationResponse,
  ReviewRenderOutputRequest,
  ReviewRenderOutputResponse,
  ReviewStateResponse,
  RouteRunResponse,
  RunManagedDeliverableRequest,
  RunDeliverableRouteRequest,
  RunRecordResponse,
  SuperviseManagedRunRequest,
  RuntimeWatchResponse,
  SourceIntakeResponse,
  SourceResearchResponse,
  SourceAugmentationResponse,
  SourceAugmentationResultPreparationResponse,
  SourceAugmentationResultWriteResponse,
  SourceAugmentationExecutionResponse,
  TopicCatalogResponse,
  TopicRequest,
  WorkspaceDoctorResponse,
  WorkspaceRootRequest,
} from './types.js';
