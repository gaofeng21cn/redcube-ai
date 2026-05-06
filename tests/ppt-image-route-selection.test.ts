// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';

import { hydratePptDeckContract } from '@redcube/overlay-ppt';

function stageIds(contract) {
  return contract.stage_sequence.stages.map((stage) => stage.stage_id);
}

function alternateStageIds(contract) {
  return contract.stage_sequence.alternate_stages.map((stage) => stage.stage_id);
}

test('ppt_deck defaults to image-first page authoring and keeps html/native explicit lanes selectable', () => {
  const contract = hydratePptDeckContract({
    topicId: 'topic-route',
    deliverableId: 'deck-route',
    title: 'Route selection',
    profileId: 'lecture_student',
    goal: 'Verify image-first default route selection.',
  });

  assert.deepEqual(stageIds(contract), [
    'storyline',
    'detailed_outline',
    'slide_blueprint',
    'visual_direction',
    'author_image_pages',
    'visual_director_review',
    'screenshot_review',
    'repair_image_pages',
    'export_pptx',
  ]);
  assert.deepEqual(alternateStageIds(contract), [
    'render_html',
    'fix_html',
    'author_pptx_native',
    'repair_pptx_native',
  ]);
  assert.equal(contract.prompt_pack.render_contract.default_visual_route, 'author_image_pages');
  assert.equal(contract.prompt_pack.render_contract.render_strategy, 'image_first_page_authoring');
  assert.equal(
    contract.prompt_pack.render_contract.image_page_authoring_lane.fact_governance.fact_whitelist_surface,
    'shared_source_truth.readable_shared_source_truth_fields',
  );
  assert.equal(
    contract.prompt_pack.render_contract.image_page_authoring_lane.verified_asset_overlay_policy.model_generation_forbidden.includes('QR code'),
    true,
  );
  assert.equal(
    contract.prompt_pack.render_contract.image_page_authoring_lane.long_deck_production_contract.rejected_repair_route_policy.forbidden_for_page_fixes.includes('PIL composition patch'),
    true,
  );
  assert.deepEqual(contract.prompt_pack.render_contract.selectable_explicit_routes, [
    'render_html',
    'fix_html',
    'author_pptx_native',
    'repair_pptx_native',
  ]);
  assert.equal(contract.prompt_pack.render_contract.html_authoring_lane.explicit_selection_required, true);
  assert.equal(contract.prompt_pack.render_contract.native_ppt_proof_lane.default_enabled, false);
});

test('ppt_deck screenshot rerun policy targets image page repair by default', () => {
  const contract = hydratePptDeckContract({
    topicId: 'topic-route',
    deliverableId: 'deck-rerun',
    title: 'Route selection',
    profileId: 'lecture_student',
    goal: 'Verify image-first repair route policy.',
  });

  assert.equal(contract.review_surface.rerun_from_stage.overflow_free, 'repair_image_pages');
  assert.equal(contract.review_surface.rerun_from_stage.occlusion_free, 'repair_image_pages');
  assert.equal(contract.review_surface.rerun_from_stage.block_content_fit_ok, 'repair_image_pages');
  assert.deepEqual(contract.stage_requirements.repair_image_pages.requires_artifacts, [
    'author_image_pages',
    'screenshot_review',
  ]);
});
