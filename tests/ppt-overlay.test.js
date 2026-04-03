import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDeckRecord,
  evaluateStoryboardGate,
} from '../packages/redcube-overlay-ppt/src/index.js';

test('buildDeckRecord emits canonical ppt deck metadata', () => {
  const deck = buildDeckRecord({
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
  });

  assert.equal(deck.topic_id, 'topic-a');
  assert.equal(deck.deliverable_id, 'deck-a');
  assert.equal(deck.title, '甲状腺门诊科普 deck');
  assert.equal(deck.overlay, 'ppt_deck');
  assert.equal(deck.kind, 'ppt_deck');
  assert.equal(deck.slide_ratio, '16:9');
  assert.equal(deck.status, 'draft');
  assert.deepEqual(deck.routes, ['storyline']);
});

test('buildDeckRecord rejects blank required fields', () => {
  assert.throws(
    () => buildDeckRecord({
      topicId: 'topic-a',
      deliverableId: '',
      title: '甲状腺门诊科普 deck',
    }),
    /Missing deliverable field: deliverableId/,
  );
});

test('evaluateStoryboardGate blocks empty slide list', () => {
  const report = evaluateStoryboardGate({ slides: [] });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.blockers, ['slides_empty']);
  assert.equal(report.metrics.slide_count, 0);
  assert.equal(report.next_action, 'rerun_storyboard');
});

test('evaluateStoryboardGate passes when storyboard has slides', () => {
  const report = evaluateStoryboardGate({
    slides: [
      { slide_id: 'slide-1', title: '问题提出' },
      { slide_id: 'slide-2', title: '方法路径' },
    ],
  });

  assert.equal(report.status, 'pass');
  assert.deepEqual(report.blockers, []);
  assert.equal(report.metrics.slide_count, 2);
  assert.equal(report.next_action, 'continue');
});

test('evaluateStoryboardGate blocks malformed slide entries', () => {
  const report = evaluateStoryboardGate({
    slides: [null, {}],
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.blockers, ['slides_invalid']);
  assert.equal(report.metrics.slide_count, 0);
  assert.equal(report.next_action, 'rerun_storyboard');
});
