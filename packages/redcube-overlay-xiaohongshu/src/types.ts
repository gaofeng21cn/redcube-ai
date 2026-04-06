import type {
  OverlayCatalogEntry,
  OverlayProfileDefinition,
} from '@redcube/overlay-core';

export type XiaohongshuOverlayId = 'xiaohongshu';
export type XiaohongshuProfileId = 'standard_note';
export type XiaohongshuDeliverableKind = 'xiaohongshu_note';
export type XiaohongshuStageId =
  | 'research'
  | 'storyline'
  | 'single_note_plan'
  | 'visual_direction'
  | 'render_html'
  | 'visual_director_review'
  | 'screenshot_review'
  | 'publish_copy'
  | 'export_bundle';
export type XiaohongshuPromptFile =
  | 'research.md'
  | 'storyline.md'
  | 'single_note_plan.md'
  | 'visual_direction.md'
  | 'render_html.md'
  | 'director_review.md'
  | 'screenshot_review.md'
  | 'publish_copy.md'
  | 'export_bundle.md';
export type XiaohongshuOutputArtifactFile =
  | 'research.json'
  | 'storyline.json'
  | 'single_note_plan.json'
  | 'visual_direction.json'
  | 'render_bundle.json'
  | 'director_review.json'
  | 'quality_gate.json'
  | 'publish_copy.json'
  | 'publish_bundle.json';
export type XiaohongshuReviewCheck =
  | 'overflow_free'
  | 'occlusion_free'
  | 'visual_density_ok'
  | 'cover_density_ok'
  | 'director_intent_landed'
  | 'anti_template_ok'
  | 'platform_copy_complete'
  | 'cta_clear'
  | 'baseline_comparison_passed';
export type XiaohongshuForbiddenTemplateRoute =
  | 'renderSlide'
  | 'layoutByType'
  | 'cardsGrid'
  | 'pageType';
export type XiaohongshuRecipeId =
  | 'xhs.hero_note'
  | 'xhs.split_contrast'
  | 'xhs.staggered_steps'
  | 'xhs.track_rail'
  | 'xhs.evidence_bands'
  | 'xhs.checklist_close'
  | 'xhs.annotated_cards';
export type XiaohongshuDisplaySurfaceId =
  | 'source_index'
  | 'storyline'
  | 'single_note_plan'
  | 'visual_direction'
  | 'render_html'
  | 'visual_director_review'
  | 'screenshot_review'
  | 'publish_copy'
  | 'export_bundle'
  | 'series_publish_cadence'
  | 'path_mapping'
  | 'delivery_overview';
export type XiaohongshuDisplaySurfaceKind =
  | 'research_surface'
  | 'stage_artifact'
  | 'render_output'
  | 'review_output'
  | 'publish_copy'
  | 'delivery_bundle'
  | 'series_surface';
export type XiaohongshuDisplaySurfaceCondition = 'always' | 'approved_for_export' | 'series_mode';
export type XiaohongshuSurfaceArtifactPath =
  | 'contracts/stage-sequence.json'
  | 'contracts/stage-requirements.json'
  | 'contracts/prompt-pack.json'
  | 'contracts/review-surface.json'
  | 'contracts/layout-rules.json'
  | 'contracts/baseline-policy.json'
  | 'contracts/export-bundle.json'
  | 'contracts/hydrated-deliverable.json'
  | 'views/display-registry.json';

export interface XiaohongshuTopicRecordInput {
  topicId: string;
  title: string;
}

export interface XiaohongshuTopicRecord {
  topic_id: string;
  title: string;
  overlay: XiaohongshuOverlayId;
  deliverable_kind: XiaohongshuDeliverableKind;
  status: 'draft';
  routes: XiaohongshuStageId[];
}

export interface XiaohongshuStageDefinition {
  stage_id: XiaohongshuStageId;
  prompt_file: XiaohongshuPromptFile;
  output_artifact: XiaohongshuOutputArtifactFile;
  requires_stages: XiaohongshuStageId[];
}

export interface XiaohongshuStageHardStop {
  stage_id: XiaohongshuStageId;
  rerun_from_stage: XiaohongshuStageId;
  requires_stage_outputs?: XiaohongshuStageId[];
  requires_review?: XiaohongshuStageId[];
}

export interface XiaohongshuStageSequence {
  flow_id: 'xiaohongshu_official_flow';
  stages: XiaohongshuStageDefinition[];
  hard_stops: XiaohongshuStageHardStop[];
}

export interface XiaohongshuStageRequirement {
  requires_artifacts: XiaohongshuStageId[];
  requires_review_pass?: true;
}

export interface XiaohongshuStageRequirements {
  research: XiaohongshuStageRequirement;
  storyline: XiaohongshuStageRequirement;
  single_note_plan: XiaohongshuStageRequirement;
  visual_direction: XiaohongshuStageRequirement;
  render_html: XiaohongshuStageRequirement;
  visual_director_review: XiaohongshuStageRequirement;
  screenshot_review: XiaohongshuStageRequirement;
  publish_copy: XiaohongshuStageRequirement;
  export_bundle: XiaohongshuStageRequirement;
}

export interface XiaohongshuReviewSurface {
  required_checks: XiaohongshuReviewCheck[];
  artifact_stage: 'screenshot_review';
  artifact_file: 'quality_gate.json';
  conditional_checks: {
    optimize_existing: XiaohongshuReviewCheck[];
  };
  rerun_from_stage: {
    overflow_free: XiaohongshuStageId;
    occlusion_free: XiaohongshuStageId;
    visual_density_ok: XiaohongshuStageId;
    cover_density_ok: XiaohongshuStageId;
    director_intent_landed: XiaohongshuStageId;
    anti_template_ok: XiaohongshuStageId;
    platform_copy_complete: XiaohongshuStageId;
    cta_clear: XiaohongshuStageId;
    baseline_comparison_passed: XiaohongshuStageId;
  };
}

export interface XiaohongshuLayoutRules {
  density_mode: 'mobile_note_stack';
  canvas: {
    ratio: '3:4';
    width: 448;
    height: 597;
    scrollbars_forbidden: true;
  };
  max_primary_points_per_slide: 4;
  slides_data_rule: 'independent_content';
  forbidden_template_routes: XiaohongshuForbiddenTemplateRoute[];
  forbid_external_images: true;
  forbid_left_right_compare: true;
  require_cover_hook: true;
  require_public_source_label: true;
}

export interface XiaohongshuBaselinePolicy {
  modes: {
    draft_new: {
      baseline_required: false;
    };
    optimize_existing: {
      baseline_required: true;
      approved_baseline_only: true;
      required_review: 'baseline_comparison_passed';
    };
  };
}

export interface XiaohongshuPromptPack {
  pack_id: 'xiaohongshu_mainline_v1';
  root: 'prompts/xiaohongshu';
  routes: {
    research: 'prompts/xiaohongshu/research.md';
    storyline: 'prompts/xiaohongshu/storyline.md';
    single_note_plan: 'prompts/xiaohongshu/single_note_plan.md';
    visual_direction: 'prompts/xiaohongshu/visual_direction.md';
    render_html: 'prompts/xiaohongshu/render_html.md';
    visual_director_review: 'prompts/xiaohongshu/director_review.md';
    screenshot_review: 'prompts/xiaohongshu/screenshot_review.md';
    publish_copy: 'prompts/xiaohongshu/publish_copy.md';
    export_bundle: 'prompts/xiaohongshu/export_bundle.md';
  };
  stages: {
    research: { file: 'research.md' };
    storyline: { file: 'storyline.md' };
    single_note_plan: { file: 'single_note_plan.md' };
    visual_direction: { file: 'visual_direction.md' };
    render_html: { file: 'render_html.md' };
    visual_director_review: { file: 'director_review.md' };
    screenshot_review: { file: 'screenshot_review.md' };
    publish_copy: { file: 'publish_copy.md' };
    export_bundle: { file: 'export_bundle.md' };
  };
  render_contract: {
    render_strategy: 'prompt_director_first';
    shell_file: 'render_shell.html';
    recipe_registry: {
      cover_note: 'xhs.hero_note';
      myth_compare: 'xhs.split_contrast';
      sequence_stack: 'xhs.staggered_steps';
      process_track: 'xhs.track_rail';
      evidence_strip: 'xhs.evidence_bands';
      action_checklist: 'xhs.checklist_close';
      default: 'xhs.annotated_cards';
    };
  };
}

export interface XiaohongshuExportBundle {
  bundle_id: 'xiaohongshu_standard_bundle';
  include_cover_assets: true;
  include_caption: true;
  include_publish_manifest: true;
  review_required_before_export: true;
}

export interface XiaohongshuDisplaySurface {
  id: XiaohongshuDisplaySurfaceId;
  kind: XiaohongshuDisplaySurfaceKind;
  required_when: XiaohongshuDisplaySurfaceCondition;
}

export interface XiaohongshuDisplayRegistry {
  surfaces: XiaohongshuDisplaySurface[];
}

export interface XiaohongshuHydrateContractRequest {
  topicId: string;
  deliverableId: string;
  title: string;
  goal: string;
  profileId?: XiaohongshuProfileId;
}

export interface XiaohongshuHydratedContract {
  schema_version: 1;
  overlay: XiaohongshuOverlayId;
  profile_id: XiaohongshuProfileId;
  deliverable_kind: XiaohongshuDeliverableKind;
  topic_id: string;
  deliverable_id: string;
  title: string;
  goal: string;
  stage_sequence: XiaohongshuStageSequence;
  stage_requirements: XiaohongshuStageRequirements;
  review_surface: XiaohongshuReviewSurface;
  layout_rules: XiaohongshuLayoutRules;
  baseline_policy: XiaohongshuBaselinePolicy;
  prompt_pack: XiaohongshuPromptPack;
  export_bundle: XiaohongshuExportBundle;
  display_registry: XiaohongshuDisplayRegistry;
}

export interface XiaohongshuDeliverableRecordInput {
  topicId: string;
  deliverableId: string;
  title: string;
  goal: string;
  profileId?: XiaohongshuProfileId;
  hydratedContract?: XiaohongshuHydratedContract;
}

export interface XiaohongshuDeliverableRecord {
  topic_id: string;
  deliverable_id: string;
  overlay: XiaohongshuOverlayId;
  kind: XiaohongshuDeliverableKind;
  title: string;
  status: 'draft';
  deliverable_kind: XiaohongshuDeliverableKind;
  profile_id: XiaohongshuProfileId;
  goal: string;
  hydrated_contract_ref: 'contracts/hydrated-deliverable.json';
  routes: XiaohongshuStageId[];
}

export interface XiaohongshuStorylineGateReport {
  status: 'block' | 'pass';
  blockers: Array<'storyline_empty'>;
  advisories: string[];
  metrics: {
    char_count: number;
  };
  next_action: 'rerun_storyline' | 'continue';
}

export interface XiaohongshuStorylineGateInput {
  storylineText?: string;
}

export interface XiaohongshuSurfaceBundleRequest {
  contract: XiaohongshuHydratedContract;
}

export type XiaohongshuSurfaceArtifactContent =
  | XiaohongshuStageSequence
  | XiaohongshuStageRequirements
  | XiaohongshuPromptPack
  | XiaohongshuReviewSurface
  | XiaohongshuLayoutRules
  | XiaohongshuBaselinePolicy
  | XiaohongshuExportBundle
  | XiaohongshuHydratedContract
  | XiaohongshuDisplayRegistry;

export interface XiaohongshuSurfaceArtifact {
  relativePath: XiaohongshuSurfaceArtifactPath;
  content: XiaohongshuSurfaceArtifactContent;
}

export interface XiaohongshuOverlayProfileDefinition extends OverlayProfileDefinition {
  profile_id: XiaohongshuProfileId;
}

export interface XiaohongshuOverlayCatalogEntry extends OverlayCatalogEntry {
  overlay_id: XiaohongshuOverlayId;
  default_profile_id: XiaohongshuProfileId;
  profiles: XiaohongshuProfileId[];
  route_sequence: XiaohongshuStageId[];
  deliverable_kind: XiaohongshuDeliverableKind;
  prompt_pack_id: 'xiaohongshu_mainline_v1';
  packages: {
    overlay: '@redcube/overlay-xiaohongshu';
    runtime_family: '@redcube/runtime-family-xiaohongshu';
    pack: '@redcube/pack-xiaohongshu';
  };
}

export interface XiaohongshuOverlayDefinition {
  overlayId: XiaohongshuOverlayId;
  defaultProfileId: XiaohongshuProfileId;
  profiles: {
    standard_note: XiaohongshuOverlayProfileDefinition;
  };
  buildDeliverableRecord: (input: XiaohongshuDeliverableRecordInput) => XiaohongshuDeliverableRecord;
  buildSurfaceBundle: (request: XiaohongshuSurfaceBundleRequest) => XiaohongshuSurfaceArtifact[];
  listSurfaceArtifactPaths: () => XiaohongshuSurfaceArtifactPath[];
  validateSurfaceArtifact: (
    relativePath: XiaohongshuSurfaceArtifactPath,
    content: XiaohongshuSurfaceArtifactContent | null | undefined,
  ) => boolean;
  hydrateDeliverableContract: (request: XiaohongshuHydrateContractRequest) => XiaohongshuHydratedContract;
  describeOverlay: () => XiaohongshuOverlayCatalogEntry;
}
