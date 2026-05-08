// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const repoRoot = process.cwd();

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf-8'));
}

test('native PPT proof artifact index fixture preserves every proof surface', () => {
  const index = readJson('tools/native-ppt-proof/artifact-index-fixture.json');
  const requiredIds = new Set(index.retention_contract.required_artifact_ids);
  const artifactIds = new Set(index.artifacts.map((artifact) => artifact.artifact_id));

  assert.equal(index.schema_version, 'native_ppt_proof_artifact_index.v2');
  assert.equal(index.status, 'passed');
  assert.deepEqual(index.missing_required_artifacts, []);
  assert.equal(index.retention_contract.preview_png_count, 6);
  assert.equal(index.retention_contract.renderer_pipeline, 'libreoffice_headless_pdf_png_v1');

  for (const artifactId of [
    'doctor_json',
    'product_manifest_json',
    'product_status_json',
    'native_helper_output_json',
    'proof_summary_json',
    'editable_pptx',
    'rendered_pdf',
    'shape_manifest_json',
    'preview_png_01',
    'preview_png_06',
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
    ['npm', 'pip', 'playwright'],
  );
});
