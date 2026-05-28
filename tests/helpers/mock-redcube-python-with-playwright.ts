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
  pptx_writer: 'officecli_pptx_materializer',
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
  materializer_role: 'default_editable_pptx_materializer_and_qa_gate',
  current_pptx_writer: 'officecli_pptx_materializer',
  officecli_writer_adapter_default_enabled: true,
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
  const layoutWriterFor = () => 'officecli_pptx_materializer';
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
      layout_writer: layoutWriterFor(layoutFamily),
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
        slot_fill_ok: true,
        audience_label_readability_ok: true,
        content_depth_ok: true,
        grid_balance_ok: true,
        visual_structure_present: true,
        non_text_visual_specific_ok: true,
        mechanical_card_template_absent: true,
        title_underline_absent_ok: true,
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
        layout_variant: layoutFamily,
        expected_slot_count: 2,
        filled_slot_count: 2,
        slot_fill_ok: true,
        slot_fill_failures: [],
        audience_label_readability_ok: true,
        audience_label_font_floor_pt: 16,
        audience_label_readability_failures: [],
        content_depth_ok: true,
        content_depth_floor_chars: 12,
        content_depth_failures: [],
        grid_balance_ok: true,
        grid_balance_ratio: 1,
        grid_balance_failures: [],
        visual_structure_present: true,
        non_text_visual_specific_ok: true,
        mechanical_card_template_absent: true,
        mechanical_card_template_detected: false,
        structural_visual_count: 1,
        structural_visual_roles: [`${layoutFamily}_rail`],
        card_panel_count: 2,
        composition_signature: compositionSignature,
        title_underline_absent_ok: true,
        title_underline_failures: [],
        text_char_count: 72,
        block_count: 3,
        decorative_shape_count: 2,
        shape_count: 5,
        shape_kind_count: 3,
        role_count: 5,
        layout_richness_score: 0.72,
        overlap_pairs: 0,
        overlaps: [],
        structural_text_collision_count: 0,
        structural_text_collisions: [],
        clipped_nodes: 0,
        occupied_ratio: 0.31,
        primary_points: 3,
        edge_clearance: { left: 72, top: 64, right: 72, bottom: 300 },
        block_content_failures: [],
        operator_language_fragments: [],
        title_safe_zone_clearance_ok: true,
        table_min_font_pt: 11,
        card_blank_ratio: 0.24,
        chart_bounds: [],
        table_bounds: [],
        metric_grid_bounds: [],
        chart_metrics: [],
        table_metrics: [],
        metric_grid_metrics: [],
        axis_label_count: 0,
        legend_label_count: 0,
        table_cell_fit_ok: true,
        table_cell_fit_failures: [],
        numeric_label_overflow_count: 0,
        numeric_label_overflows: [],
        coordinate_determinism_hash: createHash('sha256')
          .update(JSON.stringify({ slideId, layoutFamily, compositionSignature }))
          .digest('hex'),
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
        'layout_variant',
        'expected_slot_count',
        'filled_slot_count',
        'slot_fill_ok',
        'audience_label_readability_ok',
        'content_depth_ok',
        'grid_balance_ok',
        'visual_structure_present',
        'non_text_visual_specific_ok',
        'mechanical_card_template_absent',
        'composition_signature',
        'title_underline_absent_ok',
        'occupied_ratio',
        'edge_clearance',
        'overlap_pairs',
        'structural_text_collision_count',
        'structural_text_collisions',
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
      kind: 'officecli_pptx_materializer',
      implementation: 'mock_officecli_batch_from_ai_spatial_plan',
      surface: 'editable_native_pptx',
      screenshot_packaging: false,
    },
    capability: {
      kind: 'officecli materializer adapter',
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

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function nativePlanBounds(shape) {
  const bounds = shape?.bounds && typeof shape.bounds === 'object' ? shape.bounds : {};
  const values = {};
  for (const [key, alternate] of [
    ['left_in', 'x_in'],
    ['top_in', 'y_in'],
    ['width_in', 'w_in'],
    ['height_in', 'h_in'],
  ]) {
    const raw = bounds[key] ?? bounds[alternate];
    const value = Number(raw);
    if (!Number.isFinite(value)) return null;
    values[key] = value;
  }
  if (
    values.left_in < 0
    || values.top_in < 0
    || values.width_in <= 0
    || values.height_in <= 0
    || values.left_in + values.width_in > 16
    || values.top_in + values.height_in > 9
  ) {
    return null;
  }
  return values;
}

function nativePlanShapeText(shape) {
  return safeText(shape?.editable_text || shape?.text || shape?.label);
}

function nativePlanFontSize(shape) {
  const explicit = Number(shape?.font_size || shape?.size_pt || shape?.size || 0);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const role = safeText(shape?.role);
  if (role === 'title') return 44;
  if (role === 'point_index') return 16;
  if (['subtitle', 'core_sentence'].includes(role)) return 24;
  return 18;
}

function weightedTextWidthPt(text, fontSize) {
  return [...String(text || '')].reduce((width, char) => {
    if (/\s/.test(char)) return width + fontSize * 0.32;
    if (char.codePointAt(0) > 127) return width + fontSize * 0.95;
    if (/[A-Z]/.test(char)) return width + fontSize * 0.68;
    if (['-', '/', ':'].includes(char)) return width + fontSize * 0.38;
    return width + fontSize * 0.56;
  }, 0);
}

function estimatedTextHeightIn(shape, bounds) {
  const text = nativePlanShapeText(shape);
  if (!text) return 0;
  const fontSize = nativePlanFontSize(shape);
  const usableWidthPt = Math.max((bounds.width_in - 0.04) * 72, 1);
  const estimatedLines = Math.max(1, Math.ceil(weightedTextWidthPt(text, fontSize) / usableWidthPt));
  return (estimatedLines * fontSize * 1.18 / 72) + 0.04;
}

function nativePlanLineBoundsFailure(shape, bounds) {
  const kind = safeText(shape?.kind || shape?.type || shape?.role).toLowerCase();
  if (!['line', 'connector'].includes(kind)) return null;
  if (!bounds || bounds.width_in < 0.03 || bounds.height_in < 0.03) {
    return {
      reason: bounds ? 'ai_first_connector_thickness_too_small' : 'ai_first_connector_bounds_not_numeric',
      shape_id: safeText(shape?.shape_id, '<missing-shape-id>'),
      kind,
      width_in: bounds?.width_in ?? null,
      height_in: bounds?.height_in ?? null,
      minimum_thickness_in: 0.03,
    };
  }
  return null;
}

function nativePlanTextOverlapFailures(shapes) {
  const textShapes = shapes.filter((shape) => (
    safeText(shape?.quality_role || 'content') === 'content'
    && ['text', 'text_box'].includes(safeText(shape?.kind || shape?.type || shape?.role).toLowerCase())
    && nativePlanShapeText(shape)
    && nativePlanBounds(shape)
  ));
  const failures = [];
  for (let leftIndex = 0; leftIndex < textShapes.length; leftIndex += 1) {
    const leftShape = textShapes[leftIndex];
    const leftBounds = nativePlanBounds(leftShape);
    const leftVisibleBounds = leftBounds
      ? { ...leftBounds, height_in: Math.min(leftBounds.height_in, estimatedTextHeightIn(leftShape, leftBounds)) }
      : null;
    for (const rightShape of textShapes.slice(leftIndex + 1)) {
      const rightBounds = nativePlanBounds(rightShape);
      const rightVisibleBounds = rightBounds
        ? { ...rightBounds, height_in: Math.min(rightBounds.height_in, estimatedTextHeightIn(rightShape, rightBounds)) }
        : null;
      if (!leftVisibleBounds || !rightVisibleBounds) continue;
      const overlapW = Math.max(
        0,
        Math.min(leftVisibleBounds.left_in + leftVisibleBounds.width_in, rightVisibleBounds.left_in + rightVisibleBounds.width_in)
          - Math.max(leftVisibleBounds.left_in, rightVisibleBounds.left_in),
      );
      const overlapH = Math.max(
        0,
        Math.min(leftVisibleBounds.top_in + leftVisibleBounds.height_in, rightVisibleBounds.top_in + rightVisibleBounds.height_in)
          - Math.max(leftVisibleBounds.top_in, rightVisibleBounds.top_in),
      );
      const overlapArea = overlapW * overlapH;
      if (overlapArea > 0.0024) {
        failures.push({
          reason: 'ai_first_text_box_overlap',
          shape_id: safeText(leftShape?.shape_id, '<missing-shape-id>'),
          other_shape_id: safeText(rightShape?.shape_id, '<missing-shape-id>'),
          overlap_area_in2: Number(overlapArea.toFixed(4)),
        });
      }
    }
  }
  return failures;
}

function normalizedContentCharCount(text) {
  return [...String(text || '')]
    .filter((char) => !/\s/.test(char) && !['，', '。', '、', ',', '.', ':', '：', ';', '；'].includes(char))
    .length;
}

function nativePlanContentDepthFailures(shapes) {
  const excludedRoles = new Set([
    'title',
    'subtitle',
    'core_sentence',
    'evidence_item',
    'metric',
    'metric_label',
    'panel_title',
    'speaker_identity',
    'route_label',
    'point_text_short',
    'boundary_note',
    'page_number',
    'page_no',
    'cover_meta',
    'footer',
    'meta',
    'point_index',
    'caption',
    'date',
    'page',
    'source_note',
  ]);
  return shapes
    .filter((shape) => safeText(shape?.quality_role || 'content') === 'content')
    .filter((shape) => !excludedRoles.has(safeText(shape?.role)))
    .filter((shape) => nativePlanShapeText(shape))
    .map((shape) => ({
      shape,
      charCount: normalizedContentCharCount(nativePlanShapeText(shape)),
    }))
    .filter(({ charCount }) => charCount < 12)
    .map(({ shape, charCount }) => ({
      reason: 'ai_first_content_depth_too_low',
      shape_id: safeText(shape?.shape_id, '<missing-shape-id>'),
      role: safeText(shape?.role),
      text_char_count: charCount,
      threshold: 12,
    }));
}

function nativePlanPageNumberFailures(shapes) {
  return shapes.some((shape) => (
    ['page_number', 'page_no', 'page'].includes(safeText(shape?.role))
    && nativePlanShapeText(shape)
  ))
    ? []
    : [{ reason: 'ai_first_page_number_missing' }];
}

function nativePlanTextCapacityFailure(shape, bounds) {
  const kind = safeText(shape?.kind || shape?.type || shape?.role).toLowerCase();
  if (!['text', 'text_box'].includes(kind) || !bounds) return null;
  const text = nativePlanShapeText(shape);
  if (!text) return null;
  const role = safeText(shape?.role);
  if (['title', 'subtitle', 'page_number', 'page_no', 'meta', 'cover_meta', 'footer', 'point_index'].includes(role)) {
    return null;
  }
  const fontSize = nativePlanFontSize(shape);
  const leadSentenceRoles = ['lead', 'intro', 'thesis', 'takeaway', 'core_sentence'];
  const compactMinimum = leadSentenceRoles.includes(role) && fontSize >= 20 && text.length >= 12
    ? 0.95
    : text.length >= 18 ? 0.84 : 0.54;
  if (fontSize >= 18 && bounds.height_in < compactMinimum) {
    return {
      reason: 'ai_first_text_box_height_below_readability_floor',
      shape_id: safeText(shape?.shape_id, '<missing-shape-id>'),
      role,
      font_size: fontSize,
      text_char_count: text.length,
      height_in: Number(bounds.height_in.toFixed(4)),
      minimum_height_in: compactMinimum,
    };
  }
  return null;
}

function buildNativePlanValidationPayload(args) {
  const inputJson = args['input-json'];
  if (!inputJson) fail('mock native validation requires --input-json');
  const input = JSON.parse(readText(inputJson));
  const plan = input?.editable_shape_plan || {};
  const designSpecLock = plan?.design_spec_lock && typeof plan.design_spec_lock === 'object'
    ? plan.design_spec_lock
    : {};
  if (
    !safeText(designSpecLock?.spec_id)
    || !safeText(designSpecLock?.owner)
    || !safeText(designSpecLock?.motif)
    || safeArray(designSpecLock?.layout_archetypes).length < 3
  ) {
    return {
      ok: false,
      stage: 'normalize_slide_data',
      failure_count: 1,
      failures: [{
        reason: 'ai_first_design_spec_lock_missing',
      }],
    };
  }
  const slides = safeArray(plan?.slides);
  const failures = slides.map((slide, index) => {
    const slideId = safeText(slide?.slide_id, `S${String(index + 1).padStart(2, '0')}`);
    const slideFailures = [];
    const layoutIntent = slide?.layout_intent && typeof slide.layout_intent === 'object'
      ? slide.layout_intent
      : {};
    const missingLayoutIntent = [
      'rhetorical_role',
      'composition_signature',
      'primary_grid',
      'visual_weight',
      'negative_space_strategy',
      'non_text_visual',
    ].filter((key) => !safeText(layoutIntent?.[key]));
    if (missingLayoutIntent.length > 0 || layoutIntent?.forbidden_template_reuse_checked !== true) {
      slideFailures.push({
        reason: 'ai_first_layout_intent_incomplete',
        missing_fields: missingLayoutIntent,
      });
    }
    const shapes = safeArray(slide?.native_shapes);
    slideFailures.push(...nativePlanTextOverlapFailures(shapes));
    slideFailures.push(...nativePlanContentDepthFailures(shapes));
    slideFailures.push(...nativePlanPageNumberFailures(shapes));
    for (const shape of shapes) {
      const shapeId = safeText(shape?.shape_id, '<missing-shape-id>');
      const kind = safeText(shape?.kind || shape?.type || shape?.role).toLowerCase();
      const role = safeText(shape?.role);
      const bounds = nativePlanBounds(shape);
      if (!bounds) {
        slideFailures.push({ reason: 'ai_first_shape_bounds_invalid', shape_id: shapeId });
      }
      const lineFailure = nativePlanLineBoundsFailure(shape, bounds);
      if (lineFailure) slideFailures.push(lineFailure);
      if (['text', 'text_box'].includes(kind) && !nativePlanShapeText(shape)) {
        slideFailures.push({ reason: 'ai_first_text_missing', shape_id: shapeId });
      }
      if (role === 'point_index' && nativePlanFontSize(shape) < 16) {
        slideFailures.push({ reason: 'ai_first_point_index_too_small', shape_id: shapeId });
      }
      const textFailure = nativePlanTextCapacityFailure(shape, bounds);
      if (textFailure) slideFailures.push(textFailure);
    }
    return slideFailures.length > 0
      ? {
          slide_id: slideId,
          title: safeText(slide?.title),
          failures: slideFailures,
        }
      : null;
  }).filter(Boolean);
  return {
    ok: failures.length === 0,
    stage: 'ai_first_shape_plan_preflight',
    slide_count: slides.length,
    failure_count: failures.reduce((count, slide) => count + safeArray(slide.failures).length, 0),
    failures,
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
    if (args.mode === 'validate_plan') {
      process.stdout.write(`${JSON.stringify(buildNativePlanValidationPayload(args))}\n`);
      return;
    }
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
    if (args.mode === 'validate_plan') {
      process.stdout.write(`${JSON.stringify(buildNativePlanValidationPayload(args))}\n`);
      return;
    }
    process.stdout.write(`${JSON.stringify(buildNativePayload(args))}\n`);
    return;
  }
  fail(`unsupported mock redcube python helper: ${invocation.helper || '(missing)'}`);
}

main();
