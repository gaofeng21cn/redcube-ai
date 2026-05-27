#!/usr/bin/env node
// @ts-nocheck

import path from 'node:path';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0boAAAAASUVORK5CYII=',
  'base64',
);

const NATIVE_ENGINE_CAPABILITIES = {
  authoring_ir: 'redcube_svg_ir',
  authoring_ir_version: 1,
  pptx_writer: 'redcube_drawingml_writer',
  editable_pptx: true,
  strict_svg_preflight: true,
  true_render_proof_required: true,
  true_render_proof_renderer: 'libreoffice_headless',
  cross_platform_render_required: true,
  screenshot_packaging: false,
};

const OFFICECLI_MATERIALIZER_POLICY = {
  policy_id: 'ppt_native_officecli_materializer_quality_gate_v1',
  adoption_status: 'qa_materializer_discipline_only',
  rca_main_workflow_owner: 'redcube_stage_review_export',
  skill_authoring_loop_adopted: false,
  materializer_role: 'executor_adapter_materializer_and_qa_gate',
  current_pptx_writer: 'redcube_drawingml_writer',
  officecli_writer_adapter_default_enabled: false,
  required_gate_refs: [
    'officecli_save_before_close',
    'officecli_validate',
    'officecli_view_issues',
    'officecli_view_text',
  ],
  save_before_close_required: true,
  validate_required: true,
  view_issues_required: true,
  view_text_required: true,
  true_render_proof_required_after_officecli_gate: true,
  true_render_proof_substitute_allowed: false,
  deterministic_cjk_font_family: 'Noto Sans CJK SC',
  default_visual_route_changed: false,
  default_executor_changed: false,
};

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

function readText(file) {
  return readFileSync(file, 'utf-8');
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
  return dir;
}

function writeText(file, value) {
  ensureDir(path.dirname(file));
  writeFileSync(file, value, 'utf-8');
}

function writeBinary(file, value) {
  ensureDir(path.dirname(file));
  writeFileSync(file, value);
}

function extractSlidesFromHtml(htmlFile) {
  const html = readText(htmlFile);
  const matches = [...html.matchAll(/data-slide-id="([^"]+)"[^>]*data-title="([^"]*)"[^>]*data-speaker-seconds="([^"]*)"[^>]*data-layout-family="([^"]*)"/g)];
  if (matches.length === 0) {
    return [{ slide_id: 'S01', title: 'Slide 1', speaker_seconds: 60, layout_family: 'default' }];
  }
  return matches.map((match, index) => ({
    slide_id: match[1] || `S${String(index + 1).padStart(2, '0')}`,
    title: match[2] || `Slide ${index + 1}`,
    speaker_seconds: Number(match[3] || 60),
    layout_family: match[4] || 'default',
  }));
}

function buildPassReviewPayload(args) {
  const htmlFile = args.html;
  const outputDir = args['output-dir'];
  const reviewMarkdown = args['review-markdown'];
  if (!htmlFile) fail('mock review requires --html');
  if (!outputDir) fail('mock review requires --output-dir');
  if (!reviewMarkdown) fail('mock review requires --review-markdown');

  const slides = extractSlidesFromHtml(htmlFile);
  ensureDir(outputDir);
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
        overflow_free: true,
        occlusion_free: true,
        visual_density_ok: true,
        speaker_fit_ok: speakerFitOk,
        edge_clearance_ok: true,
        block_content_fit_ok: true,
        title_typography_ok: true,
        external_audience_language_ok: true,
        title_safe_zone_clear: true,
        table_legibility_ok: true,
        layout_density_ok: true,
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
      screenshot_dimensions: {
        width: 2304,
        height: 1296,
      },
    };
  });
  const speakerFitOk = slide_reviews.every((slide) => slide.checks.speaker_fit_ok);

  return {
    status: speakerFitOk ? 'pass' : 'block',
    slide_reviews,
    checks: {
      overflow_free: true,
      occlusion_free: true,
      visual_density_ok: true,
      speaker_fit_ok: speakerFitOk,
      edge_clearance_ok: true,
      block_content_fit_ok: true,
      title_typography_ok: true,
      external_audience_language_ok: true,
      title_safe_zone_clear: true,
      table_legibility_ok: true,
      layout_density_ok: true,
    },
    metrics: {
      slide_count: slide_reviews.length,
      blocked_slide_count: 0,
    },
    screenshot_dimensions: {
      width: 2304,
      height: 1296,
    },
    device_scale_factor: Number(args['device-scale-factor'] || 2),
  };
}

function buildExportPayload(args) {
  const screenshotsDir = args['screenshots-dir'];
  const outputPptx = args['output-pptx'];
  const outputPdf = args['output-pdf'];
  if (!screenshotsDir) fail('mock export requires --screenshots-dir');
  if (!outputPptx) fail('mock export requires --output-pptx');

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

function normalizeHelperInvocation(argv) {
  if (argv[0] === '-m') {
    return {
      helper: String(argv[1] || '').trim(),
      args: argv.slice(2),
    };
  }
  const script = String(argv[0] || '').trim();
  return {
    helper: path.basename(script),
    args: argv.slice(1),
  };
}

function buildNativePayload(args) {
  const inputJson = args['input-json'];
  const outputPptx = args['output-pptx'];
  const outputPdf = args['output-pdf'];
  const shapeManifestFile = args['shape-manifest'];
  const previewDir = args['preview-dir'];
  const repairLogFile = args['repair-log'];
  const engineContractFile = args['engine-contract'];
  if (!inputJson) fail('mock native requires --input-json');
  if (!outputPptx) fail('mock native requires --output-pptx');
  if (!shapeManifestFile) fail('mock native requires --shape-manifest');
  if (!previewDir) fail('mock native requires --preview-dir');

  const input = JSON.parse(readText(inputJson));
  const engineContract = engineContractFile ? JSON.parse(readText(engineContractFile)) : {};
  const rendererKind = mockNativeRendererKind();
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
  const repairFeedbackSlideIds = new Set(
    Array.isArray(input?.repair_feedback)
      ? input.repair_feedback.map((item) => String(item?.slide_id || '').trim()).filter(Boolean)
      : [],
  );
  const layoutWriterFor = (layoutFamily) => `${layoutFamily || 'multi_zone_compare'}_native_writer`;
  ensureDir(previewDir);
  const slides = blueprintSlides.map((slide, index) => {
    const slideId = String(slide?.slide_id || `S${String(index + 1).padStart(2, '0')}`);
    const planSlide = planSlidesById.get(slideId) || {};
    const layoutFamily = String(
      planSlide?.layout_family
        || slide?.visual_presentation?.layout_family
        || slide?.layout_family
        || 'multi_zone_compare',
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
      layout_writer: layoutWriterFor(layoutFamily),
      text_box_count: 3,
      shape_count: 5,
      screenshot_file: screenshotFile,
      preview_screenshot_file: screenshotFile,
      preview_screenshot_sha256: fileSha256(screenshotFile),
      preview_screenshot_dimensions: { width: 2304, height: 1296 },
      render_proof_source: rendererKind,
      renderer_kind: rendererKind,
      renderer_pipeline: mockNativeRendererPipeline(rendererKind),
      synthetic_preview: false,
      repaired: repairFeedbackSlideIds.has(slideId),
      native_shapes: [
        {
          shape_id: `${slideId}-title`,
          kind: 'text_box',
          role: 'title',
          quality_role: 'content',
          text: String(slide?.title || `Slide ${index + 1}`),
          font_size: layoutFamily === 'cover_signal' ? 56 : 44,
          bounds: bounds[0],
        },
        {
          shape_id: `${slideId}-body`,
          kind: 'text_box',
          role: 'body',
          quality_role: 'content',
          text: bodyText,
          font_size: 18,
          bounds: bounds[1],
        },
        {
          shape_id: `${slideId}-support`,
          kind: 'text_box',
          role: 'support',
          quality_role: 'content',
          text: `${layoutFamily} proof`,
          font_size: 18,
          bounds: bounds[2],
        },
      ],
      checks: {
        overflow_free: true,
        occlusion_free: true,
        visual_density_ok: true,
        speaker_fit_ok: true,
        edge_clearance_ok: true,
        block_content_fit_ok: true,
        title_typography_ok: true,
        body_text_readability_ok: true,
        typography_hierarchy_ok: true,
        title_core_overlap_ok: true,
        page_number_consistency_ok: true,
        external_audience_language_ok: true,
        title_safe_zone_clear: true,
        table_legibility_ok: true,
        layout_density_ok: true,
      },
      metrics: {
        title_font_size: layoutFamily === 'cover_signal' ? 56 : 44,
        min_body_font_pt: 18,
        body_text_readability_floor_pt: 18,
        body_text_readability_ok: true,
        body_text_font_failures: [],
        typography_hierarchy_ratio: layoutFamily === 'cover_signal' ? 3.1111 : 2.4444,
        typography_hierarchy_ok: true,
        title_core_overlap_count: 0,
        title_core_overlap_failures: [],
        text_char_count: 72,
        block_count: 3,
        shape_count: 5,
        overlap_pairs: 0,
        overlaps: [],
        clipped_nodes: 0,
        occupied_ratio: 0.31,
        primary_points: 3,
        edge_clearance: { left: 72, top: 64, right: 72, bottom: 300 },
        block_content_failures: [],
        operator_language_fragments: [],
        title_safe_zone_clearance_ok: true,
        table_min_font_pt: 11,
        card_blank_ratio: 0.24,
        bounds,
      },
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
  const renderProof = {
    source_surface_kind: 'native_pptx',
    renderer_kind: rendererKind,
    renderer_pipeline: mockNativeRendererPipeline(rendererKind),
    runtime: rendererKind,
    synthetic_preview: false,
    required: true,
    pptx_file: outputPptx,
    pdf_file: outputPdf || null,
    command_family: rendererKind === 'libreoffice_headless' ? 'soffice --headless' : 'legacy desktop renderer',
    cross_platform_render_required: rendererKind === 'libreoffice_headless',
    libreoffice_version: rendererKind === 'libreoffice_headless' ? 'LibreOffice mock 24.2.0' : 'unknown',
    poppler_version: rendererKind === 'libreoffice_headless' ? 'pdftoppm mock 24.02.0' : 'unknown',
    source_pptx_sha256: fileSha256(outputPptx),
    pdf_sha256: fileSha256(outputPdf),
    preview_png_hashes: slides.map((slide) => ({
      file: slide.preview_screenshot_file,
      sha256: slide.preview_screenshot_sha256,
    })),
    preview_screenshots: slides.map((slide) => slide.preview_screenshot_file),
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
      required_per_slide_metrics: [
        'bounds',
        'text_char_count',
        'primary_points',
        'min_body_font_pt',
        'body_text_readability_ok',
        'typography_hierarchy_ratio',
        'typography_hierarchy_ok',
        'title_core_overlap_count',
        'occupied_ratio',
        'edge_clearance',
        'overlap_pairs',
        'preview_screenshot_sha256',
        'preview_screenshot_dimensions',
      ],
      fail_closed_when_missing: true,
    },
    render_proof: renderProof,
    redcube_svg_ir: {
      kind: 'redcube_svg_ir',
      version: 1,
      strict_preflight: true,
      dir: previewDir,
      files: slides.map((slide) => slide.redcube_svg_ir_file),
    },
    screenshot_dimensions: { width: 2304, height: 1296 },
    preview_screenshots: slides.map((slide) => slide.preview_screenshot_file),
    slides,
  };
  writeText(shapeManifestFile, JSON.stringify(shapeManifest, null, 2));
  const repairLog = {
    target_slide_ids: Array.isArray(input?.repair_feedback)
      ? input.repair_feedback.map((item) => item?.slide_id).filter(Boolean)
      : [],
    preserved_slide_ids: slides
      .map((slide) => slide.slide_id)
      .filter((slideId) => !repairFeedbackSlideIds.has(slideId)),
    blocked_slide_ids_source: args.mode === 'repair'
      ? 'screenshot_review.slide_reviews.status_block'
      : null,
    scope: args.mode === 'repair' ? 'page' : 'deck',
    consumed_review_stage: args.mode === 'repair' ? 'screenshot_review' : null,
    feedback_count: Array.isArray(input?.repair_feedback) ? input.repair_feedback.length : 0,
    repair_log_file: repairLogFile || null,
  };
  if (repairLogFile) {
    writeText(repairLogFile, JSON.stringify(repairLog, null, 2));
  }
  return {
    status: 'completed',
    builder: {
      kind: 'redcube_drawingml_writer',
      implementation: 'mock_python_pptx_native_shapes',
      surface: 'editable_native_pptx',
      screenshot_packaging: false,
    },
    capability: {
      kind: 'RedCube DrawingML writer',
      editable_artifact: true,
      native_shapes: true,
      redcube_svg_ir: true,
      strict_svg_preflight: true,
      render_proof_required: true,
    },
    engine_capabilities: NATIVE_ENGINE_CAPABILITIES,
    officecli_materializer_policy: OFFICECLI_MATERIALIZER_POLICY,
    shape_manifest_schema_version: 1,
    pptx_file: outputPptx,
    pdf_file: outputPdf || null,
    shape_manifest_file: shapeManifestFile,
    repair_log_file: repairLogFile || null,
    page_count: slides.length,
    screenshot_dimensions: { width: 2304, height: 1296 },
    render_proof: renderProof,
    redcube_svg_ir: shapeManifest.redcube_svg_ir,
    preview_screenshots: slides.map((slide) => slide.preview_screenshot_file),
    slides,
    repair_log: repairLog,
    engine_contract: engineContract,
    engine_contract_file: engineContractFile || null,
  };
}

function main() {
  const invocation = normalizeHelperInvocation(process.argv.slice(2));
  const basename = path.basename(invocation.helper);
  const args = parseArgs(invocation.args);

  if (invocation.helper === 'redcube_ai.native_helpers.ppt_deck.review') {
    process.stdout.write(`${JSON.stringify(buildPassReviewPayload(args))}\n`);
    return;
  }
  if (invocation.helper === 'redcube_ai.native_helpers.ppt_deck.export') {
    process.stdout.write(`${JSON.stringify(buildExportPayload(args))}\n`);
    return;
  }
  if (invocation.helper === 'redcube_ai.native_helpers.ppt_deck.native') {
    process.stdout.write(`${JSON.stringify(buildNativePayload(args))}\n`);
    return;
  }

  if (basename.endsWith('_review.py')) {
    process.stdout.write(`${JSON.stringify(buildPassReviewPayload(args))}\n`);
    return;
  }
  if (basename.endsWith('_export.py')) {
    process.stdout.write(`${JSON.stringify(buildExportPayload(args))}\n`);
    return;
  }
  if (basename.endsWith('_native.py')) {
    process.stdout.write(`${JSON.stringify(buildNativePayload(args))}\n`);
    return;
  }
  fail(`unsupported mock redcube python helper: ${invocation.helper || '(missing)'}`);
}

main();
