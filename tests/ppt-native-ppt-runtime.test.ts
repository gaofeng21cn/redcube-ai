// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { withEnv } from './mock-codex-cli.ts';
import { mkUserScopedTestWorkspace } from './helpers/test-workspace.ts';
import { buildMockPptNativeShapePlan } from './helpers/mock-codex-cli-parts/ppt-builders/native.ts';
import {
  contentTextOverlapPairs,
  fileSha256,
  flattenNativeVisibleText,
  nativeEngineContract,
  pointIndexTextFailures,
  readJson,
  runNativePlanningChain,
  textCapacityFailures,
  withMockNativePptRuntime,
  writeJson,
} from './helpers/ppt-native-ppt-runtime-fixtures.ts';
import { runDeliverableRoute } from './product-domain-action-test-api.ts';

test('native PPT lane authors editable PPTX and still passes review/export gates', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-');
    await runNativePlanningChain({ workspaceRoot });

    const authorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-native',
      route: 'author_pptx_native',
    });
    assert.equal(authorResult.ok, true);
    const authored = readJson(authorResult.artifactFile);
    assert.equal(authored.native_ppt_bundle?.editable_artifact, true);
    assert.deepEqual(authored.ai_first_editing_contract, {
      contract_id: 'ppt_native_ai_first_editing_contract_v1',
      creative_owner: 'llm_agent',
      editable_shape_plan_required: true,
      editable_shape_manifest_required: true,
      design_spec_lock_required: true,
      shape_quality_role_required: true,
      layout_intent_required: true,
      composition_signature_required: true,
      structural_visual_required: true,
      title_underline_motif_allowed: false,
      concrete_layout_variant_repetition_limit: 2,
      python_helper_role: 'execute_validate_export_only',
      template_substitution_allowed: false,
      preserved_gates: ['visual_director_review', 'screenshot_review', 'export_pptx'],
    });
    assert.equal(authored.unit_repair_scope?.scope, 'deck');
    assert.equal(authored.native_ppt_bundle?.ai_first_editing_contract?.creative_owner, 'llm_agent');
    assert.equal(existsSync(authored.native_ppt_bundle?.editable_shape_plan_file), true);
    const editableShapePlan = readJson(authored.native_ppt_bundle.editable_shape_plan_file);
    assert.equal(editableShapePlan.contract_kind, 'redcube_ai_first_native_ppt_shape_plan');
    assert.equal(editableShapePlan.design_spec_lock?.owner, 'llm_agent');
    assert.equal(typeof editableShapePlan.design_spec_lock?.motif, 'string');
    assert.equal(editableShapePlan.design_spec_lock.layout_archetypes.length >= 3, true);
    assert.equal(editableShapePlan.slides.length, authored.native_ppt_bundle?.slides.length);
    assert.equal(editableShapePlan.slides.every((slide) => Array.isArray(slide.native_shapes) && slide.native_shapes.length >= 2), true);
    assert.equal(
      editableShapePlan.slides.every((slide) => slide.native_shapes.every((shape) => typeof shape.quality_role === 'string')),
      true,
    );
    assert.deepEqual(pointIndexTextFailures(editableShapePlan), []);
    assert.equal(
      editableShapePlan.slides.every((slide) => typeof slide.layout_intent?.composition_signature === 'string'),
      true,
    );
    const compositionSignatures = editableShapePlan.slides
      .map((slide) => slide.layout_intent?.composition_signature)
      .filter(Boolean);
    assert.equal(new Set(compositionSignatures).size >= Math.ceil(compositionSignatures.length * 0.75), true);
    assert.equal(
      editableShapePlan.slides
        .flatMap((slide) => slide.native_shapes)
        .some((shape) => shape?.role === 'accent_rule'),
      false,
    );
    const expectedEngineContract = nativeEngineContract();
    assert.deepEqual(authored.native_ppt_bundle?.engine_contract, expectedEngineContract);
    assert.equal(
      authored.native_ppt_bundle?.engine_contract_file,
      authored.native_ppt_bundle?.shape_manifest_file
        ? readJson(authored.native_ppt_bundle.shape_manifest_file).engine_contract_file
        : authored.native_ppt_bundle?.engine_contract_file,
    );
    assert.equal(path.basename(authored.native_ppt_bundle?.engine_contract_file), 'ppt-native-python-engine-contract.json');
    assert.equal(authored.native_ppt_bundle?.shape_manifest_schema_version, 1);
    assert.equal(existsSync(authored.native_ppt_bundle?.pptx_file), true);
    assert.equal(existsSync(authored.native_ppt_bundle?.shape_manifest_file), true);
    const shapeManifest = readJson(authored.native_ppt_bundle.shape_manifest_file);
    assert.equal(shapeManifest.schema_version, 1);
    assert.equal(shapeManifest.native_quality_model, 'shape_manifest_layout_metrics_v1');
    assert.equal(
      shapeManifest.native_quality_surface.required_per_slide_metrics.includes('occupied_ratio'),
      true,
    );
    assert.equal(shapeManifest.engine_capabilities?.authoring_ir, 'redcube_svg_ir');
    assert.equal(shapeManifest.engine_capabilities?.pptx_writer, 'officecli_pptx_materializer');
    assert.equal(shapeManifest.engine_capabilities?.true_render_proof_required, true);
    assert.equal(shapeManifest.engine_capabilities?.true_render_proof_renderer, 'libreoffice_headless');
    assert.equal(shapeManifest.engine_capabilities?.cross_platform_render_required, true);
    assert.equal(shapeManifest.officecli_materializer_policy?.skill_authoring_loop_adopted, false);
    assert.equal(shapeManifest.officecli_materializer_policy?.current_pptx_writer, 'officecli_pptx_materializer');
    assert.equal(shapeManifest.officecli_materializer_policy?.view_issues_required, true);
    assert.equal(shapeManifest.officecli_materializer_policy?.true_render_proof_substitute_allowed, false);
    assert.equal(shapeManifest.render_proof?.source_surface_kind, 'native_pptx');
    assert.equal(shapeManifest.render_proof?.renderer_kind, 'libreoffice_headless');
    assert.equal(shapeManifest.render_proof?.renderer_pipeline, 'libreoffice_headless_pdf_png_v1');
    assert.equal(shapeManifest.render_proof?.runtime, 'libreoffice_headless');
    assert.equal(shapeManifest.render_proof?.synthetic_preview, false);
    assert.equal(shapeManifest.render_proof?.command_family, 'soffice --headless');
    assert.equal(shapeManifest.render_proof?.cross_platform_render_required, true);
    assert.deepEqual(shapeManifest.engine_contract, expectedEngineContract);
    assert.equal(shapeManifest.engine_contract_file, authored.native_ppt_bundle.engine_contract_file);
    assert.deepEqual(shapeManifest.ai_first_editing_contract, authored.ai_first_editing_contract);
    assert.equal(shapeManifest.editable_shape_plan_file, authored.native_ppt_bundle.editable_shape_plan_file);
    assert.equal(authored.native_ppt_bundle?.source_visual_route, 'author_pptx_native');
    assert.equal(authored.native_ppt_bundle?.slides.length >= 6, true);
    assert.equal(
      authored.native_ppt_bundle.slides.every((slide) => slide.text_box_count >= 2 && slide.shape_count >= 2),
      true,
    );
    const layoutFamilies = authored.native_ppt_bundle.slides.map((slide) => slide.layout_family);
    assert.deepEqual(
      [...new Set(layoutFamilies)],
      ['cover_signal', 'multi_zone_compare', 'timeline_band', 'judgement_ladder', 'ring_cross', 'summary_peak'],
    );
    assert.equal(
      authored.native_ppt_bundle.slides.every((slide) => slide.layout_writer === 'officecli_pptx_materializer'),
      true,
    );
    assert.equal(
      authored.native_ppt_bundle.slides.every((slide) => slide.ai_first_spatial_plan?.helper_template_layout_used === false),
      true,
    );
    assert.equal(
      authored.native_ppt_bundle.slides.every((slide) => typeof slide.metrics?.composition_signature === 'string'),
      true,
    );
    assert.equal(
      new Set(authored.native_ppt_bundle.slides.map((slide) => slide.metrics?.composition_signature)).size
        >= Math.ceil(authored.native_ppt_bundle.slides.length * 0.75),
      true,
    );
    const visibleText = flattenNativeVisibleText(authored, shapeManifest);
    assert.doesNotMatch(visibleText, /\{\s*"?label"?\s*:/i);
    assert.doesNotMatch(visibleText, /\{\s*'?label'?\s*:/i);
    assert.doesNotMatch(visibleText, /\{\s*"?text"?\s*:/i);
    assert.doesNotMatch(visibleText, /\{\s*'?text'?\s*:/i);
    assert.doesNotMatch(visibleText, /editable_text/i);
    assert.equal(
      authored.native_ppt_bundle.preview_screenshots.every((file) => existsSync(file)),
      true,
    );
    assert.equal(authored.native_ppt_bundle?.render_proof?.synthetic_preview, false);
    assert.equal(authored.native_ppt_bundle?.render_proof?.renderer_kind, 'libreoffice_headless');
    assert.equal(authored.native_ppt_bundle?.render_proof?.renderer_pipeline, 'libreoffice_headless_pdf_png_v1');
    assert.equal(authored.native_ppt_bundle?.engine_capabilities?.authoring_ir, 'redcube_svg_ir');
    assert.equal(authored.native_ppt_bundle?.officecli_materializer_policy?.skill_authoring_loop_adopted, false);
    assert.equal(authored.native_ppt_bundle?.officecli_materializer_policy?.current_pptx_writer, 'officecli_pptx_materializer');

    let screenshotReviewArtifact = null;
    for (const route of ['visual_director_review', 'screenshot_review', 'export_pptx']) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-native',
        route,
      });
      assert.equal(result.ok, true, route);
      if (route === 'screenshot_review') {
        screenshotReviewArtifact = readJson(result.artifactFile);
      }
    }
    const nativeMechanicalSlide = screenshotReviewArtifact.mechanical_review.slide_reviews[0];
    const nativeManifestSlide = shapeManifest.slides.find((slide) => slide.slide_id === nativeMechanicalSlide.slide_id);
    assert.equal(nativeMechanicalSlide.metrics.native_quality_source, 'shape_manifest');
    assert.equal(nativeMechanicalSlide.metrics.render_proof_source, 'libreoffice_headless');
    assert.equal(nativeMechanicalSlide.metrics.synthetic_preview, false);
    assert.equal(nativeMechanicalSlide.metrics.occupied_ratio, nativeManifestSlide.metrics.occupied_ratio);
    assert.equal(nativeMechanicalSlide.metrics.text_char_count, nativeManifestSlide.metrics.text_char_count);
    assert.equal(nativeMechanicalSlide.metrics.edge_clearance.bottom, nativeManifestSlide.metrics.edge_clearance.bottom);
    assert.equal(nativeMechanicalSlide.checks.external_audience_language_ok, true);
    assert.equal(nativeMechanicalSlide.checks.title_safe_zone_clear, true);
    assert.equal(nativeMechanicalSlide.checks.table_legibility_ok, true);
    assert.equal(nativeMechanicalSlide.checks.layout_density_ok, true);
    assert.equal(nativeMechanicalSlide.checks.visual_structure_present, true);
    assert.equal(nativeMechanicalSlide.checks.non_text_visual_specific_ok, true);
    assert.equal(nativeMechanicalSlide.checks.mechanical_card_template_absent, true);
    assert.equal(nativeMechanicalSlide.checks.panel_text_safe_area_ok, true);
    assert.equal(nativeMechanicalSlide.checks.short_label_wrap_ok, true);
    assert.equal(nativeMechanicalSlide.metrics.structural_visual_count >= 1, true);
    assert.equal(nativeMechanicalSlide.metrics.mechanical_card_template_absent, true);
    assert.equal(nativeMechanicalSlide.metrics.panel_text_safe_area_ok, true);
    assert.equal(nativeMechanicalSlide.metrics.short_label_wrap_ok, true);
    assert.equal(Array.isArray(nativeMechanicalSlide.metrics.operator_language_fragments), true);
    assert.equal(nativeMechanicalSlide.metrics.title_safe_zone_clearance_ok, true);

    const exportArtifactFile = path.join(
      workspaceRoot,
      'topics',
      'topic-a',
      'deliverables',
      'deck-native',
      'artifacts',
      'publish_bundle.json',
    );
    const exported = readJson(exportArtifactFile);
    assert.equal(exported.export_bundle?.source_visual_route, 'author_pptx_native');
    assert.equal(exported.export_bundle?.source_pptx, authored.native_ppt_bundle.pptx_file);
    assert.equal(exported.export_bundle?.native_ppt_shape_manifest, authored.native_ppt_bundle.shape_manifest_file);
    assert.equal(existsSync(exported.export_bundle?.pptx_file), true);
    assert.equal(existsSync(exported.export_bundle?.pdf_file), true);
    assert.equal(exported.export_bundle?.source_artifacts?.pptx_file, authored.native_ppt_bundle.pptx_file);
    assert.equal(exported.export_bundle?.source_artifacts?.pdf_file, authored.native_ppt_bundle.pdf_file);
    assert.equal(exported.export_bundle?.source_artifacts?.shape_manifest_file, authored.native_ppt_bundle.shape_manifest_file);
    assert.equal(exported.export_bundle?.source_artifacts?.repair_log_file, authored.native_ppt_bundle.repair_log_file);
    assert.equal(exported.export_bundle?.evidence_hashes?.source_pptx_sha256, fileSha256(authored.native_ppt_bundle.pptx_file));
    assert.equal(exported.export_bundle?.evidence_hashes?.source_pdf_sha256, fileSha256(authored.native_ppt_bundle.pdf_file));
    assert.equal(exported.export_bundle?.evidence_hashes?.shape_manifest_sha256, fileSha256(authored.native_ppt_bundle.shape_manifest_file));
    assert.equal(exported.export_bundle?.evidence_hashes?.final_pptx_sha256, fileSha256(exported.export_bundle.pptx_file));
    assert.equal(exported.export_bundle?.evidence_hashes?.final_pdf_sha256, fileSha256(exported.export_bundle.pdf_file));
    assert.equal(exported.export_bundle?.renderer_proof?.renderer_pipeline, 'libreoffice_headless_pdf_png_v1');
    assert.equal(exported.export_bundle?.renderer_proof?.source_surface_kind, 'native_pptx');
    assert.equal(exported.export_bundle?.renderer_proof?.synthetic_preview, false);
    assert.equal(exported.export_bundle?.shape_manifest_summary?.schema_version, 1);
    assert.equal(exported.export_bundle?.shape_manifest_summary?.slide_count, authored.native_ppt_bundle.slides.length);
    assert.equal(exported.export_bundle?.shape_manifest_summary?.libreoffice_headless_pdf_png_v1, true);
    assert.equal(exported.export_bundle?.shape_manifest_summary?.all_preview_hashes_present, true);
    assert.equal(exported.export_bundle?.operator_proof_summary?.status, 'output_ready');
    assert.equal(exported.export_bundle?.operator_proof_summary?.proof_surface, 'native_export_bundle_operator_proof_summary_v1');
    assert.equal(exported.export_bundle?.operator_proof_summary?.renderer_pipeline, 'libreoffice_headless_pdf_png_v1');
    assert.equal(exported.export_bundle?.operator_proof_summary?.libreoffice_headless_pdf_png_v1, true);
    assert.equal(exported.export_bundle?.operator_proof_summary?.artifact_hashes?.source_pptx_sha256, fileSha256(authored.native_ppt_bundle.pptx_file));
    assert.equal(exported.export_bundle?.operator_proof_summary?.final_artifact_refs?.pptx_file, exported.export_bundle.pptx_file);
    assert.equal(exported.export_bundle?.operator_proof_summary?.final_artifact_refs?.pdf_file, exported.export_bundle.pdf_file);
    assert.equal(exported.export_bundle?.artifact_gallery?.surface_kind, 'native_export_operator_artifact_gallery_v1');
    assert.equal(existsSync(exported.export_bundle?.artifact_gallery?.index_file), true);
    const artifactGallery = readJson(exported.export_bundle.artifact_gallery.index_file);
    assert.equal(artifactGallery.artifacts.source.pptx_file, authored.native_ppt_bundle.pptx_file);
    assert.equal(artifactGallery.artifacts.source.pdf_file, authored.native_ppt_bundle.pdf_file);
    assert.deepEqual(artifactGallery.artifacts.source.preview_png_files, authored.native_ppt_bundle.preview_screenshots);
    assert.equal(artifactGallery.artifacts.final.pptx_file, exported.export_bundle.pptx_file);
    assert.equal(artifactGallery.artifacts.final.pdf_file, exported.export_bundle.pdf_file);
    assert.equal(artifactGallery.artifacts.evidence.shape_manifest_file, authored.native_ppt_bundle.shape_manifest_file);
    assert.equal(artifactGallery.artifacts.evidence.repair_log_file, authored.native_ppt_bundle.repair_log_file);
    assert.equal(artifactGallery.proof_summary.final_artifact_refs.pptx_file, exported.export_bundle.pptx_file);
    assert.equal(artifactGallery.hashes.final_pptx_sha256, fileSha256(exported.export_bundle.pptx_file));
    assert.equal(exported.artifact_refs.includes(exported.export_bundle.operator_proof_summary.final_artifact_refs.pptx_file), true);
    assert.equal(exported.artifact_refs.includes(exported.export_bundle.operator_proof_summary.final_artifact_refs.pdf_file), true);
    assert.equal(exported.artifact_refs.includes(exported.export_bundle.artifact_gallery.index_file), true);
  });
});

test('native PPT AI shape plan keeps ring_cross index labels and body text non-overlapping', () => {
  const shapePlan = buildMockPptNativeShapePlan({
    route: 'author_pptx_native',
    context: {
      blueprint: {
        slides: [{
          slide_id: 'S07',
          title: 'Ring cross overlap regression',
          core_sentence: '中心轴解释四个动作如何互相支撑。',
          visual_presentation: { layout_family: 'ring_cross' },
          page_core_content: [
            '先定义任务，说明证据如何支撑交付判断。',
            '再补事实层，说明证据如何支撑交付判断。',
            '再跑正式主链，说明证据如何支撑交付判断。',
            '最后审阅与发布，说明证据如何支撑交付判断。',
          ],
        }],
      },
    },
  });
  const ringSlide = shapePlan.editable_shape_plan.slides[0];
  assert.equal(ringSlide.layout_family, 'ring_cross');
  assert.deepEqual(contentTextOverlapPairs(ringSlide.native_shapes), []);
  assert.deepEqual(textCapacityFailures(ringSlide.native_shapes), []);
});

test('native PPT AI shape plan rejects visible point indexes without editable text', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-missing-index-text-');
    await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-missing-index-text' });
    const restoreRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'remove_point_index_text',
    });
    try {
      const nativeResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-missing-index-text',
        route: 'author_pptx_native',
      });
      assert.equal(nativeResult.ok, false);
      assert.match(
        String(nativeResult.error?.message || nativeResult.error || ''),
        /point_index|missing_text|editable spatial shape plan/i,
      );
    } finally {
      restoreRoute();
    }
  });
});

test('native PPT AI shape plan preflight self-repairs unreadable live plans before materialization', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-plan-preflight-repair-');
    await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-plan-preflight-repair' });
    const restoreRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'repair_tiny_native_plan_on_feedback',
    });
    try {
      const nativeResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-plan-preflight-repair',
        route: 'author_pptx_native',
      });
      assert.equal(nativeResult.ok, true);
      const authored = readJson(nativeResult.artifactFile);
      assert.equal(authored.native_ppt_bundle.ai_first_shape_plan_preflight.attempts, 2);
      assert.equal(authored.native_ppt_bundle.ai_first_shape_plan_preflight.self_repair_used, true);
      assert.equal(authored.native_ppt_bundle.ai_first_shape_plan_preflight.validator.ok, true);
      const editableShapePlan = readJson(authored.native_ppt_bundle.editable_shape_plan_file);
      assert.deepEqual(textCapacityFailures(editableShapePlan.slides.flatMap((slide) => slide.native_shapes)), []);
    } finally {
      restoreRoute();
    }
  });
});

test('native PPT AI shape plan retry exposes exact validator fixes in the output contract', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-plan-retry-contract-');
    await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-plan-retry-contract' });
    const restoreRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'require_validation_retry_contract',
    });
    try {
      const nativeResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-plan-retry-contract',
        route: 'author_pptx_native',
      });
      assert.equal(nativeResult.ok, true);
      const authored = readJson(nativeResult.artifactFile);
      assert.equal(authored.native_ppt_bundle.ai_first_shape_plan_preflight.attempts, 2);
      assert.equal(authored.native_ppt_bundle.ai_first_shape_plan_preflight.self_repair_used, true);
      assert.equal(
        authored.native_ppt_bundle.ai_first_shape_plan_preflight.attempt_artifact_refs.length,
        4,
      );
      assert.equal(
        authored.native_ppt_bundle.ai_first_shape_plan_preflight.attempt_artifact_refs.every((file) => existsSync(file)),
        true,
      );
      assert.equal(
        authored.artifact_refs.some((file) => file.endsWith('plan-validation-input-attempt-01-validation.json')),
        true,
      );
      assert.equal(
        authored.native_ppt_bundle.ai_first_shape_plan_preflight.validator.ok,
        true,
      );
    } finally {
      restoreRoute();
    }
  });
});

test('native PPT route rejects stale desktop-app proof provenance before screenshot review', async () => {
  const restoreRenderer = withEnv({
    REDCUBE_MOCK_NATIVE_RENDERER_KIND: 'legacy_desktop_renderer',
  });
  try {
    await withMockNativePptRuntime(async () => {
      const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-stale-proof-');
      await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-stale-proof' });

      const nativeResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-stale-proof',
        route: 'author_pptx_native',
      });

      assert.equal(nativeResult.ok, false);
      assert.match(
        String(nativeResult.error?.message || nativeResult.error || ''),
        /LibreOffice headless|stale desktop-app|true-render proof/i,
      );
    });
  } finally {
    restoreRenderer();
  }
});

test('native PPT screenshot review blocks missing render proof and missing screenshots fail-closed', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-missing-proof-');
    await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-missing-proof' });

    const authorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-missing-proof',
      route: 'author_pptx_native',
    });
    assert.equal(authorResult.ok, true);
    const authored = readJson(authorResult.artifactFile);

    const directorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-missing-proof',
      route: 'visual_director_review',
    });
    assert.equal(directorResult.ok, true);

    const shapeManifest = readJson(authored.native_ppt_bundle.shape_manifest_file);
    delete shapeManifest.render_proof;
    shapeManifest.preview_screenshots = [];
    for (const slide of shapeManifest.slides) {
      delete slide.preview_screenshot_file;
      delete slide.preview_screenshot_sha256;
      slide.render_proof_source = 'missing_contract_declared_true_render';
      slide.synthetic_preview = true;
    }
    writeJson(authored.native_ppt_bundle.shape_manifest_file, shapeManifest);

    const screenshotResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-missing-proof',
      route: 'screenshot_review',
    });
    assert.equal(screenshotResult.ok, false);
    const screenshotReview = readJson(path.join(
      workspaceRoot,
      'topics',
      'topic-a',
      'deliverables',
      'deck-missing-proof',
      'artifacts',
      'quality_gate.json',
    ));
    assert.equal(screenshotReview.status, 'block');
    assert.equal(screenshotReview.checks.overflow_free, false);
    assert.equal(screenshotReview.checks.block_content_fit_ok, false);
    assert.equal(screenshotReview.review_state_patch.rerun_from_stage, 'repair_pptx_native');
    assert.equal(
      screenshotReview.mechanical_review.slide_reviews[0].issues.includes('native_true_render_proof_missing'),
      true,
    );
    assert.equal(
      screenshotReview.mechanical_review.slide_reviews[0].issues.includes('native_preview_screenshot_hash_missing'),
      true,
    );
    assert.equal(
      screenshotReview.mechanical_review.metrics.render_proof_source,
      'missing_contract_declared_true_render',
    );
  });
});

test('native PPT screenshot review blocks from shape-manifest quality metrics instead of fixed pass values', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-quality-');
    await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-quality' });

    const authorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-quality',
      route: 'author_pptx_native',
    });
    assert.equal(authorResult.ok, true);
    const authored = readJson(authorResult.artifactFile);
    const shapeManifest = readJson(authored.native_ppt_bundle.shape_manifest_file);
    shapeManifest.slides[0] = {
      ...shapeManifest.slides[0],
      checks: {
        ...shapeManifest.slides[0].checks,
        edge_clearance_ok: false,
        block_content_fit_ok: false,
      },
      metrics: {
        ...shapeManifest.slides[0].metrics,
        edge_clearance: {
          ...shapeManifest.slides[0].metrics.edge_clearance,
          bottom: 2,
        },
        block_content_failures: [{
          shape_id: `${shapeManifest.slides[0].slide_id}-point-1-text`,
          overflow_reason: 'native_text_capacity_exceeded',
        }],
      },
      native_shapes: [
        ...shapeManifest.slides[0].native_shapes,
        {
          shape_id: `${shapeManifest.slides[0].slide_id}-chart`,
          kind: 'chart',
          role: 'chart',
          quality_role: 'chart',
        },
      ],
      issues: ['edge_clearance_out_of_range', 'block_content_overflow_detected'],
    };
    writeJson(authored.native_ppt_bundle.shape_manifest_file, shapeManifest);

    const directorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-quality',
      route: 'visual_director_review',
    });
    assert.equal(directorResult.ok, true);

    const screenshotResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-quality',
      route: 'screenshot_review',
    });
    assert.equal(screenshotResult.ok, false);
    const screenshotReview = readJson(path.join(
      workspaceRoot,
      'topics',
      'topic-a',
      'deliverables',
      'deck-quality',
      'artifacts',
      'quality_gate.json',
    ));
    assert.equal(screenshotReview.status, 'block');
    assert.equal(screenshotReview.checks.edge_clearance_ok, false);
    assert.equal(screenshotReview.checks.block_content_fit_ok, false);
    assert.equal(screenshotReview.review_state_patch.rerun_from_stage, 'repair_pptx_native');
    assert.equal(
      screenshotReview.slide_reviews[0].mechanical_issues.includes('block_content_overflow_detected'),
      true,
    );
    assert.equal(
      screenshotReview.mechanical_review.slide_reviews[0].metrics.block_content_failures[0].overflow_reason,
      'native_text_capacity_exceeded',
    );
    assert.equal(
      screenshotReview.mechanical_review.slide_reviews[0].issues.includes('native_chart_metrics_missing'),
      true,
    );
    assert.equal(
      screenshotReview.review_execution.ai_review_skipped_for_native_mechanical_block,
      true,
    );
    assert.equal(
      screenshotReview.review_execution.generation_runtime.adapter_surface,
      'deterministic_native_mechanical_gate',
    );
  });
});

test('native PPT visual director preflight blocks incomplete slots, unreadable labels, and unbalanced native layout', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-layout-gates-');
    await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-layout-gates' });

    const authorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-layout-gates',
      route: 'author_pptx_native',
    });
    assert.equal(authorResult.ok, true);
    const authored = readJson(authorResult.artifactFile);
    const shapeManifest = readJson(authored.native_ppt_bundle.shape_manifest_file);
    shapeManifest.slides[1] = {
      ...shapeManifest.slides[1],
      checks: {
        ...shapeManifest.slides[1].checks,
        slot_fill_ok: false,
        audience_label_readability_ok: false,
        content_depth_ok: false,
        grid_balance_ok: false,
      },
      metrics: {
        ...shapeManifest.slides[1].metrics,
        layout_variant: 'compare_four_zone',
        expected_slot_count: 4,
        filled_slot_count: 3,
        slot_fill_ok: false,
        slot_fill_failures: [{
          reason: 'panel_count_mismatch',
          role: 'compare_panel',
          expected: 4,
          actual: 3,
        }],
        audience_label_readability_ok: false,
        audience_label_font_floor_pt: 16,
        audience_label_readability_failures: [{
          shape_id: `${shapeManifest.slides[1].slide_id}-zone-1-index`,
          font_size: 12.5,
          threshold: 16,
        }],
        content_depth_ok: false,
        content_depth_floor_chars: 12,
        content_depth_failures: [{
          shape_id: `${shapeManifest.slides[1].slide_id}-zone-1-text`,
          role: 'point_text',
          text_char_count: 4,
          threshold: 12,
        }],
        grid_balance_ok: false,
        grid_balance_ratio: 2.24,
        grid_balance_failures: [{
          reason: 'panel_area_ratio_out_of_range',
          layout_variant: 'compare_four_zone',
          ratio: 2.24,
          min: 0.56,
          max: 1.78,
        }],
      },
      issues: [
        'native_slot_fill_failed',
        'audience_label_below_readability_floor',
        'native_content_depth_failed',
        'native_grid_balance_failed',
      ],
    };
    writeJson(authored.native_ppt_bundle.shape_manifest_file, shapeManifest);

    const directorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-layout-gates',
      route: 'visual_director_review',
    });
    assert.equal(directorResult.ok, false);
    const directorArtifact = readJson(path.join(
      workspaceRoot,
      'topics',
      'topic-a',
      'deliverables',
      'deck-layout-gates',
      'artifacts',
      'director_review.json',
    ));
    assert.equal(directorArtifact.status, 'block');
    assert.equal(directorArtifact.visual_director_review.anti_template_ok, false);
    assert.equal(directorArtifact.review_state_patch.rerun_from_stage, 'repair_pptx_native');
    assert.match(directorArtifact.visual_director_review.review_summary, /native content slot fill failed/);
    assert.match(directorArtifact.visual_director_review.review_summary, /native audience label readability failed/);
    assert.match(directorArtifact.visual_director_review.review_summary, /native content depth failed/);
    assert.match(directorArtifact.visual_director_review.review_summary, /native grid balance failed/);
    assert.equal(
      directorArtifact.visual_director_review.weak_pages.includes(shapeManifest.slides[1].slide_id),
      true,
    );
  });
});

test('native PPT visual director review blocks repeated native layout variants before screenshot review', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-layout-repetition-');
    await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-layout-repetition' });

    const authorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-layout-repetition',
      route: 'author_pptx_native',
    });
    assert.equal(authorResult.ok, true);
    const authored = readJson(authorResult.artifactFile);
    const shapeManifest = readJson(authored.native_ppt_bundle.shape_manifest_file);
    for (const slide of shapeManifest.slides.slice(1, 4)) {
      slide.layout_family = 'multi_zone_compare';
      slide.metrics = {
        ...slide.metrics,
        layout_variant: 'compare_four_zone',
        expected_slot_count: 4,
        filled_slot_count: 4,
      };
    }
    writeJson(authored.native_ppt_bundle.shape_manifest_file, shapeManifest);

    const poisonedAuthored = {
      ...authored,
      native_ppt_bundle: {
        ...authored.native_ppt_bundle,
        slides: authored.native_ppt_bundle.slides.map((slide, index) => (
          index >= 1 && index <= 3
            ? {
                ...slide,
                layout_family: 'multi_zone_compare',
                metrics: {
                  ...(slide.metrics || {}),
                  layout_variant: 'compare_four_zone',
                  expected_slot_count: 4,
                  filled_slot_count: 4,
                },
              }
            : slide
        )),
      },
    };
    writeJson(authorResult.artifactFile, poisonedAuthored);

    const directorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-layout-repetition',
      route: 'visual_director_review',
    });
    assert.equal(directorResult.ok, false);
    const directorArtifact = readJson(path.join(
      workspaceRoot,
      'topics',
      'topic-a',
      'deliverables',
      'deck-layout-repetition',
      'artifacts',
      'director_review.json',
    ));
    assert.equal(directorArtifact.status, 'block');
    assert.equal(directorArtifact.visual_director_review.anti_template_ok, false);
    assert.equal(directorArtifact.review_state_patch.rerun_from_stage, 'repair_pptx_native');
    assert.match(directorArtifact.visual_director_review.review_summary, /native homogeneous layout run/);
    assert.deepEqual(
      directorArtifact.visual_director_review.weak_pages.filter((slideId) => ['S02', 'S03', 'S04'].includes(slideId)),
      ['S02', 'S03', 'S04'],
    );
  });
});

test('native PPT visual director review blocks repeated composition signatures even when variant labels differ', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-composition-repetition-');
    await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-composition-repetition' });

    const authorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-composition-repetition',
      route: 'author_pptx_native',
    });
    assert.equal(authorResult.ok, true);
    const authored = readJson(authorResult.artifactFile);
    const repeatedSignature = 'top-title__core-under__lower-card-row__two-column-balanced';
    const repeatedVariants = ['compare_two_column', 'timeline_band', 'judgement_ladder'];
    const shapeManifest = readJson(authored.native_ppt_bundle.shape_manifest_file);
    for (const [offset, slide] of shapeManifest.slides.slice(1, 4).entries()) {
      slide.layout_family = ['multi_zone_compare', 'timeline_band', 'judgement_ladder'][offset];
      slide.metrics = {
        ...slide.metrics,
        layout_variant: repeatedVariants[offset],
        composition_signature: repeatedSignature,
      };
    }
    writeJson(authored.native_ppt_bundle.shape_manifest_file, shapeManifest);

    const poisonedAuthored = {
      ...authored,
      native_ppt_bundle: {
        ...authored.native_ppt_bundle,
        slides: authored.native_ppt_bundle.slides.map((slide, index) => (
          index >= 1 && index <= 3
            ? {
                ...slide,
                layout_family: ['multi_zone_compare', 'timeline_band', 'judgement_ladder'][index - 1],
                metrics: {
                  ...(slide.metrics || {}),
                  layout_variant: repeatedVariants[index - 1],
                  composition_signature: repeatedSignature,
                },
              }
            : slide
        )),
      },
    };
    writeJson(authorResult.artifactFile, poisonedAuthored);

    const directorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-composition-repetition',
      route: 'visual_director_review',
    });
    assert.equal(directorResult.ok, false);
    const directorArtifact = readJson(path.join(
      workspaceRoot,
      'topics',
      'topic-a',
      'deliverables',
      'deck-composition-repetition',
      'artifacts',
      'director_review.json',
    ));
    assert.equal(directorArtifact.status, 'block');
    assert.equal(directorArtifact.visual_director_review.anti_template_ok, false);
    assert.equal(directorArtifact.review_state_patch.rerun_from_stage, 'repair_pptx_native');
    assert.match(directorArtifact.visual_director_review.review_summary, /native repeated composition signature/);
    assert.deepEqual(
      directorArtifact.visual_director_review.weak_pages.filter((slideId) => ['S02', 'S03', 'S04'].includes(slideId)),
      ['S02', 'S03', 'S04'],
    );
  });
});

test('native PPT visual director review can clear prior full-deck block after targeted repair covers weak pages', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-director-clear-');
    const deliverableId = 'deck-native-director-clear';
    await runNativePlanningChain({ workspaceRoot, deliverableId });

    const authorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
      route: 'author_pptx_native',
    });
    assert.equal(authorResult.ok, true);

    const deliverableDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', deliverableId);
    const directorReviewFile = path.join(deliverableDir, 'artifacts', 'director_review.json');
    writeJson(directorReviewFile, {
      route: 'visual_director_review',
      status: 'block',
      visual_director_review: {
        director_intent_landed: false,
        anti_template_ok: false,
        peak_pages_landed: false,
        memory_hook_present: true,
        weak_pages: ['S01'],
        deterministic_preflight: {
          findings: ['S01: native content slot fill failed'],
        },
      },
      review_state_patch: {
        current_status: 'blocked_for_revision',
        ready_for_export: false,
        pending_reviews: ['anti_template_failed'],
        blocking_reasons: ['anti_template_failed'],
        rerun_from_stage: 'repair_pptx_native',
        rerun_policy: {
          status: 'rerun_required',
          rerun_from_stage: 'repair_pptx_native',
        },
      },
    });

    const repairResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
      route: 'repair_pptx_native',
    });
    assert.equal(repairResult.ok, true);

    const restoreDirectorVariant = withEnv({
      REDCUBE_MOCK_PPT_DIRECTOR_REVIEW_VARIANT: 'block_author_pptx_native_until_repair',
    });
    try {
      const reviewResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId,
        route: 'visual_director_review',
      });
      assert.equal(reviewResult.ok, true);
      const review = readJson(reviewResult.artifactFile);
      assert.equal(review.visual_director_review.director_intent_landed, true);
      assert.equal(review.visual_director_review.anti_template_ok, true);
      assert.equal(review.visual_director_review.peak_pages_landed, true);
      assert.deepEqual(review.visual_director_review.weak_pages, []);
    } finally {
      restoreDirectorVariant();
    }
  });
});

test('native PPT proof lane records the Python engine contract as the single ownership source', () => {
  const engineContract = nativeEngineContract();
  const proofLane = readJson(path.resolve('contracts/runtime-program/ppt-native-authoring-proof-lane.json'));
  const currentProgram = readJson(path.resolve('contracts/runtime-program/current-program.json'));

  assert.equal(engineContract.language, 'python');
  assert.deepEqual(engineContract.owned_routes, ['author_pptx_native', 'repair_pptx_native']);
  assert.deepEqual(engineContract.ai_first_boundary, {
    creative_owner: 'llm_agent',
    helper_role: 'execute_validate_export_only',
    template_substitution_allowed: false,
    editable_shape_plan_required: true,
    editable_shape_manifest_required: true,
    design_spec_lock_required: true,
    per_page_visual_plan_required: true,
    ppt_master_style_discipline_adopted: [
      'spec_lock',
      'per_page_visual_plan',
      'svg_qa_before_export',
      'rendered_quality_gate',
    ],
    layout_intent_required: true,
    composition_signature_required: true,
    title_underline_motif_allowed: false,
    concrete_layout_variant_repetition_limit: 2,
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
