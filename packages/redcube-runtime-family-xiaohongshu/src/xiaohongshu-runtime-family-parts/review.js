import path from 'node:path';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { materializeScreenshotCaptureStore } from '@redcube/runtime-protocol';

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
    collectSlidesNeedingTargetedRevision,
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
      `- capture_manifest: ${safeText(reviewArtifact.review_capture?.manifest_file, 'none')}`,
      `- capture_store_dir: ${safeText(reviewArtifact.review_capture?.store_dir, 'none')}`,
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

  function hashReviewInput(render) {
    const htmlFile = safeText(render?.html_bundle?.html_file);
    const hash = createHash('sha256');
    hash.update('xiaohongshu_screenshot_mechanics:v1\n');
    hash.update(`${CANVAS.width}x${CANVAS.height}\n`);
    hash.update(htmlFile);
    hash.update('\n');
    if (htmlFile && existsSync(htmlFile)) {
      hash.update(readFileSync(htmlFile));
    }
    hash.update('\nslides\n');
    hash.update(JSON.stringify(safeArray(render?.html_bundle?.slides).map((slide) => ({
      slide_id: safeText(slide?.slide_id),
      title: safeText(slide?.title),
      html: safeText(slide?.html || slide?.content_html || slide?.content),
    }))));
    return hash.digest('hex');
  }

  function cachedMechanicalReview(priorArtifact, hash) {
    if (safeText(priorArtifact?.mechanical_review?.hash) !== hash) return null;
    const slideReviews = safeArray(priorArtifact?.mechanical_review?.slide_reviews);
    if (slideReviews.length === 0) return null;
    return {
      checks: priorArtifact.mechanical_review.checks || {},
      metrics: priorArtifact.mechanical_review.metrics || {},
      slide_reviews: slideReviews,
    };
  }

  function mechanicalCacheMetadata(cacheStatus, hash) {
    return {
      cache_status: cacheStatus,
      hash,
      freshness: cacheStatus === 'hit' ? 'current' : 'fresh',
    };
  }

  function slideIdSet(slideIds) {
    return new Set(safeArray(slideIds).map((slideId) => safeText(slideId)).filter(Boolean));
  }

  function collectIncrementalScreenshotReviewTargetSlideIds(renderArtifact, priorReviewArtifact) {
    if (safeText(renderArtifact?.route) !== 'fix_html') return [];
    if (safeArray(priorReviewArtifact?.slide_reviews).length === 0) return [];
    return [...new Set(
      safeArray(renderArtifact?.html_bundle?.repair_scope?.target_slide_ids)
        .map((slideId) => safeText(slideId))
        .filter(Boolean),
    )];
  }

  function collectIncrementalDirectorReviewTargetSlideIds(renderArtifact, priorReviewArtifact) {
    if (safeText(renderArtifact?.route) !== 'fix_html') return [];
    if (!priorReviewArtifact?.visual_director_review) return [];
    return [...new Set([
      ...safeArray(renderArtifact?.unit_repair_scope?.target_slide_ids),
      ...safeArray(renderArtifact?.html_bundle?.repair_scope?.target_slide_ids),
    ].map((slideId) => safeText(slideId)).filter(Boolean))];
  }

  function filterSlideScopedArray(items, slideIds) {
    const targetIds = slideIdSet(slideIds);
    if (targetIds.size === 0) return safeArray(items);
    return safeArray(items).filter((item) => targetIds.has(safeText(item?.slide_id)));
  }

  function mergeSlideReviewList(previousSlideReviews, freshSlideReviews, targetSlideIds) {
    const targetIds = slideIdSet(targetSlideIds);
    const freshById = new Map(
      safeArray(freshSlideReviews)
        .map((slide) => [safeText(slide?.slide_id), slide])
        .filter(([slideId]) => slideId),
    );
    const merged = safeArray(previousSlideReviews)
      .map((slide) => {
        const slideId = safeText(slide?.slide_id);
        return targetIds.has(slideId) && freshById.has(slideId)
          ? freshById.get(slideId)
          : slide;
      })
      .filter(Boolean);
    const existingIds = slideIdSet(merged.map((slide) => slide?.slide_id));
    for (const [slideId, fresh] of freshById.entries()) {
      if (!existingIds.has(slideId)) {
        merged.push(fresh);
      }
    }
    return merged;
  }

  function summarizeMechanicalChecksFromSlides(slideReviews) {
    const keys = [
      'overflow_free',
      'occlusion_free',
      'visual_density_ok',
      'block_content_fit_ok',
      'speaker_fit_ok',
    ];
    return Object.fromEntries(keys.map((key) => [
      key,
      safeArray(slideReviews).every((slide) => slide?.checks?.[key] !== false),
    ]));
  }

  function countMatches(text, pattern) {
    return [...String(text || '').matchAll(pattern)].length;
  }

  function buildPreflightGateArtifact(contract, render) {
    const failures = [];
    for (const slide of safeArray(render?.html_bundle?.slides)) {
      const slideId = safeText(slide?.slide_id);
      const html = safeText(slide?.content);
      const missingAnchors = [];
      if (!/data-slide-root=(['"])true\1/.test(html)) missingAnchors.push('data-slide-root');
      if (slideId && !new RegExp(`data-slide-id=(['"])${slideId}\\1`).test(html)) missingAnchors.push('data-slide-id');
      if (countMatches(html, /data-qa-block=(['"])[^'"]+\1/g) < 2) missingAnchors.push('data-qa-block');
      if (countMatches(html, /data-primary-point=(['"])true\1/g) < 1) missingAnchors.push('data-primary-point');
      if (missingAnchors.length > 0) {
        failures.push({
          slide_id: slideId,
          status: 'block',
          missing_anchors: missingAnchors,
          recommended_fix: 'rerun fix_html before screenshot AI review',
        });
      }
    }
    if (failures.length === 0) return null;
    const targetSlideIds = failures.map((failure) => safeText(failure.slide_id)).filter(Boolean);
    const checks = {
      html_review_anchors_ok: false,
      ai_review_passed: false,
    };
    return {
      ...attachCommon('screenshot_review', contract, null, CODEX_DEFAULT_ADAPTER),
      review_overlay: 'screenshot_review',
      mode: 'preflight',
      status: 'block',
      issues: ['preflight_gate_failed'],
      checks,
      preflight_gate: {
        status: 'block',
        gate_model: 'deterministic_html_review_anchor_preflight',
        ai_review_skipped: true,
        target_slide_ids: targetSlideIds,
        failures,
      },
      slide_reviews: failures,
      artifact_refs: [safeText(render?.html_bundle?.html_file)].filter(Boolean),
      review_state_patch: {
        current_status: 'blocked_for_revision',
        ready_for_export: false,
        latest_review_stage: 'screenshot_review',
        latest_checks: checks,
        pending_reviews: ['html_review_anchors_ok'],
        blocking_reasons: ['html_review_anchors_ok'],
        rerun_from_stage: 'fix_html',
        rerun_policy: {
          status: 'rerun_required',
          rerun_from_stage: 'fix_html',
          default_route: 'fix_html',
          scope: 'page',
          target_slide_ids: targetSlideIds,
          source_review_stage: 'preflight_gate',
        },
      },
    };
  }

  async function generateDirectorReviewDraft(workspaceRoot, contract, deliverablePaths, incrementalTargetSlideIds = [], adapter = CODEX_DEFAULT_ADAPTER) {
    const research = readStageArtifact(contract, deliverablePaths, 'research');
    const storyline = readStageArtifact(contract, deliverablePaths, 'storyline');
    const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
    const visual = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const render = readCurrentHtmlArtifact(contract, deliverablePaths);
    const incrementalReview = safeArray(incrementalTargetSlideIds).length > 0;
    const renderedSlides = incrementalReview
      ? filterSlideScopedArray(render?.html_bundle?.slides, incrementalTargetSlideIds)
      : safeArray(render?.html_bundle?.slides);
    return generateStructuredArtifact({
      adapter,
      family: 'xiaohongshu',
      route: 'visual_director_review',
      promptRelativePath: promptRoute(contract, 'visual_director_review'),
      context: {
        ...buildAuthoringContext({ workspaceRoot, contract, research }),
        storyline: storyline?.storyline || null,
        review_scope: incrementalReview ? 'incremental_page_review' : 'full_note_review',
        plan: {
          slides: incrementalReview
            ? filterSlideScopedArray(summarizePlanSlides(plan), incrementalTargetSlideIds)
            : summarizePlanSlides(plan),
        },
        visual_direction: visual?.visual_direction || null,
        render_summary: renderedSlides.map((slide) => ({
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
    const renderArtifact = readCurrentHtmlArtifact(contract, deliverablePaths);
    const priorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
    const incrementalTargetSlideIds = collectIncrementalDirectorReviewTargetSlideIds(renderArtifact, priorReviewArtifact);
    const incrementalReview = incrementalTargetSlideIds.length > 0;
    const { data, generationRuntime } = await generateDirectorReviewDraft(
      workspaceRoot,
      contract,
      deliverablePaths,
      incrementalTargetSlideIds,
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
        review_scope: incrementalReview ? 'incremental_page_review' : 'full_note_review',
        reviewed_slide_ids: incrementalReview
          ? incrementalTargetSlideIds
          : renderedSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean),
        reused_slide_ids: incrementalReview
          ? renderedSlides
              .map((slide) => safeText(slide?.slide_id))
              .filter((slideId) => slideId && !slideIdSet(incrementalTargetSlideIds).has(slideId))
          : [],
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
    const preflightArtifact = buildPreflightGateArtifact(contract, render);
    if (preflightArtifact) {
      return preflightArtifact;
    }
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
    const reviewHash = hashReviewInput(render);
    const priorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
    const incrementalTargetSlideIds = collectIncrementalScreenshotReviewTargetSlideIds(render, priorReviewArtifact);
    const incrementalReview = incrementalTargetSlideIds.length > 0;
    if (incrementalReview) {
      args.push('--slide-ids', incrementalTargetSlideIds.join(','));
    }
    const cachedPayload = cachedMechanicalReview(priorReviewArtifact, reviewHash);
    const cacheStatus = cachedPayload && !incrementalReview ? 'hit' : 'miss';
    const python = cacheStatus === 'hit' ? cachedPayload : runPython(PYTHON_REVIEW, args);
    const freshMechanicalSlideReviews = safeArray(python.slide_reviews).map((slide) => {
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
    const mechanicalSlideReviews = incrementalReview
      ? mergeSlideReviewList(
          priorReviewArtifact?.mechanical_review?.slide_reviews || priorReviewArtifact?.slide_reviews,
          freshMechanicalSlideReviews,
          incrementalTargetSlideIds,
        )
      : freshMechanicalSlideReviews;
    const captureManifest = materializeScreenshotCaptureStore({
      reportsDir: deliverablePaths.reportsDir,
      captureId: 'current',
      screenshotsDir,
      slideReviews: mechanicalSlideReviews,
      currentViewMode: 'source',
    });
    const captureBySlideId = new Map(
      safeArray(captureManifest.slides)
        .map((slide) => [safeText(slide?.slide_id), slide])
        .filter(([slideId]) => slideId),
    );
    const capturedMechanicalSlideReviews = mechanicalSlideReviews.map((slide) => {
      const capture = captureBySlideId.get(safeText(slide?.slide_id));
      return capture?.current_path
        ? { ...slide, screenshot_file: capture.current_path }
        : slide;
    });
    const mechanicalSlideReviewsForAi = incrementalReview
      ? capturedMechanicalSlideReviews.filter((slide) => slideIdSet(incrementalTargetSlideIds).has(safeText(slide?.slide_id)))
      : capturedMechanicalSlideReviews;
    const aiReviewPromise = generateScreenshotReviewDraft(
      workspaceRoot,
      contract,
      deliverablePaths,
      render,
      mechanicalSlideReviewsForAi,
      python,
      mode,
      research,
      adapter,
    );
    const baselineReviewPromise = mode === 'optimize_existing'
      ? Promise.resolve(computeBaselineReview(workspaceRoot, topicId, baselineDeliverableId, capturedMechanicalSlideReviews))
      : Promise.resolve(null);
    const [
      { data, generationRuntime },
      baselineReview,
    ] = await Promise.all([aiReviewPromise, baselineReviewPromise]);
    const aiWeakPages = normalizeStringList(data?.weak_pages, 'screenshot_review.weak_pages', {
      min: 0,
      max: capturedMechanicalSlideReviews.length,
    });
    const aiSlideReviews = normalizeXhsScreenshotAiSlideReviews(data?.slide_reviews, mechanicalSlideReviewsForAi);
    const aiSlideReviewMap = new Map(aiSlideReviews.map((item) => [item.slide_id, item]));
    const freshSlideReviews = mechanicalSlideReviewsForAi.map((slide) => buildAiFirstVisualSlideReview(
      slide,
      aiSlideReviewMap.get(slide.slide_id),
    ));
    const mergedSlideReviews = incrementalReview
      ? mergeSlideReviewList(priorReviewArtifact?.slide_reviews, freshSlideReviews, incrementalTargetSlideIds)
      : freshSlideReviews;
    const slideReviews = mergedSlideReviews.map((slide) => {
      const capture = captureBySlideId.get(safeText(slide?.slide_id));
      return capture?.current_path
        ? { ...slide, screenshot_file: capture.current_path }
        : slide;
    });
    const mergedAiSlideReviews = slideReviews
      .map((slide) => slide?.ai_review ? { slide_id: safeText(slide?.slide_id), ...slide.ai_review } : null)
      .filter(Boolean);
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
      ...(baselineReview
        ? { baseline_comparison_passed: baselineReview.baseline_comparison_passed }
        : {}),
    };
    const failedChecks = Object.entries(checks)
      .filter(([, value]) => value === false)
      .map(([key]) => key);
    const status = failedChecks.length === 0 ? 'pass' : 'block';
    const rerunFromStage = status === 'pass'
      ? null
      : deriveScreenshotReviewRerunStage(contract, failedChecks, slideReviews);
    const targetedSlideIds = status === 'pass' || rerunFromStage !== 'fix_html'
      ? []
      : collectSlidesNeedingTargetedRevision(slideReviews)
          .map((slide) => safeText(slide?.slide_id))
          .filter(Boolean);
    const targetedRerunPolicy = targetedSlideIds.length > 0
      ? {
          default_route: 'fix_html',
          scope: 'page',
          target_slide_ids: targetedSlideIds,
          source_review_stage: 'screenshot_review',
        }
      : {};
    const artifact = {
      ...attachCommon('screenshot_review', contract, generationRuntime, adapter),
      review_overlay: 'screenshot_review',
      review_authorship: reviewAuthorship('screenshot_review', generationRuntime, adapter),
      review_execution: {
        ...creativeExecution('screenshot_review', generationRuntime, adapter),
        overlay: 'screenshot_review',
        review_scope: incrementalReview ? 'incremental_page_review' : 'full_note_review',
        reviewed_slide_ids: incrementalReview
          ? incrementalTargetSlideIds
          : slideReviews.map((slide) => safeText(slide?.slide_id)).filter(Boolean),
        reused_slide_ids: incrementalReview
          ? slideReviews
              .map((slide) => safeText(slide?.slide_id))
              .filter((slideId) => slideId && !slideIdSet(incrementalTargetSlideIds).has(slideId))
          : [],
      },
      mode,
      status,
      mechanical_cache: mechanicalCacheMetadata(cacheStatus, reviewHash),
      review_capture: {
        capture_id: captureManifest.capture_id,
        screenshots_dir: captureManifest.screenshots_dir,
        manifest_file: captureManifest.manifest_file,
        store_dir: captureManifest.store_dir,
      },
      checks,
      slide_reviews: slideReviews,
      ai_review: {
        review_model: 'screenshot_director_first_visual_judgement',
        director_intent_landed: Boolean(data?.director_intent_landed),
        anti_template_ok: Boolean(data?.anti_template_ok),
        weak_pages: aiWeakPages,
        review_summary: requireText(data?.review_summary, 'screenshot_review.review_summary'),
        slide_reviews: mergedAiSlideReviews,
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
        ...mechanicalCacheMetadata(cacheStatus, reviewHash),
        checks: summarizeMechanicalChecksFromSlides(capturedMechanicalSlideReviews),
        metrics: {
          ...(python.metrics || {}),
          slide_count: capturedMechanicalSlideReviews.length,
          reviewed_slide_count: mechanicalSlideReviewsForAi.length,
        },
        slide_reviews: capturedMechanicalSlideReviews,
        incremental_review: incrementalReview
          ? {
              reviewed_slide_ids: incrementalTargetSlideIds,
              reused_slide_ids: slideReviews
                .map((slide) => safeText(slide?.slide_id))
                .filter((slideId) => slideId && !slideIdSet(incrementalTargetSlideIds).has(slideId)),
            }
          : null,
      },
      report_markdown: reviewMarkdown,
      metrics: python.metrics,
      artifact_refs: [...candidateSurfaceRefs, reviewMarkdown, captureManifest.manifest_file, ...slideReviews.map((slide) => slide.screenshot_file)],
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
          ...targetedRerunPolicy,
        },
      },
    };
    if (baselineReview) {
      artifact.baseline_review = baselineReview;
      if (!baselineReview.baseline_comparison_passed) {
        artifact.status = 'block';
        artifact.review_state_patch.current_status = 'blocked_for_revision';
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
