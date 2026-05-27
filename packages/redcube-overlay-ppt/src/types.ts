import type {
  OverlayCatalogEntry,
  OverlayProfileDefinition,
} from '@redcube/overlay-core';

export type PptDeckOverlayId = 'ppt_deck';
export type PptDeckProfileId =
  | 'lecture_student'
  | 'lecture_peer'
  | 'executive_briefing'
  | 'defense_deck';
export type PptDeckDeliverableKind = 'ppt_deck';
export type PptDeckStageId =
  | 'storyline'
  | 'detailed_outline'
  | 'slide_blueprint'
  | 'visual_direction'
  | 'author_image_pages'
  | 'render_html'
  | 'author_pptx_native'
  | 'repair_image_pages'
  | 'fix_html'
  | 'repair_pptx_native'
  | 'visual_director_review'
  | 'screenshot_review'
  | 'export_pptx';
export type PptDeckPromptFile =
  | 'storyline.md'
  | 'detailed_outline.md'
  | 'slide_blueprint.md'
  | 'visual_direction.md'
  | 'author_image_pages.md'
  | 'render_html.md'
  | 'author_pptx_native.md'
  | 'repair_image_pages.md'
  | 'fix_html.md'
  | 'repair_pptx_native.md'
  | 'director_review.md'
  | 'screenshot_review.md'
  | 'export_pptx.md';
export type PptDeckOutputArtifactFile =
  | 'storyline.json'
  | 'detailed_outline.json'
  | 'slide_blueprint.json'
  | 'visual_direction.json'
  | 'image_pages_bundle.json'
  | 'render_bundle.json'
  | 'native_ppt_bundle.json'
  | 'image_pages_repair_bundle.json'
  | 'fix_bundle.json'
  | 'native_ppt_repair_bundle.json'
  | 'director_review.json'
  | 'quality_gate.json'
  | 'publish_bundle.json';
export type PptDeckReviewCheck =
  | 'overflow_free'
  | 'occlusion_free'
  | 'visual_density_ok'
  | 'speaker_fit_ok'
  | 'edge_clearance_ok'
  | 'block_content_fit_ok'
  | 'title_typography_ok'
  | 'external_audience_language_ok'
  | 'title_safe_zone_clear'
  | 'table_legibility_ok'
  | 'layout_density_ok'
  | 'director_intent_landed'
  | 'anti_template_ok'
  | 'baseline_comparison_passed'
  | 'term_explained_on_first_use'
  | 'teaching_progression_clear'
  | 'novelty_position_clear'
  | 'method_boundary_explicit'
  | 'decision_implication_clear'
  | 'conclusion_up_front'
  | 'claim_evidence_traceable'
  | 'backup_qa_ready';
export type PptDeckDensityMode =
  | 'balanced_deck'
  | 'teaching_spread'
  | 'peer_dense'
  | 'executive_scan'
  | 'defense_trace';
export type PptDeckStoryboardBlocker = 'slides_empty' | 'slides_invalid';
export type PptDeckStoryboardNextAction = 'rerun_storyboard' | 'continue';
export type PptDeckSurfaceArtifactPath =
  | 'contracts/stage-sequence.json'
  | 'contracts/stage-requirements.json'
  | 'contracts/lifecycle-stage-contract.json'
  | 'contracts/prompt-pack.json'
  | 'contracts/review-surface.json'
  | 'contracts/layout-rules.json'
  | 'contracts/baseline-policy.json'
  | 'contracts/export-bundle.json'
  | 'contracts/delivery-contract.json'
  | 'contracts/governance-surface.json'
  | 'contracts/hydrated-deliverable.json'
  | 'views/display-registry.json';
export type PptDeckBundleId =
  | 'ppt_deck_bundle'
  | 'lecture_student_bundle'
  | 'lecture_peer_bundle'
  | 'executive_briefing_bundle'
  | 'defense_deck_bundle';

export interface PptDeckStageDefinition {
  stage_id: PptDeckStageId;
  prompt_file: PptDeckPromptFile;
  output_artifact: PptDeckOutputArtifactFile;
  requires_stages: PptDeckStageId[];
}

export interface PptDeckHardStop {
  stage_id: PptDeckStageId;
  requires_stage_outputs?: PptDeckStageId[];
  requires_review?: PptDeckStageId[];
  rerun_from_stage: PptDeckStageId;
}

export interface PptDeckStageSequence {
  flow_id: 'ppt_deck_standard_flow';
  stages: PptDeckStageDefinition[];
  alternate_stages?: PptDeckStageDefinition[];
  hard_stops: PptDeckHardStop[];
}

export interface PptDeckStageRequirement {
  requires_artifacts: PptDeckStageId[];
  requires_review_pass?: true;
}

export interface PptDeckStageRequirements {
  storyline: PptDeckStageRequirement;
  detailed_outline: PptDeckStageRequirement;
  slide_blueprint: PptDeckStageRequirement;
  visual_direction: PptDeckStageRequirement;
  author_image_pages: PptDeckStageRequirement;
  render_html: PptDeckStageRequirement;
  author_pptx_native: PptDeckStageRequirement;
  repair_image_pages: PptDeckStageRequirement;
  fix_html: PptDeckStageRequirement;
  repair_pptx_native: PptDeckStageRequirement;
  visual_director_review: PptDeckStageRequirement;
  screenshot_review: PptDeckStageRequirement;
  export_pptx: PptDeckStageRequirement;
}

export interface PptDeckReviewConditionalChecks {
  optimize_existing: 'baseline_comparison_passed'[];
}

export interface PptDeckReviewRerunMap {
  overflow_free: 'repair_image_pages';
  occlusion_free: 'repair_image_pages';
  visual_density_ok: 'visual_direction';
  speaker_fit_ok: 'slide_blueprint';
  edge_clearance_ok: 'repair_image_pages';
  block_content_fit_ok: 'repair_image_pages';
  title_typography_ok: 'repair_image_pages';
  external_audience_language_ok: 'repair_image_pages';
  title_safe_zone_clear: 'repair_image_pages';
  table_legibility_ok: 'repair_image_pages';
  layout_density_ok: 'repair_image_pages';
  director_intent_landed: 'visual_director_review';
  anti_template_ok: 'visual_director_review';
  baseline_comparison_passed: 'visual_direction';
  term_explained_on_first_use?: 'storyline';
  teaching_progression_clear?: 'detailed_outline';
  novelty_position_clear?: 'storyline';
  method_boundary_explicit?: 'detailed_outline';
  decision_implication_clear?: 'storyline';
  conclusion_up_front?: 'storyline';
  claim_evidence_traceable?: 'detailed_outline';
  backup_qa_ready?: 'slide_blueprint';
}

export interface PptDeckReviewSurface {
  required_checks: PptDeckReviewCheck[];
  artifact_stage: 'screenshot_review';
  artifact_file: 'quality_gate.json';
  conditional_checks: PptDeckReviewConditionalChecks;
  rerun_from_stage: PptDeckReviewRerunMap;
}

export interface PptDeckCanvasRules {
  ratio: '16:9';
  width: 1152;
  height: 648;
  scrollbars_forbidden: true;
}

export interface PptDeckEvidenceSurfaceRules {
  require_public_source_label: true;
  forbidden_internal_labels: string[];
  separate_fact_from_interpretation: true;
}

export interface PptDeckLayoutRules {
  density_mode: PptDeckDensityMode;
  max_primary_points_per_slide: number;
  canvas: PptDeckCanvasRules;
  slides_data_rule: 'independent_content';
  forbidden_template_routes: string[];
  structured_families_require_anchor: Array<
    'central_axis'
    | 'judgement_ladder'
    | 'timeline_band'
    | 'multi_zone_compare'
    | 'ring_cross'
  >;
  evidence_surface_rules: PptDeckEvidenceSurfaceRules;
}

export interface PptDeckDraftBaselineMode {
  baseline_required: false;
}

export interface PptDeckOptimizeBaselineMode {
  baseline_required: true;
  approved_baseline_only: true;
  required_review: 'baseline_comparison_passed';
}

export interface PptDeckBaselinePolicy {
  modes: {
    draft_new: PptDeckDraftBaselineMode;
    optimize_existing: PptDeckOptimizeBaselineMode;
  };
}

export interface PptDeckPromptRoutes {
  storyline: string;
  detailed_outline: string;
  slide_blueprint: string;
  visual_direction: string;
  author_image_pages: string;
  render_html: string;
  author_pptx_native: string;
  repair_image_pages: string;
  fix_html: string;
  repair_pptx_native: string;
  visual_director_review: string;
  screenshot_review: string;
  export_pptx: string;
}

export interface PptDeckPromptStageFile {
  file: PptDeckPromptFile;
}

export interface PptDeckPromptStages {
  storyline: PptDeckPromptStageFile;
  detailed_outline: PptDeckPromptStageFile;
  slide_blueprint: PptDeckPromptStageFile;
  visual_direction: PptDeckPromptStageFile;
  author_image_pages: PptDeckPromptStageFile;
  render_html: PptDeckPromptStageFile;
  author_pptx_native: PptDeckPromptStageFile;
  repair_image_pages: PptDeckPromptStageFile;
  fix_html: PptDeckPromptStageFile;
  repair_pptx_native: PptDeckPromptStageFile;
  visual_director_review: PptDeckPromptStageFile;
  screenshot_review: PptDeckPromptStageFile;
  export_pptx: PptDeckPromptStageFile;
}

export interface PptDeckRecipeRegistry {
  cover_hero: string;
  multi_zone_compare: string;
  timeline_band: string;
  judgement_ladder: string;
  ring_cross: string;
  central_axis: string;
  summary_peak: string;
  default: string;
}

export interface PptDeckNativePptProofLane {
  lane_id: 'ppt_deck_native_ppt_authoring_v0';
  status: 'production_selectable_optional';
  default_enabled: false;
  production_selectable: true;
  runnable_routes: ReadonlyArray<'author_pptx_native' | 'repair_pptx_native'>;
  replaces_routes: ReadonlyArray<'author_image_pages' | 'repair_image_pages'>;
  legacy_html_replaces_routes: ReadonlyArray<'render_html' | 'fix_html'>;
  preserved_upstream_routes: ReadonlyArray<'storyline' | 'detailed_outline' | 'slide_blueprint' | 'visual_direction'>;
  preserved_gates: ReadonlyArray<'visual_director_review' | 'screenshot_review' | 'export_pptx'>;
  authoring_artifact: 'native_pptx_file';
  editable_artifact_required: true;
  review_input_surface: 'rendered_pptx_screenshots';
  engine_capabilities: {
    authoring_ir: 'redcube_svg_ir';
    pptx_writer: 'redcube_drawingml_writer';
    editable_pptx: true;
    strict_svg_preflight: true;
    true_render_proof_required: true;
    true_render_proof_renderer: 'libreoffice_headless';
    cross_platform_render_required: true;
    screenshot_packaging: false;
  };
  true_render_proof: {
    required: true;
    source_surface_kind: 'native_pptx';
    renderer_selection_policy: 'capability_probe_auto_bootstrap';
    user_preinstalled_libreoffice_required: false;
    renderer_kind: 'libreoffice_headless';
    renderer_pipeline: 'libreoffice_headless_pdf_png_v1';
    runtime: 'libreoffice_headless';
    supported_renderers: ReadonlyArray<{
      renderer_kind: 'libreoffice_headless';
      renderer_stack: 'libreoffice_headless_plus_poppler';
      renderer_pipeline: 'libreoffice_headless_pdf_png_v1';
      runtime: 'libreoffice_headless';
      components: ReadonlyArray<'LibreOffice headless' | 'Poppler pdftoppm'>;
      proof_chain: ReadonlyArray<'pptx_to_pdf' | 'pdf_to_png'>;
      required_capabilities: ReadonlyArray<'soffice_headless' | 'pdftoppm'>;
    }>;
    bootstrap_policy: {
      capability_probe: 'native_ppt_renderer_capability_probe';
      automatic_bootstrap_allowed: true;
      user_preinstall_required: false;
      repo_owned_installer: 'tools/native-ppt-proof/install-deps.sh';
      proof_container: 'tools/native-ppt-proof/Dockerfile';
    };
    cross_platform_render_required: true;
    synthetic_preview_allowed: false;
    html_render_substitute_allowed: false;
    officecli_validate_substitute_allowed: false;
    disallowed_substitutes: ReadonlyArray<
      'synthetic_preview'
      | 'html_render'
      | 'officecli_validate'
      | 'desktop_powerpoint_automation'
      | 'apple_script_preview'
    >;
    fail_closed_when_missing: true;
    fail_closed_blocker: {
      typed_blocker: 'missing_renderer_dependency';
      emitted_when: 'capability_probe_and_auto_bootstrap_cannot_resolve_supported_renderer';
    };
  };
  export_contract_delta: {
    source_artifact_field: 'export_bundle.source_pptx';
    shape_manifest_field: 'export_bundle.native_ppt_shape_manifest';
    repair_log_field: 'export_bundle.native_ppt_repair_log';
  };
}

export interface PptDeckHtmlAuthoringLane {
  lane_id: 'ppt_deck_html_authoring_v0';
  status: 'production_selectable_optional';
  default_enabled: false;
  production_selectable: true;
  runnable_routes: ReadonlyArray<'render_html' | 'fix_html'>;
  replaces_routes: ReadonlyArray<'author_image_pages' | 'repair_image_pages'>;
  preserved_upstream_routes: ReadonlyArray<'storyline' | 'detailed_outline' | 'slide_blueprint' | 'visual_direction'>;
  preserved_gates: ReadonlyArray<'visual_director_review' | 'screenshot_review' | 'export_pptx'>;
  explicit_selection_required: true;
}

export interface PptDeckImagePageAuthoringLane {
  lane_id: 'ppt_deck_image_page_authoring_v0';
  status: 'production_default';
  default_enabled: true;
  production_selectable: true;
  runnable_routes: ReadonlyArray<'author_image_pages' | 'repair_image_pages'>;
  replaces_routes: ReadonlyArray<'render_html' | 'fix_html'>;
  preserved_upstream_routes: ReadonlyArray<'storyline' | 'detailed_outline' | 'slide_blueprint' | 'visual_direction'>;
  preserved_gates: ReadonlyArray<'visual_director_review' | 'screenshot_review' | 'export_pptx'>;
  authoring_artifact: 'image_page_bundle';
  page_image_artifacts_required: true;
  style_reference_dir_input: 'delivery_request.style_reference_dir';
  review_input_surface: 'image_page_screenshots';
  provider_diagnostics_surface: 'image_provider_diagnostics';
  fact_governance: {
    fact_whitelist_surface: 'shared_source_truth.readable_shared_source_truth_fields';
    verification_ledger_surface: 'reports/fact-verification-ledger.json';
    rule: string;
    unresolved_claim_policy: 'block_or_rephrase_as_general_without_unverified_specifics';
    prompt_manifest_required_fields: ReadonlyArray<'fact_governance' | 'verified_asset_policy' | 'forbidden_generated_artifacts'>;
    forbidden_generated_artifacts: ReadonlyArray<string>;
  };
  verified_asset_overlay_policy: {
    asset_overlay_surface: 'verified_asset_overlay_manifest';
    allowed_overlay_assets: ReadonlyArray<string>;
    deterministic_overlay_only: true;
    overlay_manifest_required: true;
    machine_verification_required_when_applicable: true;
    composition_repair_allowed: false;
    model_generation_forbidden: ReadonlyArray<string>;
  };
  long_deck_production_contract: {
    contract_id: 'ppt_image_first_long_deck_production_v1';
    applies_when: string;
    full_long_deck_default_regression: false;
    canonical_slide_naming: 'slideNN-short-name.png';
    expected_slide_count_source: string;
    required_artifact_surfaces: ReadonlyArray<string>;
    completeness_gates: ReadonlyArray<string>;
    line_divergence_policy: {
      shared_truth_before_divergence: ReadonlyArray<string>;
      divergence_allowed_from: ReadonlyArray<'detailed_outline' | 'slide_blueprint' | 'visual_direction'>;
      html_route_must_not_consume_image_route_pngs_by_default: true;
      image_route_is_not_html_skin: true;
    };
    rejected_repair_route_policy: {
      forbidden_for_page_fixes: ReadonlyArray<string>;
      allowed_postprocess_scope: ReadonlyArray<string>;
      rejected_route_provenance_required: true;
    };
  };
  audience_language_policy: {
    visible_operator_language_allowed: false;
    forbidden_visible_fragments: ReadonlyArray<string>;
    rewrite_target: string;
  };
  layout_legibility_policy: {
    title_safe_zone_clear: {
      required: true;
      forbidden_elements: ReadonlyArray<string>;
      preferred_section_signal: string;
    };
    table_legibility: {
      min_body_font_pt: 11;
      max_blank_ratio_in_card: number;
      compact_cell_padding_required: true;
    };
    layout_density: {
      avoid_oversized_empty_cards: true;
      max_blank_ratio_in_card: number;
    };
  };
}

export interface PptDeckRenderContract {
  render_strategy: 'image_first_page_authoring';
  default_visual_route: 'author_image_pages';
  image_page_authoring_lane: PptDeckImagePageAuthoringLane;
  html_authoring_lane: PptDeckHtmlAuthoringLane;
  native_ppt_proof_lane: PptDeckNativePptProofLane;
  selectable_explicit_routes: ReadonlyArray<'render_html' | 'fix_html' | 'author_pptx_native' | 'repair_pptx_native'>;
  explicit_route_policy: 'html_and_native_routes_require_operator_selection';
  shell_file: 'render_shell.html';
  recipe_registry: PptDeckRecipeRegistry;
}

export interface PptDeckPromptPack {
  pack_id: 'ppt_deck_mainline_v1';
  root: 'prompts/ppt_deck';
  routes: PptDeckPromptRoutes;
  stages: PptDeckPromptStages;
  render_contract: PptDeckRenderContract;
}

export interface PptDeckExportBundle {
  bundle_id: PptDeckBundleId;
  include_pptx: true;
  include_pdf: true;
  include_presenter_notes: boolean;
  include_backup_slides: boolean;
  review_required_before_export: true;
}

export type PptDeckDisplaySurfaceId =
  | 'source_index'
  | 'storyline'
  | 'detailed_outline'
  | 'slide_blueprint'
  | 'visual_direction'
  | 'author_image_pages'
  | 'render_html'
  | 'author_pptx_native'
  | 'visual_director_review'
  | 'screenshot_review'
  | 'export_pptx';
export type PptDeckDisplaySurfaceKind =
  | 'research_surface'
  | 'stage_artifact'
  | 'render_output'
  | 'review_output'
  | 'delivery_bundle';
export type PptDeckDisplaySurfaceCondition = 'research_needed' | 'always' | 'approved_for_export';

export interface PptDeckDisplaySurface {
  id: PptDeckDisplaySurfaceId;
  kind: PptDeckDisplaySurfaceKind;
  required_when: PptDeckDisplaySurfaceCondition;
}

export interface PptDeckDisplayRegistry {
  surfaces: PptDeckDisplaySurface[];
}

export interface PptDeckLifecycleModel {
  macro_lifecycle: Array<
    'source_readiness'
    | 'story_architecture'
    | 'visual_authorship'
    | 'delivery_packaging'
  >;
  route_to_stage: Partial<Record<Exclude<PptDeckStageId, 'visual_director_review' | 'screenshot_review'>, string>>;
  review_overlay_routes: {
    visual_director_review: 'visual_director_review';
    screenshot_review: 'screenshot_review';
  };
  research_ownership: {
    semantic_role: 'shared_source_readiness_augmentation';
    trigger_conditions: string[];
  };
}

export interface PptDeckSourceTruthContract {
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
    storyline: 'story_architecture';
    detailed_outline: 'story_architecture';
    slide_blueprint: 'story_architecture';
    visual_direction: 'visual_authorship';
    author_image_pages: 'visual_authorship';
    fix_html: 'visual_authorship';
    author_pptx_native: 'visual_authorship';
    repair_image_pages: 'visual_authorship';
    repair_pptx_native: 'visual_authorship';
  };
  required_hydrated_export_surface: 'export_pptx';
}

export interface PptDeckDeliveryContract {
  authoritative_projection_surface: 'getPublicationProjection';
  authoritative_review_surface: 'getReviewState';
  required_export_route: 'export_pptx';
  required_export_bundle_id: string;
  export_artifact_field: 'export_bundle';
  delivery_state_field: 'export_bundle.delivery_state';
  projection_model: 'direct_delivery';
  human_gate: {
    required: false;
    mutation_surfaces: ReadonlyArray<string>;
  };
  operator_handoff: {
    owner_surface: 'required_export_artifact.delivery_state';
    handoff_ready_state: 'output_ready';
    gate_surfaces: ReadonlyArray<'auditDeliverable' | 'runtimeWatch' | 'getReviewState' | 'getPublicationProjection'>;
    reopen_mutation_surface: 'request_changes';
    closeout_mutation_surface: 'promote_baseline';
  };
  projection_states: {
    ready_for_export: 'export_ready';
    output_ready: 'output_ready';
  };
}

export interface PptDeckLifecycleStageContract {
  stage_model: 'direct_delivery_human_workline';
  human_workline: ReadonlyArray<'source_readiness' | 'storyline' | 'plan' | 'visual' | 'delivery'>;
  macro_lifecycle: ReadonlyArray<'source_readiness' | 'story_architecture' | 'visual_authorship' | 'delivery_packaging'>;
  human_to_macro_stage: {
    source_readiness: 'source_readiness';
    storyline: 'story_architecture';
    plan: 'story_architecture';
    visual: 'visual_authorship';
    delivery: 'delivery_packaging';
  };
  review_overlay_within: 'visual';
  operator_handoff_within: 'delivery';
  closeout_within: 'delivery';
  delivery_contains: ReadonlyArray<'required_export_route' | 'required_export_bundle_id' | 'operator_handoff' | 'closeout'>;
  route_to_human_stage: {
    storyline: 'storyline';
    detailed_outline: 'plan';
    slide_blueprint: 'plan';
    visual_direction: 'visual';
    author_image_pages: 'visual';
    render_html: 'visual';
    author_pptx_native: 'visual';
    repair_image_pages: 'visual';
    fix_html: 'visual';
    repair_pptx_native: 'visual';
    visual_director_review: 'visual';
    screenshot_review: 'visual';
    export_pptx: 'delivery';
  };
}

export interface PptDeckHydrateContractRequest {
  overlay?: PptDeckOverlayId;
  topicId: string;
  deliverableId: string;
  title: string;
  goal: string;
  profileId: PptDeckProfileId;
}

export interface PptDeckHydratedContract {
  schema_version: 1;
  overlay: PptDeckOverlayId;
  profile_id: PptDeckProfileId;
  deliverable_kind: PptDeckDeliverableKind;
  topic_id: string;
  deliverable_id: string;
  title: string;
  goal: string;
  stage_sequence: PptDeckStageSequence;
  review_surface: PptDeckReviewSurface;
  layout_rules: PptDeckLayoutRules;
  baseline_policy: PptDeckBaselinePolicy;
  stage_requirements: PptDeckStageRequirements;
  prompt_pack: PptDeckPromptPack;
  export_bundle: PptDeckExportBundle;
  display_registry: PptDeckDisplayRegistry;
  lifecycle_model: PptDeckLifecycleModel;
  lifecycle_stage_contract: PptDeckLifecycleStageContract;
  source_truth_contract: PptDeckSourceTruthContract;
  delivery_contract: PptDeckDeliveryContract;
}

export interface PptDeckRecordInput {
  topicId: string;
  deliverableId: string;
  title: string;
  profileId: PptDeckProfileId;
  goal: string;
  hydratedContract?: PptDeckHydratedContract;
}

export interface PptDeckRecord {
  topic_id: string;
  deliverable_id: string;
  overlay: PptDeckOverlayId;
  kind: PptDeckDeliverableKind;
  title: string;
  status: 'draft';
  deliverable_kind: PptDeckDeliverableKind;
  profile_id: PptDeckProfileId;
  goal: string;
  hydrated_contract_ref: 'contracts/hydrated-deliverable.json';
  slide_ratio: '16:9';
  routes: PptDeckStageId[];
}

export interface PptDeckStoryboardSlideInput {
  slide_id?: string;
  title?: string;
}

export interface PptDeckStoryboardGateInput {
  slides?: Array<PptDeckStoryboardSlideInput | null>;
}

export interface PptDeckStoryboardMetrics {
  slide_count: number;
}

export interface PptDeckStoryboardGateReport {
  status: 'block' | 'pass';
  blockers: PptDeckStoryboardBlocker[];
  advisories: string[];
  metrics: PptDeckStoryboardMetrics;
  next_action: PptDeckStoryboardNextAction;
}

export interface PptDeckSurfaceBundleRequest {
  contract: PptDeckHydratedContract;
}

export type PptDeckSurfaceArtifactContent =
  | PptDeckStageSequence
  | PptDeckStageRequirements
  | PptDeckPromptPack
  | PptDeckReviewSurface
  | PptDeckLayoutRules
  | PptDeckBaselinePolicy
  | PptDeckExportBundle
  | PptDeckDeliveryContract
  | PptDeckHydratedContract
  | PptDeckDisplayRegistry
  | PptDeckLifecycleModel;

export interface PptDeckSurfaceArtifact {
  relativePath: PptDeckSurfaceArtifactPath;
  content: PptDeckSurfaceArtifactContent;
}

export interface PptDeckOverlayProfileDefinition extends OverlayProfileDefinition {
  profile_id: PptDeckProfileId;
}

export interface PptDeckOverlayProfiles {
  lecture_student: PptDeckOverlayProfileDefinition;
  lecture_peer: PptDeckOverlayProfileDefinition;
  executive_briefing: PptDeckOverlayProfileDefinition;
  defense_deck: PptDeckOverlayProfileDefinition;
}

export interface PptDeckOverlayCatalogEntry extends OverlayCatalogEntry {
  overlay_id: PptDeckOverlayId;
  default_profile_id: 'lecture_student';
  profiles: PptDeckProfileId[];
  route_sequence: PptDeckStageId[];
  deliverable_kind: PptDeckDeliverableKind;
  prompt_pack_id: 'ppt_deck_mainline_v1';
  visual_authoring_policy: {
    default_visual_route: 'author_image_pages';
    image_page_authoring_lane: PptDeckImagePageAuthoringLane;
    html_authoring_lane: PptDeckHtmlAuthoringLane;
    native_ppt_proof_lane: PptDeckNativePptProofLane;
  };
  packages: {
    overlay: '@redcube/overlay-ppt';
    runtime_family: '@redcube/runtime-family-ppt';
    pack: '@redcube/pack-ppt';
  };
}

export interface PptDeckOverlayDefinition {
  overlayId: PptDeckOverlayId;
  profiles: PptDeckOverlayProfiles;
  buildDeliverableRecord: (input: PptDeckRecordInput) => PptDeckRecord;
  buildSurfaceBundle: (request: PptDeckSurfaceBundleRequest) => PptDeckSurfaceArtifact[];
  listSurfaceArtifactPaths: () => PptDeckSurfaceArtifactPath[];
  validateSurfaceArtifact: (
    relativePath: PptDeckSurfaceArtifactPath,
    content: PptDeckSurfaceArtifactContent | null | undefined,
  ) => boolean;
  hydrateDeliverableContract: (request: PptDeckHydrateContractRequest) => PptDeckHydratedContract;
  describeOverlay: () => PptDeckOverlayCatalogEntry;
}
