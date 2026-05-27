// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createOverlayRegistry,
  getDefaultOverlayRegistry,
  hydrateDeliverableContract,
  pptDeckOverlay,
  xiaohongshuOverlay,
} from './package-surfaces.ts';

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
      'author_image_pages',
      'visual_director_review',
      'screenshot_review',
      'repair_image_pages',
      'export_pptx',
    ],
  );
  assert.equal(
    contract.review_surface.required_checks.includes('term_explained_on_first_use'),
    true,
  );
  assert.equal(contract.layout_rules.density_mode, 'teaching_spread');
  assert.equal(contract.export_bundle.bundle_id, 'lecture_student_bundle');
  assert.equal(contract.prompt_pack.render_contract.render_strategy, 'image_first_page_authoring');
  assert.equal(contract.prompt_pack.render_contract.default_visual_route, 'author_image_pages');
  assert.equal(contract.prompt_pack.render_contract.image_page_authoring_lane.status, 'production_default');
  assert.equal(contract.prompt_pack.render_contract.image_page_authoring_lane.default_enabled, true);
  assert.equal(contract.prompt_pack.render_contract.image_page_authoring_lane.style_reference_dir_input, 'delivery_request.style_reference_dir');
  assert.equal(
    contract.prompt_pack.render_contract.image_page_authoring_lane.fact_governance.verification_ledger_surface,
    'reports/fact-verification-ledger.json',
  );
  assert.equal(
    contract.prompt_pack.render_contract.image_page_authoring_lane.verified_asset_overlay_policy.deterministic_overlay_only,
    true,
  );
  assert.equal(
    contract.prompt_pack.render_contract.image_page_authoring_lane.long_deck_production_contract.canonical_slide_naming,
    'slideNN-short-name.png',
  );
  assert.equal(contract.prompt_pack.render_contract.html_authoring_lane.status, 'production_selectable_optional');
  assert.equal(contract.prompt_pack.render_contract.html_authoring_lane.default_enabled, false);
  assert.equal(contract.prompt_pack.render_contract.native_ppt_proof_lane.status, 'production_selectable_optional');
  assert.equal(contract.prompt_pack.render_contract.native_ppt_proof_lane.default_enabled, false);
  assert.equal(contract.prompt_pack.render_contract.native_ppt_proof_lane.production_selectable, true);
  assert.equal(contract.prompt_pack.render_contract.native_ppt_proof_lane.review_input_surface, 'rendered_pptx_screenshots');
  assert.equal(
    contract.prompt_pack.render_contract.native_ppt_proof_lane.engine_capabilities.true_render_proof_renderer,
    'libreoffice_headless',
  );
  assert.equal(
    contract.prompt_pack.render_contract.native_ppt_proof_lane.officecli_materializer_policy.skill_authoring_loop_adopted,
    false,
  );
  assert.equal(
    contract.prompt_pack.render_contract.native_ppt_proof_lane.officecli_materializer_policy.current_pptx_writer,
    'redcube_drawingml_writer',
  );
  assert.deepEqual(
    contract.prompt_pack.render_contract.native_ppt_proof_lane.officecli_materializer_policy.required_gate_refs,
    ['officecli_save_before_close', 'officecli_validate', 'officecli_view_issues', 'officecli_view_text'],
  );
  assert.equal(
    contract.prompt_pack.render_contract.native_ppt_proof_lane.officecli_materializer_policy.true_render_proof_substitute_allowed,
    false,
  );
  assert.equal(
    contract.prompt_pack.render_contract.native_ppt_proof_lane.true_render_proof.renderer_kind,
    'libreoffice_headless',
  );
  assert.equal(
    contract.prompt_pack.render_contract.native_ppt_proof_lane.true_render_proof.renderer_selection_policy,
    'capability_probe_auto_bootstrap',
  );
  assert.equal(
    contract.prompt_pack.render_contract.native_ppt_proof_lane.true_render_proof.user_preinstalled_libreoffice_required,
    false,
  );
  assert.equal(
    contract.prompt_pack.render_contract.native_ppt_proof_lane.true_render_proof.supported_renderers[0].renderer_pipeline,
    'libreoffice_headless_pdf_png_v1',
  );
  assert.equal(
    contract.prompt_pack.render_contract.native_ppt_proof_lane.true_render_proof.bootstrap_policy.repo_owned_installer,
    'tools/native-ppt-proof/install-deps.sh',
  );
  assert.equal(
    contract.prompt_pack.render_contract.native_ppt_proof_lane.true_render_proof.fail_closed_blocker.typed_blocker,
    'missing_renderer_dependency',
  );
  assert.equal(
    contract.prompt_pack.render_contract.native_ppt_proof_lane.true_render_proof.renderer_pipeline,
    'libreoffice_headless_pdf_png_v1',
  );
  assert.equal(
    contract.prompt_pack.render_contract.native_ppt_proof_lane.true_render_proof.runtime,
    'libreoffice_headless',
  );
  assert.equal(
    contract.prompt_pack.render_contract.native_ppt_proof_lane.true_render_proof.cross_platform_render_required,
    true,
  );
  assert.deepEqual(
    contract.prompt_pack.render_contract.native_ppt_proof_lane.replaces_routes,
    ['author_image_pages', 'repair_image_pages'],
  );
  assert.deepEqual(
    contract.prompt_pack.render_contract.native_ppt_proof_lane.legacy_html_replaces_routes,
    ['render_html', 'fix_html'],
  );
  assert.equal(contract.prompt_pack.render_contract.shell_file, 'render_shell.html');
  assert.equal(contract.prompt_pack.render_contract.recipe_registry.cover_hero, 'ppt.hero_signal');
  assert.equal(contract.prompt_pack.render_contract.recipe_registry.default, 'ppt.compare_zones');
  assert.equal(contract.source_truth_contract.authoritative_surface, 'shared_source_truth');
  assert.equal(contract.source_truth_contract.route_to_consumption_role.visual_direction, 'visual_authorship');
  assert.equal(contract.delivery_contract.required_export_route, 'export_pptx');
  assert.equal(contract.delivery_contract.required_export_bundle_id, 'lecture_student_bundle');
  assert.equal(contract.delivery_contract.human_gate.required, false);
  assert.equal(contract.lifecycle_stage_contract.stage_model, 'direct_delivery_human_workline');
  assert.deepEqual(contract.lifecycle_stage_contract.human_workline, ['source_readiness', 'storyline', 'plan', 'visual', 'delivery']);
  assert.equal(contract.lifecycle_stage_contract.human_to_macro_stage.plan, 'story_architecture');
  assert.equal(contract.lifecycle_stage_contract.review_overlay_within, 'visual');
  assert.equal(contract.lifecycle_stage_contract.operator_handoff_within, 'delivery');
  assert.equal(contract.lifecycle_stage_contract.route_to_human_stage.detailed_outline, 'plan');
  assert.equal(contract.lifecycle_stage_contract.route_to_human_stage.export_pptx, 'delivery');
  assert.equal(contract.delivery_contract.operator_handoff.owner_surface, 'required_export_artifact.delivery_state');
  assert.equal(contract.delivery_contract.operator_handoff.handoff_ready_state, 'output_ready');
  assert.deepEqual(
    contract.delivery_contract.operator_handoff.gate_surfaces,
    ['auditDeliverable', 'runtimeWatch', 'getReviewState', 'getPublicationProjection'],
  );
  assert.equal(contract.delivery_contract.operator_handoff.reopen_mutation_surface, 'request_changes');
  assert.equal(contract.delivery_contract.operator_handoff.closeout_mutation_surface, 'promote_baseline');
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
    ['research', 'storyline', 'single_note_plan', 'visual_direction', 'author_image_pages', 'visual_director_review', 'screenshot_review', 'repair_image_pages', 'publish_copy', 'export_bundle'],
  );
  assert.deepEqual(
    contract.stage_sequence.alternate_stages.map((stage) => stage.stage_id),
    ['render_html', 'fix_html'],
  );
  assert.equal(contract.review_surface.required_checks.includes('platform_copy_complete'), true);
  assert.equal(contract.export_bundle.bundle_id, 'xiaohongshu_standard_bundle');
  assert.equal(contract.source_truth_contract.authoritative_surface, 'shared_source_truth');
  assert.equal(contract.source_truth_contract.route_to_consumption_role.research, 'source_readiness');
  assert.equal(contract.delivery_contract.required_export_route, 'export_bundle');
  assert.equal(contract.delivery_contract.required_export_bundle_id, 'xiaohongshu_standard_bundle');
  assert.equal(contract.delivery_contract.human_gate.required, true);
  assert.equal(Object.hasOwn(contract, 'lifecycle_stage_contract'), false);
  assert.equal(Object.hasOwn(contract.delivery_contract, 'operator_handoff'), false);
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

test('hydrateDeliverableContract resolves poster_onepager knowledge_poster contract as machine-readable surface', () => {
  const registry = getDefaultOverlayRegistry();

  const contract = hydrateDeliverableContract(registry, {
    overlay: 'poster_onepager',
    profileId: 'knowledge_poster',
    topicId: 'topic-a',
    deliverableId: 'poster-a',
    title: '甲状腺门诊知识海报',
    goal: '为门诊患者生成单页知识海报',
  });

  assert.equal(contract.overlay, 'poster_onepager');
  assert.equal(contract.profile_id, 'knowledge_poster');
  assert.equal(contract.deliverable_kind, 'poster_onepager');
  assert.deepEqual(
    contract.stage_sequence.stages.map((stage) => stage.stage_id),
    ['storyline', 'poster_blueprint', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'export_bundle'],
  );
  assert.equal(contract.prompt_pack.pack_id, 'poster_onepager_mainline_v1');
  assert.equal(contract.export_bundle.bundle_id, 'poster_onepager_bundle');
  assert.equal(contract.source_truth_contract.authoritative_surface, 'shared_source_truth');
  assert.equal(contract.source_truth_contract.poster_guarded_boundary.academic_contract_active, false);
  assert.equal(contract.lifecycle_stage_contract.stage_model, 'direct_delivery_human_workline');
  assert.deepEqual(contract.lifecycle_stage_contract.human_workline, ['source_readiness', 'storyline', 'plan', 'visual', 'delivery']);
  assert.equal(contract.lifecycle_stage_contract.human_to_macro_stage.plan, 'story_architecture');
  assert.equal(contract.lifecycle_stage_contract.review_overlay_within, 'visual');
  assert.equal(contract.lifecycle_stage_contract.operator_handoff_within, 'delivery');
  assert.equal(contract.lifecycle_stage_contract.route_to_human_stage.poster_blueprint, 'plan');
  assert.equal(contract.lifecycle_stage_contract.route_to_human_stage.export_bundle, 'delivery');
  assert.equal(contract.delivery_contract.required_export_route, 'export_bundle');
  assert.equal(contract.delivery_contract.required_export_bundle_id, 'poster_onepager_bundle');
  assert.equal(contract.delivery_contract.human_gate.required, false);
  assert.equal(contract.delivery_contract.operator_handoff.owner_surface, 'required_export_artifact.delivery_state');
  assert.equal(contract.delivery_contract.operator_handoff.handoff_ready_state, 'output_ready');
  assert.equal(contract.delivery_contract.operator_handoff.reopen_mutation_surface, 'request_changes');
  assert.equal(contract.delivery_contract.operator_handoff.closeout_mutation_surface, 'promote_baseline');
});
