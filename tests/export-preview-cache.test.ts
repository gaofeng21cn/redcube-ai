// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import { createPptDeckStageParts } from '../packages/redcube-runtime-family-ppt/dist/ppt-deck-runtime-family-parts/stages.js';
import { createXiaohongshuDeliveryParts } from '../packages/redcube-runtime-family-xiaohongshu/dist/xiaohongshu-runtime-family-parts/delivery.js';

const safeArray = (value) => Array.isArray(value) ? value : [];
const safeText = (value, fallback = '') => value == null || value === '' ? fallback : String(value);

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function writeJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
}

function readCount(file) {
  return existsSync(file) ? Number(readFileSync(file, 'utf-8')) : 0;
}

function makePptExportParts() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-export-preview-cache-'));
  const deliverableId = 'deck-a';
  const deliverableDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', deliverableId);
  const reportsDir = path.join(deliverableDir, 'reports');
  const artifactsDir = path.join(deliverableDir, 'artifacts');
  const viewsDir = path.join(deliverableDir, 'views');
  const screenshotsDir = path.join(reportsDir, 'screenshots', 'capture-a');
  mkdirSync(screenshotsDir, { recursive: true });
  mkdirSync(artifactsDir, { recursive: true });
  mkdirSync(viewsDir, { recursive: true });

  const stableHtmlFile = path.join(viewsDir, 'deck-a.html');
  const screenshotFile = path.join(screenshotsDir, 'slide-01.png');
  const exportScript = path.join(workspaceRoot, 'export-helper.py');
  const callCountFile = path.join(workspaceRoot, 'export-count.txt');
  writeFileSync(stableHtmlFile, '<html><body><section data-slide-id="S01">stable reviewed html</section></body></html>');
  writeFileSync(screenshotFile, 'png');
  writeFileSync(exportScript, [
    'import json',
    'import os',
    'import sys',
    `count_file = ${JSON.stringify(callCountFile)}`,
    "count = int(open(count_file, encoding='utf-8').read()) if os.path.exists(count_file) else 0",
    "open(count_file, 'w', encoding='utf-8').write(str(count + 1))",
    "pptx = sys.argv[sys.argv.index('--output-pptx') + 1]",
    "pdf = sys.argv[sys.argv.index('--output-pdf') + 1]",
    "open(pptx, 'w', encoding='utf-8').write('pptx')",
    "open(pdf, 'w', encoding='utf-8').write('pdf')",
    "print(json.dumps({'status': 'completed', 'page_count': 1, 'pptx_file': pptx, 'pdf_file': pdf, 'metrics': {'page_count': 1, 'preview_pages': 1}}))",
    '',
  ].join('\n'));

  const contract = { title: 'PPT cache', layout_rules: { max_primary_points_per_slide: 5 } };
  const deliverablePaths = { deliverableDir, reportsDir, deliverableId };
  const artifacts = new Map([
    ['screenshot_review', {
      status: 'pass',
      review_capture: { screenshots_dir: screenshotsDir, capture_id: 'capture-a' },
      slide_reviews: [{ slide_id: 'S01', screenshot_file: screenshotFile, metrics: { occupied_ratio: 0.42 } }],
      checks: { ai_review_passed: true },
      metrics: { page_count: 1 },
    }],
    ['slide_blueprint', { slide_blueprint: { slides: [{ slide_id: 'S01', title: '第一页', speaker_notes: 'notes' }] } }],
  ]);

  const stageParts = createPptDeckStageParts({
    CANVAS: { width: 1152, height: 648 },
    CODEX_DEFAULT_ADAPTER: 'test-adapter',
    CREATIVE_MATERIALIZED_FROM: 'test',
    PAGE_FIX_ROUTE: 'fix_html',
    PROMPT_PACK: { export_pptx: 'export_pptx.md' },
    PYTHON_EXPORT: exportScript,
    PYTHON_REVIEW: '/tmp/review.py',
    RENDER_HTML_BATCH_SIZE: 1,
    RENDER_REFERENCE_SLIDE_WINDOW: 1,
    SCREENSHOT_REVIEW_BATCH_SIZE: 1,
    TARGETED_RENDER_HTML_BATCH_SIZE: 1,
    aiFirstMechanicalCheckValue: () => true,
    attachCommon: (stage) => ({ stage }),
    buildAiFirstVisualSlideReview: (slide) => slide,
    buildAuthoringContext: () => ({}),
    buildDeckHtml: () => '<html></html>',
    chunkArray: (items) => [items],
    collectSlidesNeedingTargetedRevision: () => [],
    compareFailuresAndDensity: () => ({ verdict: 'not_degraded' }),
    createReviewCapturePaths: () => ({}),
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
    generateStructuredArtifact: async () => ({ data: {}, generationRuntime: {} }),
    getDeliverablePaths: () => deliverablePaths,
    getDeliverableViewSurfacePaths: () => ({ stableHtmlFile }),
    getReviewState: () => ({}),
    hasAiVisualBlock: () => false,
    hydrateRenderedSlideRootMetadata: (slide) => slide,
    isBaselineApprovedState: () => true,
    loadOperatorRevisionBrief: () => null,
    normalizeInlineText: (value) => String(value || ''),
    normalizePptScreenshotAiSlideReviews: (value) => value,
    normalizeStringList: (value) => safeArray(value),
    normalizeTypographyPlan: (value) => value,
    primarySurface: () => 'test-surface',
    readCurrentHtmlArtifact: () => ({ html_bundle: { html_file: stableHtmlFile, page_count: 1, slides: [{ slide_id: 'S01', title: '第一页', content_html: '<section>stable reviewed html</section>' }] } }),
    readJson: () => ({}),
    readPromptPackText: () => '',
    readStageArtifact: (_contract, _paths, stage) => artifacts.get(stage) || null,
    renderHtmlOutputContract: () => ({}),
    renderHtmlSummaryOutputContract: () => ({}),
    requireText: (value) => safeText(value, 'ok'),
    resolvePromptPackAsset: () => '',
    resolveRedCubePythonCommand: () => ({ command: process.execPath }),
    safeArray,
    safeFileMtimeMs: () => 1,
    safeText,
    screenshotReviewSlideBatchOutputContract: () => ({}),
    screenshotReviewSummaryOutputContract: () => ({}),
    seedDeliverableStableViews: () => [],
    stageArtifactPath: (_contract, _paths, stage) => path.join(artifactsDir, `${stage}.json`),
    summarizeBlueprintSlides: () => [],
    summarizeRelativeQuality: () => ({}),
    validateRenderedReviewAnchors: () => {},
    validateRenderedSlideContent: () => {},
    writeJson,
    writeText: (file, value) => {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, value, 'utf-8');
    },
  });

  return { workspaceRoot, contract, stageParts, callCountFile, artifacts };
}

test('ppt export_pptx reuses deterministic preview metrics when reviewed stable HTML is unchanged', () => {
  const { workspaceRoot, contract, stageParts, callCountFile, artifacts } = makePptExportParts();
  const first = stageParts.buildExportArtifact({ workspaceRoot, topicId: 'topic-a', deliverableId: 'deck-a', contract });
  artifacts.set('export_pptx', first);
  const second = stageParts.buildExportArtifact({ workspaceRoot, topicId: 'topic-a', deliverableId: 'deck-a', contract });

  assert.equal(readCount(callCountFile), 1);
  assert.equal(first.export_bundle.preview_cache.cache_status, 'miss');
  assert.equal(second.export_bundle.preview_cache.cache_status, 'hit');
  assert.equal(second.export_bundle.preview_cache.hash, first.export_bundle.preview_cache.hash);
  assert.equal(second.export_bundle.page_count_match, true);
  assert.equal(second.review_state_patch.latest_review_stage, 'export_pptx');
  assert.ok(second.export_bundle.pptx_file.endsWith('deck-a.pptx'));
});

function makeXhsDeliveryParts() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-export-preview-cache-'));
  const deliverableId = 'note-a';
  const deliverableDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', deliverableId);
  const reportsDir = path.join(deliverableDir, 'reports');
  const artifactsDir = path.join(deliverableDir, 'artifacts');
  const viewsDir = path.join(deliverableDir, 'views');
  const screenshotsDir = path.join(reportsDir, 'screenshots');
  mkdirSync(screenshotsDir, { recursive: true });
  mkdirSync(artifactsDir, { recursive: true });
  mkdirSync(viewsDir, { recursive: true });

  const stableHtmlFile = path.join(viewsDir, 'note-a.html');
  const screenshotFile = path.join(screenshotsDir, 'page-01.png');
  const captionFile = path.join(artifactsDir, 'caption.md');
  writeFileSync(stableHtmlFile, '<html><body><article data-page-id="P01">stable note</article></body></html>');
  writeFileSync(screenshotFile, 'png');
  writeFileSync(captionFile, 'caption');

  const contract = { title: 'XHS cache' };
  const deliverablePaths = { deliverableDir, reportsDir, deliverableId };
  const artifacts = new Map([
    ['screenshot_review', {
      status: 'pass',
      slide_reviews: [{ slide_id: 'P01', screenshot_file: screenshotFile, metrics: { occupied_ratio: 0.5 } }],
      checks: { ai_review_passed: true },
      metrics: { page_count: 1 },
    }],
    ['publish_copy', { publish_copy: { caption_file: captionFile, author_signature: 'RedCube' } }],
  ]);

  const deliveryParts = createXiaohongshuDeliveryParts({
    CODEX_DEFAULT_ADAPTER: 'test-adapter',
    PROMPT_PACK: { publish_copy: 'publish_copy.md' },
    attachCommon: (stage) => ({ stage }),
    buildAuthoringContext: () => ({}),
    buildPublishBundleReadme: ({ deliveryState }) => `state:${deliveryState.current}`,
    copySurfaceFile: (source, target) => {
      if (!source || !existsSync(source)) return null;
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, readFileSync(source));
      return target;
    },
    creativeExecution: () => ({}),
    creativeSourceStamp: () => ({}),
    ensureDir: (dir) => {
      mkdirSync(dir, { recursive: true });
      return dir;
    },
    generateStructuredArtifact: async () => ({ data: {}, generationRuntime: {} }),
    getDeliverablePublishSurfacePaths: (paths) => ({
      publishDir: path.join(paths.deliverableDir, 'publish'),
      publishScreenshotsDir: path.join(paths.deliverableDir, 'publish', 'screenshots'),
      publishHtmlFile: path.join(paths.deliverableDir, 'publish', 'index.html'),
      publishCaptionFile: path.join(paths.deliverableDir, 'publish', 'caption.md'),
      publishManifestFile: path.join(paths.deliverableDir, 'publish', 'manifest.json'),
      publishReadmeFile: path.join(paths.deliverableDir, 'publish', 'README.md'),
    }),
    getDeliverableViewSurfacePaths: () => ({ stableHtmlFile }),
    isSeries: () => false,
    normalizeStringList: (value) => safeArray(value),
    primarySurface: () => 'test-surface',
    readStageArtifact: (_contract, _paths, stage) => artifacts.get(stage) || null,
    requireText: (value) => safeText(value, 'ok'),
    safeArray,
    safeText,
    writeJson,
    writeText: (file, value) => {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, value, 'utf-8');
    },
  });

  return { workspaceRoot, contract, deliverablePaths, deliveryParts, artifacts };
}

test('xiaohongshu export_bundle reuses deterministic preview metrics while preserving bundle records', () => {
  const { workspaceRoot, contract, deliverablePaths, deliveryParts, artifacts } = makeXhsDeliveryParts();
  const first = deliveryParts.buildExportBundle(workspaceRoot, 'topic-a', contract, deliverablePaths);
  artifacts.set('export_bundle', first);
  const second = deliveryParts.buildExportBundle(workspaceRoot, 'topic-a', contract, deliverablePaths);

  assert.equal(first.export_bundle.preview_cache.cache_status, 'miss');
  assert.equal(second.export_bundle.preview_cache.cache_status, 'hit');
  assert.equal(second.export_bundle.preview_cache.hash, first.export_bundle.preview_cache.hash);
  assert.deepEqual(second.export_bundle.preview_metrics, first.export_bundle.preview_metrics);
  assert.equal(readJson(second.export_bundle.publish_manifest_file).delivery_state.current, 'output_ready');
  assert.equal(second.review_state_patch.latest_review_stage, 'export_bundle');
  assert.ok(second.export_bundle.publish_html_file.endsWith('publish/index.html'));
});
