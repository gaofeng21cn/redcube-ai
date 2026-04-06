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
    major_text: 'host_agent';
    recipe_selection: 'host_agent';
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
    page_core_content: 'host_agent';
    speaker_notes: 'host_agent';
    transition_sentence: 'host_agent';
    visual_presentation: 'host_agent';
    recipe_selection: 'host_agent';
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
    visual_manifest: 'host_agent';
    rhythm_curve: 'host_agent';
    peak_pages: 'host_agent';
    page_family_ceiling: 'host_agent';
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
    recipe_selection: 'host_agent';
    final_markup: 'host_agent';
  };
  markup_contract_source: 'prompt_pack_artifact';
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
