import path from 'node:path';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';

export const MIN_REVIEW_QA_BLOCKS = 2;
export const MIN_REVIEW_PRIMARY_POINTS = 1;
export const HARD_SCREENSHOT_BLOCKING_ISSUES = new Set(['overflow_detected']);
export const PAGE_FIX_ROUTE = 'fix_html';
export const TARGETED_SCREENSHOT_MECHANICAL_ISSUES = new Set([
  'overflow_detected',
  'occlusion_detected',
  'visual_density_out_of_range',
  'block_content_overflow_detected',
  'speaker_fit_out_of_range',
]);
export const TARGETED_SCREENSHOT_RERUN_CHECKS = new Set([
  'director_intent_landed',
  'ai_review_passed',
  'overflow_free',
  'occlusion_free',
  'visual_density_ok',
  'block_content_fit_ok',
  'speaker_fit_ok',
  'cover_density_ok',
]);
export const XHS_REVIEW_CHECK_LABELS = Object.freeze({
  ai_review_passed: '首眼语义与视觉锚点',
  overflow_free: '页面溢出',
  occlusion_free: '遮挡与叠压',
  visual_density_ok: '信息密度与版心分布',
  block_content_fit_ok: '卡片内容贴边或断裂',
  speaker_fit_ok: '讲述节奏',
  cover_density_ok: '封面抓停与呼吸',
});

export function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function requireText(value, field) {
  const text = safeText(value);
  if (!text) {
    throw new Error(`Missing xiaohongshu field: ${field}`);
  }
  return text;
}

export function normalizeStringList(value, field, { min = 0, max = Infinity } = {}) {
  const items = safeArray(value).map((item) => safeText(item)).filter(Boolean);
  if (items.length < min || items.length > max) {
    throw new Error(`Invalid xiaohongshu list field: ${field}`);
  }
  return items;
}

export function normalizeXhsScreenshotAiSlideReviews(value, mechanicalSlideReviews) {
  const expectedSlideIds = new Set(mechanicalSlideReviews.map((slide) => slide.slide_id));
  const reviews = safeArray(value).map((item, index) => {
    const slideId = requireText(item?.slide_id, `screenshot_review.slide_reviews[${index}].slide_id`);
    if (!expectedSlideIds.has(slideId)) {
      throw new Error(`Unexpected xiaohongshu screenshot_review.slide_reviews[${index}].slide_id: ${slideId}`);
    }
    const rawJudgement = safeText(item?.judgement, 'pass');
    const judgement = normalizeAiVisualJudgement(rawJudgement);
    if (!['pass', 'block'].includes(judgement)) {
      throw new Error(`Invalid xiaohongshu screenshot_review.slide_reviews[${index}].judgement: ${rawJudgement}`);
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
    throw new Error('xiaohongshu screenshot_review.slide_reviews 必须覆盖全部截图页');
  }
  const covered = new Set(reviews.map((item) => item.slide_id));
  for (const slideId of expectedSlideIds) {
    if (!covered.has(slideId)) {
      throw new Error(`Missing xiaohongshu screenshot_review.slide_reviews entry for ${slideId}`);
    }
  }
  return reviews;
}

export function hasAiVisualPass(aiReview) {
  return normalizeAiVisualJudgement(aiReview?.judgement) === 'pass';
}

export function hasAiVisualBlock(aiReview) {
  return normalizeAiVisualJudgement(aiReview?.judgement) === 'block';
}

export function normalizeAiVisualJudgement(value) {
  const raw = safeText(value, 'pass').toLowerCase();
  if (['block', 'revise', 'fail', 'failed', 'reject', 'rejected', 'needs_revision', 'needs_rewrite'].includes(raw)) {
    return 'block';
  }
  if (['pass', 'ok', 'approved', 'approve', 'weak', 'minor', 'advisory', 'warn', 'warning', 'soft_pass'].includes(raw)) {
    return 'pass';
  }
  return raw;
}

export function buildAiFirstVisualSlideReview(slide, aiReview) {
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

export function aiFirstMechanicalCheckValue(slideReviews, checkKey) {
  return safeArray(slideReviews).every((slide) => Boolean(slide?.checks?.[checkKey]));
}

export function requireObjectArray(value, field, { min = 0, max = Infinity } = {}) {
  const items = safeArray(value).filter((item) => item && typeof item === 'object');
  if (items.length < min || items.length > max) {
    throw new Error(`Invalid xiaohongshu object list field: ${field}`);
  }
  return items;
}

export function joinHumanList(items) {
  return safeArray(items).map((item) => safeText(item)).filter(Boolean).join('、');
}

export function summarizeXhsFailedChecks(failedChecks) {
  return [...new Set(
    safeArray(failedChecks)
      .map((checkId) => safeText(XHS_REVIEW_CHECK_LABELS[safeText(checkId)]))
      .filter(Boolean),
  )];
}

export function buildDeterministicFixHtmlSummary({ targetSlideIds, revisionContext }) {
  const targetSummary = joinHumanList(targetSlideIds);
  const weakPages = [...new Set(
    safeArray(revisionContext?.screenshot_review?.weak_pages)
      .map((slideId) => safeText(slideId))
      .filter(Boolean),
  )];
  const failedChecks = summarizeXhsFailedChecks(revisionContext?.screenshot_review?.failed_checks);
  const summary = [
    `本轮 fix_html 定向修复 ${targetSummary}，未点名页面继续锁定，保持同一套研究纸面、作者署名和页面家族。`,
  ];
  if (failedChecks.length > 0) {
    summary.push(`优先处理 ${joinHumanList(failedChecks)}，把封面、副标、节点卡和页脚关系拉回可发布间距。`);
  } else {
    summary.push('优先处理截图质检点名的遮挡、贴边、坏断句和底部收束问题。');
  }
  if (weakPages.length > 0) {
    summary.push(`同轮纳入 ${joinHumanList(weakPages)} 的弱页，避免只修硬阻断页后继续留下风格漂移。`);
  }
  return summary.slice(0, 3);
}

export function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function copySurfaceFile(source, destination) {
  const sourceFile = safeText(source);
  const destinationFile = safeText(destination);
  if (!sourceFile || !destinationFile || !existsSync(sourceFile)) return null;
  ensureDir(path.dirname(destinationFile));
  writeFileSync(destinationFile, readFileSync(sourceFile));
  return destinationFile;
}

export function extractFirstJsonCodeBlock(markdown) {
  const match = String(markdown || '').match(/```json\s*([\s\S]*?)\s*```/i);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export function normalizeOperatorRevisionBrief(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const slideFeedback = safeArray(value.slide_feedback)
    .map((item) => ({
      slide_id: safeText(item?.slide_id),
      issues: safeArray(item?.issues).map((issue) => safeText(issue)).filter(Boolean),
      keep: safeArray(item?.keep).map((entry) => safeText(entry)).filter(Boolean),
      avoid: safeArray(item?.avoid).map((entry) => safeText(entry)).filter(Boolean),
    }))
    .filter((item) => item.slide_id);
  const targetSlideIds = [...new Set([
    ...safeArray(value.target_slide_ids).map((slideId) => safeText(slideId)).filter(Boolean),
    ...slideFeedback.map((item) => item.slide_id),
  ])];
  const globalRequirements = safeArray(value.global_requirements)
    .map((item) => safeText(item))
    .filter(Boolean);
  if (targetSlideIds.length === 0 && globalRequirements.length === 0) {
    return null;
  }
  return {
    target_slide_ids: targetSlideIds,
    global_requirements: globalRequirements,
    slide_feedback: slideFeedback,
  };
}

export function getDeliverableViewSurfacePaths(deliverablePaths) {
  const baseName = safeText(deliverablePaths?.deliverableId, 'deliverable');
  return {
    stableHtmlFile: path.join(deliverablePaths.viewsDir, `${baseName}.html`),
    draftHtmlFile: path.join(deliverablePaths.viewsDir, `${baseName}.draft.html`),
    currentHtmlFile: path.join(deliverablePaths.viewsDir, `${baseName}.current.html`),
    viewsReadmeFile: path.join(deliverablePaths.viewsDir, 'README.md'),
    operatorDir: path.join(deliverablePaths.viewsDir, 'operator'),
    revisionBriefFile: path.join(deliverablePaths.viewsDir, 'operator', '当前返修要求.md'),
  };
}

export function getDeliverablePublishSurfacePaths(deliverablePaths) {
  const baseName = safeText(deliverablePaths?.deliverableId, 'deliverable');
  const publishDir = path.join(deliverablePaths.deliverableDir, 'publish');
  return {
    publishDir,
    publishScreenshotsDir: path.join(publishDir, 'screenshots'),
    publishHtmlFile: path.join(publishDir, `${baseName}.html`),
    publishCaptionFile: path.join(publishDir, `${baseName}-caption.txt`),
    publishManifestFile: path.join(publishDir, 'manifest.json'),
    publishReadmeFile: path.join(publishDir, 'README.md'),
  };
}

export function buildViewSurfaceReadme(paths) {
  return [
    '# views 目录说明',
    '',
    `- 稳定交付 HTML：${path.basename(paths.stableHtmlFile)}`,
    `- 当前候选 HTML：${path.basename(paths.currentHtmlFile)}`,
    `- 草稿别名 HTML：${path.basename(paths.draftHtmlFile)}`,
    `- 定点返修要求：${path.relative(path.dirname(paths.viewsReadmeFile), paths.revisionBriefFile)}`,
    '',
    '规则：',
    '- 当前候选 HTML 与草稿别名表示最近一轮 render_html / fix_html 的待审稿。',
    '- 默认 .html 只有在 screenshot_review 通过后才会写入，代表当前可交付版。',
    '- 如果当前候选仍在返修，稳定交付 HTML 会继续保留上一轮通过版本。',
    '- 如需定点返修，可在 operator/当前返修要求.md 里写 JSON code block 点名 slide_id 和问题。',
    '',
  ].join('\n');
}

export function loadOperatorRevisionBrief({
  deliverablePaths,
  minimumMtimeMs = 0,
}) {
  const paths = getDeliverableViewSurfacePaths(deliverablePaths);
  if (!existsSync(paths.revisionBriefFile)) return null;
  if (safeFileMtimeMs(paths.revisionBriefFile) < Number(minimumMtimeMs || 0)) {
    return null;
  }
  return normalizeOperatorRevisionBrief(extractFirstJsonCodeBlock(readFileSync(paths.revisionBriefFile, 'utf-8')));
}

export function promoteStableHtml(paths, htmlFile) {
  const ref = copySurfaceFile(htmlFile, paths.stableHtmlFile);
  const refs = ref ? [ref] : [];
  writeText(paths.viewsReadmeFile, buildViewSurfaceReadme(paths));
  refs.push(paths.viewsReadmeFile);
  return refs;
}

export function syncCandidateHtml(paths, htmlFile) {
  const refs = [];
  if (safeText(htmlFile)) {
    refs.push(htmlFile);
  }
  const currentRef = copySurfaceFile(htmlFile, paths.currentHtmlFile);
  if (currentRef) {
    refs.push(currentRef);
  }
  writeText(paths.viewsReadmeFile, buildViewSurfaceReadme(paths));
  refs.push(paths.viewsReadmeFile);
  return [...new Set(refs.filter(Boolean))];
}

export function buildPublishBundleReadme({
  publishDir,
  publishHtmlFile,
  publishCaptionFile,
  publishScreenshotsDir,
  authorSignature = null,
  deliveryState = null,
}) {
  const lines = [
    '# publish 交付包',
    '',
    `- 当前 publish 包状态：${safeText(deliveryState?.current, 'output_ready')}`,
    `- HTML：${path.basename(publishHtmlFile)}`,
    `- Caption：${path.basename(publishCaptionFile)}`,
    `- Screenshots：${path.relative(publishDir, publishScreenshotsDir)}`,
    `- 署名：${safeText(authorSignature?.signature_display)}`,
    `- 品牌：${safeText(authorSignature?.signature_subtitle)}`,
  ];
  if (safeText(deliveryState?.current) === 'stale_previous_output') {
    lines.push(
      '',
      '## 最新候选',
      '',
      `- 最新候选 HTML：${path.relative(publishDir, safeText(deliveryState.latest_candidate_html_file))}`,
      `- 最新审稿截图：${path.relative(publishDir, safeText(deliveryState.latest_review_screenshots_dir))}`,
      `- 最新质控状态：${safeText(deliveryState.latest_candidate_status)}`,
      `- 阻断项：${joinHumanList(deliveryState.blocking_reasons)}`,
    );
  }
  return lines.join('\n');
}

export function markPublishBundleStaleAfterBlockedReview(contract, deliverablePaths, reviewArtifact) {
  const publishPaths = getDeliverablePublishSurfacePaths(deliverablePaths);
  if (!existsSync(publishPaths.publishManifestFile) && !existsSync(publishPaths.publishReadmeFile)) {
    return [];
  }
  const existingManifest = existsSync(publishPaths.publishManifestFile)
    ? readJson(publishPaths.publishManifestFile)
    : {};
  const viewPaths = getDeliverableViewSurfacePaths(deliverablePaths);
  const previousDeliveryState = existingManifest.delivery_state || {};
  const deliveryState = {
    ...previousDeliveryState,
    previous_current: safeText(previousDeliveryState.current, 'output_ready'),
    current: 'stale_previous_output',
    latest_candidate_status: 'blocked_for_revision',
    latest_candidate_html_file: viewPaths.currentHtmlFile,
    latest_review_screenshots_dir: path.join(deliverablePaths.reportsDir, 'screenshots'),
    latest_review_artifact_file: stageArtifactPath(contract, deliverablePaths, 'screenshot_review'),
    blocking_reasons: safeArray(reviewArtifact?.review_state_patch?.blocking_reasons),
    rerun_from_stage: safeText(reviewArtifact?.review_state_patch?.rerun_from_stage),
  };
  const staleManifest = {
    ...existingManifest,
    delivery_state: deliveryState,
  };
  writeJson(publishPaths.publishManifestFile, staleManifest);
  writeText(publishPaths.publishReadmeFile, buildPublishBundleReadme({
    publishDir: publishPaths.publishDir,
    publishHtmlFile: safeText(existingManifest.publish_html_file, publishPaths.publishHtmlFile),
    publishCaptionFile: safeText(existingManifest.publish_caption_file, publishPaths.publishCaptionFile),
    publishScreenshotsDir: publishPaths.publishScreenshotsDir,
    authorSignature: existingManifest.author_signature || null,
    deliveryState,
  }));
  return [publishPaths.publishManifestFile, publishPaths.publishReadmeFile];
}

export function writeJson(file, value) {
  ensureDir(path.dirname(file));
  writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
}

export function writeText(file, value) {
  ensureDir(path.dirname(file));
  writeFileSync(file, value, 'utf-8');
}

export function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function stageArtifactPath(contract, deliverablePaths, stageId) {
  const stage = safeArray(contract?.stage_sequence?.stages).find((item) => item?.stage_id === stageId);
  return path.join(deliverablePaths.artifactsDir, safeText(stage?.output_artifact, `${stageId}.json`));
}

export function readStageArtifact(contract, deliverablePaths, stageId) {
  const file = stageArtifactPath(contract, deliverablePaths, stageId);
  return existsSync(file) ? readJson(file) : null;
}

export function safeFileMtimeMs(file) {
  if (!safeText(file) || !existsSync(file)) return 0;
  try {
    return Number(statSync(file).mtimeMs || 0);
  } catch {
    return 0;
  }
}

export function currentHtmlStageId(contract, deliverablePaths) {
  const renderArtifactFile = stageArtifactPath(contract, deliverablePaths, 'render_html');
  const fixArtifactFile = stageArtifactPath(contract, deliverablePaths, PAGE_FIX_ROUTE);
  const fixMtimeMs = safeFileMtimeMs(fixArtifactFile);
  const renderMtimeMs = safeFileMtimeMs(renderArtifactFile);
  return fixMtimeMs > 0 && fixMtimeMs >= renderMtimeMs
    ? PAGE_FIX_ROUTE
    : 'render_html';
}

export function readCurrentHtmlArtifact(contract, deliverablePaths) {
  return readStageArtifact(contract, deliverablePaths, currentHtmlStageId(contract, deliverablePaths));
}

export function stageOrder(contract, stageId) {
  return safeArray(contract?.stage_sequence?.stages).findIndex((stage) => stage?.stage_id === stageId);
}

export function rerunStageFromReviewSurface(contract, failedChecks, fallbackStage) {
  const rerunMap = contract?.review_surface?.rerun_from_stage || {};
  const candidates = safeArray(failedChecks)
    .map((checkId) => safeText(rerunMap?.[checkId], fallbackStage))
    .filter(Boolean);
  if (candidates.length === 0) return null;
  return candidates.reduce((earliest, candidate) => {
    if (!earliest) return candidate;
    const earliestOrder = stageOrder(contract, earliest);
    const candidateOrder = stageOrder(contract, candidate);
    if (candidateOrder === -1) return earliest;
    if (earliestOrder === -1 || candidateOrder < earliestOrder) return candidate;
    return earliest;
  }, null);
}

export function slideNeedsTargetedRevision(slide) {
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
  const mechanicalIssues = safeArray(slide?.mechanical_issues).length > 0
    ? safeArray(slide?.mechanical_issues)
    : safeArray(slide?.issues);
  return mechanicalIssues.some((issue) => TARGETED_SCREENSHOT_MECHANICAL_ISSUES.has(safeText(issue)));
}

export function collectSlidesNeedingTargetedRevision(slideReviews) {
  return safeArray(slideReviews)
    .filter((slide) => slideNeedsTargetedRevision(slide))
    .filter((slide) => safeText(slide?.slide_id));
}

export function deriveScreenshotReviewRerunStage(contract, failedChecks, slideReviews) {
  const normalizedFailedChecks = safeArray(failedChecks).map((check) => safeText(check)).filter(Boolean);
  if (normalizedFailedChecks.length === 0) return null;
  const targetedSlides = collectSlidesNeedingTargetedRevision(slideReviews);
  if (normalizedFailedChecks.includes('cover_density_ok') && safeArray(slideReviews).length > 0) {
    return PAGE_FIX_ROUTE;
  }
  const onlyPageLevelFailures = normalizedFailedChecks.every((check) => TARGETED_SCREENSHOT_RERUN_CHECKS.has(check));
  if (onlyPageLevelFailures && targetedSlides.length > 0) {
    return PAGE_FIX_ROUTE;
  }
  return rerunStageFromReviewSurface(contract, normalizedFailedChecks, 'render_html');
}
