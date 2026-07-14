// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

import { mkUserScopedTestWorkspace } from '../../tests/helpers/test-workspace.js';

const repoRoot = process.cwd();
function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf-8'));
}

function writeJson(filePath, payload) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
}

function createProofOutput({
  summaryOverrides = {},
  previewCount = 6,
} = {}) {
  const outputDir = mkUserScopedTestWorkspace('redcube-native-ppt-index-');
  const nativeDir = path.join(outputDir, 'native-helper');
  const previewDir = path.join(nativeDir, 'previews');
  const pptxFile = path.join(nativeDir, 'benchmark-author.pptx');
  const pdfFile = path.join(nativeDir, 'benchmark-author.pdf');
  const shapeManifestFile = path.join(nativeDir, 'benchmark-shape-manifest.json');
  const previewFiles = Array.from(
    { length: Math.max(6, previewCount) },
    (_, index) => path.join(previewDir, `slide-${String(index + 1).padStart(2, '0')}.png`),
  );

  mkdirSync(previewDir, { recursive: true });
  writeFileSync(pptxFile, 'pptx');
  writeFileSync(pdfFile, 'pdf');
  writeJson(shapeManifestFile, { status: 'completed' });
  for (const previewFile of previewFiles) {
    writeFileSync(previewFile, 'png');
  }

  const helper = {
    status: 'completed',
    page_count: 6,
    pptx_file: pptxFile,
    pdf_file: pdfFile,
    shape_manifest_file: shapeManifestFile,
    render_proof: {
      renderer_pipeline: 'libreoffice_headless_pdf_png_v1',
      slide_count: 6,
      preview_screenshots: previewFiles.slice(0, previewCount),
    },
  };
  const nativeHelperSummary = {
    page_count: 6,
    renderer_pipeline: 'libreoffice_headless_pdf_png_v1',
    preview_screenshots: previewFiles.slice(0, previewCount),
    ...(summaryOverrides.native_helper || {}),
  };
  const summary = {
    status: 'passed',
    doctor_status: 'ok',
    native_helper: nativeHelperSummary,
    native_package_readback: {
      slide_count: 6,
    },
    native_quality_verdict: {
      status: 'pass_candidate',
    },
    ...summaryOverrides,
    native_helper: nativeHelperSummary,
  };

  for (const report of [
    'doctor.json',
    'agent-package-manifest.json',
    'native-helper-catalog.json',
    'native-helper-input.json',
    'native-package-readback.json',
    'native-quality-verdict.json',
  ]) {
    writeJson(path.join(outputDir, report), { status: 'completed' });
  }
  writeJson(path.join(outputDir, 'native-helper-output.json'), helper);
  writeJson(path.join(outputDir, 'proof-summary.json'), summary);

  return {
    outputDir,
    helper,
    run() {
      const indexFile = path.join(outputDir, 'artifact-index.json');
      const result = spawnSync(
        process.execPath,
        [
          '--experimental-strip-types',
          'tools/proof-artifact-index.ts',
          '--profile',
          'native-ppt',
          '--output-dir',
          outputDir,
          '--index-file',
          indexFile,
        ],
        { cwd: repoRoot, encoding: 'utf-8' },
      );
      assert.equal(result.error, undefined, result.error?.message);
      assert.equal(result.signal, null, result.stderr || result.stdout);
      assert.equal(existsSync(indexFile), true, result.stderr || result.stdout);
      return {
        result,
        index: JSON.parse(readFileSync(indexFile, 'utf-8')),
      };
    },
  };
}

test('native PPT proof artifact index fails when proof summary already failed', () => {
  const proof = createProofOutput({ summaryOverrides: { status: 'failed' } });
  const { result, index } = proof.run();

  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(index.status, 'failed');
  assert.deepEqual(index.missing_required_artifacts, []);
  assert.deepEqual(index.failed_required_checks, ['proof_summary_status']);
});

test('native PPT proof artifact index retains and rejects undeclared native artifacts', () => {
  const proof = createProofOutput();
  delete proof.helper.pptx_file;
  delete proof.helper.pdf_file;
  delete proof.helper.shape_manifest_file;
  writeJson(path.join(proof.outputDir, 'native-helper-output.json'), proof.helper);

  const { result, index } = proof.run();

  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(index.status, 'failed');
  assert.deepEqual(index.missing_required_artifacts, [
    'editable_pptx',
    'rendered_pdf',
    'shape_manifest_json',
  ]);
  assert.equal(index.retention_contract.required_artifact_ids.includes('editable_pptx'), true);
  assert.equal(index.retention_contract.required_artifact_ids.includes('rendered_pdf'), true);
  assert.equal(index.retention_contract.required_artifact_ids.includes('shape_manifest_json'), true);
});

test('native PPT proof artifact index requires exactly six declared previews', () => {
  const underflowProof = createProofOutput({ previewCount: 5 });
  const { result, index } = underflowProof.run();

  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(index.status, 'failed');
  assert.deepEqual(index.missing_required_artifacts, ['preview_png_06']);
  assert.deepEqual(index.failed_required_checks, ['preview_png_count']);
  assert.equal(index.retention_contract.required_artifact_ids.includes('preview_png_06'), true);

  const overflowProof = createProofOutput({ previewCount: 7 });
  const overflow = overflowProof.run();

  assert.equal(overflow.result.status, 1, overflow.result.stderr || overflow.result.stdout);
  assert.equal(overflow.index.status, 'failed');
  assert.deepEqual(overflow.index.missing_required_artifacts, []);
  assert.deepEqual(overflow.index.failed_required_checks, ['preview_png_count']);
  assert.equal(overflow.index.retention_contract.required_artifact_ids.includes('preview_png_07'), false);
});

test('native PPT proof artifact index rejects duplicate helper refs and summary drift', () => {
  const proof = createProofOutput();
  proof.helper.render_proof.preview_screenshots.push(
    proof.helper.render_proof.preview_screenshots[0],
  );
  writeJson(path.join(proof.outputDir, 'native-helper-output.json'), proof.helper);
  const summaryFile = path.join(proof.outputDir, 'proof-summary.json');
  const summary = JSON.parse(readFileSync(summaryFile, 'utf-8'));
  summary.native_helper.preview_screenshots = [];
  writeJson(summaryFile, summary);

  const { result, index } = proof.run();

  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(index.status, 'failed');
  assert.deepEqual(index.missing_required_artifacts, []);
  assert.deepEqual(index.failed_required_checks, [
    'preview_png_count',
    'preview_png_unique',
    'preview_summary_binding',
  ]);
  assert.equal(index.retention_contract.preview_png_count, 7);
  assert.equal(index.retention_contract.preview_png_unique_count, 6);
  assert.equal(index.retention_contract.summary_preview_png_count, 0);
  assert.equal(index.retention_contract.preview_summary_bound, false);
});

test('native PPT proof artifact index consumes renderer, page, slide, and quality candidate state', () => {
  const proof = createProofOutput({
    summaryOverrides: {
      native_helper: {
        page_count: 5,
        renderer_pipeline: 'synthetic_preview_v1',
      },
      native_package_readback: {
        slide_count: 4,
      },
      native_quality_verdict: {
        status: 'route_back_candidate',
      },
    },
  });
  const { result, index } = proof.run();

  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(index.status, 'failed');
  assert.deepEqual(index.missing_required_artifacts, []);
  assert.deepEqual(index.failed_required_checks, [
    'renderer_pipeline',
    'native_helper_page_count',
    'native_package_slide_count',
    'native_quality_verdict_status',
  ]);
});

test('native PPT proof CI contract keeps true renderer out of default quality and defines opt-in proof triggers', () => {
  const contract = readJson('tools/native-ppt-proof/ci-contract.json');

  assert.equal(contract.schema_version, 'native_ppt_proof_ci_contract.v2');
  assert.equal(contract.default_quality_lane.runs_true_renderer, false);
  assert.deepEqual(contract.default_quality_lane.required_workflow_events, ['push', 'pull_request']);
  assert.equal(contract.proof_job.runs_true_renderer, true);
  assert.equal(contract.proof_job.required_triggers.manual, 'workflow_dispatch');
  assert.equal(contract.proof_job.required_triggers.nightly.event, 'schedule');
  assert.equal(contract.proof_job.required_triggers.pull_request_label.label, 'native-ppt-proof');
  assert.deepEqual(
    contract.proof_job.required_triggers.pull_request_label.types,
    ['labeled', 'synchronize', 'opened', 'reopened'],
  );
  assert.equal(contract.proof_job.artifact_index.path, 'artifacts/native-ppt-proof/artifact-index.json');
  assert.equal(contract.proof_job.artifact_index.required, true);
  assert.deepEqual(
    contract.proof_job.required_cache_layers.map((layer) => layer.id),
    ['npm', 'uv', 'playwright'],
  );
});
