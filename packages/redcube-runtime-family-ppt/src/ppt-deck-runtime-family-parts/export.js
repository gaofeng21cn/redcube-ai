import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';

export function createPptDeckExportStageParts(deps) {
  const {
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    PYTHON_EXPORT,
    attachCommon,
    ensureDir,
    existsSync: mainExistsSync,
    getDeliverablePaths,
    getDeliverableViewSurfacePaths,
    isNativePptArtifact,
    readCurrentVisualArtifact,
    readStageArtifact,
    resolveRedCubePythonCommand,
    safeArray,
    safeText,
    writeText,
  } = deps;

  function runPython(script, args) {
    if (!(mainExistsSync || existsSync)(script)) {
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

  function hashFileIfPresent(hash, file) {
    const resolvedFile = safeText(file);
    hash.update(resolvedFile);
    hash.update('\n');
    if (resolvedFile && (mainExistsSync || existsSync)(resolvedFile)) {
      hash.update(readFileSync(resolvedFile));
    }
    hash.update('\n');
  }

  function hashReviewInput(renderArtifact) {
    if (isNativePptArtifact(renderArtifact)) {
      const hash = createHash('sha256');
      hash.update('ppt_deck_native_ppt_screenshot_mechanics:v1\n');
      hashFileIfPresent(hash, renderArtifact?.native_ppt_bundle?.pptx_file);
      hashFileIfPresent(hash, renderArtifact?.native_ppt_bundle?.shape_manifest_file);
      for (const file of safeArray(renderArtifact?.native_ppt_bundle?.preview_screenshots)) {
        hashFileIfPresent(hash, file);
      }
      return hash.digest('hex');
    }
    const htmlFile = safeText(renderArtifact?.html_bundle?.html_file);
    const hash = createHash('sha256');
    hash.update('ppt_deck_screenshot_mechanics:v1\n');
    hash.update(`${CANVAS.width}x${CANVAS.height}\n`);
    hash.update(htmlFile);
    hash.update('\n');
    if (htmlFile && (mainExistsSync || existsSync)(htmlFile)) {
      hash.update(readFileSync(htmlFile));
    }
    hash.update('\nslides\n');
    hash.update(JSON.stringify(safeArray(renderArtifact?.html_bundle?.slides).map((slide) => ({
      slide_id: safeText(slide?.slide_id),
      title: safeText(slide?.title),
      html: safeText(slide?.html || slide?.content_html || slide?.content),
    }))));
    return hash.digest('hex');
  }

  function hashExportPreviewInput({ stableViewHtmlFile, reviewArtifact }) {
    const hash = createHash('sha256');
    hash.update('ppt_deck_export_preview:v1\n');
    hash.update(`${CANVAS.width}x${CANVAS.height}\n`);
    hashFileIfPresent(hash, stableViewHtmlFile);
    hash.update('screenshots\n');
    for (const slide of safeArray(reviewArtifact?.slide_reviews)) {
      hash.update(safeText(slide?.slide_id));
      hash.update('\n');
      hashFileIfPresent(hash, slide?.screenshot_file);
      hash.update(JSON.stringify(slide?.metrics || {}));
      hash.update('\n');
    }
    return hash.digest('hex');
  }

  function exportPreviewCacheMetadata(cacheStatus, hash) {
    return {
      cache_status: cacheStatus,
      hash,
      freshness: cacheStatus === 'hit' ? 'current' : 'fresh',
    };
  }

  function exportPreviewMetricsFromPayload({ exportPayload, renderArtifact, reviewArtifact }) {
    return {
      page_count: Number(exportPayload?.page_count || 0),
      render_page_count: Number(renderArtifact?.html_bundle?.page_count || 0),
      reviewed_page_count: safeArray(reviewArtifact?.slide_reviews).length,
      page_count_match: Number(exportPayload?.page_count || 0) === Number(renderArtifact?.html_bundle?.page_count || 0),
    };
  }

  function cachedExportPreview(priorArtifact, hash) {
    if (safeText(priorArtifact?.export_bundle?.preview_cache?.hash) !== hash) return null;
    const pptxFile = safeText(priorArtifact?.export_bundle?.pptx_file);
    const pdfFile = safeText(priorArtifact?.export_bundle?.pdf_file);
    if (!pptxFile || !(mainExistsSync || existsSync)(pptxFile)) return null;
    if (pdfFile && !(mainExistsSync || existsSync)(pdfFile)) return null;
    const metrics = priorArtifact?.export_bundle?.preview_metrics;
    if (!metrics || typeof metrics !== 'object') return null;
    return {
      page_count: Number(metrics.page_count || 0),
      metrics,
    };
  }

  function buildNativeExportBundle({ renderArtifact, reviewArtifact, pptxFile, pdfFile, notesFile, adapter, contract }) {
    const bundle = renderArtifact.native_ppt_bundle || {};
    const sourcePptx = safeText(bundle.pptx_file);
    const sourcePdf = safeText(bundle.pdf_file);
    const shapeManifestFile = safeText(bundle.shape_manifest_file);
    const repairLogFile = safeText(bundle.repair_log_file);
    if (!sourcePptx || !(mainExistsSync || existsSync)(sourcePptx)) {
      throw new Error(`Route export_pptx requires native PPTX source before export: ${sourcePptx}`);
    }
    if (!sourcePdf || !(mainExistsSync || existsSync)(sourcePdf)) {
      throw new Error(`Route export_pptx requires native PPTX preview PDF before export: ${sourcePdf}`);
    }
    copyFileSync(sourcePptx, pptxFile);
    copyFileSync(sourcePdf, pdfFile);
    const pageCount = Number(bundle.page_count || safeArray(bundle.slides).length);
    const previewMetrics = {
      page_count: pageCount,
      render_page_count: pageCount,
      reviewed_page_count: safeArray(reviewArtifact?.slide_reviews).length,
      page_count_match: safeArray(reviewArtifact?.slide_reviews).length === pageCount,
    };
    return {
      ...attachCommon('export_pptx', contract, null, adapter),
      status: 'completed',
      review_state_patch: {
        current_status: 'completed',
        ready_for_export: true,
        latest_review_stage: 'export_pptx',
        pending_reviews: [],
        blocking_reasons: [],
        rerun_from_stage: null,
        rerun_policy: {
          status: 'idle',
          rerun_from_stage: null,
        },
      },
      export_bundle: {
        source_visual_route: safeText(renderArtifact.route),
        source_pptx: sourcePptx,
        source_html: null,
        native_ppt_shape_manifest: shapeManifestFile,
        native_ppt_repair_log: repairLogFile,
        pptx_file: pptxFile,
        pdf_file: pdfFile,
        presenter_notes_file: notesFile,
        review_capture: reviewArtifact.review_capture || null,
        delivery_state: {
          current: 'output_ready',
          next: null,
        },
        page_count: pageCount,
        page_count_match: previewMetrics.page_count_match,
        preview_cache: {
          cache_status: 'miss',
          hash: hashReviewInput(renderArtifact),
          freshness: 'fresh',
        },
        preview_metrics: previewMetrics,
        real_conversion_invocation: {
          tool: 'native_pptx_copy',
          script: 'packages/redcube-runtime/scripts/ppt_deck_native.py',
          command: ['--source-pptx', sourcePptx, '--output-pptx', pptxFile],
        },
      },
      artifact_refs: [sourcePptx, shapeManifestFile, repairLogFile, pptxFile, pdfFile, notesFile].filter(Boolean),
    };
  }

  function buildExportArtifact({
    workspaceRoot,
    topicId,
    deliverableId,
    contract,
    adapter = CODEX_DEFAULT_ADAPTER,
  }) {
    const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
    const reviewArtifact = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
    const renderArtifact = readCurrentVisualArtifact(contract, deliverablePaths);
    const publishDir = ensureDir(path.join(deliverablePaths.deliverableDir, 'publish'));
    const pptxFile = path.join(publishDir, `${deliverableId}.pptx`);
    const pdfFile = path.join(publishDir, `${deliverableId}.pdf`);
    const notesFile = path.join(publishDir, `${deliverableId}-presenter-notes.md`);
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
    writeText(notesFile, blueprintArtifact.slide_blueprint.slides.map((slide) => `## ${slide.slide_id} ${slide.title}\n\n${slide.speaker_notes}`).join('\n\n'));
    if (isNativePptArtifact(renderArtifact)) {
      return buildNativeExportBundle({ renderArtifact, reviewArtifact, pptxFile, pdfFile, notesFile, adapter, contract });
    }
    const screenshotsDir = safeText(reviewArtifact?.review_capture?.screenshots_dir);
    if (!screenshotsDir) {
      throw new Error('Route export_pptx requires screenshot_review immutable capture screenshots; rerun screenshot_review before export');
    }
    if (!(mainExistsSync || existsSync)(screenshotsDir)) {
      throw new Error(`Reviewed screenshot capture directory not found: ${screenshotsDir}`);
    }
    const stableViewHtmlFile = getDeliverableViewSurfacePaths(deliverablePaths, deliverableId).stableHtmlFile;
    if (!(mainExistsSync || existsSync)(stableViewHtmlFile)) {
      throw new Error(`Route export_pptx requires reviewed stable HTML surface before export: ${stableViewHtmlFile}`);
    }
    const previewHash = hashExportPreviewInput({ stableViewHtmlFile, reviewArtifact });
    const priorExportArtifact = readStageArtifact(contract, deliverablePaths, 'export_pptx');
    const cachedPreview = cachedExportPreview(priorExportArtifact, previewHash);
    const previewCacheStatus = cachedPreview ? 'hit' : 'miss';
    const python = cachedPreview ? { command: 'cache', payload: cachedPreview } : runPython(PYTHON_EXPORT, [
      '--screenshots-dir', screenshotsDir,
      '--output-pptx', pptxFile,
      '--output-pdf', pdfFile,
    ]);
    const exportPayload = python.payload;
    const pptxPath = cachedPreview ? (priorExportArtifact.export_bundle.pptx_file || pptxFile) : (exportPayload.pptx_file || exportPayload.pptx_path);
    const pdfPath = cachedPreview ? (priorExportArtifact.export_bundle.pdf_file || pdfFile) : (exportPayload.pdf_file || exportPayload.pdf_path);
    const previewMetrics = cachedPreview?.metrics || exportPreviewMetricsFromPayload({ exportPayload, renderArtifact, reviewArtifact });
    return {
      ...attachCommon('export_pptx', contract, null, adapter),
      status: 'completed',
      review_state_patch: {
        current_status: 'completed',
        ready_for_export: true,
        latest_review_stage: 'export_pptx',
        pending_reviews: [],
        blocking_reasons: [],
        rerun_from_stage: null,
        rerun_policy: {
          status: 'idle',
          rerun_from_stage: null,
        },
      },
      export_bundle: {
        source_html: stableViewHtmlFile,
        pptx_file: pptxPath,
        pdf_file: pdfPath,
        presenter_notes_file: notesFile,
        review_capture: reviewArtifact.review_capture || null,
        delivery_state: {
          current: 'output_ready',
          next: null,
        },
        page_count: exportPayload.page_count,
        page_count_match: previewMetrics.page_count_match,
        preview_cache: exportPreviewCacheMetadata(previewCacheStatus, previewHash),
        preview_metrics: previewMetrics,
        real_conversion_invocation: {
          tool: python.command,
          script: 'packages/redcube-runtime/scripts/ppt_deck_export.py',
          command: ['--screenshots-dir', screenshotsDir, '--output-pptx', pptxFile, '--output-pdf', pdfFile],
        },
      },
      artifact_refs: [stableViewHtmlFile, pptxPath, pdfPath, notesFile].filter(Boolean),
    };
  }

  return {
    buildExportArtifact,
    hashReviewInput,
  };
}
