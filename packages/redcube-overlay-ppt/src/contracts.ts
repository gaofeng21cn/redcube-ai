import { buildDeliverableRecord } from '@redcube/overlay-core';
import { hydratePptDeckContract } from './profiles.js';

type DeckContract = Record<string, any>;

export function buildDeckRecord({
  topicId,
  deliverableId,
  title,
  profileId,
  goal,
  hydratedContract,
}: {
  topicId: string;
  deliverableId: string;
  title: string;
  profileId?: string;
  goal?: string;
  hydratedContract?: DeckContract | null;
}) {
  const deliverable = buildDeliverableRecord({
    topicId,
    deliverableId,
    overlay: 'ppt_deck',
    kind: 'ppt_deck',
    title,
  });
  const contract = (hydratedContract || hydratePptDeckContract({
    topicId,
    deliverableId,
    title,
    profileId,
    goal,
  })) as DeckContract;

  return {
    ...deliverable,
    deliverable_kind: 'ppt_deck',
    profile_id: String(profileId || contract.profile_id || '').trim(),
    goal: String(goal || contract.goal || '').trim(),
    hydrated_contract_ref: 'contracts/hydrated-deliverable.json',
    slide_ratio: '16:9',
    routes: contract.stage_sequence.stages.map((stage: DeckContract) => stage.stage_id),
  };
}
