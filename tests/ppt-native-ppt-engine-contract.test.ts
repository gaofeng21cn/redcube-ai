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

test('native PPT professional registries land ppt-master learning without importing its runtime or assets', () => {
  const designPack = readJson(
    path.resolve('contracts/runtime-program/ppt-native-ai-first-design-pack.json'),
  );
  const landing = readJson(
    path.resolve('contracts/runtime-program/ppt-master-learning-landing.json'),
  );

  assert.equal(
    landing.external_source.commit,
    'b0beba5b659c664bdbf0c07227fbdee313698dd7',
  );
  assert.equal(landing.external_source.role, 'pattern_source_only');
  assert.equal(landing.audit_status, 'non_live_functional_landing_complete');
  assert.equal(landing.claims_live_evidence_complete, false);
  assert.equal(landing.claims_visual_ready, false);
  assert.equal(landing.claims_owner_receipt, false);
  assert.deepEqual(landing.prohibited_imports, [
    'runtime',
    'claude_specific_protocol',
    'template_assets',
    'icon_corpus',
    'svg_template_bodies',
  ]);

  const modes = designPack.communication_mode_registry.modes;
  assert.deepEqual(modes.map((entry: any) => entry.mode_id), [
    'decision_pyramid',
    'narrative_arc',
    'instructional_sequence',
    'visual_showcase',
    'neutral_briefing',
  ]);
  for (const mode of modes) {
    assert.equal(typeof mode.use_when, 'string');
    assert.ok(mode.argument_sequence.length >= 3);
    assert.ok(mode.title_voice.length > 0);
    assert.ok(mode.notes_register.length > 0);
    assert.ok(mode.forbidden.length > 0);
  }
  assert.equal(designPack.communication_mode_registry.custom_escape.mode_id, 'custom');
  assert.equal(
    designPack.communication_mode_registry.custom_escape.mode_behavior_required,
    true,
  );
  assert.equal(
    designPack.communication_mode_registry.mode_and_style_locked_independently,
    true,
  );

  const patterns = designPack.visualization_pattern_registry.patterns;
  assert.ok(patterns.length >= 18);
  assert.equal(new Set(patterns.map((entry: any) => entry.pattern_id)).size, patterns.length);
  for (const pattern of patterns) {
    assert.equal(typeof pattern.content_shape, 'string');
    assert.equal(typeof pattern.use_when, 'string');
    assert.equal(typeof pattern.skip_when, 'string');
    assert.ok(pattern.accepted_object_families.length > 0);
    assert.ok(pattern.required_observable_semantics.length > 0);
    assert.ok(pattern.owner_skills.length > 0);
  }
  assert.equal(
    designPack.visualization_pattern_registry.no_match_policy,
    'author_bespoke_composition_and_record_selection_rationale',
  );
  assert.equal(
    designPack.visualization_pattern_registry.copy_upstream_svg_body_allowed,
    false,
  );
  assert.ok(designPack.professional_style_registry.profiles.length >= 7);

  const modeCoverage = landing.source_catalog_coverage.communication_modes;
  assert.deepEqual(modeCoverage.entries.map((entry: any) => entry.source_id), [
    'pyramid',
    'narrative',
    'instructional',
    'showcase',
    'briefing',
  ]);
  assert.equal(modeCoverage.custom_escape.source_id, 'custom');

  const styleCoverage = landing.source_catalog_coverage.visual_styles.entries;
  assert.equal(styleCoverage.length, 18);
  assert.equal(new Set(styleCoverage.map((entry: any) => entry.source_id)).size, 18);

  const visualizationCoverage = landing.source_catalog_coverage.visualizations.entries;
  assert.equal(visualizationCoverage.length, 76);
  assert.equal(
    new Set(visualizationCoverage.map((entry: any) => entry.source_id)).size,
    76,
  );
  const localModeIds = new Set(modes.map((entry: any) => entry.mode_id));
  const localStyleIds = new Set(
    designPack.professional_style_registry.profiles.map((entry: any) => entry.profile_id),
  );
  localStyleIds.add(designPack.professional_style_registry.custom_escape.profile_id);
  const localPatternIds = new Set(patterns.map((entry: any) => entry.pattern_id));
  for (const entry of modeCoverage.entries) {
    assert.equal(entry.classification, 'adapt');
    assert.ok(localModeIds.has(entry.local_target_id));
    assert.equal(typeof entry.owner_skill, 'string');
    assert.equal(typeof entry.consumer_field, 'string');
  }
  for (const entry of styleCoverage) {
    assert.equal(entry.classification, 'adapt');
    assert.ok(localStyleIds.has(entry.local_target_id));
    assert.equal(typeof entry.owner_skill, 'string');
    assert.equal(typeof entry.consumer_field, 'string');
  }
  for (const entry of visualizationCoverage) {
    assert.equal(entry.classification, 'adapt');
    assert.ok(localPatternIds.has(entry.local_target_id));
    assert.equal(typeof entry.owner_skill, 'string');
    assert.equal(typeof entry.consumer_field, 'string');
  }

  const inspectedWorkflowPaths = landing.external_source.inspected_paths
    .filter((entry: string) => entry.startsWith('skills/ppt-master/workflows/'));
  assert.equal(inspectedWorkflowPaths.length, 17);
  const workflowCoverage = landing.workflow_coverage;
  const classifiedWorkflowPaths = workflowCoverage
    .flatMap((entry: any) => entry.workflow_refs);
  assert.deepEqual(
    [...classifiedWorkflowPaths].sort(),
    [...inspectedWorkflowPaths].sort(),
  );
  assert.equal(new Set(classifiedWorkflowPaths).size, 17);
  for (const entry of workflowCoverage) {
    assert.ok(['adopt', 'adapt', 'watch_only', 'reject', 'no_code_needed'].includes(entry.classification));
    assert.ok(entry.local_owner_surface.length > 0);
    assert.ok(entry.acceptance_evidence.length > 0);
  }
  const templateCreation = workflowCoverage.find((entry: any) => (
    entry.workflow_refs.includes('skills/ppt-master/workflows/create-template.md')
  ));
  assert.equal(templateCreation.classification, 'watch_only');
  assert.match(templateCreation.authority_boundary, /do not infer template creation/);
  const brandCreation = workflowCoverage.find((entry: any) => (
    entry.workflow_refs.includes('skills/ppt-master/workflows/create-brand.md')
  ));
  assert.equal(brandCreation.classification, 'adapt');
  assert.match(brandCreation.authority_boundary, /does not extract or publish a reusable identity package/);
  assert.equal(brandCreation.excluded_watch_only_capability.classification, 'watch_only');
  const beautify = workflowCoverage.find((entry: any) => (
    entry.workflow_refs.includes('skills/ppt-master/workflows/beautify-pptx.md')
  ));
  assert.equal(beautify.classification, 'adapt');
  assert.match(beautify.authority_boundary, /does not cover arbitrary imported PPTX/);
  assert.equal(beautify.excluded_watch_only_capability.classification, 'watch_only');
  const chartVerification = workflowCoverage.find((entry: any) => (
    entry.workflow_refs.includes('skills/ppt-master/workflows/verify-charts.md')
  ));
  assert.equal(chartVerification.classification, 'adapt');
  assert.deepEqual(chartVerification.acceptance_evidence, [
    'test:ppt-native-object-package',
    'test:ppt-native-quality-package-readback',
  ]);
  assert.match(chartVerification.authority_boundary, /do not copy the upstream SVG coordinate calculator/);
  const browserPreview = workflowCoverage.find((entry: any) => (
    entry.workflow_refs.includes('skills/ppt-master/workflows/live-preview.md')
  ));
  assert.equal(browserPreview.classification, 'adapt');
  assert.match(browserPreview.authority_boundary, /do not copy the interactive private editor or annotation UI/);

  const candidates = landing.learning_candidates;
  assert.deepEqual(
    [...new Set(candidates.map((entry: any) => entry.classification))].sort(),
    ['adapt', 'adopt', 'reject', 'watch_only'],
  );
  const previewCandidate = candidates.find((entry: any) => (
    entry.candidate_id === 'existing_preview_review_calibration_reexport'
  ));
  assert.equal(previewCandidate.classification, 'adapt');
  assert.match(previewCandidate.authority_boundary, /interactive private editor and annotation UI are rejected/);
  for (const candidate of candidates) {
    assert.ok(candidate.source_ref.length > 0);
    assert.ok(candidate.local_owner_surface.length > 0);
    assert.ok(candidate.consumer_fields.length > 0);
    assert.ok(candidate.acceptance_evidence.length > 0);
    assert.ok(candidate.authority_boundary.length > 0);
    assert.ok(candidate.stop_condition.length > 0);
  }

  const skillBindings = landing.skill_consumption_bindings;
  assert.deepEqual(skillBindings.map((entry: any) => entry.skill_id).sort(), [
    'rca-native-ppt-designer',
    'rca-ppt-reviewer',
    'rca-ppt-story-architect',
    'rca-ppt-visual-director',
    'rca-template-profiler',
  ]);
  for (const binding of skillBindings) {
    assert.equal(
      binding.design_pack_ref,
      'contracts/runtime-program/ppt-native-ai-first-design-pack.json',
    );
    assert.match(binding.resource_pack_ref, /^skill_resource:/);
    assert.ok(binding.consumes.length > 0);
    assert.ok(binding.emits.length > 0);
    assert.ok(binding.stop_condition.length > 0);
  }

  const completionAudit = readJson(path.resolve(
    'contracts/runtime-program/current-program-parts/current_state/plan_completion_audit.json',
  ));
  const nonLiveBasis = completionAudit.scope.native_ppt_non_live_implementation.completion_basis;
  assert.equal(nonLiveBasis.included_items_count, 9);
  assert.ok(nonLiveBasis.excluded_capabilities_not_counted_as_implemented.length >= 6);
  const parityBasis = completionAudit.scope.native_ppt_full_parity_spec.completion_basis;
  assert.deepEqual(
    [parityBasis.completed_units, parityBasis.total_units, completionAudit.scope.native_ppt_full_parity_spec.completion_percent],
    [8, 10, 80],
  );
});
