// @ts-nocheck
import path from 'node:path';
import { existsSync } from 'node:fs';

import {
  collectIncrementalDirectorReviewTargetSlideIds,
} from './incremental-review-scope.js';
import { createPptDeckStageReviewScopeParts } from './stage-review-scope.js';

export function createPptDeckDirectorReviewParts(deps) {
  const {
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    PAGE_FIX_ROUTE,
    PROMPT_PACK,
    attachCommon,
    buildAuthoringContext,
    creativeExecution,
    creativeSourceStamp,
    currentVisualStageId,
    directorReviewOutputContract,
    generateStructuredArtifact,
    isNativePptArtifact,
    loadPriorRenderedSlideHtmlMap,
    mainExistsSync,
    normalizeInlineText,
    normalizeStringList,
    primarySurface,
    readCurrentVisualArtifact,
    readStageArtifact,
    requireText,
    safeArray,
    safeText,
    summarizeBlueprintSlides,
    summarizeNativeSlides,
    writeText,
  } = deps;
  const {
    buildPageLocalVisualDirectionContext,
    filterSlideScopedArray,
    slideIdSet,
  } = createPptDeckStageReviewScopeParts({ safeArray, safeText });

  function buildDirectorPreflightContext(preflight, slideIds) {
    return {
      anti_template_ok: Boolean(preflight?.antiTemplateOk),
      weak_pages: filterSlideScopedArray(preflight?.weakPages, slideIds),
      findings: safeArray(preflight?.findings)
        .filter((finding) => {
          const text = safeText(finding);
          return safeArray(slideIds).some((slideId) => text.includes(safeText(slideId)));
        }),
      slides: safeArray(slideIds).map((slideId) => ({
        slide_id: safeText(slideId),
        weak_page: filterSlideScopedArray(preflight?.weakPages, [slideId]).length > 0,
        findings: safeArray(preflight?.findings).filter((finding) => safeText(finding).includes(safeText(slideId))),
      })),
    };
  }

  async function generateDirectorReviewDraft(contract, deliverablePaths, preflight, adapter = CODEX_DEFAULT_ADAPTER) {
    const renderArtifact = readCurrentVisualArtifact(contract, deliverablePaths);
    const currentVisualStage = currentVisualStageId(contract, deliverablePaths);
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
    const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const priorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
    const incrementalTargetSlideIds = collectIncrementalDirectorReviewTargetSlideIds({
      renderArtifact,
      priorReviewArtifact,
      currentVisualStage,
      pageFixRoute: PAGE_FIX_ROUTE,
    });
    const incrementalReview = incrementalTargetSlideIds.length > 0;
    const targetSlideIdSet = slideIdSet(incrementalTargetSlideIds);
    const renderedSlideHtmlById = loadPriorRenderedSlideHtmlMap(renderArtifact);
    const renderSummary = isNativePptArtifact(renderArtifact)
      ? summarizeNativeSlides(renderArtifact).map((slide) => ({
          slide_id: slide.slide_id,
          title: slide.title,
          layout_family: slide.layout_family,
          peak_page: false,
          text_excerpt: `native editable PPTX: ${slide.shape_count} shapes, ${slide.text_box_count} text boxes`,
        }))
      : safeArray(renderArtifact?.html_bundle?.slides).map((slide) => ({
          slide_id: slide.slide_id,
          title: slide.title,
          layout_family: slide.layout_family,
          peak_page: slide.director_contract?.peak_page,
          text_excerpt: normalizeInlineText(String(slide.content || '').replace(/<[^>]+>/g, ' '), 220),
          ...(incrementalReview
            ? { source_html: renderedSlideHtmlById.get(safeText(slide.slide_id)) || null }
            : {}),
        }));
    const reviewRenderSummary = incrementalReview
      ? renderSummary.filter((slide) => targetSlideIdSet.has(safeText(slide?.slide_id)))
      : renderSummary;
    const reviewedSlideIds = incrementalReview
      ? incrementalTargetSlideIds
      : renderSummary.map((slide) => safeText(slide?.slide_id)).filter(Boolean);
    const { data, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'ppt_deck',
      route: 'visual_director_review',
      promptRelativePath: PROMPT_PACK.visual_director_review,
      context: {
        ...buildAuthoringContext(contract),
        review_scope: incrementalReview ? 'incremental_page_review' : 'full_deck_review',
        blueprint: {
          slides: incrementalReview
            ? filterSlideScopedArray(summarizeBlueprintSlides(blueprintArtifact), incrementalTargetSlideIds)
            : summarizeBlueprintSlides(blueprintArtifact),
        },
        visual_direction: incrementalReview
          ? buildPageLocalVisualDirectionContext(visualArtifact?.visual_direction || null, incrementalTargetSlideIds)
          : visualArtifact?.visual_direction || null,
        render_summary: reviewRenderSummary,
        director_preflight: incrementalReview
          ? buildDirectorPreflightContext(preflight, incrementalTargetSlideIds)
          : null,
        source_surface_kind: isNativePptArtifact(renderArtifact) ? 'native_pptx' : 'html',
      },
      outputContract: directorReviewOutputContract(),
    });
    return {
      data,
      generationRuntime,
      reviewScope: incrementalReview ? 'incremental_page_review' : 'full_deck_review',
      reviewedSlideIds,
      reusedSlideIds: incrementalReview
        ? renderSummary
            .map((slide) => safeText(slide?.slide_id))
            .filter((slideId) => slideId && !targetSlideIdSet.has(slideId))
        : [],
      priorReviewArtifact: incrementalReview ? priorReviewArtifact : null,
    };
  }

  function visibleAudienceText(html) {
    return normalizeInlineText(safeText(html).replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&(nbsp|amp|lt|gt|quot|#39);/g, ' '), 1200);
  }

  function directorHtmlPreflight(renderArtifact) {
    const slides = safeArray(renderArtifact?.html_bundle?.slides);
    const weakPages = new Set();
    const findings = [];
    const metadataLeakPatterns = [
      /当前节点\s*[：:]\s*\d+\s*\/\s*\d+/i,
      /下一步\s*(进入|是|为|[:：])/i,
      /制作目标\s*[：:]/i,
      /\b(operator|internal)\b/i,
      /\bprompt\s*(pack|file|artifact|seed|contract|context|output)\b/i,
      /prompt\s*(输出|生成|写入|文案|指令|上下文)/i,
      /(制作者|内部)(流程|节点|提示|文案|审查|复盘)/i,
    ];
    for (const slide of slides) {
      const slideId = safeText(slide?.slide_id);
      const visibleText = visibleAudienceText(slide?.content || slide?.content_html || slide?.html);
      const leaked = metadataLeakPatterns.some((pattern) => pattern.test(visibleText));
      if (leaked) { weakPages.add(slideId); findings.push(`${slideId}: audience-facing metadata leak`); }
    }
    let currentRun = [];
    let longestRun = [];
    for (const slide of slides) {
      const html = safeText(slide?.content || slide?.content_html || slide?.html);
      const qaCardBlocks = (html.match(/data-qa-block="[^"]*(card|panel|grid)[^"]*"/gi) || []).length;
      const roundedBlocks = (html.match(/border-radius\s*:/gi) || []).length;
      const borderedBlocks = (html.match(/border\s*:\s*\d+px\s+solid/gi) || []).length;
      const whitePanels = (html.match(/background(?:-color)?\s*:\s*(#fff(fff)?|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))/gi) || []).length
        + (visibleAudienceText(html).match(/白色父面板/g) || []).length;
      const cardDensity = qaCardBlocks >= 3 || roundedBlocks >= 12 || borderedBlocks >= 8;
      const denseWhiteCard = cardDensity && whitePanels >= 3;
      currentRun = denseWhiteCard ? [...currentRun, slide] : [];
      if (currentRun.length > longestRun.length) longestRun = currentRun;
    }
    if (longestRun.length >= 4) for (const slide of longestRun) weakPages.add(safeText(slide?.slide_id));
    if (longestRun.length >= 4) findings.push(`homogeneous white-card run: ${longestRun.map((slide) => safeText(slide?.slide_id)).join(',')}`);
    const homogeneousLayoutRisk = longestRun.length >= 4 ? Math.min(0.95, 0.35 + (longestRun.length / Math.max(slides.length, 1))) : 0;
    return { antiTemplateOk: findings.length === 0, weakPages: [...weakPages].filter(Boolean), homogeneousLayoutRisk, findings };
  }

  function directorNativePptPreflight(nativeArtifact) {
    const slides = summarizeNativeSlides(nativeArtifact);
    const weakPages = [];
    const findings = [];
    for (const slide of slides) {
      if (Number(slide.shape_count || 0) < 3 || Number(slide.text_box_count || 0) < 2) {
        weakPages.push(slide.slide_id);
        findings.push(`${slide.slide_id}: native PPT shape manifest too thin`);
      }
      if (!safeText(slide.preview_screenshot_file) || !(mainExistsSync || existsSync)(slide.preview_screenshot_file)) {
        weakPages.push(slide.slide_id);
        findings.push(`${slide.slide_id}: native PPT preview screenshot missing`);
      }
    }
    return {
      antiTemplateOk: findings.length === 0,
      weakPages: [...new Set(weakPages)].filter(Boolean),
      homogeneousLayoutRisk: 0.12,
      findings,
    };
  }


  async function buildDirectorReview(contract, deliverablePaths, adapter = CODEX_DEFAULT_ADAPTER) {
    const renderArtifact = readCurrentVisualArtifact(contract, deliverablePaths);
    const preflight = isNativePptArtifact(renderArtifact)
      ? directorNativePptPreflight(renderArtifact)
      : directorHtmlPreflight(renderArtifact);
    const {
      data,
      generationRuntime,
      reviewScope,
      reviewedSlideIds,
      reusedSlideIds,
      priorReviewArtifact,
    } = await generateDirectorReviewDraft(contract, deliverablePaths, preflight, adapter);
    const priorReview = priorReviewArtifact?.visual_director_review || null;
    const incrementalReview = reviewScope === 'incremental_page_review';
    const targetSlideIds = slideIdSet(reviewedSlideIds);
    const priorWeakPages = incrementalReview
      ? safeArray(priorReview?.weak_pages).filter((slideId) => !targetSlideIds.has(safeText(slideId)))
      : [];
    const directorIntentLanded = Boolean(data?.director_intent_landed)
      && (!incrementalReview || Boolean(priorReview?.director_intent_landed));
    const antiTemplateOk = Boolean(data?.anti_template_ok)
      && preflight.antiTemplateOk
      && (!incrementalReview || Boolean(priorReview?.anti_template_ok));
    const memoryHookPresent = Boolean(data?.memory_hook_present);
    const peakPagesLanded = Boolean(data?.peak_pages_landed ?? true)
      && (!incrementalReview || Boolean(priorReview?.peak_pages_landed ?? true));
    const weakPages = [...new Set([
      ...priorWeakPages,
      ...normalizeStringList(data?.weak_pages, 'visual_director_review.weak_pages', { min: 0, max: 4 }),
      ...preflight.weakPages,
    ])];
    const homogeneousLayoutRisk = Math.max(
      Number(data?.homogeneous_layout_risk || 0),
      Number(incrementalReview ? priorReview?.homogeneous_layout_risk || 0 : 0),
      preflight.homogeneousLayoutRisk,
    );
    const reviewSummary = [
      requireText(data?.review_summary, 'visual_director_review.review_summary'),
      ...preflight.findings.map((finding) => `deterministic preflight blocked ${finding}`),
    ].join(' ');
    const status = directorIntentLanded && antiTemplateOk && peakPagesLanded ? 'pass' : 'block';
    const reviewFile = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}_视觉总监复盘.md`);
    const reviewOwner = primarySurface(generationRuntime, adapter);
    writeText(reviewFile, [
      '# 视觉总监复盘',
      '',
      `- review_owner: ${reviewOwner}`,
      `- director_intent_landed: ${directorIntentLanded}`,
      `- anti_template_ok: ${antiTemplateOk}`,
      `- peak_pages_landed: ${peakPagesLanded}`,
      `- memory_hook_present: ${memoryHookPresent}`,
      `- homogeneous_layout_risk: ${homogeneousLayoutRisk}`,
      `- weak_pages: ${weakPages.join(',') || 'none'}`,
      `- review_summary: ${reviewSummary || 'none'}`,
    ].join('\n'));
    return {
      ...attachCommon('visual_director_review', contract, generationRuntime, adapter),
      review_execution: {
        ...creativeExecution('visual_director_review', generationRuntime, adapter),
        overlay: 'visual_director_review',
        review_scope: reviewScope,
        reviewed_slide_ids: reviewedSlideIds,
        reused_slide_ids: reusedSlideIds,
      },
      review_overlay: 'visual_director_review',
      status,
      visual_director_review: {
        review_model: 'director_first_visual_judgement',
        director_intent_landed: directorIntentLanded,
        anti_template_ok: antiTemplateOk,
        peak_pages_landed: peakPagesLanded,
        memory_hook_present: memoryHookPresent,
        weak_pages: weakPages,
        homogeneous_layout_risk: homogeneousLayoutRisk,
        review_summary: reviewSummary,
        deterministic_preflight: {
          gate_model: 'deterministic_ppt_director_review_preflight',
          anti_template_ok: preflight.antiTemplateOk,
          weak_pages: preflight.weakPages,
          findings: preflight.findings,
        },
        rewrite_action: safeText(data?.rewrite_action) || (status === 'pass' ? 'none' : 'revise_render_html'),
        overlay_handoff: 'screenshot_review',
        creative_sources: {
          review_judgement: creativeSourceStamp({
            route: 'visual_director_review',
            lifecycleStage: 'review_overlay',
            authoredSurface: 'visual_director_review_decision',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
        },
      },
      artifact_refs: [reviewFile],
      review_state_patch: {
        current_status: status === 'pass' ? 'director_review_passed' : 'blocked_for_revision',
        ready_for_export: false,
        latest_review_stage: 'visual_director_review',
        latest_checks: {
          director_intent_landed: directorIntentLanded,
          anti_template_ok: antiTemplateOk,
          memory_hook_present: memoryHookPresent,
        },
        pending_reviews: status === 'pass' ? [] : ['director_intent_landed', 'anti_template_ok'],
        blocking_reasons: status === 'pass' ? [] : ['director_intent_landed', 'anti_template_ok'],
        rerun_from_stage: status === 'pass' ? null : 'render_html',
        rerun_policy: {
          status: status === 'pass' ? 'idle' : 'rerun_required',
          rerun_from_stage: status === 'pass' ? null : 'render_html',
        },
      },
    };
  }


  return {
    buildDirectorReview,
  };
}
