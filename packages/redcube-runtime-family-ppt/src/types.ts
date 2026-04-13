import type {
  PptDeckHydratedContract,
  PptDeckReviewCheck,
  PptDeckStageId,
} from '@redcube/overlay-ppt';
import type {
  PptBlueprintArtifact,
  PptDetailedOutlineArtifact,
  PptRenderArtifact,
  PptVisualDirectionArtifact,
} from '@redcube/pack-ppt';
import type { RelativeQualityRubric } from '@redcube/reference-os';
import type { CodexExecutionModel } from '@redcube/hermes-substrate';

export type PptRuntimeRoute = PptDeckStageId;
export type PptRuntimeMode = 'draft_new' | 'optimize_existing';
export type PptRuntimeReviewCheckId = PptDeckReviewCheck;

export interface PptRuntimeCanRunContract {
  deliverable_kind?: string;
}

export interface PptRuntimeSourceIndexEntry {
  status?: string;
  relative_path?: string;
  kind?: string;
}

export interface PptRuntimeSourceIndex {
  sources?: PptRuntimeSourceIndexEntry[];
}

export interface PptRuntimeExtractedMaterial {
  material_id?: string;
  excerpt?: string;
  content_text?: string;
}

export interface PptRuntimeExtractedMaterials {
  materials?: PptRuntimeExtractedMaterial[];
}

export interface PptRuntimeSourceBrief {
  brief_text?: string;
  input_mode?: string;
  confidence?: string;
  material_ids?: string[];
}

export interface PptRuntimeSourceReadiness {
  input_mode?: string;
  confidence?: string;
  sufficiency_status?: string;
  deep_research_state?: string;
  material_count?: number;
  material_ids?: string[];
  audit_status?: string;
  audit_blocking_reasons?: string[];
}

export interface PptRuntimeFactLibrary {
  topic_summary?: string;
  reference_source_list?: string[];
  key_fact_groups?: {
    fact_id?: string;
    label?: string;
    source_id?: string;
  }[];
  evidence_gaps?: string[];
}

export interface PptRuntimeSourceReadinessPack {
  schema_version?: number;
  topic_id?: string;
  title?: string;
  readiness?: PptRuntimeSourceReadiness;
  fact_library?: PptRuntimeFactLibrary;
}

export interface PptRuntimeSharedSourceTruth {
  source_index?: PptRuntimeSourceIndex;
  extracted_materials?: PptRuntimeExtractedMaterials;
  source_brief?: PptRuntimeSourceBrief;
  source_readiness_pack?: PptRuntimeSourceReadinessPack;
}

export interface PptRuntimeContract extends PptDeckHydratedContract {
  shared_source_truth?: PptRuntimeSharedSourceTruth;
}

export interface PptRuntimePromptMeta {
  root: string;
  file: string;
  relative_path: string;
  source: 'repo' | 'embedded';
}

export interface PptRuntimeReviewPolicy {
  status: 'idle' | 'rerun_required';
  rerun_from_stage: PptRuntimeRoute | null;
}

export interface PptRuntimeLatestChecks {
  director_intent_landed?: boolean;
  anti_template_ok?: boolean;
  overflow_free?: boolean;
  occlusion_free?: boolean;
  visual_density_ok?: boolean;
  speaker_fit_ok?: boolean;
  baseline_comparison_passed?: boolean;
  term_explained_on_first_use?: boolean;
  teaching_progression_clear?: boolean;
  novelty_position_clear?: boolean;
  method_boundary_explicit?: boolean;
  decision_implication_clear?: boolean;
  conclusion_up_front?: boolean;
  claim_evidence_traceable?: boolean;
  backup_qa_ready?: boolean;
}

export interface PptRuntimeReviewStatePatch {
  current_status: string;
  ready_for_export: boolean;
  latest_review_stage: PptRuntimeRoute;
  latest_checks?: PptRuntimeLatestChecks;
  pending_reviews: PptRuntimeReviewCheckId[];
  blocking_reasons: PptRuntimeReviewCheckId[];
  rerun_from_stage: PptRuntimeRoute | null;
  rerun_policy: PptRuntimeReviewPolicy;
}

export interface PptRuntimeArtifactBase {
  overlay: PptRuntimeContract['overlay'];
  route: PptRuntimeRoute;
  profile_id: PptRuntimeContract['profile_id'];
  produced_at: string;
  prompt_pack: PptRuntimePromptMeta;
  lifecycle_stage?: string | null;
  review_overlay?: string | null;
  execution_model: CodexExecutionModel;
  artifact_refs?: string[];
  review_state_patch?: PptRuntimeReviewStatePatch;
}

export interface PptStorylineArtifact extends PptRuntimeArtifactBase {
  route: 'storyline';
  storyline: {
    speaker: string;
    audience: string;
    goal: string;
    style: string;
    core_metaphor: string;
    narrative_arc: {
      hook: string[];
      journey: string[];
      resolution: string[];
    };
    source_truth_input_mode: string;
    source_truth_confidence: string;
    source_truth_material_ids: string[];
    source_sufficiency_judgement: string;
    deep_research_state: string;
    fact_library_summary: string;
  };
}

export interface PptVisualDirectorReviewArtifact extends PptRuntimeArtifactBase {
  route: 'visual_director_review';
  status: 'pass' | 'block';
  visual_director_review: {
    director_intent_landed: boolean;
    anti_template_ok: boolean;
    memory_hook_present: boolean;
    homogeneous_layout_risk: number;
    weak_pages: string[];
    rewrite_action: string;
    review_summary: string;
    creative_sources: {
      review_judgement: 'host_agent';
    };
  };
  artifact_refs: string[];
  review_state_patch: PptRuntimeReviewStatePatch;
}

export interface PptSlideReviewChecks {
  overflow_free: boolean;
  occlusion_free: boolean;
  visual_density_ok: boolean;
  speaker_fit_ok: boolean;
}

export interface PptSlideReviewMetrics {
  text_char_count?: number;
  block_count?: number;
  overlap_pairs?: number;
  occupied_ratio?: number;
}

export interface PptSlideReview {
  slide_id: string;
  title?: string;
  layout_family: string;
  screenshot_file: string;
  status: 'pass' | 'block';
  checks: PptSlideReviewChecks;
  metrics?: PptSlideReviewMetrics;
  issues: string[];
  ai_review?: {
    slide_id: string;
    judgement: 'pass' | 'block';
    visual_findings: string[];
    recommended_fix: string;
  };
}

export interface PptBaselineReview {
  baseline_deliverable_id: string;
  baseline_comparison_passed: boolean;
  baseline_review_file: string;
  current_average_density: number;
  baseline_average_density: number;
  current_failed_slides: number;
  baseline_failed_slides: number;
  relative_quality: RelativeQualityRubric;
  summary: string;
}

export interface PptScreenshotReviewArtifact extends PptRuntimeArtifactBase {
  route: 'screenshot_review';
  mode: PptRuntimeMode;
  status: 'pass' | 'block';
  review_execution?: {
    owner?: string;
    overlay?: string;
    generation_runtime?: unknown;
  };
  checks: PptRuntimeLatestChecks & {
    director_intent_landed?: boolean;
    anti_template_ok?: boolean;
    overflow_free: boolean;
    occlusion_free: boolean;
    visual_density_ok: boolean;
    speaker_fit_ok: boolean;
  };
  slide_reviews: PptSlideReview[];
  ai_review?: {
    review_model: string;
    director_intent_landed: boolean;
    anti_template_ok: boolean;
    weak_pages: string[];
    review_summary: string;
    slide_reviews: Array<{
      slide_id: string;
      judgement: 'pass' | 'block';
      visual_findings: string[];
      recommended_fix: string;
    }>;
    creative_sources?: {
      review_judgement?: unknown;
    };
  };
  mechanical_review?: {
    review_model: string;
    checks?: unknown;
    metrics?: unknown;
  };
  report_markdown: string;
  metrics: unknown;
  artifact_refs: string[];
  review_state_patch: PptRuntimeReviewStatePatch;
  baseline_review?: PptBaselineReview;
}

export interface PptExportBundleArtifact extends PptRuntimeArtifactBase {
  route: 'export_pptx';
  status: 'completed';
  review_state_patch: PptRuntimeReviewStatePatch;
  export_bundle: {
    source_html: string;
    pptx_file: string;
    pdf_file: string;
    presenter_notes_file: string;
    delivery_state: {
      current: 'output_ready';
      next: null;
    };
    page_count: number;
    page_count_match: boolean;
    real_conversion_invocation: {
      tool: string;
      script: 'packages/redcube-runtime/scripts/ppt_deck_export.py';
      command: string[];
    };
  };
  artifact_refs: string[];
}

export type PptRuntimeStageContract = PptRuntimeContract['stage_sequence']['stages'][number];

export interface PptRuntimeRouteEnvelope<TRoute extends PptRuntimeRoute> {
  overlay: PptRuntimeContract['overlay'];
  route: TRoute;
  topic_id: string;
  deliverable_id: string;
  contract: PptRuntimeContract;
  stage_contract: PptRuntimeStageContract | null;
  execution_model: CodexExecutionModel;
}

export type PptRuntimeRouteOutput<
  TRoute extends PptRuntimeRoute,
  TPayload extends { route: TRoute },
> = PptRuntimeRouteEnvelope<TRoute> & TPayload;

export type PptRuntimeRouteResult =
  | PptRuntimeRouteOutput<'storyline', PptStorylineArtifact>
  | PptRuntimeRouteOutput<'detailed_outline', PptDetailedOutlineArtifact>
  | PptRuntimeRouteOutput<'slide_blueprint', PptBlueprintArtifact>
  | PptRuntimeRouteOutput<'visual_direction', PptVisualDirectionArtifact>
  | PptRuntimeRouteOutput<'render_html', PptRenderArtifact>
  | PptRuntimeRouteOutput<'visual_director_review', PptVisualDirectorReviewArtifact>
  | PptRuntimeRouteOutput<'screenshot_review', PptScreenshotReviewArtifact>
  | PptRuntimeRouteOutput<'export_pptx', PptExportBundleArtifact>;

export interface PptRuntimeRunRequest {
  workspaceRoot: string;
  topicId: string;
  deliverableId: string;
  route: PptRuntimeRoute;
  contract: PptRuntimeContract;
  mode?: PptRuntimeMode;
  baselineDeliverableId?: string;
}
