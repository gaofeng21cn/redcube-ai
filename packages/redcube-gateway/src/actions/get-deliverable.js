import { readFileSync } from 'node:fs';

import { getDeliverablePaths } from '@redcube/runtime-protocol';

export async function getDeliverable({
  workspaceRoot,
  topicId,
  deliverableId,
}) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const deliverable = JSON.parse(readFileSync(deliverablePaths.deliverableFile, 'utf-8'));
  return {
    ok: true,
    surface_kind: 'deliverable_record',
    recommended_action: 'run_deliverable_route',
    summary: {
      deliverable_id: deliverable.deliverable_id,
      overlay: deliverable.overlay,
      profile_id: deliverable.profile_id,
    },
    deliverable,
  };
}
