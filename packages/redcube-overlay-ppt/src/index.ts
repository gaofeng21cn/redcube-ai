import { buildDeckRecord as buildDeckRecordJs } from './contracts.js';
import { evaluateStoryboardGate as evaluateStoryboardGateJs } from './gates.js';
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
  return evaluateStoryboardGateJs(
    input as Parameters<typeof evaluateStoryboardGateJs>[0],
  ) as PptDeckStoryboardGateReport;
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
