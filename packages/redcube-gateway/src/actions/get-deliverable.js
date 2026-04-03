import { readFileSync } from 'node:fs';

import { getDeliverablePaths } from '@redcube/runtime-protocol';

export async function getDeliverable({
  workspaceRoot,
  topicId,
  deliverableId,
}) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  return {
    ok: true,
    deliverable: JSON.parse(readFileSync(deliverablePaths.deliverableFile, 'utf-8')),
  };
}
