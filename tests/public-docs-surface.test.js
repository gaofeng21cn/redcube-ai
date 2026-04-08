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

test('public docs describe Deep Research as Source Readiness enhancement on an auto-first 5-step line', () => {
  const rootReadme = readFileSync(path.join(repoRoot, 'README.md'), 'utf-8');
  const rootReadmeZh = readFileSync(path.join(repoRoot, 'README.zh-CN.md'), 'utf-8');
  const quickstart = readFileSync(path.join(repoRoot, 'docs', 'human_quickstart.md'), 'utf-8');

  assert.equal(rootReadme.includes('`Deep Research` belongs to `Source Readiness`'), true);
  assert.equal(rootReadmeZh.includes('`Deep Research` 属于 `Source Readiness`'), true);
  assert.equal(quickstart.includes('`Source Readiness -> Storyline -> Plan -> Visual -> Delivery`'), true);
  assert.equal(quickstart.includes('可以在任意大步骤边界介入'), true);
  assert.equal(quickstart.includes('循环式 Review Gate'), true);
});
