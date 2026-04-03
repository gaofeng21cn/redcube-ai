import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDeliverableRecord,
  createOverlayRegistry,
} from '../packages/redcube-overlay-core/src/index.js';
import { buildTopicRecord as buildXiaohongshuTopic } from '../packages/redcube-overlay-xiaohongshu/src/index.js';

test('buildDeliverableRecord emits canonical visual-deliverable metadata', () => {
  const deliverable = buildDeliverableRecord({
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    overlay: 'ppt_deck',
    kind: 'ppt_deck',
    title: '甲状腺门诊宣教 deck',
  });

  assert.equal(deliverable.topic_id, 'topic-a');
  assert.equal(deliverable.deliverable_id, 'deck-a');
  assert.equal(deliverable.overlay, 'ppt_deck');
  assert.equal(deliverable.kind, 'ppt_deck');
  assert.equal(deliverable.title, '甲状腺门诊宣教 deck');
  assert.equal(deliverable.status, 'draft');
});

test('buildDeliverableRecord rejects blank required fields', () => {
  assert.throws(
    () => buildDeliverableRecord({
      topicId: 'topic-a',
      deliverableId: '   ',
      overlay: 'ppt_deck',
      kind: 'ppt_deck',
      title: '甲状腺门诊宣教 deck',
    }),
    /Missing deliverable field: deliverableId/,
  );
});

test('createOverlayRegistry resolves registered overlays by id', () => {
  const registry = createOverlayRegistry({
    xiaohongshu: { overlayId: 'xiaohongshu', buildTopicRecord: buildXiaohongshuTopic },
  });

  assert.equal(registry.getOverlay('xiaohongshu').overlayId, 'xiaohongshu');
  assert.deepEqual(registry.listOverlays(), ['xiaohongshu']);
  assert.throws(
    () => registry.getOverlay('ppt_deck'),
    /Unknown overlay: ppt_deck/,
  );
});

test('createOverlayRegistry rejects overlayId mismatch against registry key', () => {
  assert.throws(
    () => createOverlayRegistry({
      xiaohongshu: { overlayId: 'ppt_deck', buildTopicRecord: buildXiaohongshuTopic },
    }),
    /Overlay registry key mismatch: expected xiaohongshu, got ppt_deck/,
  );
});
