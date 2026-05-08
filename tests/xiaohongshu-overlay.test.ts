// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import {
  buildTopicRecord,
  buildXiaohongshuDeliverableRecord,
  evaluateStorylineGate,
  hydrateXiaohongshuContract,
} from './package-surfaces.ts';

test('buildTopicRecord emits canonical xiaohongshu topic metadata', () => {
  const topic = buildTopicRecord({ topicId: 'topic-a', title: '甲状腺科普系列' });

  assert.equal(topic.topic_id, 'topic-a');
  assert.equal(topic.overlay, 'xiaohongshu');
  assert.equal(topic.status, 'draft');
  assert.deepEqual(topic.routes, ['research', 'storyline', 'single_note_plan', 'visual_direction', 'author_image_pages', 'visual_director_review', 'screenshot_review', 'repair_image_pages', 'publish_copy', 'export_bundle']);
});

test('evaluateStorylineGate blocks empty storyline content', () => {
  const report = evaluateStorylineGate({ storylineText: '' });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.blockers, ['storyline_empty']);
});

test('evaluateStorylineGate passes well-formed storyline content', () => {
  const report = evaluateStorylineGate({
    storylineText: '# 叙事逻辑\n\n## 核心冲突\n\n围绕误区到行动组织内容。',
  });

  assert.equal(report.status, 'pass');
  assert.deepEqual(report.blockers, []);
});

test('hydrateXiaohongshuContract emits standard_note contract on shared runtime model', () => {
  const contract = hydrateXiaohongshuContract({
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
    profileId: 'standard_note',
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
  assert.equal(contract.export_bundle.bundle_id, 'xiaohongshu_standard_bundle');
  assert.equal(contract.prompt_pack.render_contract.compiler_module ?? null, null);
  assert.equal(contract.prompt_pack.render_contract.compiler_export ?? null, null);
  assert.equal(contract.prompt_pack.render_contract.render_strategy, 'image_first_page_authoring');
  assert.equal(contract.prompt_pack.render_contract.default_visual_route, 'author_image_pages');
  assert.equal(contract.prompt_pack.render_contract.image_generation.default_model, 'gpt-image-2');
  assert.equal(contract.prompt_pack.render_contract.image_generation.size, '1086x1448');
  assert.equal(contract.prompt_pack.render_contract.image_generation.output_mode, 'full_page_png');
  assert.equal(contract.prompt_pack.render_contract.image_generation.canvas.ratio, '3:4');
  assert.equal(
    contract.prompt_pack.render_contract.image_generation.default_style_profile,
    'prompts/xiaohongshu/image-first-default-style-profile.json',
  );
  assert.equal(
    contract.prompt_pack.render_contract.image_generation.built_in_style_reference_dir,
    'prompts/xiaohongshu/style-references/medical-handdrawn-note-default',
  );
  assert.equal(
    contract.prompt_pack.render_contract.image_generation.style_reference_override_semantics,
    'operator_style_reference_dir_replaces_built_in_reference_manifest_for_visual_style_only',
  );
  assert.deepEqual(
    contract.prompt_pack.render_contract.selectable_explicit_routes,
    ['render_html', 'fix_html'],
  );
  assert.equal(
    contract.prompt_pack.render_contract.ui_ux_quality_companion.source_skill_id,
    'ui-ux-pro-max',
  );
  assert.equal(
    contract.prompt_pack.render_contract.ui_ux_quality_companion.activation_surface,
    'internal_stage_context',
  );
  assert.deepEqual(
    contract.prompt_pack.render_contract.ui_ux_quality_companion.applies_to_routes,
    ['render_html', 'fix_html'],
  );
  assert.equal(
    contract.prompt_pack.render_contract.ui_ux_quality_companion.public_skill_policy,
    'do_not_register_as_public_redcube_skill',
  );
  assert.equal(contract.delivery_contract.required_export_route, 'export_bundle');
  assert.equal(contract.delivery_contract.human_gate.required, true);
});

test('xiaohongshu built-in image-first style template is sanitized and style-only', () => {
  const profileFile = path.resolve('prompts/xiaohongshu/image-first-default-style-profile.json');
  const referenceDir = path.resolve('prompts/xiaohongshu/style-references/medical-handdrawn-note-default');
  const manifestFile = path.join(referenceDir, 'manifest.json');
  const profile = JSON.parse(readFileSync(profileFile, 'utf-8'));
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf-8'));

  assert.equal(profile.profile_id, 'xiaohongshu_image_first_medical_handdrawn_note_default_v1');
  assert.equal(profile.default_canvas.aspect_ratio, '3:4');
  assert.equal(profile.production_quality_system.source_workbench_evidence.length, 6);
  assert.equal(profile.production_quality_system.density_standard, 'medium_density_mobile_readable');
  assert.equal(profile.production_quality_system.default_information_page_structure.includes('one core judgement'), true);
  assert.equal(profile.production_quality_system.default_information_page_structure.includes('three short main information modules'), true);
  assert.equal(profile.production_quality_system.text_density_targets.complex_mechanism_page_max_modules, 4);
  assert.equal(profile.production_quality_system.layout_quality_gates.unique_layout_count_min, 3);
  assert.equal(profile.production_quality_system.layout_quality_gates.bottom_half_substantive_module_required, true);
  assert.equal(profile.production_quality_system.blocking_regressions.includes('keyword-only low-density pages that omit judgement or action boundary'), true);
  assert.equal(profile.delivery_quality_surfaces.final_image_set_policy.includes('slide_*.png'), true);
  assert.equal(profile.delivery_quality_surfaces.contact_sheet_review_policy.includes('contact-sheet'), true);
  assert.equal(profile.built_in_reference_template.reference_scope, 'visual_style_only');
  assert.equal(profile.built_in_reference_template.default_runtime_use, 'style_manifest_and_operator_reference_only');
  assert.equal(profile.built_in_reference_template.author_identity_policy.includes('naturally free of visible author names'), true);
  assert.equal(profile.style_reference_policy.default_reference_dir, 'prompts/xiaohongshu/style-references/medical-handdrawn-note-default');
  assert.equal(profile.style_reference_policy.user_override_field, 'style_reference_dir');
  assert.equal(profile.style_reference_policy.override_semantics.includes('replace'), true);
  assert.equal(manifest.reference_scope, 'visual_style_only');
  assert.equal(manifest.runtime_use.default_request_parameter, false);
  assert.equal(manifest.runtime_use.default_artifact_copy, false);
  assert.equal(manifest.author_identity_policy.visible_author_identity_allowed, false);
  assert.equal(manifest.author_identity_policy.visible_qr_or_logo_allowed, false);
  assert.equal(manifest.author_identity_policy.notes.includes('naturally no-author interior pages'), true);
  assert.equal(manifest.fact_copy_policy.copy_reference_facts_allowed, false);
  assert.equal(manifest.images.length, 3);
  for (const image of manifest.images) {
    assert.equal(existsSync(path.join(referenceDir, image.file)), true, image.file);
    assert.match(image.file, /no_author\.png$/);
  }
});

test('buildXiaohongshuDeliverableRecord emits canonical xiaohongshu deliverable metadata', () => {
  const hydratedContract = hydrateXiaohongshuContract({
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
    profileId: 'standard_note',
  });
  const deliverable = buildXiaohongshuDeliverableRecord({
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
    profileId: 'standard_note',
    hydratedContract,
  });

  assert.equal(deliverable.overlay, 'xiaohongshu');
  assert.equal(deliverable.kind, 'xiaohongshu_note');
  assert.equal(deliverable.deliverable_kind, 'xiaohongshu_note');
  assert.equal(deliverable.profile_id, 'standard_note');
  assert.equal(deliverable.hydrated_contract_ref, 'contracts/hydrated-deliverable.json');
  assert.deepEqual(deliverable.routes, ['research', 'storyline', 'single_note_plan', 'visual_direction', 'author_image_pages', 'visual_director_review', 'screenshot_review', 'repair_image_pages', 'publish_copy', 'export_bundle']);
});
