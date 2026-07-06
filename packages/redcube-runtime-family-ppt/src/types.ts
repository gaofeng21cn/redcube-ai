import type {
  PptDeckHydratedContract,
  PptDeckReviewCheck,
  PptDeckStageId,
} from '@redcube/overlay-ppt';
import type { RelativeQualityRubric } from '@redcube/reference-os';
import type {
  CodexExecutionModel,
  HermesAgentLoopExecutionModel,
} from '@redcube/runtime-protocol';
import type { PptExportBundleArtifact } from './types-parts/export-bundle.js';

export type { PptExportBundleArtifact } from './types-parts/export-bundle.js';

export type PptProfileId =
  | 'lecture_student'
  | 'lecture_peer'
  | 'executive_briefing'
  | 'defense_deck';

export type PptStageRoute =
  | 'detailed_outline'
  | 'slide_blueprint'
  | 'visual_direction'
  | 'render_html';

export type PptPromptRoute =
  | 'detailed_outline'
  | 'slide_blueprint'
  | 'visual_direction';

export type PptMigrationMode = 'draft_new' | 'optimize_existing';

export type PptPageType =
  | 'cover_peak'
  | 'stakes_window'
  | 'central_axis'
  | 'timeline_band'
  | 'judgement_ladder'
  | 'evidence_surface'
  | 'ring_cross'
  | 'closure_peak';

export type PptLayoutFamily =
  | 'cover_hero'
  | 'multi_zone_compare'
  | 'central_axis'
  | 'timeline_band'
  | 'judgement_ladder'
  | 'ring_cross'
  | 'summary_peak'
  | 'summary_cross';

export type PptRhythmRole =
  | 'opening_peak'
  | 'stakes_rise'
  | 'clarify_buffer'
  | 'mechanism_peak'
  | 'decision_bridge'
  | 'evidence_peak'
  | 'practice_bridge'
  | 'closing_peak';

export type PptRecipeId =
  | 'ppt.timeline_rail'
  | 'ppt.judgement_ladder'
  | 'ppt.ring_cross'
  | 'ppt.central_axis'
  | 'ppt.summary_peak'
  | `ppt.${PptLayoutFamily}`;

export type PptPackProvenanceSource = 'prompt_pack_seed' | 'runtime_artifact_provenance';

export interface PptCanvasContract {
  width: number;
  height: number;
  ratio: string;
}

export interface PptSourceMaterial {
  excerpt?: string;
  content_text?: string;
}

export interface PptHydratedContract {
  overlay: string;
  profile_id: PptProfileId;
  title: string;
  goal: string;
  prompt_pack?: {
    pack_id?: string;
    render_contract?: PptRenderContract;
  };
}

export interface PptDetailedOutlineSeedSlide {
  slide_id: string;
  slide_no: number;
  page_type: PptPageType;
  layout_family: PptLayoutFamily;
  title: string;
  page_goal: string;
  core_sentence: string;
  page_objective: string;
  evidence_points: string[];
  page_core_content?: string[];
  visual_anchor_tracks?: string[];
  speaker_notes?: string;
  transition_sentence?: string;
  render_recipe_id?: PptRecipeId;
  public_sources?: string[];
}

export interface PptDetailedOutlineSeed {
  slides?: PptDetailedOutlineSeedSlide[];
}

export interface PptSlideBlueprintSeed {
  quality_guards?: {
    max_primary_points_per_slide?: number;
    max_evidence_points_per_slide?: number;
  };
  profile_checks?: Partial<Record<PptProfileId, string[]>>;
}

export interface PptVisualDirectionSeed {
  visual_direction?: {
    visual_manifest?: string;
    what_it_is?: string[];
    what_it_is_not?: string[];
    final_instruction_to_html_generator?: string[];
  };
}

export interface PptOutlineSlide {
  slide_id: string;
  slide_no: number;
  page_type: PptPageType;
  layout_family: PptLayoutFamily;
  title: string;
  page_goal: string;
  core_sentence: string;
  page_objective: string;
  evidence_points: string[];
  public_sources: string[];
}

export interface PptChapterSummary {
  chapter_id: string;
  title: string;
  slide_range: string;
}

export interface PptDetailedOutlineSummary {
  slide_no: string;
  title: string;
  page_objective: string;
  core_sentence: string;
  evidence_points: string[];
  public_sources: string[];
  render_recipe_id: PptRecipeId;
  creative_sources: {
    major_text: PptPackProvenanceSource;
    recipe_selection: PptPackProvenanceSource;
  };
}

export interface PptDetailedOutlineArtifact {
  route: 'detailed_outline';
  overlay: string;
  profile_id: PptProfileId;
  produced_at: string;
  detailed_outline: {
    chapter_structure: PptChapterSummary[];
    page_budget: {
      total_slides: number;
    };
    slides: PptDetailedOutlineSummary[];
  };
}

export interface PptPageCoreContentItem {
  label: string;
  text: string;
}

export interface PptSourceReference {
  source_id: string;
  public_label: string;
}

export interface PptBlueprintSlide {
  slide_id: string;
  slide_no: number;
  page_type: PptPageType;
  title: string;
  page_goal: string;
  core_sentence: string;
  render_recipe_id: PptRecipeId;
  page_core_content: PptPageCoreContentItem[];
  visual_presentation: {
    layout_family: PptLayoutFamily;
    anchor_tracks: string[];
    canvas: PptCanvasContract;
  };
  evidence_and_sources: PptSourceReference[];
  speaker_notes: string;
  speaker_seconds: number;
  transition_sentence: string;
  creative_sources: {
    page_core_content: PptPackProvenanceSource;
    speaker_notes: PptPackProvenanceSource;
    transition_sentence: PptPackProvenanceSource;
    visual_presentation: PptPackProvenanceSource;
    recipe_selection: PptPackProvenanceSource;
  };
}

export interface PptBlueprintArtifact {
  route: 'slide_blueprint';
  overlay: string;
  profile_id: PptProfileId;
  produced_at: string;
  slide_blueprint: {
    chapter_goal: string;
    slides: PptBlueprintSlide[];
    quality_guards: {
      require_visual_direction_before_html: boolean;
      forbid_template_route_tokens: string[];
      canvas: PptCanvasContract;
      max_primary_points_per_slide?: number;
      max_evidence_points_per_slide?: number;
    };
    profile_checks: string[];
  };
}

export interface PptPalette {
  canvas: string;
  ink: string;
  accent: string;
  accentSoft: string;
  success: string;
}

export interface PptPageRoleSummary {
  slide_id: string;
  title: string;
  page_role: PptLayoutFamily;
  first_glance: string;
  second_glance: string;
}

export interface PptVisualDirection {
  visual_manifest: string;
  what_it_is: string[];
  what_it_is_not: string[];
  palette: PptPalette;
  continuity_constraints: string[];
  rhythm_curve: Array<{
    slide_id: string;
    role: PptRhythmRole;
  }>;
  peak_pages: string[];
  page_family_ceiling: Partial<Record<PptLayoutFamily, number>>;
  forbidden_regressions: string[];
  page_role_table: PptPageRoleSummary[];
  final_instruction_to_html_generator: string[];
  source_truth_confidence: string;
  baseline_deliverable_id: string | null;
  mode: PptMigrationMode;
  creative_sources?: {
    visual_manifest: PptPackProvenanceSource;
    rhythm_curve: PptPackProvenanceSource;
    peak_pages: PptPackProvenanceSource;
    page_family_ceiling: PptPackProvenanceSource;
  };
}

export interface PptVisualDirectionArtifact {
  route: 'visual_direction';
  overlay: string;
  profile_id: PptProfileId;
  produced_at: string;
  visual_direction: PptVisualDirection;
}

export interface PptDeliverablePaths {
  deliverableId: string;
  deliverableDir: string;
  artifactsDir: string;
  viewsDir: string;
  reportsDir: string;
}

export interface PptRenderContract {
  compiler_module?: string;
  render_strategy?: string;
  shell_file?: string;
  recipe_registry?: Partial<Record<PptLayoutFamily | 'default', PptRecipeId>>;
}

export interface PptRenderSlideDirectorContract {
  peak_page: boolean;
  director_role: PptLayoutFamily;
  generator_instructions: string[];
  page_family_ceiling: Partial<Record<PptLayoutFamily, number>>;
  visual_manifest: string;
}

export interface PptRenderSlide {
  slide_id: string;
  slide_no: number;
  title: string;
  layout_family: PptLayoutFamily;
  recipe_id: PptRecipeId;
  template_id?: string;
  page_goal: string;
  page_core_content: PptPageCoreContentItem[];
  evidence_and_sources: PptSourceReference[];
  speaker_seconds: number;
  transition_sentence: string;
  director_contract: PptRenderSlideDirectorContract;
  palette: PptPalette;
  total_slides: number;
  creative_sources: {
    recipe_selection: PptPackProvenanceSource;
    final_markup: PptPackProvenanceSource;
  };
  markup_contract_source: 'runtime_artifact_provenance';
  content: string;
}

export interface PptRenderPlan {
  render_strategy: string;
  shell_file: string;
  pack_id: string;
  authored_markup_surface?: string;
  markup_binding_model?: string;
  generator_instructions: string[];
  peak_pages: string[];
  page_family_ceiling: Partial<Record<PptLayoutFamily, number>>;
  slides: Array<{
    slide_id: string;
    title: string;
    layout_family: PptLayoutFamily;
    recipe_id: PptRecipeId;
    template_id?: string;
    peak_page: boolean;
    director_role?: PptLayoutFamily;
  }>;
}

export interface PptRenderArtifact {
  route: 'render_html';
  overlay: string;
  profile_id: PptProfileId;
  produced_at: string;
  html_bundle: {
    html_file: string;
    slides_file: string;
    page_count: number;
    render_strategy: string;
    generator_instructions: string[];
    shell_contract: PptCanvasContract & {
      controls: string[];
    };
    slides: PptRenderSlide[];
  };
  artifact_refs: string[];
}

export interface PptOutlineDependencies {
  safeText(value: unknown): string;
  promptSeed(
    route: PptPromptRoute,
    vars?: {
      title?: string;
      goal?: string;
      profile_id?: string;
      public_source_1?: string;
      public_source_2?: string;
      public_source_3?: string;
    },
  ): PptDetailedOutlineSeed | PptSlideBlueprintSeed | PptVisualDirectionSeed | null;
  sharedSourceLabels(contract: PptHydratedContract): string[];
  sharedSourceMaterials(contract: PptHydratedContract): PptSourceMaterial[];
}

export interface PptArtifactBase {
  route: PptStageRoute;
  overlay: string;
  profile_id: PptProfileId;
  produced_at: string;
}

export interface PptSlideBlueprintDependencies {
  attachCommon(route: Extract<PptStageRoute, 'detailed_outline' | 'slide_blueprint'>, contract: PptHydratedContract): PptArtifactBase;
  safeArray<T>(value: T[] | null | undefined): T[];
  CANVAS: PptCanvasContract;
  BANNED_RENDER_TOKENS: string[];
}

export interface PptVisualDirectionDependencies {
  attachCommon(route: 'visual_direction', contract: PptHydratedContract): PptArtifactBase;
  safeText(value: unknown): string;
  safeArray<T>(value: T[] | null | undefined): T[];
  promptSeed(
    route: 'visual_direction',
    vars?: {
      title?: string;
    },
  ): PptVisualDirectionSeed | null;
  sharedSourceConfidence(contract: PptHydratedContract): string;
}

export interface PptBuildRenderArtifactInput {
  workspaceRoot: string;
  topicId: string;
  deliverableId: string;
  contract: PptHydratedContract;
  deliverablePaths: PptDeliverablePaths;
}

export interface PptPathModuleLike {
  join(...paths: string[]): string;
}

export interface PptRenderArtifactDependencies {
  readStageArtifact<T>(
    contract: PptHydratedContract,
    deliverablePaths: PptDeliverablePaths,
    stageId: Extract<PptStageRoute, 'slide_blueprint' | 'visual_direction'>,
  ): T;
  renderContract(contract: PptHydratedContract): PptRenderContract;
  promptArtifact(route: 'render_html', vars?: Record<string, string>): Record<string, unknown> | null;
  safeText(value: unknown, fallback?: string): string;
  safeArray<T>(value: T[] | null | undefined): T[];
  readPromptPackText(relativePath: string): string;
  writeText(file: string, content: string): void;
  writeJson(file: string, data: {
    title: string;
    slides: Array<{
      slideId: string;
      title: string;
      recipeId: PptRecipeId;
      content: string;
    }>;
  }): void;
  attachCommon(route: 'render_html', contract: PptHydratedContract): PptArtifactBase;
  CANVAS: PptCanvasContract;
  path: PptPathModuleLike;
}

export interface CompilePptRenderSlidesInput {
  slides: PptBlueprintSlide[];
  visualDirection: PptVisualDirection;
  canvas: PptCanvasContract;
  recipeMarkupRegistry: Partial<Record<PptRecipeId, string>>;
  recipeMarkupArtifacts: Partial<Record<PptRecipeId, string>>;
}

export type PptRuntimeExecutionModel = CodexExecutionModel | HermesAgentLoopExecutionModel;

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
  edge_clearance_ok?: boolean;
  block_content_fit_ok?: boolean;
  title_typography_ok?: boolean;
  external_audience_language_ok?: boolean;
  title_safe_zone_clear?: boolean;
  table_legibility_ok?: boolean;
  layout_density_ok?: boolean;
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
  execution_model: PptRuntimeExecutionModel;
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
      review_judgement: unknown;
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
  edge_clearance_ok?: boolean;
  block_content_fit_ok?: boolean;
  title_typography_ok?: boolean;
  external_audience_language_ok?: boolean;
  title_safe_zone_clear?: boolean;
  table_legibility_ok?: boolean;
  layout_density_ok?: boolean;
}

export interface PptSlideReviewMetrics {
  text_char_count?: number;
  title_font_size?: number;
  title_font_reference?: number | null;
  title_font_delta?: number | null;
  block_count?: number;
  overlap_pairs?: number;
  structural_text_collision_count?: number;
  structural_text_collisions?: Array<Record<string, unknown>>;
  occupied_ratio?: number;
  render_proof_source?: string;
  synthetic_preview?: boolean;
  block_content_failures?: Array<Record<string, unknown>>;
  operator_language_fragments?: string[];
  title_safe_zone_clearance_ok?: boolean;
  table_min_font_pt?: number | null;
  card_blank_ratio?: number | null;
  table_metrics?: Array<Record<string, unknown>>;
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

export interface PptReviewCapture {
  capture_id: string;
  screenshots_dir: string;
  review_markdown_file?: string;
  device_scale_factor?: number;
  screenshot_dimensions?: {
    width: number;
    height: number;
  } | null;
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
    block_content_fit_ok: boolean;
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
  review_capture?: PptReviewCapture;
  report_markdown: string;
  metrics: unknown;
  artifact_refs: string[];
  review_state_patch: PptRuntimeReviewStatePatch;
  baseline_review?: PptBaselineReview;
}

export interface PptNativePptSlideManifest {
  slide_id: string;
  title: string;
  layout_family?: string;
  shape_count: number;
  text_box_count: number;
  preview_screenshot_file: string;
  repaired?: boolean;
}

export interface PptNativePptRepairLog {
  consumed_review_stage?: 'screenshot_review' | null;
  target_slide_ids: string[];
  preserved_slide_ids?: string[];
  blocked_slide_ids_source?: string | null;
  scope?: 'deck' | 'page';
  feedback_count?: number;
  repair_log_file: string;
}

export interface PptNativePptEngineContract {
  kind: 'redcube_native_ppt_python_engine';
  language: 'python';
  contract_version: 1;
  owned_routes: Array<'author_pptx_native' | 'repair_pptx_native'>;
  input_boundary: 'slide_blueprint_plus_visual_direction_json';
  review_boundary: 'rendered_pptx_screenshots';
  engine_capabilities: {
    authoring_ir: 'redcube_svg_ir';
    authoring_ir_version: 1;
    pptx_writer: 'officecli_pptx_materializer';
    editable_pptx: true;
    strict_svg_preflight: true;
    true_render_proof_required: true;
    true_render_proof_renderer: 'libreoffice_headless';
    cross_platform_render_required: true;
    screenshot_packaging: false;
  };
  officecli_materializer_policy?: {
    policy_id: 'ppt_native_officecli_materializer_quality_gate_v1';
    adoption_status: 'qa_materializer_discipline_only';
    rca_main_workflow_owner: 'redcube_stage_review_export';
    skill_authoring_loop_adopted: false;
    materializer_role: 'default_editable_pptx_materializer_and_qa_gate';
    current_pptx_writer: 'officecli_pptx_materializer';
    officecli_writer_adapter_default_enabled: true;
    required_gate_refs: string[];
    save_before_close_required: true;
    validate_required: true;
    view_issues_required: true;
    view_text_required: true;
    true_render_proof_required_after_officecli_gate: true;
    true_render_proof_substitute_allowed: false;
    deterministic_cjk_font_family: 'Noto Sans CJK SC';
    default_visual_route_changed: false;
    default_executor_changed: false;
  };
  true_render_proof: {
    required: true;
    source_surface_kind: 'native_pptx';
    renderer_kind: 'libreoffice_headless';
    renderer_pipeline: 'libreoffice_headless_pdf_png_v1';
    runtime: 'libreoffice_headless';
    cross_platform_render_required: true;
    synthetic_preview_allowed: false;
    fail_closed_when_missing: true;
  };
}

export interface PptNativePptBundleArtifact extends PptRuntimeArtifactBase {
  route: 'author_pptx_native';
  status: 'completed';
  native_ppt_bundle: {
    source_visual_route: 'author_pptx_native';
    builder?: {
      kind?: string;
    };
    engine_capabilities?: PptNativePptEngineContract['engine_capabilities'];
    officecli_materializer_policy?: NonNullable<PptNativePptEngineContract['officecli_materializer_policy']>;
    render_proof?: {
      source_surface_kind?: 'native_pptx';
      renderer_kind?: 'libreoffice_headless';
      renderer_pipeline?: 'libreoffice_headless_pdf_png_v1';
      runtime?: 'libreoffice_headless';
      cross_platform_render_required?: true;
      synthetic_preview?: false;
      required?: true;
      preview_screenshots?: string[];
    };
    engine_contract: PptNativePptEngineContract;
    engine_contract_file: string;
    shape_manifest_schema_version: number;
    editable_artifact: true;
    pptx_file: string;
    pdf_file: string;
    shape_manifest_file: string;
    repair_log_file: string;
    page_count: number;
    preview_screenshots: string[];
    slides: PptNativePptSlideManifest[];
  };
  native_ppt_repair_log: PptNativePptRepairLog;
  artifact_refs: string[];
  review_state_patch: PptRuntimeReviewStatePatch;
}

export interface PptNativePptRepairArtifact extends Omit<PptNativePptBundleArtifact, 'route' | 'native_ppt_bundle'> {
  route: 'repair_pptx_native';
  native_ppt_bundle: PptNativePptBundleArtifact['native_ppt_bundle'] & {
    source_visual_route: 'repair_pptx_native';
  };
}

export type PptRuntimeStageContract = PptRuntimeContract['stage_sequence']['stages'][number];

export interface PptRuntimeRouteEnvelope<TRoute extends PptRuntimeRoute> {
  overlay: PptRuntimeContract['overlay'];
  route: TRoute;
  topic_id: string;
  deliverable_id: string;
  contract: PptRuntimeContract;
  stage_contract: PptRuntimeStageContract | null;
  execution_model: PptRuntimeExecutionModel;
}

export type PptRuntimeRouteOutput<
  TRoute extends PptRuntimeRoute,
  TPayload extends { route: TRoute },
> = PptRuntimeRouteEnvelope<TRoute> & TPayload;

export type PptFixHtmlArtifact = Omit<PptRenderArtifact, 'route'> & {
  route: 'fix_html';
};

export type PptRuntimeRouteResult =
  | PptRuntimeRouteOutput<'storyline', PptStorylineArtifact>
  | PptRuntimeRouteOutput<'detailed_outline', PptDetailedOutlineArtifact>
  | PptRuntimeRouteOutput<'slide_blueprint', PptBlueprintArtifact>
  | PptRuntimeRouteOutput<'visual_direction', PptVisualDirectionArtifact>
  | PptRuntimeRouteOutput<'render_html', PptRenderArtifact>
  | PptRuntimeRouteOutput<'author_pptx_native', PptNativePptBundleArtifact>
  | PptRuntimeRouteOutput<'fix_html', PptFixHtmlArtifact>
  | PptRuntimeRouteOutput<'repair_pptx_native', PptNativePptRepairArtifact>
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
  adapter?: string;
}
