import { readFileSync } from 'node:fs';
import path from 'node:path';

import { buildGovernanceSurfaceContract } from '@redcube/overlay-core';
import { getDeliverablePaths } from '@redcube/runtime-protocol';

import type { DeliverableRecordResponse, DeliverableRequest } from '../types.js';
import type { JsonObject } from '@redcube/overlay-core';

type DeliverableRecordPayload = Record<string, unknown> & {
  deliverable_id?: string;
  hydrated_contract_ref?: string;
  overlay?: string;
  profile_id?: string;
};

function readJsonRecord(file: string): JsonObject {
  return JSON.parse(readFileSync(file, 'utf-8')) as JsonObject;
}

export async function getDeliverable({
  workspaceRoot,
  topicId,
  deliverableId,
}: DeliverableRequest): Promise<DeliverableRecordResponse> {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const deliverable = readJsonRecord(deliverablePaths.deliverableFile) as DeliverableRecordPayload;
  const contractRef = String(deliverable.hydrated_contract_ref || 'contracts/hydrated-deliverable.json').trim();
  const hydratedContract = readJsonRecord(path.join(deliverablePaths.deliverableDir, contractRef));

  return {
    ok: true,
    surface_kind: 'deliverable_record',
    recommended_action: 'audit_deliverable',
    summary: {
      deliverable_id: deliverable.deliverable_id,
      overlay: deliverable.overlay,
      profile_id: deliverable.profile_id,
    } as DeliverableRecordResponse['summary'],
    deliverable,
    hydrated_contract: hydratedContract,
    governance_surface: buildGovernanceSurfaceContract(hydratedContract),
  };
}
