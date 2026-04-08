import type { OverlayCatalogEntry, OverlayProfileDefinition } from '@redcube/overlay-core';

export type PosterOnepagerOverlayId = 'poster_onepager';
export type PosterOnepagerProfileId = 'knowledge_poster';
export type PosterOnepagerDeliverableKind = 'poster_onepager';
export type PosterOnepagerStageId =
  | 'storyline'
  | 'poster_blueprint'
  | 'visual_direction'
  | 'render_html'
  | 'visual_director_review'
  | 'screenshot_review'
  | 'export_bundle';
export type PosterOnepagerPromptFile =
  | 'storyline.md'
  | 'poster_blueprint.md'
  | 'visual_direction.md'
  | 'render_html.md'
  | 'director_review.md'
  | 'screenshot_review.md'
  | 'export_bundle.md';
export type PosterOnepagerOutputArtifactFile =
  | 'storyline.json'
  | 'poster_blueprint.json'
  | 'visual_direction.json'
  | 'render_bundle.json'
  | 'director_review.json'
  | 'quality_gate.json'
  | 'publish_bundle.json';
export type PosterOnepagerReviewCheck =
  | 'overflow_free'
  | 'occlusion_free'
  | 'visual_density_ok'
  | 'director_intent_landed'
  | 'anti_template_ok'
  | 'message_hierarchy_clear'
  | 'baseline_comparison_passed';
export type PosterSurfaceArtifactPath =
  | 'contracts/stage-sequence.json'
  | 'contracts/stage-requirements.json'
  | 'contracts/prompt-pack.json'
  | 'contracts/review-surface.json'
  | 'contracts/layout-rules.json'
  | 'contracts/baseline-policy.json'
  | 'contracts/export-bundle.json'
  | 'contracts/delivery-contract.json'
  | 'contracts/hydrated-deliverable.json'
  | 'views/display-registry.json';

export interface PosterOnepagerStageDefinition {
  stage_id: PosterOnepagerStageId;
  prompt_file: PosterOnepagerPromptFile;
  output_artifact: PosterOnepagerOutputArtifactFile;
  requires_stages: PosterOnepagerStageId[];
}

export interface PosterOnepagerStageHardStop {
  stage_id: PosterOnepagerStageId;
  rerun_from_stage: PosterOnepagerStageId;
  requires_stage_outputs?: PosterOnepagerStageId[];
  requires_review?: PosterOnepagerStageId[];
}

export interface PosterOnepagerStageSequence {
  flow_id: 'poster_onepager_mainline_flow';
  stages: PosterOnepagerStageDefinition[];
  hard_stops: PosterOnepagerStageHardStop[];
}

export interface PosterOnepagerStageRequirement {
  requires_artifacts: PosterOnepagerStageId[];
  requires_review_pass?: true;
}

export interface PosterOnepagerStageRequirements {
  storyline: PosterOnepagerStageRequirement;
  poster_blueprint: PosterOnepagerStageRequirement;
  visual_direction: PosterOnepagerStageRequirement;
  render_html: PosterOnepagerStageRequirement;
  visual_director_review: PosterOnepagerStageRequirement;
  screenshot_review: PosterOnepagerStageRequirement;
  export_bundle: PosterOnepagerStageRequirement;
}

export interface PosterOnepagerReviewSurface {
  required_checks: PosterOnepagerReviewCheck[];
  artifact_stage: 'screenshot_review';
  artifact_file: 'quality_gate.json';
  conditional_checks: {
    optimize_existing: PosterOnepagerReviewCheck[];
  };
  rerun_from_stage: Record<PosterOnepagerReviewCheck, PosterOnepagerStageId>;
}

export interface PosterOnepagerLayoutRules {
  density_mode: 'single_page_poster';
  canvas: {
    ratio: '4:5';
    width: 1080;
    height: 1350;
    scrollbars_forbidden: true;
  };
  max_primary_points_per_poster: number;
  slides_data_rule: 'single_poster_content';
  forbidden_template_routes: string[];
  require_public_source_label: true;
  require_single_primary_headline: true;
}

export interface PosterOnepagerBaselinePolicy {
  modes: {
    draft_new: { baseline_required: false };
    optimize_existing: {
      baseline_required: true;
      approved_baseline_only: true;
      required_review: 'baseline_comparison_passed';
    };
  };
}

export interface PosterOnepagerPromptPack {
  pack_id: 'poster_onepager_mainline_v1';
  root: 'prompts/poster_onepager';
  routes: Record<PosterOnepagerStageId, string>;
  stages: Record<PosterOnepagerStageId, { file: PosterOnepagerPromptFile }>;
  render_contract: {
    render_strategy: 'prompt_director_first';
    shell_file: 'render_shell.html';
    recipe_registry: {
      hero_band: 'poster.hero_band';
      evidence_columns: 'poster.evidence_columns';
      pathway_strip: 'poster.pathway_strip';
      action_footer: 'poster.action_footer';
      default: 'poster.evidence_columns';
    };
  };
}

export interface PosterOnepagerDisplayRegistry {
  surfaces: Array<{
    id: string;
    kind: string;
    required_when: string;
  }>;
}

export interface PosterOnepagerLifecycleModel {
  macro_lifecycle: Array<'source_readiness' | 'story_architecture' | 'visual_authorship' | 'delivery_packaging'>;
  route_to_stage: Record<string, string>;
  review_overlay_routes: {
    visual_director_review: 'visual_director_review';
    screenshot_review: 'screenshot_review';
  };
}

export interface PosterOnepagerSourceTruthContract {
  authoritative_surface: 'shared_source_truth';
  authoritative_gate: 'topics/<topic>/canonical/source-audit.json';
  authoritative_artifacts: ReadonlyArray<'source_index' | 'extracted_materials' | 'source_audit' | 'source_brief'>;
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
    poster_blueprint: 'story_architecture';
    visual_direction: 'visual_authorship';
  };
  required_hydrated_export_surface: 'export_bundle';
  poster_guarded_boundary: {
    profile_id: 'knowledge_poster';
    academic_contract_active: false;
  };
}

export interface PosterOnepagerDeliveryContract {
  authoritative_projection_surface: 'getPublicationProjection';
  authoritative_review_surface: 'getReviewState';
  required_export_route: 'export_bundle';
  required_export_bundle_id: 'poster_onepager_bundle';
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

export interface PosterOnepagerHydrateContractRequest {
  topicId: string;
  deliverableId: string;
  title: string;
  goal: string;
  profileId?: PosterOnepagerProfileId;
}

export interface PosterOnepagerHydratedContract {
  schema_version: 1;
  overlay: PosterOnepagerOverlayId;
  profile_id: PosterOnepagerProfileId;
  deliverable_kind: PosterOnepagerDeliverableKind;
  topic_id: string;
  deliverable_id: string;
  title: string;
  goal: string;
  stage_sequence: PosterOnepagerStageSequence;
  stage_requirements: PosterOnepagerStageRequirements;
  review_surface: PosterOnepagerReviewSurface;
  layout_rules: PosterOnepagerLayoutRules;
  baseline_policy: PosterOnepagerBaselinePolicy;
  prompt_pack: PosterOnepagerPromptPack;
  export_bundle: {
    bundle_id: 'poster_onepager_bundle';
    include_html: true;
    include_png: true;
    include_manifest: true;
    review_required_before_export: true;
  };
  display_registry: PosterOnepagerDisplayRegistry;
  lifecycle_model: PosterOnepagerLifecycleModel;
  source_truth_contract: PosterOnepagerSourceTruthContract;
  delivery_contract: PosterOnepagerDeliveryContract;
}

export interface PosterOnepagerDeliverableRecordInput {
  topicId: string;
  deliverableId: string;
  title: string;
  goal: string;
  profileId?: PosterOnepagerProfileId;
  hydratedContract?: PosterOnepagerHydratedContract;
}

export interface PosterOnepagerDeliverableRecord {
  topic_id: string;
  deliverable_id: string;
  overlay: PosterOnepagerOverlayId;
  kind: PosterOnepagerDeliverableKind;
  title: string;
  status: 'draft';
  deliverable_kind: PosterOnepagerDeliverableKind;
  profile_id: PosterOnepagerProfileId;
  goal: string;
  hydrated_contract_ref: 'contracts/hydrated-deliverable.json';
  poster_ratio: '4:5';
  routes: PosterOnepagerStageId[];
}

export interface PosterOnepagerStorylineGateReport {
  ok: boolean;
  blocker: 'headline_missing' | null;
  next_action: 'rerun_storyline' | 'continue';
}

export interface PosterSurfaceBundleRequest {
  contract: PosterOnepagerHydratedContract;
}

export interface PosterSurfaceArtifact {
  relativePath: PosterSurfaceArtifactPath;
  content: PosterSurfaceArtifactContent;
}

export type PosterSurfaceArtifactContent =
  | PosterOnepagerStageSequence
  | PosterOnepagerStageRequirements
  | PosterOnepagerPromptPack
  | PosterOnepagerReviewSurface
  | PosterOnepagerLayoutRules
  | PosterOnepagerBaselinePolicy
  | PosterOnepagerDeliveryContract
  | PosterOnepagerHydratedContract
  | PosterOnepagerDisplayRegistry
  | {
      bundle_id: 'poster_onepager_bundle';
      include_html: true;
      include_png: true;
      include_manifest: true;
      review_required_before_export: true;
    };

export interface PosterOnepagerOverlayCatalogEntry extends OverlayCatalogEntry {
  overlay_id: PosterOnepagerOverlayId;
  default_profile_id: PosterOnepagerProfileId;
  profiles: PosterOnepagerProfileId[];
  deliverable_kind: PosterOnepagerDeliverableKind;
  prompt_pack_id: 'poster_onepager_mainline_v1';
}

export interface PosterOnepagerProfileDefinition extends OverlayProfileDefinition {
  profile_id: PosterOnepagerProfileId;
}

export interface PosterOnepagerOverlayDefinition {
  overlayId: PosterOnepagerOverlayId;
  defaultProfileId: PosterOnepagerProfileId;
  profiles: Record<PosterOnepagerProfileId, PosterOnepagerProfileDefinition>;
  buildDeliverableRecord: (input: PosterOnepagerDeliverableRecordInput) => PosterOnepagerDeliverableRecord;
  buildSurfaceBundle: (request: PosterSurfaceBundleRequest) => PosterSurfaceArtifact[];
  listSurfaceArtifactPaths: () => PosterSurfaceArtifactPath[];
  validateSurfaceArtifact: (
    relativePath: PosterSurfaceArtifactPath,
    content: PosterSurfaceArtifactContent | null | undefined,
  ) => boolean;
  hydrateDeliverableContract: (request: PosterOnepagerHydrateContractRequest) => PosterOnepagerHydratedContract;
  describeOverlay: () => PosterOnepagerOverlayCatalogEntry;
}
