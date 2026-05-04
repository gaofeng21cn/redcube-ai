// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync } from 'node:fs';

import { readRepoFile, repoRoot } from './shared.ts';

test('CI workflow pins reproducible toolchain and keeps hosted CI on the honest quality lane', () => {
  assert.equal(existsSync(path.join(repoRoot, '.nvmrc')), true);
  assert.equal(existsSync(path.join(repoRoot, 'package-lock.json')), true);
  assert.equal(existsSync(path.join(repoRoot, '.github', 'requirements', 'ci-python.txt')), true);

  const workflow = readRepoFile('.github/workflows/ci.yml');
  assert.match(workflow, /uses:\s*actions\/checkout@v6\b/);
  assert.match(workflow, /uses:\s*actions\/setup-node@v6\b/);
  assert.match(workflow, /node-version-file:\s*['"]?\.nvmrc['"]?/);
  assert.match(workflow, /cache:\s*['"]?npm['"]?/);
  assert.match(workflow, /\brun:\s*npm ci\b/);
  assert.match(workflow, /quality:\n[\s\S]*?uses:\s*actions\/setup-python@v6\b[\s\S]*?python-version:\s*['"]3\.12['"][\s\S]*?python3 -m pip install -r \.github\/requirements\/ci-python\.txt[\s\S]*?npm run typecheck[\s\S]*?node --experimental-strip-types scripts\/run-test-group\.ts fast[\s\S]*?node --experimental-strip-types scripts\/run-test-group\.ts family[\s\S]*?node --experimental-strip-types scripts\/run-test-group\.ts meta:ci/);
  assert.doesNotMatch(workflow, /quality:\n[\s\S]*?python3 -m playwright install --with-deps chromium[\s\S]*?Run build and typecheck/);
  assert.doesNotMatch(workflow, /Run meta tests\n\s+run:\s*node --experimental-strip-types scripts\/run-test-group\.ts meta\n/);
  assert.doesNotMatch(workflow, /quality:\n[\s\S]*?tools\/native-ppt-proof\/install-deps\.sh[\s\S]*?Run build and typecheck/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /schedule:\n\s+- cron:\s*['"]17 19 \* \* \*['"]/);
  assert.match(workflow, /pull_request:\n\s+types:\s+\[opened, synchronize, reopened, labeled\]/);
  assert.match(workflow, /native-ppt-proof:\n[\s\S]*?github\.event_name == 'workflow_dispatch'[\s\S]*?github\.event_name == 'schedule'[\s\S]*?native-ppt-proof[\s\S]*?uses:\s*actions\/cache@v4[\s\S]*?path:\s*~\/\.cache\/pip[\s\S]*?uses:\s*actions\/cache@v4[\s\S]*?path:\s*~\/\.cache\/ms-playwright[\s\S]*?tools\/native-ppt-proof\/run\.sh --output-dir artifacts\/native-ppt-proof[\s\S]*?uses:\s*actions\/upload-artifact@v6[\s\S]*?name:\s*native-ppt-proof[\s\S]*?artifacts\/native-ppt-proof\/artifact-index\.json/);
  assert.match(workflow, /image-ppt-proof:\n[\s\S]*?github\.event_name == 'workflow_dispatch'[\s\S]*?github\.event_name == 'schedule'[\s\S]*?image-ppt-proof[\s\S]*?uses:\s*actions\/cache@v4[\s\S]*?path:\s*~\/\.cache\/pip[\s\S]*?uses:\s*actions\/cache@v4[\s\S]*?path:\s*~\/\.cache\/ms-playwright[\s\S]*?tools\/image-ppt-proof\/run\.sh --output-dir artifacts\/image-ppt-proof --mock-image-generation[\s\S]*?uses:\s*actions\/upload-artifact@v6[\s\S]*?name:\s*image-ppt-proof[\s\S]*?artifacts\/image-ppt-proof\/artifact-index\.json/);
  assert.doesNotMatch(workflow, /\n\s{2}integration:\n/);
  assert.doesNotMatch(workflow, /\n\s{2}render-e2e:\n/);

  const pythonRequirements = readRepoFile('.github/requirements/ci-python.txt');
  assert.match(pythonRequirements, /^playwright==1\.58\.0$/m);
  assert.match(pythonRequirements, /^python-pptx==1\.0\.2$/m);
  assert.match(pythonRequirements, /^Pillow==12\.1\.1$/m);
});
