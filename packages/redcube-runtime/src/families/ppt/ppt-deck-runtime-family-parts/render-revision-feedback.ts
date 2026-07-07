// @ts-nocheck
import path from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

export function createPptDeckRenderRevisionFeedbackParts(deps) {
  const {
    collectSlidesNeedingTargetedRevision,
    mainExistsSync,
    normalizeInlineText,
    readdirSync: readdirSyncOverride,
    safeArray,
    safeFileMtimeMs,
    safeText,
    selectRenderTargetSlideIds,
  } = deps;
  const SCREENSHOT_MECHANICAL_ISSUE_LABELS = Object.freeze({
    overflow_detected: '存在溢出或裁切',
    occlusion_detected: '存在遮挡或重叠',
    visual_density_out_of_range: '信息密度偏高',
    edge_clearance_out_of_range: '卡片或内容贴边',
    title_typography_inconsistent: '标题字号与正文页统一档位不一致',
  });

  function failureScopeLabel(scope) {
    return scope === 'wrapper_edge' ? '外缘安全距' : '内边距';
  }

  function failureSideLabel(side) {
    return ({
      left: '左侧',
      top: '顶部',
      right: '右侧',
      bottom: '底部',
    })[safeText(side)] || safeText(side);
  }

  function summarizeMechanicalFinding(slide, failure) {
    const blockId = safeText(failure?.block_id, 'unknown-block');
    const scopeLabel = failureScopeLabel(safeText(failure?.scope));
    const sideLabel = failureSideLabel(failure?.side);
    const value = Number.isFinite(Number(failure?.value)) ? Number(failure.value) : null;
    const threshold = Number.isFinite(Number(failure?.threshold)) ? Number(failure.threshold) : null;
    return normalizeInlineText(
      `机械审计：${safeText(slide?.slide_id)} 的 ${blockId} ${sideLabel}${scopeLabel}为 ${value ?? 'unknown'}，低于阈值 ${threshold ?? 'unknown'}`,
      220,
    );
  }

  function summarizeBlockContentFailure(slide, failure) {
    const slideId = safeText(slide?.slide_id);
    const blockId = safeText(failure?.block_id, 'unknown-block');
    const reason = safeText(failure?.overflow_reason, 'block_content_failure');
    if (reason === 'surface_text_targets_overlap') {
      return normalizeInlineText(
        `机械审计：${slideId} 的 ${blockId} 内部元素重叠 ${failure?.overlap_width ?? 'unknown'}x${failure?.overlap_height ?? 'unknown'}px`,
        220,
      );
    }
    if (reason === 'surface_text_scroll_overflow') {
      return normalizeInlineText(
        `机械审计：${slideId} 的 ${blockId} 内部文本容器 scroll overflow ${failure?.scroll_overflow_y_px ?? 0}px`,
        220,
      );
    }
    if (reason === 'surface_text_targets_too_close') {
      return normalizeInlineText(
        `机械审计：${slideId} 的 ${blockId} 内部元素间距 ${failure?.gap ?? 'unknown'}px，低于阈值 ${failure?.threshold ?? 'unknown'}px`,
        220,
      );
    }
    return normalizeInlineText(`机械审计：${slideId} 的 ${blockId} 存在 ${reason}`, 220);
  }

  function summarizeTitleTypographyFinding(slide) {
    const issues = new Set(safeArray(slide?.issues).map((issue) => safeText(issue)));
    if (!issues.has('title_typography_inconsistent') && slide?.checks?.title_typography_ok !== false) {
      return null;
    }
    const fontSize = Number(slide?.metrics?.title_font_size || 0);
    const reference = Number(slide?.metrics?.title_font_reference || 0);
    const delta = Number(slide?.metrics?.title_font_delta || 0);
    if (!Number.isFinite(fontSize) || !Number.isFinite(reference) || fontSize <= 0 || reference <= 0) {
      return normalizeInlineText(
        `机械审计：${safeText(slide?.slide_id)} 主标题字号无法与正文页参考档位稳定对齐；修复时必须恢复本套正文页标题体系。`,
        220,
      );
    }
    const direction = fontSize < reference ? '低于' : '高于';
    return normalizeInlineText(
      `机械审计：${safeText(slide?.slide_id)} 主标题字号 ${fontSize}px，正文页参考档位 ${reference}px，当前${direction}参考 ${delta}px；应调回参考档位±2.5px，必要时缩短标题或自然语义换行。`,
      260,
    );
  }

  function summarizeRenderRevisionSlideFeedback(reviewArtifact) {
    const slideReviews = safeArray(reviewArtifact?.slide_reviews).length > 0
      ? safeArray(reviewArtifact?.slide_reviews)
      : safeArray(reviewArtifact?.ai_review?.slide_reviews).map((slide) => ({
          ...slide,
          ai_review: slide?.ai_review && typeof slide.ai_review === 'object'
            ? slide.ai_review
            : {
                judgement: safeText(slide?.judgement),
                visual_findings: safeArray(slide?.visual_findings),
                recommended_fix: safeText(slide?.recommended_fix),
              },
        }));
    return collectSlidesNeedingTargetedRevision(slideReviews)
      .map((slide) => ({
        slide_id: safeText(slide?.slide_id),
        title: safeText(slide?.title),
        screenshot_file: safeText(slide?.screenshot_file),
        blocked_checks: safeArray(slide?.issues),
        mechanical_findings: [
          ...safeArray(slide?.mechanical_issues).map((issue) => normalizeInlineText(
            `机械审计：${SCREENSHOT_MECHANICAL_ISSUE_LABELS[safeText(issue)] || safeText(issue)}`,
            220,
          )),
          summarizeTitleTypographyFinding(slide),
          ...safeArray(slide?.metrics?.edge_clearance_failures).map((failure) => summarizeMechanicalFinding(slide, failure)),
          ...safeArray(slide?.metrics?.block_content_failures).map((failure) => summarizeBlockContentFailure(slide, failure)),
        ].filter(Boolean),
        ai_findings: safeArray(slide?.ai_review?.visual_findings).map((item) => normalizeInlineText(item, 220)),
        recommended_fix: normalizeInlineText(slide?.ai_review?.recommended_fix, 220),
      }))
      .filter((slide) => slide.slide_id);
  }

  function slideScreenshotFileName(slideId) {
    const digits = safeText(slideId).replace(/\D+/g, '');
    if (!digits) return '';
    return `slide-${digits.padStart(2, '0')}.png`;
  }

  function listScreenshotCaptureDirs(deliverablePaths) {
    const screenshotsDir = path.join(deliverablePaths.reportsDir, 'screenshots');
    if (!(mainExistsSync || existsSync)(screenshotsDir)) return [];
    return (readdirSyncOverride || readdirSync)(screenshotsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(screenshotsDir, entry.name))
      .sort((left, right) => safeFileMtimeMs(right) - safeFileMtimeMs(left));
  }

  function collectHistoricalSlideScreenshots(deliverablePaths, slideId, currentScreenshotFile = '', limit = 2) {
    const screenshotName = slideScreenshotFileName(slideId);
    if (!screenshotName) return [];
    const currentResolved = safeText(currentScreenshotFile) ? path.resolve(currentScreenshotFile) : '';
    const results = [];
    for (const captureDir of listScreenshotCaptureDirs(deliverablePaths)) {
      const candidate = path.join(captureDir, screenshotName);
      if (!(mainExistsSync || existsSync)(candidate)) continue;
      if (currentResolved && path.resolve(candidate) === currentResolved) continue;
      results.push(candidate);
      if (results.length >= limit) break;
    }
    return results;
  }

  function buildRenderRevisionLocalFileInspection({ deliverablePaths, slideBatch, revisionContext }) {
    const slideFeedbackById = new Map(
      safeArray(revisionContext?.screenshot_review?.slide_feedback)
        .map((slide) => [safeText(slide?.slide_id), slide]),
    );
    const targetedSlideIds = selectRenderTargetSlideIds(revisionContext);
    const entries = [];
    for (const slide of safeArray(slideBatch)) {
      const slideId = safeText(slide?.slide_id);
      if (!slideId || !targetedSlideIds.has(slideId)) continue;
      const currentScreenshotFile = safeText(slideFeedbackById.get(slideId)?.screenshot_file)
        || path.join(deliverablePaths.reportsDir, 'screenshots', slideScreenshotFileName(slideId));
      if ((mainExistsSync || existsSync)(currentScreenshotFile)) {
        entries.push({
          label: `${slideId} current blocked screenshot`,
          path: currentScreenshotFile,
          media_type: 'image/png',
          purpose: `${slideId} 当前被拦下的截图，先修掉这里的遮挡、溢出、错误换行或层级问题。`,
        });
      }
      for (const [index, file] of collectHistoricalSlideScreenshots(deliverablePaths, slideId, currentScreenshotFile, 2).entries()) {
        entries.push({
          label: `${slideId} historical reference ${index + 1}`,
          path: file,
          media_type: 'image/png',
          purpose: `${slideId} 最近一轮历史版本截图；如果其中有更好的构图、字号或换行，可以借鉴，但不要把旧问题一起带回。`,
        });
      }
    }
    return entries;
  }

  return {
    buildRenderRevisionLocalFileInspection,
    summarizeRenderRevisionSlideFeedback,
  };
}
