import { buildDeckRecord as buildDeckRecordJs } from './contracts.js';
import {
  PPT_DECK_PROFILES as PPT_DECK_PROFILES_JS,
  describePptDeckOverlay as describePptDeckOverlayJs,
  hydratePptDeckContract as hydratePptDeckContractJs,
} from './profiles.js';
import {
  buildDeckSurfaceBundle as buildDeckSurfaceBundleJs,
  listDeckSurfaceArtifactPaths as listDeckSurfaceArtifactPathsJs,
  validateDeckSurfaceArtifact as validateDeckSurfaceArtifactJs,
} from './surface.js';

import type {
  PptDeckHydrateContractRequest,
  PptDeckHydratedContract,
  PptDeckOverlayCatalogEntry,
  PptDeckOverlayDefinition,
  PptDeckOverlayProfiles,
  PptDeckRecord,
  PptDeckRecordInput,
  PptDeckStoryboardGateInput,
  PptDeckStoryboardGateReport,
  PptDeckSurfaceArtifact,
  PptDeckSurfaceArtifactContent,
  PptDeckSurfaceArtifactPath,
  PptDeckSurfaceBundleRequest,
} from './types.js';

export function buildDeckRecord(input: PptDeckRecordInput): PptDeckRecord {
  return buildDeckRecordJs(
    input as Parameters<typeof buildDeckRecordJs>[0],
  ) as PptDeckRecord;
}

export const PPT_DECK_PROFILES: PptDeckOverlayProfiles = PPT_DECK_PROFILES_JS as PptDeckOverlayProfiles;

export function describePptDeckOverlay(): PptDeckOverlayCatalogEntry {
  return describePptDeckOverlayJs() as PptDeckOverlayCatalogEntry;
}

export function hydratePptDeckContract(
  request: PptDeckHydrateContractRequest,
): PptDeckHydratedContract {
  return hydratePptDeckContractJs(
    request as Parameters<typeof hydratePptDeckContractJs>[0],
  ) as unknown as PptDeckHydratedContract;
}

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

export function buildDeckSurfaceBundle(
  request: PptDeckSurfaceBundleRequest,
): PptDeckSurfaceArtifact[] {
  return buildDeckSurfaceBundleJs(
    request as Parameters<typeof buildDeckSurfaceBundleJs>[0],
  ) as PptDeckSurfaceArtifact[];
}

export function listDeckSurfaceArtifactPaths(): PptDeckSurfaceArtifactPath[] {
  return listDeckSurfaceArtifactPathsJs() as PptDeckSurfaceArtifactPath[];
}

export function validateDeckSurfaceArtifact(
  relativePath: PptDeckSurfaceArtifactPath,
  content: PptDeckSurfaceArtifactContent | null | undefined,
): boolean {
  return validateDeckSurfaceArtifactJs(relativePath, content) as boolean;
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
