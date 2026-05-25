export interface DomainToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface DomainToolSummary {
  name: string;
  description: string;
  generated_interface_owner?: string;
  domain_handler_owner?: string;
  repo_local_handler_target_only?: boolean;
}

export interface DomainToolResponse extends Record<string, unknown> {
  content: Array<{
    type: string;
    text: string;
  }>;
  structuredContent: Record<string, unknown>;
  isError?: boolean;
}

export interface DomainActionMap {
  doctorWorkspace?: (args: Record<string, unknown>) => Promise<unknown>;
  listTopics?: (args: Record<string, unknown>) => Promise<unknown>;
  getOverlayCatalog?: (args?: unknown) => Promise<unknown>;
  invokeDomainEntry?: (args: Record<string, unknown>) => Promise<unknown>;
  invokeProductEntry?: (args: Record<string, unknown>) => Promise<unknown>;
  createDeliverable?: (args: Record<string, unknown>) => Promise<unknown>;
  getDeliverable?: (args: Record<string, unknown>) => Promise<unknown>;
  getPublicationProjection?: (args: Record<string, unknown>) => Promise<unknown>;
  intakeSource?: (args: Record<string, unknown>) => Promise<unknown>;
  auditDeliverable?: (args: Record<string, unknown>) => Promise<unknown>;
  reviewRenderOutput?: (args: Record<string, unknown>) => Promise<unknown>;
  invokeOplStageExecutionPlan?: (args: Record<string, unknown>) => Promise<unknown>;
  runDeliverableRoute?: (args: Record<string, unknown>) => Promise<unknown>;
  getRun?: (args: Record<string, unknown>) => Promise<unknown>;
  getReviewState?: (args: Record<string, unknown>) => Promise<unknown>;
  applyReviewMutation?: (args: Record<string, unknown>) => Promise<unknown>;
  [key: string]: ((args: Record<string, unknown>) => Promise<unknown>) | ((args?: unknown) => Promise<unknown>) | undefined;
}

export interface McpServerDependencies extends DomainActionMap {}
