import type {
  XhsPlanArtifact,
  XhsRenderArtifact,
  XhsResearchArtifact,
  XhsStorylineArtifact,
  XhsVisualDirectionArtifact,
} from '@redcube/pack-xiaohongshu';
import type {
  CodexExecutionModel,
  HermesNativeProofExecutionModel,
} from '@redcube/hermes-substrate';

export type XhsRuntimeExecutionModel = CodexExecutionModel | HermesNativeProofExecutionModel;

export type XhsRuntimeRoute =
  | 'research'
  | 'storyline'
  | 'single_note_plan'
  | 'visual_direction'
  | 'render_html'
  | 'fix_html'
  | 'visual_director_review'
  | 'screenshot_review'
  | 'publish_copy'
  | 'export_bundle';

export type XhsRuntimeMode = 'draft_new' | 'optimize_existing';

export interface XhsRuntimeCanRunContract {
  deliverable_kind?: string;
}

export interface XhsRuntimeStageDefinition {
  stage_id: XhsRuntimeRoute;
  output_artifact?: string;
}

export interface XhsRuntimeStageSequence {
  stages?: XhsRuntimeStageDefinition[];
}

export interface XhsRuntimeStageRequirement {
  requires_artifacts?: XhsRuntimeRoute[];
  requires_review_pass?: boolean;
}

export interface XhsRuntimeStageRequirements {
  research?: XhsRuntimeStageRequirement;
  storyline?: XhsRuntimeStageRequirement;
  single_note_plan?: XhsRuntimeStageRequirement;
  visual_direction?: XhsRuntimeStageRequirement;
  render_html?: XhsRuntimeStageRequirement;
  fix_html?: XhsRuntimeStageRequirement;
  visual_director_review?: XhsRuntimeStageRequirement;
  screenshot_review?: XhsRuntimeStageRequirement;
  publish_copy?: XhsRuntimeStageRequirement;
  export_bundle?: XhsRuntimeStageRequirement;
}

export interface XhsRuntimePromptRoutes {
  research?: string;
  storyline?: string;
  single_note_plan?: string;
  visual_direction?: string;
  render_html?: string;
  fix_html?: string;
  visual_director_review?: string;
  screenshot_review?: string;
  publish_copy?: string;
  export_bundle?: string;
}

export interface XhsRuntimeRenderContract {
  shell_file?: string;
  recipe_registry?: {
    default?: string;
  };
}

export interface XhsRuntimePromptPack {
  root?: string;
  routes?: XhsRuntimePromptRoutes;
  render_contract?: XhsRuntimeRenderContract;
}

export interface XhsRuntimeSourceIndexEntry {
  status?: string;
  relative_path?: string;
  kind?: string;
}

export interface XhsRuntimeSourceIndex {
  sources?: XhsRuntimeSourceIndexEntry[];
}

export interface XhsRuntimeExtractedMaterial {
  material_id?: string;
  excerpt?: string;
  content_text?: string;
}

export interface XhsRuntimeExtractedMaterials {
  materials?: XhsRuntimeExtractedMaterial[];
}

export interface XhsRuntimeSourceBrief {
  brief_text?: string;
  input_mode?: string;
  confidence?: string;
}

export interface XhsRuntimeSharedSourceTruth {
  source_index?: XhsRuntimeSourceIndex;
  extracted_materials?: XhsRuntimeExtractedMaterials;
  source_brief?: XhsRuntimeSourceBrief;
}

export interface XhsRuntimeContract {
  overlay: 'xiaohongshu';
  deliverable_kind: 'xiaohongshu_note';
  profile_id: string;
  title: string;
  goal: string;
  stage_sequence?: XhsRuntimeStageSequence;
  stage_requirements?: XhsRuntimeStageRequirements;
  prompt_pack?: XhsRuntimePromptPack;
  layout_rules?: {
    max_primary_points_per_slide?: number;
  };
  shared_source_truth?: XhsRuntimeSharedSourceTruth;
}

export interface XhsRuntimePromptMeta {
  root: string;
  file: string;
  relative_path: string;
  source: 'repo' | 'embedded';
}

export interface XhsRuntimeReviewPolicy {
  status: 'idle' | 'rerun_required';
  rerun_from_stage: XhsRuntimeRoute | null;
}

export interface XhsRuntimeLatestChecks {
  director_intent_landed?: boolean;
  anti_template_ok?: boolean;
  memory_hook_present?: boolean;
  overflow_free?: boolean;
  occlusion_free?: boolean;
  visual_density_ok?: boolean;
  speaker_fit_ok?: boolean;
  baseline_comparison_passed?: boolean;
  platform_copy_complete?: boolean;
  cta_clear?: boolean;
}

export interface XhsRuntimeReviewStatePatch {
  current_status: string;
  ready_for_export: boolean;
  latest_review_stage: XhsRuntimeRoute;
  latest_checks: XhsRuntimeLatestChecks;
  pending_reviews: string[];
  blocking_reasons: string[];
  rerun_from_stage: XhsRuntimeRoute | null;
  rerun_policy: XhsRuntimeReviewPolicy;
}

export interface XhsRuntimeArtifactBase {
  overlay: 'xiaohongshu';
  route: XhsRuntimeRoute;
  profile_id: string;
  produced_at: string;
  prompt_pack: XhsRuntimePromptMeta;
  lifecycle_stage?: string | null;
  review_overlay?: string | null;
  execution_model: XhsRuntimeExecutionModel;
  artifact_refs?: string[];
  review_state_patch?: XhsRuntimeReviewStatePatch;
}

export interface XhsDirectorReviewArtifact extends XhsRuntimeArtifactBase {
  route: 'visual_director_review';
  status: 'pass' | 'block';
  visual_director_review: {
    director_intent_landed: boolean;
    anti_template_ok: boolean;
    memory_hook_present: boolean;
    homogeneous_layout_risk: number;
    weak_pages: string[];
    rewrite_action: 'none' | 'revise_render_html';
  };
  artifact_refs: string[];
  review_state_patch: XhsRuntimeReviewStatePatch;
}

export interface XhsSlideReviewChecks {
  overflow_free: boolean;
  occlusion_free: boolean;
  visual_density_ok: boolean;
  speaker_fit_ok: boolean;
}

export interface XhsSlideReview {
  slide_id?: string;
  status?: 'pass' | 'block';
  screenshot_file?: string;
  metrics?: {
    occupied_ratio?: number;
    overlaps?: unknown[];
  };
  checks: XhsSlideReviewChecks;
  issues: string[];
  ai_review?: {
    slide_id: string;
    judgement: 'pass' | 'block';
    visual_findings: string[];
    recommended_fix: string;
  };
}

export interface XhsBaselineReview {
  baseline_deliverable_id: string;
  current_failed_slides: number;
  baseline_failed_slides: number;
  current_average_density: number;
  baseline_average_density: number;
  baseline_comparison_passed: boolean;
  relative_quality: unknown;
  summary: unknown;
}

export interface XhsScreenshotReviewArtifact extends XhsRuntimeArtifactBase {
  route: 'screenshot_review';
  mode: XhsRuntimeMode;
  status: 'pass' | 'block';
  review_execution?: {
    owner?: string;
    overlay?: string;
    generation_runtime?: unknown;
  };
  checks: XhsRuntimeLatestChecks & {
    overflow_free: boolean;
    occlusion_free: boolean;
    visual_density_ok: boolean;
    speaker_fit_ok: boolean;
    cover_density_ok: boolean;
    anti_template_ok: boolean;
    memory_hook_present: boolean;
  };
  slide_reviews: XhsSlideReview[];
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
  review_state_patch: XhsRuntimeReviewStatePatch;
  baseline_review?: XhsBaselineReview;
}

export interface XhsPublishCopyArtifact extends XhsRuntimeArtifactBase {
  route: 'publish_copy';
  status: 'pass' | 'block';
  publish_copy: {
    titles: string[];
    body: string;
    first_comment: string;
    interaction_questions: string[];
    hashtags: string[];
    publish_suggestion: {
      cover_slide_id: string;
      recommended_time: string;
    };
    quality_gate: {
      title_count: number;
      body_char_count: number;
      comment_prompt_count: number;
      interaction_question_count: number;
      actionable_step_count: number;
      hashtag_count: number;
      banned_terms_hit_count: number;
      meta_instruction_leak_count: number;
      gate_pass: boolean;
    };
    caption_file: string;
  };
  artifact_refs: string[];
  review_state_patch: XhsRuntimeReviewStatePatch;
}

export interface XhsSeriesSurfaces {
  cadence_file: string;
  path_mapping_file: string;
  delivery_overview_file: string;
}

export interface XhsExportBundleArtifact extends XhsRuntimeArtifactBase {
  route: 'export_bundle';
  status: 'completed';
  export_bundle: {
    html_file: string;
    png_files: string[];
    caption_file: string;
    publish_manifest_file: string;
    delivery_state: {
      current: 'output_ready';
      next: 'published_pending_human';
    };
  };
  series_surfaces: XhsSeriesSurfaces | null;
  artifact_refs: string[];
  review_state_patch: XhsRuntimeReviewStatePatch;
}

export type XhsRuntimeStageContract = XhsRuntimeStageDefinition;

export interface XhsRuntimeRouteEnvelope<TRoute extends XhsRuntimeRoute> {
  overlay: XhsRuntimeContract['overlay'];
  route: TRoute;
  topic_id: string;
  deliverable_id: string;
  contract: XhsRuntimeContract;
  stage_contract: XhsRuntimeStageContract | null;
  execution_model: XhsRuntimeExecutionModel;
}

export type XhsRuntimeRouteOutput<
  TRoute extends XhsRuntimeRoute,
  TPayload extends { route: TRoute },
> = XhsRuntimeRouteEnvelope<TRoute> & TPayload;

export type XhsRuntimeRouteResult =
  | XhsRuntimeRouteOutput<'research', XhsResearchArtifact>
  | XhsRuntimeRouteOutput<'storyline', XhsStorylineArtifact>
  | XhsRuntimeRouteOutput<'single_note_plan', XhsPlanArtifact>
  | XhsRuntimeRouteOutput<'visual_direction', XhsVisualDirectionArtifact>
  | XhsRuntimeRouteOutput<'render_html', XhsRenderArtifact>
  | XhsRuntimeRouteOutput<'fix_html', XhsRenderArtifact>
  | XhsRuntimeRouteOutput<'visual_director_review', XhsDirectorReviewArtifact>
  | XhsRuntimeRouteOutput<'screenshot_review', XhsScreenshotReviewArtifact>
  | XhsRuntimeRouteOutput<'publish_copy', XhsPublishCopyArtifact>
  | XhsRuntimeRouteOutput<'export_bundle', XhsExportBundleArtifact>;

export interface XhsRuntimeRunRequest {
  workspaceRoot: string;
  topicId: string;
  deliverableId: string;
  route: XhsRuntimeRoute;
  contract: XhsRuntimeContract;
  mode?: XhsRuntimeMode;
  baselineDeliverableId?: string;
  adapter?: string;
}
