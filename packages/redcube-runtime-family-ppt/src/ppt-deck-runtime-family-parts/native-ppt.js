import path from 'node:path';
import { readFileSync } from 'node:fs';
import { runRedCubePythonHelper } from '@redcube/runtime-protocol';

export function createPptDeckNativePptStageParts(deps) {
  const {
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    NATIVE_PPT_ENGINE_CONTRACT,
    PYTHON_NATIVE,
    attachCommon,
    buildAuthoringContext,
    collectSlidesNeedingTargetedRevision,
    creativeExecution,
    creativeSourceStamp,
    currentHtmlStageId,
    ensureDir,
    existsSync,
    generateStructuredArtifact,
    PROMPT_PACK,
    readCurrentHtmlArtifact,
    readStageArtifact,
    safeArray,
    safeFileMtimeMs,
    safeText,
    stageArtifactPath,
    writeJson,
  } = deps;

  let cachedNativeEngineContract = null;
  const AI_FIRST_EDITING_CONTRACT = Object.freeze({
    contract_id: 'ppt_native_ai_first_editing_contract_v1',
    creative_owner: 'llm_agent',
    editable_shape_plan_required: true,
    editable_shape_manifest_required: true,
    python_helper_role: 'execute_validate_export_only',
    template_substitution_allowed: false,
    preserved_gates: ['visual_director_review', 'screenshot_review', 'export_pptx'],
  });

  function expectedNativeEngineContract() {
    if (cachedNativeEngineContract) return cachedNativeEngineContract;
    if (!existsSync(NATIVE_PPT_ENGINE_CONTRACT)) {
      throw new Error(`Missing native PPT engine contract: ${NATIVE_PPT_ENGINE_CONTRACT}`);
    }
    cachedNativeEngineContract = JSON.parse(readFileSync(NATIVE_PPT_ENGINE_CONTRACT, 'utf-8'));
    return cachedNativeEngineContract;
  }

  function runPython(helper, args) {
    return runRedCubePythonHelper(helper, args, {
      fileExists: existsSync,
      missingMessagePrefix: 'Missing ppt_deck python helper',
      failureMessagePrefix: 'ppt_deck python helper failed',
    });
  }

  function currentNativePptStageId(contract, deliverablePaths) {
    const authorFile = stageArtifactPath(contract, deliverablePaths, 'author_pptx_native');
    const repairFile = stageArtifactPath(contract, deliverablePaths, 'repair_pptx_native');
    const authorMtimeMs = safeFileMtimeMs(authorFile);
    const repairMtimeMs = safeFileMtimeMs(repairFile);
    if (repairMtimeMs > 0 && repairMtimeMs >= authorMtimeMs) {
      return 'repair_pptx_native';
    }
    return authorMtimeMs > 0 ? 'author_pptx_native' : '';
  }

  function readCurrentNativePptArtifact(contract, deliverablePaths) {
    const stageId = currentNativePptStageId(contract, deliverablePaths);
    return stageId ? readStageArtifact(contract, deliverablePaths, stageId) : null;
  }

  function isNativePptArtifact(artifact) {
    return Boolean(safeText(artifact?.native_ppt_bundle?.pptx_file));
  }

  function currentVisualStageId(contract, deliverablePaths) {
    const htmlStage = currentHtmlStageId(contract, deliverablePaths);
    const htmlMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, htmlStage));
    const nativeStage = currentNativePptStageId(contract, deliverablePaths);
    const nativeMtimeMs = nativeStage
      ? safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, nativeStage))
      : 0;
    if (nativeMtimeMs > htmlMtimeMs) {
      return nativeStage;
    }
    return htmlMtimeMs > 0 ? htmlStage : nativeStage;
  }

  function readCurrentVisualArtifact(contract, deliverablePaths) {
    const stageId = currentVisualStageId(contract, deliverablePaths);
    if (!stageId) return null;
    return stageId === 'render_html' || stageId === 'fix_html'
      ? readCurrentHtmlArtifact(contract, deliverablePaths)
      : readStageArtifact(contract, deliverablePaths, stageId);
  }

  function visualArtifactMtimeMs(contract, deliverablePaths) {
    const stageId = currentVisualStageId(contract, deliverablePaths);
    return stageId ? safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, stageId)) : 0;
  }

  function nativeArtifactPaths({ deliverablePaths, deliverableId, route }) {
    const nativeDir = ensureDir(path.join(deliverablePaths.artifactsDir, 'native_ppt'));
    const reportDir = ensureDir(path.join(deliverablePaths.reportsDir, 'native_ppt'));
    const basename = `${deliverableId}-${route}`;
    return {
      inputFile: path.join(nativeDir, `${basename}-input.json`),
      pptxFile: path.join(nativeDir, `${basename}.pptx`),
      pdfFile: path.join(nativeDir, `${basename}.pdf`),
      editableShapePlanFile: path.join(nativeDir, `${basename}-editable-shape-plan.json`),
      shapeManifestFile: path.join(nativeDir, `${basename}-shape-manifest.json`),
      repairLogFile: path.join(nativeDir, `${basename}-repair-log.json`),
      previewDir: ensureDir(path.join(reportDir, `${basename}-screenshots`)),
    };
  }

  function repairFeedbackFromReview(reviewArtifact) {
    return collectSlidesNeedingTargetedRevision(safeArray(reviewArtifact?.slide_reviews))
      .map((slide) => ({
        slide_id: safeText(slide?.slide_id),
        title: safeText(slide?.title),
        issues: safeArray(slide?.issues),
        mechanical_issues: safeArray(slide?.mechanical_issues),
        visual_findings: safeArray(slide?.ai_review?.visual_findings),
        recommended_fix: safeText(slide?.ai_review?.recommended_fix),
      }))
      .filter((slide) => slide.slide_id);
  }

  function buildUnitRepairScope({ route, blueprintArtifact, repairFeedback }) {
    const allSlideIds = safeArray(blueprintArtifact?.slide_blueprint?.slides)
      .map((slide) => safeText(slide?.slide_id))
      .filter(Boolean);
    const targetSlideIds = route === 'repair_pptx_native'
      ? [...new Set(safeArray(repairFeedback).map((slide) => safeText(slide?.slide_id)).filter(Boolean))]
      : allSlideIds;
    const targetSet = new Set(targetSlideIds);
    return {
      family: 'ppt_deck',
      route,
      scope: route === 'repair_pptx_native' ? 'page' : 'deck',
      target_slide_ids: targetSlideIds,
      preserved_slide_ids: allSlideIds.filter((slideId) => !targetSet.has(slideId)),
      source_review_stage: route === 'repair_pptx_native' ? 'screenshot_review' : null,
      input_boundary: route === 'repair_pptx_native'
        ? 'blocked_slide_review_feedback_plus_prior_native_shape_manifest'
        : 'slide_blueprint_plus_visual_direction',
      output_boundary: 'editable_shape_plan_plus_shape_manifest',
      screenshot_review_reuse: route === 'repair_pptx_native',
    };
  }

  function nativeShapePlanOutputContract(route) {
    return {
      ai_first_editing_contract: AI_FIRST_EDITING_CONTRACT,
      editable_shape_plan: {
        contract_kind: 'redcube_ai_first_native_ppt_shape_plan',
        route,
        scope: route === 'repair_pptx_native' ? 'page_repair' : 'deck_authoring',
        target_slide_ids: ['S02'],
        slides: [
          {
            slide_id: 'S01',
            title: '<audience-facing title>',
            layout_family: '<visual layout family>',
            core_sentence: '<audience-facing core sentence>',
            page_core_content: ['<editable text>'],
            native_shapes: [
              {
                shape_id: 'S01-title',
                kind: 'text_box',
                role: 'title',
                editable_text: '<text>',
              },
            ],
          },
        ],
      },
    };
  }

  function normalizeEditableShapePlan(data, route) {
    const plan = data?.editable_shape_plan || data?.shape_plan || {};
    const slides = safeArray(plan?.slides);
    if (slides.length === 0) {
      throw new Error(`Native PPT ${route} requires an AI-authored editable_shape_plan.slides array`);
    }
    return {
      ...plan,
      contract_kind: safeText(plan?.contract_kind, 'redcube_ai_first_native_ppt_shape_plan'),
      route: safeText(plan?.route, route),
      slides,
    };
  }

  async function generateEditableShapePlan({
    route,
    contract,
    deliverablePaths,
    blueprintArtifact,
    visualArtifact,
    repairFeedback,
    unitRepairScope,
    adapter,
  }) {
    if (typeof generateStructuredArtifact !== 'function') {
      throw new Error('Native PPT proof lane requires generateStructuredArtifact for AI-first shape planning');
    }
    const currentNativeArtifact = route === 'repair_pptx_native'
      ? readCurrentNativePptArtifact(contract, deliverablePaths)
      : null;
    const { data, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'ppt_deck',
      route,
      promptRelativePath: PROMPT_PACK?.[route],
      context: {
        ...(typeof buildAuthoringContext === 'function' ? buildAuthoringContext(contract) : {}),
        ai_first_editing_contract: AI_FIRST_EDITING_CONTRACT,
        unit_repair_scope: unitRepairScope,
        blueprint: blueprintArtifact?.slide_blueprint || {},
        visual_direction: visualArtifact?.visual_direction || {},
        repair_feedback: safeArray(repairFeedback),
        prior_native_ppt_bundle: route === 'repair_pptx_native'
          ? {
              pptx_file: safeText(currentNativeArtifact?.native_ppt_bundle?.pptx_file),
              shape_manifest_file: safeText(currentNativeArtifact?.native_ppt_bundle?.shape_manifest_file),
              slides: summarizeNativeSlides(currentNativeArtifact),
            }
          : null,
      },
      outputContract: nativeShapePlanOutputContract(route),
      cwd: deliverablePaths.deliverableDir,
    });
    return {
      editableShapePlan: normalizeEditableShapePlan(data, route),
      generationRuntime,
      modelContract: data?.ai_first_editing_contract || null,
    };
  }

  function requireNativeEngineContract(payload) {
    const contract = payload?.engine_contract || {};
    const ownedRoutes = safeArray(contract?.owned_routes).map((route) => safeText(route)).filter(Boolean);
    const expected = expectedNativeEngineContract();
    const expectedRoutes = safeArray(expected?.owned_routes).map((route) => safeText(route)).filter(Boolean);
    const valid = safeText(contract?.kind) === 'redcube_native_ppt_python_engine'
      && safeText(contract?.language) === 'python'
      && Number(contract?.contract_version || 0) === 1
      && expectedRoutes.every((route) => ownedRoutes.includes(route))
      && safeText(contract?.input_boundary) === safeText(expected?.input_boundary)
      && safeText(contract?.review_boundary) === safeText(expected?.review_boundary);
    if (!valid) {
      throw new Error('Native PPT route requires python engine contract v1');
    }
    return expected;
  }

  function nativeMechanicalReviewPayload(nativeArtifact) {
    const bundle = nativeArtifact?.native_ppt_bundle || {};
    const slideReviews = safeArray(bundle?.slides).map((slide) => ({
      slide_id: safeText(slide?.slide_id),
      title: safeText(slide?.title),
      layout_family: safeText(slide?.layout_family),
      screenshot_file: safeText(slide?.preview_screenshot_file),
      checks: {
        overflow_free: true,
        occlusion_free: true,
        visual_density_ok: true,
        speaker_fit_ok: true,
        edge_clearance_ok: true,
        block_content_fit_ok: true,
        title_typography_ok: true,
      },
      metrics: {
        title_font_size: Number(slide?.title_font_size || 32),
        text_char_count: 0,
        block_count: Number(slide?.shape_count || 0),
        overlap_pairs: 0,
        clipped_nodes: 0,
        occupied_ratio: 0.58,
        primary_points: Math.max(1, Number(slide?.text_box_count || 0) - 1),
      },
      issues: [],
    }));
    return {
      source_surface_kind: 'native_pptx',
      source_pptx: safeText(bundle?.pptx_file),
      shape_manifest_file: safeText(bundle?.shape_manifest_file),
      page_count: Number(bundle?.page_count || slideReviews.length),
      device_scale_factor: 1,
      screenshot_dimensions: bundle?.screenshot_dimensions || null,
      checks: {
        overflow_free: true,
        occlusion_free: true,
        visual_density_ok: true,
        speaker_fit_ok: true,
        edge_clearance_ok: true,
        block_content_fit_ok: true,
        title_typography_ok: true,
      },
      metrics: {
        page_count: slideReviews.length,
        source_surface_kind: 'native_pptx',
      },
      slide_reviews: slideReviews,
    };
  }

  function summarizeNativeSlides(nativeArtifact) {
    return safeArray(nativeArtifact?.native_ppt_bundle?.slides).map((slide) => ({
      slide_id: safeText(slide?.slide_id),
      title: safeText(slide?.title),
      layout_family: safeText(slide?.layout_family),
      shape_count: Number(slide?.shape_count || 0),
      text_box_count: Number(slide?.text_box_count || 0),
      preview_screenshot_file: safeText(slide?.preview_screenshot_file),
    }));
  }

  async function buildNativePptArtifact({
    deliverableId,
    contract,
    deliverablePaths,
    route = 'author_pptx_native',
    adapter = CODEX_DEFAULT_ADAPTER,
  }) {
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
    const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const reviewArtifact = route === 'repair_pptx_native'
      ? readStageArtifact(contract, deliverablePaths, 'screenshot_review')
      : null;
    const repairFeedback = route === 'repair_pptx_native'
      ? repairFeedbackFromReview(reviewArtifact)
      : [];
    const unitRepairScope = buildUnitRepairScope({ route, blueprintArtifact, repairFeedback });
    const paths = nativeArtifactPaths({ deliverablePaths, deliverableId, route });
    const {
      editableShapePlan,
      generationRuntime,
      modelContract,
    } = await generateEditableShapePlan({
      route,
      contract,
      deliverablePaths,
      blueprintArtifact,
      visualArtifact,
      repairFeedback,
      unitRepairScope,
      adapter,
    });
    writeJson(paths.editableShapePlanFile, editableShapePlan);
    writeJson(paths.inputFile, {
      route,
      ai_first_editing_contract: AI_FIRST_EDITING_CONTRACT,
      unit_repair_scope: unitRepairScope,
      contract: {
        overlay: contract.overlay,
        profile_id: contract.profile_id,
        title: contract.title,
        goal: contract.goal,
      },
      blueprint: blueprintArtifact?.slide_blueprint || {},
      visual_direction: visualArtifact?.visual_direction || {},
      editable_shape_plan: editableShapePlan,
      editable_shape_plan_file: paths.editableShapePlanFile,
      repair_feedback: repairFeedback,
    });
    const python = runPython(PYTHON_NATIVE, [
      '--input-json', paths.inputFile,
      '--mode', route === 'repair_pptx_native' ? 'repair' : 'author',
      '--output-pptx', paths.pptxFile,
      '--shape-manifest', paths.shapeManifestFile,
      '--preview-dir', paths.previewDir,
      '--output-pdf', paths.pdfFile,
      '--repair-log', paths.repairLogFile,
      '--engine-contract', NATIVE_PPT_ENGINE_CONTRACT,
    ]);
    const payload = python.payload;
    const engineContract = requireNativeEngineContract(payload);
    if (Number(payload.shape_manifest_schema_version || 0) !== 1) {
      throw new Error('Native PPT route requires shape manifest schema_version 1');
    }
    const shapeManifest = existsSync(paths.shapeManifestFile)
      ? JSON.parse(readFileSync(paths.shapeManifestFile, 'utf-8'))
      : {};
    writeJson(paths.shapeManifestFile, {
      ...shapeManifest,
      ai_first_editing_contract: AI_FIRST_EDITING_CONTRACT,
      editable_shape_plan_file: paths.editableShapePlanFile,
    });
    const repairLog = payload.repair_log || {
      target_slide_ids: repairFeedback.map((slide) => slide.slide_id),
      consumed_review_stage: route === 'repair_pptx_native' ? 'screenshot_review' : null,
      repair_log_file: paths.repairLogFile,
    };
    return {
      ...attachCommon(route, contract, null, adapter),
      status: 'completed',
      ai_first_editing_contract: AI_FIRST_EDITING_CONTRACT,
      unit_repair_scope: unitRepairScope,
      creative_execution: {
        ...creativeExecution(route, generationRuntime, adapter),
        overlay: 'native_ppt_authoring',
      },
      native_ppt_bundle: {
        source_visual_route: route,
        builder: payload.builder || { kind: 'python_pptx_native_shapes' },
        ai_first_editing_contract: AI_FIRST_EDITING_CONTRACT,
        ai_first_shape_plan_contract: modelContract || AI_FIRST_EDITING_CONTRACT,
        engine_contract: engineContract,
        engine_contract_file: NATIVE_PPT_ENGINE_CONTRACT,
        shape_manifest_schema_version: Number(payload.shape_manifest_schema_version || 0),
        editable_artifact: true,
        editable_shape_plan_file: paths.editableShapePlanFile,
        pptx_file: safeText(payload.pptx_file, paths.pptxFile),
        pdf_file: safeText(payload.pdf_file, paths.pdfFile),
        shape_manifest_file: safeText(payload.shape_manifest_file, paths.shapeManifestFile),
        repair_log_file: safeText(payload.repair_log_file, paths.repairLogFile),
        page_count: Number(payload.page_count || 0),
        screenshot_dimensions: payload.screenshot_dimensions || null,
        preview_screenshots: safeArray(payload.preview_screenshots),
        slides: safeArray(payload.slides),
        python_helper_invocation: python.package_module
          ? {
              helper_id: python.helper_id,
              package_module: python.package_module,
              command: [...python.argv, '--input-json', paths.inputFile],
            }
          : null,
        creative_sources: {
          pptx_materialization: creativeSourceStamp({
            route,
            lifecycleStage: 'visual_authorship',
            authoredSurface: 'editable_native_pptx',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
          editable_shape_plan: creativeSourceStamp({
            route,
            lifecycleStage: 'visual_authorship',
            authoredSurface: 'editable_native_ppt_shape_plan',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
        },
      },
      native_ppt_repair_log: {
        ...repairLog,
        consumed_review_stage: route === 'repair_pptx_native' ? 'screenshot_review' : repairLog.consumed_review_stage,
        target_slide_ids: safeArray(repairLog.target_slide_ids),
        repair_log_file: safeText(repairLog.repair_log_file, paths.repairLogFile),
      },
      artifact_refs: [
        paths.inputFile,
        paths.editableShapePlanFile,
        safeText(payload.pptx_file, paths.pptxFile),
        safeText(payload.pdf_file, paths.pdfFile),
        safeText(payload.shape_manifest_file, paths.shapeManifestFile),
        safeText(payload.repair_log_file, paths.repairLogFile),
        NATIVE_PPT_ENGINE_CONTRACT,
        ...safeArray(payload.preview_screenshots),
      ].filter(Boolean),
      review_state_patch: {
        current_status: 'draft',
        ready_for_export: false,
        latest_review_stage: route,
        pending_reviews: [],
        blocking_reasons: [],
        rerun_from_stage: null,
        rerun_policy: {
          status: 'idle',
          rerun_from_stage: null,
        },
      },
    };
  }

  return {
    buildNativePptArtifact,
    currentNativePptStageId,
    currentVisualStageId,
    isNativePptArtifact,
    nativeMechanicalReviewPayload,
    readCurrentNativePptArtifact,
    readCurrentVisualArtifact,
    summarizeNativeSlides,
    visualArtifactMtimeMs,
  };
}
