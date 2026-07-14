import test from 'node:test';
import assert from 'node:assert/strict';

import { readRepoFile, readRepoJson } from './shared.js';

test('image PPT proof optional CI lane never runs live image generation by default', () => {
  const contract = readRepoJson('tools/image-ppt-proof/ci-contract.json');
  const runner = readRepoFile('tools/image-ppt-proof/run.sh');
  const proofImplementation = readRepoFile('tools/image-ppt-proof/run-proof.py');
  const workflow = readRepoFile('.github/workflows/ci.yml');

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
    ['npm', 'uv', 'playwright'],
  );
  assert.equal(contract.proof_job.required_cache_layers[1].key_source, 'uv.lock');
  assert.deepEqual(
    contract.proof_job.required_artifact_refs,
    [
      'generated_png',
      'run_manifest_json',
      'prompt_manifest_json',
      'image_manifest_json',
      'image_first_pptx',
      'rendered_pdf',
      'export_bundle_json',
      'gallery_json',
      'final_delivery_manifest_json',
    ],
  );
  assert.match(workflow, /image-ppt-proof:\n[\s\S]*?github\.event_name == 'schedule'/);
  assert.match(workflow, /contains\(github\.event\.pull_request\.labels\.\*\.name, 'image-ppt-proof'\)/);
  assert.match(workflow, /tools\/image-ppt-proof\/run\.sh --output-dir artifacts\/image-ppt-proof --mock-image-generation/);
  assert.doesNotMatch(workflow, /tools\/image-ppt-proof\/run\.sh[^\n]*--live-image-generation/);
  assert.match(workflow, /name:\s*image-ppt-proof[\s\S]*?artifacts\/image-ppt-proof\/artifact-index\.json/);
  assert.match(runner, /--mock-image-generation/);
  assert.doesNotMatch(runner, /--live-image-generation/);
  assert.match(runner, /never invokes an executor or a real image API/);
  assert.match(runner, /OPL-hosted run_image_ppt_proof StageRun action/);
  assert.doesNotMatch(proofImplementation, /codex_native_imagegen_skill|OPENAI_API_KEY|experimental_bearer_token/);
  assert.doesNotMatch(proofImplementation, /mode\s*==\s*["']live["']/);
  assert.match(proofImplementation, /prompt-manifest\.json/);
  assert.match(proofImplementation, /final-delivery-manifest\.json/);
});
