import path from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

import {
  buildDeckRecord,
  buildDeckSurfaceBundle,
} from '@redcube/overlay-ppt';
import { getDeliverablePaths, getTopicPaths } from '@redcube/runtime-protocol';

function buildTopicRecord({ topicId, title, overlay }) {
  return {
    topic_id: String(topicId || '').trim(),
    title: String(title || '').trim(),
    overlay: String(overlay || '').trim(),
    status: 'draft',
  };
}

export async function createDeliverable({
  workspaceRoot,
  overlay,
  topicId,
  deliverableId,
  title,
}) {
  if (overlay !== 'ppt_deck') {
    throw new Error(`Unsupported overlay: ${overlay}`);
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

  const deliverable = buildDeckRecord({ topicId, deliverableId, title });
  mkdirSync(deliverablePaths.deliverableDir, { recursive: true });
  writeFileSync(
    deliverablePaths.deliverableFile,
    JSON.stringify(deliverable, null, 2),
    'utf-8',
  );

  const surfaceFiles = [];
  for (const artifact of buildDeckSurfaceBundle({ title })) {
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
  };
}
