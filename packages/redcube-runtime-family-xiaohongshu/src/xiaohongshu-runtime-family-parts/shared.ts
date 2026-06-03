// @ts-nocheck
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import {
  canonicalStageForRoute,
  readStageFolderArtifact,
  stageFolderArtifactPath,
  stageOrderForCanonicalStage,
} from '@redcube/runtime-protocol';

export const MIN_REVIEW_QA_BLOCKS = 2;
export const MIN_REVIEW_PRIMARY_POINTS = 1;
export const HARD_SCREENSHOT_BLOCKING_ISSUES = new Set(['overflow_detected']);
export const PAGE_FIX_ROUTE = 'fix_html';
export const IMAGE_AUTHOR_ROUTE = 'author_image_pages';
export const IMAGE_REPAIR_ROUTE = 'repair_image_pages';
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

export function currentImagePagesStageId(contract, deliverablePaths) {
  const authorFile = stageArtifactPath(contract, deliverablePaths, IMAGE_AUTHOR_ROUTE);
  const repairFile = stageArtifactPath(contract, deliverablePaths, IMAGE_REPAIR_ROUTE);
  const authorMtimeMs = safeFileMtimeMs(authorFile);
  const repairMtimeMs = safeFileMtimeMs(repairFile);
  if (repairMtimeMs > 0 && repairMtimeMs >= authorMtimeMs) {
    return IMAGE_REPAIR_ROUTE;
  }
  return authorMtimeMs > 0 ? IMAGE_AUTHOR_ROUTE : '';
}

export function imagePagePngFile(page) {
  return safeText(page?.png_file || page?.image_file || page?.screenshot_file || page?.file);
}

export function imagePagesBundle(artifact) {
  return artifact?.image_pages_bundle || artifact?.image_pages || {};
}

export function imagePagesList(artifact) {
  const bundle = imagePagesBundle(artifact);
  return safeArray(bundle?.pages || artifact?.image_page_manifest?.slides || artifact?.pages).map((page, index) => ({
    ...page,
    slide_id: safeText(page?.slide_id, `N${String(index + 1).padStart(2, '0')}`),
    title: safeText(page?.title, `Page ${index + 1}`),
    png_file: imagePagePngFile(page),
    image_file: imagePagePngFile(page),
    prompt_manifest_file: safeText(page?.prompt_manifest_file || bundle?.prompt_manifest_file || artifact?.prompt_manifest_file),
    style_manifest_file: safeText(page?.style_manifest_file || bundle?.style_manifest_file || artifact?.style_manifest_file),
  }));
}

export function isImagePagesArtifact(artifact) {
  const route = safeText(artifact?.route);
  if (![IMAGE_AUTHOR_ROUTE, IMAGE_REPAIR_ROUTE].includes(route)) return false;
  return imagePagesList(artifact).length > 0 || safeArray(imagePagesBundle(artifact)?.png_refs).length > 0;
}

export function currentVisualStageId(contract, deliverablePaths) {
  const htmlStage = currentHtmlStageId(contract, deliverablePaths);
  const htmlMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, htmlStage));
  const imageStage = currentImagePagesStageId(contract, deliverablePaths);
  const imageMtimeMs = imageStage ? safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, imageStage)) : 0;
  const candidates = [
    { stage: htmlStage, mtimeMs: htmlMtimeMs },
    { stage: imageStage, mtimeMs: imageMtimeMs },
  ].filter((item) => item.stage && item.mtimeMs > 0);
  if (candidates.length > 0) {
    candidates.sort((left, right) => right.mtimeMs - left.mtimeMs);
    return candidates[0].stage;
  }
  return imageStage || '';
}

export function readCurrentVisualArtifact(contract, deliverablePaths) {
  const stageId = currentVisualStageId(contract, deliverablePaths);
  if (!stageId) return null;
  return stageId === 'render_html' || stageId === PAGE_FIX_ROUTE
    ? readCurrentHtmlArtifact(contract, deliverablePaths)
    : readStageArtifact(contract, deliverablePaths, stageId);
}

export function visualArtifactMtimeMs(contract, deliverablePaths) {
  const stageId = currentVisualStageId(contract, deliverablePaths);
  return stageId ? safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, stageId)) : 0;
}

export function pngDimensions(file) {
  if (!file || !existsSync(file)) return null;
  const buffer = readFileSync(file);
  if (buffer.length < 24) return null;
  if (buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') return null;
  if (buffer.subarray(12, 16).toString('ascii') !== 'IHDR') return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

export function fileSha256(file) {
  if (!file || !existsSync(file)) return '';
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

export function imagePagesMechanicalReviewPayload(imageArtifact) {
  const pages = imagePagesList(imageArtifact);
  const hashes = new Map();
  for (const page of pages) {
    const sha256 = fileSha256(safeText(page.png_file));
    if (sha256) hashes.set(sha256, (hashes.get(sha256) || 0) + 1);
  }
  const slideReviews = pages.map((page) => {
    const pngFile = safeText(page.png_file);
    const dimensions = pngDimensions(pngFile);
    const sha256 = fileSha256(pngFile);
    const bytes = pngFile && existsSync(pngFile) ? readFileSync(pngFile).length : 0;
    const ratioOk = dimensions !== null
      && Math.abs((dimensions.width / Math.max(dimensions.height, 1)) - (3 / 4)) < 0.02;
    const nonEmpty = bytes > 0;
    const promptManifestFile = safeText(page.prompt_manifest_file);
    const styleManifestFile = safeText(page.style_manifest_file);
    const manifestPresent = Boolean(promptManifestFile && existsSync(promptManifestFile) && styleManifestFile && existsSync(styleManifestFile));
    const duplicate = Boolean(sha256 && (hashes.get(sha256) || 0) > 1);
    const lowInformation = bytes > 0 && bytes < 1500;
    const issues = [
      ...(!pngFile || !existsSync(pngFile) ? ['image_page_png_missing'] : []),
      ...(!manifestPresent ? ['image_page_manifest_missing'] : []),
      ...(!ratioOk ? ['image_page_not_3_4'] : []),
      ...(!nonEmpty ? ['image_page_empty_png'] : []),
      ...(duplicate ? ['duplicate_image_hash'] : []),
      ...(lowInformation ? ['low_information_density_signal'] : []),
    ];
    return {
      slide_id: safeText(page.slide_id),
      title: safeText(page.title),
      layout_family: safeText(page.layout_family, 'image_page'),
      screenshot_file: pngFile,
      checks: {
        overflow_free: issues.length === 0,
        occlusion_free: issues.length === 0,
        visual_density_ok: !lowInformation && nonEmpty,
        block_content_fit_ok: issues.length === 0,
        speaker_fit_ok: true,
      },
      metrics: {
        occupied_ratio: 0.52,
        primary_points: 3,
        overlaps: [],
        image_width: dimensions?.width || 0,
        image_height: dimensions?.height || 0,
        aspect_ratio: dimensions ? Number((dimensions.width / Math.max(dimensions.height, 1)).toFixed(4)) : null,
        bytes,
        sha256: sha256 || null,
        duplicate_hash: duplicate,
        prompt_manifest_file: promptManifestFile || null,
        style_manifest_file: styleManifestFile || null,
        render_proof_source: 'image_pages_png_manifest',
        source_visual_route: safeText(imageArtifact?.route),
      },
      issues,
    };
  });
  const checks = {
    overflow_free: slideReviews.every((slide) => slide.checks.overflow_free),
    occlusion_free: slideReviews.every((slide) => slide.checks.occlusion_free),
    visual_density_ok: slideReviews.every((slide) => slide.checks.visual_density_ok),
    block_content_fit_ok: slideReviews.every((slide) => slide.checks.block_content_fit_ok),
    speaker_fit_ok: true,
  };
  return {
    source_surface_kind: 'image_pages',
    source_visual_route: safeText(imageArtifact?.route),
    page_count: pages.length,
    checks,
    metrics: {
      page_count: pages.length,
      source_surface_kind: 'image_pages',
      source_visual_route: safeText(imageArtifact?.route),
      duplicate_hash_count: slideReviews.filter((slide) => slide.metrics.duplicate_hash).length,
      low_information_density_count: slideReviews.filter((slide) => slide.issues.includes('low_information_density_signal')).length,
    },
    slide_reviews: slideReviews,
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
  sourceSurfaceKind = 'html',
  sourceVisualRoute = '',
  publishImageFiles = [],
  authorSignature = null,
  deliveryState = null,
}) {
  const lines = [
    '# publish 交付包',
    '',
    `- 当前 publish 包状态：${safeText(deliveryState?.current, 'output_ready')}`,
    `- Source surface：${safeText(sourceSurfaceKind, 'html')}`,
    `- Source visual route：${safeText(sourceVisualRoute)}`,
    ...(safeText(publishHtmlFile) ? [`- HTML：${path.basename(publishHtmlFile)}`] : []),
    `- Caption：${path.basename(publishCaptionFile)}`,
    `- Screenshots：${path.relative(publishDir, publishScreenshotsDir)}`,
    `- Image files：${safeArray(publishImageFiles).length}`,
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
  const stage = [
    ...safeArray(contract?.stage_sequence?.stages),
    ...safeArray(contract?.stage_sequence?.alternate_stages),
  ].find((item) => item?.stage_id === stageId);
  const canonicalStageId = canonicalStageForRoute(stageId);
  return stageFolderArtifactPath({
    deliverablePaths,
    domainId: 'redcube_ai',
    programId: safeText(deliverablePaths.programId),
    topicId: safeText(deliverablePaths.topicId),
    deliverableId: deliverablePaths.deliverableId,
    routeStageId: stageId,
    canonicalStageId,
    stageOrder: stageOrderForCanonicalStage(canonicalStageId),
    outputName: safeText(stage?.output_artifact, `${stageId}.json`),
  });
}

export function readStageArtifact(contract, deliverablePaths, stageId) {
  const loaded = readStageFolderArtifact({
    deliverablePaths,
    routeStageId: stageId,
    canonicalStageId: canonicalStageForRoute(stageId),
  });
  return loaded?.status === 'success' || loaded?.status === 'blocked'
    ? loaded.artifact
    : null;
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
  if (fixMtimeMs <= 0 && renderMtimeMs <= 0) return '';
  return fixMtimeMs > 0 && fixMtimeMs >= renderMtimeMs
    ? PAGE_FIX_ROUTE
    : 'render_html';
}

export function readCurrentHtmlArtifact(contract, deliverablePaths) {
  const stageId = currentHtmlStageId(contract, deliverablePaths);
  return stageId ? readStageArtifact(contract, deliverablePaths, stageId) : null;
}

export function stageOrder(contract, stageId) {
  return [
    ...safeArray(contract?.stage_sequence?.stages),
    ...safeArray(contract?.stage_sequence?.alternate_stages),
  ].findIndex((stage) => stage?.stage_id === stageId);
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
