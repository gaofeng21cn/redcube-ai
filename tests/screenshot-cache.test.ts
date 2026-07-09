// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';

import { materializeScreenshotCaptureStore } from './package-surfaces.ts';
import { materializePptScreenshotReviewCapture } from '../packages/redcube-runtime/dist/families/ppt/ppt-deck-runtime-family-parts/screenshot-capture.js';
import { createPptDeckStageParts } from '../packages/redcube-runtime/dist/families/ppt/ppt-deck-runtime-family-parts/stages.js';
import { createXiaohongshuReviewParts } from '../packages/redcube-runtime/dist/families/xiaohongshu/xiaohongshu-runtime-family-parts/review.js';
import { pptExportHelperFixture, pptReviewHelperFixture, testPythonCommandEnv } from './helpers/python-native-helper-fixtures.ts';

const safeArray = (value) => Array.isArray(value) ? value : [];
const safeText = (value, fallback = '') => value == null || value === '' ? fallback : String(value);
const ONE_BY_ONE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64',
);

function readCount(file) {
  return existsSync(file) ? Number(readFileSync(file, 'utf-8')) : 0;
}

test('screenshot capture store deduplicates same slide content while preserving capture paths and manifest', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-screenshot-cas-'));
  const reportsDir = path.join(workspaceRoot, 'reports');
  const firstCaptureDir = path.join(reportsDir, 'screenshots', 'capture-a');
  const secondCaptureDir = path.join(reportsDir, 'screenshots', 'capture-b');
  mkdirSync(firstCaptureDir, { recursive: true });
  mkdirSync(secondCaptureDir, { recursive: true });
  const firstSlide = path.join(firstCaptureDir, 'slide-01.png');
  const secondSlide = path.join(secondCaptureDir, 'slide-01.png');
  writeFileSync(firstSlide, ONE_BY_ONE_PNG);
  writeFileSync(secondSlide, ONE_BY_ONE_PNG);

  const first = materializeScreenshotCaptureStore({
    reportsDir,
    captureId: 'capture-a',
    screenshotsDir: firstCaptureDir,
    slideReviews: [{ slide_id: 'S01', screenshot_file: firstSlide }],
  });
  const second = materializeScreenshotCaptureStore({
    reportsDir,
    captureId: 'capture-b',
    screenshotsDir: secondCaptureDir,
    slideReviews: [{ slide_id: 'S01', screenshot_file: secondSlide }],
  });

  const storeDir = path.join(reportsDir, 'screenshots', '_store', 'sha256');
  const storeFiles = readdirSync(storeDir, { recursive: true })
    .filter((entry) => String(entry).endsWith('.png'));
  assert.equal(storeFiles.length, 1);
  assert.equal(first.slides[0].sha256, second.slides[0].sha256);
  assert.equal(first.slides[0].store_path, second.slides[0].store_path);
  assert.equal(first.slides[0].store_status, 'copied');
  assert.equal(second.slides[0].store_status, 'reused');
  assert.equal(first.slides[0].capture_path, firstSlide);
  assert.equal(second.slides[0].capture_path, secondSlide);
  assert.equal(existsSync(firstSlide), true);
  assert.equal(existsSync(secondSlide), true);
  assert.equal(statSync(firstSlide).ino, statSync(first.slides[0].store_path).ino);
  assert.equal(statSync(secondSlide).ino, statSync(second.slides[0].store_path).ino);
  assert.deepEqual(first.slides[0].dimensions, { width: 1, height: 1 });
  assert.equal(first.manifest_file, path.join(firstCaptureDir, 'capture-manifest.json'));
  assert.equal(JSON.parse(readFileSync(first.manifest_file, 'utf-8')).slides[0].store_path, first.slides[0].store_path);
});

test('ppt screenshot delta capture materializes only target slides while reusing prior capture paths', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-delta-capture-'));
  const reportsDir = path.join(workspaceRoot, 'reports');
  const priorDir = path.join(reportsDir, 'screenshots', 'capture-a');
  const deltaDir = path.join(reportsDir, 'screenshots', 'capture-b');
  const s01 = path.join(priorDir, 'slide-01.png');
  const s02Prior = path.join(priorDir, 'slide-02.png');
  const s02Fresh = path.join(deltaDir, 'slide-02.png');
  mkdirSync(priorDir, { recursive: true });
  mkdirSync(deltaDir, { recursive: true });
  writeFileSync(s01, ONE_BY_ONE_PNG);
  writeFileSync(s02Prior, ONE_BY_ONE_PNG);
  writeFileSync(s02Fresh, Buffer.from('fresh-s02'));
  const priorManifest = materializeScreenshotCaptureStore({
    reportsDir,
    captureId: 'capture-a',
    screenshotsDir: priorDir,
    slideReviews: [
      { slide_id: 'S01', screenshot_file: s01 },
      { slide_id: 'S02', screenshot_file: s02Prior },
    ],
  });

  const materialized = materializePptScreenshotReviewCapture({
    deliverablePaths: { reportsDir },
    reviewCapture: { captureId: 'capture-b', screenshotsDir: deltaDir },
    slideReviews: [
      { slide_id: 'S01', screenshot_file: s01 },
      { slide_id: 'S02', screenshot_file: s02Fresh },
    ],
    mechanicalSlideReviews: [
      { slide_id: 'S01', screenshot_file: s01 },
      { slide_id: 'S02', screenshot_file: s02Fresh },
    ],
    targetSlideIds: ['S02'],
    priorCaptureManifest: priorManifest,
    captureMode: 'delta',
  });

  assert.equal(materialized.captureManifest.capture_mode, 'delta');
  assert.deepEqual(materialized.captureManifest.slides.map((slide) => slide.slide_id), ['S02']);
  assert.equal(existsSync(path.join(deltaDir, 'slide-01.png')), false);
  assert.equal(existsSync(path.join(deltaDir, 'slide-02.png')), true);
  assert.equal(
    materialized.slideReviews.find((slide) => slide.slide_id === 'S01').screenshot_file,
    priorManifest.slides.find((slide) => slide.slide_id === 'S01').capture_path,
  );
  assert.equal(
    materialized.slideReviews.find((slide) => slide.slide_id === 'S02').screenshot_file,
    path.join(deltaDir, 'slide-02.png'),
  );
  assert.equal(
    materialized.mechanicalSlideReviews.find((slide) => slide.slide_id === 'S01').screenshot_file,
    priorManifest.slides.find((slide) => slide.slide_id === 'S01').capture_path,
  );
});

function makePptStageParts() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-screenshot-cache-'));
  const reportsDir = path.join(workspaceRoot, 'reports');
  const screenshotsDir = path.join(reportsDir, 'screenshots', 'capture-a');
  mkdirSync(screenshotsDir, { recursive: true });
  const htmlFile = path.join(workspaceRoot, 'deck.html');
  const screenshotFile = path.join(screenshotsDir, 'slide-01.png');
  const callCountFile = path.join(workspaceRoot, 'python-count.txt');
  const slideHtml = '<section data-slide-root="true" data-slide-id="S01" data-qa-block="root" data-primary-point="true" data-title="第一页" data-layout-family="hero" data-speaker-seconds="30" data-recipe-id="hero_metric" data-template-id="none" data-peak-page="true" data-director-role="anchor"><div data-qa-block="body">same html</div></section>';
  writeFileSync(htmlFile, `<html><body>${slideHtml}</body></html>`);
  writeFileSync(screenshotFile, 'png');
  const exportHelper = pptExportHelperFixture(workspaceRoot);
  const reviewHelper = pptReviewHelperFixture(workspaceRoot);
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
    PYTHON_EXPORT: exportHelper,
    PYTHON_REVIEW: reviewHelper,
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
    readCurrentHtmlArtifact: () => ({ html_bundle: { html_file: htmlFile, page_count: 1, slides: [{ slide_id: 'S01', title: '第一页', content: slideHtml, content_html: slideHtml, evidence_and_sources: [{ public_label: 'source' }] }] } }),
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
    safeFileMtimeMs: () => 1,
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
  return { stageParts, workspaceRoot, contract, htmlFile, slideHtml, remember: (artifact) => artifacts.set('screenshot_review', artifact), counts: () => ({ python: readCount(callCountFile), aiBatchCalls }) };
}

function legacyPptScreenshotMechanicsV1Hash({ htmlFile, slideHtml }) {
  const hash = createHash('sha256');
  hash.update('ppt_deck_screenshot_mechanics:v1\n');
  hash.update('1152x648\n');
  hash.update(htmlFile);
  hash.update('\n');
  if (htmlFile && existsSync(htmlFile)) {
    hash.update(readFileSync(htmlFile));
  }
  hash.update('\nslides\n');
  hash.update(JSON.stringify([{
    slide_id: 'S01',
    title: '第一页',
    html: slideHtml,
  }]));
  return hash.digest('hex');
}

test('ppt screenshot_review reuses mechanical cache for identical HTML while still running AI visual gate', async () => {
  const fixture = makePptStageParts();
  const previousPythonCommand = process.env.REDCUBE_PYTHON_COMMAND;
  const previousCallCountFile = process.env.REDCUBE_MOCK_PYTHON_CALL_COUNT_FILE;
  process.env.REDCUBE_PYTHON_COMMAND = testPythonCommandEnv();
  process.env.REDCUBE_MOCK_PYTHON_CALL_COUNT_FILE = path.join(fixture.workspaceRoot, 'python-count.txt');
  let first;
  let second;
  try {
    first = await fixture.stageParts.buildScreenshotReviewArtifact({
      workspaceRoot: fixture.workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      contract: fixture.contract,
      mode: 'create_new',
      adapter: 'test-adapter',
    });
    fixture.remember(first);
    second = await fixture.stageParts.buildScreenshotReviewArtifact({
      workspaceRoot: fixture.workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      contract: fixture.contract,
      mode: 'create_new',
      adapter: 'test-adapter',
    });
  } finally {
    if (previousPythonCommand === undefined) {
      delete process.env.REDCUBE_PYTHON_COMMAND;
    } else {
      process.env.REDCUBE_PYTHON_COMMAND = previousPythonCommand;
    }
    if (previousCallCountFile === undefined) {
      delete process.env.REDCUBE_MOCK_PYTHON_CALL_COUNT_FILE;
    } else {
      process.env.REDCUBE_MOCK_PYTHON_CALL_COUNT_FILE = previousCallCountFile;
    }
  }

  assert.equal(fixture.counts().python, 1);
  assert.equal(fixture.counts().aiBatchCalls, 2);
  assert.equal(first.mechanical_review.cache_status, 'miss');
  assert.equal(second.mechanical_review.cache_status, 'hit');
  assert.equal(second.mechanical_review.hash, first.mechanical_review.hash);
  assert.equal(second.mechanical_review.freshness, 'current');
});

test('ppt screenshot_review rejects legacy v1 mechanical cache after review rules change', async () => {
  const fixture = makePptStageParts();
  const legacyHash = legacyPptScreenshotMechanicsV1Hash(fixture);
  fixture.remember({
    mechanical_review: {
      hash: legacyHash,
      slide_reviews: [
        {
          slide_id: 'S01',
          title: '第一页',
          layout_family: 'hero',
          checks: { overflow_free: true },
          issues: [],
          metrics: { occupied_ratio: 0.5 },
        },
      ],
    },
    review_capture: {
      device_scale_factor: 2,
      screenshot_dimensions: { width: 2304, height: 1296 },
    },
  });
  const previousPythonCommand = process.env.REDCUBE_PYTHON_COMMAND;
  const previousCallCountFile = process.env.REDCUBE_MOCK_PYTHON_CALL_COUNT_FILE;
  process.env.REDCUBE_PYTHON_COMMAND = testPythonCommandEnv();
  process.env.REDCUBE_MOCK_PYTHON_CALL_COUNT_FILE = path.join(fixture.workspaceRoot, 'python-count.txt');
  let reviewed;
  try {
    reviewed = await fixture.stageParts.buildScreenshotReviewArtifact({
      workspaceRoot: fixture.workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      contract: fixture.contract,
      mode: 'create_new',
      adapter: 'test-adapter',
    });
  } finally {
    if (previousPythonCommand === undefined) {
      delete process.env.REDCUBE_PYTHON_COMMAND;
    } else {
      process.env.REDCUBE_PYTHON_COMMAND = previousPythonCommand;
    }
    if (previousCallCountFile === undefined) {
      delete process.env.REDCUBE_MOCK_PYTHON_CALL_COUNT_FILE;
    } else {
      process.env.REDCUBE_MOCK_PYTHON_CALL_COUNT_FILE = previousCallCountFile;
    }
  }

  assert.equal(fixture.counts().python, 1);
  assert.equal(reviewed.mechanical_review.cache_status, 'miss');
  assert.notEqual(reviewed.mechanical_review.hash, legacyHash);
});

function makePptScreenshotBatchingFixture() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-screenshot-batching-'));
  const reportsDir = path.join(workspaceRoot, 'reports');
  const screenshotsDir = path.join(reportsDir, 'screenshots', 'capture-a');
  mkdirSync(screenshotsDir, { recursive: true });
  const htmlFile = path.join(workspaceRoot, 'deck.html');
  const slides = ['S01', 'S02', 'S03'].map((slideId, index) => ({
    slide_id: slideId,
    title: `第${index + 1}页`,
    content: `<section data-slide-root="true" data-slide-id="${slideId}" data-qa-block="root" data-primary-point="true" data-title="第${index + 1}页" data-layout-family="body" data-speaker-seconds="30" data-recipe-id="body_metric" data-template-id="none" data-peak-page="false" data-director-role="body"><div data-qa-block="body">page ${index + 1}</div></section>`,
    screenshot_file: path.join(screenshotsDir, `slide-${String(index + 1).padStart(2, '0')}.png`),
  }));
  for (const slide of slides) writeFileSync(slide.screenshot_file, 'png');
  writeFileSync(htmlFile, `<html><body>${slides.map((slide) => slide.content).join('')}</body></html>`);
  const mechanicalSlideReviews = slides.map((slide) => ({
    slide_id: slide.slide_id,
    title: slide.title,
    layout_family: 'body',
    screenshot_file: slide.screenshot_file,
    checks: { overflow_free: true, occlusion_free: true, visual_density_ok: true, speaker_fit_ok: true, edge_clearance_ok: true, block_content_fit_ok: true, title_typography_ok: true, page_number_consistency_ok: true },
    issues: [],
    metrics: { occupied_ratio: 0.5, title_font_size: 34 },
  }));
  const exportHelper = pptExportHelperFixture(workspaceRoot);
  const reviewHelper = pptReviewHelperFixture(workspaceRoot);
  const deliverablePaths = { deliverableDir: workspaceRoot, reportsDir, deliverableId: 'deck-a' };
  const contexts = [];
  const stageParts = createPptDeckStageParts({
    CANVAS: { width: 1152, height: 648 },
    CODEX_DEFAULT_ADAPTER: 'test-adapter',
    CREATIVE_MATERIALIZED_FROM: 'test',
    PAGE_FIX_ROUTE: 'fix_html',
    PROMPT_PACK: { screenshot_review: 'screenshot-review.md' },
    PYTHON_EXPORT: exportHelper,
    PYTHON_REVIEW: reviewHelper,
    RENDER_HTML_BATCH_SIZE: 2,
    RENDER_REFERENCE_SLIDE_WINDOW: 2,
    SCREENSHOT_REVIEW_BATCH_SIZE: 2,
    TARGETED_RENDER_HTML_BATCH_SIZE: 1,
    aiFirstMechanicalCheckValue: (items, check) => items.every((slide) => slide.checks?.[check] !== false),
    attachCommon: (stage) => ({ stage }),
    buildAiFirstVisualSlideReview: (slide, aiReview) => ({ ...slide, ai_review: aiReview }),
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
    creativeExecution: (_route, generationRuntime) => ({ generation_runtime: generationRuntime }),
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
      contexts.push(context);
      if (context?.review_scope === 'slide_batch') {
        return {
          data: {
            slide_reviews: safeArray(context?.screenshot_mechanics?.slides).map((slide) => ({
              slide_id: slide.slide_id,
              judgement: 'pass',
              visual_findings: [],
              recommended_fix: '',
            })),
          },
          generationRuntime: { estimated_prompt_tokens: 7, prompt_bytes: 70, context_bytes: 30 },
        };
      }
      if (context?.review_scope === 'summary') {
        return {
          data: { director_intent_landed: true, anti_template_ok: true, weak_pages: [], review_summary: 'ai ok' },
          generationRuntime: { estimated_prompt_tokens: 3, prompt_bytes: 30, context_bytes: 10 },
        };
      }
      return { data: {}, generationRuntime: {} };
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
    readCurrentHtmlArtifact: () => ({
      route: 'render_html',
      html_bundle: {
        html_file: htmlFile,
        page_count: slides.length,
        slides: slides.map((slide) => ({
          slide_id: slide.slide_id,
          title: slide.title,
          content: slide.content,
          content_html: slide.content,
          evidence_and_sources: [{ public_label: 'source' }],
        })),
      },
    }),
    readJson: () => ({}),
    readPromptPackText: () => '',
    readStageArtifact: (_contract, _paths, stage) => {
      if (stage === 'visual_director_review') return { visual_director_review: { director_intent_landed: true, anti_template_ok: true } };
      if (stage === 'slide_blueprint') return { slide_blueprint: { slides: slides.map((slide) => ({ slide_id: slide.slide_id, title: slide.title })) } };
      if (stage === 'storyline') return {};
      return null;
    },
    renderHtmlOutputContract: () => ({}),
    renderHtmlSummaryOutputContract: () => ({}),
    requireText: (value) => String(value || ''),
    resolvePromptPackAsset: () => '',
    resolveRedCubePythonCommand: () => ({ command: 'node' }),
    safeArray,
    safeFileMtimeMs: () => 1,
    safeText,
    screenshotReviewSlideBatchOutputContract: () => ({}),
    screenshotReviewSummaryOutputContract: () => ({}),
    seedDeliverableStableViews: () => [],
    stageArtifactPath: () => path.join(workspaceRoot, 'screenshot-review.json'),
    summarizeBlueprintSlides: (artifact) => safeArray(artifact?.slide_blueprint?.slides),
    summarizeRelativeQuality: () => 'baseline ok',
    validateRenderedReviewAnchors: () => [],
    validateRenderedSlideContent: () => [],
    writeJson: (file, value) => writeFileSync(file, JSON.stringify(value)),
    writeText: (file, text) => {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, text);
    },
  });
  return { stageParts, workspaceRoot, contract: { title: 'PPT batch review', layout_rules: { max_primary_points_per_slide: 5 } }, contexts };
}

test('ppt screenshot_review batches page-local AI calls while preserving child-call telemetry', async () => {
  const fixture = makePptScreenshotBatchingFixture();
  const previousPythonCommand = process.env.REDCUBE_PYTHON_COMMAND;
  process.env.REDCUBE_PYTHON_COMMAND = testPythonCommandEnv();
  let artifact;
  try {
    artifact = await fixture.stageParts.buildScreenshotReviewArtifact({
      workspaceRoot: fixture.workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      contract: fixture.contract,
      mode: 'create_new',
      adapter: 'test-adapter',
    });
  } finally {
    if (previousPythonCommand === undefined) {
      delete process.env.REDCUBE_PYTHON_COMMAND;
    } else {
      process.env.REDCUBE_PYTHON_COMMAND = previousPythonCommand;
    }
  }

  const slideBatchContexts = fixture.contexts.filter((context) => context.review_scope === 'slide_batch');
  assert.deepEqual(
    slideBatchContexts.map((context) => context.screenshot_mechanics.slides.map((slide) => slide.slide_id)),
    [['S01', 'S02'], ['S03']],
  );
  assert.equal(artifact.status, 'pass');
  assert.deepEqual(artifact.review_execution.reviewed_slide_ids, ['S01', 'S02', 'S03']);
  assert.equal(artifact.review_execution.generation_runtime.estimated_prompt_tokens, 17);
  assert.deepEqual(
    artifact.review_execution.generation_runtime.child_calls.map((call) => call.target_slide_ids),
    [['S01', 'S02'], ['S03'], []],
  );
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
  const reviewHelper = pptReviewHelperFixture(workspaceRoot);
  let pythonCalls = 0;
  let aiCalls = 0;
  const reviewParts = createXiaohongshuReviewParts({
    CANVAS: { width: 390, height: 844 },
    CODEX_DEFAULT_ADAPTER: 'test-adapter',
    CREATIVE_MATERIALIZED_FROM: 'test',
    PYTHON_REVIEW: reviewHelper,
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
    isImagePagesArtifact: () => false,
    loadPriorRenderedXhsSlideHtmlMap: () => new Map([['N01', '<section data-slide-root="true" data-slide-id="N01" data-qa-block="a" data-primary-point="true"><span data-qa-block="b">same html</span></section>']]),
    markPublishBundleStaleAfterBlockedReview: () => [],
    normalizeStringList: (value) => safeArray(value),
    normalizeXhsScreenshotAiSlideReviews: (value) => value,
    primarySurface: () => 'test-surface',
    promoteStableHtml: () => ['stable.html'],
    promptRoute: () => 'prompt.md',
    readCurrentHtmlArtifact: () => ({ html_bundle: { html_file: htmlFile, slides: [{ slide_id: 'N01', title: '第一页', content: '<section data-slide-root="true" data-slide-id="N01" data-qa-block="a" data-primary-point="true"><span data-qa-block="b">same html</span></section>' }] } }),
    readCurrentVisualArtifact: () => ({ route: 'render_html', html_bundle: { html_file: htmlFile, slides: [{ slide_id: 'N01', title: '第一页', content: '<section data-slide-root="true" data-slide-id="N01" data-qa-block="a" data-primary-point="true"><span data-qa-block="b">same html</span></section>' }] } }),
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
