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
  assert.match(workflow, /uses:\s*actions\/checkout@v7\b/);
  assert.match(workflow, /uses:\s*actions\/setup-node@v7\b/);
  assert.match(workflow, /node-version-file:\s*['"]?\.nvmrc['"]?/);
  assert.match(workflow, /cache:\s*['"]?npm['"]?/);
  assert.match(workflow, /\bnpm ci\b/);
  assert.match(workflow, /source:\n[\s\S]*?uses:\s*actions\/setup-python@v7\b[\s\S]*?scripts\/verify\.sh ci/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /schedule:|native-ppt-proof:|image-ppt-proof:|one-person-lab/);
  assert.doesNotMatch(workflow, /path:\s*~\/\.cache\/uv/);
  assert.doesNotMatch(workflow, /\n\s{2}integration:\n/);
  assert.doesNotMatch(workflow, /\n\s{2}render-e2e:\n/);

  assert.doesNotMatch(workflow, /python3 -m pip|requirements\/ci-python\.txt|\.cache\/pip/);
  const lock = readRepoFile('uv.lock');
  assert.match(lock, /name = "playwright"\nversion = "1\.59\.0"/);
  assert.match(lock, /name = "python-pptx"\nversion = "1\.0\.2"/);
  assert.match(lock, /name = "pillow"\nversion = "12\.3\.0"/);
});
