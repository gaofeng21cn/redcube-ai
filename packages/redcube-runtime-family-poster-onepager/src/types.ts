import type {
  PosterOnepagerHydratedContract,
  PosterOnepagerReviewCheck,
  PosterOnepagerStageId,
} from '@redcube/overlay-poster-onepager';
import type {
  CodexExecutionModel,
  HermesAgentLoopExecutionModel,
} from '@redcube/runtime-protocol';

export type PosterProfileId = 'knowledge_poster';
type PosterStageRoute = 'poster_blueprint' | 'visual_direction' | 'render_html';
type PosterPromptRoute = 'poster_blueprint' | 'visual_direction';
export type PosterMigrationMode = 'draft_new' | 'optimize_existing';
export type PosterLayoutFamily = 'hero_band' | 'evidence_columns' | 'pathway_strip' | 'action_footer';
export type PosterRecipeId = 'poster.hero_band' | 'poster.evidence_columns' | 'poster.pathway_strip' | 'poster.action_footer';

export interface PosterPackProvenanceStamp {
  owner: 'runtime_artifact_provenance';
  primary_surface: 'runtime_artifact_provenance';
  stage_owner: 'runtime_artifact_provenance';
  route: string;
  lifecycle_stage: string;
  authored_surface: string;
  materialized_from: string;
}

export interface PosterCanvasContract {
  width: number;
  height: number;
  ratio: string;
}

interface PosterDeliverablePaths {
  deliverableId: string;
  deliverableDir: string;
  artifactsDir: string;
  viewsDir: string;
  reportsDir: string;
}

interface PosterHydratedContract {
  overlay: string;
  profile_id: PosterProfileId;
  title: string;
  goal: string;
  prompt_pack?: {
    pack_id?: string;
    root?: string;
    render_contract?: PosterRenderContract;
  };
}

export interface PosterStorylineArtifact {
  route: 'storyline';
  overlay: string;
  profile_id: PosterProfileId;
  produced_at: string;
  storyline: {
    headline: string;
    subheadline: string;
    audience_judgement: string;
    why_now: string;
    proof_promise: string;
    call_to_action: string;
  };
}

interface PosterBlueprintSeedPanel {
  panel_id: string;
  region: PosterLayoutFamily;
  label: string;
  text: string;
  support_points?: string[];
}

interface PosterBlueprintSeed {
  poster_blueprint?: {
    render_recipe_id?: PosterRecipeId;
    headline?: string;
    subheadline?: string;
    panels?: PosterBlueprintSeedPanel[];
    anchor_tracks?: string[];
  };
}

export interface PosterBlueprintPanel {
  panel_id: string;
  region: PosterLayoutFamily;
  label: string;
  text: string;
  support_points: string[];
}

export interface PosterSourceReference {
  source_id: string;
  public_label: string;
}

export interface PosterBlueprintSlide {
  slide_id: string;
  slide_no: number;
  title: string;
  layout_family: PosterLayoutFamily;
  render_recipe_id: PosterRecipeId;
  page_goal: string;
  headline: string;
  subheadline: string;
  audience_judgement: string;
  why_now: string;
  proof_promise: string;
  call_to_action: string;
  panels: PosterBlueprintPanel[];
  evidence_and_sources: PosterSourceReference[];
  visual_presentation: {
    layout_family: PosterLayoutFamily;
    anchor_tracks: string[];
    canvas: PosterCanvasContract;
  };
  creative_sources: {
    major_blueprint_text: PosterPackProvenanceStamp;
    render_recipe_id: PosterPackProvenanceStamp;
  };
}

export interface PosterBlueprintArtifact {
  route: 'poster_blueprint';
  overlay: string;
  profile_id: PosterProfileId;
  produced_at: string;
  poster_blueprint: {
    headline: string;
    subheadline: string;
    render_recipe_id: PosterRecipeId;
    slides: PosterBlueprintSlide[];
    quality_guards: {
      require_visual_direction_before_html: boolean;
      forbid_template_route_tokens: string[];
      canvas: PosterCanvasContract;
    };
  };
}

interface PosterVisualDirectionSeed {
  visual_direction?: {
    visual_manifest?: string;
    poster_motif?: string;
    peak_region?: PosterLayoutFamily;
    panel_emphasis?: Partial<Record<PosterLayoutFamily, string>>;
    page_family_ceiling?: Partial<Record<PosterLayoutFamily, number>>;
    anti_template_constraints?: string[];
    forbidden_regressions?: string[];
    final_instruction_to_html_generator?: string[];
    palette?: {
      paper?: string;
      ink?: string;
      accent?: string;
      highlight?: string;
    };
  };
}

export interface PosterVisualDirectionArtifact {
  route: 'visual_direction';
  overlay: string;
  profile_id: PosterProfileId;
  produced_at: string;
  mode: PosterMigrationMode;
  visual_direction: {
    visual_manifest: string;
    poster_motif: string;
    peak_region: PosterLayoutFamily;
    panel_emphasis: Partial<Record<PosterLayoutFamily, string>>;
    page_family_ceiling: Partial<Record<PosterLayoutFamily, number>>;
    anti_template_constraints: string[];
    forbidden_regressions: string[];
    final_instruction_to_html_generator: string[];
    palette: {
      paper: string;
      ink: string;
      accent: string;
      highlight: string;
    };
    baseline_deliverable_id: string | null;
    creative_sources?: {
      visual_manifest: PosterPackProvenanceStamp;
      poster_motif: PosterPackProvenanceStamp;
      page_family_ceiling: PosterPackProvenanceStamp;
    };
  };
}

interface PosterRenderContract {
  render_strategy?: string;
  shell_file?: string;
  recipe_registry?: Partial<Record<PosterLayoutFamily | 'default', PosterRecipeId>>;
}

export interface PosterRenderSlide {
  slide_id: string;
  slide_no: number;
  title: string;
  layout_family: PosterLayoutFamily;
  recipe_id: PosterRecipeId;
  template_id: string;
  page_goal: string;
  headline: string;
  subheadline: string;
  audience_judgement: string;
  why_now: string;
  proof_promise: string;
  call_to_action: string;
  panels: PosterBlueprintPanel[];
  evidence_and_sources: PosterSourceReference[];
  director_contract: {
    peak_page: boolean;
    director_role: string;
    poster_motif: string;
    peak_region: PosterLayoutFamily;
    panel_emphasis: Partial<Record<PosterLayoutFamily, string>>;
    anti_template_constraints: string[];
    palette: {
      paper: string;
      ink: string;
      accent: string;
      highlight: string;
    };
  };
  total_slides: number;
  creative_sources: {
    recipe_selection: PosterPackProvenanceStamp;
    final_markup: PosterPackProvenanceStamp;
  };
  creative_authorship: {
    recipe_decision: PosterRenderSlide['creative_sources']['recipe_selection'];
    final_html_markup: PosterRenderSlide['creative_sources']['final_markup'];
  };
  markup_contract_source: 'runtime_artifact_provenance';
  content: string;
}

export interface PosterRenderArtifact {
  route: 'render_html';
  overlay: string;
  profile_id: PosterProfileId;
  produced_at: string;
  html_bundle: {
    html_file: string;
    page_count: number;
    shell_contract: PosterCanvasContract;
    render_strategy: string;
    director_contract: {
      poster_motif: string;
      peak_region: PosterLayoutFamily;
      page_family_ceiling: Partial<Record<PosterLayoutFamily, number>>;
      anti_template_constraints: string[];
    };
    slides: PosterRenderSlide[];
    render_plan: {
      render_strategy: string;
      shell_file: string;
      pack_id: string;
      authored_markup_surface: string;
      markup_binding_model: string;
      peak_region: PosterLayoutFamily;
      slides: Array<{
        slide_id: string;
        title: string;
        layout_family: PosterLayoutFamily;
        recipe_id: PosterRecipeId;
        template_id: string;
      }>;
    };
  };
  artifact_refs: string[];
}

interface PosterBlueprintDependencies {
  safeText: (value: unknown, fallback?: string) => string;
  safeArray: <T>(value: unknown) => T[];
  promptSeed: (contract: PosterHydratedContract, route: PosterPromptRoute, vars?: Record<string, string>) => PosterBlueprintSeed | PosterVisualDirectionSeed | null;
  attachCommon: (route: PosterStageRoute, contract: PosterHydratedContract) => Record<string, unknown>;
  CANVAS: PosterCanvasContract;
  BANNED_RENDER_TOKENS: string[];
  sourceLabels: (contract: PosterHydratedContract) => string[];
}

interface PosterVisualDirectionDependencies {
  safeText: (value: unknown, fallback?: string) => string;
  safeArray: <T>(value: unknown) => T[];
  promptSeed: (contract: PosterHydratedContract, route: PosterPromptRoute, vars?: Record<string, string>) => PosterVisualDirectionSeed | null;
  attachCommon: (route: PosterStageRoute, contract: PosterHydratedContract) => Record<string, unknown>;
}

interface PosterRenderArtifactDependencies {
  readStageArtifact: (contract: PosterHydratedContract, deliverablePaths: PosterDeliverablePaths, stageId: string) => PosterBlueprintArtifact | PosterVisualDirectionArtifact | null;
  renderContract: (contract: PosterHydratedContract) => PosterRenderContract;
  promptArtifact: (contract: PosterHydratedContract, route: 'render_html') => { render_markup_artifact?: { artifact_surface?: string; binding_model?: string; authored_markup_registry?: Record<string, string>; }; } | null;
  safeText: (value: unknown, fallback?: string) => string;
  safeArray: <T>(value: unknown) => T[];
  attachCommon: (route: PosterStageRoute, contract: PosterHydratedContract) => Record<string, unknown>;
  CANVAS: PosterCanvasContract;
  path: typeof import('node:path');
  readPromptPackText: (relativePath: string) => string;
  resolvePromptPackAsset: (contract: PosterHydratedContract, relativePath: string) => string;
  writeText: (file: string, content: string) => void;
  writeJson: (file: string, value: unknown) => void;
}

interface PosterBuildRenderArtifactInput {
  workspaceRoot: string;
  topicId: string;
  deliverableId: string;
  contract: PosterHydratedContract;
  deliverablePaths: PosterDeliverablePaths;
}

interface CompilePosterRenderSlidesInput {
  slides: PosterBlueprintSlide[];
  visualDirection: PosterVisualDirectionArtifact['visual_direction'];
  canvas: PosterCanvasContract;
  recipeMarkupRegistry: Record<string, string>;
  recipeMarkupArtifacts: Record<string, string>;
}

export type PosterRuntimeExecutionModel = CodexExecutionModel | HermesAgentLoopExecutionModel;

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
