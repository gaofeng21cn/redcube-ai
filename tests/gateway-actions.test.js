import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import {
  doctorWorkspace,
  listTopics,
} from '@redcube/gateway';

test('doctorWorkspace reports canonical directories and workspace file presence', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-gateway-'));
  writeFileSync(path.join(workspaceRoot, 'redcube.workspace.json'), JSON.stringify({ overlay: 'xiaohongshu' }), 'utf-8');

  const result = await doctorWorkspace({ workspaceRoot });

  assert.equal(result.ok, true);
  assert.equal(result.workspaceRoot, workspaceRoot);
  assert.equal(result.workspaceFileExists, true);
  assert.equal(result.contract.topicsDir, path.join(workspaceRoot, 'topics'));
});

test('listTopics returns topic metadata from canonical workspace tree', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-gateway-'));
  const topicDir = path.join(workspaceRoot, 'topics', 'topic-a');
  mkdirSync(topicDir, { recursive: true });
  writeFileSync(path.join(topicDir, 'topic.json'), JSON.stringify({
    topic_id: 'topic-a',
    overlay: 'xiaohongshu',
    status: 'draft',
  }), 'utf-8');

  const result = await listTopics({ workspaceRoot });

  assert.equal(result.ok, true);
  assert.equal(result.total, 1);
  assert.equal(result.topics[0].topic_id, 'topic-a');
  assert.equal(result.topics[0].status, 'draft');
});

test('@redcube/gateway manifest declares runtime-protocol without sibling file dependency', () => {
  const packageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-gateway/package.json'), 'utf-8'),
  );

  assert.equal(
    packageJson.dependencies?.['@redcube/runtime-protocol'],
    'workspace:*',
  );
});
