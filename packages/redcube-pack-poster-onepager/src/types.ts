export type PosterProfileId = 'knowledge_poster';
export type PosterStageRoute = 'poster_blueprint' | 'visual_direction' | 'render_html';
export type PosterPromptRoute = 'poster_blueprint' | 'visual_direction';
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

export interface PosterDeliverablePaths {
  deliverableId: string;
  deliverableDir: string;
  artifactsDir: string;
  viewsDir: string;
  reportsDir: string;
}

export interface PosterHydratedContract {
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

export interface PosterBlueprintSeedPanel {
  panel_id: string;
  region: PosterLayoutFamily;
  label: string;
  text: string;
  support_points?: string[];
}

export interface PosterBlueprintSeed {
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

export interface PosterVisualDirectionSeed {
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

export interface PosterRenderContract {
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

export interface PosterBlueprintDependencies {
  safeText: (value: unknown, fallback?: string) => string;
  safeArray: <T>(value: unknown) => T[];
  promptSeed: (contract: PosterHydratedContract, route: PosterPromptRoute, vars?: Record<string, string>) => PosterBlueprintSeed | PosterVisualDirectionSeed | null;
  attachCommon: (route: PosterStageRoute, contract: PosterHydratedContract) => Record<string, unknown>;
  CANVAS: PosterCanvasContract;
  BANNED_RENDER_TOKENS: string[];
  sourceLabels: (contract: PosterHydratedContract) => string[];
}

export interface PosterVisualDirectionDependencies {
  safeText: (value: unknown, fallback?: string) => string;
  safeArray: <T>(value: unknown) => T[];
  promptSeed: (contract: PosterHydratedContract, route: PosterPromptRoute, vars?: Record<string, string>) => PosterVisualDirectionSeed | null;
  attachCommon: (route: PosterStageRoute, contract: PosterHydratedContract) => Record<string, unknown>;
}

export interface PosterRenderArtifactDependencies {
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

export interface PosterBuildRenderArtifactInput {
  workspaceRoot: string;
  topicId: string;
  deliverableId: string;
  contract: PosterHydratedContract;
  deliverablePaths: PosterDeliverablePaths;
}

export interface CompilePosterRenderSlidesInput {
  slides: PosterBlueprintSlide[];
  visualDirection: PosterVisualDirectionArtifact['visual_direction'];
  canvas: PosterCanvasContract;
  recipeMarkupRegistry: Record<string, string>;
  recipeMarkupArtifacts: Record<string, string>;
}
