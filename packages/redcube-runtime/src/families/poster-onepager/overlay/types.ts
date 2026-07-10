import type { OverlayProfileDefinition } from '@redcube/overlay-core';

type PosterCatalog = ReturnType<typeof import('./contracts.js').describePosterOnepagerOverlay>;

export type PosterOnepagerOverlayId = PosterCatalog['overlay_id'];
export type PosterOnepagerProfileId = PosterCatalog['profiles'][number];
export type PosterOnepagerDeliverableKind = PosterCatalog['deliverable_kind'];
export type PosterOnepagerStageSequence = typeof import('./contracts.js').POSTER_STAGE_SEQUENCE;
export type PosterOnepagerStageDefinition = PosterOnepagerStageSequence['stages'][number];
export type PosterOnepagerStageHardStop = PosterOnepagerStageSequence['hard_stops'][number];
export type PosterOnepagerStageId = PosterOnepagerStageDefinition['stage_id'];
export type PosterOnepagerPromptFile = PosterOnepagerStageDefinition['prompt_file'];
export type PosterOnepagerOutputArtifactFile = PosterOnepagerStageDefinition['output_artifact'];
export type PosterOnepagerStageRequirements = typeof import('./contracts.js').POSTER_STAGE_REQUIREMENTS;
export type PosterOnepagerStageRequirement = PosterOnepagerStageRequirements[keyof PosterOnepagerStageRequirements];
export type PosterOnepagerReviewSurface = typeof import('./contracts.js').POSTER_REVIEW_SURFACE;
export type PosterOnepagerReviewCheck = keyof PosterOnepagerReviewSurface['rerun_from_stage'];
export type PosterOnepagerLayoutRules = typeof import('./contracts.js').POSTER_LAYOUT_RULES;
export type PosterOnepagerBaselinePolicy = typeof import('./contracts.js').POSTER_BASELINE_POLICY;
export type PosterOnepagerPromptPack = typeof import('./contracts.js').POSTER_PROMPT_PACK;
export type PosterOnepagerDisplayRegistry = typeof import('./contracts.js').POSTER_DISPLAY_REGISTRY;
export type PosterOnepagerLifecycleModel = typeof import('./contracts.js').POSTER_LIFECYCLE_MODEL;
export type PosterOnepagerSourceTruthContract = typeof import('./contracts.js').POSTER_SOURCE_TRUTH_CONTRACT;
export type PosterOnepagerDeliveryContract = typeof import('./contracts.js').POSTER_DELIVERY_CONTRACT;
export type PosterOnepagerLifecycleStageContract = typeof import('./contracts.js').POSTER_LIFECYCLE_STAGE_CONTRACT;
export type PosterOnepagerExportBundle = typeof import('./contracts.js').POSTER_EXPORT_BUNDLE;
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
