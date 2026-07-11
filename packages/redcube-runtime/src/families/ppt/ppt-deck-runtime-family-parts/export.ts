import path from 'node:path';
import { createHash, type Hash } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import {
  pythonHelperReference,
  runRedCubePythonHelper,
  type RedCubePythonNativeHelper,
} from '@redcube/runtime-protocol';

import { createPptDeckExportImagePageHelpers } from './export-image-pages-helpers.js';
import { buildReviewExportCloseout } from './review-export-closeout.js';

type JsonRecord = Record<string, any>;

export interface PptDeckExportStageDeps {
  CANVAS: { width: number; height: number };
  CODEX_DEFAULT_ADAPTER: string;
  PYTHON_EXPORT: RedCubePythonNativeHelper;
  PYTHON_NATIVE: RedCubePythonNativeHelper;
  SCREENSHOT_MECHANICAL_REVIEW_RULESET_ID?: string;
  attachCommon(route: string, contract: JsonRecord, generationRuntime: JsonRecord | null, adapter: string): JsonRecord;
  ensureDir(dir: string): string;
  existsSync?: (file: string) => boolean;
  getDeliverablePaths(workspaceRoot: string, topicId: string, deliverableId: string): JsonRecord;
  getDeliverableViewSurfacePaths(deliverablePaths: JsonRecord, deliverableId: string): { stableHtmlFile: string };
  isImagePagesArtifact?(renderArtifact: JsonRecord | null | undefined): boolean;
  isNativePptArtifact(renderArtifact: JsonRecord | null | undefined): boolean;
  readCurrentVisualArtifact(contract: JsonRecord, deliverablePaths: JsonRecord): JsonRecord;
  readStageArtifact(contract: JsonRecord, deliverablePaths: JsonRecord, stageId: string): JsonRecord;
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
  writeText(file: string, content: string): void;
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
    isImagePagesArtifact,
    isNativePptArtifact,
    readCurrentVisualArtifact,
    readStageArtifact,
    safeArray,
    safeText,
    writeText,
  } = deps;

  const fileExists = mainExistsSync || existsSync;

  function runPython(helper: RedCubePythonNativeHelper, args: string[]): JsonRecord {
    return runRedCubePythonHelper(helper, args, {
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

  function fileSha256(file: unknown): string | null {
    const resolvedFile = safeText(file);
    if (!resolvedFile || !fileExists(resolvedFile)) return null;
    return createHash('sha256').update(readFileSync(resolvedFile)).digest('hex');
  }

  function readJsonIfPresent(file: unknown): JsonRecord {
    const resolvedFile = safeText(file);
    if (!resolvedFile || !fileExists(resolvedFile)) return {};
    return JSON.parse(readFileSync(resolvedFile, 'utf-8'));
  }

  function hashReviewInput(renderArtifact: JsonRecord): string {
    if (isImagePagesArtifact?.(renderArtifact)) {
      const hash = createHash('sha256');
      hash.update('ppt_deck_image_pages_screenshot_mechanics:v1\n');
      hash.update(safeText(renderArtifact?.route));
      hash.update('\n');
      for (const page of safeArray(renderArtifact?.image_pages_bundle?.pages || renderArtifact?.image_pages?.pages || renderArtifact?.pages)) {
        hash.update(safeText(page?.slide_id));
        hash.update('\n');
        hashFileIfPresent(hash, page?.png_file || page?.image_file || page?.screenshot_file || page?.file);
        hashFileIfPresent(hash, page?.prompt_manifest_file || renderArtifact?.image_pages_bundle?.prompt_manifest_file);
        hashFileIfPresent(hash, page?.style_manifest_file || renderArtifact?.image_pages_bundle?.style_manifest_file);
      }
      return hash.digest('hex');
    }
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
    hash.update(`source_visual_route:${safeText(reviewArtifact?.review_capture?.source_visual_route)}\n`);
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
    const sourcePageCount = isImagePagesArtifact?.(renderArtifact)
      ? Number(renderArtifact?.image_pages_bundle?.page_count || safeArray(renderArtifact?.image_pages_bundle?.pages || renderArtifact?.image_pages?.pages || renderArtifact?.pages).length)
      : Number(renderArtifact?.html_bundle?.page_count || 0);
    return {
      page_count: Number(exportPayload?.page_count || 0),
      render_page_count: sourcePageCount,
      reviewed_page_count: safeArray(reviewArtifact?.slide_reviews).length,
      page_count_match: Number(exportPayload?.page_count || 0) === sourcePageCount,
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

  function writeJson(file: string, data: unknown): void {
    writeText(file, `${JSON.stringify(data, null, 2)}\n`);
  }

  function buildExportVisualMemoryProposal(
    reviewArtifact: JsonRecord,
    closeout: JsonRecord,
    artifactRefs: unknown[],
  ): JsonRecord {
    const proposal = reviewArtifact?.visual_memory_proposal;
    if (safeText(proposal?.status) !== 'proposal_candidate'
      || !proposal?.proposal_candidate
      || typeof proposal.proposal_candidate !== 'object'
      || Array.isArray(proposal.proposal_candidate)) {
      return {
        status: 'skip',
        skip_reason: 'no_screenshot_review_proposal',
        non_authority: true,
        non_blocking: true,
        proposal_candidate: null,
        terminal_binding: null,
        accept_reject_status: 'not_requested',
        accept_reject_receipt_refs: [],
      };
    }
    return {
      status: 'proposal_candidate',
      skip_reason: null,
      non_authority: true,
      non_blocking: true,
      proposal_candidate: proposal.proposal_candidate,
      terminal_binding: {
        review_export_refs: [...new Set([
          ...safeArray(reviewArtifact?.review_export_refs),
          ...safeArray(closeout?.review_export_refs),
        ].map((ref) => safeText(ref)).filter(Boolean))],
        export_artifact_refs: [...new Set(
          safeArray(artifactRefs).map((ref) => safeText(ref)).filter(Boolean),
        )],
      },
      accept_reject_status: 'pending_rca_memory_owner',
      accept_reject_receipt_refs: [],
    };
  }

  const {
    buildImagePagesArtifactGallery,
    imagePagesSourceRefs,
    materializeFullCaptureForExport,
  } = createPptDeckExportImagePageHelpers({
    ensureDir,
    fileSha256,
    safeArray,
    safeText,
    writeJson,
  });

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
    const previewPngFiles = safeArray(bundle.preview_screenshots).map((file) => safeText(file)).filter(Boolean);
    if (!sourcePptx || !fileExists(sourcePptx)) {
      throw new Error(`Route export_pptx requires native PPTX source before export: ${sourcePptx}`);
    }
    if (!sourcePdf || !fileExists(sourcePdf)) {
      throw new Error(`Route export_pptx requires native PPTX preview PDF before export: ${sourcePdf}`);
    }
    const shapeManifest = readJsonIfPresent(shapeManifestFile);
    const rendererProof = shapeManifest.render_proof || bundle.render_proof || {};
    if (shapeManifest?.proof_flags?.libreoffice_headless_pdf_png_v1 !== true) {
      throw new Error('Route export_pptx requires native shape manifest LibreOffice headless PDF/PNG v1 proof before native export');
    }
    if (safeText(rendererProof?.source_surface_kind) !== 'native_pptx'
      || safeText(rendererProof?.renderer_pipeline) !== 'libreoffice_headless_pdf_png_v1'
      || rendererProof?.synthetic_preview !== false) {
      throw new Error('Route export_pptx requires native renderer proof from libreoffice_headless_pdf_png_v1 before native export');
    }
    const currentPptxSha = fileSha256(sourcePptx);
    const packagePptxSha = safeText(
      shapeManifest?.package_readback?.pptx_sha256
      || shapeManifest?.officecli_gate?.package_readback?.pptx_sha256,
    );
    const renderedPptxSha = safeText(rendererProof?.source_pptx_sha256);
    if (!currentPptxSha
      || !packagePptxSha
      || !renderedPptxSha
      || currentPptxSha !== packagePptxSha
      || currentPptxSha !== renderedPptxSha) {
      throw new Error('Native PPTX SHA mismatch: current file, package readback, and render proof must identify the same PPTX');
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
    const sourceArtifacts = {
      pptx_file: sourcePptx,
      pdf_file: sourcePdf,
      shape_manifest_file: shapeManifestFile,
      repair_log_file: repairLogFile,
      preview_png_files: previewPngFiles,
    };
    const evidenceHashes = {
      source_pptx_sha256: fileSha256(sourcePptx),
      source_pdf_sha256: fileSha256(sourcePdf),
      shape_manifest_sha256: fileSha256(shapeManifestFile),
      repair_log_sha256: fileSha256(repairLogFile),
      final_pptx_sha256: fileSha256(pptxFile),
      final_pdf_sha256: fileSha256(pdfFile),
      preview_png_sha256: previewPngFiles.map((file) => ({
        file,
        sha256: fileSha256(file),
      })),
    };
    const allPreviewHashesPresent = previewPngFiles.length > 0
      && evidenceHashes.preview_png_sha256.every((item) => Boolean(item.sha256));
    const shapeManifestSummary = {
      schema_version: Number(shapeManifest.schema_version || shapeManifest.shape_manifest_schema_version || 0),
      slide_count: safeArray(shapeManifest.slides).length || Number(bundle.page_count || 0),
      native_quality_model: safeText(shapeManifest.native_quality_model) || null,
      libreoffice_headless_pdf_png_v1: shapeManifest?.proof_flags?.libreoffice_headless_pdf_png_v1 === true
        && safeText(rendererProof?.renderer_pipeline) === 'libreoffice_headless_pdf_png_v1',
      all_preview_hashes_present: allPreviewHashesPresent,
    };
    const finalArtifactRefs = {
      pptx_file: pptxFile,
      pdf_file: pdfFile,
      presenter_notes_file: notesFile,
      final_delivery_pptx_file: finalDelivery.pptx_file,
      final_delivery_pdf_file: finalDelivery.pdf_file,
    };
    const operatorProofSummary = {
      proof_surface: 'native_export_bundle_operator_proof_summary_v1',
      status: 'output_ready',
      source_visual_route: safeText(renderArtifact.route),
      renderer_pipeline: safeText(rendererProof?.renderer_pipeline),
      libreoffice_headless_pdf_png_v1: shapeManifestSummary.libreoffice_headless_pdf_png_v1,
      artifact_hashes: evidenceHashes,
      source_artifact_refs: sourceArtifacts,
      final_artifact_refs: finalArtifactRefs,
      shape_manifest_file: shapeManifestFile,
      repair_log_file: repairLogFile,
    };
    const artifactGalleryDir = ensureDir(path.join(path.dirname(pptxFile), 'artifact_gallery'));
    const artifactGalleryIndexFile = path.join(artifactGalleryDir, 'index.json');
    const artifactGalleryIndex = {
      surface_kind: 'native_export_operator_artifact_gallery_v1',
      status: 'output_ready',
      title: safeText(contract?.title),
      deliverable_id: safeText(contract?.deliverable_id),
      source_visual_route: safeText(renderArtifact.route),
      renderer_pipeline: 'libreoffice_headless_pdf_png_v1',
      libreoffice_headless_pdf_png_v1: shapeManifestSummary.libreoffice_headless_pdf_png_v1,
      artifacts: {
        source: {
          pptx_file: sourcePptx,
          pdf_file: sourcePdf,
          preview_png_files: previewPngFiles,
        },
        final: {
          pptx_file: pptxFile,
          pdf_file: pdfFile,
          presenter_notes_file: notesFile,
          final_delivery_pptx_file: finalDelivery.pptx_file,
          final_delivery_pdf_file: finalDelivery.pdf_file,
        },
        evidence: {
          shape_manifest_file: shapeManifestFile,
          repair_log_file: repairLogFile,
          final_delivery_manifest_file: finalDelivery.manifest_file,
          final_delivery_readme_file: finalDelivery.readme_file,
        },
      },
      hashes: evidenceHashes,
      shape_manifest_summary: shapeManifestSummary,
      proof_summary: operatorProofSummary,
      operator_read_order: [
        'proof_summary',
        'artifacts.final.pptx_file',
        'artifacts.final.pdf_file',
        'artifacts.source.preview_png_files',
        'artifacts.evidence.shape_manifest_file',
        'artifacts.evidence.repair_log_file',
      ],
      updated_at: new Date().toISOString(),
    };
    writeJson(artifactGalleryIndexFile, artifactGalleryIndex);
    const artifactRefs = [
      sourcePptx,
      sourcePdf,
      shapeManifestFile,
      repairLogFile,
      ...previewPngFiles,
      pptxFile,
      pdfFile,
      notesFile,
      finalDelivery.pptx_file,
      finalDelivery.pdf_file,
      finalDelivery.manifest_file,
      finalDelivery.readme_file,
      artifactGalleryIndexFile,
    ].filter(Boolean);
    const closeout = buildReviewExportCloseout({
      family: 'ppt_deck',
      route: 'export_pptx',
      deliverableId: safeText(contract?.deliverable_id),
      status: 'completed',
      reviewExportRefs: [
        ...safeArray(reviewArtifact?.review_export_refs),
        ...safeArray(reviewArtifact?.owner_receipt_refs),
      ],
      artifactRefs,
    });
    return {
      ...attachCommon('export_pptx', contract, null, adapter),
      ...closeout,
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
        export_ref: closeout.review_export_refs[0],
        review_receipt_refs: safeArray(reviewArtifact?.owner_receipt_refs),
        visual_memory_proposal: buildExportVisualMemoryProposal(reviewArtifact, closeout, artifactRefs),
        source_visual_route: safeText(renderArtifact.route),
        source_pptx: sourcePptx,
        source_html: null,
        native_ppt_shape_manifest: shapeManifestFile,
        native_ppt_repair_log: repairLogFile,
        source_artifacts: sourceArtifacts,
        evidence_hashes: evidenceHashes,
        renderer_proof: {
          source_surface_kind: 'native_pptx',
          renderer_kind: safeText(rendererProof?.renderer_kind),
          renderer_pipeline: 'libreoffice_headless_pdf_png_v1',
          runtime: safeText(rendererProof?.runtime),
          libreoffice_version: safeText(rendererProof?.libreoffice_version),
          poppler_version: safeText(rendererProof?.poppler_version),
          synthetic_preview: false,
          required: true,
          preview_screenshots: previewPngFiles,
        },
        shape_manifest_summary: shapeManifestSummary,
        operator_proof_summary: operatorProofSummary,
        artifact_gallery: {
          index_file: artifactGalleryIndexFile,
          surface_kind: artifactGalleryIndex.surface_kind,
          status: artifactGalleryIndex.status,
        },
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
      artifact_refs: artifactRefs,
    };
  }

  function buildExportArtifact({
    workspaceRoot,
    topicId,
    deliverableId,
    contract,
    adapter = CODEX_DEFAULT_ADAPTER,
  }: {
    workspaceRoot: string;
    topicId: string;
    deliverableId: string;
    contract: JsonRecord;
    adapter?: string;
  }) {
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
    const imagePagesExportInput = isImagePagesArtifact?.(renderArtifact) === true;
    const stableViewHtmlFile = imagePagesExportInput ? '' : getDeliverableViewSurfacePaths(deliverablePaths, deliverableId).stableHtmlFile;
    if (!imagePagesExportInput && !fileExists(stableViewHtmlFile)) {
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
      : python.argv;
    const finalDelivery = syncWorkspaceFinalDelivery({
      workspaceRoot,
      contract,
      deliverableId,
      pptxPath,
      pdfPath,
    });
    const imageGallery = imagePagesExportInput
      ? buildImagePagesArtifactGallery({
          contract,
          deliverableId,
          renderArtifact,
          pptxPath,
          pdfPath,
          notesFile,
          finalDelivery,
        })
      : null;
    const artifactRefs = [
      stableViewHtmlFile,
      imageGallery?.index_file,
      ...safeArray(imageGallery?.artifacts?.source?.png_files),
      ...safeArray(imageGallery?.artifacts?.source?.prompt_manifest_files),
      ...safeArray(imageGallery?.artifacts?.source?.style_manifest_files),
      pptxPath,
      pdfPath,
      notesFile,
      finalDelivery.pptx_file,
      finalDelivery.pdf_file,
      finalDelivery.manifest_file,
      finalDelivery.readme_file,
    ].filter(Boolean);
    const closeout = buildReviewExportCloseout({
      family: 'ppt_deck',
      route: 'export_pptx',
      deliverableId,
      status: 'completed',
      reviewExportRefs: [
        ...safeArray(reviewArtifact?.review_export_refs),
        ...safeArray(reviewArtifact?.owner_receipt_refs),
      ],
      artifactRefs,
    });
    return {
      ...attachCommon('export_pptx', contract, null, adapter),
      ...closeout,
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
        export_ref: closeout.review_export_refs[0],
        review_receipt_refs: safeArray(reviewArtifact?.owner_receipt_refs),
        visual_memory_proposal: buildExportVisualMemoryProposal(reviewArtifact, closeout, artifactRefs),
        source_visual_route: imagePagesExportInput ? safeText(renderArtifact?.route) : undefined,
        editable: imagePagesExportInput ? false : undefined,
        source_html: stableViewHtmlFile,
        source_artifacts: imagePagesExportInput ? imagePagesSourceRefs(renderArtifact) : undefined,
        artifact_gallery: imageGallery ? {
          index_file: imageGallery.index_file,
          surface_kind: imageGallery.surface_kind,
          status: imageGallery.status,
          editable: false,
        } : undefined,
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
          command: conversionCommand,
          request_args: cachedPreview ? [] : python.request_args,
        },
      },
      artifact_refs: artifactRefs,
    };
  }

  return {
    buildExportArtifact,
    hashReviewInput,
  };
}
