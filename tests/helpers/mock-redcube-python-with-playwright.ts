#!/usr/bin/env node
// @ts-nocheck

import path from 'node:path';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

import { buildNativePlanValidationPayload } from './mock-redcube-python-native-plan-validation.ts';

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0boAAAAASUVORK5CYII=',
  'base64',
);

const SCREENSHOT_DIMENSIONS = Object.freeze({ width: 2304, height: 1296 });

function words(value) {
  return String(value).trim().split(/\s+/).filter(Boolean);
}

function trueFlags(keys) {
  return Object.freeze(Object.fromEntries(words(keys).map((key) => [key, true])));
}

function emptyLists(keys) {
  return Object.freeze(Object.fromEntries(words(keys).map((key) => [key, []])));
}

const NATIVE_ENGINE_CAPABILITIES = {
  authoring_ir: 'redcube_svg_ir',
  authoring_ir_version: 1,
  pptx_writer: 'officecli_pptx_materializer',
  true_render_proof_renderer: 'libreoffice_headless',
  native_object_families: [
    'text_box',
    'shape',
    'connector',
    'picture',
    'group',
    'path',
    'chart',
    'table',
  ],
  ...trueFlags(`
    editable_pptx strict_svg_preflight true_render_proof_required cross_platform_render_required package_readback
    template_intake speaker_notes slide_transitions timing_and_animation
  `),
  screenshot_packaging: false,
};

const OFFICECLI_MATERIALIZER_POLICY = {
  policy_id: 'ppt_native_officecli_materializer_quality_gate_v1',
  adoption_status: 'qa_materializer_discipline_only',
  rca_main_workflow_owner: 'redcube_stage_review_export',
  skill_authoring_loop_adopted: false,
  materializer_role: 'default_editable_pptx_materializer_and_qa_gate',
  current_pptx_writer: 'officecli_pptx_materializer',
  required_gate_refs: words('officecli_save_before_close officecli_validate officecli_view_issues officecli_view_text'),
  ...trueFlags(`
    officecli_writer_adapter_default_enabled save_before_close_required validate_required view_issues_required view_text_required
    true_render_proof_required_after_officecli_gate
  `),
  true_render_proof_substitute_allowed: false,
  deterministic_cjk_font_family: 'Noto Sans CJK SC',
  default_visual_route_changed: false,
  default_executor_changed: false,
};

const REVIEW_CHECKS = trueFlags(`
  overflow_free occlusion_free visual_density_ok speaker_fit_ok edge_clearance_ok block_content_fit_ok title_typography_ok
  external_audience_language_ok title_safe_zone_clear table_legibility_ok layout_density_ok
`);

const NATIVE_SLIDE_CHECKS = trueFlags(`
  overflow_free occlusion_free visual_density_ok speaker_fit_ok edge_clearance_ok block_content_fit_ok title_typography_ok
  body_text_readability_ok typography_hierarchy_ok title_core_overlap_ok page_number_consistency_ok external_audience_language_ok
  title_safe_zone_clear table_legibility_ok layout_density_ok slot_fill_ok audience_label_readability_ok content_depth_ok
  grid_balance_ok visual_structure_present non_text_visual_specific_ok mechanical_card_template_absent panel_text_safe_area_ok
  text_card_internal_padding_ok short_label_wrap_ok title_underline_absent_ok
`);

const NATIVE_METRIC_TRUE_FLAGS = trueFlags(`
  body_text_readability_ok typography_hierarchy_ok slot_fill_ok audience_label_readability_ok content_depth_ok grid_balance_ok
  visual_structure_present non_text_visual_specific_ok mechanical_card_template_absent panel_text_safe_area_ok
  text_card_internal_padding_ok short_label_wrap_ok title_underline_absent_ok title_safe_zone_clearance_ok table_cell_fit_ok
`);

const NATIVE_METRIC_EMPTY_LISTS = emptyLists(`
  body_text_font_failures title_core_overlap_failures slot_fill_failures audience_label_readability_failures content_depth_failures
  grid_balance_failures panel_text_safe_area_failures text_card_internal_padding_failures short_label_wrap_failures
  title_underline_failures overlaps structural_text_collisions block_content_failures operator_language_fragments chart_bounds
  table_bounds metric_grid_bounds chart_metrics table_metrics metric_grid_metrics table_cell_fit_failures numeric_label_overflows
`);

const NATIVE_FIXED_METRICS = Object.freeze({
  min_body_font_pt: 18, body_text_readability_floor_pt: 18, title_core_overlap_count: 0,
  expected_slot_count: 2, filled_slot_count: 2, audience_label_font_floor_pt: 16,
  content_depth_floor_chars: 12, grid_balance_ratio: 1, mechanical_card_template_detected: false,
  structural_visual_count: 1, card_panel_count: 2, text_char_count: 72, block_count: 3,
  decorative_shape_count: 2, shape_count: 5, shape_kind_count: 3, role_count: 5,
  layout_richness_score: 0.72, overlap_pairs: 0, clipped_nodes: 0, occupied_ratio: 0.31,
  primary_points: 3,
  edge_clearance: { left: 72, top: 64, right: 72, bottom: 300 },
  table_min_font_pt: 11, card_blank_ratio: 0.24, axis_label_count: 0,
  legend_label_count: 0, numeric_label_overflow_count: 0,
});

const NATIVE_QUALITY_REQUIRED_PER_SLIDE_METRICS = Object.freeze(words(`
  bounds text_char_count primary_points min_body_font_pt body_text_readability_ok typography_hierarchy_ratio
  typography_hierarchy_ok title_core_overlap_count layout_variant expected_slot_count filled_slot_count slot_fill_ok
  audience_label_readability_ok content_depth_ok grid_balance_ok visual_structure_present non_text_visual_specific_ok
  mechanical_card_template_absent panel_text_safe_area_ok text_card_internal_padding_ok short_label_wrap_ok
  composition_signature title_underline_absent_ok occupied_ratio edge_clearance overlap_pairs structural_text_collision_count
  structural_text_collisions preview_screenshot_sha256 preview_screenshot_dimensions
`));

function buildNativeSlideMetrics({ slideId, layoutFamily, compositionSignature, bounds }) {
  return {
    ...NATIVE_METRIC_TRUE_FLAGS,
    ...NATIVE_METRIC_EMPTY_LISTS,
    ...NATIVE_FIXED_METRICS,
    title_font_size: layoutFamily === 'cover_signal' ? 56 : 44,
    typography_hierarchy_ratio: layoutFamily === 'cover_signal' ? 3.1111 : 2.4444,
    layout_variant: layoutFamily,
    structural_visual_roles: [`${layoutFamily}_rail`],
    composition_signature: compositionSignature,
    structural_text_collision_count: 0,
    coordinate_determinism_hash: createHash('sha256')
      .update(JSON.stringify({ slideId, layoutFamily, compositionSignature }))
      .digest('hex'),
    bounds,
  };
}

function nativeTextBox(shapeId, role, text, fontSize, bounds) {
  return { shape_id: shapeId, kind: 'text_box', role, quality_role: 'content', text, font_size: fontSize, bounds };
}

function mockNativeRendererKind() {
  return String(process.env.REDCUBE_MOCK_NATIVE_RENDERER_KIND || 'libreoffice_headless').trim();
}

function mockNativeRendererPipeline(rendererKind) {
  return rendererKind === 'libreoffice_headless'
    ? 'libreoffice_headless_pdf_png_v1'
    : 'legacy_desktop_renderer_v0';
}

function fail(message) {
  process.stderr.write(`${String(message || 'unknown error').trim()}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = String(argv[index] || '').trim();
    if (!token.startsWith('--')) {
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || String(next).startsWith('--')) {
      parsed[key] = true;
      continue;
    }
    parsed[key] = String(next);
    index += 1;
  }
  return parsed;
}

function requireArg(args, key, message) {
  const value = args[key];
  if (!value) fail(message);
  return value;
}

function readJsonFile(file, fallback = {}) {
  return file ? JSON.parse(readFileSync(file, 'utf-8')) : fallback;
}

function fileSha256(file) {
  if (!file) return '';
  try {
    return createHash('sha256').update(readFileSync(file)).digest('hex');
  } catch {
    return '';
  }
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function writeText(file, value) {
  ensureDir(path.dirname(file));
  writeFileSync(file, value, 'utf-8');
}

function writeBinary(file, value) {
  ensureDir(path.dirname(file));
  writeFileSync(file, value);
}

function writePayload(payload) { process.stdout.write(`${JSON.stringify(payload)}\n`); }

function incrementMockCallCount() {
  const callCountFile = String(process.env.REDCUBE_MOCK_PYTHON_CALL_COUNT_FILE || '').trim();
  if (!callCountFile) return;
  let count = 0;
  try {
    count = Number(readFileSync(callCountFile, 'utf-8')) || 0;
  } catch {
    count = 0;
  }
  writeText(callCountFile, String(count + 1));
}

function extractSlidesFromHtml(htmlFile) {
  const html = readFileSync(htmlFile, 'utf-8');
  const slideRoots = [...html.matchAll(/<[a-z][^>]*data-slide-root=(["'])true\1[^>]*data-slide-id=(["'])[^"']+\2[^>]*>/gi)]
    .map((match) => match[0]);
  if (slideRoots.length === 0) {
    return [{ slide_id: 'S01', title: 'Slide 1', speaker_seconds: 60, layout_family: 'default' }];
  }
  const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] || '';
  return slideRoots.map((tag, index) => ({
    slide_id: attr(tag, 'data-slide-id') || `S${String(index + 1).padStart(2, '0')}`,
    title: attr(tag, 'data-title') || `Slide ${index + 1}`,
    speaker_seconds: Number(attr(tag, 'data-speaker-seconds') || 60),
    layout_family: attr(tag, 'data-layout-family') || 'default',
  }));
}

function buildPassReviewPayload(args) {
  const htmlFile = requireArg(args, 'html', 'mock review requires --html');
  const outputDir = requireArg(args, 'output-dir', 'mock review requires --output-dir');
  const reviewMarkdown = requireArg(args, 'review-markdown', 'mock review requires --review-markdown');

  const slides = extractSlidesFromHtml(htmlFile);
  writeText(
    reviewMarkdown,
    [
      '# Mock Screenshot Review',
      '',
      ...slides.map((slide) => `- ${slide.slide_id}: pass`),
    ].join('\n'),
  );

  const slide_reviews = slides.map((slide, index) => {
    const screenshot_file = path.join(outputDir, `slide-${String(index + 1).padStart(2, '0')}.png`);
    const speakerSeconds = Number.isFinite(slide.speaker_seconds) ? slide.speaker_seconds : 60;
    const speakerFitOk = speakerSeconds >= 20 && speakerSeconds <= 110;
    writeBinary(screenshot_file, PNG_1X1);
    return {
      slide_id: slide.slide_id,
      title: slide.title,
      layout_family: slide.layout_family,
      screenshot_file,
      checks: {
        ...REVIEW_CHECKS,
        speaker_fit_ok: speakerFitOk,
      },
      metrics: {
        occupied_ratio: 0.52,
        primary_points: 3,
        speaker_seconds: speakerSeconds,
        overlaps: [],
        edge_clearance_failures: [],
        operator_language_fragments: [],
        title_safe_zone_clearance_ok: true,
        table_min_font_pt: 11,
        card_blank_ratio: 0.24,
        title_font_size: 40,
        title_line_count: 1,
        title_block_id: `title-${slide.slide_id}`,
      },
      issues: speakerFitOk ? [] : ['speaker_fit_out_of_range'],
      device_scale_factor: Number(args['device-scale-factor'] || 2),
      screenshot_dimensions: SCREENSHOT_DIMENSIONS,
    };
  });
  const speakerFitOk = slide_reviews.every((slide) => slide.checks.speaker_fit_ok);

  return {
    status: speakerFitOk ? 'pass' : 'block',
    slide_reviews,
    checks: {
      ...REVIEW_CHECKS,
      speaker_fit_ok: speakerFitOk,
    },
    metrics: {
      slide_count: slide_reviews.length,
      blocked_slide_count: 0,
    },
    screenshot_dimensions: SCREENSHOT_DIMENSIONS,
    device_scale_factor: Number(args['device-scale-factor'] || 2),
  };
}

function buildExportPayload(args) {
  const screenshotsDir = requireArg(args, 'screenshots-dir', 'mock export requires --screenshots-dir');
  const outputPptx = requireArg(args, 'output-pptx', 'mock export requires --output-pptx');
  const outputPdf = args['output-pdf'];

  const slideCount = readdirSync(screenshotsDir).filter((entry) => entry.endsWith('.png')).length;
  writeBinary(outputPptx, Buffer.from('mock-pptx'));
  if (outputPdf) {
    writeBinary(outputPdf, Buffer.from('%PDF-1.4\n%mock\n'));
  }
  return {
    status: 'completed',
    converter: {
      kind: 'mock_python_playwright',
      screenshots_dir: screenshotsDir,
    },
    page_count: slideCount,
    pptx_file: outputPptx,
    pdf_file: outputPdf || null,
  };
}

function buildNativePayload(args) {
  const inputJson = requireArg(args, 'input-json', 'mock native requires --input-json');
  const outputPptx = requireArg(args, 'output-pptx', 'mock native requires --output-pptx');
  const outputPdf = args['output-pdf'];
  const shapeManifestFile = requireArg(args, 'shape-manifest', 'mock native requires --shape-manifest');
  const previewDir = requireArg(args, 'preview-dir', 'mock native requires --preview-dir');
  const repairLogFile = args['repair-log'];
  const engineContractFile = args['engine-contract'];

  const input = readJsonFile(inputJson);
  const engineContract = readJsonFile(engineContractFile);
  const rendererKind = mockNativeRendererKind();
  const rendererPipeline = mockNativeRendererPipeline(rendererKind);
  const isLibreOfficeRenderer = rendererKind === 'libreoffice_headless';
  const blueprintSlides = Array.isArray(input?.blueprint?.slides) && input.blueprint.slides.length > 0
    ? input.blueprint.slides
    : Array.from({ length: 6 }, (_, index) => ({
        slide_id: `S${String(index + 1).padStart(2, '0')}`,
        title: `Slide ${index + 1}`,
      }));
  const planSlidesById = new Map(
    Array.isArray(input?.editable_shape_plan?.slides)
      ? input.editable_shape_plan.slides.map((slide) => [String(slide?.slide_id || ''), slide])
      : [],
  );
  const repairFeedback = safeArray(input?.repair_feedback);
  const repairFeedbackSlideIds = new Set(repairFeedback.map((item) => String(item?.slide_id || '').trim()).filter(Boolean));
  const slides = blueprintSlides.map((slide, index) => {
    const slideId = String(slide?.slide_id || `S${String(index + 1).padStart(2, '0')}`);
    const planSlide = planSlidesById.get(slideId) || {};
    const layoutFamily = String(
      planSlide?.layout_family
        || slide?.visual_presentation?.layout_family
        || slide?.layout_family
        || 'multi_zone_compare',
    );
    const compositionSignature = String(
      planSlide?.layout_intent?.composition_signature
        || `${layoutFamily}__mock_native_composition__page_${index + 1}`,
    );
    const screenshotFile = path.join(previewDir, `${slideId}.png`);
    writeBinary(screenshotFile, PNG_1X1);
    const bounds = [
      { left: 72, top: 64, width: 1008, height: 88, right: 1080, bottom: 152 },
      { left: 96, top: 220, width: 420, height: 120, right: 516, bottom: 340 },
      { left: 576, top: 220, width: 420, height: 120, right: 996, bottom: 340 },
    ];
    const pageCoreContent = Array.isArray(planSlide?.page_core_content)
      ? planSlide.page_core_content
      : (Array.isArray(slide?.page_core_content) ? slide.page_core_content : []);
    const bodyText = pageCoreContent
      .map((item) => String(item?.text || item || '').trim())
      .filter(Boolean)
      .join('\n') || 'Mock native editable body';
    return {
      slide_id: slideId,
      title: String(slide?.title || `Slide ${index + 1}`),
      layout_family: layoutFamily,
      layout_writer: 'officecli_pptx_materializer',
      ai_first_spatial_plan: {
        required: true,
        materialized: true,
        helper_template_layout_used: false,
        materializer: 'officecli_pptx_materializer',
        shape_count: Array.isArray(planSlide?.native_shapes) ? planSlide.native_shapes.length : 0,
      },
      text_box_count: 3,
      shape_count: 5,
      screenshot_file: screenshotFile,
      preview_screenshot_file: screenshotFile,
      preview_screenshot_sha256: fileSha256(screenshotFile),
      preview_screenshot_dimensions: SCREENSHOT_DIMENSIONS,
      render_proof_source: rendererKind,
      renderer_kind: rendererKind,
      renderer_pipeline: rendererPipeline,
      synthetic_preview: false,
      repaired: repairFeedbackSlideIds.has(slideId),
      native_shapes: [
        nativeTextBox(`${slideId}-title`, 'title', String(slide?.title || `Slide ${index + 1}`), layoutFamily === 'cover_signal' ? 56 : 44, bounds[0]),
        nativeTextBox(`${slideId}-body`, 'body', bodyText, 18, bounds[1]),
        nativeTextBox(`${slideId}-support`, 'support', `${layoutFamily} proof`, 18, bounds[2]),
      ],
      checks: NATIVE_SLIDE_CHECKS,
      metrics: buildNativeSlideMetrics({ slideId, layoutFamily, compositionSignature, bounds }),
      redcube_svg_ir_file: path.join(previewDir, `${slideId}.svg`),
      redcube_svg_ir_sha256: 'mock-svg-sha256',
      redcube_svg_ir_preflight: {
        status: 'pass',
        strict: true,
        allowed_tags: ['svg', 'g', 'rect', 'text'],
      },
      issues: [],
    };
  });
  writeBinary(outputPptx, Buffer.from('mock-native-pptx'));
  if (outputPdf) {
    writeBinary(outputPdf, Buffer.from('%PDF-1.4\n%mock-native\n'));
  }
  const previewScreenshots = slides.map((slide) => slide.preview_screenshot_file);
  const redcubeSvgIr = {
    kind: 'redcube_svg_ir',
    version: 1,
    strict_preflight: true,
    dir: previewDir,
    files: slides.map((slide) => slide.redcube_svg_ir_file),
  };
  const renderProof = {
    source_surface_kind: 'native_pptx',
    renderer_kind: rendererKind,
    renderer_pipeline: rendererPipeline,
    runtime: rendererKind,
    synthetic_preview: false,
    required: true,
    pptx_file: outputPptx,
    pdf_file: outputPdf || null,
    command_family: isLibreOfficeRenderer ? 'soffice --headless' : 'legacy desktop renderer',
    cross_platform_render_required: isLibreOfficeRenderer,
    libreoffice_version: isLibreOfficeRenderer ? 'LibreOffice mock 24.2.0' : 'unknown',
    poppler_version: isLibreOfficeRenderer ? 'pdftoppm mock 24.02.0' : 'unknown',
    source_pptx_sha256: fileSha256(outputPptx),
    pdf_sha256: fileSha256(outputPdf),
    preview_png_hashes: slides.map((slide) => ({
      file: slide.preview_screenshot_file,
      sha256: slide.preview_screenshot_sha256,
    })),
    preview_screenshots: previewScreenshots,
  };
  const shapeManifest = {
    schema_version: 1,
    artifact_kind: 'ppt_deck_native_shape_manifest',
    engine_contract: engineContract,
    engine_contract_file: engineContractFile || null,
    engine_capabilities: NATIVE_ENGINE_CAPABILITIES,
    officecli_materializer_policy: OFFICECLI_MATERIALIZER_POLICY,
    native_quality_model: 'shape_manifest_layout_metrics_v1',
    native_quality_surface: {
      quality_model: 'shape_manifest_layout_metrics_v1',
      source_surface_kind: 'native_pptx',
      required_per_slide_metrics: NATIVE_QUALITY_REQUIRED_PER_SLIDE_METRICS,
      fail_closed_when_missing: true,
    },
    render_proof: renderProof,
    redcube_svg_ir: redcubeSvgIr,
    screenshot_dimensions: SCREENSHOT_DIMENSIONS,
    preview_screenshots: previewScreenshots,
    slides,
  };
  writeText(shapeManifestFile, JSON.stringify(shapeManifest, null, 2));
  const repairLog = {
    target_slide_ids: repairFeedback.map((item) => item?.slide_id).filter(Boolean),
    preserved_slide_ids: slides
      .map((slide) => slide.slide_id)
      .filter((slideId) => !repairFeedbackSlideIds.has(slideId)),
    blocked_slide_ids_source: args.mode === 'repair'
      ? 'screenshot_review.slide_reviews.status_block'
      : null,
    scope: args.mode === 'repair' ? 'page' : 'deck',
    consumed_review_stage: args.mode === 'repair' ? 'screenshot_review' : null,
    feedback_count: repairFeedback.length,
    repair_log_file: repairLogFile || null,
  };
  if (repairLogFile) {
    writeText(repairLogFile, JSON.stringify(repairLog, null, 2));
  }
  return {
    status: 'completed',
    builder: {
      kind: 'officecli_pptx_materializer',
      implementation: 'mock_officecli_batch_from_ai_spatial_plan',
      surface: 'editable_native_pptx',
      screenshot_packaging: false,
    },
    capability: {
      kind: 'officecli materializer adapter',
      ...trueFlags('editable_artifact native_shapes redcube_svg_ir strict_svg_preflight render_proof_required'),
    },
    engine_capabilities: NATIVE_ENGINE_CAPABILITIES,
    officecli_materializer_policy: OFFICECLI_MATERIALIZER_POLICY,
    shape_manifest_schema_version: 1,
    pptx_file: outputPptx,
    pdf_file: outputPdf || null,
    shape_manifest_file: shapeManifestFile,
    repair_log_file: repairLogFile || null,
    page_count: slides.length,
    screenshot_dimensions: SCREENSHOT_DIMENSIONS,
    render_proof: renderProof,
    redcube_svg_ir: redcubeSvgIr,
    preview_screenshots: previewScreenshots,
    slides,
    repair_log: repairLog,
    engine_contract: engineContract,
    engine_contract_file: engineContractFile || null,
  };
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function main() {
  incrementMockCallCount();
  const [flag, helper = '', ...rawArgs] = process.argv.slice(2);
  if (flag !== '-m') fail('mock helper requires -m <package_module>');
  const args = parseArgs(rawArgs);

  if (helper === 'redcube_ai.native_helpers.ppt_deck.review') {
    writePayload(buildPassReviewPayload(args));
    return;
  }
  if (helper === 'redcube_ai.native_helpers.ppt_deck.export') {
    writePayload(buildExportPayload(args));
    return;
  }
  if (helper === 'redcube_ai.native_helpers.ppt_deck.native') {
    writePayload(args.mode === 'validate_plan'
      ? buildNativePlanValidationPayload(readJsonFile(requireArg(args, 'input-json', 'mock native validation requires --input-json')))
      : buildNativePayload(args));
    return;
  }
  fail(`unsupported mock redcube python helper: ${helper || '(missing)'}`);
}

main();
