type JsonSurface = Record<string, unknown>;

type OverlayCatalogResponse = JsonSurface & {
  overlays: Array<JsonSurface & {
    profiles: JsonSurface[];
  }>;
};

export interface CliOptions extends Record<string, string | boolean> {}

export interface CliHelpSurface extends Record<string, unknown> {
  ok: true;
  preferredEntry: string[];
  availableOverlays: OverlayCatalogResponse['overlays'];
  commonTasks: Array<Record<string, string>>;
  commandGroups: Record<string, string[]>;
}

export interface CliDomainActions {
  doctorWorkspace(request: { workspaceRoot: string }): Promise<JsonSurface>;
  listTopics(request: { workspaceRoot: string }): Promise<JsonSurface>;
  getOverlayCatalog(request?: unknown): Promise<OverlayCatalogResponse>;
  exportDomainHandler(request: JsonSurface): Promise<JsonSurface>;
  dispatchDomainHandler(request: JsonSurface): Promise<JsonSurface>;
  invokeDomainEntry(request: JsonSurface): Promise<JsonSurface>;
  invokeProductEntry(request: JsonSurface): Promise<JsonSurface>;
  runNativePptProductEntryProof(request: JsonSurface): Promise<JsonSurface>;
  intakeSource(request: JsonSurface): Promise<JsonSurface>;
  prepareSourceAugmentation(request: JsonSurface): Promise<JsonSurface>;
  executeSourceAugmentation(request: JsonSurface): Promise<JsonSurface>;
  createDeliverable(request: JsonSurface): Promise<JsonSurface>;
  getDeliverable(request: { workspaceRoot: string; topicId: string; deliverableId: string }): Promise<JsonSurface>;
  getPublicationProjection(request: { workspaceRoot: string; topicId: string }): Promise<JsonSurface>;
  getReviewState(request: { workspaceRoot: string; topicId: string; deliverableId: string }): Promise<JsonSurface>;
  auditDeliverable(request: JsonSurface): Promise<JsonSurface>;
  applyReviewMutation(request: JsonSurface): Promise<JsonSurface>;
}

export interface CliDependencies {
  domainActions?: Partial<CliDomainActions>;
  cwd?: () => string;
  printJson?: (data: CliRunSurface) => void;
}

export type CliRunSurface = JsonSurface;

export interface CliRunResult extends Record<string, unknown> {
  ok?: boolean;
  error_kind?: string;
  surface_kind?: string;
}
