// @ts-nocheck
import path from 'node:path';
import {
  existsSync,
} from 'node:fs';

import {
  ensureWorkspaceGitBoundary,
  getSourceArtifactPaths,
  resolveWorkspaceContract,
} from '@redcube/runtime-protocol';
import { ensureWorkspaceXiaohongshuAuthorTemplate } from '@redcube/redcube-config/xiaohongshu-author-profile';
import { ensureDir, readJson, safeText, writeJson } from '../runtime-utils.js';

export { writeJson };

export function readJsonIfExists(file) {
  if (!existsSync(file)) return null;
  return readJson(file);
}

function buildTopicRecord(topicId, title) {
  return {
    topic_id: topicId,
    title: title || topicId,
    status: 'source_ready',
  };
}

export function ensureWorkspaceAndTopic({ workspaceRoot, topicId, title }) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const sourcePaths = getSourceArtifactPaths(workspaceRoot, topicId);

  ensureDir(contract.workspaceRoot);
  ensureWorkspaceGitBoundary({ workspaceRoot: contract.workspaceRoot });
  if (!existsSync(contract.workspaceFile)) {
    writeJson(contract.workspaceFile, {
      workspace_version: 1,
      mode: 'agent_first_runtime',
    });
  }
  ensureWorkspaceXiaohongshuAuthorTemplate({
    workspaceRoot: contract.workspaceRoot,
  });

  ensureDir(sourcePaths.topicPaths.topicDir);
  ensureDir(sourcePaths.topicPaths.inputsDir);
  ensureDir(sourcePaths.topicPaths.canonicalDir);
  if (!existsSync(sourcePaths.topicPaths.topicFile)) {
    writeJson(sourcePaths.topicPaths.topicFile, buildTopicRecord(sourcePaths.topicPaths.topicId, title));
  }

  return sourcePaths;
}

export function sourceIntakeMaterialInboxDir(topicPaths) {
  return ensureDir(path.join(topicPaths.inputsDir, 'raw_materials', 'source-intake'));
}
