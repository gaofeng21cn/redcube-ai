import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDeliverableRecord,
  createOverlayRegistry,
} from '../packages/redcube-overlay-core/src/index.js';
import { buildTopicRecord as buildXiaohongshuTopic } from '../packages/redcube-overlay-xiaohongshu/src/index.js';
import { pptDeckOverlay } from '../packages/redcube-overlay-ppt/src/index.js';
import { xiaohongshuOverlay } from '../packages/redcube-overlay-xiaohongshu/src/index.js';

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
    ppt_deck: pptDeckOverlay,
    xiaohongshu: xiaohongshuOverlay,
  });

  assert.equal(registry.getOverlay('xiaohongshu').overlayId, 'xiaohongshu');
  assert.equal(registry.getOverlay('ppt_deck').overlayId, 'ppt_deck');
  assert.deepEqual(registry.listOverlays(), ['ppt_deck', 'xiaohongshu']);
  assert.deepEqual(
    registry.listProfiles('ppt_deck'),
    ['lecture_student', 'lecture_peer', 'executive_briefing', 'defense_deck'],
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

test('createOverlayRegistry rejects profile lookup for unknown overlays', () => {
  const registry = createOverlayRegistry({
    xiaohongshu: xiaohongshuOverlay,
  });

  assert.throws(
    () => registry.listProfiles('ppt_deck'),
    /Unknown overlay: ppt_deck/,
  );
  assert.equal(typeof buildXiaohongshuTopic, 'function');
});
