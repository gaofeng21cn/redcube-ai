import { buildDeliverableRecord } from '@redcube/overlay-core';
import { hydratePptDeckContract } from './profiles.js';

import type {
  PptDeckHydratedContract,
  PptDeckProfileId,
  PptDeckRecord,
  PptDeckRecordInput,
  PptDeckStageDefinition,
} from './types.js';

export function buildDeckRecord({
  topicId,
  deliverableId,
  title,
  profileId = 'lecture_student',
  goal = '',
  hydratedContract,
}: PptDeckRecordInput): PptDeckRecord {
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
    profileId: profileId as PptDeckProfileId,
    goal,
  });

  return {
    ...deliverable,
    deliverable_kind: 'ppt_deck',
    profile_id: String(profileId || contract.profile_id || '').trim(),
    goal: String(goal || contract.goal || '').trim(),
    hydrated_contract_ref: 'contracts/hydrated-deliverable.json',
    slide_ratio: '16:9',
    routes: (contract as PptDeckHydratedContract).stage_sequence.stages.map((stage: PptDeckStageDefinition) => stage.stage_id),
  } as PptDeckRecord;
}
