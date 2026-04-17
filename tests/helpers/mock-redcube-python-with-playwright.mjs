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

function main() {
  const [script, ...rest] = process.argv.slice(2);
  const basename = path.basename(String(script || ''));
  const args = parseArgs(rest);

  if (basename.endsWith('_review.py')) {
    process.stdout.write(`${JSON.stringify(buildPassReviewPayload(args))}\n`);
    return;
  }
  if (basename.endsWith('_export.py')) {
    process.stdout.write(`${JSON.stringify(buildExportPayload(args))}\n`);
    return;
  }
  fail(`unsupported mock redcube python script: ${basename || '(missing)'}`);
}

main();
