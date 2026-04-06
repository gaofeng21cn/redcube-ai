export interface RuntimeRunRecord {
  run_id: string;
  route: string;
  scope: string;
  target: string;
  overlay: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  current_stage: string | null;
  stage_results: unknown[];
  artifact_refs: string[];
  error: { message: string } | null;
  executor?: Record<string, unknown>;
}

export interface RuntimeRunRouteRequest {
  workspaceRoot: string;
  overlay: string;
  topicId: string;
  deliverableId: string;
  route: string;
  adapter?: string;
  mode?: string;
  baselineDeliverableId?: string;
}

export interface RuntimeRunRouteResponse {
  ok: boolean;
  run: RuntimeRunRecord;
  events: unknown[];
  artifactFile?: string;
  error?: unknown;
}

export interface RuntimeRunLookupRequest {
  workspaceRoot: string;
  runId: string;
}

export interface RuntimeEventRecord extends Record<string, unknown> {}

export interface RuntimeStartRunRequest {
  workspaceRoot: string;
  route: string;
  overlay: string;
  scope?: string;
  target: string;
  executor: Record<string, unknown>;
}

export interface RuntimeCompleteRunRequest {
  workspaceRoot: string;
  runId: string;
  currentStage: string;
  stageResults: unknown[];
  artifactRefs: string[];
  executor: Record<string, unknown>;
}

export interface RuntimeFailRunRequest {
  workspaceRoot: string;
  runId: string;
  currentStage: string;
  error: unknown;
  executor: Record<string, unknown>;
}

export interface RuntimeSourceIntakeResponse {
  ok: boolean;
  topicId: string;
  artifactFiles: Record<string, string>;
  audit: Record<string, unknown>;
}

export interface RuntimeSourceIntakeRequest {
  workspaceRoot: string;
  topicId: string;
  title?: string;
  brief?: string;
  keywords?: string[] | string;
  sourceFiles?: string[] | string;
  modeHint?: string;
}
