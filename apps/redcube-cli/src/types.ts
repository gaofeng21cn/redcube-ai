import type {
  CreateDeliverableRequest,
  DeliverableAuditRequest,
  DeliverableAuditResponse,
  DeliverableCreateResponse,
  DeliverableRecordResponse,
  DomainEntryRequest,
  DomainEntryResponse,
  ManagedRunRecordResponse,
  ManagedSupervisionResponse,
  OverlayCatalogResponse,
  ProductEntryRequest,
  ProductEntryResponse,
  ProductEntrySessionResponse,
  PublicationProjectionResponse,
  ReviewMutationRequest,
  ReviewMutationResponse,
  ReviewStateResponse,
  RouteRunResponse,
  RunRecordResponse,
  RuntimeWatchResponse,
  SourceAugmentationResponse,
  SourceAugmentationExecutionResponse,
  SourceIntakeResponse,
  TopicCatalogResponse,
  WorkspaceDoctorResponse,
  SuperviseManagedRunRequest,
} from '@redcube/gateway';

export interface CliOptions extends Record<string, string | boolean> {}

export interface CliHelpSurface extends Record<string, unknown> {
  ok: true;
  preferredEntry: string[];
  availableOverlays: OverlayCatalogResponse['overlays'];
  commonTasks: Array<Record<string, string>>;
  commandGroups: Record<string, string[]>;
}

export interface CliPrivateProfileRequest {
  configHome: string;
  force: boolean;
}

export interface CliPrivateProfileBootstrapRequest extends CliPrivateProfileRequest {
  sourceSystemDir: string;
}

export interface CliPrivateProfileBundleRequest extends CliPrivateProfileRequest {
  bundleFile: string;
}

export interface CliPrivateProfileResult extends Record<string, unknown> {
  ok?: boolean;
}

export interface CliPrivateProfileModule {
  bootstrapPrivateProfile(request: CliPrivateProfileBootstrapRequest): CliPrivateProfileResult;
  exportPrivateProfile(request: CliPrivateProfileBundleRequest): CliPrivateProfileResult;
  installPrivateProfile(request: CliPrivateProfileBundleRequest): CliPrivateProfileResult;
}

export interface CliDomainActions {
  doctorWorkspace(request: { workspaceRoot: string }): Promise<WorkspaceDoctorResponse>;
  listTopics(request: { workspaceRoot: string }): Promise<TopicCatalogResponse>;
  getOverlayCatalog(request?: unknown): Promise<OverlayCatalogResponse>;
  invokeDomainEntry(request: DomainEntryRequest): Promise<DomainEntryResponse>;
  invokeProductEntry(request: ProductEntryRequest): Promise<ProductEntryResponse>;
  getProductEntrySession(request: { entry_session_id?: string; entrySessionId?: string }): Promise<ProductEntrySessionResponse>;
  runNativePptProductEntryProof(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  intakeSource(request: Record<string, unknown>): Promise<SourceIntakeResponse>;
  prepareSourceAugmentation(request: Record<string, unknown>): Promise<SourceAugmentationResponse>;
  executeSourceAugmentation(request: Record<string, unknown>): Promise<SourceAugmentationExecutionResponse>;
  createDeliverable(request: CreateDeliverableRequest): Promise<DeliverableCreateResponse>;
  getDeliverable(request: { workspaceRoot: string; topicId: string; deliverableId: string }): Promise<DeliverableRecordResponse>;
  getPublicationProjection(request: { workspaceRoot: string; topicId: string }): Promise<PublicationProjectionResponse>;
  getReviewState(request: { workspaceRoot: string; topicId: string; deliverableId: string }): Promise<ReviewStateResponse>;
  getRun(request: { workspaceRoot: string; runId: string }): Promise<RunRecordResponse>;
  getManagedRun(request: { workspaceRoot: string; managedRunId: string }): Promise<ManagedRunRecordResponse>;
  superviseManagedRun(request: SuperviseManagedRunRequest): Promise<ManagedSupervisionResponse>;
  auditDeliverable(request: DeliverableAuditRequest): Promise<DeliverableAuditResponse>;
  runtimeWatch(request: Record<string, unknown>): Promise<RuntimeWatchResponse>;
  applyReviewMutation(request: ReviewMutationRequest): Promise<ReviewMutationResponse>;
  runDeliverableRoute(request: {
    workspaceRoot: string;
    overlay: string;
    topicId: string;
    deliverableId: string;
    route: string;
    adapter?: string;
  }): Promise<RouteRunResponse>;
}

export interface CliDependencies {
  domainActions?: Partial<CliDomainActions>;
  loadPrivateProfileModule?: () => Promise<CliPrivateProfileModule>;
  cwd?: () => string;
  printJson?: (data: CliRunSurface) => void;
}

export type CliRunSurface =
  | CliHelpSurface
  | WorkspaceDoctorResponse
  | TopicCatalogResponse
  | OverlayCatalogResponse
  | SourceIntakeResponse
  | SourceAugmentationResponse
  | SourceAugmentationExecutionResponse
  | DeliverableCreateResponse
  | DeliverableRecordResponse
  | DomainEntryResponse
  | DeliverableAuditResponse
  | ManagedRunRecordResponse
  | ManagedSupervisionResponse
  | RouteRunResponse
  | ProductEntryResponse
  | ProductEntrySessionResponse
  | RunRecordResponse
  | PublicationProjectionResponse
  | ReviewStateResponse
  | RuntimeWatchResponse
  | ReviewMutationResponse
  | CliPrivateProfileResult
  | Record<string, unknown>;

export interface CliRunResult extends Record<string, unknown> {
  ok?: boolean;
  error_kind?: string;
  surface_kind?: string;
}
