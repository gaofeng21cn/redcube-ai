import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync } from 'node:fs';

import { readRepoFile, repoRoot } from './shared.js';

test('CI workflow pins reproducible toolchain and keeps hosted CI on the honest quality lane', () => {
  assert.equal(existsSync(path.join(repoRoot, '.nvmrc')), true);
  assert.equal(existsSync(path.join(repoRoot, 'package-lock.json')), true);
  assert.equal(existsSync(path.join(repoRoot, 'pyproject.toml')), true);
  assert.equal(existsSync(path.join(repoRoot, 'uv.lock')), true);
  assert.equal(existsSync(path.join(repoRoot, '.github', 'requirements', 'ci-python.txt')), false);

  const workflow = readRepoFile('.github/workflows/ci.yml');
  assert.match(workflow, /uses:\s*actions\/checkout@v6\b/);
  assert.match(workflow, /uses:\s*actions\/setup-node@v6\b/);
  assert.match(workflow, /node-version-file:\s*['"]?\.nvmrc['"]?/);
  assert.match(workflow, /cache:\s*['"]?npm['"]?/);
  assert.match(workflow, /\brun:\s*npm ci\b/);
  assert.match(workflow, /quality:\n[\s\S]*?uses:\s*actions\/setup-python@v6\b[\s\S]*?python-version:\s*['"]3\.12['"][\s\S]*?uses:\s*astral-sh\/setup-uv@v7\b[\s\S]*?uv sync --locked --no-dev --extra native --no-install-project --python 3\.12[\s\S]*?REDCUBE_PYTHON_COMMAND=\$UV_PROJECT_ENVIRONMENT\/bin\/python[\s\S]*?npm run typecheck[\s\S]*?node scripts\/run-test-group\.ts fast[\s\S]*?node scripts\/run-test-group\.ts family[\s\S]*?node scripts\/run-test-group\.ts meta:ci/);
  assert.doesNotMatch(workflow, /quality:\n[\s\S]*?run:\s*npm run test:ci/);
  assert.doesNotMatch(workflow, /quality:\n[\s\S]*?python3 -m playwright install --with-deps chromium[\s\S]*?Run build and typecheck/);
  assert.doesNotMatch(workflow, /Run meta tests\n\s+run:\s*node scripts\/run-test-group\.ts meta\n/);
  assert.doesNotMatch(workflow, /quality:\n[\s\S]*?tools\/native-ppt-proof\/install-deps\.sh[\s\S]*?Run build and typecheck/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /schedule:\n\s+- cron:\s*['"]17 19 \* \* \*['"]/);
  assert.match(workflow, /pull_request:\n\s+types:\s+\[opened, synchronize, reopened, labeled\]/);
  assert.match(workflow, /native-ppt-proof:\n[\s\S]*?github\.event_name == 'workflow_dispatch'[\s\S]*?github\.event_name == 'schedule'[\s\S]*?native-ppt-proof[\s\S]*?uses:\s*astral-sh\/setup-uv@v7[\s\S]*?uses:\s*actions\/cache@v5[\s\S]*?path:\s*~\/\.cache\/uv[\s\S]*?uses:\s*actions\/cache@v5[\s\S]*?path:\s*~\/\.cache\/ms-playwright[\s\S]*?uv sync --locked --no-dev --extra native --no-install-project --python 3\.12[\s\S]*?tools\/native-ppt-proof\/run\.sh --output-dir artifacts\/native-ppt-proof[\s\S]*?uses:\s*actions\/upload-artifact@v7[\s\S]*?name:\s*native-ppt-proof[\s\S]*?artifacts\/native-ppt-proof\/artifact-index\.json/);
  assert.match(workflow, /image-ppt-proof:\n[\s\S]*?github\.event_name == 'workflow_dispatch'[\s\S]*?github\.event_name == 'schedule'[\s\S]*?image-ppt-proof[\s\S]*?uses:\s*astral-sh\/setup-uv@v7[\s\S]*?uses:\s*actions\/cache@v5[\s\S]*?path:\s*~\/\.cache\/uv[\s\S]*?uses:\s*actions\/cache@v5[\s\S]*?path:\s*~\/\.cache\/ms-playwright[\s\S]*?uv sync --locked --no-dev --extra native --no-install-project --python 3\.12[\s\S]*?tools\/image-ppt-proof\/run\.sh --output-dir artifacts\/image-ppt-proof --mock-image-generation[\s\S]*?uses:\s*actions\/upload-artifact@v7[\s\S]*?name:\s*image-ppt-proof[\s\S]*?artifacts\/image-ppt-proof\/artifact-index\.json/);
  assert.doesNotMatch(workflow, /\n\s{2}integration:\n/);
  assert.doesNotMatch(workflow, /\n\s{2}render-e2e:\n/);

  assert.doesNotMatch(workflow, /python3 -m pip|requirements\/ci-python\.txt|\.cache\/pip/);
  const lock = readRepoFile('uv.lock');
  assert.match(lock, /name = "playwright"\nversion = "1\.59\.0"/);
  assert.match(lock, /name = "python-pptx"\nversion = "1\.0\.2"/);
  assert.match(lock, /name = "pillow"\nversion = "12\.2\.0"/);
});
