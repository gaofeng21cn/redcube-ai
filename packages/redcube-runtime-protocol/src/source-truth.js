import path from 'node:path';

import { getTopicPaths } from './workspace.js';

export function getSourceArtifactPaths(workspaceRoot, topicId) {
  const topicPaths = getTopicPaths(workspaceRoot, topicId);
  return {
    topicPaths,
    sourceIndexFile: path.join(topicPaths.canonicalDir, 'source-index.json'),
    extractedMaterialsFile: path.join(topicPaths.canonicalDir, 'extracted-materials.json'),
    sourceAuditFile: path.join(topicPaths.canonicalDir, 'source-audit.json'),
    sourceBriefFile: path.join(topicPaths.canonicalDir, 'source-brief.json'),
  };
}
