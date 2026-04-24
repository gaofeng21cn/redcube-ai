import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import { createPptDeckStageParts } from '../packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/stages.js';
import { createXiaohongshuReviewParts } from '../packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime-family-parts/review.js';

const safeArray = (value) => Array.isArray(value) ? value : [];
const safeText = (value, fallback = '') => value == null || value === '' ? fallback : String(value);

function readCount(file) {
  return existsSync(file) ? Number(readFileSync(file, 'utf-8')) : 0;
}

function makePptStageParts() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-screenshot-cache-'));
  const reportsDir = path.join(workspaceRoot, 'reports');
  const screenshotsDir = path.join(reportsDir, 'screenshots', 'capture-a');
  mkdirSync(screenshotsDir, { recursive: true });
  const htmlFile = path.join(workspaceRoot, 'deck.html');
  const screenshotFile = path.join(screenshotsDir, 'slide-01.png');
  const reviewScript = path.join(workspaceRoot, 'review-helper.mjs');
  const callCountFile = path.join(workspaceRoot, 'python-count.txt');
  writeFileSync(htmlFile, '<html><body><section data-slide-id="S01">same html</section></body></html>');
  writeFileSync(screenshotFile, 'png');
  writeFileSync(reviewScript, `import { existsSync, readFileSync, writeFileSync } from 'node:fs';\nconst countFile = ${JSON.stringify(callCountFile)};\nconst count = existsSync(countFile) ? Number(readFileSync(countFile, 'utf-8')) : 0;\nwriteFileSync(countFile, String(count + 1));\nconsole.log(JSON.stringify({ slide_reviews: [{ slide_id: 'S01', title: '第一页', layout_family: 'hero', screenshot_file: ${JSON.stringify(screenshotFile)}, checks: { overflow_free: true, occlusion_free: true, visual_density_ok: true, speaker_fit_ok: true, edge_clearance_ok: true, block_content_fit_ok: true, title_typography_ok: true }, issues: [], metrics: { occupied_ratio: 0.5 } }], checks: { overflow_free: true }, metrics: { page_count: 1 }, baseline: {} }));\n`);
  const deliverablePaths = { deliverableDir: workspaceRoot, reportsDir, deliverableId: 'deck-a' };
  const contract = { title: 'PPT cache', layout_rules: { max_primary_points_per_slide: 5 } };
  const artifacts = new Map();
  let aiBatchCalls = 0;
  const stageParts = createPptDeckStageParts({
    CANVAS: { width: 1152, height: 648 },
    CODEX_DEFAULT_ADAPTER: 'test-adapter',
    CREATIVE_MATERIALIZED_FROM: 'test',
    PAGE_FIX_ROUTE: 'fix_html',
    PROMPT_PACK: { screenshot_review: 'screenshot-review.md' },
    PYTHON_EXPORT: '/tmp/export.py',
    PYTHON_REVIEW: reviewScript,
    RENDER_HTML_BATCH_SIZE: 2,
    RENDER_REFERENCE_SLIDE_WINDOW: 2,
    SCREENSHOT_REVIEW_BATCH_SIZE: 2,
    TARGETED_RENDER_HTML_BATCH_SIZE: 1,
    aiFirstMechanicalCheckValue: (slides, check) => slides.every((slide) => slide.checks?.[check] !== false),
    attachCommon: (stage) => ({ stage }),
    buildAiFirstVisualSlideReview: (slide, aiReview) => ({ ...slide, status: aiReview?.judgement === 'block' ? 'block' : slide.status, ai_review: aiReview }),
    buildAuthoringContext: () => ({}),
    buildDeckHtml: () => '<html></html>',
    chunkArray: (items, size) => {
      const chunks = [];
      for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
      return chunks;
    },
    collectSlidesNeedingTargetedRevision: () => [],
    compareFailuresAndDensity: () => ({ verdict: 'not_degraded' }),
    createReviewCapturePaths: () => ({ captureId: 'capture-a', screenshotsDir, reviewMarkdownFile: path.join(screenshotsDir, 'review.md') }),
    creativeExecution: () => ({}),
    creativeSourceStamp: () => ({}),
    currentHtmlStageId: () => 'render_html',
    deriveProfileChecks: () => ({}),
    deriveScreenshotReviewRerunStage: () => 'render_html',
    directorReviewOutputContract: () => ({}),
    ensureDir: (dir) => {
      mkdirSync(dir, { recursive: true });
      return dir;
    },
    extraChecks: () => ({}),
    generateStructuredArtifact: async ({ context }) => {
      if (context?.review_scope === 'slide_batch') {
        aiBatchCalls += 1;
        return { data: { slide_reviews: [{ slide_id: 'S01', judgement: 'pass', visual_findings: [], recommended_fix: '' }] }, generationRuntime: { provider: 'test' } };
      }
      if (context?.review_scope === 'summary') {
        return { data: { director_intent_landed: true, anti_template_ok: true, weak_pages: [], review_summary: 'ai ok' }, generationRuntime: { provider: 'test' } };
      }
      return { data: {}, generationRuntime: { provider: 'test' } };
    },
    getDeliverablePaths: () => deliverablePaths,
    getDeliverableViewSurfacePaths: () => ({ stableHtmlFile: htmlFile }),
    getReviewState: () => ({}),
    hasAiVisualBlock: (review) => review?.judgement === 'block',
    hydrateRenderedSlideRootMetadata: (slide) => slide,
    isBaselineApprovedState: () => true,
    loadOperatorRevisionBrief: () => null,
    normalizeInlineText: (value) => String(value || ''),
    normalizePptScreenshotAiSlideReviews: (value) => value,
    normalizeStringList: (value) => safeArray(value),
    normalizeTypographyPlan: (value) => value,
    primarySurface: () => 'test-surface',
    readCurrentHtmlArtifact: () => ({ html_bundle: { html_file: htmlFile, page_count: 1, slides: [{ slide_id: 'S01', title: '第一页', content_html: '<section>same html</section>' }] } }),
    readJson: () => ({}),
    readPromptPackText: () => '',
    readStageArtifact: (_contract, _paths, stage) => {
      if (stage === 'screenshot_review') return artifacts.get('screenshot_review') || null;
      if (stage === 'visual_director_review') return { visual_director_review: { director_intent_landed: true, anti_template_ok: true } };
      if (stage === 'slide_blueprint') return { slide_blueprint: { slides: [{ slide_id: 'S01', title: '第一页', speaker_notes: '' }] } };
      if (stage === 'storyline') return {};
      return {};
    },
    renderHtmlOutputContract: () => ({}),
    renderHtmlSummaryOutputContract: () => ({}),
    requireText: (value) => String(value || ''),
    resolvePromptPackAsset: () => '',
    resolveRedCubePythonCommand: () => ({ command: 'node' }),
    safeArray,
    safeFileMtimeMs: () => 0,
    safeText,
    screenshotReviewSlideBatchOutputContract: () => ({}),
    screenshotReviewSummaryOutputContract: () => ({}),
    seedDeliverableStableViews: () => [],
    stageArtifactPath: () => path.join(workspaceRoot, 'screenshot-review.json'),
    summarizeBlueprintSlides: () => [{ slide_id: 'S01', title: '第一页' }],
    summarizeRelativeQuality: () => 'baseline ok',
    validateRenderedReviewAnchors: () => [],
    validateRenderedSlideContent: () => [],
    writeJson: (file, value) => writeFileSync(file, JSON.stringify(value)),
    writeText: (file, text) => {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, text);
    },
  });
  return { stageParts, workspaceRoot, contract, remember: (artifact) => artifacts.set('screenshot_review', artifact), counts: () => ({ python: readCount(callCountFile), aiBatchCalls }) };
}

test('ppt screenshot_review reuses mechanical cache for identical HTML while still running AI visual gate', async () => {
  const fixture = makePptStageParts();
  const first = await fixture.stageParts.buildScreenshotReviewArtifact({
    workspaceRoot: fixture.workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    contract: fixture.contract,
    mode: 'create_new',
    adapter: 'test-adapter',
  });
  fixture.remember(first);
  const second = await fixture.stageParts.buildScreenshotReviewArtifact({
    workspaceRoot: fixture.workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    contract: fixture.contract,
    mode: 'create_new',
    adapter: 'test-adapter',
  });

  assert.equal(fixture.counts().python, 1);
  assert.equal(fixture.counts().aiBatchCalls, 2);
  assert.equal(first.mechanical_review.cache_status, 'miss');
  assert.equal(second.mechanical_review.cache_status, 'hit');
  assert.equal(second.mechanical_review.hash, first.mechanical_review.hash);
  assert.equal(second.mechanical_review.freshness, 'current');
});

function makeXhsReviewParts() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-screenshot-cache-'));
  const reportsDir = path.join(workspaceRoot, 'reports');
  mkdirSync(reportsDir, { recursive: true });
  const htmlFile = path.join(workspaceRoot, 'note.html');
  const screenshotFile = path.join(reportsDir, 'screenshots', 'note-01.png');
  mkdirSync(path.dirname(screenshotFile), { recursive: true });
  writeFileSync(htmlFile, '<html><body><section data-slide-root="true" data-slide-id="N01" data-qa-block="a" data-primary-point="true"><span data-qa-block="b">same html</span></section></body></html>');
  writeFileSync(screenshotFile, 'png');
  const deliverablePaths = { deliverableDir: workspaceRoot, reportsDir, deliverableId: 'note-a' };
  const contract = { title: 'XHS cache', layout_rules: { max_primary_points_per_slide: 4 } };
  const artifacts = new Map();
  let pythonCalls = 0;
  let aiCalls = 0;
  const reviewParts = createXiaohongshuReviewParts({
    CANVAS: { width: 390, height: 844 },
    CODEX_DEFAULT_ADAPTER: 'test-adapter',
    CREATIVE_MATERIALIZED_FROM: 'test',
    PYTHON_REVIEW: '/tmp/review.py',
    attachCommon: (stage) => ({ stage }),
    aiFirstMechanicalCheckValue: (slides, check) => slides.every((slide) => slide.checks?.[check] !== false),
    buildAiFirstVisualSlideReview: (slide, aiReview) => ({ ...slide, ai_review: aiReview }),
    buildAuthoringContext: () => ({}),
    computeBaselineReview: () => ({ baseline_comparison_passed: true }),
    collectSlidesNeedingTargetedRevision: () => [],
    creativeExecution: () => ({}),
    creativeSourceStamp: () => ({}),
    deriveScreenshotReviewRerunStage: () => 'render_html',
    directorReviewOutputContract: () => ({}),
    ensureDir: (dir) => {
      mkdirSync(dir, { recursive: true });
      return dir;
    },
    generateStructuredArtifact: async () => {
      aiCalls += 1;
      return { data: { director_intent_landed: true, anti_template_ok: true, weak_pages: [], review_summary: 'ai ok', slide_reviews: [{ slide_id: 'N01', judgement: 'pass', visual_findings: [], recommended_fix: '' }] }, generationRuntime: { provider: 'test' } };
    },
    getDeliverablePaths: () => deliverablePaths,
    getDeliverableViewSurfacePaths: () => ({ stableHtmlFile: htmlFile }),
    hasAiVisualBlock: (review) => review?.judgement === 'block',
    hasAiVisualPass: (review) => review?.judgement === 'pass',
    loadPriorRenderedXhsSlideHtmlMap: () => new Map([['N01', '<section data-slide-root="true" data-slide-id="N01" data-qa-block="a" data-primary-point="true"><span data-qa-block="b">same html</span></section>']]),
    markPublishBundleStaleAfterBlockedReview: () => [],
    normalizeStringList: (value) => safeArray(value),
    normalizeXhsScreenshotAiSlideReviews: (value) => value,
    primarySurface: () => 'test-surface',
    promoteStableHtml: () => ['stable.html'],
    promptRoute: () => 'prompt.md',
    readCurrentHtmlArtifact: () => ({ html_bundle: { html_file: htmlFile, slides: [{ slide_id: 'N01', title: '第一页', content: '<section data-slide-root="true" data-slide-id="N01" data-qa-block="a" data-primary-point="true"><span data-qa-block="b">same html</span></section>' }] } }),
    readJson: () => ({}),
    readStageArtifact: (_contract, _paths, stage) => {
      if (stage === 'screenshot_review') return artifacts.get('screenshot_review') || null;
      if (stage === 'visual_director_review') return { visual_director_review: { director_intent_landed: true, anti_template_ok: true, memory_hook_present: true } };
      if (stage === 'research') return {};
      return {};
    },
    requireText: (value) => String(value || ''),
    reviewAuthorship: () => ({}),
    runPython: () => {
      pythonCalls += 1;
      return { slide_reviews: [{ slide_id: 'N01', title: '第一页', screenshot_file: screenshotFile, metrics: { occupied_ratio: 0.5, overlaps: [] }, checks: { block_content_fit_ok: true, speaker_fit_ok: true } }], checks: { overflow_free: true }, metrics: { page_count: 1 } };
    },
    safeArray,
    safeText,
    screenshotReviewOutputContract: () => ({}),
    stageArtifactPath: () => path.join(workspaceRoot, 'screenshot-review.json'),
    stripHtml: (value) => String(value || '').replace(/<[^>]+>/g, ''),
    summarizePlanSlides: () => [],
    syncCurrentCandidateHtmlFromStageArtifact: () => ['current.html'],
    writeText: (file, text) => {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, text);
    },
  });
  return { reviewParts, workspaceRoot, contract, deliverablePaths, remember: (artifact) => artifacts.set('screenshot_review', artifact), counts: () => ({ pythonCalls, aiCalls }) };
}

test('xiaohongshu screenshot_review reuses mechanical cache for identical HTML while still running AI visual gate', async () => {
  const fixture = makeXhsReviewParts();
  const first = await fixture.reviewParts.buildScreenshotReview(fixture.workspaceRoot, 'topic-a', fixture.contract, fixture.deliverablePaths, 'create_new', null, 'test-adapter');
  fixture.remember(first);
  const second = await fixture.reviewParts.buildScreenshotReview(fixture.workspaceRoot, 'topic-a', fixture.contract, fixture.deliverablePaths, 'create_new', null, 'test-adapter');

  assert.deepEqual(fixture.counts(), { pythonCalls: 1, aiCalls: 2 });
  assert.equal(first.mechanical_review.cache_status, 'miss');
  assert.equal(second.mechanical_review.cache_status, 'hit');
  assert.equal(second.mechanical_review.hash, first.mechanical_review.hash);
  assert.equal(second.mechanical_review.freshness, 'current');
});
