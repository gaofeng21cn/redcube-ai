import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync } from 'node:fs';

import { getProductEntryManifest } from './product-domain-action-test-api.js';

const HELPER_CATALOG_FILE = 'contracts/runtime-program/python-native-helper-catalog.json';

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

function assertNativeTrueRenderPolicy(policy) {
  assert.equal(policy.required, true);
  assert.equal(policy.source_surface_kind, 'native_pptx');
  assert.equal(policy.renderer_selection_policy, 'capability_probe_auto_bootstrap');
  assert.equal(policy.user_preinstalled_libreoffice_required, false);
  assert.equal(policy.renderer_kind, 'libreoffice_headless');
  assert.equal(policy.renderer_pipeline, 'libreoffice_headless_pdf_png_v1');
  assert.equal(policy.runtime, 'libreoffice_headless');
  assert.deepEqual(policy.supported_renderers, [
    {
      renderer_kind: 'libreoffice_headless',
      renderer_stack: 'libreoffice_headless_plus_poppler',
      renderer_pipeline: 'libreoffice_headless_pdf_png_v1',
      runtime: 'libreoffice_headless',
      components: ['LibreOffice headless', 'Poppler pdftoppm'],
      proof_chain: ['pptx_to_pdf', 'pdf_to_png'],
      required_capabilities: ['soffice_headless', 'pdftoppm'],
    },
  ]);
  assert.deepEqual(policy.bootstrap_policy, {
    capability_probe: 'native_ppt_renderer_capability_probe',
    automatic_bootstrap_allowed: true,
    user_preinstall_required: false,
    repo_owned_installer: 'tools/native-ppt-proof/install-deps.sh',
    proof_container: 'tools/native-ppt-proof/Dockerfile',
  });
  assert.equal(policy.cross_platform_render_required, true);
  assert.equal(policy.synthetic_preview_allowed, false);
  assert.equal(policy.html_render_substitute_allowed, false);
  assert.equal(policy.officecli_validate_substitute_allowed, false);
  assert.deepEqual(policy.disallowed_substitutes, [
    'synthetic_preview',
    'html_render',
    'officecli_validate',
    'desktop_powerpoint_automation',
    'apple_script_preview',
  ]);
  assert.equal(policy.fail_closed_when_missing, true);
  assert.deepEqual(policy.fail_closed_blocker, {
    typed_blocker: 'missing_renderer_dependency',
    emitted_when: 'capability_probe_and_auto_bootstrap_cannot_resolve_supported_renderer',
  });
}

function assertOfficecliMaterializerPolicy(policy) {
  assert.equal(policy.policy_id, 'ppt_native_officecli_materializer_quality_gate_v1');
  assert.equal(policy.adoption_status, 'qa_materializer_discipline_only');
  assert.equal(policy.rca_main_workflow_owner, 'redcube_stage_review_export');
  assert.equal(policy.skill_authoring_loop_adopted, false);
  assert.equal(policy.materializer_role, 'default_editable_pptx_materializer_and_qa_gate');
  assert.equal(policy.current_pptx_writer, 'officecli_pptx_materializer');
  assert.equal(policy.officecli_writer_adapter_default_enabled, true);
  assert.deepEqual(policy.required_gate_refs, [
    'officecli_save_before_close',
    'officecli_validate',
    'officecli_view_issues',
    'officecli_view_text',
  ]);
  assert.equal(policy.save_before_close_required, true);
  assert.equal(policy.validate_required, true);
  assert.equal(policy.view_issues_required, true);
  assert.equal(policy.view_text_required, true);
  assert.equal(policy.true_render_proof_required_after_officecli_gate, true);
  assert.equal(policy.true_render_proof_substitute_allowed, false);
  assert.equal(policy.deterministic_cjk_font_family, 'Noto Sans CJK SC');
  assert.equal(policy.default_visual_route_changed, false);
  assert.equal(policy.default_executor_changed, false);
}

test('product-entry manifest exposes image-first default and explicit native PPT proof lane', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-native-ppt-manifest-'));
  const manifest = await getProductEntryManifest({
    workspace_locator: {
      workspace_root: workspaceRoot,
    },
  });

  const pptPolicy = manifest.deliverable_facade.family_route_policy.ppt_deck;
  assert.equal(pptPolicy.default_visual_route, 'author_image_pages');
  assert.equal(pptPolicy.default_visual_policy, 'image_first');
  assert.deepEqual(
    pptPolicy.protected_stage_sequence,
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
  assert.equal(pptPolicy.image_page_authoring_lane.status, 'production_default');
  assert.equal(pptPolicy.image_page_authoring_lane.default_enabled, true);
  assert.equal(pptPolicy.image_page_authoring_lane.style_reference_dir_input, 'delivery_request.style_reference_dir');
  assert.equal(pptPolicy.html_authoring_lane.status, 'production_selectable_optional');
  assert.equal(pptPolicy.html_authoring_lane.explicit_selection_required, true);
  assert.deepEqual(pptPolicy.route_selection_policy.explicit_selection_required_for, ['render_html', 'fix_html', 'author_pptx_native', 'repair_pptx_native']);
  assert.equal(pptPolicy.native_ppt_proof_lane.status, 'production_selectable_optional');
  assert.equal(pptPolicy.native_ppt_proof_lane.default_enabled, false);
  assert.equal(pptPolicy.native_ppt_proof_lane.production_selectable, true);
  assert.deepEqual(pptPolicy.native_ppt_proof_lane.runnable_routes, ['author_pptx_native', 'repair_pptx_native']);
  assert.deepEqual(pptPolicy.native_ppt_proof_lane.replaces_routes, ['author_image_pages', 'repair_image_pages']);
  assert.deepEqual(pptPolicy.native_ppt_proof_lane.legacy_html_replaces_routes, ['render_html', 'fix_html']);
  assert.deepEqual(
    pptPolicy.native_ppt_proof_lane.preserved_gates,
    ['visual_director_review', 'screenshot_review', 'export_pptx'],
  );
  assert.deepEqual(pptPolicy.native_ppt_proof_lane.ai_first_editing_contract, {
    contract_id: 'ppt_native_ai_first_editing_contract_v1',
    creative_owner: 'llm_agent',
    editable_shape_plan_required: true,
    editable_shape_manifest_required: true,
    design_spec_lock_required: true,
    template_layout_grammar_required: true,
    per_slide_layout_binding_required: true,
    shape_quality_role_required: true,
    layout_intent_required: true,
    composition_signature_required: true,
    structural_visual_required: true,
    python_helper_role: 'execute_validate_export_only',
    template_substitution_allowed: false,
    preserved_gates: ['visual_director_review', 'screenshot_review', 'export_pptx'],
  });
  assert.deepEqual(pptPolicy.native_ppt_proof_lane.unit_repair_scope, {
    repair_route: 'repair_pptx_native',
    scope: 'page',
    target_source: 'screenshot_review.blocked_slide_ids',
    passed_slides_reused: true,
    preserved_slide_policy: 'do_not_reauthor_passed_slides',
  });
  assert.deepEqual(pptPolicy.native_ppt_proof_lane.engine_capabilities, {
    authoring_ir: 'redcube_svg_ir',
    pptx_writer: 'officecli_pptx_materializer',
    editable_pptx: true,
    strict_svg_preflight: true,
    true_render_proof_required: true,
    true_render_proof_renderer: 'libreoffice_headless',
    cross_platform_render_required: true,
    screenshot_packaging: false,
  });
  assertOfficecliMaterializerPolicy(pptPolicy.native_ppt_proof_lane.officecli_materializer_policy);
  assertNativeTrueRenderPolicy(pptPolicy.native_ppt_proof_lane.true_render_proof);
  assert.equal(manifest.native_ppt_operator_ux.surface_kind, 'native_ppt_operator_ux');
  assert.equal(manifest.native_ppt_operator_ux.status, 'blocked');
  assert.equal(manifest.native_ppt_operator_ux.route_selection.default_visual_route, 'author_image_pages');
  assert.equal(manifest.native_ppt_operator_ux.route_selection.default_visual_policy, 'image_first');
  assert.equal(
    manifest.native_ppt_operator_ux.route_selection.operator_copy,
    'Default route is image-first page authoring; HTML and native editable PPTX routes require explicit operator selection.',
  );
  assert.deepEqual(manifest.native_ppt_operator_ux.route_selection.image_routes, ['author_image_pages', 'repair_image_pages']);
  assert.deepEqual(manifest.native_ppt_operator_ux.route_selection.html_routes, ['render_html', 'fix_html']);
  assert.equal(manifest.native_ppt_operator_ux.route_selection.style_reference_dir_input, 'delivery_request.style_reference_dir');
  assert.equal(manifest.native_ppt_operator_ux.route_selection.default_enabled, false);
  assert.equal(manifest.native_ppt_operator_ux.route_selection.production_selectable, true);
  assert.deepEqual(manifest.native_ppt_operator_ux.route_selection.runnable_routes, ['author_pptx_native', 'repair_pptx_native']);
  assert.deepEqual(
    manifest.native_ppt_operator_ux.route_selection.selectable_when,
    [
      'deliverable_family=ppt_deck',
      'operator_explicitly_selects_native_ppt_proof',
      'native_ppt_dependencies_pass',
      'source_ready_or_existing_deliverable_contract_present',
    ],
  );
  assert.equal(manifest.native_ppt_operator_ux.proof_runner.helper_command, 'redcube native-ppt proof');
  assert.equal(manifest.native_ppt_operator_ux.proof_runner.repo_owned_runner, true);
  assert.equal(manifest.native_ppt_operator_ux.proof_runner.public_skill_policy, 'do_not_register_as_second_public_skill');
  assert.match(manifest.native_ppt_operator_ux.proof_runner.command_template, /--route author_pptx_native/);
  assert.equal(manifest.native_ppt_operator_ux.dependency_diagnostics.surface_kind, 'native_ppt_dependency_diagnostics');
  assert.deepEqual(
    manifest.native_ppt_operator_ux.dependency_diagnostics.checks.map((check) => check.check_id),
    ['product_entry_preflight', 'workspace_contract_present', 'native_true_render_capability', 'renderer_auto_bootstrap'],
  );
  assert.equal(manifest.native_ppt_operator_ux.dependency_diagnostics.checks[2].blocked_reason, 'missing_renderer_dependency');
  assert.equal(manifest.native_ppt_operator_ux.dependency_diagnostics.checks[2].typed_blocker, 'missing_renderer_dependency');
  assert.equal(manifest.native_ppt_operator_ux.dependency_diagnostics.checks[3].status, 'automatic_when_needed');
  assert.equal(manifest.native_ppt_operator_ux.dependency_diagnostics.checks[3].user_preinstall_required, false);
  assert.equal(manifest.native_ppt_operator_ux.image_provider_diagnostics.surface_kind, 'image_provider_diagnostics');
  assert.equal(manifest.native_ppt_operator_ux.image_provider_diagnostics.default_route, 'author_image_pages');
  assert.equal(manifest.native_ppt_operator_ux.image_provider_diagnostics.style_reference_dir_input, 'delivery_request.style_reference_dir');
  assert.equal(manifest.native_ppt_operator_ux.image_first_proof_readiness.status, 'blocked');
  assert.equal(manifest.native_ppt_operator_ux.image_first_proof_readiness.mock_mode_calls_api, false);
  assert.equal(
    manifest.native_ppt_operator_ux.image_first_proof_readiness.blocked_reason,
    'product_entry_preflight_blocked',
  );
  assert.equal(manifest.native_ppt_operator_ux.style_reference_summary.status, 'optional_not_provided');
  assert.equal(manifest.native_ppt_operator_ux.cache_status.status, 'runtime_cache_not_inspected');
  assert.equal(manifest.native_ppt_operator_ux.artifact_inventory.status, 'session_artifacts_not_inspected');
  assert.equal(manifest.native_ppt_operator_ux.image_proof_runner.helper_command, 'redcube image-ppt proof');
  assert.equal(manifest.native_ppt_operator_ux.image_proof_runner.downstream_action_ref, 'repo_owned_image_ppt_proof_runner');
  assert.equal(manifest.native_ppt_operator_ux.image_proof_runner.delegates_to, 'tools/image-ppt-proof/run.sh');
  assert.doesNotMatch(manifest.native_ppt_operator_ux.image_proof_runner.command_template, /--workspace-root/);
  assert.match(manifest.native_ppt_operator_ux.image_proof_runner.command_template, /--mock-image-generation/);
  assert.doesNotMatch(manifest.native_ppt_operator_ux.image_proof_runner.command_template, /--live-image-generation/);
  assert.equal(manifest.native_ppt_operator_ux.image_proof_runner.live_mode_requires_explicit_flag, true);
  assert.equal(manifest.native_ppt_operator_ux.image_proof_runner.default_mock_calls_api, false);
  assert.equal(manifest.native_ppt_operator_ux.image_proof_runner.smoke_mode, 'lightweight_real_style_mock');
  assert.deepEqual(manifest.native_ppt_operator_ux.image_proof_runner.allowed_routes, ['author_image_pages', 'repair_image_pages']);
  assert.equal(manifest.product_entry_shell.native_ppt_proof.command, 'redcube native-ppt proof');
  assert.equal(manifest.product_entry_shell.image_ppt_proof.command, 'redcube image-ppt proof');
  assert.equal(manifest.product_entry_shell.image_ppt_proof.image_first_proof_readiness.status, 'blocked');
  assert.equal(manifest.product_entry_shell.image_ppt_proof.cache_status.status, 'runtime_cache_not_inspected');
  assert.equal(manifest.product_entry_shell.image_ppt_proof.artifact_inventory.status, 'session_artifacts_not_inspected');
  assert.equal(manifest.operator_loop_actions.run_native_ppt_proof.surface_kind, 'native_ppt_product_entry_proof');
  assert.equal(manifest.operator_loop_actions.run_image_ppt_proof.surface_kind, 'image_ppt_product_entry_proof');
  assert.equal(manifest.ppt_deck_visual_route_truth.default_visual_route, 'author_image_pages');
  assert.equal(manifest.ppt_deck_visual_route_truth.image_first_proof_readiness.status, 'blocked');
  assert.equal(manifest.ppt_deck_visual_route_truth.image_provider_diagnostics.surface_kind, 'image_provider_diagnostics');
  assert.equal(manifest.skill_catalog.skills.length, 1);
  assert.equal(manifest.skill_catalog.supported_commands.includes('redcube image-ppt proof'), true);
  assert.equal(manifest.skill_catalog.supported_commands.includes('redcube native-ppt proof'), true);
});

test('native helper doctor stays diagnostic-only and preserves product-entry proof lane gates', async () => {
  const catalog = readJson(HELPER_CATALOG_FILE);
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-native-ppt-doctor-'));
  const manifest = await getProductEntryManifest({
    workspace_locator: {
      workspace_root: workspaceRoot,
    },
  });
  const proofLane = manifest.deliverable_facade.family_route_policy.ppt_deck.native_ppt_proof_lane;

  assert.equal(catalog.package.diagnostics.surface_kind, 'python_native_helper_doctor');
  assert.equal(catalog.package.diagnostics.executes_review_export_gates, false);
  assert.equal(catalog.package.diagnostics.route_authority, 'diagnostic_only');
  assert.equal(catalog.package.diagnostics.bypass_product_entry_allowed, false);
  assert.deepEqual(proofLane.preserved_gates, ['visual_director_review', 'screenshot_review', 'export_pptx']);
  assert.deepEqual(catalog.bypass_policy.required_review_export_gates, proofLane.preserved_gates);
});
