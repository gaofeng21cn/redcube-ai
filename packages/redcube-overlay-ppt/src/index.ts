import { buildDeckRecord } from './contracts.js';
import {
  PPT_DECK_PROFILES,
  describePptDeckOverlay,
  hydratePptDeckContract,
} from './profiles.js';
import {
  buildDeckSurfaceBundle,
  listDeckSurfaceArtifactPaths,
  validateDeckSurfaceArtifact,
} from './surface.js';

import type {
  PptDeckOverlayDefinition,
  PptDeckStoryboardGateInput,
  PptDeckStoryboardGateReport,
} from './types.js';

export { buildDeckRecord } from './contracts.js';
export { PPT_DECK_PROFILES, describePptDeckOverlay, hydratePptDeckContract } from './profiles.js';
export {
  buildDeckSurfaceBundle,
  listDeckSurfaceArtifactPaths,
  validateDeckSurfaceArtifact,
} from './surface.js';

export function evaluateStoryboardGate(
  input: PptDeckStoryboardGateInput,
): PptDeckStoryboardGateReport {
  const slideList = Array.isArray(input.slides) ? input.slides : [];
  if (slideList.length === 0) {
    return {
      status: 'block',
      blockers: ['slides_empty'],
      advisories: [],
      metrics: { slide_count: 0 },
      next_action: 'rerun_storyboard',
    };
  }

  const validSlides = slideList.filter((slide) => {
    if (!slide || typeof slide !== 'object') {
      return false;
    }

    const slideId = String(slide.slide_id || '').trim();
    const title = String(slide.title || '').trim();
    return Boolean(slideId || title);
  });

  if (validSlides.length !== slideList.length) {
    return {
      status: 'block',
      blockers: ['slides_invalid'],
      advisories: [],
      metrics: { slide_count: validSlides.length },
      next_action: 'rerun_storyboard',
    };
  }

  return {
    status: 'pass',
    blockers: [],
    advisories: [],
    metrics: { slide_count: validSlides.length },
    next_action: 'continue',
  };
}

export const pptDeckOverlay: PptDeckOverlayDefinition = {
  overlayId: 'ppt_deck',
  profiles: PPT_DECK_PROFILES,
  buildDeliverableRecord: buildDeckRecord,
  buildSurfaceBundle: buildDeckSurfaceBundle,
  listSurfaceArtifactPaths: listDeckSurfaceArtifactPaths,
  validateSurfaceArtifact: validateDeckSurfaceArtifact,
  hydrateDeliverableContract: hydratePptDeckContract,
  describeOverlay: describePptDeckOverlay,
};

export type {
  PptDeckBaselinePolicy,
  PptDeckDeliverableKind,
  PptDeckDisplayRegistry,
  PptDeckExportBundle,
  PptDeckHydrateContractRequest,
  PptDeckHydratedContract,
  PptDeckLayoutRules,
  PptDeckOverlayCatalogEntry,
  PptDeckOverlayDefinition,
  PptDeckOverlayProfiles,
  PptDeckProfileId,
  PptDeckPromptPack,
  PptDeckRecord,
  PptDeckRecordInput,
  PptDeckReviewCheck,
  PptDeckReviewSurface,
  PptDeckStageId,
  PptDeckStageRequirements,
  PptDeckStageSequence,
  PptDeckStoryboardGateInput,
  PptDeckStoryboardGateReport,
  PptDeckSurfaceArtifact,
  PptDeckSurfaceArtifactContent,
  PptDeckSurfaceArtifactPath,
  PptDeckSurfaceBundleRequest,
} from './types.js';
