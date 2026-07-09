import {
  buildXiaohongshuDeliverableRecord,
  describeXiaohongshuOverlay,
  hydrateXiaohongshuContract,
} from './contracts.js';
import {
  buildXiaohongshuSurfaceBundle,
  listXiaohongshuSurfaceArtifactPaths,
  validateXiaohongshuSurfaceArtifact,
} from './surface.js';

import type {
  XiaohongshuOverlayDefinition,
  XiaohongshuStorylineGateInput,
  XiaohongshuStorylineGateReport,
} from './types.js';

export {
  buildTopicRecord,
  buildXiaohongshuDeliverableRecord,
  describeXiaohongshuOverlay,
  hydrateXiaohongshuContract,
} from './contracts.js';
export {
  buildXiaohongshuSurfaceBundle,
  listXiaohongshuSurfaceArtifactPaths,
  validateXiaohongshuSurfaceArtifact,
} from './surface.js';

export function evaluateStorylineGate(input: XiaohongshuStorylineGateInput): XiaohongshuStorylineGateReport {
  const text = String(input.storylineText || '').trim();
  if (!text) {
    return {
      status: 'block',
      blockers: ['storyline_empty'],
      advisories: [],
      metrics: { char_count: 0 },
      next_action: 'rerun_storyline',
    };
  }

  return {
    status: 'pass',
    blockers: [],
    advisories: [],
    metrics: { char_count: text.length },
    next_action: 'continue',
  };
}

export const xiaohongshuOverlay: XiaohongshuOverlayDefinition = {
  overlayId: 'xiaohongshu',
  defaultProfileId: 'standard_note',
  profiles: {
    standard_note: {
      profile_id: 'standard_note',
    },
  },
  buildDeliverableRecord: buildXiaohongshuDeliverableRecord,
  buildSurfaceBundle: buildXiaohongshuSurfaceBundle,
  listSurfaceArtifactPaths: listXiaohongshuSurfaceArtifactPaths,
  validateSurfaceArtifact: validateXiaohongshuSurfaceArtifact,
  hydrateDeliverableContract: hydrateXiaohongshuContract,
  describeOverlay: describeXiaohongshuOverlay,
};

export type {
  XiaohongshuBaselinePolicy,
  XiaohongshuDeliverableKind,
  XiaohongshuDeliverableRecord,
  XiaohongshuDeliverableRecordInput,
  XiaohongshuDisplayRegistry,
  XiaohongshuHydrateContractRequest,
  XiaohongshuHydratedContract,
  XiaohongshuLayoutRules,
  XiaohongshuOverlayCatalogEntry,
  XiaohongshuOverlayDefinition,
  XiaohongshuProfileId,
  XiaohongshuPromptPack,
  XiaohongshuReviewCheck,
  XiaohongshuReviewSurface,
  XiaohongshuStageId,
  XiaohongshuStageSequence,
  XiaohongshuStorylineGateInput,
  XiaohongshuStorylineGateReport,
  XiaohongshuSurfaceArtifact,
  XiaohongshuSurfaceArtifactContent,
  XiaohongshuSurfaceArtifactPath,
  XiaohongshuSurfaceBundleRequest,
  XiaohongshuTopicRecord,
  XiaohongshuTopicRecordInput,
} from './types.js';
