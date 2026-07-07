type SafeText = (value: unknown, fallback?: string) => string;
type SafeArray = <T = unknown>(value: unknown) => T[];
type SourceTruth = {
  source_brief?: {
    brief_text?: string;
  };
};
type SourceMaterial = {
  content_text?: string;
  excerpt?: string;
};
type PosterReviewDeps = {
  safeText: SafeText;
  safeArray: SafeArray;
  sourceTruth: (contract: unknown) => SourceTruth | null | undefined;
  sourceMaterials: (contract: unknown) => SourceMaterial[];
  hardScreenshotBlockingIssues: Set<string>;
  targetedScreenshotMechanicalIssues: Set<string>;
};
type NormalizeListOptions = {
  min?: number;
  max?: number;
};
type MechanicalSlideReview = {
  slide_id: string;
  status?: string;
  issues?: string[];
  mechanical_issues?: string[];
  checks?: Record<string, unknown>;
  ai_review?: AiVisualReview | null;
};
type AiVisualReview = {
  judgement?: string;
  recommended_fix?: string;
};
type PosterContractSummary = {
  title?: string;
};

export function createPosterOnepagerReviewHelpers({
  safeText,
  safeArray,
  sourceTruth,
  sourceMaterials,
  hardScreenshotBlockingIssues,
  targetedScreenshotMechanicalIssues,
}: PosterReviewDeps) {
  function requireText(value: unknown, label: string): string {
    const text = safeText(value);
    if (!text) {
      throw new Error(`Missing ${label} in upstream poster generation output`);
    }
    return text;
  }

  function normalizeStringList(value: unknown, label: string, { min = 1, max = 6 }: NormalizeListOptions = {}): string[] {
    const list = safeArray(value)
      .map((item) => safeText(item))
      .filter(Boolean)
      .slice(0, max);
    if (list.length < min) {
      throw new Error(`Missing ${label} in upstream poster generation output`);
    }
    return list;
  }

  function normalizePosterScreenshotAiSlideReviews(value: unknown, mechanicalSlideReviews: MechanicalSlideReview[]) {
    const expectedSlideIds = new Set(mechanicalSlideReviews.map((slide) => slide.slide_id));
    const reviews = safeArray<Record<string, unknown>>(value).map((item, index) => {
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

  function hasAiVisualPass(aiReview: AiVisualReview | null | undefined): boolean {
    return normalizeAiVisualJudgement(aiReview?.judgement) === 'pass';
  }

  function hasAiVisualBlock(aiReview: AiVisualReview | null | undefined): boolean {
    return normalizeAiVisualJudgement(aiReview?.judgement) === 'block';
  }

  function normalizeAiVisualJudgement(value: unknown): string {
    const raw = safeText(value, 'pass').toLowerCase();
    if (['block', 'revise', 'fail', 'failed', 'reject', 'rejected', 'needs_revision', 'needs_rewrite'].includes(raw)) {
      return 'block';
    }
    if (['pass', 'ok', 'approved', 'approve', 'weak', 'minor', 'advisory', 'warn', 'warning', 'soft_pass'].includes(raw)) {
      return 'pass';
    }
    return raw;
  }

  function buildAiFirstVisualSlideReview(slide: MechanicalSlideReview, aiReview: AiVisualReview | null | undefined) {
    const mechanicalIssues = safeArray<string>(slide?.issues);
    const hardMechanicalIssues = mechanicalIssues.filter((issue) => hardScreenshotBlockingIssues.has(issue));
    const aiIssues = hasAiVisualBlock(aiReview) ? ['ai_visual_risk'] : [];
    return {
      ...slide,
      status: hardMechanicalIssues.length === 0 && aiIssues.length === 0 ? 'pass' : 'block',
      issues: [...hardMechanicalIssues, ...aiIssues],
      mechanical_issues: mechanicalIssues,
      ai_review: aiReview || null,
    };
  }

  function aiFirstMechanicalCheckValue(slideReviews: MechanicalSlideReview[], checkKey: string): boolean {
    return safeArray<MechanicalSlideReview>(slideReviews).every((slide) => Boolean(slide?.checks?.[checkKey]));
  }

  function slideNeedsTargetedRevision(slide: MechanicalSlideReview | null | undefined): boolean {
    if (!slide || typeof slide !== 'object') return false;
    if (safeText(slide?.status) === 'block') return true;
    if (hasAiVisualBlock(slide?.ai_review)) return true;
    const aiJudgement = normalizeAiVisualJudgement(slide?.ai_review?.judgement);
    const recommendedFix = safeText(slide?.ai_review?.recommended_fix).toLowerCase();
    if (
      safeText(slide?.status) === 'pass'
      && aiJudgement === 'pass'
      && (!recommendedFix || recommendedFix === 'none')
    ) {
      return false;
    }
    const mechanicalIssues = safeArray<string>(slide?.mechanical_issues).length > 0
      ? safeArray<string>(slide?.mechanical_issues)
      : safeArray<string>(slide?.issues);
    return mechanicalIssues.some((issue) => targetedScreenshotMechanicalIssues.has(safeText(issue)));
  }

  function requireObjectArray(value: unknown, label: string, { min = 1, max = 6 }: NormalizeListOptions = {}) {
    const list = safeArray<Record<string, unknown>>(value)
      .filter((item) => item && typeof item === 'object')
      .slice(0, max);
    if (list.length < min) {
      throw new Error(`Missing ${label} in upstream poster generation output`);
    }
    return list;
  }

  function audienceFacingLines(value: unknown): string[] {
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

  function extractAudienceFacingSnippet(value: unknown, maxLength = 220): string {
    const lines = audienceFacingLines(value);
    const informative = lines.find((line) => line.length >= 16) || lines[0] || '';
    return informative.slice(0, maxLength);
  }

  function sourceTopicSummary(contract: PosterContractSummary): string {
    return safeText(contract.title)
      || safeText(sourceTruth(contract)?.source_brief?.brief_text);
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
