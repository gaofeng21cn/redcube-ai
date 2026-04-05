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
export { evaluateStorylineGate } from './gates.js';
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
