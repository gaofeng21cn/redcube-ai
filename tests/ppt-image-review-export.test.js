import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import { createPptDeckStageParts } from '../packages/redcube-runtime/dist/families/ppt/ppt-deck-runtime-family-parts/stages.js';
import { createPptDeckProfilePresetParts } from '../packages/redcube-runtime/dist/families/ppt/ppt-deck-runtime-family-parts/core-profile-presets.js';
import {
  pptExportHelperFixture,
  pptNativeHelperFixture,
  pptReviewHelperFixture,
  testPythonCommandEnv,
} from './helpers/python-native-helper-fixtures.js';

const PNG_16_9 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAABIAAAAKIAQAAAAAyaZf6AAAADElEQVR42u3BMQEAAADCoPVPbQo/oAAAAAAA4G0CxwAAATXs5kEAAAAASUVORK5CYII=',
  'base64',
);

const safeArray = (value) => Array.isArray(value) ? value : [];
const safeText = (value, fallback = '') => value == null || value === '' ? fallback : String(value);

function buildTestRenderReviewMachineGate(input = {}) {
  const slideReviews = safeArray(input?.slideReviews);
  const failedChecks = safeArray(input?.failedChecks).map((check) => safeText(check)).filter(Boolean);
  const blockedPageRefs = slideReviews
    .filter((slide) => safeText(slide?.status) === 'block' || safeArray(slide?.issues).length > 0)
    .map((slide) => safeText(slide?.slide_id))
    .filter(Boolean);
  return {
    gate_id: 'rca_render_review_machine_gate.v1',
    surface_kind: 'render_review_machine_gate_policy',
    owner: 'redcube_ai',
    source_surface_kind: safeText(input?.sourceSurfaceKind, 'rendered_visual_surface'),
    evidence_refs: {
      rendered_page_refs: safeArray(input?.renderedPageRefs).map((ref) => safeText(ref)).filter(Boolean),
      image_png_refs: safeArray(input?.imagePngRefs).map((ref) => safeText(ref)).filter(Boolean),
      page_manifest_ref: safeText(input?.pageManifestRef) || null,
      material_gap_refs: safeArray(input?.materialGapRefs).map((ref) => safeText(ref)).filter(Boolean),
      brand_gap_refs: safeArray(input?.brandGapRefs).map((ref) => safeText(ref)).filter(Boolean),
      typed_blocker_refs: safeArray(input?.typedBlockerRefs).map((ref) => safeText(ref)).filter(Boolean),
    },
    machine_check_output: {
      failed_checks: failedChecks,
      blocked_page_refs: blockedPageRefs,
      repair_target: failedChecks.length > 0 || blockedPageRefs.length > 0
        ? {
            rerun_from_stage: safeText(input?.rerunFromStage) || null,
            target_slide_ids: blockedPageRefs,
          }
        : null,
    },
    output_boundary: {
      grants_visual_ready: false,
      grants_exportable: false,
      grants_handoffable: false,
      writes_rca_visual_truth: false,
    },
  };
}

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
  const exportHelper = pptExportHelperFixture(workspaceRoot);
  const nativeHelper = pptNativeHelperFixture(workspaceRoot);
  const reviewHelper = pptReviewHelperFixture(workspaceRoot);

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
    PYTHON_EXPORT: exportHelper,
    PYTHON_NATIVE: nativeHelper,
    PYTHON_REVIEW: reviewHelper,
    RENDER_HTML_BATCH_SIZE: 1,
    RENDER_REFERENCE_SLIDE_WINDOW: 1,
    SCREENSHOT_REVIEW_BATCH_SIZE: 1,
    TARGETED_RENDER_HTML_BATCH_SIZE: 1,
    aiFirstMechanicalCheckValue: (slides, check) => slides.every((slide) => slide.checks?.[check] !== false),
    attachCommon: (route) => ({ route, overlay: 'ppt_deck', profile_id: 'test', produced_at: 'now', prompt_pack: {}, execution_model: {} }),
    buildAiFirstVisualSlideReview: (slide, aiReview) => ({ ...slide, status: aiReview?.judgement === 'block' ? 'block' : slide.status, ai_review: aiReview }),
    buildAuthoringContext: () => ({}),
    buildDeckHtml: () => '<html></html>',
    buildRenderReviewMachineGate: buildTestRenderReviewMachineGate,
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
  const previousPythonCommand = process.env.REDCUBE_PYTHON_COMMAND;
  process.env.REDCUBE_PYTHON_COMMAND = testPythonCommandEnv();
  const fixture = makeFixture();
  try {
    const director = await fixture.stageParts.buildDirectorReview(fixture.contract, fixture.deliverablePaths, 'test-adapter');
    assert.equal(director.status, 'pass');
    assert.deepEqual(director.owner_receipt_refs, [
      'rca-owner-receipt:review-export:ppt_deck:visual_director_review:deck-image',
    ]);
    assert.deepEqual(director.typed_blocker_refs, []);
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
    assert.deepEqual(screenshot.owner_receipt_refs, [
      'rca-owner-receipt:review-export:ppt_deck:screenshot_review:deck-image',
    ]);
    assert.deepEqual(screenshot.typed_blocker_refs, []);
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
    assert.deepEqual(exported.owner_receipt_refs, [
      'rca-owner-receipt:review-export:ppt_deck:export_pptx:deck-image',
    ]);
    assert.deepEqual(exported.typed_blocker_refs, []);
    assert.equal(exported.export_bundle.review_receipt_refs.includes(screenshot.owner_receipt_refs[0]), true);
    assert.equal(exported.review_export_refs.includes(exported.export_bundle.export_ref), true);
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
  } finally {
    if (previousPythonCommand === undefined) {
      delete process.env.REDCUBE_PYTHON_COMMAND;
    } else {
      process.env.REDCUBE_PYTHON_COMMAND = previousPythonCommand;
    }
  }
});

test('ppt image-first screenshot review records missing PNG manifest refs as non-blocking quality debt', async () => {
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
  assert.deepEqual(screenshot.owner_receipt_refs, [
    'rca-owner-receipt:review-export:ppt_deck:screenshot_review:deck-image',
  ]);
  assert.deepEqual(screenshot.typed_blocker_refs, []);
  assert.equal(screenshot.typed_blocker, null);
  assert.equal(screenshot.quality_debt.blocks_stage_transition, false);
  assert.equal(screenshot.review_state_patch.rerun_from_stage, 'repair_image_pages');
  assert.equal(screenshot.checks.block_content_fit_ok, false);
  assert.equal(screenshot.slide_reviews[0].issues.includes('image_page_manifest_missing'), true);
});

test('ppt image-first screenshot review records non-blocking debt for language and layout quality leaks', async () => {
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

const profilePresetParts = createPptDeckProfilePresetParts({ safeArray, safeText });

test('ppt lecture_student one-slide deck can satisfy teaching progression without four page types', () => {
  const checks = profilePresetParts.deriveProfileChecks({ profile_id: 'lecture_student' }, {
    slide_blueprint: {
      slides: [
        {
          slide_id: 'S01',
          title: '自主工作流闭环证明',
          page_type: 'cover_signal',
          page_goal: '用单页闭环展示从输入到交付的关键链路。',
          core_sentence: '输入清楚、链路可追踪、证据可审阅、边界可见，最终交付才可信。',
          page_core_content: [
            '输入：任务目标、受众、格式和约束。',
            '执行链路：目标理解、故事线、页面结构、视觉设计、检查和导出。',
            '证据：每一步留下可回看产物。',
            '阻断边界：事实不足、视觉不足、导出失败或需人工判断时停下。',
          ],
          evidence_points: [
            '执行侧按标准流程推进。',
            '审阅侧保留可复核证据。',
          ],
          visual_presentation: {
            layout_family: 'cover_signal',
            anchor_tracks: ['横向五段流程展示完整推进。'],
          },
        },
      ],
    },
  }, {});

  assert.equal(checks.term_explained_on_first_use, true);
  assert.equal(checks.teaching_progression_clear, true);
});

test('ppt lecture_student one-slide native visual sample accepts compact input route gate progression', () => {
  const checks = profilePresetParts.deriveProfileChecks({ profile_id: 'lecture_student' }, {
    slide_blueprint: {
      slides: [
        {
          slide_id: 'S01',
          title: '三条生成路线，怎样才算真正闭环？',
          page_type: 'cover_signal',
          page_goal: '用单页把共享输入、三路生成、交付门覆盖和可复查留痕组织成清晰的判断框架。',
          core_sentence: '能生成文件只是起点；只有同一输入经过三条生成路线，并完成三道交付门与六类结果留痕，才可判断端到端闭环成立。',
          page_core_content: [
            { text: '同一输入：一个准备好的内容包同时进入图像优先、网页呈现、可编辑演示文稿三条生成路线。' },
            { text: '闭环判定：三条路线都要经过视觉审阅、截图审阅、演示文稿导出；任一交付门缺失，都不能判定端到端完成。' },
          ],
          evidence_points: [
            '本次最小探针包含 1 个主题输入包、3 条生成路线，每条路线执行 1 轮。',
            '完整闭环要求 3/3 交付门覆盖，并留下 PPTX、PDF、PNG 截图、形状清单、审阅回执、导出回执共 6 类结果。',
          ],
          visual_presentation: {
            layout_family: 'cover_signal',
            anchor_tracks: [
              '主视觉采用一份输入包分流到三条并行通道，再汇入三道交付门的流程图。',
            ],
          },
        },
      ],
    },
  }, {});

  assert.equal(checks.term_explained_on_first_use, true);
  assert.equal(checks.teaching_progression_clear, true);
});

test('ppt lecture_student mechanism track satisfies term explanation with labeled content', () => {
  const checks = profilePresetParts.deriveProfileChecks({ profile_id: 'lecture_student' }, {
    slide_blueprint: {
      slides: [
        {
          slide_id: 'S01',
          title: '可复核交付闭环',
          page_type: 'mechanism_track',
          page_goal: '用一页流程图呈现从单一交付目标到可验收输出的完整闭环。',
          core_sentence: '自主工作流要把目标输入、连续执行、质量门禁、有限回修和导出证据连成可检查的闭环。',
          page_core_content: [
            { text: '目标输入：明确要交付什么、讲给谁听、用什么形式呈现，以及怎样判断合格。' },
            { text: '自主执行：将目标转成视觉交付路线，完成结构组织、页面生成与叙事一致性控制。' },
            { text: '质量门禁：检查内容是否完整、视觉是否清晰、课堂是否可讲、证据是否可解释。' },
            { text: '有限回修：只处理未通过的质量点，回到对应执行环节修正，避免无边界重写。' },
          ],
          evidence_points: [
            '输入端以明确交付目标为起点。',
            '终态验收依赖成品质量、回修范围和导出留痕。',
          ],
          visual_presentation: {
            layout_family: 'timeline_band',
            anchor_tracks: ['横向五段流水线。'],
          },
        },
      ],
    },
  }, {});

  assert.equal(checks.term_explained_on_first_use, true);
  assert.equal(checks.teaching_progression_clear, true);
});

test('ppt lecture_student multi-slide deck still requires the full teaching page progression', () => {
  const checks = profilePresetParts.deriveProfileChecks({ profile_id: 'lecture_student' }, {
    slide_blueprint: {
      slides: [
        {
          slide_id: 'S01',
          title: '只有开场页',
          page_type: 'cover_signal',
          page_goal: '先讲开场。',
          core_sentence: '只有开场不能代表完整教学推进。',
          page_core_content: ['概念一', '概念二'],
        },
        {
          slide_id: 'S02',
          title: '只有补充页',
          page_type: 'central_axis',
          page_goal: '补充概念。',
          core_sentence: '还缺少机制、判断和收束。',
          page_core_content: ['核心概念：解释本页要讲的术语。', '判断边界：说明学生需要带走的限制。'],
        },
      ],
    },
  }, {});

  assert.equal(checks.term_explained_on_first_use, true);
  assert.equal(checks.teaching_progression_clear, false);
});
