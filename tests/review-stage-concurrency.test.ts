// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { createPptDeckStageParts } from '../packages/redcube-runtime-family-ppt/dist/ppt-deck-runtime-family-parts/stages.js';
import { createXiaohongshuReviewParts } from '../packages/redcube-runtime-family-xiaohongshu/dist/xiaohongshu-runtime-family-parts/review.js';
import { pptExportHelperFixture, pptReviewHelperFixture, testPythonCommandEnv } from './helpers/python-native-helper-fixtures.ts';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function makeXhsReviewParts({ baselineDelayMs = 80, aiDelayMs = 80, events }) {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-concurrency-'));
  const reportsDir = path.join(workspaceRoot, 'reports');
  const screenshotsDir = path.join(reportsDir, 'screenshots');
  mkdirSync(screenshotsDir, { recursive: true });
  const htmlFile = path.join(workspaceRoot, 'current.html');
  const screenshotFile = path.join(screenshotsDir, 'note-01.png');
  writeFileSync(htmlFile, '<html><body>ok</body></html>');
  writeFileSync(screenshotFile, 'png');
  const deliverablePaths = {
    deliverableDir: workspaceRoot,
    reportsDir,
    deliverableId: 'xhs-a',
  };
  const reviewHelper = pptReviewHelperFixture(workspaceRoot);
  const contract = {
    title: '并发审阅测试',
    layout_rules: { max_primary_points_per_slide: 4 },
  };
  const reviewParts = createXiaohongshuReviewParts({
    CANVAS: { width: 390, height: 844 },
    CODEX_DEFAULT_ADAPTER: 'test-adapter',
    CREATIVE_MATERIALIZED_FROM: 'test',
    PYTHON_REVIEW: reviewHelper,
    attachCommon: (stage) => ({ stage }),
    aiFirstMechanicalCheckValue: (slides, check) => slides.every((slide) => slide.checks?.[check] !== false),
    buildAiFirstVisualSlideReview: (slide, aiReview) => ({ ...slide, ai_review: aiReview }),
    buildAuthoringContext: () => ({}),
    computeBaselineReview: async () => {
      events.push('baseline:start');
      await delay(baselineDelayMs);
      events.push('baseline:end');
      return {
        baseline_deliverable_id: 'baseline-a',
        baseline_comparison_passed: true,
        summary: 'baseline ok',
      };
    },
    creativeExecution: () => ({}),
    creativeSourceStamp: () => ({}),
    deriveScreenshotReviewRerunStage: () => 'render_html',
    directorReviewOutputContract: () => ({}),
    ensureDir: (dir) => {
      mkdirSync(dir, { recursive: true });
      return dir;
    },
    generateStructuredArtifact: async ({ context }) => {
      if (context?.screenshot_mechanics) {
        events.push('ai:start');
        await delay(aiDelayMs);
        events.push('ai:end');
        return {
          data: {
            director_intent_landed: true,
            anti_template_ok: true,
            weak_pages: [],
            review_summary: 'ai ok',
            slide_reviews: [{
              slide_id: 'N01',
              judgement: 'pass',
              visual_findings: [],
              recommended_fix: '',
            }],
          },
          generationRuntime: { provider: 'test' },
        };
      }
      return { data: {}, generationRuntime: { provider: 'test' } };
    },
    getDeliverablePaths: () => ({ deliverableDir: workspaceRoot }),
    getDeliverableViewSurfacePaths: () => ({}),
    hasAiVisualBlock: (review) => review?.judgement === 'block',
    hasAiVisualPass: (review) => review?.judgement === 'pass',
    imagePagesMechanicalReviewPayload: () => ({}),
    isImagePagesArtifact: () => false,
    loadPriorRenderedXhsSlideHtmlMap: () => new Map([['N01', '<section>ok</section>']]),
    markPublishBundleStaleAfterBlockedReview: () => [],
    normalizeStringList: (value) => Array.isArray(value) ? value : [],
    normalizeXhsScreenshotAiSlideReviews: (value) => value,
    primarySurface: () => 'test-surface',
    promoteStableHtml: () => ['stable.html'],
    promptRoute: () => 'prompt.md',
    readCurrentHtmlArtifact: () => ({
      html_bundle: {
        html_file: htmlFile,
        slides: [{
          slide_id: 'N01',
          title: '第一页',
          content: '<section data-slide-root="true" data-slide-id="N01"><div data-qa-block="title" data-primary-point="true">第一页</div><div data-qa-block="body">ok</div></section>',
        }],
      },
    }),
    readCurrentVisualArtifact: () => ({
      route: 'render_html',
      html_bundle: {
        html_file: htmlFile,
        slides: [{
          slide_id: 'N01',
          title: '第一页',
          content: '<section data-slide-root="true" data-slide-id="N01"><div data-qa-block="title" data-primary-point="true">第一页</div><div data-qa-block="body">ok</div></section>',
        }],
      },
    }),
    readJson: () => ({}),
    readStageArtifact: (_contract, _paths, stage) => {
      if (stage === 'visual_director_review') {
        return {
          visual_director_review: {
            director_intent_landed: true,
            anti_template_ok: true,
            memory_hook_present: true,
          },
        };
      }
      return {};
    },
    requireText: (value) => String(value || ''),
    reviewAuthorship: () => ({}),
    runPython: () => ({
      slide_reviews: [{
        slide_id: 'N01',
        title: '第一页',
        screenshot_file: screenshotFile,
        metrics: { occupied_ratio: 0.5, overlaps: [] },
        checks: {
          block_content_fit_ok: true,
          speaker_fit_ok: true,
        },
      }],
      checks: {},
      metrics: {},
    }),
    safeArray: (value) => Array.isArray(value) ? value : [],
    safeText: (value, fallback = '') => value == null || value === '' ? fallback : String(value),
    screenshotReviewOutputContract: () => ({}),
    stageArtifactPath: () => path.join(workspaceRoot, 'baseline-screenshot-review.json'),
    stripHtml: (value) => String(value || '').replace(/<[^>]+>/g, ''),
    summarizePlanSlides: () => [],
    syncCurrentCandidateHtmlFromStageArtifact: () => ['current.html'],
    writeText: (file, text) => writeFileSync(file, text),
  });
  return { reviewParts, workspaceRoot, contract, deliverablePaths };
}

test('xiaohongshu screenshot_review runs AI visual review and baseline comparison concurrently', async () => {
  const events = [];
  const { reviewParts, workspaceRoot, contract, deliverablePaths } = makeXhsReviewParts({ events });

  const artifact = await reviewParts.buildScreenshotReview(
    workspaceRoot,
    'topic-a',
    contract,
    deliverablePaths,
    'optimize_existing',
    'baseline-a',
    'test-adapter',
  );

  assert.equal(artifact.status, 'pass');
  assert.equal(artifact.baseline_review.baseline_comparison_passed, true);
  assert.equal(artifact.checks.baseline_comparison_passed, true);
  assert.deepEqual(events, ['ai:start', 'baseline:start', 'ai:end', 'baseline:end']);
});

function makePptStageParts({ baselineDelayMs = 80, aiDelayMs = 80, events }) {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-review-concurrency-'));
  const reportsDir = path.join(workspaceRoot, 'reports');
  mkdirSync(reportsDir, { recursive: true });
  const htmlFile = path.join(workspaceRoot, 'deck.html');
  const screenshotFile = path.join(reportsDir, 'screenshots', 'capture-a', 'slide-01.png');
  writeFileSync(htmlFile, '<html><body>ok</body></html>');
  mkdirSync(path.dirname(screenshotFile), { recursive: true });
  writeFileSync(screenshotFile, 'png');
  const exportHelper = pptExportHelperFixture(workspaceRoot);
  const reviewHelper = pptReviewHelperFixture(workspaceRoot);
  const deliverablePaths = {
    deliverableDir: workspaceRoot,
    reportsDir,
    deliverableId: 'deck-a',
  };
  const contract = {
    title: 'PPT 并发审阅测试',
    layout_rules: { max_primary_points_per_slide: 5 },
  };
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
    buildAiFirstVisualSlideReview: (slide, aiReview) => ({ ...slide, ai_review: aiReview }),
    buildAuthoringContext: () => ({}),
    buildDeckHtml: () => '<html></html>',
    chunkArray: (items, size) => {
      const chunks = [];
      for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
      return chunks;
    },
    collectSlidesNeedingTargetedRevision: () => [],
    compareFailuresAndDensity: async () => {
      events.push('baseline:start');
      await delay(baselineDelayMs);
      events.push('baseline:end');
      return { verdict: 'not_degraded' };
    },
    createReviewCapturePaths: () => ({
      captureId: 'capture-a',
      screenshotsDir: path.join(reportsDir, 'screenshots', 'capture-a'),
      reviewMarkdownFile: path.join(reportsDir, 'screenshots', 'capture-a', 'review.md'),
    }),
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
        events.push('ai:start');
        await delay(aiDelayMs);
        events.push('ai:end');
        return {
          data: {
            slide_reviews: [{
              slide_id: 'S01',
              judgement: 'pass',
              visual_findings: [],
              recommended_fix: '',
            }],
          },
          generationRuntime: { provider: 'test' },
        };
      }
      if (context?.review_scope === 'summary') {
        return {
          data: {
            director_intent_landed: true,
            anti_template_ok: true,
            weak_pages: [],
            review_summary: 'ai ok',
          },
          generationRuntime: { provider: 'test' },
        };
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
    normalizeStringList: (value) => Array.isArray(value) ? value : [],
    normalizeTypographyPlan: (value) => value,
    primarySurface: () => 'test-surface',
    readCurrentHtmlArtifact: () => ({
      html_bundle: {
        html_file: htmlFile,
        page_count: 1,
        slides: [{
          slide_id: 'S01',
          title: '第一页',
          content: '<section data-slide-root="true" data-slide-id="S01" data-title="第一页" data-layout-family="hero" data-speaker-seconds="30" data-recipe-id="ppt.test" data-template-id="upstream_ai_html" data-peak-page="false" data-director-role="hero"><div data-qa-block="title" data-primary-point="true">第一页</div><div data-qa-block="body">ok</div></section>',
          content_html: '<section>ok</section>',
          evidence_and_sources: [{ public_label: '公开资料' }],
        }],
      },
    }),
    readJson: () => ({}),
    readPromptPackText: () => '',
    readStageArtifact: (_contract, _paths, stage) => {
      if (stage === 'visual_director_review') {
        return {
          visual_director_review: {
            director_intent_landed: true,
            anti_template_ok: true,
            memory_hook_present: true,
          },
        };
      }
      if (stage === 'slide_blueprint') {
        return { slide_blueprint: { slides: [{ slide_id: 'S01', title: '第一页', speaker_notes: '' }] } };
      }
      if (stage === 'storyline') return {};
      return {};
    },
    renderHtmlOutputContract: () => ({}),
    renderHtmlSummaryOutputContract: () => ({}),
    requireText: (value) => String(value || ''),
    resolvePromptPackAsset: () => '',
    resolveRedCubePythonCommand: () => ({ command: 'node' }),
    safeArray: (value) => Array.isArray(value) ? value : [],
    safeFileMtimeMs: (file) => String(file || '').endsWith('render_html.json') ? 1 : 0,
    safeText: (value, fallback = '') => value == null || value === '' ? fallback : String(value),
    screenshotReviewSlideBatchOutputContract: () => ({}),
    screenshotReviewSummaryOutputContract: () => ({}),
    seedDeliverableStableViews: () => [],
    stageArtifactPath: (_contract, _paths, stageId) => path.join(workspaceRoot, `${stageId}.json`),
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
  return { stageParts, workspaceRoot, contract };
}

test('ppt screenshot_review runs AI visual review and baseline comparison concurrently', async () => {
  const events = [];
  const { stageParts, workspaceRoot, contract } = makePptStageParts({ events });
  const previousPythonCommand = process.env.REDCUBE_PYTHON_COMMAND;
  process.env.REDCUBE_PYTHON_COMMAND = testPythonCommandEnv();

  let artifact;
  try {
    artifact = await stageParts.buildScreenshotReviewArtifact({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      contract,
      mode: 'optimize_existing',
      baselineDeliverableId: 'baseline-a',
      adapter: 'test-adapter',
    });
  } finally {
    if (previousPythonCommand === undefined) {
      delete process.env.REDCUBE_PYTHON_COMMAND;
    } else {
      process.env.REDCUBE_PYTHON_COMMAND = previousPythonCommand;
    }
  }

  assert.equal(artifact.status, 'pass');
  assert.equal(artifact.baseline_review.relative_quality.verdict, 'not_degraded');
  assert.deepEqual(events, ['ai:start', 'baseline:start', 'ai:end', 'baseline:end']);
});
