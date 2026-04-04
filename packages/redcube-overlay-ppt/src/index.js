import { PPT_DECK_PROFILES, hydratePptDeckContract } from './profiles.js';

export { buildDeckRecord } from './contracts.js';
export { evaluateStoryboardGate } from './gates.js';
export { PPT_DECK_PROFILES, hydratePptDeckContract } from './profiles.js';
export {
  buildDeckSurfaceBundle,
  listDeckSurfaceArtifactPaths,
  validateDeckSurfaceArtifact,
} from './surface.js';

export const pptDeckOverlay = {
  overlayId: 'ppt_deck',
  profiles: PPT_DECK_PROFILES,
  hydrateDeliverableContract: hydratePptDeckContract,
};
