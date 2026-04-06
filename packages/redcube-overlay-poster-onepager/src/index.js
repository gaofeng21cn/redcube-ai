import {
  buildPosterOnepagerDeliverableRecord,
  describePosterOnepagerOverlay,
  hydratePosterOnepagerContract,
} from './contracts.js';
import {
  buildPosterSurfaceBundle,
  listPosterSurfaceArtifactPaths,
  validatePosterSurfaceArtifact,
} from './surface.js';

export {
  buildPosterOnepagerDeliverableRecord,
  describePosterOnepagerOverlay,
  hydratePosterOnepagerContract,
} from './contracts.js';
export { evaluatePosterStorylineGate } from './gates.js';
export {
  buildPosterSurfaceBundle,
  listPosterSurfaceArtifactPaths,
  validatePosterSurfaceArtifact,
} from './surface.js';

export const posterOnepagerOverlay = {
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
