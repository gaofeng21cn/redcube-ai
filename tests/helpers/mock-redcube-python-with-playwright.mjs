#!/usr/bin/env node

import path from 'node:path';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0boAAAAASUVORK5CYII=',
  'base64',
);

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
  const matches = [...html.matchAll(/data-slide-id="([^"]+)"[^>]*data-title="([^"]*)"[^>]*data-layout-family="([^"]*)"/g)];
  if (matches.length === 0) {
    return [{ slide_id: 'S01', title: 'Slide 1', layout_family: 'default' }];
  }
  return matches.map((match, index) => ({
    slide_id: match[1] || `S${String(index + 1).padStart(2, '0')}`,
    title: match[2] || `Slide ${index + 1}`,
    layout_family: match[3] || 'default',
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
        speaker_fit_ok: true,
        edge_clearance_ok: true,
        block_content_fit_ok: true,
        title_typography_ok: true,
      },
      metrics: {
        occupied_ratio: 0.52,
        primary_points: 3,
        speaker_seconds: 60,
        overlaps: [],
        edge_clearance_failures: [],
        title_font_size: 40,
        title_line_count: 1,
        title_block_id: `title-${slide.slide_id}`,
      },
      issues: [],
      device_scale_factor: Number(args['device-scale-factor'] || 2),
      screenshot_dimensions: {
        width: 2304,
        height: 1296,
      },
    };
  });

  return {
    status: 'pass',
    slide_reviews,
    checks: {
      overflow_free: true,
      occlusion_free: true,
      visual_density_ok: true,
      speaker_fit_ok: true,
      edge_clearance_ok: true,
      block_content_fit_ok: true,
      title_typography_ok: true,
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
  const blueprintSlides = Array.isArray(input?.blueprint?.slides) && input.blueprint.slides.length > 0
    ? input.blueprint.slides
    : Array.from({ length: 6 }, (_, index) => ({
        slide_id: `S${String(index + 1).padStart(2, '0')}`,
        title: `Slide ${index + 1}`,
      }));
  ensureDir(previewDir);
  const slides = blueprintSlides.map((slide, index) => {
    const slideId = String(slide?.slide_id || `S${String(index + 1).padStart(2, '0')}`);
    const screenshotFile = path.join(previewDir, `${slideId}.png`);
    writeBinary(screenshotFile, PNG_1X1);
    return {
      slide_id: slideId,
      title: String(slide?.title || `Slide ${index + 1}`),
      layout_family: String(slide?.layout_family || 'mock_native_layout'),
      text_box_count: 2,
      shape_count: 2,
      screenshot_file: screenshotFile,
    };
  });
  writeBinary(outputPptx, Buffer.from('mock-native-pptx'));
  if (outputPdf) {
    writeBinary(outputPdf, Buffer.from('%PDF-1.4\n%mock-native\n'));
  }
  const shapeManifest = {
    schema_version: 1,
    engine_contract: engineContract,
    engine_contract_file: engineContractFile || null,
    slides,
  };
  writeText(shapeManifestFile, JSON.stringify(shapeManifest, null, 2));
  const repairLog = {
    target_slide_ids: Array.isArray(input?.repair_feedback)
      ? input.repair_feedback.map((item) => item?.slide_id).filter(Boolean)
      : [],
    consumed_review_stage: args.mode === 'repair' ? 'screenshot_review' : null,
    repair_log_file: repairLogFile || null,
  };
  if (repairLogFile) {
    writeText(repairLogFile, JSON.stringify(repairLog, null, 2));
  }
  return {
    status: 'completed',
    builder: { kind: 'mock_python_pptx_native_shapes' },
    shape_manifest_schema_version: 1,
    pptx_file: outputPptx,
    pdf_file: outputPdf || null,
    shape_manifest_file: shapeManifestFile,
    repair_log_file: repairLogFile || null,
    page_count: slides.length,
    screenshot_dimensions: { width: 2304, height: 1296 },
    preview_screenshots: slides.map((slide) => slide.screenshot_file),
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
