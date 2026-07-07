// @ts-nocheck
export function createPptDeckScreenshotReviewRuntimeParts(deps) {
  const {
    hasAiVisualBlock,
    safeArray,
    safeText,
    slideIdSet,
  } = deps;

  function mergeSlideReviewList(priorReviews, freshReviews, targetSlideIds) {
    const targetIds = slideIdSet(targetSlideIds);
    const freshById = new Map(
      safeArray(freshReviews)
        .map((slide) => [safeText(slide?.slide_id), slide])
        .filter(([slideId]) => slideId),
    );
    const merged = [];
    const seen = new Set();
    for (const prior of safeArray(priorReviews)) {
      const slideId = safeText(prior?.slide_id);
      if (!slideId) continue;
      const fresh = targetIds.has(slideId) ? freshById.get(slideId) : null;
      merged.push(fresh || prior);
      seen.add(slideId);
    }
    for (const fresh of safeArray(freshReviews)) {
      const slideId = safeText(fresh?.slide_id);
      if (slideId && !seen.has(slideId)) merged.push(fresh);
    }
    return merged;
  }

  function runtimeNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  function runtimeCachedTokens(runtime) {
    return runtimeNumber(runtime?.cached_tokens)
      || runtimeNumber(runtime?.provider_usage?.cached_tokens)
      || runtimeNumber(runtime?.usage?.cached_tokens);
  }

  function normalizeStructuredRuntimeCall(runtime, {
    callKind,
    reviewScope,
    targetSlideIds = [],
  }) {
    const call = {
      ...(runtime || {}),
      call_kind: callKind,
      review_scope: reviewScope,
      target_slide_ids: safeArray(targetSlideIds).map((slideId) => safeText(slideId)).filter(Boolean),
    };
    const cachedTokens = runtimeCachedTokens(call);
    if (cachedTokens > 0) call.cached_tokens = cachedTokens;
    if (cachedTokens > 0) call.cache_hit = true;
    return call;
  }

  function sumRuntimeMetric(calls, key) {
    return safeArray(calls).reduce((total, call) => total + runtimeNumber(call?.[key]), 0);
  }

  function rollupRuntimeMetric(calls, summaryRuntime, key) {
    const total = sumRuntimeMetric(calls, key);
    if (total) return total;
    const summaryValue = runtimeNumber(summaryRuntime?.[key]);
    return summaryValue || null;
  }

  function buildRuntimeRollup(summaryRuntime, childCalls) {
    const calls = safeArray(childCalls);
    return {
      ...(summaryRuntime || {}),
      review_scope: 'summary',
      prompt_bytes: rollupRuntimeMetric(calls, summaryRuntime, 'prompt_bytes'),
      context_bytes: rollupRuntimeMetric(calls, summaryRuntime, 'context_bytes'),
      estimated_prompt_tokens: rollupRuntimeMetric(calls, summaryRuntime, 'estimated_prompt_tokens'),
      prompt_tokens: rollupRuntimeMetric(calls, summaryRuntime, 'prompt_tokens'),
      completion_tokens: rollupRuntimeMetric(calls, summaryRuntime, 'completion_tokens'),
      total_tokens: rollupRuntimeMetric(calls, summaryRuntime, 'total_tokens'),
      cached_tokens: sumRuntimeMetric(calls, 'cached_tokens') || runtimeCachedTokens(summaryRuntime) || null,
      cache_hit: calls.some((call) => call?.cache_hit === true) || null,
      child_calls: calls,
    };
  }

  function buildPriorPassDigest({ priorReviewArtifact, targetSlideIds, allSlideReviews }) {
    const targetIds = slideIdSet(targetSlideIds);
    const allIds = safeArray(allSlideReviews).map((slide) => safeText(slide?.slide_id)).filter(Boolean);
    const priorSlides = safeArray(priorReviewArtifact?.slide_reviews);
    const reusedSlideIds = (allIds.length > 0 ? allIds : priorSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean))
      .filter((slideId) => slideId && !targetIds.has(slideId));
    const blockedPriorSlides = priorSlides
      .filter((slide) => safeText(slide?.status) === 'block' || hasAiVisualBlock(slide?.ai_review))
      .map((slide) => safeText(slide?.slide_id))
      .filter(Boolean);
    return {
      source_review_stage: 'screenshot_review',
      carry_forward_policy: 'reused pages keep prior passed AI and mechanical judgement until final full export gate',
      target_slide_ids: [...targetIds],
      reused_slide_ids: reusedSlideIds,
      prior_passed_slide_count: priorSlides.filter((slide) => !blockedPriorSlides.includes(safeText(slide?.slide_id))).length,
      prior_blocked_slide_ids: blockedPriorSlides,
      prior_weak_pages: safeArray(priorReviewArtifact?.ai_review?.weak_pages),
    };
  }

  return {
    buildPriorPassDigest,
    buildRuntimeRollup,
    mergeSlideReviewList,
    normalizeStructuredRuntimeCall,
  };
}
