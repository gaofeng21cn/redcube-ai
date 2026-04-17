import type {
  PosterOnepagerHydratedContract,
  PosterOnepagerReviewCheck,
  PosterOnepagerStageId,
} from '@redcube/overlay-poster-onepager';
import type {
  PosterBlueprintArtifact,
  PosterRenderArtifact,
  PosterStorylineArtifact,
  PosterVisualDirectionArtifact,
} from '@redcube/pack-poster-onepager';
import type {
  CodexExecutionModel,
  HermesNativeProofExecutionModel,
} from '@redcube/hermes-substrate';

export type PosterRuntimeExecutionModel = CodexExecutionModel | HermesNativeProofExecutionModel;

export type PosterRuntimeRoute = PosterOnepagerStageId;
export type PosterRuntimeMode = 'draft_new' | 'optimize_existing';
export type PosterRuntimeReviewCheckId = PosterOnepagerReviewCheck;

export interface PosterRuntimeCanRunContract {
  deliverable_kind?: string;
}

export interface PosterRuntimeSourceIndexEntry {
  status?: string;
  relative_path?: string;
  kind?: string;
}

export interface PosterRuntimeSourceIndex {
  sources?: PosterRuntimeSourceIndexEntry[];
}

export interface PosterRuntimeExtractedMaterial {
  material_id?: string;
  excerpt?: string;
  content_text?: string;
}

export interface PosterRuntimeExtractedMaterials {
  materials?: PosterRuntimeExtractedMaterial[];
}

export interface PosterRuntimeSourceBrief {
  brief_text?: string;
  input_mode?: string;
  confidence?: string;
}

export interface PosterRuntimeSharedSourceTruth {
  source_index?: PosterRuntimeSourceIndex;
  extracted_materials?: PosterRuntimeExtractedMaterials;
  source_brief?: PosterRuntimeSourceBrief;
}

export interface PosterRuntimeContract extends PosterOnepagerHydratedContract {
  shared_source_truth?: PosterRuntimeSharedSourceTruth;
}

export interface PosterRuntimePromptMeta {
  root: string;
  file: string;
  relative_path: string;
  source: 'repo' | 'embedded';
}

export interface PosterRuntimeReviewPolicy {
  status: 'idle' | 'rerun_required';
  rerun_from_stage: PosterRuntimeRoute | null;
}

export interface PosterRuntimeLatestChecks {
  director_intent_landed?: boolean;
  anti_template_ok?: boolean;
  message_hierarchy_clear?: boolean;
  evidence_trace_clear?: boolean;
  overflow_free?: boolean;
  occlusion_free?: boolean;
  visual_density_ok?: boolean;
  block_content_fit_ok?: boolean;
  baseline_comparison_passed?: boolean;
}

export interface PosterRuntimeReviewStatePatch {
  current_status: string;
  ready_for_export: boolean;
  latest_review_stage: PosterRuntimeRoute;
  latest_checks: PosterRuntimeLatestChecks;
  pending_reviews: PosterRuntimeReviewCheckId[];
  blocking_reasons: PosterRuntimeReviewCheckId[];
  rerun_from_stage: PosterRuntimeRoute | null;
  rerun_policy: PosterRuntimeReviewPolicy;
}

export interface PosterRuntimeArtifactBase {
  overlay: PosterRuntimeContract['overlay'];
  route: PosterRuntimeRoute;
  profile_id: PosterRuntimeContract['profile_id'];
  produced_at: string;
  prompt_pack: PosterRuntimePromptMeta;
  lifecycle_stage?: string | null;
  review_overlay?: string | null;
  execution_model: PosterRuntimeExecutionModel;
  artifact_refs?: string[];
  review_state_patch?: PosterRuntimeReviewStatePatch;
}

export interface PosterVisualDirectorReviewArtifact extends PosterRuntimeArtifactBase {
  route: 'visual_director_review';
  status: 'pass' | 'block';
  visual_director_review: {
    director_intent_landed: boolean;
    anti_template_ok: boolean;
    message_hierarchy_clear: boolean;
    evidence_trace_clear: boolean;
    weak_regions: string[];
    rewrite_action: string;
    review_summary: string;
    creative_sources: {
      review_judgement: unknown;
    };
  };
  artifact_refs: string[];
  review_state_patch: PosterRuntimeReviewStatePatch;
}

export interface PosterScreenshotReviewSlide {
  slide_id: string;
  title?: string;
  layout_family: string;
  screenshot_file: string;
  status: 'pass' | 'block';
  checks: {
    overflow_free: boolean;
    occlusion_free: boolean;
    visual_density_ok: boolean;
    block_content_fit_ok?: boolean;
  };
  metrics?: {
    occupied_ratio?: number;
    primary_points?: number;
    overlaps?: unknown[];
  };
  issues: string[];
  ai_review?: {
    slide_id: string;
    judgement: 'pass' | 'block';
    visual_findings: string[];
    recommended_fix: string;
  };
}

export interface PosterBaselineReview {
  baseline_deliverable_id: string;
  baseline_comparison_passed: boolean;
  baseline_review_file: string;
  current_average_density: number;
  baseline_average_density: number;
  current_failed_slides: number;
  baseline_failed_slides: number;
  relative_quality: unknown;
  summary: string;
}

export interface PosterScreenshotReviewArtifact extends PosterRuntimeArtifactBase {
  route: 'screenshot_review';
  mode: PosterRuntimeMode;
  status: 'pass' | 'block';
  review_execution?: {
    owner?: string;
    overlay?: string;
    generation_runtime?: unknown;
  };
  checks: PosterRuntimeLatestChecks & {
    overflow_free: boolean;
    occlusion_free: boolean;
    visual_density_ok: boolean;
    block_content_fit_ok: boolean;
  };
  slide_reviews: PosterScreenshotReviewSlide[];
  ai_review?: {
    review_model: string;
    director_intent_landed: boolean;
    anti_template_ok: boolean;
    message_hierarchy_clear: boolean;
    weak_regions: string[];
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
  review_state_patch: PosterRuntimeReviewStatePatch;
  baseline_review?: PosterBaselineReview;
}

export interface PosterExportBundleArtifact extends PosterRuntimeArtifactBase {
  route: 'export_bundle';
  status: 'completed';
  export_bundle: {
    source_html: string;
    png_files: string[];
    review_markdown: string;
    publish_manifest_file: string;
    delivery_state: {
      current: 'output_ready';
      next: null;
    };
  };
  artifact_refs: string[];
  review_state_patch: PosterRuntimeReviewStatePatch;
}

export type PosterRuntimeStageContract = PosterRuntimeContract['stage_sequence']['stages'][number];

export interface PosterRuntimeRouteEnvelope<TRoute extends PosterRuntimeRoute> {
  overlay: PosterRuntimeContract['overlay'];
  route: TRoute;
  topic_id: string;
  deliverable_id: string;
  contract: PosterRuntimeContract;
  stage_contract: PosterRuntimeStageContract | null;
  execution_model: PosterRuntimeExecutionModel;
}

export type PosterRuntimeRouteOutput<
  TRoute extends PosterRuntimeRoute,
  TPayload extends { route: TRoute },
> = PosterRuntimeRouteEnvelope<TRoute> & TPayload;

export type PosterRuntimeRouteResult =
  | PosterRuntimeRouteOutput<'storyline', PosterStorylineArtifact>
  | PosterRuntimeRouteOutput<'poster_blueprint', PosterBlueprintArtifact>
  | PosterRuntimeRouteOutput<'visual_direction', PosterVisualDirectionArtifact>
  | PosterRuntimeRouteOutput<'render_html', PosterRenderArtifact>
  | PosterRuntimeRouteOutput<'visual_director_review', PosterVisualDirectorReviewArtifact>
  | PosterRuntimeRouteOutput<'screenshot_review', PosterScreenshotReviewArtifact>
  | PosterRuntimeRouteOutput<'export_bundle', PosterExportBundleArtifact>;

export interface PosterRuntimeRunRequest {
  workspaceRoot: string;
  topicId: string;
  deliverableId: string;
  route: PosterRuntimeRoute;
  contract: PosterRuntimeContract;
  mode?: PosterRuntimeMode;
  baselineDeliverableId?: string;
  adapter?: string;
}

export type {
  PosterBlueprintArtifact,
  PosterRenderArtifact,
  PosterStorylineArtifact,
  PosterVisualDirectionArtifact,
};
