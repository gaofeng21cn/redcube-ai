// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import { createPptDeckStageParts } from '../packages/redcube-runtime/dist/families/ppt/ppt-deck-runtime-family-parts/stages.js';
import { createXiaohongshuDeliveryParts } from '../packages/redcube-runtime/dist/families/xiaohongshu/xiaohongshu-runtime-family-parts/delivery.js';
import { pptExportHelperFixture, pptReviewHelperFixture, testPythonCommandEnv } from './helpers/python-native-helper-fixtures.ts';

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
  const callCountFile = path.join(workspaceRoot, 'export-count.txt');
  writeFileSync(stableHtmlFile, '<html><body><section data-slide-id="S01">stable reviewed html</section></body></html>');
  writeFileSync(screenshotFile, 'png');
  const exportHelper = pptExportHelperFixture(workspaceRoot);
  const reviewHelper = pptReviewHelperFixture(workspaceRoot);

  const contract = { title: 'PPT cache', layout_rules: { max_primary_points_per_slide: 5 } };
  const deliverablePaths = { deliverableDir, reportsDir, deliverableId };
  const artifacts = new Map([
    ['screenshot_review', {
      status: 'pass',
      review_export_refs: ['rca-review-export:ppt_deck:screenshot_review:deck-a'],
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
    PYTHON_EXPORT: exportHelper,
    PYTHON_REVIEW: reviewHelper,
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
  const previousPythonCommand = process.env.REDCUBE_PYTHON_COMMAND;
  const previousCallCountFile = process.env.REDCUBE_MOCK_PYTHON_CALL_COUNT_FILE;
  process.env.REDCUBE_PYTHON_COMMAND = testPythonCommandEnv();
  const { workspaceRoot, contract, stageParts, callCountFile, artifacts } = makePptExportParts();
  process.env.REDCUBE_MOCK_PYTHON_CALL_COUNT_FILE = callCountFile;
  try {
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
    assert.deepEqual(first.export_bundle.visual_memory_proposal, {
      status: 'skip',
      skip_reason: 'no_screenshot_review_proposal',
      non_authority: true,
      non_blocking: true,
      proposal_candidate: null,
      terminal_binding: null,
      accept_reject_status: 'not_requested',
      accept_reject_receipt_refs: [],
    });
    assert.deepEqual(second.export_bundle.visual_memory_proposal, first.export_bundle.visual_memory_proposal);
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
});

test('ppt export_pptx preserves an existing visual-memory proposal candidate and only binds terminal refs', () => {
  const previousPythonCommand = process.env.REDCUBE_PYTHON_COMMAND;
  process.env.REDCUBE_PYTHON_COMMAND = testPythonCommandEnv();
  const { workspaceRoot, contract, stageParts, artifacts } = makePptExportParts();
  const proposalCandidate = {
    proposal_ref: 'rca-visual-memory-proposal-candidate:ppt_deck:screenshot_review:deck-a',
    deliverable_family: 'ppt_deck',
    source_stage: 'screenshot_review',
    reusable_pattern: 'Decision pages are clearer when the proof object precedes feature naming.',
    stage_scope: 'review_and_revision',
    applicability: 'future evidence-led decision decks',
    caveat: 'Do not turn this into a fixed layout recipe.',
    evidence_slide_ids: ['S01'],
    evidence_findings: ['S01 shows the decision path and proof object in one first-glance hierarchy.'],
    evidence_refs: ['rca-review-export:ppt_deck:screenshot_review:deck-a'],
  };
  artifacts.get('screenshot_review').visual_memory_proposal = {
    status: 'proposal_candidate',
    skip_reason: null,
    non_authority: true,
    non_blocking: true,
    proposal_candidate: proposalCandidate,
    accept_reject_status: 'pending_rca_memory_owner',
    accept_reject_receipt_refs: [],
  };

  try {
    const exported = stageParts.buildExportArtifact({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      contract,
    });
    const forwarded = exported.export_bundle.visual_memory_proposal;

    assert.equal(exported.status, 'completed');
    assert.equal(forwarded.status, 'proposal_candidate');
    assert.deepEqual(forwarded.proposal_candidate, proposalCandidate);
    assert.equal(forwarded.terminal_binding.review_export_refs.includes(
      'rca-review-export:ppt_deck:screenshot_review:deck-a',
    ), true);
    assert.equal(forwarded.terminal_binding.review_export_refs.includes(
      'rca-review-export:ppt_deck:export_pptx:deck-a',
    ), true);
    assert.equal(forwarded.terminal_binding.export_artifact_refs.includes(exported.export_bundle.pptx_file), true);
    assert.deepEqual(forwarded.accept_reject_receipt_refs, []);
    assert.equal(exported.owner_receipt_refs.includes(proposalCandidate.proposal_ref), false);
  } finally {
    if (previousPythonCommand === undefined) {
      delete process.env.REDCUBE_PYTHON_COMMAND;
    } else {
      process.env.REDCUBE_PYTHON_COMMAND = previousPythonCommand;
    }
  }
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
    ['render_html', { route: 'render_html', html_bundle: { html_file: stableHtmlFile, slides: [{ slide_id: 'P01', content: '<article>stable note</article>' }] } }],
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
    imagePagesList: () => [],
    isImagePagesArtifact: () => false,
    isSeries: () => false,
    normalizeStringList: (value) => safeArray(value),
    primarySurface: () => 'test-surface',
    readCurrentHtmlArtifact: () => artifacts.get('render_html'),
    readCurrentVisualArtifact: () => artifacts.get('render_html'),
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
