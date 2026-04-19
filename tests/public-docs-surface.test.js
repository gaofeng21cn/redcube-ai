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

test('public docs surface keeps the default entry chain and isolates historical program wording', () => {
  const readme = readText('README.md');
  const readmeZh = readText('README.zh-CN.md');
  const docsReadme = readText(path.join('docs', 'README.md'));
  const docsReadmeZh = readText(path.join('docs', 'README.zh-CN.md'));
  const docsStatus = readText(path.join('docs', 'status.md'));
  const docsArchitecture = readText(path.join('docs', 'architecture.md'));
  const currentProgram = JSON.parse(readText(path.join('contracts', 'runtime-program', 'current-program.json')));

  assert.match(docsReadme, /RedCube Product Entry -> RedCube Gateway -> Hermes-Agent managed runtime/);
  assert.match(docsReadme, /OPL Product Entry -> OPL Gateway -> Hermes-Agent managed runtime/);
  assert.match(docsReadmeZh, /RedCube Product Entry -> RedCube Gateway -> Hermes-Agent managed runtime/);
  assert.match(docsReadmeZh, /OPL Product Entry -> OPL Gateway -> Hermes-Agent managed runtime/);
  assert.match(docsStatus, /RedCube Product Entry -> RedCube Gateway -> Hermes-Agent managed runtime/);
  assert.match(docsStatus, /invokeProductEntry/);
  assert.match(docsStatus, /invokeFederatedProductEntry/);
  assert.match(docsStatus, /invokeDomainEntry/);
  assert.match(docsArchitecture, /Hermes-Agent managed runtime/);
  assert.match(docsArchitecture, /invokeProductEntry/);
  assert.match(docsArchitecture, /invokeFederatedProductEntry/);
  assert.match(docsArchitecture, /invokeDomainEntry/);
  assert.equal(currentProgram.current_state.runtime_substrate_owner, 'upstream_hermes_agent');
  assert.match(
    currentProgram.longrun_goal.final_target_route.redcube_direct_entry,
    /RedCube Product Entry -> RedCube Gateway -> Hermes-Agent managed runtime/,
  );
  assert.match(
    currentProgram.longrun_goal.final_target_route.opl_federated_entry,
    /OPL Product Entry -> OPL Gateway -> Hermes-Agent managed runtime/,
  );

  assert.doesNotMatch(docsReadme, /repo-tracked program|current truth|active tranche|current-program\.json/i);
  assert.doesNotMatch(docsReadmeZh, /repo-tracked program|当前真相|活跃 tranche|current-program\.json/i);
  assert.doesNotMatch(docsStatus, /active mainline pointer|current-program\.json/i);
  assert.doesNotMatch(readme, /Development Verification|Technical Notes For Maintainers|test:historical|REDCUBE_PYTHON_COMMAND/);
  assert.doesNotMatch(readmeZh, /开发验证|给维护者的技术入口|test:historical|REDCUBE_PYTHON_COMMAND/);
  assert.doesNotMatch(docsReadme, /OPL shell -> RCA domain agent -> Codex default execution/);
  assert.doesNotMatch(docsReadmeZh, /OPL shell -> RCA domain agent -> Codex default execution/);
  assert.doesNotMatch(docsStatus, /OPL shell -> RCA \/ RedCube domain agent -> Codex default execution/);
});
