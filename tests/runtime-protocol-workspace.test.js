import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import {
  createRunRecord,
  getNotePaths,
  getTopicPaths,
  resolveWorkspaceContract,
} from '../packages/redcube-runtime-protocol/src/index.js';

test('resolveWorkspaceContract returns canonical workspace metadata paths', () => {
  const workspaceRoot = path.join('/tmp', 'redcube-workspace');
  const contract = resolveWorkspaceContract({ workspaceRoot });

  assert.equal(contract.workspaceRoot, workspaceRoot);
  assert.equal(contract.workspaceFile, path.join(workspaceRoot, 'redcube.workspace.json'));
  assert.equal(contract.topicsDir, path.join(workspaceRoot, 'topics'));
  assert.equal(contract.runtimeDir, path.join(workspaceRoot, 'runtime'));
  assert.equal(contract.publishDir, path.join(workspaceRoot, 'publish'));
});

test('topic and note paths are derived from the canonical workspace root', () => {
  const workspaceRoot = path.join('/tmp', 'redcube-workspace');
  const topicPaths = getTopicPaths(workspaceRoot, 'topic-a');
  const notePaths = getNotePaths(workspaceRoot, 'topic-a', 'note-01');

  assert.equal(topicPaths.topicDir, path.join(workspaceRoot, 'topics', 'topic-a'));
  assert.equal(topicPaths.canonicalDir, path.join(workspaceRoot, 'topics', 'topic-a', 'canonical'));
  assert.equal(notePaths.noteDir, path.join(workspaceRoot, 'topics', 'topic-a', 'notes', 'note-01'));
  assert.equal(notePaths.artifactsDir, path.join(notePaths.noteDir, 'artifacts'));
  assert.equal(notePaths.reportsDir, path.join(notePaths.noteDir, 'reports'));
});

test('createRunRecord creates a stable minimal run envelope', () => {
  const run = createRunRecord({
    runId: 'run-001',
    route: 'topic.storyline',
    scope: 'topic',
    target: 'topic-a',
    overlay: 'xiaohongshu',
  });

  assert.deepEqual(run, {
    run_id: 'run-001',
    route: 'topic.storyline',
    scope: 'topic',
    target: 'topic-a',
    overlay: 'xiaohongshu',
    status: 'running',
    started_at: null,
    finished_at: null,
    current_stage: null,
    stage_results: [],
    artifact_refs: [],
    error: null,
  });
});
