// @ts-nocheck
import path from 'node:path';

import { getDeliverablePaths } from '@redcube/runtime-protocol';
import { compareFailuresAndDensity, summarizeRelativeQuality } from '../../../relative-quality.js';

export function createPosterOnepagerScreenshotReviewParts(deps) {
  const {
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    PYTHON_REVIEW,
    attachCommon,
    aiFirstMechanicalCheckValue,
    buildAiFirstVisualSlideReview,
    buildAuthoringContext,
    creativeExecution,
    creativeSourceStamp,
    ensureDir,
    generateStructuredArtifact,
    getDeliverableViewSurfacePaths,
    hasAiVisualBlock,
    loadRenderedPosterSlideHtmlMap,
    normalizePosterScreenshotAiSlideReviews,
    normalizeStringList,
    primarySurface,
    promoteStableView,
    promptRoute,
    readJson,
    readStageArtifact,
    requireText,
    rerunStageFromReviewSurface,
    reviewAuthorship,
    runPython,
    safeArray,
    safeText,
    screenshotReviewOutputContract,
    stageArtifactPath,
    summarizePanels,
    writeText,
  } = deps;

  function buildScreenshotReviewMarkdown(contract, reviewArtifact, reviewOwner) {
    const lines = [
      `# ${contract.title} 视觉质控`,
      '',
      `- review_owner: ${safeText(reviewOwner, 'codex_cli_runtime')}`,
      `- 状态: ${reviewArtifact.status}`,
      `- director_intent_landed: ${reviewArtifact.checks.director_intent_landed}`,
      `- anti_template_ok: ${reviewArtifact.checks.anti_template_ok}`,
      `- message_hierarchy_clear: ${reviewArtifact.checks.message_hierarchy_clear}`,
      `- overflow_free: ${reviewArtifact.checks.overflow_free}`,
      `- occlusion_free: ${reviewArtifact.checks.occlusion_free}`,
      `- visual_density_ok: ${reviewArtifact.checks.visual_density_ok}`,
      `- block_content_fit_ok: ${reviewArtifact.checks.block_content_fit_ok}`,
      '',
      '## AI 审阅结论',
      `- review_model: ${safeText(reviewArtifact.ai_review?.review_model)}`,
      `- weak_regions: ${safeArray(reviewArtifact.ai_review?.weak_regions).join(', ') || 'none'}`,
      `- review_summary: ${safeText(reviewArtifact.ai_review?.review_summary)}`,
      '',
      '## 分页记录',
    ];
    for (const slide of safeArray(reviewArtifact.slide_reviews)) {
      lines.push(`- ${safeText(slide.slide_id)} / ${safeText(slide.status)} / ${safeText(slide.screenshot_file)}`);
      if (slide.ai_review) {
        lines.push(`  - AI judgement: ${safeText(slide.ai_review.judgement)}`);
        lines.push(`  - AI findings: ${safeArray(slide.ai_review.visual_findings).join('；')}`);
        lines.push(`  - Recommended fix: ${safeText(slide.ai_review.recommended_fix, 'none')}`);
      }
    }
    if (reviewArtifact.baseline_review?.summary) {
      lines.push('', '## Baseline Relative Review', safeText(reviewArtifact.baseline_review.summary));
    }
    return `${lines.join('\n')}\n`;
  }

  async function generateScreenshotReviewDraft(
    contract,
    deliverablePaths,
    renderArtifact,
    slideReviews,
    reviewPayload,
    mode,
    adapter = CODEX_DEFAULT_ADAPTER,
  ) {
    const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'poster_blueprint');
    const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const directorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
    const renderedSlideHtmlById = loadRenderedPosterSlideHtmlMap(renderArtifact);
    return generateStructuredArtifact({
      adapter,
      family: 'poster_onepager',
      route: 'screenshot_review',
      promptRelativePath: promptRoute(contract, 'screenshot_review'),
      context: {
        ...buildAuthoringContext(contract),
        mode,
        storyline: storylineArtifact?.storyline || null,
        blueprint: {
          slides: safeArray(blueprintArtifact?.poster_blueprint?.slides).map((slide) => ({
            slide_id: slide.slide_id,
            title: slide.title,
            layout_family: slide.layout_family,
            render_recipe_id: slide.render_recipe_id,
            panels: summarizePanels(slide),
          })),
        },
        visual_direction: visualArtifact?.visual_direction || null,
        director_review: directorReviewArtifact?.visual_director_review || null,
        screenshot_mechanics: {
          source_html_file: safeText(renderArtifact?.html_bundle?.html_file) || null,
          overall_checks: reviewPayload?.checks || null,
          metrics: reviewPayload?.metrics || null,
          baseline: reviewPayload?.baseline || null,
          slides: slideReviews.map((slide) => ({
            slide_id: slide.slide_id,
            title: slide.title,
            layout_family: slide.layout_family,
            status: slide.status,
            issues: slide.issues,
            occupied_ratio: slide.metrics?.occupied_ratio ?? null,
            primary_points: slide.metrics?.primary_points ?? null,
            source_html: renderedSlideHtmlById.get(safeText(slide.slide_id)) || null,
          })),
        },
      },
      outputContract: screenshotReviewOutputContract(),
      localFileInspection: slideReviews.map((slide, index) => ({
        label: `${slide.slide_id} ${safeText(slide.title, `Poster ${index + 1}`)}`.trim(),
        path: slide.screenshot_file,
        media_type: 'image/png',
        purpose: `Review rendered poster screenshot for ${slide.slide_id}`,
      })),
      cwd: deliverablePaths.deliverableDir,
    });
  }

  function computeBaselineReview(workspaceRoot, topicId, baselineDeliverableId, slideReviews) {
    const baselinePaths = getDeliverablePaths(workspaceRoot, topicId, baselineDeliverableId);
    const baselineContract = readJson(path.join(baselinePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
    const baselineArtifact = readStageArtifact(baselineContract, baselinePaths, 'screenshot_review');
    if (!baselineArtifact) {
      throw new Error(`Baseline screenshot review artifact missing: ${baselineDeliverableId}`);
    }
    const currentFailures = slideReviews.filter((slide) => safeArray(slide.issues).length > 0).length;
    const baselineFailures = safeArray(baselineArtifact.slide_reviews).filter((slide) => safeArray(slide.issues).length > 0).length;
    const currentDensity = slideReviews.reduce((sum, slide) => sum + Number(slide.metrics?.occupied_ratio || 0), 0) / Math.max(slideReviews.length, 1);
    const baselineDensity = safeArray(baselineArtifact.slide_reviews).reduce((sum, slide) => sum + Number(slide.metrics?.occupied_ratio || 0), 0) / Math.max(safeArray(baselineArtifact.slide_reviews).length, 1);
    const relativeQuality = compareFailuresAndDensity({
      currentFailures,
      baselineFailures,
      currentDensity,
      baselineDensity,
      densityTolerance: 0.2,
      densityDigits: 4,
      densityLabel: '平均占用率',
    });
    const passed = relativeQuality.verdict !== 'degraded';
    return {
      baseline_deliverable_id: baselineDeliverableId,
      baseline_review_file: stageArtifactPath(baselineContract, baselinePaths, 'screenshot_review'),
      current_average_density: Number(currentDensity.toFixed(4)),
      baseline_average_density: Number(baselineDensity.toFixed(4)),
      current_failed_slides: currentFailures,
      baseline_failed_slides: baselineFailures,
      baseline_comparison_passed: passed,
      relative_quality: relativeQuality,
      summary: summarizeRelativeQuality(relativeQuality),
    };
  }

  async function buildScreenshotReview(
    workspaceRoot,
    topicId,
    contract,
    deliverablePaths,
    mode,
    baselineDeliverableId,
    adapter = CODEX_DEFAULT_ADAPTER,
  ) {
    const renderArtifact = readStageArtifact(contract, deliverablePaths, 'render_html');
    const directorReview = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
    const reviewMarkdown = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}_视觉质控复核.md`);
    const screenshotsDir = ensureDir(path.join(deliverablePaths.reportsDir, 'screenshots'));
    const args = [
      '--html', renderArtifact.html_bundle.html_file,
      '--output-dir', screenshotsDir,
      '--review-markdown', reviewMarkdown,
      '--max-primary-points', String(contract.layout_rules?.max_primary_points_per_poster || 4),
      '--frame-width', String(CANVAS.width),
      '--frame-height', String(CANVAS.height),
    ];
    if (mode === 'optimize_existing') {
      const baselinePaths = getDeliverablePaths(workspaceRoot, topicId, baselineDeliverableId);
      const baselineContract = readJson(path.join(baselinePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
      args.push('--baseline-review', stageArtifactPath(baselineContract, baselinePaths, 'screenshot_review'));
    }
    const python = runPython(PYTHON_REVIEW, args);
    const mechanicalSlideReviews = safeArray(python.slide_reviews).map((slide) => {
      const occupiedRatio = Number(slide?.metrics?.occupied_ratio || 0);
      const overlaps = safeArray(slide?.metrics?.overlaps);
      const overflowFree = Boolean(slide?.checks?.overflow_free);
      const occlusionFree = overlaps.length === 0;
      const visualDensityOk = occupiedRatio >= 0.18 && occupiedRatio <= 0.82;
      const blockContentFitOk = slide?.checks?.block_content_fit_ok !== false;
      const issues = [];
      if (!overflowFree) issues.push('overflow_detected');
      if (!occlusionFree) issues.push('occlusion_detected');
      if (!visualDensityOk) issues.push('visual_density_out_of_range');
      if (!blockContentFitOk) issues.push('block_content_overflow_detected');
      return {
        slide_id: slide.slide_id,
        title: slide.title,
        layout_family: safeText(slide.layout_family),
        screenshot_file: safeText(slide.screenshot_file),
        status: issues.length === 0 ? 'pass' : 'block',
        checks: {
          overflow_free: overflowFree,
          occlusion_free: occlusionFree,
          visual_density_ok: visualDensityOk,
          block_content_fit_ok: blockContentFitOk,
        },
        metrics: {
          occupied_ratio: Number(occupiedRatio.toFixed(4)),
          primary_points: Number(slide?.metrics?.primary_points || 0),
          overlaps,
        },
        issues,
      };
    });
    const { data, generationRuntime } = await generateScreenshotReviewDraft(
      contract,
      deliverablePaths,
      renderArtifact,
      mechanicalSlideReviews,
      python,
      mode,
      adapter,
    );
    const aiWeakRegions = normalizeStringList(data?.weak_regions, 'screenshot_review.weak_regions', { min: 0, max: 4 });
    const aiSlideReviews = normalizePosterScreenshotAiSlideReviews(data?.slide_reviews, mechanicalSlideReviews);
    const aiSlideReviewMap = new Map(aiSlideReviews.map((item) => [item.slide_id, item]));
    const slideReviews = mechanicalSlideReviews.map((slide) => buildAiFirstVisualSlideReview(
      slide,
      aiSlideReviewMap.get(slide.slide_id),
    ));
    const checks = {
      director_intent_landed: Boolean(directorReview?.visual_director_review?.director_intent_landed)
        && Boolean(data?.director_intent_landed),
      anti_template_ok: Boolean(directorReview?.visual_director_review?.anti_template_ok)
        && Boolean(data?.anti_template_ok),
      message_hierarchy_clear: Boolean(directorReview?.visual_director_review?.message_hierarchy_clear)
        && Boolean(data?.message_hierarchy_clear),
      ai_review_passed: slideReviews.every((slide) => !hasAiVisualBlock(slide?.ai_review)),
      overflow_free: slideReviews.every((slide) => slide.checks.overflow_free),
      occlusion_free: aiFirstMechanicalCheckValue(slideReviews, 'occlusion_free'),
      visual_density_ok: aiFirstMechanicalCheckValue(slideReviews, 'visual_density_ok'),
      block_content_fit_ok: aiFirstMechanicalCheckValue(slideReviews, 'block_content_fit_ok'),
    };
    const failedChecks = Object.entries(checks)
      .filter(([, value]) => value === false)
      .map(([key]) => key);
    const rerunFromStage = failedChecks.length === 0
      ? null
      : rerunStageFromReviewSurface(contract, failedChecks, 'render_html');
    const artifact = {
      ...attachCommon('screenshot_review', contract, generationRuntime, adapter),
      review_overlay: 'screenshot_review',
      review_authorship: reviewAuthorship('screenshot_review', generationRuntime, adapter),
      review_execution: {
        ...creativeExecution('screenshot_review', generationRuntime, adapter),
        overlay: 'screenshot_review',
      },
      mode,
      status: failedChecks.length === 0 ? 'pass' : 'block',
      checks,
      slide_reviews: slideReviews,
      ai_review: {
        review_model: 'screenshot_director_first_visual_judgement',
        director_intent_landed: Boolean(data?.director_intent_landed),
        anti_template_ok: Boolean(data?.anti_template_ok),
        message_hierarchy_clear: Boolean(data?.message_hierarchy_clear),
        weak_regions: aiWeakRegions,
        review_summary: requireText(data?.review_summary, 'screenshot_review.review_summary'),
        slide_reviews: aiSlideReviews,
        creative_sources: {
          review_judgement: creativeSourceStamp({
            route: 'screenshot_review',
            lifecycleStage: 'review_overlay',
            authoredSurface: 'screenshot_review_decision',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
        },
      },
      mechanical_review: {
        review_model: 'python_screenshot_layout_checks',
        checks: python.checks,
        metrics: python.metrics,
      },
      report_markdown: reviewMarkdown,
      metrics: python.metrics,
      artifact_refs: [reviewMarkdown, ...slideReviews.map((slide) => slide.screenshot_file)].filter(Boolean),
      review_state_patch: {
        current_status: failedChecks.length === 0 ? 'export_ready' : 'blocked_for_revision',
        ready_for_export: failedChecks.length === 0,
        latest_review_stage: 'screenshot_review',
        latest_checks: checks,
        pending_reviews: failedChecks,
        blocking_reasons: failedChecks,
        rerun_from_stage: rerunFromStage,
        rerun_policy: {
          status: failedChecks.length === 0 ? 'idle' : 'rerun_required',
          rerun_from_stage: rerunFromStage,
        },
      },
    };
    if (mode === 'optimize_existing') {
      const baselineReview = computeBaselineReview(workspaceRoot, topicId, baselineDeliverableId, slideReviews);
      artifact.baseline_review = baselineReview;
      artifact.checks.baseline_comparison_passed = baselineReview.baseline_comparison_passed;
      artifact.review_state_patch.latest_checks.baseline_comparison_passed = baselineReview.baseline_comparison_passed;
      if (!baselineReview.baseline_comparison_passed) {
        artifact.status = 'block';
        artifact.review_state_patch.current_status = 'blocked_for_revision';
        artifact.review_state_patch.pending_reviews.push('baseline_comparison_passed');
        artifact.review_state_patch.blocking_reasons.push('baseline_comparison_passed');
        artifact.review_state_patch.rerun_from_stage = 'visual_direction';
        artifact.review_state_patch.rerun_policy = {
          status: 'rerun_required',
          rerun_from_stage: 'visual_direction',
        };
      }
    }
    writeText(
      reviewMarkdown,
      buildScreenshotReviewMarkdown(contract, artifact, primarySurface(generationRuntime, adapter)),
    );
    if (artifact.status === 'pass') {
      artifact.artifact_refs = [
        ...new Set([
          ...safeArray(artifact.artifact_refs),
          ...promoteStableView(
            getDeliverableViewSurfacePaths(deliverablePaths, deliverablePaths.deliverableId),
            renderArtifact.html_bundle.html_file,
            renderArtifact.html_bundle.slides_file,
          ),
        ]),
      ];
    }
    return artifact;
  }

  return {
    buildScreenshotReview,
  };
}
