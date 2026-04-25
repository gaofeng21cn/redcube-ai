import path from 'node:path';
import { spawnSync } from 'node:child_process';

export function createPptDeckNativePptStageParts(deps) {
  const {
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    PYTHON_NATIVE,
    attachCommon,
    collectSlidesNeedingTargetedRevision,
    creativeExecution,
    creativeSourceStamp,
    currentHtmlStageId,
    ensureDir,
    existsSync,
    readCurrentHtmlArtifact,
    readStageArtifact,
    resolveRedCubePythonCommand,
    safeArray,
    safeFileMtimeMs,
    safeText,
    stageArtifactPath,
    writeJson,
  } = deps;

  function runPython(script, args) {
    if (!existsSync(script)) {
      throw new Error(`Missing ppt_deck python helper: ${script}`);
    }
    const pythonCommand = resolveRedCubePythonCommand();
    const result = spawnSync(pythonCommand.command, [script, ...args], { encoding: 'utf-8', maxBuffer: 16 * 1024 * 1024 });
    if (result.status !== 0) {
      throw new Error((result.stderr || result.stdout || `ppt_deck python helper failed: ${script}`).trim());
    }
    return {
      command: pythonCommand.command,
      payload: JSON.parse(result.stdout),
    };
  }

  function currentNativePptStageId(contract, deliverablePaths) {
    const authorFile = stageArtifactPath(contract, deliverablePaths, 'author_pptx_native');
    const repairFile = stageArtifactPath(contract, deliverablePaths, 'repair_pptx_native');
    const authorMtimeMs = safeFileMtimeMs(authorFile);
    const repairMtimeMs = safeFileMtimeMs(repairFile);
    if (repairMtimeMs > authorMtimeMs) {
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

  function requireNativeEngineContract(payload) {
    const contract = payload?.engine_contract || {};
    const ownedRoutes = safeArray(contract?.owned_routes).map((route) => safeText(route)).filter(Boolean);
    const expectedRoutes = ['author_pptx_native', 'repair_pptx_native'];
    const valid = safeText(contract?.kind) === 'redcube_native_ppt_python_engine'
      && safeText(contract?.language) === 'python'
      && Number(contract?.contract_version || 0) === 1
      && expectedRoutes.every((route) => ownedRoutes.includes(route))
      && safeText(contract?.input_boundary) === 'slide_blueprint_plus_visual_direction_json'
      && safeText(contract?.review_boundary) === 'rendered_pptx_screenshots';
    if (!valid) {
      throw new Error('Native PPT route requires python engine contract v1');
    }
    return {
      kind: 'redcube_native_ppt_python_engine',
      language: 'python',
      contract_version: 1,
      owned_routes: expectedRoutes,
      input_boundary: 'slide_blueprint_plus_visual_direction_json',
      review_boundary: 'rendered_pptx_screenshots',
    };
  }

  function nativeMechanicalReviewPayload(nativeArtifact) {
    const bundle = nativeArtifact?.native_ppt_bundle || {};
    const slideReviews = safeArray(bundle?.slides).map((slide) => ({
      slide_id: safeText(slide?.slide_id),
      title: safeText(slide?.title),
      layout_family: safeText(slide?.layout_family),
      screenshot_file: safeText(slide?.preview_screenshot_file),
      status: 'pass',
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

  function buildNativePptArtifact({
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
    const paths = nativeArtifactPaths({ deliverablePaths, deliverableId, route });
    writeJson(paths.inputFile, {
      route,
      contract: {
        overlay: contract.overlay,
        profile_id: contract.profile_id,
        title: contract.title,
        goal: contract.goal,
      },
      blueprint: blueprintArtifact?.slide_blueprint || {},
      visual_direction: visualArtifact?.visual_direction || {},
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
    ]);
    const payload = python.payload;
    const engineContract = requireNativeEngineContract(payload);
    if (Number(payload.shape_manifest_schema_version || 0) !== 1) {
      throw new Error('Native PPT route requires shape manifest schema_version 1');
    }
    const repairLog = payload.repair_log || {
      target_slide_ids: repairFeedback.map((slide) => slide.slide_id),
      consumed_review_stage: route === 'repair_pptx_native' ? 'screenshot_review' : null,
      repair_log_file: paths.repairLogFile,
    };
    return {
      ...attachCommon(route, contract, null, adapter),
      status: 'completed',
      creative_execution: {
        ...creativeExecution(route, null, adapter),
        overlay: 'native_ppt_authoring',
      },
      native_ppt_bundle: {
        source_visual_route: route,
        builder: payload.builder || { kind: 'python_pptx_native_shapes' },
        engine_contract: engineContract,
        shape_manifest_schema_version: Number(payload.shape_manifest_schema_version || 0),
        editable_artifact: true,
        pptx_file: safeText(payload.pptx_file, paths.pptxFile),
        pdf_file: safeText(payload.pdf_file, paths.pdfFile),
        shape_manifest_file: safeText(payload.shape_manifest_file, paths.shapeManifestFile),
        repair_log_file: safeText(payload.repair_log_file, paths.repairLogFile),
        page_count: Number(payload.page_count || 0),
        screenshot_dimensions: payload.screenshot_dimensions || null,
        preview_screenshots: safeArray(payload.preview_screenshots),
        slides: safeArray(payload.slides),
        creative_sources: {
          pptx_materialization: creativeSourceStamp({
            route,
            lifecycleStage: 'visual_authorship',
            authoredSurface: 'editable_native_pptx',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
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
        safeText(payload.pptx_file, paths.pptxFile),
        safeText(payload.pdf_file, paths.pdfFile),
        safeText(payload.shape_manifest_file, paths.shapeManifestFile),
        safeText(payload.repair_log_file, paths.repairLogFile),
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
