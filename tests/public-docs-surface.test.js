import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const repoRoot = process.cwd();

function readText(file) {
  return readFileSync(path.join(repoRoot, file), 'utf-8');
}

test('public docs surface keeps the tracked entry files in place', () => {
  assert.equal(existsSync(path.join(repoRoot, 'guides', 'README.md')), false);
  for (const file of [
    ['README.md'],
    ['README.zh-CN.md'],
    ['docs', 'README.md'],
    ['docs', 'README.zh-CN.md'],
    ['docs', 'project.md'],
    ['docs', 'architecture.md'],
    ['docs', 'status.md'],
    ['docs', 'human_quickstart.md'],
    ['docs', 'source_augmentation_executor_contract.md'],
    ['docs', 'references', 'lightweight_product_entry_and_opl_handoff.md'],
    ['docs', 'references', 'series-doc-governance-checklist.md'],
  ]) {
    assert.equal(existsSync(path.join(repoRoot, ...file)), true, file.join('/'));
  }
});

test('public docs surface keeps the governance references tracked', () => {
  for (const file of [
    ['docs', 'invariants.md'],
    ['docs', 'decisions.md'],
    ['contracts', 'README.md'],
  ]) {
    assert.equal(existsSync(path.join(repoRoot, ...file)), true, file.join('/'));
  }
});

test('public docs surface keeps absorbed phase-2 provenance and longrun target wording out of the default docs index', () => {
  const docsReadme = readText(path.join('docs', 'README.md'));
  const docsReadmeZh = readText(path.join('docs', 'README.zh-CN.md'));

  assert.doesNotMatch(docsReadme, /absorbed phase-2 provenance|future-facing design target|Direct Delivery Longrun Target State/);
  assert.doesNotMatch(docsReadmeZh, /已吸收的 Phase 2 provenance|future-facing 目标态文档|Direct Delivery Longrun Target State/);
});
