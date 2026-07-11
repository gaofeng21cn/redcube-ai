import type {
  CodexExecutionModel,
} from '@redcube/runtime-protocol';

export type XhsRunMode = 'single' | 'series';
type XhsPromptRoute = 'single_note_plan' | 'visual_direction';
type XhsStageRoute =
  | 'research'
  | 'storyline'
  | 'single_note_plan'
  | 'visual_direction'
  | 'render_html'
  | 'visual_director_review'
  | 'screenshot_review'
  | 'publish_copy'
  | 'export_bundle';
export type XhsMigrationMode = 'draft_new' | 'optimize_existing';
export type XhsLayoutFamily =
  | 'cover_note'
  | 'myth_compare'
  | 'sequence_stack'
  | 'process_track'
  | 'evidence_strip'
  | 'action_checklist';
export type XhsProgressionRole =
  | 'hook'
  | 'tension'
  | 'explain'
  | 'mechanism_peak'
  | 'evidence_peak'
  | 'memory_close';
export type XhsRecipeId =
  | 'xhs.hero_note'
  | 'xhs.split_contrast'
  | 'xhs.staggered_steps'
  | 'xhs.track_rail'
  | 'xhs.evidence_bands'
  | 'xhs.checklist_close';

export type XhsPackProvenanceSource = 'prompt_pack_seed' | 'runtime_artifact_provenance';

interface PackDeliverablePaths {
  deliverableId: string;
  deliverableDir: string;
  artifactsDir: string;
  viewsDir: string;
  reportsDir: string;
}

interface XhsSourceMaterial {
  material_id?: string;
  excerpt?: string;
  content_text?: string;
}

interface XhsPromptPackContract {
  pack_id?: string;
  render_contract?: XhsRenderContract;
}

interface XhsHydratedContract {
  overlay: string;
  profile_id: string;
  title: string;
  goal: string;
  deliverable_kind?: string;
  prompt_pack?: XhsPromptPackContract;
  layout_rules?: {
    max_primary_points_per_slide?: number;
  };
}

export interface XhsResearchArtifact {
  route: 'research';
  overlay: string;
  profile_id: string;
  produced_at: string;
  research: {
    mode?: XhsRunMode;
    audience_judgement?: string;
    tension?: string;
    why_now?: string;
    memory_hook?: string;
    public_sources?: string[];
    confidence?: string;
    source_truth_material_ids?: string[];
  };
}

export interface XhsStorylineArtifact {
  route: 'storyline';
  overlay: string;
  profile_id: string;
  produced_at: string;
  storyline: {
    mode?: XhsRunMode;
    audience_judgement?: string;
    tension?: string;
    why_now?: string;
    memory_hook?: string;
    hook?: string;
    narrative_progression?: string[];
    journey?: string[];
    resolution?: string;
    series_needed?: boolean;
    source_truth_material_ids?: string[];
    source_truth_confidence?: string;
  };
}

interface XhsPlanningSeedSlide {
  slide_id: string;
  title: string;
  layout_family: XhsLayoutFamily;
  render_recipe_id: XhsRecipeId;
  page_goal: string;
  progression_role?: XhsProgressionRole;
  page_core_content?: string[];
  visual_presentation?: XhsSourceVisualPresentation;
  source_language?: string;
  speaker_notes?: string;
  transition?: string;
  core_sentence?: string;
}

interface XhsPlanningSeed {
  plan?: {
    title_options?: string[];
    slides?: XhsPlanningSeedSlide[];
  };
}

export interface XhsPageRhythmPoint {
  slide_id: string;
  role: XhsProgressionRole;
}

export interface XhsMaterialRules {
  paper_base: string;
  main_accent: string;
  warning_accent: string;
}

interface XhsVisualDirectionSeed {
  visual_direction?: {
    director_statement?: string;
    visual_motif?: string;
    material_rules?: Partial<XhsMaterialRules>;
    rhythm_curve?: XhsPageRhythmPoint[];
    peak_pages?: string[];
    page_family_ceiling?: Partial<Record<XhsLayoutFamily, number>>;
    anti_template_constraints?: string[];
    source_language_discipline?: string;
    forbidden_regressions?: string[];
  };
}

export interface XhsSourceReference {
  source_id: string;
  public_label: string;
}

export interface XhsSourceVisualPresentation {
  layout_family: XhsLayoutFamily;
  main_visual_action: string;
  action_primitive: string;
  anchor_tracks: string[];
  anti_template_note: string;
}

export interface XhsPlanSlide {
  slide_id: string;
  slide_no: number;
  title: string;
  layout_family: XhsLayoutFamily;
  render_recipe_id: XhsRecipeId;
  page_goal: string;
  progression_role: XhsProgressionRole;
  core_sentence: string;
  page_core_content: string[];
  visual_presentation: XhsSourceVisualPresentation;
  source_language: string;
  evidence_and_sources: XhsSourceReference[];
  speaker_notes: string;
  transition: string;
  transition_sentence: string;
  creative_sources: {
    page_core_content: 'prompt_pack_seed';
    visual_presentation: 'prompt_pack_seed';
  };
}

export interface XhsPlanArtifact {
  route: 'single_note_plan';
  overlay: string;
  profile_id: string;
  produced_at: string;
  single_note_plan: {
    mode: XhsRunMode;
    title_options: string[];
    planning_doc_markdown: string;
    slides: XhsPlanSlide[];
    source_truth_material_ids: string[];
  };
}

export interface XhsVisualDirectionRoleSummary {
  slide_id: string;
  title: string;
  page_role: XhsProgressionRole;
  first_glance: string;
  second_glance: string;
}

export interface XhsVisualDirection {
  director_statement: string;
  visual_motif: string;
  material_rules: XhsMaterialRules;
  rhythm_curve: XhsPageRhythmPoint[];
  peak_pages: string[];
  page_family_ceiling: Partial<Record<XhsLayoutFamily, number>>;
  anti_template_constraints: string[];
  source_language_discipline: string;
  source_truth_confidence: string;
  page_role_table: XhsVisualDirectionRoleSummary[];
  forbidden_regressions: string[];
  baseline_deliverable_id: string | null;
  memory_hook: string;
  creative_sources?: {
    director_statement: 'prompt_pack_seed';
    visual_motif: 'prompt_pack_seed';
    rhythm_curve: 'prompt_pack_seed';
    page_family_ceiling: 'prompt_pack_seed';
  };
}

export interface XhsVisualDirectionArtifact {
  route: 'visual_direction';
  overlay: string;
  profile_id: string;
  produced_at: string;
  mode: XhsMigrationMode;
  visual_direction: XhsVisualDirection;
}

interface XhsRenderContract {
  render_strategy?: string;
  shell_file?: string;
  recipe_registry?: Partial<Record<XhsLayoutFamily | 'default', XhsRecipeId>>;
}

export interface XhsRenderSlideDirectorContract {
  visual_motif: string;
  source_language_discipline: string;
  anti_template_constraints: string[];
  peak_page: boolean;
  page_role: XhsProgressionRole;
  memory_hook: string;
  material_rules: XhsMaterialRules;
}

export interface XhsRenderSlide {
  slide_id: string;
  slide_no: number;
  title: string;
  layout_family: XhsLayoutFamily;
  recipe_id: XhsRecipeId;
  template_id: string;
  page_goal: string;
  page_core_content: string[];
  evidence_and_sources: XhsSourceReference[];
  director_contract: XhsRenderSlideDirectorContract;
  speaker_seconds: number;
  total_slides: number;
  creative_sources: {
    recipe_selection: XhsPackProvenanceSource;
    final_markup: XhsPackProvenanceSource;
  };
  content: string;
}

export interface XhsRenderPlanSlideSummary {
  slide_id: string;
  title: string;
  layout_family: XhsLayoutFamily;
  recipe_id: XhsRecipeId;
  template_id?: string;
  peak_page: boolean;
  director_role: XhsProgressionRole;
}

export interface XhsRenderPlan {
  render_strategy: string;
  shell_file: string;
  pack_id: string;
  authored_markup_surface?: string;
  markup_binding_model?: string;
  director_contract: {
    visual_motif: string;
    peak_pages: string[];
    page_family_ceiling: Partial<Record<XhsLayoutFamily, number>>;
    anti_template_constraints: string[];
    source_language_discipline: string;
  };
  slides: XhsRenderPlanSlideSummary[];
}

export interface RenderCanvas {
  width: number;
  height: number;
  ratio: string;
}

export interface XhsRenderArtifact {
  route: 'render_html';
  overlay: string;
  profile_id: string;
  produced_at: string;
  html_bundle: {
    html_file: string;
    page_count: number;
    shell_contract: RenderCanvas;
    render_strategy: string;
    director_contract: XhsRenderPlan['director_contract'];
    slides: XhsRenderSlide[];
  };
  artifact_refs: string[];
}

interface CompileXhsRenderSlidesInput {
  slides: XhsPlanSlide[];
  visualDirection: XhsVisualDirection;
  canvas: RenderCanvas;
  recipeMarkupRegistry: Partial<Record<XhsRecipeId, string>>;
  recipeMarkupArtifacts: Partial<Record<XhsRecipeId, string>>;
}

interface XhsPlanningDependencies {
  safeText(value: unknown, fallback?: string): string;
  safeArray<T>(value: T[] | null | undefined): T[];
  promptSeed(contract: XhsHydratedContract, route: XhsPromptRoute, vars?: { title?: string }): XhsPlanningSeed | XhsVisualDirectionSeed | null;
  promptArtifact(contract: XhsHydratedContract, route: string, vars?: Record<string, string>): Record<string, unknown> | null;
  sourceLabels(contract: XhsHydratedContract): string[];
  sourceMaterials(contract: XhsHydratedContract): XhsSourceMaterial[];
  inferMemoryHook(contract: XhsHydratedContract): string;
  inferAudience(contract: XhsHydratedContract): string;
  inferWhyNow(contract: XhsHydratedContract): string;
  inferTension(contract: XhsHydratedContract): string;
}

interface XhsArtifactBase {
  route: XhsStageRoute;
  overlay: string;
  profile_id: string;
  produced_at: string;
}

interface XhsVisualDirectionDependencies {
  attachCommon(route: XhsStageRoute, contract: XhsHydratedContract): XhsArtifactBase;
  safeText(value: unknown, fallback?: string): string;
  safeArray<T>(value: T[] | null | undefined): T[];
  promptSeed(contract: XhsHydratedContract, route: XhsPromptRoute, vars?: { title?: string }): XhsPlanningSeed | XhsVisualDirectionSeed | null;
  readStageArtifact<T>(contract: XhsHydratedContract, deliverablePaths: PackDeliverablePaths, stageId: XhsStageRoute): T | null;
  sourceConfidence(contract: XhsHydratedContract): string;
  inferMemoryHook(contract: XhsHydratedContract): string;
}

interface XhsPathModuleLike {
  join(...paths: string[]): string;
}

interface XhsRenderArtifactDependencies {
  readStageArtifact<T>(contract: XhsHydratedContract, deliverablePaths: PackDeliverablePaths, stageId: XhsStageRoute): T | null;
  renderContract(contract: XhsHydratedContract): XhsRenderContract;
  safeText(value: unknown, fallback?: string): string;
  safeArray<T>(value: T[] | null | undefined): T[];
  attachCommon(route: XhsStageRoute, contract: XhsHydratedContract): XhsArtifactBase;
  CANVAS: RenderCanvas;
  resolvePromptPackAsset(contract: XhsHydratedContract, relativePath: string): string;
  readPromptPackText(relativePath: string): string;
  writeText(file: string, content: string): void;
  path: XhsPathModuleLike;
}

export type XhsRuntimeExecutionModel = CodexExecutionModel;

export type XhsRuntimeRoute =
  | 'research'
  | 'storyline'
  | 'single_note_plan'
  | 'visual_direction'
  | 'author_image_pages'
  | 'repair_image_pages'
  | 'render_html'
  | 'fix_html'
  | 'visual_director_review'
  | 'screenshot_review'
  | 'publish_copy'
  | 'export_bundle';

export type XhsRuntimeMode = 'draft_new' | 'optimize_existing';

export interface XhsRuntimeStageDefinition {
  stage_id: XhsRuntimeRoute;
  output_artifact?: string;
}

export interface XhsRuntimeStageSequence {
  stages?: XhsRuntimeStageDefinition[];
  alternate_stages?: XhsRuntimeStageDefinition[];
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
  author_image_pages?: XhsRuntimeStageRequirement;
  repair_image_pages?: XhsRuntimeStageRequirement;
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
  author_image_pages?: string;
  repair_image_pages?: string;
  render_html?: string;
  fix_html?: string;
  visual_director_review?: string;
  screenshot_review?: string;
  publish_copy?: string;
  export_bundle?: string;
}

export interface XhsRuntimeRenderContract {
  render_strategy?: 'image_first_page_authoring';
  default_visual_route?: 'author_image_pages';
  image_generation?: {
    default_model?: 'gpt-image-2';
    size?: '1086x1448';
    output_mode?: 'full_page_png';
    page_image_artifacts_required?: boolean;
    default_style_profile?: string;
    built_in_style_reference_dir?: string;
    style_reference_dir_input?: string;
    style_reference_override_semantics?: string;
    review_input_surface?: string;
  };
  selectable_explicit_routes?: Array<'render_html' | 'fix_html'>;
  explicit_route_policy?: 'html_routes_require_operator_selection';
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
  block_content_fit_ok?: boolean;
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
    rewrite_action: 'none' | 'revise_render_html' | 'repair_image_pages';
  };
  artifact_refs: string[];
  review_state_patch: XhsRuntimeReviewStatePatch;
}

export interface XhsSlideReviewChecks {
  overflow_free: boolean;
  occlusion_free: boolean;
  visual_density_ok: boolean;
  block_content_fit_ok?: boolean;
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
    block_content_fit_ok: boolean;
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
      source_surface_kind?: 'image_pages' | 'html';
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

export interface XhsImagePageRecord {
  slide_id: string;
  title?: string;
  layout_family?: string;
  page_goal?: string;
  image_file: string;
  png_file: string;
  prompt_manifest_file?: string;
  style_manifest_file?: string;
  dimensions?: {
    width?: number;
    height?: number;
    ratio?: '3:4';
  };
  hash?: string;
  sha256?: string;
  generated?: boolean;
  preserved?: boolean;
  preserved_slide_hash?: string;
  source_route?: 'author_image_pages' | 'repair_image_pages';
}

export interface XhsImagePagesArtifact extends XhsRuntimeArtifactBase {
  route: 'author_image_pages' | 'repair_image_pages';
  status: 'completed';
  image_generation_runtime: {
    provider?: string;
    base_url_host?: string;
    endpoint: string;
    request_model: string;
    tool_options?: unknown;
    token_persisted: false;
    provider_token_required?: false;
    provider_token_source?: string;
  };
  image_pages_bundle: {
    kind: 'xiaohongshu_image_pages_bundle';
    source_visual_route: 'author_image_pages' | 'repair_image_pages';
    editable: false;
    page_count: number;
    dimensions: {
      width: 1086;
      height: 1448;
      ratio: '3:4';
    };
    pages: XhsImagePageRecord[];
    png_refs: string[];
    prompt_manifest_file: string;
    style_manifest_file: string;
    generation_metadata_file: string;
    preserved_slide_hashes: Array<{
      slide_id: string;
      preserved_slide_hash: string;
      image_file: string;
    }>;
  };
  image_page_manifest: {
    kind: 'xiaohongshu_image_page_manifest';
    source_visual_route: 'author_image_pages' | 'repair_image_pages';
    editable: false;
    page_count: number;
    slides: XhsImagePageRecord[];
    prompt_manifest: string;
    style_manifest: string;
    generation_metadata_file: string;
  };
  image_generation_calls: unknown[];
  repair_image_pages: {
    source_review_stage: 'screenshot_review';
    blocked_slide_ids: string[];
    preserved_slide_hashes: unknown[];
  } | null;
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
    source_surface_kind?: 'image_pages' | 'html';
    source_visual_route?: 'author_image_pages' | 'repair_image_pages' | 'render_html' | 'fix_html';
    editable?: false;
    html_file: string;
    source_html?: string;
    source_artifacts?: unknown;
    png_files: string[];
    caption_file: string;
    publish_manifest_file: string;
    publish_dir?: string;
    publish_html_file?: string;
    publish_caption_file?: string;
    publish_png_files?: string[];
    publish_image_files?: string[];
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
  owner_receipt_refs?: string[];
  typed_blocker_refs?: string[];
}

export type XhsRuntimeRouteOutput<
  TRoute extends XhsRuntimeRoute,
  TPayload extends { route: TRoute },
> = XhsRuntimeRouteEnvelope<TRoute> & TPayload;

export type XhsFixHtmlArtifact = Omit<XhsRenderArtifact, 'route'> & {
  route: 'fix_html';
};

export type XhsRuntimeRouteResult =
  | XhsRuntimeRouteOutput<'research', XhsResearchArtifact>
  | XhsRuntimeRouteOutput<'storyline', XhsStorylineArtifact>
  | XhsRuntimeRouteOutput<'single_note_plan', XhsPlanArtifact>
  | XhsRuntimeRouteOutput<'visual_direction', XhsVisualDirectionArtifact>
  | XhsRuntimeRouteOutput<'author_image_pages', XhsImagePagesArtifact & { route: 'author_image_pages' }>
  | XhsRuntimeRouteOutput<'repair_image_pages', XhsImagePagesArtifact & { route: 'repair_image_pages' }>
  | XhsRuntimeRouteOutput<'render_html', XhsRenderArtifact>
  | XhsRuntimeRouteOutput<'fix_html', XhsFixHtmlArtifact>
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
