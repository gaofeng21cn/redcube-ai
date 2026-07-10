type PptProfileModule = typeof import('./profiles.js');
type PptProfileOverrides = PptProfileModule['PPT_DECK_PROFILE_OVERRIDES'];
type PptProfileOverride = PptProfileOverrides[keyof PptProfileOverrides];
type MutableRoutes<Value extends { readonly runnable_routes: readonly unknown[] }> = Omit<
  Value,
  'runnable_routes'
> & {
  runnable_routes: Value['runnable_routes'][number][];
};

type PptDeckCanonicalStageSequence = PptProfileModule['FAMILY_STAGE_SEQUENCE'];
type PptDeckCanonicalStageDefinition =
  | PptDeckCanonicalStageSequence['stages'][number]
  | PptDeckCanonicalStageSequence['alternate_stages'][number];
type PptDeckCanonicalHardStop = PptDeckCanonicalStageSequence['hard_stops'][number];
type PptDeckCanonicalStageRequirements = PptProfileModule['FAMILY_STAGE_REQUIREMENTS'];

export type PptDeckOverlayProfiles = PptProfileModule['PPT_DECK_PROFILES'];
type PptDeckOverlayProfileDefinition = PptDeckOverlayProfiles[keyof PptDeckOverlayProfiles];
export type PptDeckProfileId = keyof PptDeckOverlayProfiles;
export type PptDeckOverlayCatalogEntry = ReturnType<PptProfileModule['describePptDeckOverlay']>;
export type PptDeckOverlayId = PptDeckOverlayCatalogEntry['overlay_id'];
export type PptDeckDeliverableKind = PptDeckOverlayCatalogEntry['deliverable_kind'];
export type PptDeckStageId = PptDeckCanonicalStageDefinition['stage_id'];
export type PptDeckPromptFile = PptDeckCanonicalStageDefinition['prompt_file'];
export type PptDeckOutputArtifactFile = PptDeckCanonicalStageDefinition['output_artifact'];

export interface PptDeckStageDefinition {
  stage_id: PptDeckStageId;
  prompt_file: PptDeckPromptFile;
  output_artifact: PptDeckOutputArtifactFile;
  requires_stages: PptDeckStageId[];
  requires_review_from_any?: PptDeckStageId[];
  lane_id?: string;
  replaces_stage?: PptDeckStageId;
}

export interface PptDeckHardStop {
  stage_id: PptDeckStageId;
  requires_stage_outputs?: PptDeckStageId[];
  requires_review?: PptDeckStageId[];
  requires_review_from_any?: PptDeckStageId[];
  rerun_from_stage: PptDeckCanonicalHardStop['rerun_from_stage'];
}

export interface PptDeckStageSequence {
  flow_id: PptDeckCanonicalStageSequence['flow_id'];
  stages: PptDeckStageDefinition[];
  alternate_stages?: PptDeckStageDefinition[];
  hard_stops: PptDeckHardStop[];
}

export interface PptDeckStageRequirement {
  requires_artifacts: PptDeckStageId[];
  requires_review_pass?: true;
  requires_review_from_any?: PptDeckStageId[];
}

export type PptDeckStageRequirements = Record<
  keyof PptDeckCanonicalStageRequirements,
  PptDeckStageRequirement
>;

type PptDeckFamilyReviewSurface = PptProfileModule['FAMILY_REVIEW_SURFACE'];
export type PptDeckReviewCheck =
  | keyof PptDeckFamilyReviewSurface['rerun_from_stage']
  | PptProfileOverride['review_surface']['required_checks'][number];
export interface PptDeckReviewConditionalChecks {
  optimize_existing: 'baseline_comparison_passed'[];
}
export type PptDeckReviewRerunMap = {
  -readonly [Key in keyof PptDeckFamilyReviewSurface['rerun_from_stage']]:
    PptDeckFamilyReviewSurface['rerun_from_stage'][Key];
} & {
  term_explained_on_first_use?: 'storyline';
  teaching_progression_clear?: 'detailed_outline';
  novelty_position_clear?: 'storyline';
  method_boundary_explicit?: 'detailed_outline';
  decision_implication_clear?: 'storyline';
  conclusion_up_front?: 'storyline';
  claim_evidence_traceable?: 'detailed_outline';
  backup_qa_ready?: 'slide_blueprint';
};
export interface PptDeckReviewSurface {
  required_checks: PptDeckReviewCheck[];
  artifact_stage: PptDeckFamilyReviewSurface['artifact_stage'];
  artifact_file: PptDeckFamilyReviewSurface['artifact_file'];
  conditional_checks: PptDeckReviewConditionalChecks;
  rerun_from_stage: PptDeckReviewRerunMap;
}

type PptDeckFamilyLayoutRules = PptProfileModule['FAMILY_LAYOUT_RULES'];
export type PptDeckDensityMode =
  | PptDeckFamilyLayoutRules['density_mode']
  | PptProfileOverride['layout_rules']['density_mode'];
type PptDeckCanvasRules = PptDeckFamilyLayoutRules['canvas'];
type PptDeckEvidenceSurfaceRules = PptDeckFamilyLayoutRules['evidence_surface_rules'];
export type PptDeckLayoutRules = Omit<
  PptDeckFamilyLayoutRules,
  'density_mode' | 'max_primary_points_per_slide'
> & {
  density_mode: PptDeckDensityMode;
  max_primary_points_per_slide: number;
};

export type PptDeckBaselinePolicy = PptProfileModule['FAMILY_BASELINE_POLICY'];
type PptDeckDraftBaselineMode = PptDeckBaselinePolicy['modes']['draft_new'];
type PptDeckOptimizeBaselineMode = PptDeckBaselinePolicy['modes']['optimize_existing'];
type PptDeckCanonicalPromptPack = PptProfileModule['FAMILY_PROMPT_PACK'];
type PptDeckMutableNativePptProofLane = MutableRoutes<
  typeof import('./profile-parts/authoring-lanes.js').NATIVE_PPT_PROOF_LANE
>;
export type PptDeckNativePptProofLane = Omit<
  PptDeckMutableNativePptProofLane,
  'unit_repair_scope'
> & {
  unit_repair_scope?: PptDeckMutableNativePptProofLane['unit_repair_scope'];
};
export type PptDeckHtmlAuthoringLane = MutableRoutes<
  typeof import('./profile-parts/authoring-lanes.js').HTML_AUTHORING_LANE
>;
export type PptDeckImagePageAuthoringLane = MutableRoutes<
  typeof import('./profile-parts/authoring-lanes.js').IMAGE_PAGE_AUTHORING_LANE
>;
export type PptDeckPromptPack = Omit<PptDeckCanonicalPromptPack, 'render_contract'> & {
  render_contract: Omit<
    PptDeckCanonicalPromptPack['render_contract'],
    'native_ppt_proof_lane' | 'html_authoring_lane' | 'image_page_authoring_lane'
  > & {
    native_ppt_proof_lane: PptDeckNativePptProofLane;
    html_authoring_lane: PptDeckHtmlAuthoringLane;
    image_page_authoring_lane: PptDeckImagePageAuthoringLane;
  };
};
type PptDeckPromptRoutes = PptDeckPromptPack['routes'];
type PptDeckPromptStages = PptDeckPromptPack['stages'];
type PptDeckPromptStageFile = PptDeckPromptStages[keyof PptDeckPromptStages];
type PptDeckRenderContract = PptDeckPromptPack['render_contract'];
type PptDeckRecipeRegistry = PptDeckRenderContract['recipe_registry'];

type PptDeckFamilyExportBundle = PptProfileModule['FAMILY_EXPORT_BUNDLE'];
export type PptDeckBundleId =
  | PptDeckFamilyExportBundle['bundle_id']
  | PptProfileOverride['export_bundle']['bundle_id'];
export type PptDeckExportBundle = Omit<
  PptDeckFamilyExportBundle,
  'bundle_id' | 'include_presenter_notes' | 'include_backup_slides'
> & {
  bundle_id: PptDeckBundleId;
  include_presenter_notes: boolean;
  include_backup_slides: boolean;
};

export type PptDeckDisplayRegistry = PptProfileModule['FAMILY_DISPLAY_REGISTRY'];
type PptDeckDisplaySurface = PptDeckDisplayRegistry['surfaces'][number];
type PptDeckDisplaySurfaceId = PptDeckDisplaySurface['id'];
type PptDeckDisplaySurfaceKind = PptDeckDisplaySurface['kind'];
type PptDeckDisplaySurfaceCondition = PptDeckDisplaySurface['required_when'];
export type PptDeckLifecycleModel = PptProfileModule['FAMILY_LIFECYCLE_MODEL'];
export type PptDeckSourceTruthContract = PptProfileModule['PPT_SOURCE_TRUTH_CONTRACT'];
export type PptDeckDeliveryContract = PptProfileModule['PPT_DELIVERY_CONTRACT_BASE'] & {
  required_export_bundle_id: string;
};
export type PptDeckLifecycleStageContract = PptProfileModule['DIRECT_DELIVERY_LIFECYCLE_STAGE_CONTRACT'];

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

export interface PptDeckHydrateContractRequest {
  overlay?: PptDeckOverlayId;
  topicId: string;
  deliverableId: string;
  title: string;
  goal: string;
  profileId: PptDeckProfileId;
  constraints?: Record<string, unknown>;
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
  delivery_request?: {
    constraints?: Record<string, unknown>;
  };
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

export interface PptDeckOverlayDefinition {
  overlayId: PptDeckOverlayId;
  profiles: PptDeckOverlayProfiles;
  buildDeliverableRecord: (input: PptDeckRecordInput) => PptDeckRecord;
  buildSurfaceBundle: (request: PptDeckSurfaceBundleRequest) => PptDeckSurfaceArtifact[];
  listSurfaceArtifactPaths: () => PptDeckSurfaceArtifactPath[];
  validateSurfaceArtifact: (
    relativePath: PptDeckSurfaceArtifactPath,
    content: unknown,
  ) => boolean;
  hydrateDeliverableContract: (request: PptDeckHydrateContractRequest) => PptDeckHydratedContract;
  describeOverlay: () => PptDeckOverlayCatalogEntry;
}
