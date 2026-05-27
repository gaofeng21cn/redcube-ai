// @ts-nocheck
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import { runRedCubePythonHelper } from '@redcube/runtime-protocol';

export function createPptDeckScreenshotReviewMechanicsParts(deps) {
  const {
    PAGE_FIX_ROUTE,
    PYTHON_REVIEW,
    SCREENSHOT_MECHANICAL_REVIEW_RULESET_ID,
    aiFirstMechanicalCheckValue,
    deriveProfileChecks,
    getDeliverablePaths,
    hasAiVisualBlock,
    imagePagesMechanicalReviewPayload,
    isImagePagesArtifact,
    mainExistsSync,
    nativeMechanicalReviewPayload,
    readJson,
    readStageArtifact,
    safeArray,
    safeText,
    stageArtifactPath,
  } = deps;

  function runPython(helper, args) {
    return runRedCubePythonHelper(helper, args, {
      fileExists: mainExistsSync || existsSync,
      missingMessagePrefix: 'Missing ppt_deck python helper',
      failureMessagePrefix: 'ppt_deck python helper failed',
    });
  }

  function cachedMechanicalReview(priorArtifact, hash) {
    if (safeText(priorArtifact?.mechanical_review?.ruleset_id) !== SCREENSHOT_MECHANICAL_REVIEW_RULESET_ID) return null;
    if (safeText(priorArtifact?.mechanical_review?.hash) !== hash) return null;
    const slideReviews = safeArray(priorArtifact?.mechanical_review?.slide_reviews);
    if (slideReviews.length === 0) return null;
    return {
      checks: priorArtifact.mechanical_review.checks || {},
      metrics: priorArtifact.mechanical_review.metrics || {},
      baseline: priorArtifact.mechanical_review.baseline || null,
      device_scale_factor: priorArtifact.review_capture?.device_scale_factor || 2,
      screenshot_dimensions: priorArtifact.review_capture?.screenshot_dimensions || null,
      slide_reviews: slideReviews,
    };
  }

  function mechanicalCacheMetadata(cacheStatus, hash) {
    return {
      cache_status: cacheStatus,
      hash,
      ruleset_id: SCREENSHOT_MECHANICAL_REVIEW_RULESET_ID,
      freshness: cacheStatus === 'hit' ? 'current' : 'fresh',
    };
  }

  function hasNativeQualitySurface(slideReviews) {
    return safeArray(slideReviews).some((slide) => (
      safeText(slide?.metrics?.native_quality_source) === 'shape_manifest'
      || safeText(slide?.metrics?.native_quality_model).includes('shape_manifest')
    ));
  }

  function titleConsistencyExempt(review) {
    return safeText(review?.slide_id) === 'S01' || safeText(review?.layout_family) === 'cover_signal';
  }

  function refreshMechanicalStatus(review) {
    const issues = safeArray(review?.issues);
    return {
      ...review,
      status: issues.length === 0 ? 'pass' : 'block',
      issues,
    };
  }

  function pageNumberReferenceCandidates(slideReviews) {
    return safeArray(slideReviews)
      .map((slide) => slide?.metrics?.page_number_audit || {})
      .filter((audit) => audit?.present);
  }

  function pageNumberReferencePayload(reference) {
    if (!reference) return null;
    return {
      text: reference.text,
      syntax_family: reference.syntax_family,
      position_family: reference.position_family,
      font_size: reference.font_size,
      color_rgb: reference.color_rgb,
      rect: reference.rect,
    };
  }

  function pageNumberPositionFailure(current, reference) {
    if (safeText(current?.position_family) !== safeText(reference?.position_family)) return true;
    const currentRect = current?.rect || {};
    const referenceRect = reference?.rect || {};
    for (const key of ['left', 'top', 'right_gap', 'bottom_gap']) {
      const currentValue = currentRect[key];
      const referenceValue = referenceRect[key];
      if (currentValue == null || referenceValue == null) continue;
      if (Math.abs(Number(currentValue) - Number(referenceValue)) > 8) return true;
    }
    return false;
  }

  function pageNumberColorFailure(current, reference) {
    const currentRgb = safeArray(current?.color_rgb);
    const referenceRgb = safeArray(reference?.color_rgb);
    if (currentRgb.length < 3 || referenceRgb.length < 3) return false;
    return [0, 1, 2].some((index) => Math.abs(Number(currentRgb[index]) - Number(referenceRgb[index])) > 18);
  }

  function applyMergedPageNumberConsistency(slideReviews) {
    const reference = pageNumberReferenceCandidates(slideReviews)[0] || null;
    const referencePayload = pageNumberReferencePayload(reference);
    for (const review of safeArray(slideReviews)) {
      const checks = review.checks || {};
      const metrics = review.metrics || {};
      const audit = metrics.page_number_audit || { present: false };
      review.checks = checks;
      review.metrics = metrics;
      metrics.page_number_audit = audit;
      const failures = [];
      if (reference && audit?.present) {
        if (safeText(audit.syntax_family) !== safeText(reference.syntax_family)) failures.push('syntax_family');
        if (pageNumberPositionFailure(audit, reference)) failures.push('position');
        if (Math.abs(Number(audit.font_size || 0) - Number(reference.font_size || 0)) > 1.5) failures.push('font_size');
        if (pageNumberColorFailure(audit, reference)) failures.push('color');
      }
      audit.reference = referencePayload;
      audit.failures = failures;
      checks.page_number_consistency_ok = failures.length === 0;
      const withoutPageNumberIssue = safeArray(review.issues)
        .filter((issue) => safeText(issue) !== 'page_number_consistency_failed');
      review.issues = failures.length === 0
        ? withoutPageNumberIssue
        : [...withoutPageNumberIssue, 'page_number_consistency_failed'];
    }
    return safeArray(slideReviews).map((slide) => refreshMechanicalStatus(slide));
  }

  function applyMergedTitleTypographyConsistency(slideReviews) {
    const bodySizes = safeArray(slideReviews)
      .filter((slide) => !titleConsistencyExempt(slide))
      .map((slide) => Number(slide?.metrics?.title_font_size || 0))
      .filter((size) => size > 0)
      .sort((left, right) => left - right);
    const reference = bodySizes.length === 0
      ? 0
      : bodySizes[Math.floor((bodySizes.length - 1) / 2)];
    for (const review of safeArray(slideReviews)) {
      const checks = review.checks || {};
      const metrics = review.metrics || {};
      review.checks = checks;
      review.metrics = metrics;
      const withoutTitleIssue = safeArray(review.issues)
        .filter((issue) => safeText(issue) !== 'title_typography_inconsistent');
      if (titleConsistencyExempt(review)) {
        checks.title_typography_ok = true;
        metrics.title_font_reference = reference ? Number(reference.toFixed(2)) : null;
        metrics.title_font_delta = 0;
        review.issues = withoutTitleIssue;
        continue;
      }
      const fontSize = Number(metrics.title_font_size || 0);
      if (reference <= 0 || fontSize <= 0) {
        checks.title_typography_ok = false;
        metrics.title_font_reference = reference ? Number(reference.toFixed(2)) : null;
        metrics.title_font_delta = null;
        review.issues = [...withoutTitleIssue, 'title_typography_inconsistent'];
        continue;
      }
      const delta = Math.abs(fontSize - reference);
      checks.title_typography_ok = delta <= 2.5;
      metrics.title_font_reference = Number(reference.toFixed(2));
      metrics.title_font_delta = Number(delta.toFixed(2));
      review.issues = checks.title_typography_ok
        ? withoutTitleIssue
        : [...withoutTitleIssue, 'title_typography_inconsistent'];
    }
    return safeArray(slideReviews).map((slide) => refreshMechanicalStatus(slide));
  }

  function applyMergedMechanicalConsistency(slideReviews) {
    return applyMergedPageNumberConsistency(applyMergedTitleTypographyConsistency(slideReviews));
  }

  function summarizeMechanicalChecksFromSlides(slideReviews) {
    const keys = [
      'overflow_free',
      'occlusion_free',
      'visual_density_ok',
      'speaker_fit_ok',
      'edge_clearance_ok',
      'block_content_fit_ok',
      'title_typography_ok',
      'page_number_consistency_ok',
      'external_audience_language_ok',
      'title_safe_zone_clear',
      'table_legibility_ok',
      'layout_density_ok',
    ];
    return Object.fromEntries(keys.map((key) => [
      key,
      safeArray(slideReviews).every((slide) => slide?.checks?.[key] !== false),
    ]));
  }

  function buildMechanicalReviewArgs({
    workspaceRoot,
    topicId,
    baselineDeliverableId,
    contract,
    renderArtifact,
    reviewCapture,
    mode,
    nativeReviewInput,
    imagePagesReviewInput,
  }) {
    if (nativeReviewInput || imagePagesReviewInput) return [];
    const args = [
      '--html', renderArtifact.html_bundle.html_file,
      '--output-dir', reviewCapture.screenshotsDir,
      '--review-markdown', reviewCapture.reviewMarkdownFile,
      '--max-primary-points', String(contract.layout_rules?.max_primary_points_per_slide || 5),
      '--device-scale-factor', '2',
    ];
    if (mode !== 'optimize_existing') return args;
    const baselinePaths = getDeliverablePaths(workspaceRoot, topicId, baselineDeliverableId);
    const baselineContract = readJson(path.join(baselinePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
    const baselineArtifact = readStageArtifact(baselineContract, baselinePaths, 'screenshot_review');
    if (!baselineArtifact) {
      throw new Error(`Baseline screenshot review artifact missing: ${baselineDeliverableId}`);
    }
    args.push('--baseline-review', stageArtifactPath(baselineContract, baselinePaths, 'screenshot_review'));
    return args;
  }

  function loadPriorCaptureManifest(priorReviewArtifact) {
    const manifestFile = safeText(priorReviewArtifact?.review_capture?.manifest_file);
    if (!manifestFile || !existsSync(manifestFile)) return null;
    return JSON.parse(readFileSync(manifestFile, 'utf-8'));
  }

  function resolveMechanicalReviewExecution({ cacheStatus, cachedPayload, nativeReviewInput, imagePagesReviewInput, renderArtifact, args }) {
    if (cacheStatus === 'hit') return { command: 'cache', payload: cachedPayload };
    if (nativeReviewInput) {
      return {
        command: 'native_ppt_shape_manifest',
        payload: nativeMechanicalReviewPayload(renderArtifact),
      };
    }
    if (imagePagesReviewInput || isImagePagesArtifact?.(renderArtifact)) {
      return {
        command: 'image_pages_manifest_png',
        payload: imagePagesMechanicalReviewPayload(renderArtifact),
      };
    }
    return runPython(PYTHON_REVIEW, args);
  }

  function buildLatestScreenshotChecks({
    contract,
    blueprintArtifact,
    storylineArtifact,
    directorReviewArtifact,
    data,
    slideReviews,
    baselineReview,
  }) {
    const nativeQualitySurface = hasNativeQualitySurface(slideReviews);
    const checks = {
      director_intent_landed: Boolean(directorReviewArtifact?.visual_director_review?.director_intent_landed)
        && Boolean(data?.director_intent_landed),
      anti_template_ok: Boolean(directorReviewArtifact?.visual_director_review?.anti_template_ok)
        && Boolean(data?.anti_template_ok),
      ai_review_passed: slideReviews.every((slide) => !hasAiVisualBlock(slide?.ai_review)),
      overflow_free: slideReviews.every((slide) => slide.checks.overflow_free),
      occlusion_free: aiFirstMechanicalCheckValue(slideReviews, 'occlusion_free'),
      visual_density_ok: aiFirstMechanicalCheckValue(slideReviews, 'visual_density_ok'),
      speaker_fit_ok: aiFirstMechanicalCheckValue(slideReviews, 'speaker_fit_ok'),
      edge_clearance_ok: aiFirstMechanicalCheckValue(slideReviews, 'edge_clearance_ok'),
      block_content_fit_ok: aiFirstMechanicalCheckValue(slideReviews, 'block_content_fit_ok'),
      title_typography_ok: aiFirstMechanicalCheckValue(slideReviews, 'title_typography_ok'),
      page_number_consistency_ok: aiFirstMechanicalCheckValue(slideReviews, 'page_number_consistency_ok'),
      external_audience_language_ok: aiFirstMechanicalCheckValue(slideReviews, 'external_audience_language_ok'),
      title_safe_zone_clear: aiFirstMechanicalCheckValue(slideReviews, 'title_safe_zone_clear'),
      table_legibility_ok: aiFirstMechanicalCheckValue(slideReviews, 'table_legibility_ok'),
      layout_density_ok: aiFirstMechanicalCheckValue(slideReviews, 'layout_density_ok'),
      ...(nativeQualitySurface ? {
        slot_fill_ok: aiFirstMechanicalCheckValue(slideReviews, 'slot_fill_ok'),
        audience_label_readability_ok: aiFirstMechanicalCheckValue(slideReviews, 'audience_label_readability_ok'),
        content_depth_ok: aiFirstMechanicalCheckValue(slideReviews, 'content_depth_ok'),
        grid_balance_ok: aiFirstMechanicalCheckValue(slideReviews, 'grid_balance_ok'),
        visual_structure_present: aiFirstMechanicalCheckValue(slideReviews, 'visual_structure_present'),
        non_text_visual_specific_ok: aiFirstMechanicalCheckValue(slideReviews, 'non_text_visual_specific_ok'),
        mechanical_card_template_absent: aiFirstMechanicalCheckValue(slideReviews, 'mechanical_card_template_absent'),
      } : {}),
      ...deriveProfileChecks(contract, blueprintArtifact, storylineArtifact),
    };
    if (baselineReview) checks.baseline_comparison_passed = baselineReview.passed;
    return checks;
  }

  return {
    applyMergedMechanicalConsistency,
    buildLatestScreenshotChecks,
    buildMechanicalReviewArgs,
    cachedMechanicalReview,
    loadPriorCaptureManifest,
    mechanicalCacheMetadata,
    resolveMechanicalReviewExecution,
    summarizeMechanicalChecksFromSlides,
  };
}
