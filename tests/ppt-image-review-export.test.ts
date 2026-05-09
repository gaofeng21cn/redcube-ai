// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import { createPptDeckStageParts } from '../packages/redcube-runtime-family-ppt/dist/ppt-deck-runtime-family-parts/stages.js';

const PNG_16_9 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAABIAAAAKIAQAAAAAyaZf6AAAADElEQVR42u3BMQEAAADCoPVPbQo/oAAAAAAA4G0CxwAAATXs5kEAAAAASUVORK5CYII=',
  'base64',
);

const safeArray = (value) => Array.isArray(value) ? value : [];
const safeText = (value, fallback = '') => value == null || value === '' ? fallback : String(value);

function writeJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function makeFixture({ missingManifest = false, promptManifestPatch = {}, styleManifestPatch = {} } = {}) {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-image-pages-'));
  const deliverableId = 'deck-image';
  const deliverableDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', deliverableId);
  const artifactsDir = path.join(deliverableDir, 'artifacts');
  const reportsDir = path.join(deliverableDir, 'reports');
  const imageDir = path.join(artifactsDir, 'image-pages');
  mkdirSync(imageDir, { recursive: true });
  mkdirSync(reportsDir, { recursive: true });

  const pngFile = path.join(imageDir, 'slide-01.png');
  const promptManifestFile = path.join(imageDir, 'prompt-manifest.json');
  const styleManifestFile = path.join(imageDir, 'style-manifest.json');
  const exportScript = path.join(workspaceRoot, 'export-helper.py');
  writeFileSync(pngFile, Buffer.concat([PNG_16_9, Buffer.alloc(2000, 1)]));
  if (!missingManifest) {
    writeJson(promptManifestFile, {
      prompts: [{ slide_id: 'S01', prompt: 'audience-facing image prompt' }],
      ...promptManifestPatch,
    });
    writeJson(styleManifestFile, {
      palette: ['#111111', '#f3f4f6'],
      visual_style: 'editorial',
      ...styleManifestPatch,
    });
  }
  writeFileSync(exportScript, [
    'import json',
    'import os',
    'import sys',
    "pptx = sys.argv[sys.argv.index('--output-pptx') + 1]",
    "pdf = sys.argv[sys.argv.index('--output-pdf') + 1]",
    'os.makedirs(os.path.dirname(pptx), exist_ok=True)',
    "open(pptx, 'w', encoding='utf-8').write('full-page-image-pptx')",
    "open(pdf, 'w', encoding='utf-8').write('full-page-image-pdf')",
    "print(json.dumps({'page_count': 1, 'pptx_file': pptx, 'pdf_file': pdf}))",
    '',
  ].join('\n'));

  const contract = {
    title: 'Image first deck',
    deliverable_id: deliverableId,
    layout_rules: { max_primary_points_per_slide: 5 },
  };
  const deliverablePaths = { deliverableDir, artifactsDir, reportsDir, deliverableId };
  const imageArtifact = {
    route: 'author_image_pages',
    status: 'completed',
    image_pages_bundle: {
      source_visual_route: 'author_image_pages',
      page_count: 1,
      prompt_manifest_file: promptManifestFile,
      style_manifest_file: styleManifestFile,
      pages: [{
        slide_id: 'S01',
        title: '第一页',
        layout_family: 'cover_signal',
        png_file: pngFile,
        prompt_manifest_file: missingManifest ? path.join(imageDir, 'missing-prompt.json') : promptManifestFile,
        style_manifest_file: missingManifest ? path.join(imageDir, 'missing-style.json') : styleManifestFile,
      }],
    },
  };
  const artifacts = new Map([
    ['author_image_pages', imageArtifact],
    ['slide_blueprint', { slide_blueprint: { slides: [{ slide_id: 'S01', title: '第一页', speaker_notes: 'notes' }] } }],
    ['visual_direction', { visual_direction: { peak_pages: ['S01'], page_role_table: [] } }],
    ['storyline', {}],
  ]);
  const stageArtifactPath = (_contract, _paths, stage) => path.join(artifactsDir, `${stage}.json`);

  const stageParts = createPptDeckStageParts({
    CANVAS: { width: 1152, height: 648 },
    CODEX_DEFAULT_ADAPTER: 'test-adapter',
    CREATIVE_MATERIALIZED_FROM: 'test',
    PAGE_FIX_ROUTE: 'fix_html',
    PROMPT_PACK: { visual_director_review: 'director.md', screenshot_review: 'screenshot.md', export_pptx: 'export.md' },
    PYTHON_EXPORT: exportScript,
    PYTHON_NATIVE: '/tmp/native.py',
    PYTHON_REVIEW: '/tmp/review.py',
    RENDER_HTML_BATCH_SIZE: 1,
    RENDER_REFERENCE_SLIDE_WINDOW: 1,
    SCREENSHOT_REVIEW_BATCH_SIZE: 1,
    TARGETED_RENDER_HTML_BATCH_SIZE: 1,
    aiFirstMechanicalCheckValue: (slides, check) => slides.every((slide) => slide.checks?.[check] !== false),
    attachCommon: (route) => ({ route, overlay: 'ppt_deck', profile_id: 'test', produced_at: 'now', prompt_pack: {}, execution_model: {} }),
    buildAiFirstVisualSlideReview: (slide, aiReview) => ({ ...slide, status: aiReview?.judgement === 'block' ? 'block' : slide.status, ai_review: aiReview }),
    buildAuthoringContext: () => ({}),
    buildDeckHtml: () => '<html></html>',
    chunkArray: (items) => [items],
    collectSlidesNeedingTargetedRevision: (slides) => slides.filter((slide) => slide.status === 'block'),
    compareFailuresAndDensity: () => ({ verdict: 'not_degraded' }),
    createReviewCapturePaths: () => ({
      captureId: 'capture-image',
      screenshotsDir: path.join(reportsDir, 'screenshots', 'capture-image'),
      reviewMarkdownFile: path.join(reportsDir, 'screenshots', 'capture-image', 'review.md'),
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
    existsSync,
    extraChecks: () => ({}),
    generateStructuredArtifact: async ({ context }) => {
      if (context?.route === 'visual_director_review' || context?.source_surface_kind === 'image_pages') {
        return { data: { director_intent_landed: true, anti_template_ok: true, peak_pages_landed: true, memory_hook_present: true, weak_pages: [], homogeneous_layout_risk: 0.1, review_summary: 'image manifest reviewed', rewrite_action: 'none' }, generationRuntime: { provider: 'test' } };
      }
      if (context?.review_scope === 'slide_batch') {
        return { data: { slide_reviews: [{ slide_id: 'S01', judgement: 'pass', visual_findings: [], recommended_fix: '' }] }, generationRuntime: { provider: 'test' } };
      }
      if (context?.review_scope === 'summary') {
        return { data: { director_intent_landed: true, anti_template_ok: true, weak_pages: [], review_summary: 'image screenshots ok' }, generationRuntime: { provider: 'test' } };
      }
      return { data: {}, generationRuntime: { provider: 'test' } };
    },
    getDeliverablePaths: () => deliverablePaths,
    getDeliverableViewSurfacePaths: () => ({ stableHtmlFile: path.join(deliverableDir, 'views', 'deck-image.html') }),
    getReviewState: () => ({ state: {} }),
    hasAiVisualBlock: (review) => review?.judgement === 'block',
    hydrateRenderedSlideRootMetadata: (slide) => slide,
    isBaselineApprovedState: () => true,
    loadOperatorRevisionBrief: () => null,
    normalizeInlineText: (value) => String(value || '').slice(0, 1200),
    normalizePptScreenshotAiSlideReviews: (value) => safeArray(value),
    normalizeStringList: (value) => safeArray(value),
    normalizeTypographyPlan: (value) => value,
    primarySurface: () => 'test-surface',
    readCurrentHtmlArtifact: () => null,
    readJson,
    readPromptPackText: () => '',
    readStageArtifact: (_contract, _paths, stage) => artifacts.get(stage) || null,
    renderHtmlOutputContract: () => ({}),
    renderHtmlSummaryOutputContract: () => ({}),
    requireText: (value) => safeText(value, 'ok'),
    resolvePromptPackAsset: () => '',
    safeArray,
    safeFileMtimeMs: (file) => {
      const stage = path.basename(file, '.json');
      return artifacts.has(stage) ? (stage.includes('image_pages') ? 2 : 1) : 0;
    },
    safeText,
    screenshotReviewSlideBatchOutputContract: () => ({}),
    screenshotReviewSummaryOutputContract: () => ({}),
    seedDeliverableStableViews: () => [],
    stageArtifactPath,
    summarizeBlueprintSlides: () => [{ slide_id: 'S01', title: '第一页', layout_family: 'cover_signal' }],
    summarizeRelativeQuality: () => 'ok',
    validateRenderedReviewAnchors: () => [],
    validateRenderedSlideContent: () => [],
    writeJson,
    writeText: (file, value) => {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, String(value), 'utf-8');
    },
  });

  return { workspaceRoot, contract, deliverablePaths, stageParts, artifacts, pngFile, promptManifestFile, styleManifestFile };
}

test('ppt image-first route reviews PNG pages and exports non-editable full-page image PPTX', async () => {
  const fixture = makeFixture();

  const director = await fixture.stageParts.buildDirectorReview(fixture.contract, fixture.deliverablePaths, 'test-adapter');
  assert.equal(director.status, 'pass');
  assert.equal(director.visual_director_review.deterministic_preflight.findings.length, 0);
  fixture.artifacts.set('visual_director_review', director);

  const screenshot = await fixture.stageParts.buildScreenshotReviewArtifact({
    workspaceRoot: fixture.workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-image',
    contract: fixture.contract,
    mode: 'draft_new',
  });
  assert.equal(screenshot.status, 'pass');
  assert.equal(screenshot.review_capture.source_visual_route, 'author_image_pages');
  assert.equal(screenshot.mechanical_review.python_helper_invocation, null);
  assert.equal(screenshot.mechanical_review.metrics.source_surface_kind, 'image_pages');
  assert.equal(screenshot.slide_reviews[0].metrics.image_width, 1152);
  assert.equal(screenshot.slide_reviews[0].metrics.image_height, 648);
  fixture.artifacts.set('screenshot_review', screenshot);

  const exported = fixture.stageParts.buildExportArtifact({
    workspaceRoot: fixture.workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-image',
    contract: fixture.contract,
  });
  assert.equal(exported.export_bundle.source_visual_route, 'author_image_pages');
  assert.equal(exported.export_bundle.editable, false);
  assert.equal(exported.export_bundle.page_count_match, true);
  assert.equal(exported.export_bundle.source_html, '');
  assert.equal(existsSync(exported.export_bundle.pptx_file), true);
  assert.equal(existsSync(exported.export_bundle.pdf_file), true);
  assert.equal(exported.export_bundle.artifact_gallery.editable, false);
  const gallery = readJson(exported.export_bundle.artifact_gallery.index_file);
  assert.equal(gallery.source_visual_route, 'author_image_pages');
  assert.equal(gallery.editable, false);
  assert.deepEqual(gallery.artifacts.source.png_files, [fixture.pngFile]);
  assert.deepEqual(gallery.artifacts.source.prompt_manifest_files, [fixture.promptManifestFile]);
  assert.deepEqual(gallery.artifacts.source.style_manifest_files, [fixture.styleManifestFile]);
});

test('ppt image-first screenshot review fails closed when PNG manifest refs are missing', async () => {
  const fixture = makeFixture({ missingManifest: true });
  const director = await fixture.stageParts.buildDirectorReview(fixture.contract, fixture.deliverablePaths, 'test-adapter');
  fixture.artifacts.set('visual_director_review', { ...director, status: 'pass' });

  const screenshot = await fixture.stageParts.buildScreenshotReviewArtifact({
    workspaceRoot: fixture.workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-image',
    contract: fixture.contract,
    mode: 'draft_new',
  });
  assert.equal(screenshot.status, 'block');
  assert.equal(screenshot.review_state_patch.rerun_from_stage, 'repair_image_pages');
  assert.equal(screenshot.checks.block_content_fit_ok, false);
  assert.equal(screenshot.slide_reviews[0].issues.includes('image_page_manifest_missing'), true);
});

test('ppt image-first screenshot review fails closed on operator language and layout legibility policy leaks', async () => {
  const fixture = makeFixture({
    promptManifestPatch: {
      visible_text_audit: {
        text_fragments: ['项目数据资产与论文布局建议', '汇报讨论用途', '本次汇报边界'],
      },
      layout_quality: {
        title_safe_zone_clear: false,
        table_min_font_pt: 9,
        card_blank_ratio: 0.52,
      },
    },
  });
  const director = await fixture.stageParts.buildDirectorReview(fixture.contract, fixture.deliverablePaths, 'test-adapter');
  fixture.artifacts.set('visual_director_review', { ...director, status: 'pass' });

  const screenshot = await fixture.stageParts.buildScreenshotReviewArtifact({
    workspaceRoot: fixture.workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-image',
    contract: fixture.contract,
    mode: 'draft_new',
  });

  assert.equal(screenshot.status, 'block');
  assert.equal(screenshot.review_state_patch.rerun_from_stage, 'repair_image_pages');
  assert.equal(screenshot.checks.external_audience_language_ok, false);
  assert.equal(screenshot.checks.title_safe_zone_clear, false);
  assert.equal(screenshot.checks.table_legibility_ok, false);
  assert.equal(screenshot.checks.layout_density_ok, false);
  assert.equal(screenshot.slide_reviews[0].issues.includes('operator_language_leak_detected'), true);
  assert.equal(screenshot.slide_reviews[0].issues.includes('title_safe_zone_obstructed'), true);
  assert.equal(screenshot.slide_reviews[0].issues.includes('table_font_below_minimum'), true);
  assert.equal(screenshot.slide_reviews[0].issues.includes('layout_density_too_sparse'), true);
  assert.equal(screenshot.slide_reviews[0].metrics.operator_language_fragments.includes('汇报讨论用途'), true);
  assert.equal(screenshot.slide_reviews[0].metrics.table_min_font_pt, 9);
  assert.equal(screenshot.slide_reviews[0].metrics.card_blank_ratio, 0.52);
});
