import test from 'node:test';
import assert from 'node:assert/strict';

import { readRepoFile, readRepoJson } from './shared.js';

test('native PPT Linux proof environment is documented without adding a desktop-app fallback', () => {
  const dockerfile = readRepoFile('tools/native-ppt-proof/Dockerfile');
  const workflow = readRepoFile('.github/workflows/ci.yml');
  const installScript = readRepoFile('tools/native-ppt-proof/install-deps.sh');
  const runner = readRepoFile('tools/native-ppt-proof/run.sh');

  for (const source of [dockerfile, installScript]) {
    assert.match(source, /libreoffice/);
    assert.match(source, /poppler-utils|Poppler/);
    assert.match(source, /fonts-noto-cjk/);
  }
  assert.match(installScript, /iOfficeAI\/OfficeCLI\/releases\/download\/\$version\/\$asset/);
  assert.match(installScript, /version="v1\.0\.100"/);
  assert.match(installScript, /sha256sum|shasum -a 256/);
  assert.match(installScript, /officecli --version/);

  assert.match(runner, /LibreOffice\/Poppler/);
  assert.match(runner, /tools\/native-ppt-proof\/install-deps\.sh/);
  assert.match(runner, /renderer_auto_install=1/);
  assert.match(runner, /\$HOME\/\.local\/bin:\$PATH/);
  assert.match(runner, /proof_tmp_root="\/tmp\/rca-native-ppt-proof"/);
  assert.match(runner, /PYTHONDONTWRITEBYTECODE=1/);
  assert.match(runner, /PYTHONPYCACHEPREFIX="\$proof_cache_root\/pycache"/);
  assert.match(runner, /cache_dir=\$proof_cache_root\/pytest-cache/);
  assert.match(runner, /UV_PROJECT_ENVIRONMENT="\$proof_cache_root\/uv-project-venv"/);
  assert.match(runner, /REDCUBE_NATIVE_PPT_RENDERER_AUTO_INSTALL="\$renderer_auto_install"/);
  assert.match(workflow, /tools\/native-ppt-proof\/run\.sh --output-dir artifacts\/native-ppt-proof/);
  assert.match(installScript, /brew install --cask libreoffice/);
  assert.match(installScript, /brew install poppler/);
  assert.match(installScript, /apt-get install -y --no-install-recommends libreoffice poppler-utils fonts-noto-cjk/);
  assert.match(runner, /tools\/native-ppt-proof\/install-deps\.sh/);
  assert.match(runner, /redcube_ai\.native_helpers\.doctor/);
  assert.match(runner, /redcube_ai\.native_helpers\.ppt_deck\.native/);
  assert.match(runner, /opl_agent_package_manifest\.json/);
  assert.match(runner, /python-native-helper-catalog\.json/);
  assert.doesNotMatch(runner, /redcube-domain-entry|product-manifest\.json|product-status\.json/);
  assert.match(runner, /native-helper-output\.json/);
  assert.match(runner, /native-package-readback\.json/);
  assert.match(runner, /native-quality-verdict\.json/);
  assert.match(runner, /redcube_ai\.native_helpers\.ppt_deck\.native_package/);
  assert.doesNotMatch(runner, /tools\/native-ppt-proof\/read-package\.py/);
  assert.match(runner, /tools\/native-ppt-proof\/evaluate-quality\.ts/);
  assert.match(runner, /proof-summary\.json/);
  assert.match(runner, /artifact-index\.json/);
  assert.match(runner, /proof-artifact-index\.ts --profile native-ppt/);
  assert.match(runner, /tools\/resolve-proof-python\.ts/);
  assert.match(runner, /suite_id"\)\s*==\s*"data_charts"|suite_id/);
  assert.match(runner, /synthetic_preview/);
  assert.match(dockerfile, /FROM ghcr\.io\/astral-sh\/uv:0\.9\.5 AS uv/);
  assert.match(dockerfile, /COPY --from=uv \/uv \/uvx \/bin\//);
  assert.match(dockerfile, /COPY pyproject\.toml uv\.lock/);
  assert.match(dockerfile, /PYTHONPATH=\/workspace\/python/);
  assert.match(dockerfile, /PYTHONDONTWRITEBYTECODE=1/);
  assert.match(dockerfile, /REDCUBE_NATIVE_PPT_PROOF_PYTHON=\/opt\/redcube-venv\/bin\/python/);
  assert.match(dockerfile, /uv sync --locked --no-dev --extra native --no-install-project --python \/usr\/bin\/python3/);
  assert.doesNotMatch(dockerfile, /pip install|requirements\/ci-python\.txt/);
  assert.doesNotMatch(runner, /PIP_CACHE_DIR/);
  assert.match(dockerfile, /iOfficeAI\/OfficeCLI\/releases\/download\/v1\.0\.100\/officecli-linux-x64/);
  assert.match(dockerfile, /sha256sum -c -/);
  for (const source of [dockerfile, runner]) {
    assert.doesNotMatch(source, new RegExp(['powerpoint', '_applescript'].join(''), 'i'));
    assert.doesNotMatch(source, new RegExp(['osa', 'script'].join(''), 'i'));
  }
});

test('native PPT proof V2 contract is ready for opt-in CI triggers and cache policy', () => {
  const contract = readRepoJson('tools/native-ppt-proof/ci-contract.json');
  const laneContract = readRepoJson('contracts/runtime-program/ppt-native-authoring-proof-lane.json');
  const runner = readRepoFile('tools/native-ppt-proof/run.sh');
  const workflow = readRepoFile('.github/workflows/ci.yml');

  assert.equal(contract.schema_version, 'native_ppt_proof_ci_contract.v2');
  assert.equal(contract.default_quality_lane.runs_true_renderer, false);
  assert.deepEqual(contract.default_quality_lane.required_workflow_events, ['push', 'pull_request']);
  assert.equal(contract.proof_job.required_triggers.manual, 'workflow_dispatch');
  assert.equal(contract.proof_job.required_triggers.nightly.event, 'schedule');
  assert.match(contract.proof_job.required_triggers.nightly.cron, /^\d+ \d+ \* \* \*$/);
  assert.equal(contract.proof_job.required_triggers.pull_request_label.label, 'native-ppt-proof');
  assert.deepEqual(
    contract.proof_job.required_triggers.pull_request_label.types,
    ['labeled', 'synchronize', 'opened', 'reopened'],
  );
  assert.deepEqual(
    contract.proof_job.required_cache_layers.map((layer) => layer.id),
    ['npm', 'uv', 'playwright'],
  );
  assert.equal(contract.proof_job.required_cache_layers[1].uses, 'astral-sh/setup-uv');
  assert.equal(contract.proof_job.artifact_index.path, 'artifacts/native-ppt-proof/artifact-index.json');
  assert.equal(contract.proof_job.artifact_index.schema_version, 'native_ppt_proof_artifact_index.v2');
  assert.equal(laneContract.candidate_route_model.default_enabled, false);
  assert.deepEqual(laneContract.candidate_route_model.runnable_routes, ['author_pptx_native', 'repair_pptx_native']);
  assert.match(runner, /ppt-native-authoring-proof-lane\.json/);
  assert.match(runner, /candidate_route_model/);
  assert.match(workflow, /github\.event_name == 'schedule'/);
  assert.match(workflow, /contains\(github\.event\.pull_request\.labels\.\*\.name, 'native-ppt-proof'\)/);
  assert.match(workflow, /native-ppt-proof:\n[\s\S]*?uses:\s*astral-sh\/setup-uv@v7[\s\S]*?enable-cache:\s*true[\s\S]*?cache-dependency-glob:\s*['"]uv\.lock['"]/);
  assert.match(workflow, /native-ppt-proof-playwright-\$\{\{ runner\.os \}\}-\$\{\{ hashFiles\('uv\.lock'\) \}\}/);
  assert.match(runner, /artifact-index\.json/);
  assert.match(runner, /proof-artifact-index\.ts --profile native-ppt/);
  assert.doesNotMatch(
    workflow,
    /quality:\n[\s\S]*?tools\/native-ppt-proof\/run\.sh[\s\S]*?Run family tests/,
  );
  assert.doesNotMatch(
    workflow,
    /quality:\n[\s\S]*?tools\/image-ppt-proof\/run\.sh[\s\S]*?Run family tests/,
  );
});
