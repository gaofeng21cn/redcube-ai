import path from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

import {
  buildDeckRecord,
  buildDeckSurfaceBundle,
  pptDeckOverlay,
} from '@redcube/overlay-ppt';
import {
  createOverlayRegistry,
  hydrateDeliverableContract,
} from '@redcube/overlay-core';
import { xiaohongshuOverlay } from '@redcube/overlay-xiaohongshu';
import { getDeliverablePaths, getTopicPaths } from '@redcube/runtime-protocol';

function buildTopicRecord({ topicId, title, overlay }) {
  return {
    topic_id: String(topicId || '').trim(),
    title: String(title || '').trim(),
    overlay: String(overlay || '').trim(),
    status: 'draft',
  };
}

const overlayRegistry = createOverlayRegistry({
  ppt_deck: pptDeckOverlay,
  xiaohongshu: xiaohongshuOverlay,
});

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

  return {
    ok: true,
    deliverableFile: deliverablePaths.deliverableFile,
    deliverable,
    surfaceFiles,
    hydratedContract,
  };
}
