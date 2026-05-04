// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';

const repoRoot = process.cwd();

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf-8'));
}

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
  const exportBundle = JSON.parse(readFileSync(path.join(outputDir, 'export', 'export-bundle.json'), 'utf-8'));

  assert.equal(index.schema_version, 'image_ppt_proof_artifact_index.v1');
  assert.equal(index.status, 'passed');
  assert.deepEqual(index.missing_required_artifacts, []);
  assert.equal(index.retention_contract.image_generation_mode, 'mock');
  assert.equal(index.retention_contract.png_count, 6);
  assert.equal(imageManifest.uses_real_api, false);
  assert.equal(imageManifest.images.length, 6);
  assert.deepEqual(
    imageManifest.images.map((image) => image.dimensions),
    Array.from({ length: 6 }, () => ({ width: 1536, height: 864, ratio: '16:9' })),
  );
  assert.equal(exportBundle.source_visual_route, 'author_image_pages');
  assert.equal(exportBundle.editable, false);

  for (const artifactId of [
    'run_manifest_json',
    'prompt_manifest_json',
    'image_manifest_json',
    'proof_summary_json',
    'generated_png_01',
    'generated_png_02',
    'generated_png_03',
    'generated_png_04',
    'generated_png_05',
    'generated_png_06',
    'image_first_pptx',
    'rendered_pdf',
    'export_bundle_json',
    'gallery_json',
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

test('image PPT proof CI contract keeps real image generation opt-in', () => {
  const contract = readJson('tools/image-ppt-proof/ci-contract.json');

  assert.equal(contract.schema_version, 'image_ppt_proof_ci_contract.v1');
  assert.equal(contract.default_quality_lane.runs_real_image_generation, false);
  assert.deepEqual(contract.default_quality_lane.required_workflow_events, ['push', 'pull_request']);
  assert.equal(contract.proof_job.runs_real_image_generation_by_default, false);
  assert.equal(contract.proof_job.required_triggers.manual, 'workflow_dispatch');
  assert.equal(contract.proof_job.required_triggers.nightly.event, 'schedule');
  assert.equal(contract.proof_job.required_triggers.pull_request_label.label, 'image-ppt-proof');
  assert.deepEqual(
    contract.proof_job.required_triggers.pull_request_label.types,
    ['labeled', 'synchronize', 'opened', 'reopened'],
  );
  assert.equal(contract.proof_job.artifact_index.path, 'artifacts/image-ppt-proof/artifact-index.json');
  assert.equal(contract.proof_job.artifact_index.schema_version, 'image_ppt_proof_artifact_index.v1');
  assert.equal(contract.proof_job.artifact_index.required, true);
  assert.deepEqual(
    contract.proof_job.required_cache_layers.map((layer) => layer.id),
    ['npm', 'pip', 'playwright'],
  );
});
