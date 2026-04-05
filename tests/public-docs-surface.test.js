import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const repoRoot = process.cwd();

test('public docs surface does not retain a root guides entrypoint', () => {
  assert.equal(existsSync(path.join(repoRoot, 'guides', 'README.md')), false);

  const rootReadme = readFileSync(path.join(repoRoot, 'README.md'), 'utf-8');
  const docsReadme = readFileSync(path.join(repoRoot, 'docs', 'README.md'), 'utf-8');

  assert.equal(rootReadme.includes('](guides/'), false);
  assert.equal(rootReadme.includes('](./guides/'), false);
  assert.equal(docsReadme.includes('](guides/'), false);
  assert.equal(docsReadme.includes('](./guides/'), false);
});
