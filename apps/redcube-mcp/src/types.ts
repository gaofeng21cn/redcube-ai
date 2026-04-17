export interface GatewayToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface GatewayToolSummary {
  name: string;
  description: string;
}

export interface GatewayToolResponse extends Record<string, unknown> {
  content: Array<{
    type: string;
    text: string;
  }>;
  structuredContent: Record<string, unknown>;
  isError?: boolean;
}

export interface GatewayActionMap {
  doctorWorkspace?: (args: Record<string, unknown>) => Promise<unknown>;
  listTopics?: (args: Record<string, unknown>) => Promise<unknown>;
  getOverlayCatalog?: (args?: unknown) => Promise<unknown>;
  invokeDomainEntry?: (args: Record<string, unknown>) => Promise<unknown>;
  invokeProductEntry?: (args: Record<string, unknown>) => Promise<unknown>;
  invokeFederatedProductEntry?: (args: Record<string, unknown>) => Promise<unknown>;
  getProductEntryManifest?: (args: Record<string, unknown>) => Promise<unknown>;
  getProductEntrySession?: (args: Record<string, unknown>) => Promise<unknown>;
  createDeliverable?: (args: Record<string, unknown>) => Promise<unknown>;
  getDeliverable?: (args: Record<string, unknown>) => Promise<unknown>;
  getPublicationProjection?: (args: Record<string, unknown>) => Promise<unknown>;
  getManagedRun?: (args: Record<string, unknown>) => Promise<unknown>;
  superviseManagedRun?: (args: Record<string, unknown>) => Promise<unknown>;
  intakeSource?: (args: Record<string, unknown>) => Promise<unknown>;
  auditDeliverable?: (args: Record<string, unknown>) => Promise<unknown>;
  reviewRenderOutput?: (args: Record<string, unknown>) => Promise<unknown>;
  runManagedDeliverable?: (args: Record<string, unknown>) => Promise<unknown>;
  runDeliverableRoute?: (args: Record<string, unknown>) => Promise<unknown>;
  getRun?: (args: Record<string, unknown>) => Promise<unknown>;
  runtimeWatch?: (args: Record<string, unknown>) => Promise<unknown>;
  getReviewState?: (args: Record<string, unknown>) => Promise<unknown>;
  applyReviewMutation?: (args: Record<string, unknown>) => Promise<unknown>;
  [key: string]: ((args: Record<string, unknown>) => Promise<unknown>) | ((args?: unknown) => Promise<unknown>) | undefined;
}

export interface McpServerDependencies extends GatewayActionMap {}
