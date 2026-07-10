// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  nativeEngineContract,
  readJson,
} from './helpers/ppt-native-ppt-runtime-fixtures.ts';
import { readCurrentProgramContract } from './helpers/current-program-contract.ts';

test('native PPT proof lane records the Python engine contract as the single ownership source', () => {
  const engineContract = nativeEngineContract();
  const proofLane = readJson(path.resolve('contracts/runtime-program/ppt-native-authoring-proof-lane.json'));
  const currentProgram = readCurrentProgramContract();

  assert.equal(engineContract.language, 'python');
  assert.deepEqual(engineContract.owned_routes, ['author_pptx_native', 'repair_pptx_native']);
  assert.deepEqual(engineContract.ai_first_boundary, {
    creative_owner: 'llm_agent',
    helper_role: 'execute_validate_export_only',
    template_substitution_allowed: false,
    helper_visual_default_inference_allowed: false,
    explicit_shape_quality_role_required: true,
    explicit_text_font_size_required: true,
    explicit_non_text_visible_style_required: true,
    blueprint_slide_substitution_allowed: false,
    editable_shape_plan_required: true,
    editable_shape_manifest_required: true,
    design_spec_lock_required: true,
    professional_design_brief_required: true,
    reference_design_profile_required: true,
    semantic_layout_selection_required: true,
    placeholder_capacity_required: true,
    template_layout_grammar_required: true,
    per_slide_layout_binding_required: true,
    per_page_visual_plan_required: true,
    ppt_master_style_discipline_adopted: [
      'spec_lock',
      'template_layout_grammar',
      'template_profile',
      'semantic_layout_selection',
      'reference_deck_analysis',
      'per_page_visual_plan',
      'svg_qa_before_export',
      'rendered_quality_gate',
    ],
    layout_intent_required: true,
    composition_signature_required: true,
    action_title_required: true,
    title_underline_motif_allowed: false,
    concrete_layout_variant_repetition_limit: 2,
    professional_design_pack_required: true,
    professional_design_pack_contract_ref: 'contracts/runtime-program/ppt-native-ai-first-design-pack.json',
    required_design_pack_sections: [
      'layout_archetype_taxonomy',
      'capacity_budgets',
      'font_floors',
      'connector_semantics',
      'layout_rhythm',
      'non_text_visual_requirements',
      'reference_discipline',
      'professional_style_registry',
    ],
  });
  assert.equal(
    proofLane.candidate_route_model.runtime_executor_proof.engine_contract,
    'contracts/runtime-program/ppt-native-python-engine-contract.json',
  );
  assert.equal(
    proofLane.candidate_route_model.native_ppt_quality_surface.quality_model,
    'shape_manifest_layout_metrics_v1',
  );
  assert.equal(engineContract.engine_capabilities.authoring_ir, 'redcube_svg_ir');
  assert.equal(engineContract.engine_capabilities.pptx_writer, 'officecli_pptx_materializer');
  assert.equal(engineContract.native_object_model.package_readback_schema_version, 1);
  assert.equal(engineContract.native_object_model.package_readback_evidence_source, 'pptx_package_readback');
  assert.equal(engineContract.native_object_model.pptx_sha256_required, true);
  assert.deepEqual(engineContract.presentation_semantics.package_readback_count_fields, [
    'notes_slide_count',
    'transition_count',
    'timing_node_count',
    'animation_count',
  ]);
  assert.equal(
    engineContract.presentation_semantics.animation_target_policy.stable_drawingml_group_target,
    'reject_before_materialization',
  );
  assert.deepEqual(
    engineContract.presentation_semantics.animation_target_policy.supported_top_level_kinds,
    ['text_box', 'shape', 'rect', 'rounded_rect', 'oval', 'path'],
  );
  assert.equal(
    engineContract.presentation_semantics.animation_target_policy.native_data_object_chart,
    'supported',
  );
  assert.deepEqual(
    engineContract.presentation_semantics.animation_target_policy.rejected_targets,
    ['missing', 'group_child', 'group', 'table', 'metric_grid', 'picture', 'line', 'connector'],
  );
  assert.equal(
    engineContract.presentation_semantics.animation_target_policy.zero_write_preflight_required,
    true,
  );
  assert.equal(engineContract.officecli_materializer_policy.skill_authoring_loop_adopted, false);
  assert.equal(engineContract.officecli_materializer_policy.view_issues_required, true);
  assert.equal(engineContract.officecli_materializer_policy.true_render_proof_substitute_allowed, false);
  assert.equal(engineContract.true_render_proof.required, true);
  assert.equal(
    proofLane.candidate_route_model.runtime_executor_proof.engine_capabilities.true_render_proof_required,
    true,
  );
  assert.equal(engineContract.native_ppt_quality_surface.fail_closed_when_missing, true);
  assert.equal(
    currentProgram.current_state.exploration_lanes.ppt_native_authoring_proof_lane.engine_contract,
    'contracts/runtime-program/ppt-native-python-engine-contract.json',
  );
});
