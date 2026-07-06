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
  | 'author_image_pages'
  | 'repair_image_pages'
  | 'render_html'
  | 'fix_html'
  | 'visual_director_review'
  | 'screenshot_review'
  | 'publish_copy'
  | 'export_bundle';
export type XiaohongshuPromptFile =
  | 'research.md'
  | 'storyline.md'
  | 'single_note_plan.md'
  | 'visual_direction.md'
  | 'author_image_pages.md'
  | 'repair_image_pages.md'
  | 'render_html.md'
  | 'fix_html.md'
  | 'director_review.md'
  | 'screenshot_review.md'
  | 'publish_copy.md'
  | 'export_bundle.md';
export type XiaohongshuOutputArtifactFile =
  | 'research.json'
  | 'storyline.json'
  | 'single_note_plan.json'
  | 'visual_direction.json'
  | 'image_pages_bundle.json'
  | 'image_pages_repair_bundle.json'
  | 'render_bundle.json'
  | 'fix_bundle.json'
  | 'director_review.json'
  | 'quality_gate.json'
  | 'publish_copy.json'
  | 'publish_bundle.json';
export type XiaohongshuReviewCheck =
  | 'overflow_free'
  | 'occlusion_free'
  | 'visual_density_ok'
  | 'block_content_fit_ok'
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
type XiaohongshuRecipeId =
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
  | 'author_image_pages'
  | 'repair_image_pages'
  | 'render_html'
  | 'fix_html'
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
export type XiaohongshuDisplaySurfaceCondition = 'always' | 'approved_for_export' | 'series_mode' | 'review_rerun_required' | 'explicit_html_route';
export type XiaohongshuSurfaceArtifactPath =
  | 'contracts/stage-sequence.json'
  | 'contracts/stage-requirements.json'
  | 'contracts/prompt-pack.json'
  | 'contracts/review-surface.json'
  | 'contracts/layout-rules.json'
  | 'contracts/baseline-policy.json'
  | 'contracts/export-bundle.json'
  | 'contracts/delivery-contract.json'
  | 'contracts/governance-surface.json'
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
  alternate_stages?: XiaohongshuStageDefinition[];
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
  author_image_pages: XiaohongshuStageRequirement;
  repair_image_pages: XiaohongshuStageRequirement;
  render_html: XiaohongshuStageRequirement;
  fix_html: XiaohongshuStageRequirement;
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
    block_content_fit_ok: XiaohongshuStageId;
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
    width: 1086;
    height: 1448;
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
    author_image_pages: 'prompts/xiaohongshu/author_image_pages.md';
    repair_image_pages: 'prompts/xiaohongshu/repair_image_pages.md';
    render_html: 'prompts/xiaohongshu/render_html.md';
    fix_html: 'prompts/xiaohongshu/fix_html.md';
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
    author_image_pages: { file: 'author_image_pages.md' };
    repair_image_pages: { file: 'repair_image_pages.md' };
    render_html: { file: 'render_html.md' };
    fix_html: { file: 'fix_html.md' };
    visual_director_review: { file: 'director_review.md' };
    screenshot_review: { file: 'screenshot_review.md' };
    publish_copy: { file: 'publish_copy.md' };
    export_bundle: { file: 'export_bundle.md' };
  };
  render_contract: {
    render_strategy: 'image_first_page_authoring';
    default_visual_route: 'author_image_pages';
    image_generation: {
      default_model: 'gpt-image-2';
      size: '1086x1448';
      output_mode: 'full_page_png';
      canvas: {
        ratio: '3:4';
        width: 1086;
        height: 1448;
        scrollbars_forbidden: true;
      };
      page_image_artifacts_required: true;
      default_style_profile: string;
      built_in_style_reference_dir: string;
      style_reference_dir_input: 'delivery_request.style_reference_dir';
      style_reference_override_semantics: string;
      review_input_surface: 'image_page_png_manifest';
    };
    selectable_explicit_routes: ReadonlyArray<'render_html' | 'fix_html'>;
    explicit_route_policy: 'html_routes_require_operator_selection';
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

export interface XiaohongshuLifecycleModel {
  macro_lifecycle: Array<
    'source_readiness'
    | 'story_architecture'
    | 'visual_authorship'
    | 'delivery_packaging'
  >;
  route_to_stage: Partial<Record<Exclude<XiaohongshuStageId, 'visual_director_review' | 'screenshot_review'>, string>>;
  review_overlay_routes: {
    visual_director_review: 'visual_director_review';
    screenshot_review: 'screenshot_review';
  };
  research_ownership: {
    semantic_role: 'shared_source_readiness_augmentation';
    trigger_conditions: string[];
  };
}

export interface XiaohongshuSourceTruthContract {
  authoritative_surface: 'shared_source_truth';
  authoritative_gate: 'topics/<topic>/canonical/source-readiness-pack.json';
  authoritative_gate_inputs: ReadonlyArray<'source_audit' | 'source_readiness_pack'>;
  authoritative_artifacts: ReadonlyArray<'source_index' | 'extracted_materials' | 'source_audit' | 'source_brief' | 'source_readiness_pack'>;
  readiness_target: 'planning_ready';
  pass_condition: 'source_audit.status=pass && source_readiness_pack.readiness.planning_ready=true';
  route_gate_rule: 'authoritative_fail_closed_in_audit_and_runtime_watch';
  hydration_model: {
    hydrated_contract_surface: 'contracts/hydrated-deliverable.json';
    runtime_injection_surface: 'shared_source_truth';
    static_contract_written_at_create_deliverable: true;
  };
  readable_shared_source_truth_fields: {
    source_index: ReadonlyArray<string>;
    extracted_materials: ReadonlyArray<string>;
    source_brief: ReadonlyArray<string>;
  };
  consumption_summary_fields: ReadonlyArray<string>;
  route_to_consumption_role: {
    research: 'source_readiness';
    storyline: 'story_architecture';
    single_note_plan: 'story_architecture';
    visual_direction: 'visual_authorship';
  };
  required_hydrated_export_surface: 'export_bundle';
}

export interface XiaohongshuDeliveryContract {
  authoritative_projection_surface: 'getPublicationProjection';
  authoritative_review_surface: 'getReviewState';
  required_export_route: 'export_bundle';
  required_export_bundle_id: 'xiaohongshu_standard_bundle';
  export_artifact_field: 'export_bundle';
  delivery_state_field: 'export_bundle.delivery_state';
  projection_model: 'human_publication';
  human_gate: {
    required: true;
    mutation_surfaces: ReadonlyArray<'approve_publish' | 'promote_publish'>;
  };
  projection_states: {
    ready_for_export: 'approval_pending';
    output_ready: 'approval_pending';
    approved: 'approved_pending_publish';
    published: 'published';
  };
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
  lifecycle_model: XiaohongshuLifecycleModel;
  source_truth_contract: XiaohongshuSourceTruthContract;
  delivery_contract: XiaohongshuDeliveryContract;
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
  | XiaohongshuDeliveryContract
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
