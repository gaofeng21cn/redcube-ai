export interface WorkspaceContract {
  workspaceRoot: string;
  workspaceFile: string;
  topicsDir: string;
  runtimeDir: string;
  publishDir: string;
  overlaysDir: string;
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
  sourceAugmentationRequestFile: string;
  sourceAugmentationReportFile: string;
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
  status: 'running' | 'completed' | 'failed';
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
  status: 'running' | 'completed' | 'failed';
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
