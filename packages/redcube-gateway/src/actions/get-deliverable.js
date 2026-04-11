import path from 'node:path';
import { readFileSync } from 'node:fs';

import { buildGovernanceSurfaceContract } from '@redcube/overlay-core';
import { getDeliverablePaths } from '@redcube/runtime-protocol';

export async function getDeliverable({
  workspaceRoot,
  topicId,
  deliverableId,
}) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const deliverable = JSON.parse(readFileSync(deliverablePaths.deliverableFile, 'utf-8'));
  const contractRef = String(deliverable?.hydrated_contract_ref || 'contracts/hydrated-deliverable.json').trim();
  const hydratedContract = JSON.parse(
    readFileSync(path.join(deliverablePaths.deliverableDir, contractRef), 'utf-8'),
  );
  return {
    ok: true,
    surface_kind: 'deliverable_record',
    recommended_action: 'audit_deliverable',
    summary: {
      deliverable_id: deliverable.deliverable_id,
      overlay: deliverable.overlay,
      profile_id: deliverable.profile_id,
    },
    deliverable,
    governance_surface: buildGovernanceSurfaceContract(hydratedContract),
  };
}
