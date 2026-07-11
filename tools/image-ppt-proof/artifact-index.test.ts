// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';

const repoRoot = process.cwd();

test('image PPT proof runner mock mode emits every retained artifact without a real API', () => {
  const outputDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-image-ppt-proof-'));
  const result = spawnSync(
    'tools/image-ppt-proof/run.sh',
    ['--output-dir', outputDir, '--mock-image-generation', '--skip-system-deps'],
    {
      cwd: repoRoot,
      encoding: 'utf-8',
      env: {
        ...process.env,
        OPENAI_API_KEY: '',
        REDCUBE_CODEX_RESPONSES_IMAGE_GENERATION_CMD: '',
      },
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);

  const index = JSON.parse(readFileSync(path.join(outputDir, 'artifact-index.json'), 'utf-8'));
  const requiredIds = new Set(index.retention_contract.required_artifact_ids);
  const artifactIds = new Set(index.artifacts.map((artifact) => artifact.artifact_id));
  const imageManifest = JSON.parse(readFileSync(path.join(outputDir, 'image-manifest.json'), 'utf-8'));
  const promptManifest = JSON.parse(readFileSync(path.join(outputDir, 'prompt-manifest.json'), 'utf-8'));
  const styleManifest = JSON.parse(readFileSync(path.join(outputDir, 'style-manifest.json'), 'utf-8'));
  const reviewSummary = JSON.parse(readFileSync(path.join(outputDir, 'review', 'review-summary.json'), 'utf-8'));
  const finalGalleryManifest = JSON.parse(readFileSync(path.join(outputDir, 'gallery', 'final-gallery-manifest.json'), 'utf-8'));
  const exportBundle = JSON.parse(readFileSync(path.join(outputDir, 'export', 'export-bundle.json'), 'utf-8'));

  assert.equal(index.schema_version, 'image_ppt_proof_artifact_index.v1');
  assert.equal(index.status, 'passed');
  assert.deepEqual(index.missing_required_artifacts, []);
  assert.equal(index.retention_contract.image_generation_mode, 'mock');
  assert.equal(index.retention_contract.png_count, 4);
  assert.equal(promptManifest.fixture_id, 'ppt_image_first_lightweight_real_style_smoke_v1');
  assert.equal(promptManifest.prompts.length <= 6, true);
  assert.equal(promptManifest.prompts.length, 4);
  assert.equal(imageManifest.uses_real_api, false);
  assert.equal(imageManifest.fixture_id, 'ppt_image_first_lightweight_real_style_smoke_v1');
  assert.equal(imageManifest.images.length, 4);
  assert.deepEqual(
    imageManifest.images.map((image) => image.dimensions),
    Array.from({ length: 4 }, () => ({ width: 1536, height: 864, ratio: '16:9' })),
  );
  assert.equal(styleManifest.schema_version, 'image_ppt_style_manifest.v1');
  assert.equal(styleManifest.fixture_id, 'ppt_image_first_lightweight_real_style_smoke_v1');
  assert.equal(styleManifest.style_reference_dir, undefined);
  assert.equal(styleManifest.external_style_reference_dir, undefined);
  assert.equal(styleManifest.style_references.length, 1);
  for (const reference of styleManifest.style_references) {
    assert.match(reference.filename, /^[^/]+\.png$/);
    assert.match(reference.sha256, /^[a-f0-9]{64}$/);
    assert.deepEqual(reference.dimensions, { width: 1536, height: 864, ratio: '16:9' });
    assert.match(reference.artifact_copy, /^style-references\/[^/]+\.png$/);
  }
  assert.equal(reviewSummary.status, 'passed');
  assert.equal(reviewSummary.image_count, 4);
  assert.equal(reviewSummary.style_reference_count, 1);
  assert.equal(finalGalleryManifest.status, 'ready');
  assert.equal(finalGalleryManifest.items.length, 4);
  assert.equal(exportBundle.source_visual_route, 'author_image_pages');
  assert.equal(exportBundle.editable, false);

  for (const artifactId of [
    'run_manifest_json',
    'prompt_manifest_json',
    'image_manifest_json',
    'style_manifest_json',
    'review_summary_json',
    'proof_summary_json',
    'generated_png_01',
    'generated_png_02',
    'generated_png_03',
    'generated_png_04',
    'style_reference_png_01',
    'image_first_pptx',
    'rendered_pdf',
    'export_bundle_json',
    'gallery_json',
    'gallery_final_manifest_json',
    'final_delivery_manifest_json',
  ]) {
    assert.equal(requiredIds.has(artifactId), true, `${artifactId} must be retained`);
  }
  assert.deepEqual(artifactIds, requiredIds);

  for (const artifact of index.artifacts) {
    assert.equal(artifact.required, true);
    assert.equal(artifact.exists, true);
    assert.match(artifact.relative_path, /^[^/].+/);
    assert.match(artifact.sha256, /^[a-f0-9]{64}$/);
  }
});
