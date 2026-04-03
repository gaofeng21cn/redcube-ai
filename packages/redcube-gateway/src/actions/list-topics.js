import path from 'node:path';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

import { resolveWorkspaceContract } from '@redcube/runtime-protocol';

export async function listTopics({ workspaceRoot }) {
  const contract = resolveWorkspaceContract({ workspaceRoot });

  if (!existsSync(contract.topicsDir)) {
    return {
      ok: true,
      workspaceRoot: contract.workspaceRoot,
      total: 0,
      topics: [],
    };
  }

  const topics = readdirSync(contract.topicsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(contract.topicsDir, entry.name, 'topic.json'))
    .filter((topicFile) => existsSync(topicFile))
    .map((topicFile) => JSON.parse(readFileSync(topicFile, 'utf-8')));

  return {
    ok: true,
    workspaceRoot: contract.workspaceRoot,
    total: topics.length,
    topics,
  };
}
