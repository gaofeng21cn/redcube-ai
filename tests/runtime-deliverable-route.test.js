import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync } from 'node:fs';

import {
  createDeliverable,
  getDeliverable,
  getRun,
  runDeliverableRoute,
} from '../packages/redcube-gateway/src/index.js';
import { appendEvent } from '@redcube/runtime';

test('createDeliverable writes canonical deliverable metadata', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
  });

  assert.equal(created.ok, true);

  const stored = await getDeliverable({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-a',
  });

  assert.equal(stored.ok, true);
  assert.equal(stored.deliverable.overlay, 'ppt_deck');
  assert.equal(stored.deliverable.kind, 'ppt_deck');
  assert.equal(stored.deliverable.slide_ratio, '16:9');
  assert.deepEqual(stored.deliverable.routes, ['storyline']);
});

test('createDeliverable rejects unsupported overlay ids', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await assert.rejects(
    () => createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '甲状腺门诊科普 deck',
    }),
    /Unsupported overlay: xiaohongshu/,
  );
});

test('runDeliverableRoute uses host-agent executor by default', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
  });

  const result = await runDeliverableRoute({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    route: 'storyline',
  });

  assert.equal(result.ok, true);
  assert.equal(result.run.executor.adapter, 'host_agent');
  assert.equal(result.run.status, 'completed');
  assert.equal(result.events.length >= 2, true);

  const stored = await getRun({ workspaceRoot, runId: result.run.run_id });
  assert.equal(stored.run.executor.adapter, 'host_agent');
  assert.equal(
    JSON.parse(readFileSync(result.artifactFile, 'utf-8')).route,
    'storyline',
  );
});

test('getRun rejects unsafe run identifiers', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await assert.rejects(
    () => getRun({ workspaceRoot, runId: '../run-a' }),
    /runId 不能包含路径分隔符/,
  );
});

test('appendEvent rejects unsafe run identifiers', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  assert.throws(
    () => appendEvent(workspaceRoot, '../run-a', { type: 'test' }),
    /runId 不能包含路径分隔符/,
  );
});

test('runDeliverableRoute rejects unsafe route segments', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
  });

  await assert.rejects(
    () => runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: '../storyline',
    }),
    /route 不能包含路径分隔符/,
  );
});

test('runDeliverableRoute rejects overlay mismatch against stored deliverable', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
  });

  await assert.rejects(
    () => runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    }),
    /overlay mismatch: expected ppt_deck, got xiaohongshu/,
  );
});

test('runDeliverableRoute records failed run when executor cannot run route', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
  });

  const result = await runDeliverableRoute({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    route: 'slides',
  });

  assert.equal(result.ok, false);
  assert.equal(result.run.status, 'failed');
  assert.equal(result.run.error.message, 'Unsupported route: slides');

  const stored = await getRun({ workspaceRoot, runId: result.run.run_id });
  assert.equal(stored.run.status, 'failed');
});
