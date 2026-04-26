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
export {
  buildPosterSurfaceBundle,
  listPosterSurfaceArtifactPaths,
  validatePosterSurfaceArtifact,
} from './surface.js';

export function evaluatePosterStorylineGate({ headline }) {
  const text = String(headline || '').trim();
  return {
    ok: text.length > 0,
    blocker: text.length > 0 ? null : 'headline_missing',
    next_action: text.length > 0 ? 'continue' : 'rerun_storyline',
  };
}

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
