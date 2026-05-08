// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const repoRoot = process.cwd();

function readText(file) {
  return readFileSync(file, 'utf-8');
}

test('legacy redcube-agent/workbench runtime path is removed from active code and tests', () => {
  const rootPackage = JSON.parse(readText(path.join(repoRoot, 'package.json')));
  const removedRootTests = [
    'agent-workflow.test.js',
    'production-path-cutover.test.js',
    'llm-prompts.test.js',
    'llm-runtime-config.test.ts',
    'toc-parser.test.js',
    'import-legacy-project.test.js',
  ];
  const removedPackages = [
    'redcube-agent',
    'redcube-domain',
    'redcube-memory',
    'redcube-llm',
    'redcube-tools',
    'redcube-overlay-paper-poster',
  ];

  assert.equal(rootPackage.name, 'redcube-ai-mono');
  assert.equal(Boolean(rootPackage.optionalDependencies?.['@mariozechner/pi-ai']), false);
  assert.equal(Boolean(rootPackage.optionalDependencies?.['@mariozechner/pi-agent-core']), false);
  assert.equal(Boolean(rootPackage.dependencies?.['@redcube/llm']), false);
  assert.equal(Boolean(rootPackage.dependencies?.['@redcube/tools']), false);
  assert.equal(Boolean(rootPackage.dependencies?.['@redcube/overlay-paper-poster']), false);

  for (const file of removedRootTests) {
    assert.equal(existsSync(path.join(repoRoot, 'tests', file)), false, file);
  }
  for (const packageDir of removedPackages) {
    assert.equal(existsSync(path.join(repoRoot, 'packages', packageDir)), false, packageDir);
  }
  assert.equal(existsSync(path.join(repoRoot, 'packages', 'redcube-gateway', 'src', 'actions', 'import-legacy-project.js')), false);
  assert.equal(existsSync(path.join(repoRoot, '.redcube_pi', 'workbench')), false);
});
