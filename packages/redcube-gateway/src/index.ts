import {
  doctorWorkspace as doctorWorkspaceJs,
} from './actions/doctor-workspace.js';
import {
  listTopics as listTopicsJs,
} from './actions/list-topics.js';

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
  ManagedRunRecordResponse,
  ManagedRunResponse,
  ManagedSupervisionResponse,
  ProductEntryRequest,
  ProductEntryResponse,
  ProductEntryManifestResponse,
  ProductEntryStartCompanion,
  ProductStatusResponse,
  ProductPreflightResponse,
  ProductEntrySessionResponse,
  OverlayCatalogResponse,
  PublicationProjectionResponse,
  ReviewMutationRequest,
  ReviewMutationResponse,
  ReviewRenderOutputRequest,
  ReviewRenderOutputResponse,
  RouteRunResponse,
  RunManagedDeliverableRequest,
  RunSourceFirstFanoutRequest,
  SourceFirstFanoutResponse,
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

async function getOverlayCatalogJs() {
  const { getDefaultOverlayCatalog } = await import('@redcube/overlay-registry');
  const catalog = getDefaultOverlayCatalog();
  return {
    ok: true,
    ...catalog,
    recommended_action: 'create_deliverable',
    summary: {
      total_overlays: catalog.overlays.length,
      total_profiles: catalog.overlays.reduce((sum, overlay) => sum + overlay.profiles.length, 0),
    },
  };
}

async function intakeSourceJs(request: any) {
  const module = await import('./actions/intake-source.js');
  return module.intakeSource(request);
}

async function researchSourceJs(request: any) {
  const module = await import('./actions/source-research.js');
  return module.researchSource(request);
}

async function prepareSourceAugmentationJs(request: any) {
  const module = await import('./actions/prepare-source-augmentation.js');
  return module.prepareSourceAugmentation(request);
}

async function prepareSourceAugmentationResultJs(request: any) {
  const module = await import('./actions/prepare-source-augmentation-result.js');
  return module.prepareSourceAugmentationResult(request);
}

async function writeSourceAugmentationResultJs(request: any) {
  const module = await import('./actions/write-source-augmentation-result.js');
  return module.writeSourceAugmentationResult(request);
}

async function executeSourceAugmentationJs(request: any) {
  const module = await import('./actions/execute-source-augmentation.js');
  return module.executeSourceAugmentation(request);
}

async function createDeliverableJs(request: any) {
  const module = await import('./actions/create-deliverable.js');
  return module.createDeliverable(request);
}

async function getDeliverableJs(request: any) {
  const module = await import('./actions/get-deliverable.js');
  return module.getDeliverable(request);
}

async function getPublicationProjectionJs(request: any) {
  const { getPublicationProjection: loadPublicationProjection } = await import('@redcube/runtime');
  return loadPublicationProjection(request);
}

async function buildPerformanceReportJs(request: any) {
  const { buildPerformanceReport: buildRuntimePerformanceReport } = await import('@redcube/runtime');
  return buildRuntimePerformanceReport(request);
}

async function getRunJs(request: any) {
  const module = await import('./actions/get-run.js');
  return module.getRun(request);
}

async function getManagedRunJs(request: any) {
  const module = await import('./actions/get-managed-run.js');
  return module.getManagedRun(request);
}

async function superviseManagedRunJs(request: any) {
  const module = await import('./actions/supervise-managed-run.js');
  return module.superviseManagedRun(request);
}

async function runDeliverableRouteJs(request: any) {
  const module = await import('./actions/run-deliverable-route.js');
  return module.runDeliverableRoute(request);
}

async function runManagedDeliverableJs(request: any) {
  const module = await import('./actions/run-managed-deliverable.js');
  return module.runManagedDeliverable(request);
}

async function runSourceFirstFanoutJs(request: any) {
  const module = await import('./actions/run-source-first-fanout.js');
  return module.runSourceFirstFanout(request);
}

async function invokeDomainEntryJs(request: any) {
  const module = await import('./actions/invoke-domain-entry.js');
  return module.invokeDomainEntry(request);
}

async function invokeProductEntryJs(request: any) {
  const module = await import('./actions/invoke-product-entry.js');
  return module.invokeProductEntry(request);
}

async function invokeFederatedProductEntryJs(request: any) {
  const module = await import('./actions/invoke-federated-product-entry.js');
  return module.invokeFederatedProductEntry(request);
}

async function getProductEntrySessionJs(request: any) {
  const module = await import('./actions/get-product-entry-session.js');
  return module.getProductEntrySession(request);
}

async function getProductEntryManifestJs(request: any) {
  const module = await import('./actions/get-product-entry-manifest.js');
  return module.getProductEntryManifest(request);
}

async function getProductStartJs(request: any) {
  const module = await import('./actions/get-product-start.js');
  return module.getProductStart(request);
}

async function getProductPreflightJs(request: any) {
  const module = await import('./actions/get-product-preflight.js');
  return module.getProductPreflight(request);
}

async function getProductStatusJs(request: any) {
  const module = await import('./actions/get-product-status.js');
  return module.getProductStatus(request);
}

async function runNativePptProductEntryProofJs(request: any) {
  const module = await import('./actions/native-ppt-product-entry-proof.js');
  return module.runNativePptProductEntryProof(request);
}

async function auditDeliverableJs(request: any) {
  const module = await import('./actions/audit-deliverable.js');
  return module.auditDeliverable(request);
}

async function reviewRenderOutputJs(request: any) {
  const { reviewRenderedDeliverable } = await import('@redcube/runtime');
  return reviewRenderedDeliverable(request);
}

async function runtimeWatchJs(request: any) {
  const module = await import('./actions/runtime-watch.js');
  return module.runtimeWatch(request);
}

async function getReviewStateJs(request: any) {
  const { getReviewState: loadReviewState } = await import('@redcube/runtime');
  return loadReviewState(request);
}

async function applyReviewMutationJs(request: any) {
  const { applyReviewMutation: mutateReviewState } = await import('@redcube/runtime');
  return mutateReviewState(request);
}

export function doctorWorkspace(request: WorkspaceRootRequest): Promise<WorkspaceDoctorResponse> {
  return doctorWorkspaceJs(request) as Promise<WorkspaceDoctorResponse>;
}

export function listTopics(request: WorkspaceRootRequest): Promise<TopicCatalogResponse> {
  return listTopicsJs(request) as Promise<TopicCatalogResponse>;
}

export function getOverlayCatalog(request?: unknown): Promise<OverlayCatalogResponse> {
  void request;
  return getOverlayCatalogJs() as unknown as Promise<OverlayCatalogResponse>;
}

export function intakeSource(request: Record<string, unknown>): Promise<SourceIntakeResponse> {
  return intakeSourceJs(request) as unknown as Promise<SourceIntakeResponse>;
}

export function researchSource(request: Record<string, unknown>): Promise<SourceResearchResponse> {
  return researchSourceJs(request) as unknown as Promise<SourceResearchResponse>;
}

export function prepareSourceAugmentation(request: Record<string, unknown>): Promise<SourceAugmentationResponse> {
  return prepareSourceAugmentationJs(request) as unknown as Promise<SourceAugmentationResponse>;
}

export function prepareSourceAugmentationResult(
  request: Record<string, unknown>,
): Promise<SourceAugmentationResultPreparationResponse> {
  return prepareSourceAugmentationResultJs(request) as unknown as Promise<SourceAugmentationResultPreparationResponse>;
}

export function writeSourceAugmentationResult(
  request: Record<string, unknown>,
): Promise<SourceAugmentationResultWriteResponse> {
  return writeSourceAugmentationResultJs(request) as unknown as Promise<SourceAugmentationResultWriteResponse>;
}

export function executeSourceAugmentation(request: Record<string, unknown>): Promise<SourceAugmentationExecutionResponse> {
  return executeSourceAugmentationJs(request) as unknown as Promise<SourceAugmentationExecutionResponse>;
}

export function createDeliverable(request: CreateDeliverableRequest): Promise<DeliverableCreateResponse> {
  return createDeliverableJs(request) as unknown as Promise<DeliverableCreateResponse>;
}

export function getDeliverable(request: DeliverableRequest): Promise<DeliverableRecordResponse> {
  return getDeliverableJs(request) as Promise<DeliverableRecordResponse>;
}

export function getPublicationProjection(request: TopicRequest): Promise<PublicationProjectionResponse> {
  return getPublicationProjectionJs(request) as unknown as Promise<PublicationProjectionResponse>;
}

export function buildPerformanceReport(request: WorkspaceRootRequest & {
  topicId?: string | null;
  deliverableId?: string | null;
}): Promise<Record<string, any>> {
  return buildPerformanceReportJs(request) as Promise<Record<string, any>>;
}

export function getRun(request: WorkspaceRootRequest & { runId: string }): Promise<RunRecordResponse> {
  return getRunJs(request) as unknown as Promise<RunRecordResponse>;
}

export function invokeDomainEntry(request: DomainEntryRequest): Promise<DomainEntryResponse> {
  return invokeDomainEntryJs(request) as unknown as Promise<DomainEntryResponse>;
}

export function invokeProductEntry(request: ProductEntryRequest): Promise<ProductEntryResponse> {
  return invokeProductEntryJs(request) as unknown as Promise<ProductEntryResponse>;
}

export function invokeFederatedProductEntry(
  request: FederatedProductEntryRequest,
): Promise<FederatedProductEntryResponse> {
  return invokeFederatedProductEntryJs(request) as unknown as Promise<FederatedProductEntryResponse>;
}

export function getProductEntrySession(request: {
  entry_session_id?: string;
  entrySessionId?: string;
}): Promise<ProductEntrySessionResponse> {
  return getProductEntrySessionJs(request) as unknown as Promise<ProductEntrySessionResponse>;
}

export function getProductEntryManifest(request: Record<string, unknown>): Promise<ProductEntryManifestResponse> {
  return getProductEntryManifestJs(request) as unknown as Promise<ProductEntryManifestResponse>;
}

export function getProductStart(request: Record<string, unknown>): Promise<ProductEntryStartCompanion> {
  return getProductStartJs(request) as Promise<ProductEntryStartCompanion>;
}

export function getProductPreflight(request: Record<string, unknown>): Promise<ProductPreflightResponse> {
  return getProductPreflightJs(request) as Promise<ProductPreflightResponse>;
}

export function getProductStatus(request: Record<string, unknown>): Promise<ProductStatusResponse> {
  return getProductStatusJs(request) as Promise<ProductStatusResponse>;
}

export function runNativePptProductEntryProof(request: Record<string, unknown>): Promise<Record<string, unknown>> {
  return runNativePptProductEntryProofJs(request) as Promise<Record<string, unknown>>;
}

export function getManagedRun(request: WorkspaceRootRequest & { managedRunId: string }): Promise<ManagedRunRecordResponse> {
  return getManagedRunJs(request) as unknown as Promise<ManagedRunRecordResponse>;
}

export function superviseManagedRun(request: SuperviseManagedRunRequest): Promise<ManagedSupervisionResponse> {
  return superviseManagedRunJs(request) as Promise<ManagedSupervisionResponse>;
}

export function runDeliverableRoute(request: RunDeliverableRouteRequest): Promise<RouteRunResponse> {
  return runDeliverableRouteJs(request) as unknown as Promise<RouteRunResponse>;
}

export function runManagedDeliverable(request: RunManagedDeliverableRequest): Promise<ManagedRunResponse> {
  return runManagedDeliverableJs(request) as unknown as Promise<ManagedRunResponse>;
}

export function runSourceFirstFanout(request: RunSourceFirstFanoutRequest): Promise<SourceFirstFanoutResponse> {
  return runSourceFirstFanoutJs(request) as unknown as Promise<SourceFirstFanoutResponse>;
}

export function auditDeliverable(request: DeliverableAuditRequest): Promise<DeliverableAuditResponse> {
  return auditDeliverableJs(request) as unknown as Promise<DeliverableAuditResponse>;
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
  ManagedRunRecordResponse,
  ManagedRunResponse,
  ManagedSupervisionResponse,
  ProductEntryRequest,
  ProductEntryResponse,
  ProductEntryManifestResponse,
  ProductEntryStartCompanion,
  ProductStatusResponse,
  ProductPreflightResponse,
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
  RunSourceFirstFanoutRequest,
  SourceFirstFanoutResponse,
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
