import type { spawnSync } from 'node:child_process';

export interface ResolveRedCubePythonCommandOptions {
  env?: Record<string, string | undefined>;
  fileExists?: (file: string) => boolean;
  pythonProbeImpl?: (
    command: string,
    modules: string[],
    env: Record<string, string | undefined>,
  ) => { status: number | null };
}

export interface ResolvedRedCubePythonCommand {
  command: string;
  args?: string[];
  source: 'env' | 'python3_with_playwright' | 'managed_python_runtime';
  runtimeEnv?: Record<string, string | undefined>;
}

export interface RedCubePythonNativeHelper {
  helperId: string;
  catalogFile: string;
}

export interface ResolveRedCubePythonNativeHelperOptions {
  catalogFile?: string;
  fileExists?: (file: string) => boolean;
}

export interface RedCubePythonHelperReference {
  helper_id: string;
  catalog_ref: string;
}

export interface RunRedCubePythonHelperOptions {
  env?: Record<string, string | undefined>;
  spawnSyncImpl?: typeof spawnSync;
  oplBin?: string;
  cwd?: string;
  tempRoot?: string;
  timeoutSeconds?: number;
  maxBuffer?: number;
  failureMessagePrefix?: string;
}

export interface RedCubePythonHelperRunResult {
  command: string;
  helper_id: string;
  package_module: string;
  argv: string[];
  request_args: string[];
  payload: unknown;
}

export interface CodexRuntimeTopology {
  schema_version: 1;
  executor_backend: 'codex_cli';
  execution_shape: 'structured_call';
  runtime_substrate_owner: 'Codex CLI';
  runtime_substrate_surface: 'codex_cli_runtime';
  generic_executor_adapter_owner: 'one-person-lab';
  domain_authority_owner: 'redcube_ai';
  rca_runtime_role: 'codex_concrete_executor_receipt_refs_not_generic_runtime_owner';
  rca_owns_generic_runtime: false;
  rca_owns_generic_executor_adapter: false;
  rca_owns_generic_attempt_ledger: false;
  deployment_host: 'codex_local_operator_host';
  deployment_host_status: 'active_primary';
  domain_entry_protocol_role: 'visual_deliverable_domain_entry_protocol_boundary';
  domain_harness_os: 'RedCube Domain Harness OS';
  family_pack_boundary: 'family_profile_pack_harness_execution';
  product_mode: 'auto_only';
  default_formal_entry: 'CLI';
  supported_protocol_layer: ['MCP'];
  internal_controller_surface: 'controller';
  controller_repo_verified: false;
}

export interface WorkspaceContract {
  workspaceRoot: string;
  workspaceFile: string;
  topicsDir: string;
  runtimeDir: string;
  publishDir: string;
  overlaysDir: string;
}

export interface WorkspaceGitBoundary {
  initialized: boolean;
  already_initialized: boolean;
  git_dir: string;
  gitignore_path: string;
}

export interface TopicPaths {
  topicId: string;
  topicDir: string;
  topicFile: string;
  inputsDir: string;
  canonicalDir: string;
  deliverablesDir: string;
  notesDir: string;
  runsDir: string;
}

export interface DeliverablePaths {
  programId: string;
  topicId: string;
  deliverableId: string;
  deliverableDir: string;
  deliverableFile: string;
  artifactsDir: string;
  contractsDir: string;
  reportsDir: string;
  viewsDir: string;
}

export interface NotePaths {
  noteId: string;
  noteDir: string;
  noteFile: string;
  artifactsDir: string;
  reportsDir: string;
  viewsDir: string;
}

export interface SourceArtifactPaths {
  topicPaths: TopicPaths;
  sourceIndexFile: string;
  extractedMaterialsFile: string;
  sourceAuditFile: string;
  sourceBriefFile: string;
  sourceReadinessPackFile: string;
  sourcePackManifestFile: string;
  sourcePackFanoutFile: string;
  sourceAugmentationRequestFile: string;
  sourceAugmentationResultFile: string;
  sourceResearchReportFile: string;
  sourceAugmentationReportFile: string;
}

export interface SourceReadinessSummary {
  canonical_source: {
    kind: string;
    audit_kind: string;
    readiness_kind: string;
  };
  authoritative_artifacts: {
    source_audit: string;
    source_readiness_pack: string;
  };
  status: 'pass' | 'block' | 'missing' | 'invalid';
  readiness_target: 'planning_ready';
  planning_ready: boolean;
  audit_status: string;
  sufficiency_status: string;
  deep_research_state: string;
  completed_stages: string[];
  blocking_evidence_gaps: string[];
  residual_evidence_gaps: string[];
  blocking_reasons: string[];
  checks: Record<string, unknown>;
  next_required_surface: string | null;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export interface SourceAugmentationInvestigationLane {
  lane_id: string;
  priority: 'required' | 'suggested';
  objective: string;
  deliverable_value: string;
  focus_terms: string[];
}

export interface SourceAugmentationRequestContract {
  schema_version: 1;
  topic_id: string;
  title: string;
  request_kind: 'shared_source_readiness_augmentation';
  status: 'required' | 'recommended' | 'not_required';
  execution_mode: 'auto_required' | 'operator_optional' | 'not_needed';
  readiness_target: 'planning_ready';
  authoritative_inputs: {
    source_brief: string;
    source_audit: string;
    source_readiness_pack: string;
  };
  trigger: {
    input_mode: string;
    confidence: string;
    source_audit_status: string;
    source_sufficiency_status: string;
    deep_research_state: string;
    blocking_evidence_gaps: string[];
    residual_evidence_gaps: string[];
    evidence_gaps: string[];
  };
  focus: {
    topic_summary: string;
    brief_text: string;
    keywords: string[];
    required_outputs: string[];
  };
  investigation_lanes: SourceAugmentationInvestigationLane[];
}

export interface SourceAugmentationReferenceSource {
  reference_id: string;
  label: string;
  url: string;
}

export interface SourceAugmentationFactGroup {
  fact_id: string;
  label: string;
  reference_id: string;
}

export interface SourceAugmentationEvidenceGapResolution {
  gap_id: string;
  status: 'resolved' | 'unresolved';
  note: string;
}

export interface SourceAugmentationResultContract {
  schema_version: 1;
  topic_id: string;
  request_kind: 'shared_source_readiness_augmentation_result';
  status: 'completed';
  readiness_target: 'planning_ready';
  topic_summary: string;
  reference_source_list: SourceAugmentationReferenceSource[];
  key_fact_groups: SourceAugmentationFactGroup[];
  source_quality_notes: string[];
  evidence_gap_resolution: SourceAugmentationEvidenceGapResolution[];
}

export interface ValidateSourceAugmentationResultOptions {
  expectedTopicId?: string;
  requiredEvidenceGaps?: string[];
}

export interface SourceTruthConsumptionSummary {
  authoritative_source_kind: 'shared_source_truth';
  consumption_role: string;
  input_mode: string;
  confidence: string;
  material_count: number;
  material_ids: string[];
  source_labels: string[];
  source_audit_status: string;
  source_audit_blocking_reasons: string[];
  planning_ready: boolean;
  sufficiency_status: string;
  deep_research_state: string;
  blocking_evidence_gaps: string[];
  residual_evidence_gaps: string[];
}

export interface BuildSourceTruthConsumptionSummaryOptions {
  consumptionRole: string;
  defaultInputMode?: string;
  defaultConfidence?: string;
  defaultAuditStatus?: string;
  defaultBlockingReasons?: string[];
  defaultSourceLabels?: string[];
}

export interface CreateRunRecordInput {
  runId?: string;
  route?: string;
  scope?: string;
  target?: string;
  overlay?: string;
  topicId?: string | null;
  deliverableId?: string | null;
  rerunCount?: number;
  previousRunId?: string | null;
  sourceStage?: string | null;
  blockingReview?: string | null;
  baselineDeliverableId?: string | null;
}

export type RuntimeErrorKind =
  | 'contract_error'
  | 'validation_error'
  | 'execution_error'
  | 'review_gate_error'
  | 'publish_gate_error'
  | 'environment_error';

export interface RunTelemetryEnvelope {
  run_id: string;
  route: string;
  scope: string;
  target: string;
  overlay: string;
  executor_kind: string | null;
  execution_surface: string | null;
  status: 'running' | 'completed' | 'failed' | 'expired' | 'orphaned';
  started_at: string | null;
  finished_at: string | null;
  latency_ms: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  estimated_cost: number | null;
}

export interface RerunLinkage {
  rerun_count: number;
  previous_run_id: string | null;
  source_stage: string | null;
  blocking_review: string | null;
  baseline_deliverable_id: string | null;
}

export interface RunRecord {
  run_id: string;
  route: string;
  scope: string;
  target: string;
  overlay: string;
  topic_id: string | null;
  deliverable_id: string | null;
  status: 'running' | 'completed' | 'failed' | 'expired' | 'orphaned';
  started_at: string | null;
  finished_at: string | null;
  current_stage: string | null;
  stage_results: unknown[];
  artifact_refs: string[];
  telemetry: RunTelemetryEnvelope | null;
  error_kind: RuntimeErrorKind | null;
  rerun_linkage: RerunLinkage;
  error: unknown;
}
