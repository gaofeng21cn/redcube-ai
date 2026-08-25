import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync } from 'node:fs';

import { readRepoFile, repoRoot } from './shared.js';

test('source CI runs the default quality lane without native renderer dependencies', () => {
  assert.equal(existsSync(path.join(repoRoot, '.nvmrc')), true);
  assert.equal(existsSync(path.join(repoRoot, 'package-lock.json')), true);

  const workflow = readRepoFile('.github/workflows/ci.yml');
  assert.match(workflow, /uses:\s*actions\/checkout@[0-9a-f]{40}(?:\s+# v7\.0\.1)?/);
  assert.match(workflow, /uses:\s*actions\/setup-node@[0-9a-f]{40}(?:\s+# v7\.0\.0)?/);
  assert.match(workflow, /node-version-file:\s*['"]?\.nvmrc['"]?/);
  assert.match(workflow, /cache:\s*['"]?npm['"]?/);
  assert.match(workflow, /\bnpm ci\b/);
  assert.match(workflow, /source:\n[\s\S]*?uses:\s*actions\/setup-python@[0-9a-f]{40}(?:\s+# v7\.0\.0)?[\s\S]*?scripts\/verify\.sh ci/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /schedule:|native-ppt-proof:|image-ppt-proof:|one-person-lab/);
  assert.doesNotMatch(workflow, /path:\s*~\/\.cache\/uv/);
  assert.doesNotMatch(workflow, /\n\s{2}integration:\n/);
  assert.doesNotMatch(workflow, /\n\s{2}render-e2e:\n/);
  assert.doesNotMatch(
    workflow,
    /setup-uv|uv sync|--extra native|UV_PROJECT_ENVIRONMENT|REDCUBE_PYTHON_COMMAND/,
  );
});
