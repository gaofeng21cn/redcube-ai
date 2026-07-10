import type { OverlayProfileDefinition } from '@redcube/overlay-core';

type XiaohongshuCatalog = ReturnType<typeof import('./contracts.js').describeXiaohongshuOverlay>;

export type XiaohongshuOverlayId = XiaohongshuCatalog['overlay_id'];
export type XiaohongshuProfileId = XiaohongshuCatalog['profiles'][number];
export type XiaohongshuDeliverableKind = XiaohongshuCatalog['deliverable_kind'];
export type XiaohongshuStageSequence = typeof import('./contracts.js').XIAOHONGSHU_STAGE_SEQUENCE;
export type XiaohongshuStageDefinition =
  | XiaohongshuStageSequence['stages'][number]
  | XiaohongshuStageSequence['alternate_stages'][number];
export type XiaohongshuStageHardStop = XiaohongshuStageSequence['hard_stops'][number];
export type XiaohongshuStageId = XiaohongshuStageDefinition['stage_id'];
export type XiaohongshuPromptFile = XiaohongshuStageDefinition['prompt_file'];
export type XiaohongshuOutputArtifactFile = XiaohongshuStageDefinition['output_artifact'];
export type XiaohongshuStageRequirements = typeof import('./contracts.js').XIAOHONGSHU_STAGE_REQUIREMENTS;
export type XiaohongshuStageRequirement = XiaohongshuStageRequirements[keyof XiaohongshuStageRequirements];
export type XiaohongshuReviewSurface = typeof import('./contracts.js').XIAOHONGSHU_REVIEW_SURFACE;
export type XiaohongshuReviewCheck = keyof XiaohongshuReviewSurface['rerun_from_stage'];
export type XiaohongshuLayoutRules = typeof import('./contracts.js').XIAOHONGSHU_LAYOUT_RULES;
export type XiaohongshuForbiddenTemplateRoute = XiaohongshuLayoutRules['forbidden_template_routes'][number];
export type XiaohongshuBaselinePolicy = typeof import('./contracts.js').XIAOHONGSHU_BASELINE_POLICY;
export type XiaohongshuPromptPack = typeof import('./contracts.js').XIAOHONGSHU_PROMPT_PACK;
export type XiaohongshuExportBundle = typeof import('./contracts.js').XIAOHONGSHU_EXPORT_BUNDLE;
export type XiaohongshuDisplayRegistry = typeof import('./contracts.js').XIAOHONGSHU_DISPLAY_REGISTRY;
export type XiaohongshuDisplaySurface = XiaohongshuDisplayRegistry['surfaces'][number];
export type XiaohongshuDisplaySurfaceId = XiaohongshuDisplaySurface['id'];
export type XiaohongshuDisplaySurfaceKind = XiaohongshuDisplaySurface['kind'];
export type XiaohongshuDisplaySurfaceCondition = XiaohongshuDisplaySurface['required_when'];
export type XiaohongshuLifecycleModel = typeof import('./contracts.js').XIAOHONGSHU_LIFECYCLE_MODEL;
export type XiaohongshuSourceTruthContract = typeof import('./contracts.js').XIAOHONGSHU_SOURCE_TRUTH_CONTRACT;
export type XiaohongshuDeliveryContract = typeof import('./contracts.js').XIAOHONGSHU_DELIVERY_CONTRACT;
export type XiaohongshuOverlayCatalogEntry = XiaohongshuCatalog;

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

export type XiaohongshuOverlayProfileDefinition = OverlayProfileDefinition & {
  profile_id: XiaohongshuProfileId;
};

export interface XiaohongshuOverlayDefinition {
  overlayId: XiaohongshuOverlayId;
  defaultProfileId: XiaohongshuProfileId;
  profiles: Record<XiaohongshuProfileId, XiaohongshuOverlayProfileDefinition>;
  buildDeliverableRecord: (input: XiaohongshuDeliverableRecordInput) => XiaohongshuDeliverableRecord;
  buildSurfaceBundle: (request: XiaohongshuSurfaceBundleRequest) => XiaohongshuSurfaceArtifact[];
  listSurfaceArtifactPaths: () => XiaohongshuSurfaceArtifactPath[];
  validateSurfaceArtifact: (
    relativePath: XiaohongshuSurfaceArtifactPath,
    content: unknown,
  ) => boolean;
  hydrateDeliverableContract: (request: XiaohongshuHydrateContractRequest) => XiaohongshuHydratedContract;
  describeOverlay: () => XiaohongshuOverlayCatalogEntry;
}
