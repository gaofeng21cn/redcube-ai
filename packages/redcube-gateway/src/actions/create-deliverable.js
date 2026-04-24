import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import {
  buildGovernanceSurfaceContract,
  hydrateDeliverableContract,
} from '@redcube/overlay-core';
import { getDefaultOverlayRegistry } from '@redcube/overlay-registry';
import { rebuildTopicPublicationProjection } from '@redcube/runtime';
import {
  buildSourcePackFederationArtifact,
  getDeliverablePaths,
  getSourceArtifactPaths,
  getTopicPaths,
} from '@redcube/runtime-protocol';

function buildTopicRecord({ topicId, title, overlay }) {
  return {
    topic_id: String(topicId || '').trim(),
    title: String(title || '').trim(),
    overlay: String(overlay || '').trim(),
    status: 'draft',
  };
}

const overlayRegistry = getDefaultOverlayRegistry();

function readJsonIfExists(file) {
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function upsertConsumerFamily(federation, deliverable) {
  const families = Array.isArray(federation.consumer_families)
    ? federation.consumer_families
    : [];
  const familyId = String(deliverable.overlay || '').trim();
  const family = families.find((item) => item?.family_id === familyId);
  const deliverableEntry = {
    deliverable_id: String(deliverable.deliverable_id || '').trim(),
    profile_id: String(deliverable.profile_id || '').trim(),
    title: String(deliverable.title || '').trim(),
    goal: String(deliverable.goal || '').trim(),
  };

  if (family) {
    const deliverables = Array.isArray(family.deliverables) ? family.deliverables : [];
    if (!deliverables.some((item) => item?.deliverable_id === deliverableEntry.deliverable_id)) {
      family.deliverables = [...deliverables, deliverableEntry];
    }
    return families;
  }

  return [
    ...families,
    {
      family_id: familyId,
      deliverables: [deliverableEntry],
    },
  ];
}

function updateSourcePackFederation({ workspaceRoot, topicId, deliverable }) {
  const sourcePaths = getSourceArtifactPaths(workspaceRoot, topicId);
  const sourceIndex = readJsonIfExists(sourcePaths.sourceIndexFile);
  const extractedMaterials = readJsonIfExists(sourcePaths.extractedMaterialsFile);
  const sourceAudit = readJsonIfExists(sourcePaths.sourceAuditFile);
  const sourceBrief = readJsonIfExists(sourcePaths.sourceBriefFile);
  const sourceReadinessPack = readJsonIfExists(sourcePaths.sourceReadinessPackFile);
  if (!sourceIndex || !extractedMaterials || !sourceAudit || !sourceBrief || !sourceReadinessPack) {
    return null;
  }

  const previousFederation = readJsonIfExists(sourcePaths.sourcePackFederationFile) || {};
  const consumerFamilies = upsertConsumerFamily(previousFederation, deliverable);
  const nextFederation = buildSourcePackFederationArtifact({
    workspaceRoot,
    topicId,
    sourceIndex,
    extractedMaterials,
    sourceAudit,
    sourceBrief,
    sourceReadinessPack,
    consumerFamilies,
  });
  writeFileSync(sourcePaths.sourcePackFederationFile, JSON.stringify(nextFederation, null, 2), 'utf-8');
  return sourcePaths.sourcePackFederationFile;
}

export async function createDeliverable({
  workspaceRoot,
  overlay,
  profileId,
  topicId,
  deliverableId,
  title,
  goal,
}) {
  const overlayDefinition = overlayRegistry.getOverlay(overlay);
  if (typeof overlayDefinition.buildDeliverableRecord !== 'function') {
    throw new Error(`Overlay ${overlay} cannot create deliverables`);
  }
  if (typeof overlayDefinition.buildSurfaceBundle !== 'function') {
    throw new Error(`Overlay ${overlay} cannot hydrate deliverable surfaces`);
  }

  const topicPaths = getTopicPaths(workspaceRoot, topicId);
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);

  mkdirSync(topicPaths.topicDir, { recursive: true });
  if (!existsSync(topicPaths.topicFile)) {
    writeFileSync(
      topicPaths.topicFile,
      JSON.stringify(buildTopicRecord({ topicId, title, overlay }), null, 2),
      'utf-8',
    );
  }

  const hydratedContract = hydrateDeliverableContract(overlayRegistry, {
    overlay,
    profileId,
    topicId,
    deliverableId,
    title,
    goal,
  });
  const governanceSurface = buildGovernanceSurfaceContract(hydratedContract);
  const deliverable = overlayDefinition.buildDeliverableRecord({
    topicId,
    deliverableId,
    title,
    profileId,
    goal,
    hydratedContract,
  });
  mkdirSync(deliverablePaths.deliverableDir, { recursive: true });
  writeFileSync(
    deliverablePaths.deliverableFile,
    JSON.stringify(deliverable, null, 2),
    'utf-8',
  );

  const surfaceFiles = [];
  for (const artifact of overlayDefinition.buildSurfaceBundle({ contract: hydratedContract })) {
    const targetFile = path.join(deliverablePaths.deliverableDir, artifact.relativePath);
    mkdirSync(path.dirname(targetFile), { recursive: true });
    writeFileSync(targetFile, JSON.stringify(artifact.content, null, 2), 'utf-8');
    surfaceFiles.push(targetFile);
  }

  const sourcePackFederationFile = updateSourcePackFederation({
    workspaceRoot,
    topicId,
    deliverable,
  });

  rebuildTopicPublicationProjection({ workspaceRoot, topicId });

  return {
    ok: true,
    surface_kind: 'deliverable_create',
    recommended_action: 'audit_deliverable',
    summary: {
      overlay: deliverable.overlay,
      deliverable_id: deliverable.deliverable_id,
      surface_file_count: surfaceFiles.length,
    },
    deliverableFile: deliverablePaths.deliverableFile,
    deliverable,
    surfaceFiles,
    sourcePackFederationFile,
    hydratedContract,
    governance_surface: governanceSurface,
  };
}
