// @ts-nocheck
import path from 'node:path';
import { cpSync, readFileSync, readdirSync, rmSync } from 'node:fs';

export function createPptDeckSurfaceFileStateParts(deps) {
  const {
    buildArchiveSegment,
    ensureDir,
    existsSync,
    readCurrentHtmlArtifact,
    readJson,
    safeArray,
    safeFileMtimeMs,
    safeText,
    stageArtifactPath,
    writeJson,
  } = deps;

  function copySurfaceFile(source, destination) {
    if (!safeText(source) || !existsSync(source)) return null;
    ensureDir(path.dirname(destination));
    if (path.resolve(source) === path.resolve(destination)) return destination;
    cpSync(source, destination);
    return destination;
  }

  function retireStalePublishOutputs(publishPaths, reason) {
    const files = [
      publishPaths.pptxFile,
      publishPaths.pdfFile,
      publishPaths.presenterNotesFile,
    ].filter((file) => safeText(file) && existsSync(file));
    if (files.length === 0) {
      return null;
    }
    const archiveDir = ensureDir(path.join(publishPaths.publishDir, 'archive', buildArchiveSegment(reason)));
    const archivedFiles = [];
    for (const file of files) {
      const archivedFile = copySurfaceFile(file, path.join(archiveDir, path.basename(file)));
      if (archivedFile) {
        archivedFiles.push(archivedFile);
        rmSync(file, { force: true });
      }
    }
    const manifestFile = path.join(archiveDir, 'retirement.json');
    writeJson(manifestFile, {
      surface_kind: 'ppt_deck_retired_publish_output',
      reason: safeText(reason, 'stale_export'),
      retired_at: new Date().toISOString(),
      archived_files: archivedFiles,
    });
    return {
      archive_dir: archiveDir,
      archived_files: archivedFiles,
      manifest_file: manifestFile,
    };
  }

  function safeReadJsonIfExists(file) {
    if (!safeText(file) || !existsSync(file)) return null;
    try {
      return readJson(file);
    } catch {
      return null;
    }
  }

  function extractFirstJsonCodeBlock(markdown) {
    const match = String(markdown || '').match(/```json\s*([\s\S]*?)\s*```/i);
    if (!match) return null;
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }

  function normalizeOperatorRevisionBrief(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const slideFeedback = safeArray(value.slide_feedback)
      .map((item) => ({
        slide_id: safeText(item?.slide_id),
        issues: safeArray(item?.issues).map((issue) => safeText(issue)).filter(Boolean),
        keep: safeArray(item?.keep).map((entry) => safeText(entry)).filter(Boolean),
        avoid: safeArray(item?.avoid).map((entry) => safeText(entry)).filter(Boolean),
      }))
      .filter((item) => item.slide_id);
    const targetSlideIds = [...new Set([
      ...safeArray(value.target_slide_ids).map((slideId) => safeText(slideId)).filter(Boolean),
      ...slideFeedback.map((item) => item.slide_id),
    ])];
    const excludedSlideIds = [...new Set([
      ...safeArray(value.exclude_slide_ids).map((slideId) => safeText(slideId)).filter(Boolean),
      ...safeArray(value.excluded_slide_ids).map((slideId) => safeText(slideId)).filter(Boolean),
      ...safeArray(value.false_positive_slide_ids).map((slideId) => safeText(slideId)).filter(Boolean),
      ...safeArray(value.verified_false_positive_slide_ids).map((slideId) => safeText(slideId)).filter(Boolean),
    ])];
    const globalRequirements = safeArray(value.global_requirements)
      .map((item) => safeText(item))
      .filter(Boolean);
    if (targetSlideIds.length === 0 && excludedSlideIds.length === 0 && globalRequirements.length === 0) {
      return null;
    }
    return {
      target_slide_ids: targetSlideIds,
      excluded_slide_ids: excludedSlideIds,
      global_requirements: globalRequirements,
      slide_feedback: slideFeedback,
    };
  }

  function loadOperatorRevisionBrief({
    deliverablePaths,
    contract,
    getPptOperatorViewPaths,
    minimumMtimeMs = 0,
  }) {
    const paths = getPptOperatorViewPaths({
      deliverablePaths,
      contract,
      deliverableId: deliverablePaths.deliverableId,
    });
    if (!existsSync(paths.revisionBriefFile)) return null;
    if (safeFileMtimeMs(paths.revisionBriefFile) < Number(minimumMtimeMs || 0)) {
      return null;
    }
    const parsed = extractFirstJsonCodeBlock(readFileSync(paths.revisionBriefFile, 'utf-8'));
    return normalizeOperatorRevisionBrief(parsed);
  }

  function derivePptStageArtifactFreshness({ contract, deliverablePaths }) {
    const requiredExportRoute = safeText(contract?.delivery_contract?.required_export_route, 'export_pptx');
    const exportArtifactFile = stageArtifactPath(contract, deliverablePaths, requiredExportRoute);
    const exportArtifactMtimeMs = safeFileMtimeMs(exportArtifactFile);
    return {
      requiredExportRoute,
      exportArtifactFile,
      exportArtifactMtimeMs,
      exportArtifact: safeReadJsonIfExists(exportArtifactFile),
    };
  }

  function currentHtmlSourceFile(contract, deliverablePaths) {
    const artifact = readCurrentHtmlArtifact(contract, deliverablePaths);
    return safeText(artifact?.html_bundle?.html_file);
  }

  function currentSlidesSourceFile(contract, deliverablePaths) {
    const artifact = readCurrentHtmlArtifact(contract, deliverablePaths);
    return safeText(artifact?.html_bundle?.slides_file);
  }

  function syncDeliverableViewDraft(paths, htmlFile, slidesFile) {
    const refs = [];
    const draftHtmlRef = copySurfaceFile(htmlFile, paths.draftHtmlFile);
    if (draftHtmlRef) refs.push(draftHtmlRef);
    const draftSlidesRef = copySurfaceFile(slidesFile, paths.draftSlidesFile);
    if (draftSlidesRef) refs.push(draftSlidesRef);
    return refs;
  }

  function seedDeliverableStableViews(paths, htmlFile, slidesFile) {
    const refs = [];
    if (!existsSync(paths.stableHtmlFile)) {
      const stableHtmlRef = copySurfaceFile(htmlFile, paths.stableHtmlFile);
      if (stableHtmlRef) refs.push(stableHtmlRef);
    }
    if (!existsSync(paths.stableSlidesFile)) {
      const stableSlidesRef = copySurfaceFile(slidesFile, paths.stableSlidesFile);
      if (stableSlidesRef) refs.push(stableSlidesRef);
    }
    return refs;
  }

  function promoteDeliverableStableViews(paths, htmlFile, slidesFile) {
    const refs = [];
    const stableHtmlRef = copySurfaceFile(htmlFile, paths.stableHtmlFile);
    if (stableHtmlRef) refs.push(stableHtmlRef);
    const stableSlidesRef = copySurfaceFile(slidesFile, paths.stableSlidesFile);
    if (stableSlidesRef) refs.push(stableSlidesRef);
    return refs;
  }

  function listStableRootScreenshotFiles(stableScreenshotsDir) {
    if (!existsSync(stableScreenshotsDir)) return [];
    return readdirSync(stableScreenshotsDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^slide-\d+\.(png|jpe?g)$/i.test(entry.name))
      .map((entry) => path.join(stableScreenshotsDir, entry.name));
  }

  function stableLatestCaptureFile(deliverablePaths) {
    return path.join(deliverablePaths.reportsDir, 'screenshots', 'latest-capture.json');
  }

  function writeStableLatestCapturePointer(deliverablePaths, reviewCapture, slideCount) {
    if (!reviewCapture || typeof reviewCapture !== 'object') return null;
    const captureId = safeText(reviewCapture.capture_id);
    const reviewMarkdownFile = safeText(reviewCapture.review_markdown_file);
    if (!captureId || !reviewMarkdownFile) return null;
    const latestCaptureFile = stableLatestCaptureFile(deliverablePaths);
    writeJson(latestCaptureFile, {
      capture_id: captureId,
      review_markdown_file: reviewMarkdownFile,
      slide_count: Number(slideCount || 0),
    });
    return latestCaptureFile;
  }

  function syncStableScreenshotSurface(deliverablePaths, captureScreenshotsDir, { promote = false, seedIfMissing = false } = {}) {
    const sourceDir = safeText(captureScreenshotsDir);
    if (!sourceDir || !existsSync(sourceDir)) return [];
    const stableScreenshotsDir = ensureDir(path.join(deliverablePaths.reportsDir, 'screenshots'));
    const sourceFiles = readdirSync(sourceDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^slide-\d+\.(png|jpe?g)$/i.test(entry.name))
      .map((entry) => path.join(sourceDir, entry.name));
    if (sourceFiles.length === 0) return [];
    const stableFiles = listStableRootScreenshotFiles(stableScreenshotsDir);
    const shouldSync = promote || (seedIfMissing && stableFiles.length === 0);
    if (!shouldSync) return [];
    for (const file of stableFiles) {
      rmSync(file, { force: true });
    }
    return sourceFiles
      .map((file) => copySurfaceFile(file, path.join(stableScreenshotsDir, path.basename(file))))
      .filter(Boolean);
  }

  function buildOperatorSlidesSurfaceState({ contract, deliverablePaths, viewSurfacePaths, latestReviewStatusOverride = '' }) {
    const screenshotReviewArtifact = safeReadJsonIfExists(
      stageArtifactPath(contract, deliverablePaths, 'screenshot_review'),
    );
    return {
      reviewed_html_ready: existsSync(viewSurfacePaths.stableHtmlFile),
      has_pending_draft: existsSync(viewSurfacePaths.draftHtmlFile),
      latest_review_status: safeText(latestReviewStatusOverride, safeText(screenshotReviewArtifact?.status, 'none')),
      stable_html_name: path.basename(viewSurfacePaths.stableHtmlFile),
      draft_html_name: path.basename(viewSurfacePaths.draftHtmlFile),
    };
  }

  function buildPublishSurfaceState({ route, contract, deliverablePaths, publishPaths, payload }) {
    const freshness = derivePptStageArtifactFreshness({ contract, deliverablePaths });
    const currentExportReady = route === freshness.requiredExportRoute;
    const routeExportMtimeMs = currentExportReady
      ? Math.max(
        safeFileMtimeMs(payload?.export_bundle?.pptx_file),
        safeFileMtimeMs(payload?.export_bundle?.pdf_file),
        safeFileMtimeMs(payload?.export_bundle?.presenter_notes_file),
      )
      : 0;
    return {
      ...freshness,
      currentExportReady,
      publishDir: publishPaths.publishDir,
      hasCurrentExportFiles: [publishPaths.pptxFile, publishPaths.pdfFile, publishPaths.presenterNotesFile]
        .every((file) => existsSync(file)),
      hasAnyExportFiles: [publishPaths.pptxFile, publishPaths.pdfFile, publishPaths.presenterNotesFile]
        .some((file) => existsSync(file)),
      exportArtifactMtimeMs: routeExportMtimeMs || freshness.exportArtifactMtimeMs,
    };
  }

  return {
    buildOperatorSlidesSurfaceState,
    buildPublishSurfaceState,
    currentHtmlSourceFile,
    currentSlidesSourceFile,
    loadOperatorRevisionBrief,
    promoteDeliverableStableViews,
    retireStalePublishOutputs,
    safeReadJsonIfExists,
    seedDeliverableStableViews,
    syncDeliverableViewDraft,
    syncStableScreenshotSurface,
    writeStableLatestCapturePointer,
  };
}
