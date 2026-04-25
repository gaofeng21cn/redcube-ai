import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';

import { createPptDeckStageParts } from '../packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/stages.js';

function makeSlide(slideNo) {
  const slideId = `S${String(slideNo).padStart(2, '0')}`;
  return {
    slide_id: slideId,
    slide_no: slideNo,
    page_type: 'body',
    title: `第 ${slideNo} 页`,
    page_goal: `说明第 ${slideNo} 页`,
    core_sentence: `第 ${slideNo} 页核心句`,
    page_core_content: [{ label: '要点', text: `第 ${slideNo} 页正文` }],
    evidence_and_sources: [{ public_label: '公开资料' }],
    speaker_seconds: 30,
    transition_sentence: '继续',
    render_recipe_id: 'ppt.test',
    visual_presentation: {
      layout_family: 'test_layout',
      anchor_tracks: ['主体', '证据'],
    },
  };
}

function makePptRenderParts({ stageCalls }) {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-render-batch-'));
  const deliverableDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', 'deck-a');
  const reportsDir = path.join(deliverableDir, 'reports');
  mkdirSync(reportsDir, { recursive: true });
  const deliverablePaths = { deliverableDir, reportsDir, deliverableId: 'deck-a' };
  const slides = Array.from({ length: 6 }, (_, index) => makeSlide(index + 1));
  const contract = {
    title: '批量生成测试',
    profile_id: 'lecture_peer',
    prompt_pack: { render_contract: {} },
    lifecycle_model: { route_to_stage: { render_html: 'visual_authorship' } },
  };
  const deps = {
    CANVAS: { ratio: '16:9', width: 1152, height: 648 },
    CODEX_DEFAULT_ADAPTER: 'codex_cli',
    CREATIVE_MATERIALIZED_FROM: 'codex_cli_json_output',
    PAGE_FIX_ROUTE: 'fix_html',
    PROMPT_PACK: { render_html: 'render-html.md', screenshot_review: 'screenshot-review.md' },
    PYTHON_EXPORT: '/tmp/export.py',
    PYTHON_REVIEW: '/tmp/review.py',
    RENDER_HTML_BATCH_SIZE: 2,
    RENDER_REFERENCE_SLIDE_WINDOW: 2,
    SCREENSHOT_REVIEW_BATCH_SIZE: 2,
    TARGETED_RENDER_HTML_BATCH_SIZE: 1,
    aiFirstMechanicalCheckValue: () => true,
    attachCommon: (route, activeContract, generationRuntime) => ({
      route,
      overlay: activeContract.overlay,
      produced_at: '2026-04-24T00:00:00.000Z',
      execution_model: generationRuntime?.execution_model || {},
    }),
    buildAiFirstVisualSlideReview: (slide, review) => ({ ...slide, ai_review: review }),
    buildAuthoringContext: () => ({ topic: 'batch-test' }),
    buildDeckHtml: ({ slidesMarkup }) => `<html><body>${slidesMarkup.map((slide) => slide.content).join('')}</body></html>`,
    chunkArray: (items, size) => {
      const chunks = [];
      for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
      return chunks;
    },
    collectSlidesNeedingTargetedRevision: () => [],
    compareFailuresAndDensity: async () => ({ verdict: 'not_degraded' }),
    createReviewCapturePaths: () => ({}),
    creativeExecution: (_route, generationRuntime) => ({ generation_runtime: generationRuntime }),
    creativeSourceStamp: (_input) => ({}),
    currentHtmlStageId: () => 'render_html',
    deriveProfileChecks: () => ({}),
    deriveScreenshotReviewRerunStage: () => 'render_html',
    directorReviewOutputContract: () => ({}),
    ensureDir: (dir) => {
      mkdirSync(dir, { recursive: true });
      return dir;
    },
    extraChecks: () => ({}),
    generateStructuredArtifact: async (input) => ({
      data: input.context?.render_scope === 'slide_batch'
        ? {
            slides: input.context.blueprint.slides.map((slide) => ({
              slide_id: slide.slide_id,
              content_html: `<section data-slide-root="true" data-slide-id="${slide.slide_id}"><div data-qa-block="title" data-primary-point="true">${slide.title}</div><div data-qa-block="body">正文</div></section>`,
            })),
          }
        : { render_summary: ['summary'] },
      generationRuntime: { owner: 'codex_cli', adapter_surface: 'single' },
      input,
    }),
    generateStructuredArtifactBatch: async () => {
      throw new Error('render_html should use durable per-batch execution');
    },
    getDeliverablePaths: () => deliverablePaths,
    getDeliverableViewSurfacePaths: () => ({
      draftHtmlFile: path.join(deliverableDir, 'draft.html'),
      draftSlidesFile: path.join(deliverableDir, 'draft-slides.json'),
      stableHtmlFile: path.join(deliverableDir, 'stable.html'),
      stableSlidesFile: path.join(deliverableDir, 'stable-slides.json'),
    }),
    getReviewState: () => ({}),
    hasAiVisualBlock: () => false,
    hydrateRenderedSlideRootMetadata: (html) => html,
    isBaselineApprovedState: () => true,
    loadOperatorRevisionBrief: () => null,
    normalizeInlineText: (value) => String(value || ''),
    normalizePptScreenshotAiSlideReviews: (value) => value,
    normalizeStringList: (value) => Array.isArray(value) ? value : [],
    normalizeTypographyPlan: (value) => value || {},
    primarySurface: () => 'codex_native_host_agent',
    readCurrentHtmlArtifact: () => null,
    readJson: () => ({}),
    readPromptPackText: () => '<html><body>{{slides}}</body></html>',
    readStageArtifact: (_contract, _paths, stageId) => {
      if (stageId === 'slide_blueprint') return { slide_blueprint: { slides } };
      if (stageId === 'detailed_outline') return {
        detailed_outline: {
          slides: slides.map((slide) => ({
            slide_id: slide.slide_id,
            chapter_id: Number(slide.slide_no) <= 3 ? 'C1' : 'C2',
          })),
        },
      };
      if (stageId === 'visual_direction') return { visual_direction: { typography_plan: {}, peak_pages: [], page_role_table: [] } };
      return null;
    },
    renderHtmlOutputContract: () => ({ required: ['slides'] }),
    renderHtmlSummaryOutputContract: () => ({ required: ['render_summary'] }),
    requireText: (value, label) => {
      if (!value) throw new Error(`Missing ${label}`);
      return String(value);
    },
    resolvePromptPackAsset: (_contract, file) => file,
    resolveRedCubePythonCommand: () => ({ command: 'python3' }),
    safeArray: (value) => Array.isArray(value) ? value : [],
    safeFileMtimeMs: () => 0,
    safeText: (value, fallback = '') => value == null || value === '' ? fallback : String(value),
    screenshotReviewSlideBatchOutputContract: () => ({}),
    screenshotReviewSummaryOutputContract: () => ({}),
    seedDeliverableStableViews: () => ['stable.html'],
    stageArtifactPath: (_contract, _paths, stageId) => path.join(deliverableDir, `${stageId}.json`),
    summarizeBlueprintSlides: (artifact) => artifact?.slide_blueprint?.slides || [],
    summarizeRelativeQuality: () => ({}),
    validateRenderedReviewAnchors: (html) => html,
    validateRenderedSlideContent: (html) => html,
    writeJson: (file, data) => {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, JSON.stringify(data, null, 2));
    },
    writeText: (file, text) => {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, text);
    },
  };
  const originalGenerateStructuredArtifact = deps.generateStructuredArtifact;
  deps.generateStructuredArtifact = async (input) => {
    if (input.context?.render_scope === 'slide_batch') {
      stageCalls.push(input);
    }
    return originalGenerateStructuredArtifact(input);
  };
  return { stageParts: createPptDeckStageParts(deps), workspaceRoot, contract, deliverablePaths };
}

test('ppt render_html batches same-route slide chunks through durable per-batch artifacts', async () => {
  const stageCalls = [];
  const { stageParts, workspaceRoot, contract, deliverablePaths } = makePptRenderParts({ stageCalls });

  const artifact = await stageParts.buildRenderHtmlArtifact({
    workspaceRoot,
    deliverableId: 'deck-a',
    contract,
    deliverablePaths,
    route: 'render_html',
    adapter: 'codex_cli',
  });

  assert.deepEqual(stageCalls.map((stage) => stage.context.render_batch.batch_index), [1, 2, 3, 4]);
  assert.deepEqual(stageCalls.map((stage) => stage.context.render_batch.batch_mode), [
    'section_batch',
    'section_batch',
    'section_batch',
    'section_batch',
  ]);
  assert.deepEqual(stageCalls.map((stage) => stage.context.render_batch.chapter_id), ['C1', 'C1', 'C2', 'C2']);
  assert.deepEqual(stageCalls.map((stage) => stage.context.render_batch.slide_ids.join(',')), [
    'S01,S02',
    'S03',
    'S04,S05',
    'S06',
  ]);
  assert.deepEqual(stageCalls.map((stage) => stage.context.render_batch.batch_index).map((index) => `render_html_batch_${index}`), [
    'render_html_batch_1',
    'render_html_batch_2',
    'render_html_batch_3',
    'render_html_batch_4',
  ]);
  assert.deepEqual(stageCalls[1].context.reference_slides.map((slide) => slide.slide_id), ['S01', 'S02']);
  assert.equal(existsSync(path.join(deliverablePaths.deliverableDir, 'artifacts', 'render_batches', 'render_html', 'render_html_batch_1.json')), true);
  assert.equal(existsSync(path.join(deliverablePaths.deliverableDir, 'artifacts', 'render_batches', 'render_html', 'render_html_batch_1', 'S01.html')), true);
  assert.equal(artifact.render_execution.batch_count, 4);
  assert.equal(artifact.render_execution.codex_batch_runtime.durable_cache.generated_batch_count, 4);
  assert.equal(artifact.render_execution.codex_batch_runtime.durable_cache.reused_batch_count, 0);
  assert.equal(artifact.render_execution.codex_batch_runtime.session_pool.reuse_status, 'durable_render_batch_cache');
  assert.equal(artifact.html_bundle.page_count, 6);
});
