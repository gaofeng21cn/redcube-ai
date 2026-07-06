// @ts-nocheck
import path from 'node:path';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

import {
  ensureWorkspaceGitBoundary,
  getSourceArtifactPaths,
  resolveWorkspaceContract,
} from '@redcube/runtime-protocol';
import { ensureWorkspaceXiaohongshuAuthorTemplate } from '@redcube/redcube-config/xiaohongshu-author-profile';

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function writeJson(file, value) {
  ensureDir(path.dirname(file));
  writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
}

export function readJsonIfExists(file) {
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function safeText(value) {
  return String(value || '').trim();
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
