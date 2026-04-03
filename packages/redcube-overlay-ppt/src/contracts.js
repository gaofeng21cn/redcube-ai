import { buildDeliverableRecord } from '../../redcube-overlay-core/src/index.js';

export function buildDeckRecord({ topicId, deliverableId, title }) {
  const deliverable = buildDeliverableRecord({
    topicId,
    deliverableId,
    overlay: 'ppt_deck',
    kind: 'ppt_deck',
    title,
  });

  return {
    ...deliverable,
    slide_ratio: '16:9',
    routes: ['storyline'],
  };
}
