export type XhsRunMode = 'single' | 'series';
export type XhsPromptRoute = 'single_note_plan' | 'visual_direction';
export type XhsStageRoute =
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

export interface PackDeliverablePaths {
  deliverableId: string;
  deliverableDir: string;
  artifactsDir: string;
  viewsDir: string;
  reportsDir: string;
}

export interface XhsSourceMaterial {
  material_id?: string;
  excerpt?: string;
  content_text?: string;
}

export interface XhsPromptPackContract {
  pack_id?: string;
  render_contract?: XhsRenderContract;
}

export interface XhsHydratedContract {
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

export interface XhsPlanningSeedSlide {
  slide_id: string;
  title: string;
  layout_family: XhsLayoutFamily;
  page_goal: string;
  progression_role?: XhsProgressionRole;
  source_language?: string;
  transition?: string;
}

export interface XhsPlanningSeed {
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

export interface XhsVisualDirectionSeed {
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
}

export interface XhsVisualDirectionArtifact {
  route: 'visual_direction';
  overlay: string;
  profile_id: string;
  produced_at: string;
  mode: XhsMigrationMode;
  visual_direction: XhsVisualDirection;
}

export interface XhsRenderContract {
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
  page_goal: string;
  page_core_content: string[];
  evidence_and_sources: XhsSourceReference[];
  director_contract: XhsRenderSlideDirectorContract;
  speaker_seconds: number;
  total_slides: number;
  content: string;
}

export interface XhsRenderPlanSlideSummary {
  slide_id: string;
  title: string;
  layout_family: XhsLayoutFamily;
  recipe_id: XhsRecipeId;
  peak_page: boolean;
  director_role: XhsProgressionRole;
}

export interface XhsRenderPlan {
  render_strategy: string;
  shell_file: string;
  pack_id: string;
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

export interface CompileXhsRenderSlidesInput {
  slides: XhsPlanSlide[];
  visualDirection: XhsVisualDirection;
  renderContract: XhsRenderContract;
  canvas: RenderCanvas;
}

export interface XhsPlanningDependencies {
  safeText(value: unknown, fallback?: string): string;
  safeArray<T>(value: T[] | null | undefined): T[];
  promptSeed(contract: XhsHydratedContract, route: XhsPromptRoute, vars?: { title?: string }): XhsPlanningSeed | XhsVisualDirectionSeed | null;
  sourceLabels(contract: XhsHydratedContract): string[];
  sourceMaterials(contract: XhsHydratedContract): XhsSourceMaterial[];
  inferMemoryHook(contract: XhsHydratedContract): string;
  inferAudience(contract: XhsHydratedContract): string;
  inferWhyNow(contract: XhsHydratedContract): string;
  inferTension(contract: XhsHydratedContract): string;
}

export interface XhsArtifactBase {
  route: XhsStageRoute;
  overlay: string;
  profile_id: string;
  produced_at: string;
}

export interface XhsVisualDirectionDependencies {
  attachCommon(route: XhsStageRoute, contract: XhsHydratedContract): XhsArtifactBase;
  safeText(value: unknown, fallback?: string): string;
  safeArray<T>(value: T[] | null | undefined): T[];
  promptSeed(contract: XhsHydratedContract, route: XhsPromptRoute, vars?: { title?: string }): XhsPlanningSeed | XhsVisualDirectionSeed | null;
  readStageArtifact<T>(contract: XhsHydratedContract, deliverablePaths: PackDeliverablePaths, stageId: XhsStageRoute): T | null;
  sourceConfidence(contract: XhsHydratedContract): string;
  inferMemoryHook(contract: XhsHydratedContract): string;
}

export interface XhsPathModuleLike {
  join(...paths: string[]): string;
}

export interface XhsRenderArtifactDependencies {
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
