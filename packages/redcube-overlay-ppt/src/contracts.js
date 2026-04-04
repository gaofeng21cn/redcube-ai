import { buildDeliverableRecord } from '../../redcube-overlay-core/src/index.js';
import { hydratePptDeckContract } from './profiles.js';

export function buildDeckRecord({
  topicId,
  deliverableId,
  title,
  profileId,
  goal,
  hydratedContract,
}) {
  const deliverable = buildDeliverableRecord({
    topicId,
    deliverableId,
    overlay: 'ppt_deck',
    kind: 'ppt_deck',
    title,
  });
  const contract = hydratedContract || hydratePptDeckContract({
    topicId,
    deliverableId,
    title,
    profileId,
    goal,
  });

  return {
    ...deliverable,
    deliverable_kind: 'ppt_deck',
    profile_id: String(profileId || contract.profile_id || '').trim(),
    goal: String(goal || contract.goal || '').trim(),
    hydrated_contract_ref: 'contracts/hydrated-deliverable.json',
    slide_ratio: '16:9',
    routes: contract.stage_sequence.stages.map((stage) => stage.stage_id),
  };
}
