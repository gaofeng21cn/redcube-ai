// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';

const repoRoot = process.cwd();

function walk(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const file = path.join(dir, entry);
    const stat = statSync(file);
    if (stat.isDirectory()) {
      walk(file, results);
    } else {
      results.push(file);
    }
  }
  return results;
}

function readText(file) {
  return readFileSync(file, 'utf-8');
}

test('legacy redcube-agent/workbench runtime path is removed from active code and tests', () => {
  const rootPackage = JSON.parse(readText(path.join(repoRoot, 'package.json')));

  assert.equal(rootPackage.name, 'redcube-ai-mono');
  assert.equal(Boolean(rootPackage.optionalDependencies?.['@mariozechner/pi-ai']), false);
  assert.equal(Boolean(rootPackage.optionalDependencies?.['@mariozechner/pi-agent-core']), false);
  assert.equal(existsSync(path.join(repoRoot, 'tests', 'agent-workflow.test.js')), false);
  assert.equal(existsSync(path.join(repoRoot, 'tests', 'production-path-cutover.test.js')), false);
  assert.equal(existsSync(path.join(repoRoot, 'tests', 'llm-prompts.test.js')), false);
  assert.equal(existsSync(path.join(repoRoot, 'tests', 'llm-runtime-config.test.ts')), false);
  assert.equal(existsSync(path.join(repoRoot, 'tests', 'toc-parser.test.js')), false);
  assert.equal(existsSync(path.join(repoRoot, 'tests', 'import-legacy-project.test.js')), false);
  assert.equal(existsSync(path.join(repoRoot, 'packages', 'redcube-agent')), false);
  assert.equal(existsSync(path.join(repoRoot, 'packages', 'redcube-domain')), false);
  assert.equal(existsSync(path.join(repoRoot, 'packages', 'redcube-memory')), false);
  assert.equal(existsSync(path.join(repoRoot, 'packages', 'redcube-llm')), false);
  assert.equal(existsSync(path.join(repoRoot, 'packages', 'redcube-tools')), false);
  assert.equal(existsSync(path.join(repoRoot, 'packages', 'redcube-overlay-paper-poster')), false);
  assert.equal(existsSync(path.join(repoRoot, 'packages', 'redcube-gateway', 'src', 'actions', 'import-legacy-project.js')), false);
  assert.equal(existsSync(path.join(repoRoot, 'docs', 'history')), false);
  assert.equal(existsSync(path.join(repoRoot, '.redcube_pi', 'workbench')), false);
  assert.equal(existsSync(path.join(repoRoot, 'guides', 'README.md')), false);

  const scopedFiles = [
    ...walk(path.join(repoRoot, 'apps')),
    ...walk(path.join(repoRoot, 'contracts')),
    ...walk(path.join(repoRoot, 'docs')),
    ...walk(path.join(repoRoot, 'packages')),
    ...walk(path.join(repoRoot, 'scripts')),
    ...walk(path.join(repoRoot, 'tests')),
    path.join(repoRoot, 'AGENTS.md'),
    path.join(repoRoot, 'README.md'),
    path.join(repoRoot, 'README.zh-CN.md'),
    path.join(repoRoot, 'package-lock.json'),
    path.join(repoRoot, 'package.json'),
  ].filter(
    (file) =>
      existsSync(file) &&
      !file.endsWith(path.join('tests', 'legacy-cleanup.test.ts')) &&
      !file.endsWith(path.join('tests', 'typescript-service-boundaries.test.ts')) &&
      !file.endsWith(path.join('tests', 'public-docs-surface.test.ts')) &&
      !file.includes(`${path.sep}docs${path.sep}superpowers${path.sep}`)
  );

  for (const file of scopedFiles) {
    const content = readText(file);
    assert.equal(content.includes('packages/redcube-agent'), false, file);
    assert.equal(content.includes('packages/redcube-llm'), false, file);
    assert.equal(content.includes('packages/redcube-tools'), false, file);
    assert.equal(content.includes('@redcube/llm'), false, file);
    assert.equal(content.includes('@redcube/tools'), false, file);
    assert.equal(content.includes('@mariozechner/pi-ai'), false, file);
    assert.equal(content.includes('@mariozechner/pi-agent-core'), false, file);
    assert.equal(content.includes('REDCUBE_LLM_MODE'), false, file);
    assert.equal(content.includes('redcube-overlay-paper-poster'), false, file);
    assert.equal(content.includes('@redcube/overlay-paper-poster'), false, file);
    assert.equal(content.includes('importLegacyProject'), false, file);
    assert.equal(content.includes('import legacy-project'), false, file);
    assert.equal(content.includes('import-legacy-project'), false, file);
    assert.equal(content.includes('outputs_pi'), false, file);
    assert.equal(content.includes('historical_intake_import'), false, file);
    assert.equal(content.includes('legacy_import'), false, file);
    assert.equal(content.includes('legacy-project.json'), false, file);
    assert.equal(content.includes('docs/history'), false, file);
    assert.equal(content.includes('workbench-models.js'), false, file);
    assert.equal(content.includes('workbench'), false, file);
    assert.equal(content.includes('.redcube_pi/workbench'), false, file);
    assert.equal(content.includes("'.redcube_pi', 'workbench'"), false, file);
    assert.equal(content.includes('runWorkflow no longer mirrors outputs into workbench truth directories'), false, file);
  }
});
