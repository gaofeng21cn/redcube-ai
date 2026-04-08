import type {
  CreateDeliverableRequest,
  DeliverableAuditRequest,
  DeliverableAuditResponse,
  DeliverableCreateResponse,
  DeliverableRecordResponse,
  LegacyImportResponse,
  OverlayCatalogResponse,
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

export interface CliGatewayActions {
  doctorWorkspace(request: { workspaceRoot: string }): Promise<WorkspaceDoctorResponse>;
  listTopics(request: { workspaceRoot: string }): Promise<TopicCatalogResponse>;
  getOverlayCatalog(request?: unknown): Promise<OverlayCatalogResponse>;
  intakeSource(request: Record<string, unknown>): Promise<SourceIntakeResponse>;
  prepareSourceAugmentation(request: Record<string, unknown>): Promise<SourceAugmentationResponse>;
  executeSourceAugmentation(request: Record<string, unknown>): Promise<SourceAugmentationExecutionResponse>;
  importLegacyProject(request: Record<string, unknown>): Promise<LegacyImportResponse>;
  createDeliverable(request: CreateDeliverableRequest): Promise<DeliverableCreateResponse>;
  getDeliverable(request: { workspaceRoot: string; topicId: string; deliverableId: string }): Promise<DeliverableRecordResponse>;
  getPublicationProjection(request: { workspaceRoot: string; topicId: string }): Promise<PublicationProjectionResponse>;
  getReviewState(request: { workspaceRoot: string; topicId: string; deliverableId: string }): Promise<ReviewStateResponse>;
  getRun(request: { workspaceRoot: string; runId: string }): Promise<RunRecordResponse>;
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
  gateway?: Partial<CliGatewayActions>;
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
  | LegacyImportResponse
  | DeliverableCreateResponse
  | DeliverableRecordResponse
  | DeliverableAuditResponse
  | RouteRunResponse
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
