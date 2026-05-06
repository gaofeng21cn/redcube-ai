// @ts-nocheck
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

export function createXiaohongshuScreenshotReviewHelpers(deps) {
  const {
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    attachCommon,
    safeArray,
    safeText,
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
    hash.update(`${safeText(render?.route)}\n`);
    const imagePages = safeArray(render?.image_pages_bundle?.pages || render?.image_page_manifest?.slides);
    if (imagePages.length > 0) {
      hash.update('image_pages\n');
      for (const page of imagePages) {
        const pngFile = safeText(page?.png_file || page?.image_file || page?.screenshot_file || page?.file);
        hash.update(JSON.stringify({
          slide_id: safeText(page?.slide_id),
          title: safeText(page?.title),
          png_file: pngFile,
          prompt_manifest_file: safeText(page?.prompt_manifest_file),
          style_manifest_file: safeText(page?.style_manifest_file),
        }));
        hash.update('\n');
        if (pngFile && existsSync(pngFile)) {
          hash.update(readFileSync(pngFile));
        }
        hash.update('\n');
      }
      return hash.digest('hex');
    }
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

  return {
    buildPreflightGateArtifact,
    buildScreenshotReviewMarkdown,
    cachedMechanicalReview,
    collectIncrementalScreenshotReviewTargetSlideIds,
    hashReviewInput,
    mechanicalCacheMetadata,
    mergeSlideReviewList,
    slideIdSet,
    summarizeMechanicalChecksFromSlides,
  };
}
