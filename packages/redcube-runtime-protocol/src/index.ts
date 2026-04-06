import {
  createRunRecord as createRunRecordJs,
} from './runs.js';
import {
  getDeliverablePaths as getDeliverablePathsJs,
  getNotePaths as getNotePathsJs,
  getTopicPaths as getTopicPathsJs,
  resolveWorkspaceContract as resolveWorkspaceContractJs,
} from './workspace.js';
import {
  getSourceArtifactPaths as getSourceArtifactPathsJs,
} from './source-truth.js';

import type {
  CreateRunRecordInput,
  DeliverablePaths,
  NotePaths,
  RunRecord,
  SourceArtifactPaths,
  TopicPaths,
  WorkspaceContract,
} from './types.js';

export function createRunRecord(input: CreateRunRecordInput = {}): RunRecord {
  return createRunRecordJs(input) as RunRecord;
}

export function resolveWorkspaceContract(input: { workspaceRoot: string }): WorkspaceContract {
  return resolveWorkspaceContractJs(input) as WorkspaceContract;
}

export function getTopicPaths(workspaceRoot: string, topicId: string): TopicPaths {
  return getTopicPathsJs(workspaceRoot, topicId) as TopicPaths;
}

export function getDeliverablePaths(workspaceRoot: string, topicId: string, deliverableId: string): DeliverablePaths {
  return getDeliverablePathsJs(workspaceRoot, topicId, deliverableId) as DeliverablePaths;
}

export function getNotePaths(workspaceRoot: string, topicId: string, noteId: string): NotePaths {
  return getNotePathsJs(workspaceRoot, topicId, noteId) as NotePaths;
}

export function getSourceArtifactPaths(workspaceRoot: string, topicId: string): SourceArtifactPaths {
  return getSourceArtifactPathsJs(workspaceRoot, topicId) as SourceArtifactPaths;
}

export {
  getSourceArtifactPaths as getCanonicalSourceArtifactPaths,
};

export type {
  CreateRunRecordInput,
  DeliverablePaths,
  NotePaths,
  RunRecord,
  SourceArtifactPaths,
  TopicPaths,
  WorkspaceContract,
};
