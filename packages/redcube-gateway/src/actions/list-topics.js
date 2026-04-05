import path from 'node:path';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

import { resolveWorkspaceContract } from '@redcube/runtime-protocol';

export async function listTopics({ workspaceRoot }) {
  const contract = resolveWorkspaceContract({ workspaceRoot });

  if (!existsSync(contract.topicsDir)) {
    return {
      ok: true,
      surface_kind: 'topic_catalog',
      recommended_action: 'create_or_import_topic',
      summary: {
        total_topics: 0,
      },
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
    surface_kind: 'topic_catalog',
    recommended_action: topics.length > 0 ? 'continue' : 'create_or_import_topic',
    summary: {
      total_topics: topics.length,
    },
    workspaceRoot: contract.workspaceRoot,
    total: topics.length,
    topics,
  };
}
