// @ts-nocheck
import { existsSync } from 'node:fs';

export function createPptDeckDirectorReviewPreflightParts(deps) {
  const {
    filterSlideScopedArray,
    mainExistsSync,
    normalizeInlineText,
    normalizeStringList,
    requireText,
    safeArray,
    safeText,
    slideIdSet,
    summarizeImagePages,
    summarizeNativeSlides,
    writeText,
  } = deps;

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

  function visibleAudienceText(html) {
    return normalizeInlineText(safeText(html)
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, ' '), 1200);
  }

  function detectAudienceMetadataLeaks(slides) {
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
      if (leaked) {
        weakPages.add(slideId);
        findings.push(`${slideId}: audience-facing metadata leak`);
      }
    }
    return { weakPages, findings };
  }

  function detectHomogeneousWhiteCardRun(slides) {
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
    return longestRun;
  }

  function directorHtmlPreflight(renderArtifact) {
    const slides = safeArray(renderArtifact?.html_bundle?.slides);
    const { weakPages, findings } = detectAudienceMetadataLeaks(slides);
    const longestRun = detectHomogeneousWhiteCardRun(slides);
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

  function directorImagePagesPreflight(imageArtifact) {
    const pages = summarizeImagePages(imageArtifact);
    const weakPages = [];
    const findings = [];
    for (const page of pages) {
      if (!safeText(page.png_file) || !(mainExistsSync || existsSync)(page.png_file)) {
        weakPages.push(page.slide_id);
        findings.push(`${page.slide_id}: image page PNG missing`);
      }
      if (!safeText(page.prompt_manifest_file) || !(mainExistsSync || existsSync)(page.prompt_manifest_file)) {
        weakPages.push(page.slide_id);
        findings.push(`${page.slide_id}: image prompt manifest missing`);
      }
      if (!safeText(page.style_manifest_file) || !(mainExistsSync || existsSync)(page.style_manifest_file)) {
        weakPages.push(page.slide_id);
        findings.push(`${page.slide_id}: image style manifest missing`);
      }
    }
    return {
      antiTemplateOk: findings.length === 0,
      weakPages: [...new Set(weakPages)].filter(Boolean),
      homogeneousLayoutRisk: 0.12,
      findings,
    };
  }

  function buildDirectorReviewDecision({ data, preflight, priorReview, incrementalReview, reviewedSlideIds }) {
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
    return {
      antiTemplateOk,
      directorIntentLanded,
      homogeneousLayoutRisk,
      memoryHookPresent,
      peakPagesLanded,
      reviewSummary,
      status,
      weakPages,
    };
  }

  function writeDirectorReviewReport(reviewFile, reviewOwner, decision) {
    writeText(reviewFile, [
      '# 视觉总监复盘',
      '',
      `- review_owner: ${reviewOwner}`,
      `- director_intent_landed: ${decision.directorIntentLanded}`,
      `- anti_template_ok: ${decision.antiTemplateOk}`,
      `- peak_pages_landed: ${decision.peakPagesLanded}`,
      `- memory_hook_present: ${decision.memoryHookPresent}`,
      `- homogeneous_layout_risk: ${decision.homogeneousLayoutRisk}`,
      `- weak_pages: ${decision.weakPages.join(',') || 'none'}`,
      `- review_summary: ${decision.reviewSummary || 'none'}`,
    ].join('\n'));
  }

  function buildDirectorReviewStatePatch(status, decision, rerunFromStage = 'render_html') {
    const blockedRerunStage = safeText(rerunFromStage, 'render_html');
    const blockingReasons = [
      !decision.directorIntentLanded ? 'director_intent_not_landed' : '',
      !decision.antiTemplateOk ? 'anti_template_failed' : '',
      !decision.peakPagesLanded ? 'peak_pages_not_landed' : '',
    ].filter(Boolean);
    return {
      current_status: status === 'pass' ? 'director_review_passed' : 'blocked_for_revision',
      ready_for_export: false,
      latest_review_stage: 'visual_director_review',
      latest_checks: {
        director_intent_landed: decision.directorIntentLanded,
        anti_template_ok: decision.antiTemplateOk,
        memory_hook_present: decision.memoryHookPresent,
      },
      pending_reviews: status === 'pass' ? [] : blockingReasons,
      blocking_reasons: status === 'pass' ? [] : blockingReasons,
      rerun_from_stage: status === 'pass' ? null : blockedRerunStage,
      rerun_policy: {
        status: status === 'pass' ? 'idle' : 'rerun_required',
        rerun_from_stage: status === 'pass' ? null : blockedRerunStage,
      },
    };
  }

  return {
    buildDirectorPreflightContext,
    buildDirectorReviewDecision,
    buildDirectorReviewStatePatch,
    directorHtmlPreflight,
    directorImagePagesPreflight,
    directorNativePptPreflight,
    writeDirectorReviewReport,
  };
}
