import path from 'node:path';

export function createXiaohongshuReviewParts(deps) {
  const {
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    PYTHON_REVIEW,
    attachCommon,
    aiFirstMechanicalCheckValue,
    buildAiFirstVisualSlideReview,
    buildAuthoringContext,
    computeBaselineReview,
    creativeExecution,
    creativeSourceStamp,
    deriveScreenshotReviewRerunStage,
    directorReviewOutputContract,
    ensureDir,
    generateStructuredArtifact,
    getDeliverablePaths,
    getDeliverableViewSurfacePaths,
    hasAiVisualBlock,
    hasAiVisualPass,
    loadPriorRenderedXhsSlideHtmlMap,
    markPublishBundleStaleAfterBlockedReview,
    normalizeStringList,
    normalizeXhsScreenshotAiSlideReviews,
    primarySurface,
    promoteStableHtml,
    promptRoute,
    readCurrentHtmlArtifact,
    readJson,
    readStageArtifact,
    requireText,
    reviewAuthorship,
    runPython,
    safeArray,
    safeText,
    screenshotReviewOutputContract,
    stageArtifactPath,
    stripHtml,
    summarizePlanSlides,
    syncCurrentCandidateHtmlFromStageArtifact,
    writeText,
  } = deps;

  function buildScreenshotReviewMarkdown(contract, reviewArtifact, reviewOwner) {
    const lines = [
      `# ${contract.title} 视觉质控`,
      '',
      `- review_owner: ${safeText(reviewOwner, 'codex_native_host_agent')}`,
      `- 状态: ${reviewArtifact.status}`,
      `- director_intent_landed: ${reviewArtifact.checks.director_intent_landed}`,
      `- anti_template_ok: ${reviewArtifact.checks.anti_template_ok}`,
      `- overflow_free: ${reviewArtifact.checks.overflow_free}`,
      `- occlusion_free: ${reviewArtifact.checks.occlusion_free}`,
      `- visual_density_ok: ${reviewArtifact.checks.visual_density_ok}`,
      `- block_content_fit_ok: ${reviewArtifact.checks.block_content_fit_ok}`,
      `- cover_density_ok: ${reviewArtifact.checks.cover_density_ok}`,
      `- memory_hook_present: ${reviewArtifact.checks.memory_hook_present}`,
      '',
      '## AI 审阅结论',
      `- review_model: ${safeText(reviewArtifact.ai_review?.review_model)}`,
      `- weak_pages: ${safeArray(reviewArtifact.ai_review?.weak_pages).join(', ') || 'none'}`,
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

  async function generateDirectorReviewDraft(workspaceRoot, contract, deliverablePaths, adapter = CODEX_DEFAULT_ADAPTER) {
    const research = readStageArtifact(contract, deliverablePaths, 'research');
    const storyline = readStageArtifact(contract, deliverablePaths, 'storyline');
    const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
    const visual = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const render = readCurrentHtmlArtifact(contract, deliverablePaths);
    return generateStructuredArtifact({
      adapter,
      family: 'xiaohongshu',
      route: 'visual_director_review',
      promptRelativePath: promptRoute(contract, 'visual_director_review'),
      context: {
        ...buildAuthoringContext({ workspaceRoot, contract, research }),
        storyline: storyline?.storyline || null,
        plan: {
          slides: summarizePlanSlides(plan),
        },
        visual_direction: visual?.visual_direction || null,
        render_summary: safeArray(render?.html_bundle?.slides).map((slide) => ({
          slide_id: slide.slide_id,
          title: slide.title,
          layout_family: slide.layout_family,
          peak_page: slide.director_contract?.peak_page,
          text_excerpt: stripHtml(slide.content).slice(0, 180),
        })),
      },
      outputContract: directorReviewOutputContract(),
    });
  }

  async function buildDirectorReview(workspaceRoot, contract, deliverablePaths, adapter = CODEX_DEFAULT_ADAPTER) {
    const candidateSurfaceRefs = syncCurrentCandidateHtmlFromStageArtifact(contract, deliverablePaths);
    const { data, generationRuntime } = await generateDirectorReviewDraft(
      workspaceRoot,
      contract,
      deliverablePaths,
      adapter,
    );
    const directorIntentLanded = Boolean(data?.director_intent_landed);
    const antiTemplateOk = Boolean(data?.anti_template_ok);
    const memoryHookPresent = Boolean(data?.memory_hook_present);
    const renderedSlides = safeArray(readCurrentHtmlArtifact(contract, deliverablePaths)?.html_bundle?.slides);
    const weakPages = normalizeStringList(data?.weak_pages, 'visual_director_review.weak_pages', {
      min: 0,
      max: renderedSlides.length,
    });
    const homogeneousLayoutRisk = Number(data?.homogeneous_layout_risk || 0);
    const reviewSummary = requireText(data?.review_summary, 'visual_director_review.review_summary');
    const status = directorIntentLanded && antiTemplateOk && memoryHookPresent ? 'pass' : 'block';
    const reviewFile = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}_视觉总监复盘.md`);
    const reviewOwner = primarySurface(generationRuntime, adapter);
    writeText(reviewFile, [
      '# 视觉总监复盘',
      '',
      `- review_owner: ${reviewOwner}`,
      `- director_intent_landed: ${directorIntentLanded}`,
      `- anti_template_ok: ${antiTemplateOk}`,
      `- memory_hook_present: ${memoryHookPresent}`,
      `- homogeneous_layout_risk: ${homogeneousLayoutRisk}`,
      `- weak_pages: ${weakPages.join(',') || 'none'}`,
      `- review_summary: ${reviewSummary}`,
    ].join('\n'));
    return {
      ...attachCommon('visual_director_review', contract, generationRuntime, adapter),
      review_overlay: 'visual_director_review',
      review_authorship: reviewAuthorship('visual_director_review', generationRuntime, adapter),
      review_execution: {
        ...creativeExecution('visual_director_review', generationRuntime, adapter),
        overlay: 'visual_director_review',
      },
      status,
      visual_director_review: {
        review_model: 'director_first_visual_judgement',
        director_intent_landed: directorIntentLanded,
        anti_template_ok: antiTemplateOk,
        memory_hook_present: memoryHookPresent,
        homogeneous_layout_risk: homogeneousLayoutRisk,
        weak_pages: weakPages,
        review_summary: reviewSummary,
        rewrite_action: status === 'pass' ? 'none' : safeText(data?.rewrite_action, 'revise_render_html'),
        creative_sources: {
          review_judgement: creativeSourceStamp({
            route: 'visual_director_review',
            lifecycleStage: 'review_overlay',
            authoredSurface: 'review_judgement',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
        },
      },
      artifact_refs: [...candidateSurfaceRefs, reviewFile],
      review_state_patch: {
        current_status: status === 'pass' ? 'director_review_passed' : 'blocked_for_revision',
        ready_for_export: false,
        latest_review_stage: 'visual_director_review',
        latest_checks: {
          director_intent_landed: directorIntentLanded,
          anti_template_ok: antiTemplateOk,
          memory_hook_present: memoryHookPresent,
        },
        pending_reviews: status === 'pass'
          ? []
          : Object.entries({
              director_intent_landed: directorIntentLanded,
              anti_template_ok: antiTemplateOk,
              memory_hook_present: memoryHookPresent,
            }).filter(([, value]) => value === false).map(([key]) => key),
        blocking_reasons: status === 'pass'
          ? []
          : Object.entries({
              director_intent_landed: directorIntentLanded,
              anti_template_ok: antiTemplateOk,
              memory_hook_present: memoryHookPresent,
            }).filter(([, value]) => value === false).map(([key]) => key),
        rerun_from_stage: status === 'pass' ? null : 'render_html',
        rerun_policy: {
          status: status === 'pass' ? 'idle' : 'rerun_required',
          rerun_from_stage: status === 'pass' ? null : 'render_html',
        },
      },
    };
  }

  async function generateScreenshotReviewDraft(
    workspaceRoot,
    contract,
    deliverablePaths,
    renderArtifact,
    slideReviews,
    reviewPayload,
    mode,
    research,
    adapter = CODEX_DEFAULT_ADAPTER,
  ) {
    const storyline = readStageArtifact(contract, deliverablePaths, 'storyline');
    const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
    const visual = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const directorReview = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
    const renderedSlideHtmlById = loadPriorRenderedXhsSlideHtmlMap(renderArtifact);
    return generateStructuredArtifact({
      adapter,
      family: 'xiaohongshu',
      route: 'screenshot_review',
      promptRelativePath: promptRoute(contract, 'screenshot_review'),
      context: {
        ...buildAuthoringContext({ workspaceRoot, contract, research }),
        mode,
        storyline: storyline?.storyline || null,
        plan: {
          slides: summarizePlanSlides(plan),
        },
        visual_direction: visual?.visual_direction || null,
        director_review: directorReview?.visual_director_review || null,
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
        label: `${slide.slide_id} ${safeText(slide.title, `Card ${index + 1}`)}`.trim(),
        path: slide.screenshot_file,
        media_type: 'image/png',
        purpose: `Review rendered Xiaohongshu card screenshot for ${slide.slide_id}`,
      })),
      cwd: deliverablePaths.deliverableDir,
    });
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
    const candidateSurfaceRefs = syncCurrentCandidateHtmlFromStageArtifact(contract, deliverablePaths);
    const render = readCurrentHtmlArtifact(contract, deliverablePaths);
    const research = readStageArtifact(contract, deliverablePaths, 'research');
    const reviewMarkdown = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}_视觉质控复核.md`);
    const screenshotsDir = ensureDir(path.join(deliverablePaths.reportsDir, 'screenshots'));
    const args = [
      '--html', render.html_bundle.html_file,
      '--output-dir', screenshotsDir,
      '--review-markdown', reviewMarkdown,
      '--max-primary-points', String(contract.layout_rules?.max_primary_points_per_slide || 4),
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
      const overflowFree = occupiedRatio <= 0.88;
      const occlusionFree = overlaps.length === 0;
      const visualDensityOk = occupiedRatio >= 0.18 && occupiedRatio <= 0.88;
      const blockContentFitOk = slide?.checks?.block_content_fit_ok !== false;
      const speakerFitOk = slide?.checks?.speaker_fit_ok !== false;
      const issues = [];
      if (!overflowFree) issues.push('overflow_detected');
      if (!occlusionFree) issues.push('occlusion_detected');
      if (!visualDensityOk) issues.push('visual_density_out_of_range');
      if (!blockContentFitOk) issues.push('block_content_overflow_detected');
      if (!speakerFitOk) issues.push('speaker_fit_out_of_range');
      return {
        ...slide,
        status: issues.length === 0 ? 'pass' : 'block',
        checks: {
          overflow_free: overflowFree,
          occlusion_free: occlusionFree,
          visual_density_ok: visualDensityOk,
          block_content_fit_ok: blockContentFitOk,
          speaker_fit_ok: speakerFitOk,
        },
        issues,
      };
    });
    const { data, generationRuntime } = await generateScreenshotReviewDraft(
      workspaceRoot,
      contract,
      deliverablePaths,
      render,
      mechanicalSlideReviews,
      python,
      mode,
      research,
      adapter,
    );
    const aiWeakPages = normalizeStringList(data?.weak_pages, 'screenshot_review.weak_pages', {
      min: 0,
      max: mechanicalSlideReviews.length,
    });
    const aiSlideReviews = normalizeXhsScreenshotAiSlideReviews(data?.slide_reviews, mechanicalSlideReviews);
    const aiSlideReviewMap = new Map(aiSlideReviews.map((item) => [item.slide_id, item]));
    const slideReviews = mechanicalSlideReviews.map((slide) => buildAiFirstVisualSlideReview(
      slide,
      aiSlideReviewMap.get(slide.slide_id),
    ));
    const directorReview = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
    const checks = {
      director_intent_landed: Boolean(directorReview?.visual_director_review?.director_intent_landed)
        && Boolean(data?.director_intent_landed),
      ai_review_passed: slideReviews.every((slide) => !hasAiVisualBlock(slide?.ai_review)),
      overflow_free: slideReviews.every((slide) => slide.checks.overflow_free),
      occlusion_free: aiFirstMechanicalCheckValue(slideReviews, 'occlusion_free'),
      visual_density_ok: aiFirstMechanicalCheckValue(slideReviews, 'visual_density_ok'),
      block_content_fit_ok: aiFirstMechanicalCheckValue(slideReviews, 'block_content_fit_ok'),
      speaker_fit_ok: aiFirstMechanicalCheckValue(slideReviews, 'speaker_fit_ok'),
      cover_density_ok: slideReviews.length > 0
        && (hasAiVisualPass(slideReviews[0]?.ai_review) || Number(slideReviews[0]?.metrics?.occupied_ratio || 0) >= 0.22),
      anti_template_ok: Boolean(directorReview?.visual_director_review?.anti_template_ok)
        && Boolean(data?.anti_template_ok),
      memory_hook_present: Boolean(directorReview?.visual_director_review?.memory_hook_present),
    };
    const failedChecks = Object.entries(checks)
      .filter(([, value]) => value === false)
      .map(([key]) => key);
    const status = failedChecks.length === 0 ? 'pass' : 'block';
    const rerunFromStage = status === 'pass'
      ? null
      : deriveScreenshotReviewRerunStage(contract, failedChecks, slideReviews);
    const artifact = {
      ...attachCommon('screenshot_review', contract, generationRuntime, adapter),
      review_overlay: 'screenshot_review',
      review_authorship: reviewAuthorship('screenshot_review', generationRuntime, adapter),
      review_execution: {
        ...creativeExecution('screenshot_review', generationRuntime, adapter),
        overlay: 'screenshot_review',
      },
      mode,
      status,
      checks,
      slide_reviews: slideReviews,
      ai_review: {
        review_model: 'screenshot_director_first_visual_judgement',
        director_intent_landed: Boolean(data?.director_intent_landed),
        anti_template_ok: Boolean(data?.anti_template_ok),
        weak_pages: aiWeakPages,
        review_summary: requireText(data?.review_summary, 'screenshot_review.review_summary'),
        slide_reviews: aiSlideReviews,
        creative_sources: {
          review_judgement: creativeSourceStamp({
            route: 'screenshot_review',
            lifecycleStage: 'review_overlay',
            authoredSurface: 'review_judgement',
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
      artifact_refs: [...candidateSurfaceRefs, reviewMarkdown, ...slideReviews.map((slide) => slide.screenshot_file)],
      review_state_patch: {
        current_status: status === 'pass' ? 'review_passed' : 'blocked_for_revision',
        ready_for_export: false,
        latest_review_stage: 'screenshot_review',
        latest_checks: checks,
        pending_reviews: failedChecks,
        blocking_reasons: failedChecks,
        rerun_from_stage: rerunFromStage,
        rerun_policy: {
          status: status === 'pass' ? 'idle' : 'rerun_required',
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
          ...promoteStableHtml(getDeliverableViewSurfacePaths(deliverablePaths), render.html_bundle.html_file),
        ]),
      ];
    } else {
      artifact.artifact_refs = [
        ...new Set([
          ...safeArray(artifact.artifact_refs),
          ...markPublishBundleStaleAfterBlockedReview(contract, deliverablePaths, artifact),
        ]),
      ];
    }
    return artifact;
  }

  return {
    buildDirectorReview,
    buildScreenshotReview,
  };
}
