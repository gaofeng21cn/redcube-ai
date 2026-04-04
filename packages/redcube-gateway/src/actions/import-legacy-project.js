import path from 'node:path';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';

import { buildTopicRecord } from '@redcube/overlay-xiaohongshu';
import {
  getTopicPaths,
  resolveWorkspaceContract,
} from '@redcube/runtime-protocol';

function ensureWorkspaceContract(workspaceRoot) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  mkdirSync(contract.workspaceRoot, { recursive: true });

  if (!existsSync(contract.workspaceFile)) {
    writeFileSync(
      contract.workspaceFile,
      JSON.stringify({
        workspace_version: 1,
        mode: 'agent_first_runtime',
      }, null, 2),
      'utf-8',
    );
  }

  return contract;
}

export async function importLegacyProject({
  rootDir,
  workspaceRoot,
  project,
}) {
  const projectId = String(project || '').trim();
  const legacyProjectDir = path.join(String(rootDir || '').trim(), 'projects', projectId);
  const legacyInputsDir = path.join(legacyProjectDir, 'inputs');

  if (!projectId) {
    throw new Error('project 不能为空');
  }
  if (!existsSync(legacyInputsDir)) {
    throw new Error(`legacy project 不存在: ${legacyProjectDir}`);
  }

  ensureWorkspaceContract(workspaceRoot);
  const topicPaths = getTopicPaths(workspaceRoot, projectId);
  if (existsSync(topicPaths.topicDir) && readdirSync(topicPaths.topicDir).length > 0) {
    throw new Error(`目标 topic 已存在: ${projectId}`);
  }

  mkdirSync(topicPaths.topicDir, { recursive: true });
  cpSync(legacyInputsDir, topicPaths.inputsDir, { recursive: true });

  const topic = buildTopicRecord({
    topicId: projectId,
    title: projectId,
  });
  writeFileSync(topicPaths.topicFile, JSON.stringify(topic, null, 2), 'utf-8');

  return {
    ok: true,
    mode: 'legacy_to_workspace',
    project: projectId,
    topicFile: topicPaths.topicFile,
    importedInputsDir: topicPaths.inputsDir,
  };
}
