import { getDefaultOverlayCatalog } from '@redcube/runtime';

import type {
  OverlayCatalogResponse,
} from './types.js';

export { doctorWorkspace } from './actions/doctor-workspace.js';
export { listTopics } from './actions/list-topics.js';
export { intakeSource } from './actions/intake-source.js';
export { researchSource } from './actions/source-research.js';
export { prepareSourceAugmentation } from './actions/prepare-source-augmentation.js';
export { prepareSourceAugmentationResult } from './actions/prepare-source-augmentation-result.js';
export { writeSourceAugmentationResult } from './actions/write-source-augmentation-result.js';
export { executeSourceAugmentation } from './actions/execute-source-augmentation.js';
export { createDeliverable } from './actions/create-deliverable.js';
export { getDeliverable } from './actions/get-deliverable.js';
export { getRun } from './actions/get-run.js';
export { runDeliverableRoute } from './actions/run-deliverable-route.js';
export { runSourceFirstFanout } from './actions/run-source-first-fanout.js';
export { invokeDomainEntry } from './actions/invoke-domain-entry.js';
export { invokeProductEntry } from './actions/invoke-product-entry.js';
export { invokeOplHostedProductEntry } from './actions/invoke-opl-hosted-product-entry.js';
export { getProductEntrySession } from './actions/get-product-entry-session.js';
export { getProductEntryManifest } from './actions/get-product-entry-manifest.js';
export { getProductStart } from './actions/get-product-start.js';
export { getProductPreflight } from './actions/get-product-preflight.js';
export { getProductStatus } from './actions/get-product-status.js';
export { runNativePptProductEntryProof } from './actions/native-ppt-product-entry-proof.js';
export {
  dispatchDomainActionAdapter,
  exportDomainActionAdapter,
} from './actions/domain-action-adapter.js';
export {
  dispatchDomainHandler,
  exportDomainHandler,
} from './actions/domain-handler.js';
export { auditDeliverable } from './actions/audit-deliverable.js';
export { runtimeWatch } from './actions/run-review-ref-projection.js';
export {
  applyReviewMutation,
  buildPerformanceReport,
  getPublicationProjection,
  getReviewState,
  reviewRenderedDeliverable as reviewRenderOutput,
} from '@redcube/runtime';

export async function getOverlayCatalog(request?: unknown): Promise<OverlayCatalogResponse> {
  void request;
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

export {
  buildFamilyDomainMemoryDescriptor,
  buildStandardDomainAgentSkeleton,
} from './actions/standard-domain-agent-skeleton.js';

export {
  buildRedCubeActionMetadata,
  findRedCubeCliCommand,
  getRedCubeFamilyActionCatalog,
} from './actions/family-action-catalog.js';

export {
  buildRedCubeFamilyStageControlPlane,
  buildRedCubeFamilyStageControlPlaneContract,
} from './actions/family-stage-control-plane.js';

export {
  buildPrivatizedFunctionalModuleAuditProjection,
  OPL_GENERATED_INTERFACE_CONSUMPTION,
  buildVisualPackCompilerHandoffProjection,
  RCA_COGNITIVE_KERNEL_ADOPTION,
  RCA_GOLDEN_PATH_PROFILE,
} from './actions/guarded-domain-actions.js';

export {
  listDomainActionAdapterBlockedActions,
  listDomainActionAdapterForbiddenWrites,
  listDomainActionAdapterGuardedActionIds,
  listDomainActionAdapterGuardedActions,
} from './actions/domain-action-adapter-parts/guarded-action-catalog.js';

export {
  buildPhysicalSourceMorphologyPolicy,
} from './actions/domain-action-adapter-parts/physical-source-morphology-policy.js';

export {
  buildOplLedgerArtifactRegistrationContract,
} from './actions/get-product-entry-manifest-parts/opl-ledger-artifact-registration.js';

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
  OplHostedProductEntryRequest,
  OplHostedProductEntryResponse,
  DeliverableRequest,
  ProductEntryRequest,
  ProductEntryResponse,
  ProductEntryManifestResponse,
  ProductEntryStartCompanion,
  ProductStatusResponse,
  ProductPreflightResponse,
  ProductEntrySessionResponse,
  OverlayCatalogResponse,
  TopicCatalogResponse,
  PublicationProjectionResponse,
  ReviewMutationRequest,
  ReviewMutationResponse,
  ReviewRenderOutputRequest,
  ReviewRenderOutputResponse,
  ReviewStateResponse,
  RouteRunResponse,
  RunSourceFirstFanoutRequest,
  SourceFirstFanoutResponse,
  RunDeliverableRouteRequest,
  RunRecordResponse,
  RuntimeWatchResponse,
  SourceIntakeResponse,
  SourceResearchResponse,
  SourceAugmentationResponse,
  SourceAugmentationResultPreparationResponse,
  SourceAugmentationResultWriteResponse,
  SourceAugmentationExecutionResponse,
  TopicRequest,
  WorkspaceDoctorResponse,
  WorkspaceRootRequest,
} from './types.js';
