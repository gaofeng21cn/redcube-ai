import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync } from 'node:fs';

const repoRoot = process.cwd();

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
