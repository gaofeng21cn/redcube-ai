export function createPosterOnepagerReviewHelpers({
  safeText,
  safeArray,
  sourceTruth,
  sourceMaterials,
  hardScreenshotBlockingIssues,
  targetedScreenshotMechanicalIssues,
}) {
  function requireText(value, label) {
    const text = safeText(value);
    if (!text) {
      throw new Error(`Missing ${label} in upstream poster generation output`);
    }
    return text;
  }

  function normalizeStringList(value, label, { min = 1, max = 6 } = {}) {
    const list = safeArray(value)
      .map((item) => safeText(item))
      .filter(Boolean)
      .slice(0, max);
    if (list.length < min) {
      throw new Error(`Missing ${label} in upstream poster generation output`);
    }
    return list;
  }

  function normalizePosterScreenshotAiSlideReviews(value, mechanicalSlideReviews) {
    const expectedSlideIds = new Set(mechanicalSlideReviews.map((slide) => slide.slide_id));
    const reviews = safeArray(value).map((item, index) => {
      const slideId = requireText(item?.slide_id, `screenshot_review.slide_reviews[${index}].slide_id`);
      if (!expectedSlideIds.has(slideId)) {
        throw new Error(`Unexpected poster screenshot_review.slide_reviews[${index}].slide_id: ${slideId}`);
      }
      const rawJudgement = safeText(item?.judgement, 'pass');
      const judgement = normalizeAiVisualJudgement(rawJudgement);
      if (!['pass', 'block'].includes(judgement)) {
        throw new Error(`Invalid poster screenshot_review.slide_reviews[${index}].judgement: ${rawJudgement}`);
      }
      return {
        slide_id: slideId,
        judgement,
        visual_findings: normalizeStringList(
          item?.visual_findings,
          `screenshot_review.slide_reviews[${index}].visual_findings`,
          { min: 1, max: 4 },
        ),
        recommended_fix: safeText(item?.recommended_fix, judgement === 'pass' ? 'none' : 'revise_render_html'),
      };
    });
    if (reviews.length !== mechanicalSlideReviews.length) {
      throw new Error('poster screenshot_review.slide_reviews 必须覆盖全部截图页');
    }
    const covered = new Set(reviews.map((item) => item.slide_id));
    for (const slideId of expectedSlideIds) {
      if (!covered.has(slideId)) {
        throw new Error(`Missing poster screenshot_review.slide_reviews entry for ${slideId}`);
      }
    }
    return reviews;
  }

  function hasAiVisualPass(aiReview) {
    return normalizeAiVisualJudgement(aiReview?.judgement) === 'pass';
  }

  function hasAiVisualBlock(aiReview) {
    return normalizeAiVisualJudgement(aiReview?.judgement) === 'block';
  }

  function normalizeAiVisualJudgement(value) {
    const raw = safeText(value, 'pass').toLowerCase();
    if (['block', 'revise', 'fail', 'failed', 'reject', 'rejected', 'needs_revision', 'needs_rewrite'].includes(raw)) {
      return 'block';
    }
    if (['pass', 'ok', 'approved', 'approve', 'weak', 'minor', 'advisory', 'warn', 'warning', 'soft_pass'].includes(raw)) {
      return 'pass';
    }
    return raw;
  }

  function buildAiFirstVisualSlideReview(slide, aiReview) {
    const mechanicalIssues = safeArray(slide?.issues);
    const hardMechanicalIssues = mechanicalIssues.filter((issue) => HARD_SCREENSHOT_BLOCKING_ISSUES.has(issue));
    const aiIssues = hasAiVisualBlock(aiReview) ? ['ai_visual_risk'] : [];
    return {
      ...slide,
      status: hardMechanicalIssues.length === 0 && aiIssues.length === 0 ? 'pass' : 'block',
      issues: [...hardMechanicalIssues, ...aiIssues],
      mechanical_issues: mechanicalIssues,
      ai_review: aiReview || null,
    };
  }

  function aiFirstMechanicalCheckValue(slideReviews, checkKey) {
    return safeArray(slideReviews).every((slide) => Boolean(slide?.checks?.[checkKey]));
  }

  function slideNeedsTargetedRevision(slide) {
    if (!slide || typeof slide !== 'object') return false;
    if (safeText(slide?.status) === 'block') return true;
    if (hasAiVisualBlock(slide?.ai_review)) return true;
    const mechanicalIssues = safeArray(slide?.mechanical_issues).length > 0
      ? safeArray(slide?.mechanical_issues)
      : safeArray(slide?.issues);
    return mechanicalIssues.some((issue) => TARGETED_SCREENSHOT_MECHANICAL_ISSUES.has(safeText(issue)));
  }

  function requireObjectArray(value, label, { min = 1, max = 6 } = {}) {
    const list = safeArray(value)
      .filter((item) => item && typeof item === 'object')
      .slice(0, max);
    if (list.length < min) {
      throw new Error(`Missing ${label} in upstream poster generation output`);
    }
    return list;
  }

  function audienceFacingLines(value) {
    return String(value || '')
      .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
      .replace(/<img[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`+/g, ' ')
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }

  function extractAudienceFacingSnippet(value, maxLength = 220) {
    const lines = audienceFacingLines(value);
    const informative = lines.find((line) => line.length >= 16) || lines[0] || '';
    return informative.slice(0, maxLength);
  }

  function sourceTopicSummary(contract) {
    return extractAudienceFacingSnippet(sourceMaterials(contract)[0]?.content_text || sourceMaterials(contract)[0]?.excerpt, 220)
      || extractAudienceFacingSnippet(sourceTruth(contract)?.source_brief?.brief_text, 220)
      || safeText(contract.title);
  }


  return {
    requireText,
    normalizeStringList,
    normalizePosterScreenshotAiSlideReviews,
    hasAiVisualPass,
    hasAiVisualBlock,
    normalizeAiVisualJudgement,
    buildAiFirstVisualSlideReview,
    aiFirstMechanicalCheckValue,
    slideNeedsTargetedRevision,
    requireObjectArray,
    audienceFacingLines,
    extractAudienceFacingSnippet,
    sourceTopicSummary,
  };
}
