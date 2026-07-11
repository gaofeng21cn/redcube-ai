// @ts-nocheck
import path from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

import {
  buildGovernanceSurfaceContract,
  hydrateDeliverableContract,
} from '@redcube/overlay-core';
import { getDefaultOverlayRegistry } from '@redcube/runtime';
import { getDeliverablePaths } from '@redcube/runtime-protocol';

import { createDeliverable } from './create-deliverable.js';
import { getDeliverable } from './get-deliverable.js';
import { requireField, safeText } from './action-utils.js';
import { readJson } from './json-file.js';

const overlayRegistry = getDefaultOverlayRegistry();

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function mergeJsonObject(base = {}, override = {}) {
  const merged = { ...(isPlainObject(base) ? base : {}) };
  for (const [key, value] of Object.entries(isPlainObject(override) ? override : {})) {
    merged[key] = isPlainObject(value) && isPlainObject(merged[key])
      ? mergeJsonObject(merged[key], value)
      : value;
  }
  return merged;
}

function writeJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
}

function requestedConstraints(delivery) {
  return isPlainObject(delivery?.constraints) ? delivery.constraints : {};
}

function rehydrateDeliverableContractWithConstraints({
  workspaceRoot,
  deliverableFamily,
  topicId,
  deliverableId,
  delivery,
}) {
  const requested = requestedConstraints(delivery);
  if (Object.keys(requested).length === 0) return;

  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const deliverable = readJson(deliverablePaths.deliverableFile);
  const contractRef = safeText(deliverable.hydrated_contract_ref, 'contracts/hydrated-deliverable.json');
  const existingContract = readJson(path.join(deliverablePaths.deliverableDir, contractRef));
  const currentConstraints = isPlainObject(existingContract?.delivery_request?.constraints)
    ? existingContract.delivery_request.constraints
    : {};
  const mergedConstraints = mergeJsonObject(currentConstraints, requested);
  if (isDeepStrictEqual(currentConstraints, mergedConstraints)) return;

  const overlayDefinition = overlayRegistry.getOverlay(deliverableFamily);
  if (typeof overlayDefinition.buildSurfaceBundle !== 'function') {
    throw new Error(`Overlay ${deliverableFamily} cannot hydrate deliverable surfaces`);
  }
  const hydratedContract = hydrateDeliverableContract(overlayRegistry, {
    overlay: deliverableFamily,
    profileId: safeText(deliverable.profile_id || existingContract.profile_id),
    topicId,
    deliverableId,
    title: safeText(deliverable.title || existingContract.title),
    goal: safeText(deliverable.goal || existingContract.goal),
    constraints: mergedConstraints,
  });
  for (const artifact of overlayDefinition.buildSurfaceBundle({ contract: hydratedContract })) {
    writeJson(path.join(deliverablePaths.deliverableDir, artifact.relativePath), artifact.content);
  }
  return buildGovernanceSurfaceContract(hydratedContract);
}

function stageSequenceFromDeliverableRecord(deliverableRecord) {
  const stageSequence = deliverableRecord?.hydrated_contract?.stage_sequence
    || deliverableRecord?.governance_surface?.stage_sequence
    || {};
  return {
    stages: Array.isArray(stageSequence.stages) ? stageSequence.stages : [],
    alternateStages: Array.isArray(stageSequence.alternate_stages) ? stageSequence.alternate_stages : [],
  };
}

function orderedPathForRequestedStages(deliverableRecord, route, stopAfterStage) {
  const { stages, alternateStages } = stageSequenceFromDeliverableRecord(deliverableRecord);
  const mainStageIds = stages.map((stage) => safeText(stage?.stage_id)).filter(Boolean);
  const mainStageIdSet = new Set(mainStageIds);
  const alternatesById = new Map(alternateStages
    .map((stage) => [safeText(stage?.stage_id), stage])
    .filter(([stageId]) => stageId));

  function mainAnchor(stageId) {
    let current = stageId;
    const visited = new Set();
    while (!mainStageIdSet.has(current)) {
      if (visited.has(current)) return '';
      visited.add(current);
      const alternate = alternatesById.get(current);
      current = safeText(alternate?.replaces_stage);
      if (!current) return '';
    }
    return current;
  }

  const requestedAlternates = [route, stopAfterStage]
    .map((stageId) => alternatesById.get(stageId))
    .filter(Boolean);
  const requestedLaneIds = new Set(requestedAlternates
    .map((stage) => safeText(stage?.lane_id))
    .filter(Boolean));
  if (requestedLaneIds.size > 1) return null;

  const replacements = new Map();
  for (const alternate of requestedAlternates) {
    const stageId = safeText(alternate?.stage_id);
    const anchor = mainAnchor(stageId);
    if (!anchor || (replacements.has(anchor) && replacements.get(anchor) !== stageId)) return null;
    replacements.set(anchor, stageId);
  }
  const orderedPath = mainStageIds.map((stageId) => replacements.get(stageId) || stageId);
  return orderedPath.includes(route) && orderedPath.includes(stopAfterStage) ? orderedPath : null;
}

function assertRequestedStagesAllowed(deliverableRecord, delivery) {
  const { stages, alternateStages } = stageSequenceFromDeliverableRecord(deliverableRecord);
  const allowedStages = [...stages, ...alternateStages]
    .map((stage) => safeText(stage?.stage_id))
    .filter(Boolean);
  if (allowedStages.length === 0) return;
  for (const [fieldName, requestedStage] of [
    ['delivery_request.route', delivery.route],
    ['delivery_request.stop_after_stage', delivery.stopAfterStage],
  ]) {
    if (requestedStage && !allowedStages.includes(requestedStage)) {
      throw new Error(
        `${fieldName}=${requestedStage} is not allowed by the hydrated overlay stage_sequence; allowed stages: ${allowedStages.join(', ')}`,
      );
    }
  }
  if (!delivery.route || !delivery.stopAfterStage) return;

  const orderedPath = orderedPathForRequestedStages(
    deliverableRecord,
    delivery.route,
    delivery.stopAfterStage,
  );
  if (!orderedPath) {
    throw new Error(
      `delivery_request.route=${delivery.route} and stop_after_stage=${delivery.stopAfterStage} are not on the same declared ordered path`,
    );
  }
  if (orderedPath.indexOf(delivery.stopAfterStage) < orderedPath.indexOf(delivery.route)) {
    throw new Error(
      `delivery_request.stop_after_stage=${delivery.stopAfterStage} precedes route=${delivery.route} on the declared ordered path`,
    );
  }
}

function assertDeliveryIdentityMatchesRecord(deliverableRecord, {
  deliverableFamily,
  profileId,
}) {
  const storedFamily = safeText(
    deliverableRecord?.summary?.overlay || deliverableRecord?.deliverable?.overlay,
  );
  if (storedFamily && storedFamily !== deliverableFamily) {
    throw new Error('delivery_request.deliverable_family does not match the RCA deliverable record');
  }
  const storedProfileId = safeText(
    deliverableRecord?.summary?.profile_id || deliverableRecord?.deliverable?.profile_id,
  );
  if (profileId && storedProfileId && profileId !== storedProfileId) {
    throw new Error('delivery_request.profile_id does not match the RCA deliverable record');
  }
}

export async function ensureProductEntryDeliverable({
  workspaceRoot,
  deliveryIdentity,
  delivery,
}) {
  const deliverableFamily = requireField(
    'delivery_request.deliverable_family',
    deliveryIdentity.deliverableFamily,
  );
  const topicId = requireField('delivery_request.topic_id', deliveryIdentity.topicId);
  const deliverableId = requireField('delivery_request.deliverable_id', deliveryIdentity.deliverableId);
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const createdDeliverable = !existsSync(deliverablePaths.deliverableFile);

  if (createdDeliverable) {
    await createDeliverable({
      workspaceRoot,
      overlay: deliverableFamily,
      profileId: requireField('delivery_request.profile_id', deliveryIdentity.profileId),
      topicId,
      deliverableId,
      title: requireField('delivery_request.title', deliveryIdentity.title),
      goal: requireField('delivery_request.goal', deliveryIdentity.goal),
      constraints: delivery.constraints,
    });
  } else {
    rehydrateDeliverableContractWithConstraints({
      workspaceRoot,
      deliverableFamily,
      topicId,
      deliverableId,
      delivery,
    });
  }

  const deliverableRecord = await getDeliverable({ workspaceRoot, topicId, deliverableId });
  assertDeliveryIdentityMatchesRecord(deliverableRecord, {
    deliverableFamily,
    profileId: deliveryIdentity.profileId,
  });
  assertRequestedStagesAllowed(deliverableRecord, delivery);
  return {
    createdDeliverable,
    resolvedIdentity: {
      deliverableFamily,
      topicId,
      deliverableId,
      profileId: safeText(deliverableRecord?.deliverable?.profile_id, deliveryIdentity.profileId),
      title: safeText(deliverableRecord?.deliverable?.title, deliveryIdentity.title),
      goal: safeText(deliverableRecord?.deliverable?.goal, deliveryIdentity.goal),
    },
  };
}
