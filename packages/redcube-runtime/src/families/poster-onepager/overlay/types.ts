import type { OverlayProfileDefinition } from '@redcube/overlay-core';

type PosterContractModule = typeof import('./contracts.js');
type PosterCatalog = ReturnType<PosterContractModule['describePosterOnepagerOverlay']>;

type PosterCanonicalStageSequence = PosterContractModule['POSTER_STAGE_SEQUENCE'];
type PosterCanonicalStageDefinition = PosterCanonicalStageSequence['stages'][number];
type PosterCanonicalQualityRoute = PosterCanonicalStageSequence['quality_route_recommendations'][number];
type PosterCanonicalStageRequirements = PosterContractModule['POSTER_STAGE_REQUIREMENTS'];

export type PosterOnepagerOverlayId = PosterCatalog['overlay_id'];
export type PosterOnepagerProfileId = PosterCatalog['profiles'][number];
export type PosterOnepagerDeliverableKind = PosterCatalog['deliverable_kind'];
export type PosterOnepagerStageId = PosterCanonicalStageDefinition['stage_id'];
export type PosterOnepagerPromptFile = PosterCanonicalStageDefinition['prompt_file'];
export type PosterOnepagerOutputArtifactFile = PosterCanonicalStageDefinition['output_artifact'];

export interface PosterOnepagerStageDefinition {
  stage_id: PosterOnepagerStageId;
  prompt_file: PosterOnepagerPromptFile;
  output_artifact: PosterOnepagerOutputArtifactFile;
  input_stage_refs: PosterOnepagerStageId[];
}

export interface PosterOnepagerQualityRouteRecommendation {
  stage_id: PosterOnepagerStageId;
  rerun_from_stage: PosterCanonicalQualityRoute['rerun_from_stage'];
  preferred_input_stage_refs?: PosterOnepagerStageId[];
  preferred_review_stage_refs?: PosterOnepagerStageId[];
}

export interface PosterOnepagerStageSequence {
  flow_id: PosterCanonicalStageSequence['flow_id'];
  stages: PosterOnepagerStageDefinition[];
  quality_route_recommendations: PosterOnepagerQualityRouteRecommendation[];
}

export interface PosterOnepagerStageRequirement {
  input_stage_refs: PosterOnepagerStageId[];
  ready_claim_requires_review_pass?: true;
  can_block_stage_launch: false;
}

export type PosterOnepagerStageRequirements = Record<
  keyof PosterCanonicalStageRequirements,
  PosterOnepagerStageRequirement
>;
export type PosterOnepagerReviewSurface = PosterContractModule['POSTER_REVIEW_SURFACE'];
export type PosterOnepagerReviewCheck = keyof PosterOnepagerReviewSurface['rerun_from_stage'];
export type PosterOnepagerLayoutRules = PosterContractModule['POSTER_LAYOUT_RULES'];
export type PosterOnepagerBaselinePolicy = PosterContractModule['POSTER_BASELINE_POLICY'];
export type PosterOnepagerPromptPack = PosterContractModule['POSTER_PROMPT_PACK'];
export type PosterOnepagerDisplayRegistry = PosterContractModule['POSTER_DISPLAY_REGISTRY'];
export type PosterOnepagerLifecycleModel = PosterContractModule['POSTER_LIFECYCLE_MODEL'];
export type PosterOnepagerSourceTruthContract = PosterContractModule['POSTER_SOURCE_TRUTH_CONTRACT'];
export type PosterOnepagerDeliveryContract = PosterContractModule['POSTER_DELIVERY_CONTRACT'];
export type PosterOnepagerLifecycleStageContract = PosterContractModule['POSTER_LIFECYCLE_STAGE_CONTRACT'];
export type PosterOnepagerExportBundle = PosterContractModule['POSTER_EXPORT_BUNDLE'];
export type PosterOnepagerOverlayCatalogEntry = PosterCatalog;

export type PosterSurfaceArtifactPath =
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
  export_bundle: PosterOnepagerExportBundle;
  display_registry: PosterOnepagerDisplayRegistry;
  lifecycle_model: PosterOnepagerLifecycleModel;
  lifecycle_stage_contract: PosterOnepagerLifecycleStageContract;
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

export type PosterSurfaceArtifactContent =
  | PosterOnepagerStageSequence
  | PosterOnepagerStageRequirements
  | PosterOnepagerPromptPack
  | PosterOnepagerReviewSurface
  | PosterOnepagerLayoutRules
  | PosterOnepagerBaselinePolicy
  | PosterOnepagerExportBundle
  | PosterOnepagerDeliveryContract
  | PosterOnepagerHydratedContract
  | PosterOnepagerDisplayRegistry;

export interface PosterSurfaceArtifact {
  relativePath: PosterSurfaceArtifactPath;
  content: PosterSurfaceArtifactContent;
}

export type PosterOnepagerProfileDefinition = OverlayProfileDefinition & {
  profile_id: PosterOnepagerProfileId;
};

export interface PosterOnepagerOverlayDefinition {
  overlayId: PosterOnepagerOverlayId;
  defaultProfileId: PosterOnepagerProfileId;
  profiles: Record<PosterOnepagerProfileId, PosterOnepagerProfileDefinition>;
  buildDeliverableRecord: (input: PosterOnepagerDeliverableRecordInput) => PosterOnepagerDeliverableRecord;
  buildSurfaceBundle: (request: PosterSurfaceBundleRequest) => PosterSurfaceArtifact[];
  listSurfaceArtifactPaths: () => PosterSurfaceArtifactPath[];
  validateSurfaceArtifact: (
    relativePath: PosterSurfaceArtifactPath,
    content: unknown,
  ) => boolean;
  hydrateDeliverableContract: (request: PosterOnepagerHydrateContractRequest) => PosterOnepagerHydratedContract;
  describeOverlay: () => PosterOnepagerOverlayCatalogEntry;
}
