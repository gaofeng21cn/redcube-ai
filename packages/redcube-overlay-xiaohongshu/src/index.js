import {
  buildTopicRecord,
  buildXiaohongshuDeliverableRecord,
  describeXiaohongshuOverlay,
  hydrateXiaohongshuContract,
} from './contracts.js';

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

import {
  buildXiaohongshuSurfaceBundle,
  listXiaohongshuSurfaceArtifactPaths,
  validateXiaohongshuSurfaceArtifact,
} from './surface.js';

export function evaluateStorylineGate({ storylineText }) {
  const text = String(storylineText || '').trim();
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

export const xiaohongshuOverlay = {
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
