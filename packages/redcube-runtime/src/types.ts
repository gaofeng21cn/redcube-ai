import type {
  RerunLinkage,
  RunTelemetryEnvelope,
  RuntimeErrorKind,
} from '@redcube/runtime-protocol';

export interface RuntimeRunRecord {
  run_id: string;
  route: string;
  scope: string;
  target: string;
  overlay: string;
  topic_id: string | null;
  deliverable_id: string | null;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  current_stage: string | null;
  stage_results: unknown[];
  artifact_refs: string[];
  telemetry: RunTelemetryEnvelope | null;
  error_kind: RuntimeErrorKind | null;
  rerun_linkage: RerunLinkage;
  error: { message: string } | null;
  executor?: Record<string, unknown>;
}

export interface RuntimeRunRouteRequest {
  workspaceRoot: string;
  overlay: string;
  topicId: string;
  deliverableId: string;
  route: string;
  runId?: string | null;
  adapter?: string;
  userIntent?: string;
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

export interface RuntimeEventRecord extends Record<string, unknown> {}

export interface RuntimeStartRunRequest {
  workspaceRoot: string;
  route: string;
  overlay: string;
  scope?: string;
  target: string;
  topicId?: string | null;
  deliverableId?: string | null;
  baselineDeliverableId?: string;
  executor: Record<string, unknown>;
  crossProviderAttemptIndex?: Record<string, unknown> | null;
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
  errorKind?: RuntimeErrorKind;
  executor: Record<string, unknown>;
}

interface RuntimeProductEntrySessionRecord {
  schema_version: 1;
  entry_session_id: string;
  workspace_root: string;
  deliverable_family: string;
  topic_id: string;
  deliverable_id: string;
  profile_id: string | null;
  title: string | null;
  goal: string | null;
  runtime_owner: string;
  last_task_intent: string;
  last_entry_mode: string;
  latest_stage_execution_plan_ref: string | null;
  latest_run_id: string | null;
  stage_execution_plan?: Record<string, unknown> | null;
  latest_surface_kind: string | null;
  updated_at: string;
}

export interface RuntimeSourceIntakeResponse {
  ok: boolean;
  topicId: string;
  artifactFiles: Record<string, string>;
  audit: Record<string, unknown>;
  augmentation: Record<string, unknown>;
}

export interface RuntimeSourceIntakeRequest {
  workspaceRoot: string;
  topicId: string;
  title?: string;
  brief?: string;
  keywords?: string[] | string;
  sourceFiles?: string[] | string;
  operatorFiles?: string[] | string;
  modeHint?: string;
}

export interface RuntimeSourceResearchResponse {
  ok: boolean;
  topicId: string;
  stage: string;
  planningReady: boolean;
  artifactFiles: Record<string, string>;
  report: Record<string, unknown>;
  intake: Record<string, unknown>;
  augmentation?: Record<string, unknown>;
  resultPreparation?: Record<string, unknown>;
  resultWrite?: Record<string, unknown>;
  execution?: Record<string, unknown>;
}

export interface RuntimeSourceResearchRequest extends RuntimeSourceIntakeRequest {
  inputFile?: string;
  payloadFile?: string;
  result?: Record<string, unknown> | null;
}

export interface RuntimeSourceAugmentationResponse {
  ok: boolean;
  topicId: string;
  artifactFiles: Record<string, string>;
  augmentation: Record<string, unknown>;
}

export interface RuntimeSourceAugmentationRequest {
  workspaceRoot: string;
  topicId: string;
  title?: string;
}

export interface RuntimeSourceAugmentationResultPreparationResponse {
  ok: boolean;
  topicId: string;
  artifactFiles: Record<string, string>;
  request: Record<string, unknown>;
  resultDraft: Record<string, unknown>;
}

export interface RuntimeSourceAugmentationResultPreparationRequest {
  workspaceRoot: string;
  topicId: string;
}

export interface RuntimeSourceAugmentationResultWriteResponse {
  ok: boolean;
  topicId: string;
  artifactFiles: Record<string, string>;
  resultContract: Record<string, unknown>;
}

export interface RuntimeSourceAugmentationResultWriteRequest {
  workspaceRoot: string;
  topicId: string;
  inputFile?: string;
  payloadFile?: string;
  result?: Record<string, unknown> | null;
}

export interface RuntimeSourceAugmentationExecutionResponse {
  ok: boolean;
  topicId: string;
  artifactFiles: Record<string, string>;
  report: Record<string, unknown>;
}

export interface RuntimeSourceAugmentationExecutionRequest {
  workspaceRoot: string;
  topicId: string;
}
