// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildDeliverableRecord,
  createOverlayRegistry,
  buildXiaohongshuTopic,
  getDefaultOverlayCatalog,
  listDefaultRuntimeFamilyModules,
  pptDeckOverlay,
  xiaohongshuOverlay,
} from './package-surfaces.ts';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function readText(file) {
  return readFileSync(file, 'utf-8');
}

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
  const pptCatalog = structuredClone(ppt);
  const xiaohongshuCatalog = structuredClone(xiaohongshu);
  const pptHtmlCompanion = pptCatalog.visual_authoring_policy.html_design_companion;
  const xiaohongshuHtmlCompanion = xiaohongshuCatalog.visual_authoring_policy.html_design_companion;

  assert.equal(pptHtmlCompanion.source_skill_id, 'ui-ux-pro-max');
  assert.equal(pptHtmlCompanion.public_skill_policy, 'do_not_register_as_public_redcube_skill');
  assert.equal(xiaohongshuHtmlCompanion.source_skill_id, 'ui-ux-pro-max');
  assert.equal(xiaohongshuHtmlCompanion.activation_surface, 'internal_stage_context');
  delete pptCatalog.visual_authoring_policy.html_design_companion;
  delete xiaohongshuCatalog.visual_authoring_policy.html_design_companion;

  assert.equal(catalog.surface_kind, 'overlay_catalog');
  assert.equal(catalog.overlays.every((overlay) => !Object.hasOwn(overlay, 'packages')), true);
  assert.deepEqual(
    pptCatalog,
    {
      overlay_id: 'ppt_deck',
      default_profile_id: 'lecture_student',
      profiles: ['lecture_student', 'lecture_peer', 'executive_briefing', 'defense_deck'],
      route_sequence: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'author_image_pages', 'visual_director_review', 'screenshot_review', 'repair_image_pages', 'export_pptx'],
      deliverable_kind: 'ppt_deck',
      prompt_pack_id: 'ppt_deck_mainline_v1',
      visual_authoring_policy: {
        default_visual_route: 'author_image_pages',
        image_page_authoring_lane: {
          lane_id: 'ppt_deck_image_page_authoring_v0',
          status: 'production_default',
          default_enabled: true,
          production_selectable: true,
          runnable_routes: ['author_image_pages', 'repair_image_pages'],
          replaces_routes: ['render_html', 'fix_html'],
          preserved_upstream_routes: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction'],
          preserved_gates: ['visual_director_review', 'screenshot_review', 'export_pptx'],
          authoring_artifact: 'image_page_bundle',
          page_image_artifacts_required: true,
          style_reference_dir_input: 'delivery_request.style_reference_dir',
          review_input_surface: 'image_page_screenshots',
          provider_diagnostics_surface: 'image_provider_diagnostics',
          fact_governance: {
            fact_whitelist_surface: 'shared_source_truth.readable_shared_source_truth_fields',
            verification_ledger_surface: 'reports/fact-verification-ledger.json',
            rule: 'visible factual claims in generated full-slide images must trace to whitelisted source truth or operator-approved verified assets',
            unresolved_claim_policy: 'block_or_rephrase_as_general_without_unverified_specifics',
            prompt_manifest_required_fields: [
              'fact_governance',
              'verified_asset_policy',
              'forbidden_generated_artifacts',
            ],
            forbidden_generated_artifacts: [
              'fake QR code',
              'fake download link',
              'fake DOI',
              'fake logo',
              'unverified hospital name',
              'unverified patient demographics',
              'unverified publication status',
            ],
          },
          verified_asset_overlay_policy: {
            asset_overlay_surface: 'verified_asset_overlay_manifest',
            allowed_overlay_assets: [
              'real QR code',
              'download entry',
              'verified UI screenshot',
              'verified paper screenshot',
              'operator supplied logo',
            ],
            deterministic_overlay_only: true,
            overlay_manifest_required: true,
            machine_verification_required_when_applicable: true,
            composition_repair_allowed: false,
            model_generation_forbidden: [
              'QR code',
              'download URL',
              'DOI',
              'logo',
              'publication screenshot',
            ],
          },
          long_deck_production_contract: {
            contract_id: 'ppt_image_first_long_deck_production_v1',
            applies_when: 'expected_slide_count > proof_runner.max_default_slide_count or operator marks deck as long_deck',
            full_long_deck_default_regression: false,
            canonical_slide_naming: 'slideNN-short-name.png',
            expected_slide_count_source: 'slide_blueprint.expected_slide_count || slide_blueprint.slides.length',
            required_artifact_surfaces: [
              'prompts',
              'images_raw',
              'images_1920x1080',
              'style_refs',
              'fact_verification_ledger',
              'visual_qc_ledger',
              'contact_sheet',
              'pptx',
            ],
            completeness_gates: [
              'expected slide count matches image page count',
              'continuous slideNN ordering',
              'all generated pages are 16:9 PNG',
              'exported PPTX has one full-slide image per slide',
              'exported PPTX media count matches slide count',
              'full-deck contact sheet or manifest exists for operator review',
            ],
            line_divergence_policy: {
              shared_truth_before_divergence: ['source_truth', 'storyline'],
              divergence_allowed_from: ['detailed_outline', 'slide_blueprint', 'visual_direction'],
              html_route_must_not_consume_image_route_pngs_by_default: true,
              image_route_is_not_html_skin: true,
            },
            rejected_repair_route_policy: {
              forbidden_for_page_fixes: ['PIL composition patch', 'Canvas redraw patch', 'HTML rebuild patch'],
              allowed_postprocess_scope: ['deterministic verified asset overlay only'],
              rejected_route_provenance_required: true,
            },
          },
          audience_language_policy: {
            visible_operator_language_allowed: false,
            forbidden_visible_fragments: [
              '汇报讨论用途',
              '客观专业版',
              '本次汇报边界',
              '不在展示页暴露',
              '本地原始文件名',
              '清洗脚本名',
              'RCA',
              'RedCube',
              'source intake',
              'author_pptx_native',
              'slide_blueprint',
              'visual_direction',
            ],
            rewrite_target: 'project-facing audience language',
          },
          layout_legibility_policy: {
            title_safe_zone_clear: {
              required: true,
              forbidden_elements: [
                'section chip',
                'corner card',
                'badge',
                'tag',
                'decorative label',
              ],
              preferred_section_signal: 'footer_or_omit',
            },
            table_legibility: {
              min_body_font_pt: 11,
              max_blank_ratio_in_card: 0.38,
              compact_cell_padding_required: true,
            },
            layout_density: {
              avoid_oversized_empty_cards: true,
              max_blank_ratio_in_card: 0.38,
            },
          },
        },
        html_authoring_lane: {
          lane_id: 'ppt_deck_html_authoring_v0',
          status: 'production_selectable_optional',
          default_enabled: false,
          production_selectable: true,
          runnable_routes: ['render_html', 'fix_html'],
          replaces_routes: ['author_image_pages', 'repair_image_pages'],
          preserved_upstream_routes: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction'],
          preserved_gates: ['visual_director_review', 'screenshot_review', 'export_pptx'],
          explicit_selection_required: true,
        },
        native_ppt_proof_lane: {
          lane_id: 'ppt_deck_native_ppt_authoring_v0',
          status: 'production_selectable_optional',
          default_enabled: false,
          production_selectable: true,
          runnable_routes: ['author_pptx_native', 'repair_pptx_native'],
          replaces_routes: ['author_image_pages', 'repair_image_pages'],
          legacy_html_replaces_routes: ['render_html', 'fix_html'],
          preserved_upstream_routes: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction'],
          preserved_gates: ['visual_director_review', 'screenshot_review', 'export_pptx'],
          ai_first_editing_contract: {
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
          },
          unit_repair_scope: {
            repair_route: 'repair_pptx_native',
            scope: 'page',
            target_source: 'screenshot_review.blocked_slide_ids',
            passed_slides_reused: true,
            preserved_slide_policy: 'do_not_reauthor_passed_slides',
          },
          authoring_artifact: 'native_pptx_file',
          editable_artifact_required: true,
          review_input_surface: 'rendered_pptx_screenshots',
          engine_capabilities: {
            authoring_ir: 'redcube_svg_ir',
            pptx_writer: 'officecli_pptx_materializer',
            editable_pptx: true,
            strict_svg_preflight: true,
            true_render_proof_required: true,
            true_render_proof_renderer: 'libreoffice_headless',
            cross_platform_render_required: true,
            screenshot_packaging: false,
          },
          officecli_materializer_policy: {
            policy_id: 'ppt_native_officecli_materializer_quality_gate_v1',
            adoption_status: 'qa_materializer_discipline_only',
            rca_main_workflow_owner: 'redcube_stage_review_export',
            skill_authoring_loop_adopted: false,
            materializer_role: 'default_editable_pptx_materializer_and_qa_gate',
            current_pptx_writer: 'officecli_pptx_materializer',
            officecli_writer_adapter_default_enabled: true,
            required_gate_refs: [
              'officecli_save_before_close',
              'officecli_validate',
              'officecli_view_issues',
              'officecli_view_text',
            ],
            save_before_close_required: true,
            validate_required: true,
            view_issues_required: true,
            view_text_required: true,
            true_render_proof_required_after_officecli_gate: true,
            true_render_proof_substitute_allowed: false,
            deterministic_cjk_font_family: 'Noto Sans CJK SC',
            default_visual_route_changed: false,
            default_executor_changed: false,
          },
          true_render_proof: {
            required: true,
            source_surface_kind: 'native_pptx',
            renderer_selection_policy: 'capability_probe_auto_bootstrap',
            user_preinstalled_libreoffice_required: false,
            renderer_kind: 'libreoffice_headless',
            renderer_pipeline: 'libreoffice_headless_pdf_png_v1',
            runtime: 'libreoffice_headless',
            supported_renderers: [
              {
                renderer_kind: 'libreoffice_headless',
                renderer_stack: 'libreoffice_headless_plus_poppler',
                renderer_pipeline: 'libreoffice_headless_pdf_png_v1',
                runtime: 'libreoffice_headless',
                components: ['LibreOffice headless', 'Poppler pdftoppm'],
                proof_chain: ['pptx_to_pdf', 'pdf_to_png'],
                required_capabilities: ['soffice_headless', 'pdftoppm'],
              },
            ],
            bootstrap_policy: {
              capability_probe: 'native_ppt_renderer_capability_probe',
              automatic_bootstrap_allowed: true,
              user_preinstall_required: false,
              repo_owned_installer: 'tools/native-ppt-proof/install-deps.sh',
              proof_container: 'tools/native-ppt-proof/Dockerfile',
            },
            cross_platform_render_required: true,
            synthetic_preview_allowed: false,
            html_render_substitute_allowed: false,
            officecli_validate_substitute_allowed: false,
            disallowed_substitutes: [
              'synthetic_preview',
              'html_render',
              'officecli_validate',
              'desktop_powerpoint_automation',
              'apple_script_preview',
            ],
            fail_closed_when_missing: true,
            fail_closed_blocker: {
              typed_blocker: 'missing_renderer_dependency',
              emitted_when: 'capability_probe_and_auto_bootstrap_cannot_resolve_supported_renderer',
            },
          },
          export_contract_delta: {
            source_artifact_field: 'export_bundle.source_pptx',
            shape_manifest_field: 'export_bundle.native_ppt_shape_manifest',
            repair_log_field: 'export_bundle.native_ppt_repair_log',
          },
        },
      },
      runtime: {
        runner_id: 'families/ppt',
        owner: 'redcube_ai',
      },
    },
  );
  assert.equal(xiaohongshuCatalog.overlay_id, 'xiaohongshu');
  assert.equal(xiaohongshuCatalog.default_profile_id, 'standard_note');
  assert.deepEqual(xiaohongshuCatalog.profiles, ['standard_note']);
  assert.deepEqual(
    xiaohongshuCatalog.route_sequence,
    ['research', 'storyline', 'single_note_plan', 'visual_direction', 'author_image_pages', 'visual_director_review', 'screenshot_review', 'repair_image_pages', 'publish_copy', 'export_bundle'],
  );
  assert.equal(xiaohongshuCatalog.deliverable_kind, 'xiaohongshu_note');
  assert.equal(xiaohongshuCatalog.prompt_pack_id, 'xiaohongshu_mainline_v1');
  assert.equal(xiaohongshuCatalog.visual_authoring_policy.default_visual_route, 'author_image_pages');
  assert.equal(xiaohongshuCatalog.visual_authoring_policy.default_visual_policy, 'image_first');
  assert.equal(xiaohongshuCatalog.visual_authoring_policy.image_generation.default_model, 'gpt-image-2');
  assert.deepEqual(
    xiaohongshuCatalog.visual_authoring_policy.route_selection_policy.explicit_selection_required_for,
    ['render_html', 'fix_html'],
  );
  assert.deepEqual(xiaohongshuCatalog.runtime, {
    runner_id: 'families/xiaohongshu',
    owner: 'redcube_ai',
  });
  assert.deepEqual(
    poster,
    {
      overlay_id: 'poster_onepager',
      default_profile_id: 'knowledge_poster',
      profiles: ['knowledge_poster'],
      route_sequence: ['storyline', 'poster_blueprint', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'export_bundle'],
      deliverable_kind: 'poster_onepager',
      prompt_pack_id: 'poster_onepager_mainline_v1',
      runtime: {
        runner_id: 'families/poster-onepager',
        owner: 'redcube_ai',
      },
    },
  );
});

test('registry source is internal to runtime without standalone overlay package dependencies', () => {
  const runtimePackage = readJson('packages/redcube-runtime/package.json');
  const runtimeSource = readText('packages/redcube-runtime/src/default-registries.ts');

  for (const dependency of [
    '@redcube/overlay-ppt',
    '@redcube/overlay-xiaohongshu',
    '@redcube/overlay-poster-onepager',
  ]) {
    assert.equal(
      Boolean(runtimePackage.dependencies?.[dependency]),
      false,
      `${dependency} must not remain a runtime dependency after overlay package ABI contraction`,
    );
    assert.equal(runtimeSource.includes(dependency), false);
  }
  assert.equal(runtimePackage.dependencies?.['@redcube/overlay-core'], '0.1.0');
  assert.equal(runtimeSource.includes("import('@redcube/overlay-"), false);
  assert.equal(runtimeSource.includes('listDefaultOverlayModules'), false);
  assert.equal(runtimeSource.includes('RuntimeFamilyCatalogSurface'), false);
  assert.equal(runtimeSource.includes('generic_runtime_family_registry_owner'), false);

  for (const { runner_id } of listDefaultRuntimeFamilyModules()) {
    assert.match(
      runtimeSource,
      new RegExp(`runner_id:\\s*['"]${runner_id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`),
      `${runner_id} must have a literal runtime family runner id`,
    );
    assert.match(runtimeSource, /runRoute:/, `${runner_id} must resolve to an internal runner`);
  }
});
