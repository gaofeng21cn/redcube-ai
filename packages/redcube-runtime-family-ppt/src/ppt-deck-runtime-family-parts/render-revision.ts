// @ts-nocheck
import { existsSync } from 'node:fs';

import { createPptDeckRenderRevisionFeedbackParts } from './render-revision-feedback.js';

export function createPptDeckRenderRevisionParts(deps) {
  const {
    PAGE_FIX_ROUTE,
    chunkArray,
    currentHtmlStageId,
    loadOperatorRevisionBrief,
    normalizeInlineText,
    readStageArtifact,
    requireText,
    safeArray,
    safeFileMtimeMs,
    safeText,
    stageArtifactPath,
  } = deps;

  function renderContract(contract) {
    return contract?.prompt_pack?.render_contract || {};
  }
  function htmlDesignCompanion(contract) { const companion = renderContract(contract)?.ui_ux_quality_companion; return companion && typeof companion === 'object' ? companion : null; }
  const {
    buildRenderRevisionLocalFileInspection,
    summarizeRenderRevisionSlideFeedback,
  } = createPptDeckRenderRevisionFeedbackParts({
    collectSlidesNeedingTargetedRevision: deps.collectSlidesNeedingTargetedRevision,
    mainExistsSync: deps.existsSync || existsSync,
    normalizeInlineText,
    readdirSync: deps.readdirSync,
    safeArray,
    safeFileMtimeMs,
    safeText,
    selectRenderTargetSlideIds,
  });

  function computeRenderRevisionFreshness(contract, deliverablePaths, route = 'render_html') {
    const currentHtmlArtifactMtimeMs = safeFileMtimeMs(
      stageArtifactPath(contract, deliverablePaths, currentHtmlStageId(contract, deliverablePaths)),
    );
    const upstreamPlanningMtimeMs = Math.max(
      safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, 'slide_blueprint')),
      safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, 'visual_direction')),
    );
    const isTargetedFixRoute = safeText(route) === PAGE_FIX_ROUTE;
    return {
      current_html_mtime_ms: currentHtmlArtifactMtimeMs,
      upstream_planning_mtime_ms: upstreamPlanningMtimeMs,
      revision_floor_mtime_ms: isTargetedFixRoute
        ? currentHtmlArtifactMtimeMs
        : Math.max(currentHtmlArtifactMtimeMs, upstreamPlanningMtimeMs),
      force_full_regeneration: !isTargetedFixRoute
        && currentHtmlArtifactMtimeMs > 0
        && upstreamPlanningMtimeMs > currentHtmlArtifactMtimeMs,
    };
  }

  function buildRenderRevisionContext({
    workspaceRoot,
    contract,
    deliverablePaths,
    deliverableId,
    minimumMtimeMs = 0,
  }) {
    const currentHtmlStage = currentHtmlStageId(contract, deliverablePaths);
    const currentHtmlArtifactMtimeMs = safeFileMtimeMs(
      stageArtifactPath(contract, deliverablePaths, currentHtmlStage),
    );
    const screenshotReviewMtimeMs = safeFileMtimeMs(
      stageArtifactPath(contract, deliverablePaths, 'screenshot_review'),
    );
    const directorReviewArtifact = safeFileMtimeMs(
      stageArtifactPath(contract, deliverablePaths, 'visual_director_review'),
    ) >= Number(minimumMtimeMs || 0)
      ? readStageArtifact(contract, deliverablePaths, 'visual_director_review')
      : null;
    const screenshotReviewArtifact = safeFileMtimeMs(
      stageArtifactPath(contract, deliverablePaths, 'screenshot_review'),
    ) >= Number(minimumMtimeMs || 0)
      ? readStageArtifact(contract, deliverablePaths, 'screenshot_review')
      : null;
    const operatorRevisionBrief = loadOperatorRevisionBrief({
      deliverablePaths,
      contract,
      minimumMtimeMs,
    });
    const directorSummary = directorReviewArtifact?.visual_director_review
      ? {
          status: safeText(directorReviewArtifact.status, 'unknown'),
          weak_pages: safeArray(directorReviewArtifact.visual_director_review?.weak_pages),
          review_summary: normalizeInlineText(directorReviewArtifact.visual_director_review?.review_summary, 320),
          rewrite_action: safeText(directorReviewArtifact.visual_director_review?.rewrite_action, 'none'),
      }
      : null;
    const screenshotSlideFeedback = summarizeRenderRevisionSlideFeedback(screenshotReviewArtifact);
    const previousFixArtifact = currentHtmlStage === PAGE_FIX_ROUTE
      ? readStageArtifact(contract, deliverablePaths, PAGE_FIX_ROUTE)
      : null;
    const previousFixSlideIds = new Set([
      ...safeArray(previousFixArtifact?.render_execution?.freshly_rendered_slide_ids),
      ...safeArray(previousFixArtifact?.targeted_rerun?.target_slide_ids),
    ].map((slideId) => safeText(slideId)).filter(Boolean));
    const repeatBlockedSlideIds = screenshotReviewMtimeMs >= currentHtmlArtifactMtimeMs
      ? screenshotSlideFeedback
        .map((slide) => safeText(slide?.slide_id))
        .filter((slideId) => slideId && previousFixSlideIds.has(slideId))
      : [];
    const repairAttemptSummary = repeatBlockedSlideIds.length > 0
      ? {
          previous_route: PAGE_FIX_ROUTE,
          previous_target_slide_ids: Array.from(previousFixSlideIds),
          repeat_blocked_slide_ids: repeatBlockedSlideIds,
          escalation_strategy: 'structure_level_repair_required',
          structure_level_repair_required: true,
          invalid_repair_patterns: ['padding_only', 'line_height_only', 'micro_font_scale_only'],
          escalation_rule: '上一轮 fix_html 后仍被 screenshot_review 拦下的页面必须结构级简化、重排或扩大容器；如果仍是同一父容器 edge_clearance/block_content 问题，必须删除或合并至少一个次级说明句、芯片或装饰行；不得继续只做 padding、line-height 或微缩字号调整。',
        }
      : null;
    const screenshotSummary = screenshotReviewArtifact
      ? {
          status: safeText(screenshotReviewArtifact.status, 'unknown'),
          blocked_checks: Object.entries(screenshotReviewArtifact.checks || {})
            .filter(([, value]) => value === false)
            .map(([key]) => key),
          blocked_slide_ids: screenshotSlideFeedback.map((slide) => slide.slide_id),
          review_summary: normalizeInlineText(screenshotReviewArtifact.ai_review?.review_summary, 320),
          slide_feedback: screenshotSlideFeedback,
        }
      : null;
    if (!directorSummary && !screenshotSummary && !operatorRevisionBrief && !repairAttemptSummary) {
      return null;
    }
    return {
      has_prior_review_feedback: true,
      visual_director_review: directorSummary,
      screenshot_review: screenshotSummary,
      operator_revision_brief: operatorRevisionBrief,
      repair_attempt: repairAttemptSummary,
    };
  }

  function buildRenderRevisionFocusMap(revisionContext) {
    const focusBySlideId = new Map();
    const weakPages = new Set(
      safeArray(revisionContext?.visual_director_review?.weak_pages)
        .map((slideId) => safeText(slideId))
        .filter(Boolean),
    );
    const blockedSlideIds = new Set(
      safeArray(revisionContext?.screenshot_review?.blocked_slide_ids)
        .map((slideId) => safeText(slideId))
        .filter(Boolean),
    );
    const selectedTargetSlideIds = selectRenderTargetSlideIds(revisionContext);
    const slideFeedbackById = new Map(
      safeArray(revisionContext?.screenshot_review?.slide_feedback)
        .map((slide) => [safeText(slide?.slide_id), slide]),
    );
    const operatorSlideFeedbackById = new Map(
      safeArray(revisionContext?.operator_revision_brief?.slide_feedback)
        .map((slide) => [safeText(slide?.slide_id), slide]),
    );
    const operatorTargetSlideIds = new Set(
      safeArray(revisionContext?.operator_revision_brief?.target_slide_ids)
        .map((slideId) => safeText(slideId))
        .filter(Boolean),
    );
    const repeatBlockedSlideIds = new Set(
      safeArray(revisionContext?.repair_attempt?.repeat_blocked_slide_ids)
        .map((slideId) => safeText(slideId))
        .filter(Boolean),
    );
    for (const slideId of new Set([
      ...selectedTargetSlideIds,
      ...slideFeedbackById.keys(),
      ...operatorSlideFeedbackById.keys(),
    ])) {
      if (!slideId) continue;
      const slideFeedback = slideFeedbackById.get(slideId) || {};
      const operatorFeedback = operatorSlideFeedbackById.get(slideId) || {};
      const operatorIssues = safeArray(operatorFeedback?.issues).map((item) => normalizeInlineText(item, 220));
      const operatorKeep = safeArray(operatorFeedback?.keep).map((item) => normalizeInlineText(item, 220));
      const operatorAvoid = safeArray(operatorFeedback?.avoid).map((item) => normalizeInlineText(item, 220));
      const repeatBlockAfterFix = repeatBlockedSlideIds.has(slideId);
      const aiFindings = [
        ...safeArray(slideFeedback?.mechanical_findings),
        ...safeArray(slideFeedback?.ai_findings),
        ...operatorIssues,
        ...operatorKeep.map((item) => `keep: ${item}`),
        ...operatorAvoid.map((item) => `avoid: ${item}`),
        ...(repeatBlockAfterFix
          ? ['重复阻塞：上一轮 fix_html 后本页仍被 screenshot_review 拦下，说明微调不足。']
          : []),
      ].filter(Boolean);
      const recommendedFixParts = [
        safeText(slideFeedback?.recommended_fix),
        ...safeArray(slideFeedback?.mechanical_findings).map((item) => `机械约束：${item}`),
        ...operatorIssues,
        ...operatorKeep.map((item) => `保留：${item}`),
        ...operatorAvoid.map((item) => `避免：${item}`),
        ...(repeatBlockAfterFix
          ? ['重复阻塞强制规则：必须明显删减至少一个次级元素、重排结构或扩大主要容器；如果同一父容器仍有 edge_clearance/block_content 问题，必须删除或合并至少一个次级说明句、芯片或装饰行，不得仅调整 padding、line-height 或微缩字号。']
          : []),
      ].filter(Boolean);
      focusBySlideId.set(slideId, {
        weak_page: weakPages.has(slideId),
        blocked_for_screenshot_review: blockedSlideIds.has(slideId),
        operator_requested_revision: operatorTargetSlideIds.has(slideId),
        repeat_block_after_fix: repeatBlockAfterFix,
        structure_level_repair_required: repeatBlockAfterFix,
        invalid_repair_patterns: repeatBlockAfterFix
          ? ['padding_only', 'line_height_only', 'micro_font_scale_only']
          : [],
        blocked_checks: safeArray(slideFeedback?.blocked_checks),
        ai_findings: aiFindings,
        recommended_fix: recommendedFixParts.join('；'),
        director_review_summary: weakPages.has(slideId)
          ? normalizeInlineText(revisionContext?.visual_director_review?.review_summary, 220)
          : '',
        rewrite_priority: repeatBlockAfterFix
          ? 'repeat_block_requires_structural_simplification'
          : 'must_fix_before_new_variation',
      });
    }
    return focusBySlideId;
  }

  function selectRenderTargetSlideIds(revisionContext) {
    const weakPages = new Set(
      safeArray(revisionContext?.visual_director_review?.weak_pages)
        .map((slideId) => safeText(slideId))
        .filter(Boolean),
    );
    const blockedSlideIds = new Set(
      safeArray(revisionContext?.screenshot_review?.blocked_slide_ids)
        .map((slideId) => safeText(slideId))
        .filter(Boolean),
    );
    const operatorTargetSlideIds = new Set(
      safeArray(revisionContext?.operator_revision_brief?.target_slide_ids)
        .map((slideId) => safeText(slideId))
        .filter(Boolean),
    );
    const operatorExcludedSlideIds = new Set(
      safeArray(revisionContext?.operator_revision_brief?.excluded_slide_ids)
        .map((slideId) => safeText(slideId))
        .filter(Boolean),
    );
    const applyOperatorExclusions = (slideIds) => new Set(
      [...slideIds].filter((slideId) => !operatorExcludedSlideIds.has(slideId)),
    );
    if (blockedSlideIds.size > 0) {
      return applyOperatorExclusions([
        ...blockedSlideIds,
        ...operatorTargetSlideIds,
      ]);
    }
    if (operatorTargetSlideIds.size > 0) {
      return applyOperatorExclusions(operatorTargetSlideIds);
    }
    return applyOperatorExclusions(weakPages);
  }

  function loadPriorRenderedSlideHtmlMap(renderArtifact) {
    return new Map(
      safeArray(renderArtifact?.html_bundle?.slides)
        .map((slide) => [safeText(slide?.slide_id), requireText(slide?.content, 'render_html.html_bundle.slides[].content')])
        .filter(([slideId]) => slideId),
    );
  }

  function planRenderHtmlExecution({
    blueprintSlides,
    revisionContext,
    priorRenderArtifact,
    forceFullRegeneration = false,
  }) {
    if (forceFullRegeneration) {
      return {
        mode: 'full_regeneration',
        slides_to_render: blueprintSlides,
        reused_slides: new Map(),
      };
    }
    const priorRenderedSlides = loadPriorRenderedSlideHtmlMap(priorRenderArtifact);
    const targetedSlideIds = selectRenderTargetSlideIds(revisionContext);
    if (targetedSlideIds.size === 0 || priorRenderedSlides.size === 0) {
      return {
        mode: 'full_regeneration',
        slides_to_render: blueprintSlides,
        reused_slides: new Map(),
      };
    }
    const slidesToRender = [];
    const reusedSlides = new Map();
    for (const slide of blueprintSlides) {
      const slideId = safeText(slide?.slide_id);
      if (!slideId) continue;
      if (targetedSlideIds.has(slideId)) {
        slidesToRender.push(slide);
        continue;
      }
      const priorHtml = priorRenderedSlides.get(slideId);
      if (!priorHtml) {
        return {
          mode: 'full_regeneration',
          slides_to_render: blueprintSlides,
          reused_slides: new Map(),
        };
      }
      reusedSlides.set(slideId, {
        slide_id: slideId,
        content_html: priorHtml,
      });
    }
    return {
      mode: 'targeted_revision_only',
      slides_to_render: slidesToRender,
      reused_slides: reusedSlides,
    };
  }

  function buildOutlineSlideChapterMap(detailedOutlineArtifact) {
    const outlineSlides = safeArray(detailedOutlineArtifact?.detailed_outline?.slides).length > 0
      ? safeArray(detailedOutlineArtifact?.detailed_outline?.slides)
      : safeArray(detailedOutlineArtifact?.slides);
    return new Map(outlineSlides
      .map((slide) => [
        safeText(slide?.slide_id),
        {
          chapter_id: safeText(slide?.chapter_id),
          chapter_title: safeText(slide?.chapter_title || slide?.chapter_name),
        },
      ])
      .filter(([slideId, chapter]) => slideId && chapter.chapter_id));
  }

  function buildRenderHtmlBlueprintSlides(blueprintArtifact, revisionContext = null, detailedOutlineArtifact = null) {
    const revisionFocusBySlideId = buildRenderRevisionFocusMap(revisionContext);
    const chapterBySlideId = buildOutlineSlideChapterMap(detailedOutlineArtifact);
    return safeArray(blueprintArtifact?.slide_blueprint?.slides).map((slide) => ({
      slide_id: slide.slide_id,
      slide_no: slide.slide_no,
      chapter_id: safeText(slide.chapter_id) || chapterBySlideId.get(safeText(slide.slide_id))?.chapter_id || null,
      chapter_title: safeText(slide.chapter_title) || chapterBySlideId.get(safeText(slide.slide_id))?.chapter_title || null,
      page_type: slide.page_type,
      layout_family: slide.visual_presentation?.layout_family,
      title: slide.title,
      page_goal: slide.page_goal,
      core_sentence: slide.core_sentence,
      page_core_content: slide.page_core_content, evidence_points: safeArray(slide.evidence_points),
      anchor_tracks: slide.visual_presentation?.anchor_tracks,
      speaker_seconds: slide.speaker_seconds,
      render_recipe_id: slide.render_recipe_id,
      public_sources: safeArray(slide.evidence_and_sources).map((item) => item.public_label),
      revision_focus: revisionFocusBySlideId.get(safeText(slide.slide_id)) || null,
    }));
  }

  function buildRenderHtmlSectionBatches(slidesToRender, renderBatchSize) {
    const slides = safeArray(slidesToRender);
    if (slides.length === 0) return [];
    const chapterBatches = [];
    for (const slide of slides) {
      const chapterId = safeText(slide?.chapter_id);
      const current = chapterBatches.at(-1);
      if (chapterId && current && current.chapter_id === chapterId && current.slides.length < renderBatchSize) {
        current.slides.push(slide);
        continue;
      }
      if (chapterId) {
        chapterBatches.push({ chapter_id: chapterId, slides: [slide] });
        continue;
      }
      if (current && !current.chapter_id && current.slides.length < renderBatchSize) {
        current.slides.push(slide);
      } else {
        chapterBatches.push({ chapter_id: '', slides: [slide] });
      }
    }
    const batches = [];
    for (const batch of chapterBatches) {
      if (batch.chapter_id && batch.slides.length <= renderBatchSize) {
        batches.push(batch.slides);
        continue;
      }
      batches.push(...chunkArray(batch.slides, renderBatchSize));
    }
    return batches;
  }

  function filterSlideScopedArray(value, slideIds) {
    const allowedSlideIds = new Set(safeArray(slideIds).map((slideId) => safeText(slideId)).filter(Boolean));
    return safeArray(value).filter((item) => {
      const itemSlideId = safeText(typeof item === 'string' ? item : item?.slide_id);
      return itemSlideId && allowedSlideIds.has(itemSlideId);
    });
  }

  function buildRenderVisualDirectionContext(visualDirection, slideIds, route) {
    const normalizedVisualDirection = visualDirection || {};
    if (safeText(route) !== PAGE_FIX_ROUTE) {
      return normalizedVisualDirection;
    }
    return {
      mode: normalizedVisualDirection.mode,
      what_it_is: normalizedVisualDirection.what_it_is,
      what_it_is_not: normalizedVisualDirection.what_it_is_not,
      visual_manifest: normalizedVisualDirection.visual_manifest,
      palette: normalizedVisualDirection.palette,
      typography_plan: normalizedVisualDirection.typography_plan,
      page_family_ceiling: normalizedVisualDirection.page_family_ceiling || {},
      final_instruction_to_html_generator: safeArray(normalizedVisualDirection.final_instruction_to_html_generator),
      forbidden_regressions: safeArray(normalizedVisualDirection.forbidden_regressions),
      peak_pages: filterSlideScopedArray(normalizedVisualDirection.peak_pages, slideIds),
      page_role_table: filterSlideScopedArray(normalizedVisualDirection.page_role_table, slideIds),
      rhythm_curve: filterSlideScopedArray(normalizedVisualDirection.rhythm_curve, slideIds),
    };
  }

  function filterRenderRevisionContextForSlides(revisionContext, slideIds = []) {
    if (!revisionContext) return null;
    const allowedSlideIds = new Set(safeArray(slideIds).map((slideId) => safeText(slideId)).filter(Boolean));
    const directorWeakPages = safeArray(revisionContext?.visual_director_review?.weak_pages)
      .filter((slideId) => allowedSlideIds.has(safeText(slideId)));
    const slideFeedback = safeArray(revisionContext?.screenshot_review?.slide_feedback)
      .filter((slide) => allowedSlideIds.has(safeText(slide?.slide_id)));
    const blockedSlideIds = safeArray(revisionContext?.screenshot_review?.blocked_slide_ids)
      .filter((slideId) => allowedSlideIds.has(safeText(slideId)));
    const operatorTargetSlideIds = safeArray(revisionContext?.operator_revision_brief?.target_slide_ids)
      .filter((slideId) => allowedSlideIds.has(safeText(slideId)));
    const operatorSlideFeedback = safeArray(revisionContext?.operator_revision_brief?.slide_feedback)
      .filter((slide) => allowedSlideIds.has(safeText(slide?.slide_id)));
    const operatorExcludedSlideIds = safeArray(revisionContext?.operator_revision_brief?.excluded_slide_ids)
      .filter((slideId) => allowedSlideIds.has(safeText(slideId)));
    const globalDirectorWeakPages = safeArray(revisionContext?.visual_director_review?.weak_pages);
    const globalSlideFeedback = safeArray(revisionContext?.screenshot_review?.slide_feedback);
    const globalBlockedSlideIds = safeArray(revisionContext?.screenshot_review?.blocked_slide_ids);
    const globalOperatorTargetSlideIds = safeArray(revisionContext?.operator_revision_brief?.target_slide_ids);
    const globalOperatorSlideFeedback = safeArray(revisionContext?.operator_revision_brief?.slide_feedback);
    const repairRepeatBlockedSlideIds = safeArray(revisionContext?.repair_attempt?.repeat_blocked_slide_ids)
      .filter((slideId) => allowedSlideIds.has(safeText(slideId)));
    const batchHasDirectorFocus = directorWeakPages.length > 0;
    const batchHasScreenshotFocus = slideFeedback.length > 0 || blockedSlideIds.length > 0;
    const batchHasOperatorFocus = operatorTargetSlideIds.length > 0 || operatorSlideFeedback.length > 0;
    const globalHasScreenshotFocus = globalSlideFeedback.length > 0 || globalBlockedSlideIds.length > 0;
    const globalHasDirectorFocus = globalDirectorWeakPages.length > 0;
    const globalHasOperatorFocus = globalOperatorTargetSlideIds.length > 0 || globalOperatorSlideFeedback.length > 0;
    if ((globalHasDirectorFocus && !batchHasDirectorFocus && !batchHasScreenshotFocus && !batchHasOperatorFocus)
      || (globalHasScreenshotFocus && !batchHasScreenshotFocus && !batchHasOperatorFocus && !batchHasDirectorFocus)
      || (globalHasOperatorFocus && !batchHasOperatorFocus && !batchHasScreenshotFocus && !batchHasDirectorFocus)) {
      return null;
    }
    const directorSummary = revisionContext?.visual_director_review
      ? {
          ...revisionContext.visual_director_review,
          weak_pages: directorWeakPages,
        }
      : null;
    const screenshotSummary = revisionContext?.screenshot_review
      ? {
          ...revisionContext.screenshot_review,
          blocked_slide_ids: blockedSlideIds,
          slide_feedback: slideFeedback,
        }
      : null;
    const operatorBrief = revisionContext?.operator_revision_brief
      ? {
          ...revisionContext.operator_revision_brief,
          target_slide_ids: operatorTargetSlideIds,
          excluded_slide_ids: operatorExcludedSlideIds,
          slide_feedback: operatorSlideFeedback,
        }
      : null;
    const repairAttempt = revisionContext?.repair_attempt
      ? {
          ...revisionContext.repair_attempt,
          repeat_blocked_slide_ids: repairRepeatBlockedSlideIds,
          repeat_block_after_fix: repairRepeatBlockedSlideIds.length > 0,
        }
      : null;
    const hasDirectorFeedback = safeArray(directorSummary?.weak_pages).length > 0
      || safeText(directorSummary?.review_summary).length > 0;
    const hasScreenshotFeedback = safeArray(screenshotSummary?.blocked_slide_ids).length > 0
      || safeArray(screenshotSummary?.slide_feedback).length > 0;
    const hasOperatorFeedback = safeArray(operatorBrief?.target_slide_ids).length > 0
      || safeArray(operatorBrief?.slide_feedback).length > 0
      || safeArray(operatorBrief?.excluded_slide_ids).length > 0
      || safeArray(operatorBrief?.global_requirements).length > 0;
    const hasRepairAttemptFeedback = safeArray(repairAttempt?.repeat_blocked_slide_ids).length > 0;
    if (!hasDirectorFeedback && !hasScreenshotFeedback && !hasOperatorFeedback && !hasRepairAttemptFeedback) {
      return null;
    }
    return {
      has_prior_review_feedback: true,
      visual_director_review: directorSummary,
      screenshot_review: screenshotSummary,
      operator_revision_brief: operatorBrief,
      repair_attempt: hasRepairAttemptFeedback ? repairAttempt : null,
    };
  }

  function buildRenderSummaryRevisionDigest({ revisionContext, renderedSlideIds = [], reusedSlideIds = [] }) {
    const scopedRevisionContext = filterRenderRevisionContextForSlides(revisionContext, renderedSlideIds);
    if (!scopedRevisionContext) return null;
    return {
      has_prior_review_feedback: true,
      target_slide_ids: safeArray(renderedSlideIds).map((slideId) => safeText(slideId)).filter(Boolean),
      reused_slide_ids: safeArray(reusedSlideIds).map((slideId) => safeText(slideId)).filter(Boolean),
      blocked_checks: safeArray(scopedRevisionContext?.screenshot_review?.blocked_checks),
      blocked_slide_ids: safeArray(scopedRevisionContext?.screenshot_review?.blocked_slide_ids),
      slide_feedback: safeArray(scopedRevisionContext?.screenshot_review?.slide_feedback).map((slide) => ({
        slide_id: safeText(slide?.slide_id),
        blocked_checks: safeArray(slide?.blocked_checks),
        recommended_fix: normalizeInlineText(slide?.recommended_fix, 220),
      })),
      operator_target_slide_ids: safeArray(scopedRevisionContext?.operator_revision_brief?.target_slide_ids),
      repair_attempt: scopedRevisionContext?.repair_attempt
        ? {
            repeat_blocked_slide_ids: safeArray(scopedRevisionContext.repair_attempt.repeat_blocked_slide_ids),
            escalation_strategy: 'structure_level_repair_required',
            structure_level_repair_required: true,
            invalid_repair_patterns: ['padding_only', 'line_height_only', 'micro_font_scale_only'],
          }
        : null,
    };
  }

  return {
    buildRenderHtmlBlueprintSlides,
    buildRenderHtmlSectionBatches,
    buildRenderRevisionContext,
    buildRenderRevisionFocusMap,
    buildRenderRevisionLocalFileInspection,
    buildRenderSummaryRevisionDigest,
    buildRenderVisualDirectionContext,
    computeRenderRevisionFreshness,
    filterRenderRevisionContextForSlides,
    htmlDesignCompanion,
    loadPriorRenderedSlideHtmlMap,
    planRenderHtmlExecution,
    renderContract,
    selectRenderTargetSlideIds,
  };
}
