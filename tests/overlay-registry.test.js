import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDeliverableRecord,
  createOverlayRegistry,
} from '../packages/redcube-overlay-core/src/index.js';
import { getDefaultOverlayCatalog } from '../packages/redcube-overlay-registry/src/index.js';
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

test('getDefaultOverlayCatalog exposes canonical overlay metadata for onboarding discovery', () => {
  const catalog = getDefaultOverlayCatalog();
  const ppt = catalog.overlays.find((overlay) => overlay.overlay_id === 'ppt_deck');
  const xiaohongshu = catalog.overlays.find((overlay) => overlay.overlay_id === 'xiaohongshu');
  const poster = catalog.overlays.find((overlay) => overlay.overlay_id === 'poster_onepager');

  assert.equal(catalog.surface_kind, 'overlay_catalog');
  assert.deepEqual(
    ppt,
    {
      overlay_id: 'ppt_deck',
      default_profile_id: 'lecture_student',
      profiles: ['lecture_student', 'lecture_peer', 'executive_briefing', 'defense_deck'],
      route_sequence: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'fix_html', 'export_pptx'],
      deliverable_kind: 'ppt_deck',
      prompt_pack_id: 'ppt_deck_mainline_v1',
      packages: {
        overlay: '@redcube/overlay-ppt',
        runtime_family: '@redcube/runtime-family-ppt',
        pack: '@redcube/pack-ppt',
      },
    },
  );
  assert.deepEqual(
    xiaohongshu,
    {
      overlay_id: 'xiaohongshu',
      default_profile_id: 'standard_note',
      profiles: ['standard_note'],
      route_sequence: ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'fix_html', 'publish_copy', 'export_bundle'],
      deliverable_kind: 'xiaohongshu_note',
      prompt_pack_id: 'xiaohongshu_mainline_v1',
      packages: {
        overlay: '@redcube/overlay-xiaohongshu',
        runtime_family: '@redcube/runtime-family-xiaohongshu',
        pack: '@redcube/pack-xiaohongshu',
      },
    },
  );
  assert.deepEqual(
    poster,
    {
      overlay_id: 'poster_onepager',
      default_profile_id: 'knowledge_poster',
      profiles: ['knowledge_poster'],
      route_sequence: ['storyline', 'poster_blueprint', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'export_bundle'],
      deliverable_kind: 'poster_onepager',
      prompt_pack_id: 'poster_onepager_mainline_v1',
      packages: {
        overlay: '@redcube/overlay-poster-onepager',
        runtime_family: '@redcube/runtime-family-poster-onepager',
        pack: '@redcube/pack-poster-onepager',
      },
    },
  );
});
