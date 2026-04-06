import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createOverlayRegistry,
  hydrateDeliverableContract,
} from '../packages/redcube-overlay-core/src/index.js';
import { pptDeckOverlay } from '../packages/redcube-overlay-ppt/src/index.js';
import { xiaohongshuOverlay } from '../packages/redcube-overlay-xiaohongshu/src/index.js';

test('createOverlayRegistry exposes family profiles for ppt_deck and xiaohongshu', () => {
  const registry = createOverlayRegistry({
    ppt_deck: pptDeckOverlay,
    xiaohongshu: xiaohongshuOverlay,
  });

  assert.deepEqual(registry.listOverlays(), ['ppt_deck', 'xiaohongshu']);
  assert.deepEqual(
    registry.listProfiles('ppt_deck'),
    ['lecture_student', 'lecture_peer', 'executive_briefing', 'defense_deck'],
  );
  assert.deepEqual(registry.listProfiles('xiaohongshu'), ['standard_note']);
});

test('hydrateDeliverableContract resolves ppt lecture_student contract as machine-readable surface', () => {
  const registry = createOverlayRegistry({
    ppt_deck: pptDeckOverlay,
  });

  const contract = hydrateDeliverableContract(registry, {
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });

  assert.equal(contract.overlay, 'ppt_deck');
  assert.equal(contract.profile_id, 'lecture_student');
  assert.equal(contract.deliverable_kind, 'ppt_deck');
  assert.equal(contract.goal, '为本科生讲授甲状腺基础知识');
  assert.deepEqual(
    contract.stage_sequence.stages.map((stage) => stage.stage_id),
    [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'render_html',
      'visual_director_review',
      'screenshot_review',
      'export_pptx',
    ],
  );
  assert.equal(
    contract.review_surface.required_checks.includes('term_explained_on_first_use'),
    true,
  );
  assert.equal(contract.layout_rules.density_mode, 'teaching_spread');
  assert.equal(contract.export_bundle.bundle_id, 'lecture_student_bundle');
  assert.equal(contract.prompt_pack.render_contract.render_strategy, 'prompt_director_first');
  assert.equal(contract.prompt_pack.render_contract.shell_file, 'render_shell.html');
  assert.equal(contract.prompt_pack.render_contract.recipe_registry.cover_hero, 'ppt.hero_signal');
  assert.equal(contract.prompt_pack.render_contract.recipe_registry.default, 'ppt.compare_zones');
});

test('hydrateDeliverableContract resolves xiaohongshu standard profile on shared runtime model', () => {
  const registry = createOverlayRegistry({
    xiaohongshu: xiaohongshuOverlay,
  });

  const contract = hydrateDeliverableContract(registry, {
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });

  assert.equal(contract.overlay, 'xiaohongshu');
  assert.equal(contract.profile_id, 'standard_note');
  assert.equal(contract.deliverable_kind, 'xiaohongshu_note');
  assert.deepEqual(
    contract.stage_sequence.stages.map((stage) => stage.stage_id),
    ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'publish_copy', 'export_bundle'],
  );
  assert.equal(contract.review_surface.required_checks.includes('platform_copy_complete'), true);
  assert.equal(contract.export_bundle.bundle_id, 'xiaohongshu_standard_bundle');
});

test('hydrateDeliverableContract rejects unknown profile_id for a family', () => {
  const registry = createOverlayRegistry({
    ppt_deck: pptDeckOverlay,
  });

  assert.throws(
    () => hydrateDeliverableContract(registry, {
      overlay: 'ppt_deck',
      profileId: 'not-exist',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '甲状腺门诊科普 deck',
      goal: '为本科生讲授甲状腺基础知识',
    }),
    /Unknown profile_id for overlay ppt_deck: not-exist/,
  );
});
