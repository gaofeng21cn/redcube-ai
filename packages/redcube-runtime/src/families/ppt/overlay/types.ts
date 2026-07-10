type PptProfileModule = typeof import('./profiles.js');
type PptProfileOverrides = PptProfileModule['PPT_DECK_PROFILE_OVERRIDES'];
type PptProfileOverride = PptProfileOverrides[keyof PptProfileOverrides];

export type PptDeckOverlayId = ReturnType<PptProfileModule['describePptDeckOverlay']>['overlay_id'];
export type PptDeckOverlayProfiles = PptProfileModule['PPT_DECK_PROFILES'];
export type PptDeckOverlayProfileDefinition = PptDeckOverlayProfiles[keyof PptDeckOverlayProfiles];
export type PptDeckProfileId = keyof PptDeckOverlayProfiles;
export type PptDeckDeliverableKind = ReturnType<PptProfileModule['describePptDeckOverlay']>['deliverable_kind'];
export type PptDeckStageSequence = PptProfileModule['FAMILY_STAGE_SEQUENCE'];
export type PptDeckStageDefinition =
  | PptDeckStageSequence['stages'][number]
  | PptDeckStageSequence['alternate_stages'][number];
export type PptDeckHardStop = PptDeckStageSequence['hard_stops'][number];
export type PptDeckStageId = PptDeckStageDefinition['stage_id'];
export type PptDeckPromptFile = PptDeckStageDefinition['prompt_file'];
export type PptDeckOutputArtifactFile = PptDeckStageDefinition['output_artifact'];
export type PptDeckStageRequirements = PptProfileModule['FAMILY_STAGE_REQUIREMENTS'];
export type PptDeckStageRequirement = PptDeckStageRequirements[keyof PptDeckStageRequirements];

type PptDeckFamilyReviewSurface = PptProfileModule['FAMILY_REVIEW_SURFACE'];
export type PptDeckReviewCheck = PptProfileOverride['review_surface']['required_checks'][number];
export type PptDeckReviewConditionalChecks = PptDeckFamilyReviewSurface['conditional_checks'];
export type PptDeckReviewRerunMap = Partial<Record<PptDeckReviewCheck, PptDeckStageId>>;
export type PptDeckReviewSurface = Omit<
  PptDeckFamilyReviewSurface,
  'required_checks' | 'rerun_from_stage'
> & {
  required_checks: PptDeckReviewCheck[];
  rerun_from_stage: PptDeckReviewRerunMap;
};

type PptDeckFamilyLayoutRules = PptProfileModule['FAMILY_LAYOUT_RULES'];
export type PptDeckDensityMode =
  | PptDeckFamilyLayoutRules['density_mode']
  | PptProfileOverride['layout_rules']['density_mode'];
export type PptDeckCanvasRules = PptDeckFamilyLayoutRules['canvas'];
export type PptDeckEvidenceSurfaceRules = PptDeckFamilyLayoutRules['evidence_surface_rules'];
export type PptDeckLayoutRules = Omit<
  PptDeckFamilyLayoutRules,
  'density_mode' | 'max_primary_points_per_slide'
> & {
  density_mode: PptDeckDensityMode;
  max_primary_points_per_slide: number;
};

export type PptDeckBaselinePolicy = PptProfileModule['FAMILY_BASELINE_POLICY'];
export type PptDeckDraftBaselineMode = PptDeckBaselinePolicy['modes']['draft_new'];
export type PptDeckOptimizeBaselineMode = PptDeckBaselinePolicy['modes']['optimize_existing'];
export type PptDeckPromptPack = PptProfileModule['FAMILY_PROMPT_PACK'];
export type PptDeckPromptRoutes = PptDeckPromptPack['routes'];
export type PptDeckPromptStages = PptDeckPromptPack['stages'];
export type PptDeckPromptStageFile = PptDeckPromptStages[keyof PptDeckPromptStages];
export type PptDeckRenderContract = PptDeckPromptPack['render_contract'];
export type PptDeckRecipeRegistry = PptDeckRenderContract['recipe_registry'];
export type PptDeckNativePptProofLane = typeof import('./profile-parts/authoring-lanes.js').NATIVE_PPT_PROOF_LANE;
export type PptDeckHtmlAuthoringLane = typeof import('./profile-parts/authoring-lanes.js').HTML_AUTHORING_LANE;
export type PptDeckImagePageAuthoringLane = typeof import('./profile-parts/authoring-lanes.js').IMAGE_PAGE_AUTHORING_LANE;

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
export type PptDeckDisplaySurface = PptDeckDisplayRegistry['surfaces'][number];
export type PptDeckDisplaySurfaceId = PptDeckDisplaySurface['id'];
export type PptDeckDisplaySurfaceKind = PptDeckDisplaySurface['kind'];
export type PptDeckDisplaySurfaceCondition = PptDeckDisplaySurface['required_when'];
export type PptDeckLifecycleModel = PptProfileModule['FAMILY_LIFECYCLE_MODEL'];
export type PptDeckSourceTruthContract = PptProfileModule['PPT_SOURCE_TRUTH_CONTRACT'];
export type PptDeckDeliveryContract = PptProfileModule['PPT_DELIVERY_CONTRACT_BASE'] & {
  required_export_bundle_id: string;
};
export type PptDeckLifecycleStageContract = PptProfileModule['DIRECT_DELIVERY_LIFECYCLE_STAGE_CONTRACT'];
export type PptDeckOverlayCatalogEntry = ReturnType<PptProfileModule['describePptDeckOverlay']>;

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
