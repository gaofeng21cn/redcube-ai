import path from 'node:path';
import { createHash, type Hash } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import {
  materializeScreenshotCaptureStore,
  pythonHelperReference,
  runRedCubePythonHelper,
} from '@redcube/runtime-protocol';

type JsonRecord = Record<string, any>;

export interface PptDeckExportStageDeps {
  CANVAS: { width: number; height: number };
  CODEX_DEFAULT_ADAPTER: string;
  PYTHON_EXPORT: string;
  PYTHON_NATIVE: string;
  SCREENSHOT_MECHANICAL_REVIEW_RULESET_ID?: string;
  attachCommon(route: string, contract: JsonRecord, generationRuntime: JsonRecord | null, adapter: string): JsonRecord;
  ensureDir(dir: string): string;
  existsSync?: (file: string) => boolean;
  getDeliverablePaths(workspaceRoot: string, topicId: string, deliverableId: string): JsonRecord;
  getDeliverableViewSurfacePaths(deliverablePaths: JsonRecord, deliverableId: string): { stableHtmlFile: string };
  isNativePptArtifact(renderArtifact: JsonRecord | null | undefined): boolean;
  readCurrentVisualArtifact(contract: JsonRecord, deliverablePaths: JsonRecord): JsonRecord;
  readStageArtifact(contract: JsonRecord, deliverablePaths: JsonRecord, stageId: string): JsonRecord;
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
  writeText(file: string, content: string): void;
}

export interface BuildExportArtifactInput {
  workspaceRoot: string;
  topicId: string;
  deliverableId: string;
  contract: JsonRecord;
  adapter?: string;
}

interface NativeExportBundleInput {
  workspaceRoot: string;
  renderArtifact: JsonRecord;
  reviewArtifact: JsonRecord;
  pptxFile: string;
  pdfFile: string;
  notesFile: string;
  adapter: string;
  contract: JsonRecord;
}

interface ExportPreviewMetricsInput {
  exportPayload: JsonRecord;
  renderArtifact: JsonRecord;
  reviewArtifact: JsonRecord;
}

interface ExportPreviewHashInput {
  stableViewHtmlFile: string;
  reviewArtifact: JsonRecord;
}

interface CachedPreview {
  page_count: number;
  metrics: JsonRecord;
}

export function createPptDeckExportStageParts(deps: PptDeckExportStageDeps) {
  const {
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    PYTHON_EXPORT,
    PYTHON_NATIVE,
    SCREENSHOT_MECHANICAL_REVIEW_RULESET_ID = 'ppt_deck_screenshot_mechanics:v3:parent-surface-target-audit',
    attachCommon,
    ensureDir,
    existsSync: mainExistsSync,
    getDeliverablePaths,
    getDeliverableViewSurfacePaths,
    isNativePptArtifact,
    readCurrentVisualArtifact,
    readStageArtifact,
    safeArray,
    safeText,
    writeText,
  } = deps;

  const fileExists = mainExistsSync || existsSync;

  function runPython(helper: string, args: string[]): JsonRecord {
    return runRedCubePythonHelper(helper, args, {
      fileExists,
      missingMessagePrefix: 'Missing ppt_deck python helper',
      failureMessagePrefix: 'ppt_deck python helper failed',
    });
  }

  function hashFileIfPresent(hash: Hash, file: unknown): void {
    const resolvedFile = safeText(file);
    hash.update(resolvedFile);
    hash.update('\n');
    if (resolvedFile && fileExists(resolvedFile)) {
      hash.update(readFileSync(resolvedFile));
    }
    hash.update('\n');
  }

  function hashReviewInput(renderArtifact: JsonRecord): string {
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
    hash.update(`${SCREENSHOT_MECHANICAL_REVIEW_RULESET_ID}\n`);
    hash.update(`${CANVAS.width}x${CANVAS.height}\n`);
    hash.update(htmlFile);
    hash.update('\n');
    if (htmlFile && fileExists(htmlFile)) {
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

  function hashExportPreviewInput({ stableViewHtmlFile, reviewArtifact }: ExportPreviewHashInput): string {
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

  function exportPreviewCacheMetadata(cacheStatus: 'hit' | 'miss', hash: string) {
    return {
      cache_status: cacheStatus,
      hash,
      freshness: cacheStatus === 'hit' ? 'current' : 'fresh',
    };
  }

  function exportPreviewMetricsFromPayload({ exportPayload, renderArtifact, reviewArtifact }: ExportPreviewMetricsInput) {
    return {
      page_count: Number(exportPayload?.page_count || 0),
      render_page_count: Number(renderArtifact?.html_bundle?.page_count || 0),
      reviewed_page_count: safeArray(reviewArtifact?.slide_reviews).length,
      page_count_match: Number(exportPayload?.page_count || 0) === Number(renderArtifact?.html_bundle?.page_count || 0),
    };
  }

  function cachedExportPreview(priorArtifact: JsonRecord | null | undefined, hash: string): CachedPreview | null {
    if (safeText(priorArtifact?.export_bundle?.preview_cache?.hash) !== hash) return null;
    const pptxFile = safeText(priorArtifact?.export_bundle?.pptx_file);
    const pdfFile = safeText(priorArtifact?.export_bundle?.pdf_file);
    if (!pptxFile || !fileExists(pptxFile)) return null;
    if (pdfFile && !fileExists(pdfFile)) return null;
    const metrics = priorArtifact?.export_bundle?.preview_metrics;
    if (!metrics || typeof metrics !== 'object') return null;
    return {
      page_count: Number(metrics.page_count || 0),
      metrics,
    };
  }

  function sanitizeDeliveryFileBase(value: unknown, fallback = 'presentation'): string {
    const text = safeText(value, fallback)
      .replace(/[\\/:*?"<>|]/g, ' ')
      .replace(/[：]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text || fallback;
  }

  function syncWorkspaceFinalDelivery({
    workspaceRoot,
    contract,
    deliverableId,
    pptxPath,
    pdfPath,
  }: {
    workspaceRoot: string;
    contract: JsonRecord;
    deliverableId: string;
    pptxPath: string;
    pdfPath: string;
  }) {
    const finalDeliveryDir = ensureDir(path.join(workspaceRoot, '交付成果'));
    const baseName = sanitizeDeliveryFileBase(contract?.title, deliverableId);
    const finalPptxFile = path.join(finalDeliveryDir, `${baseName}.pptx`);
    const finalPdfFile = path.join(finalDeliveryDir, `${baseName}.pdf`);
    const manifestFile = path.join(finalDeliveryDir, 'manifest.json');
    const readmeFile = path.join(finalDeliveryDir, 'README.md');
    if (pptxPath && fileExists(pptxPath)) {
      copyFileSync(pptxPath, finalPptxFile);
    }
    if (pdfPath && fileExists(pdfPath)) {
      copyFileSync(pdfPath, finalPdfFile);
    }
    const manifest = {
      surface_kind: 'ppt_deck_final_delivery',
      current: 'output_ready',
      title: safeText(contract?.title),
      deliverable_id: deliverableId,
      pptx_file: finalPptxFile,
      pdf_file: finalPdfFile,
      source_pptx_file: pptxPath,
      source_pdf_file: pdfPath,
      updated_at: new Date().toISOString(),
    };
    writeText(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
    writeText(readmeFile, [
      '# 交付成果',
      '',
      `- 讲题：${safeText(contract?.title)}`,
      '- 当前状态：output_ready',
      `- PPTX：${path.basename(finalPptxFile)}`,
      `- PDF：${path.basename(finalPdfFile)}`,
      '',
      '规则：',
      '- 这里是给用户直接取用的当前最终版入口。',
      '- `topics/`、`runtime/` 与各版本目录是 RCA 运行态，不作为人工查找最终文件的入口。',
      '',
    ].join('\n'));
    return {
      current_dir: finalDeliveryDir,
      pptx_file: finalPptxFile,
      pdf_file: finalPdfFile,
      manifest_file: manifestFile,
      readme_file: readmeFile,
    };
  }

  function buildNativeExportBundle({
  renderArtifact,
  reviewArtifact,
  pptxFile,
  pdfFile,
  notesFile,
  adapter,
  contract,
  workspaceRoot,
}: NativeExportBundleInput) {
    const bundle = renderArtifact.native_ppt_bundle || {};
    const sourcePptx = safeText(bundle.pptx_file);
    const sourcePdf = safeText(bundle.pdf_file);
    const shapeManifestFile = safeText(bundle.shape_manifest_file);
    const repairLogFile = safeText(bundle.repair_log_file);
    if (!sourcePptx || !fileExists(sourcePptx)) {
      throw new Error(`Route export_pptx requires native PPTX source before export: ${sourcePptx}`);
    }
    if (!sourcePdf || !fileExists(sourcePdf)) {
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
    const finalDelivery = syncWorkspaceFinalDelivery({
      workspaceRoot,
      contract,
      deliverableId: safeText(contract?.deliverable_id),
      pptxPath: pptxFile,
      pdfPath: pdfFile,
    });
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
        final_delivery: finalDelivery,
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
          ...pythonHelperReference(PYTHON_NATIVE),
          command: ['--source-pptx', sourcePptx, '--output-pptx', pptxFile],
        },
      },
      artifact_refs: [
        sourcePptx,
        shapeManifestFile,
        repairLogFile,
        pptxFile,
        pdfFile,
        notesFile,
        finalDelivery.pptx_file,
        finalDelivery.pdf_file,
        finalDelivery.manifest_file,
        finalDelivery.readme_file,
      ].filter(Boolean),
    };
  }

  function materializeFullCaptureForExport({
    deliverablePaths,
    reviewArtifact,
    screenshotsDir,
  }: {
    deliverablePaths: JsonRecord;
    reviewArtifact: JsonRecord;
    screenshotsDir: string;
  }): { screenshotsDir: string; manifest: JsonRecord | null } {
    if (safeText(reviewArtifact?.review_capture?.capture_mode, 'full') !== 'delta') {
      return { screenshotsDir, manifest: null };
    }
    const captureId = `${safeText(reviewArtifact?.review_capture?.capture_id, 'review-capture')}-full`;
    const fullScreenshotsDir = path.join(deliverablePaths.reportsDir, 'screenshots', captureId);
    const manifest = materializeScreenshotCaptureStore({
      reportsDir: deliverablePaths.reportsDir,
      captureId,
      screenshotsDir: fullScreenshotsDir,
      slideReviews: safeArray(reviewArtifact?.slide_reviews),
      currentViewMode: 'hardlink',
      captureMode: 'full',
    }) as JsonRecord;
    return {
      screenshotsDir: fullScreenshotsDir,
      manifest,
    };
  }

  function buildExportArtifact({
    workspaceRoot,
    topicId,
    deliverableId,
    contract,
    adapter = CODEX_DEFAULT_ADAPTER,
  }: BuildExportArtifactInput) {
    const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
    const reviewArtifact = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
    const renderArtifact = readCurrentVisualArtifact(contract, deliverablePaths);
    const publishDir = ensureDir(path.join(deliverablePaths.deliverableDir, 'publish'));
    const pptxFile = path.join(publishDir, `${deliverableId}.pptx`);
    const pdfFile = path.join(publishDir, `${deliverableId}.pdf`);
    const notesFile = path.join(publishDir, `${deliverableId}-presenter-notes.md`);
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
    writeText(notesFile, blueprintArtifact.slide_blueprint.slides.map((slide: JsonRecord) => `## ${slide.slide_id} ${slide.title}\n\n${slide.speaker_notes}`).join('\n\n'));
    if (isNativePptArtifact(renderArtifact)) {
      return buildNativeExportBundle({ workspaceRoot, renderArtifact, reviewArtifact, pptxFile, pdfFile, notesFile, adapter, contract });
    }
    const reviewedScreenshotsDir = safeText(reviewArtifact?.review_capture?.screenshots_dir);
    if (!reviewedScreenshotsDir) {
      throw new Error('Route export_pptx requires screenshot_review immutable capture screenshots; rerun screenshot_review before export');
    }
    if (!fileExists(reviewedScreenshotsDir)) {
      throw new Error(`Reviewed screenshot capture directory not found: ${reviewedScreenshotsDir}`);
    }
    const exportCapture = materializeFullCaptureForExport({
      deliverablePaths,
      reviewArtifact,
      screenshotsDir: reviewedScreenshotsDir,
    });
    const screenshotsDir = exportCapture.screenshotsDir;
    const stableViewHtmlFile = getDeliverableViewSurfacePaths(deliverablePaths, deliverableId).stableHtmlFile;
    if (!fileExists(stableViewHtmlFile)) {
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
    const conversionCommand = cachedPreview
      ? []
      : [...python.argv, '--screenshots-dir', screenshotsDir, '--output-pptx', pptxFile, '--output-pdf', pdfFile];
    const finalDelivery = syncWorkspaceFinalDelivery({
      workspaceRoot,
      contract,
      deliverableId,
      pptxPath,
      pdfPath,
    });
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
        final_delivery: finalDelivery,
        review_capture: {
          ...(reviewArtifact.review_capture || {}),
          export_screenshots_dir: screenshotsDir,
          export_manifest_file: exportCapture.manifest?.manifest_file || null,
          export_capture_mode: exportCapture.manifest?.capture_mode || safeText(reviewArtifact?.review_capture?.capture_mode, 'full'),
        },
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
          helper_id: python.helper_id,
          package_module: python.package_module,
          compatibility_script: python.compatibility_script,
          command: conversionCommand,
        },
      },
      artifact_refs: [
        stableViewHtmlFile,
        pptxPath,
        pdfPath,
        notesFile,
        finalDelivery.pptx_file,
        finalDelivery.pdf_file,
        finalDelivery.manifest_file,
        finalDelivery.readme_file,
      ].filter(Boolean),
    };
  }

  return {
    buildExportArtifact,
    hashReviewInput,
  };
}
