import { buildTopicRecord, hydrateXiaohongshuContract } from './contracts.js';

export { buildTopicRecord, hydrateXiaohongshuContract } from './contracts.js';
export { evaluateStorylineGate } from './gates.js';

export const xiaohongshuOverlay = {
  overlayId: 'xiaohongshu',
  defaultProfileId: 'standard_note',
  profiles: {
    standard_note: {
      profile_id: 'standard_note',
    },
  },
  hydrateDeliverableContract: hydrateXiaohongshuContract,
};
