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
  assert.equal(existsSync(path.join(repoRoot, 'tests', 'agent-workflow.test.js')), false);
  assert.equal(existsSync(path.join(repoRoot, 'tests', 'production-path-cutover.test.js')), false);
  assert.equal(existsSync(path.join(repoRoot, 'packages', 'redcube-agent')), false);
  assert.equal(existsSync(path.join(repoRoot, 'packages', 'redcube-domain')), false);
  assert.equal(existsSync(path.join(repoRoot, 'packages', 'redcube-memory')), false);

  const scopedFiles = [
    ...walk(path.join(repoRoot, 'apps')),
    ...walk(path.join(repoRoot, 'packages')),
    ...walk(path.join(repoRoot, 'tests')),
    path.join(repoRoot, 'README.md'),
    path.join(repoRoot, 'docs', 'policies', 'runtime_operating_model.md'),
  ].filter((file) => existsSync(file) && !file.endsWith(path.join('tests', 'legacy-cleanup.test.js')));

  for (const file of scopedFiles) {
    const content = readText(file);
    assert.equal(content.includes('packages/redcube-agent'), false, file);
    assert.equal(content.includes('workbench-models.js'), false, file);
    assert.equal(content.includes('.redcube_pi/workbench'), false, file);
    assert.equal(content.includes("'.redcube_pi', 'workbench'"), false, file);
    assert.equal(content.includes('runWorkflow no longer mirrors outputs into workbench truth directories'), false, file);
  }
});
