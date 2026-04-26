import {
  buildPosterOnepagerDeliverableRecord as buildPosterOnepagerDeliverableRecordJs,
  describePosterOnepagerOverlay as describePosterOnepagerOverlayJs,
  hydratePosterOnepagerContract as hydratePosterOnepagerContractJs,
} from './contracts.js';
import {
  buildPosterSurfaceBundle as buildPosterSurfaceBundleJs,
  listPosterSurfaceArtifactPaths as listPosterSurfaceArtifactPathsJs,
  validatePosterSurfaceArtifact as validatePosterSurfaceArtifactJs,
} from './surface.js';

import type {
  PosterOnepagerDeliverableRecord,
  PosterOnepagerDeliverableRecordInput,
  PosterOnepagerHydrateContractRequest,
  PosterOnepagerHydratedContract,
  PosterOnepagerOverlayCatalogEntry,
  PosterOnepagerOverlayDefinition,
  PosterOnepagerStorylineGateReport,
  PosterSurfaceArtifact,
  PosterSurfaceArtifactContent,
  PosterSurfaceArtifactPath,
  PosterSurfaceBundleRequest,
} from './types.js';

export function buildPosterOnepagerDeliverableRecord(
  input: PosterOnepagerDeliverableRecordInput,
): PosterOnepagerDeliverableRecord {
  return buildPosterOnepagerDeliverableRecordJs({
    topicId: input.topicId,
    deliverableId: input.deliverableId,
    title: input.title,
    goal: input.goal,
    profileId: input.profileId,
    hydratedContract: input.hydratedContract,
  }) as PosterOnepagerDeliverableRecord;
}

export function describePosterOnepagerOverlay(): PosterOnepagerOverlayCatalogEntry {
  return describePosterOnepagerOverlayJs() as PosterOnepagerOverlayCatalogEntry;
}

export function hydratePosterOnepagerContract(
  request: PosterOnepagerHydrateContractRequest,
): PosterOnepagerHydratedContract {
  return hydratePosterOnepagerContractJs({
    topicId: request.topicId,
    deliverableId: request.deliverableId,
    title: request.title,
    goal: request.goal,
    profileId: request.profileId,
  }) as PosterOnepagerHydratedContract;
}

export function evaluatePosterStorylineGate(input: { headline?: string }): PosterOnepagerStorylineGateReport {
  const text = String(input.headline || '').trim();
  return {
    ok: text.length > 0,
    blocker: text.length > 0 ? null : 'headline_missing',
    next_action: text.length > 0 ? 'continue' : 'rerun_storyline',
  };
}

export function buildPosterSurfaceBundle(request: PosterSurfaceBundleRequest): PosterSurfaceArtifact[] {
  return buildPosterSurfaceBundleJs(request) as PosterSurfaceArtifact[];
}

export function listPosterSurfaceArtifactPaths(): PosterSurfaceArtifactPath[] {
  return listPosterSurfaceArtifactPathsJs() as PosterSurfaceArtifactPath[];
}

export function validatePosterSurfaceArtifact(
  relativePath: PosterSurfaceArtifactPath,
  content: PosterSurfaceArtifactContent | null | undefined,
): boolean {
  return validatePosterSurfaceArtifactJs(relativePath, content) as boolean;
}

export const posterOnepagerOverlay: PosterOnepagerOverlayDefinition = {
  overlayId: 'poster_onepager',
  defaultProfileId: 'knowledge_poster',
  profiles: {
    knowledge_poster: {
      profile_id: 'knowledge_poster',
    },
  },
  buildDeliverableRecord: buildPosterOnepagerDeliverableRecord,
  buildSurfaceBundle: buildPosterSurfaceBundle,
  listSurfaceArtifactPaths: listPosterSurfaceArtifactPaths,
  validateSurfaceArtifact: validatePosterSurfaceArtifact,
  hydrateDeliverableContract: hydratePosterOnepagerContract,
  describeOverlay: describePosterOnepagerOverlay,
};

export type {
  PosterOnepagerBaselinePolicy,
  PosterOnepagerDeliverableKind,
  PosterOnepagerDeliverableRecord,
  PosterOnepagerDeliverableRecordInput,
  PosterOnepagerDisplayRegistry,
  PosterOnepagerHydrateContractRequest,
  PosterOnepagerHydratedContract,
  PosterOnepagerLayoutRules,
  PosterOnepagerLifecycleModel,
  PosterOnepagerOverlayCatalogEntry,
  PosterOnepagerOverlayDefinition,
  PosterOnepagerProfileId,
  PosterOnepagerPromptPack,
  PosterOnepagerReviewCheck,
  PosterOnepagerReviewSurface,
  PosterOnepagerStageId,
  PosterOnepagerStageRequirements,
  PosterOnepagerStageSequence,
  PosterOnepagerStorylineGateReport,
  PosterSurfaceArtifact,
  PosterSurfaceArtifactContent,
  PosterSurfaceArtifactPath,
  PosterSurfaceBundleRequest,
} from './types.js';
