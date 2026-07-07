// @ts-nocheck
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { createPptDeckSurfaceFileStateParts } from './surface-file-state.js';
import { createPptDeckOperatorSurfaceParts } from './surface-operator-markdown.js';

export function createPptDeckSurfaceParts(deps) {
  const {
    ensureDir,
    existsSync,
    getDeliverablePaths,
    readCurrentHtmlArtifact,
    readJson,
    safeArray,
    safeFileMtimeMs,
    safeText,
    isOperatorContextMaterial,
    sharedSourceTruth,
    stageArtifactPath,
    writeJson,
    writeText,
  } = deps;

  function createReviewCapturePaths(deliverablePaths, deliverableId) {
    const captureId = `capture-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const screenshotsDir = ensureDir(path.join(deliverablePaths.reportsDir, 'screenshots', captureId));
    return {
      captureId,
      screenshotsDir,
      reviewMarkdownFile: path.join(screenshotsDir, `${deliverableId}_视觉质控.md`),
    };
  }

  function getDeliverableViewSurfacePaths(deliverablePaths, deliverableId) {
    return {
      stableHtmlFile: path.join(deliverablePaths.viewsDir, `${deliverableId}.html`),
      stableSlidesFile: path.join(deliverablePaths.viewsDir, `${deliverableId}.slides.json`),
      draftHtmlFile: path.join(deliverablePaths.viewsDir, `${deliverableId}.draft.html`),
      draftSlidesFile: path.join(deliverablePaths.viewsDir, `${deliverableId}.draft.slides.json`),
    };
  }

  const operatorSurface = createPptDeckOperatorSurfaceParts({
    ensureDir,
    formatTimestamp: deps.formatTimestamp,
    isOperatorContextMaterial,
    safeArray,
    safeText,
    sharedSourceTruth,
  });
  const {
    buildOperatorBlueprintMarkdown,
    buildOperatorDetailedOutlineMarkdown,
    buildOperatorReferenceIndex,
    buildOperatorSlidesReadmeMarkdown,
    buildOperatorStorylineMarkdown,
    buildOperatorVisualDirectionMarkdown,
    buildPublishReadmeMarkdown,
    ensurePptOperatorViewSurface,
    getPptOperatorViewPaths,
    sanitizeSurfaceSegment,
  } = operatorSurface;

  function buildArchiveSegment(reason) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${timestamp}-${sanitizeSurfaceSegment(reason, 'stale-export')}`;
  }

  const fileState = createPptDeckSurfaceFileStateParts({
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
  });
  const {
    buildOperatorSlidesSurfaceState,
    buildPublishSurfaceState,
    currentHtmlSourceFile,
    currentSlidesSourceFile,
    promoteDeliverableStableViews,
    retireStalePublishOutputs,
    seedDeliverableStableViews,
    syncDeliverableViewDraft,
    syncStableScreenshotSurface,
    writeStableLatestCapturePointer,
  } = fileState;

  function loadOperatorRevisionBrief(input) {
    return fileState.loadOperatorRevisionBrief({
      ...input,
      getPptOperatorViewPaths,
    });
  }

  function syncPptCanonicalSurface({ workspaceRoot, topicId, contract, deliverableId, route, payload }) {
    const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
    const operatorPaths = getPptOperatorViewPaths({ deliverablePaths, contract, deliverableId });
    const viewSurfacePaths = getDeliverableViewSurfacePaths(deliverablePaths, deliverableId);
    ensurePptOperatorViewSurface(operatorPaths);
    const refs = [];
    writeText(operatorPaths.referenceIndexFile, buildOperatorReferenceIndex(contract));
    refs.push(operatorPaths.referenceIndexFile);
    switch (route) {
      case 'storyline':
        writeText(operatorPaths.storylineFile, buildOperatorStorylineMarkdown(contract, payload));
        refs.push(operatorPaths.storylineFile);
        break;
      case 'detailed_outline':
        writeText(operatorPaths.detailedOutlineFile, buildOperatorDetailedOutlineMarkdown(contract, payload));
        refs.push(operatorPaths.detailedOutlineFile);
        break;
      case 'slide_blueprint':
        writeText(operatorPaths.blueprintFile, buildOperatorBlueprintMarkdown(contract, payload));
        refs.push(operatorPaths.blueprintFile);
        break;
      case 'visual_direction':
        writeText(operatorPaths.visualDirectionFile, buildOperatorVisualDirectionMarkdown(contract, payload));
        refs.push(operatorPaths.visualDirectionFile);
        break;
      case 'screenshot_review': {
        const sourceHtmlFile = currentHtmlSourceFile(contract, deliverablePaths);
        const sourceSlidesFile = currentSlidesSourceFile(contract, deliverablePaths);
        const captureScreenshotsDir = safeText(payload?.review_capture?.screenshots_dir);
        if (safeText(payload?.status) === 'pass') {
          refs.push(...promoteDeliverableStableViews(viewSurfacePaths, sourceHtmlFile, sourceSlidesFile));
          refs.push(...syncStableScreenshotSurface(deliverablePaths, captureScreenshotsDir, { promote: true, seedIfMissing: true }));
          const latestCaptureRef = writeStableLatestCapturePointer(
            deliverablePaths,
            payload?.review_capture,
            safeArray(payload?.slide_reviews).length,
          );
          if (latestCaptureRef) refs.push(latestCaptureRef);
        } else {
          refs.push(...syncDeliverableViewDraft(viewSurfacePaths, sourceHtmlFile, sourceSlidesFile));
          refs.push(...syncStableScreenshotSurface(deliverablePaths, captureScreenshotsDir, { seedIfMissing: true }));
        }
        break;
      }
      default:
        break;
    }
    const slidesState = buildOperatorSlidesSurfaceState({
      contract,
      deliverablePaths,
      viewSurfacePaths,
      latestReviewStatusOverride: route === 'screenshot_review' ? safeText(payload?.status) : '',
    });
    writeText(operatorPaths.slidesReadmeFile, buildOperatorSlidesReadmeMarkdown(contract, slidesState));
    refs.push(operatorPaths.slidesReadmeFile);
    const publishState = buildPublishSurfaceState({
      route,
      contract,
      deliverablePaths,
      publishPaths: operatorPaths,
      payload,
    });
    const retirement = !publishState.currentExportReady && publishState.hasAnyExportFiles
      ? retireStalePublishOutputs(operatorPaths, route)
      : null;
    const finalPublishState = retirement
      ? {
          ...publishState,
          hasCurrentExportFiles: false,
          hasAnyExportFiles: false,
          retiredExportArchiveDir: retirement.archive_dir,
          retiredExportArchiveFiles: retirement.archived_files,
        }
      : publishState;
    writeText(operatorPaths.publishReadmeFile, buildPublishReadmeMarkdown(contract, finalPublishState));
    refs.push(operatorPaths.publishReadmeFile);
    return refs;
  }

  function appendArtifactRefs(payload, extraRefs) {
    if (safeArray(extraRefs).length === 0) {
      return payload;
    }
    return {
      ...payload,
      artifact_refs: [...new Set([...safeArray(payload?.artifact_refs), ...extraRefs])],
    };
  }

  function invalidateDownstreamReviewPatch(route) {
    if (!['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html', 'author_pptx_native', 'fix_html', 'repair_pptx_native'].includes(route)) {
      return null;
    }
    return {
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
    };
  }

  function attachRouteReviewReset(payload, route) {
    const reviewStatePatch = invalidateDownstreamReviewPatch(route);
    if (!reviewStatePatch) return payload;
    return {
      ...payload,
      review_state_patch: {
        ...reviewStatePatch,
        ...(payload?.review_state_patch || {}),
      },
    };
  }

  return {
    appendArtifactRefs,
    attachRouteReviewReset,
    createReviewCapturePaths,
    getDeliverableViewSurfacePaths,
    loadOperatorRevisionBrief,
    seedDeliverableStableViews,
    syncPptCanonicalSurface,
  };
}
