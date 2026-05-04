// @ts-nocheck
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
    ['docs', 'program', 'phase-2', 'phase_2_architecture_boundary_governance.md'],
    ['contracts', 'README.md'],
  ]) {
    assert.equal(existsSync(path.join(repoRoot, ...file)), true, file.join('/'));
  }
});

test('architecture boundary governance keeps owner map and follow-on backlog explicit', () => {
  const boundaryGovernance = readText(path.join(
    'docs',
    'program',
    'phase-2',
    'phase_2_architecture_boundary_governance.md',
  ));

  for (const owner of [
    'apps',
    'gateway',
    'runtime',
    'runtime-family',
    'overlay',
    'pack',
    'governance',
    'runtime-protocol',
  ]) {
    assert.match(boundaryGovernance, new RegExp(`\\\`${owner}\\\``));
  }

  for (const gate of [
    'package/layer boundary meta gate',
    'nested-test registration gate',
    'arch-boundary-overlay-core-runtime-topology-extraction',
    'arch-boundary-product-manifest-thin-composer',
    'arch-boundary-runtime-family-review-snapshot-injection',
    'arch-boundary-pack-provenance-cleanup',
  ]) {
    assert.match(boundaryGovernance, new RegExp(gate));
  }

  assert.match(boundaryGovernance, /Martin Fowler/);
  assert.match(boundaryGovernance, /Team Topologies/);
  assert.match(boundaryGovernance, /Test Pyramid/);
});

test('root AGENTS requires explicit plan closeout accounting', () => {
  const agents = readText('AGENTS.md');

  assert.match(agents, /plan-closeout/);
  for (const field of [
    'planned',
    'done',
    'deferred',
    'skipped',
    'verification',
    'commit-push state',
  ]) {
    assert.match(agents, new RegExp(field));
  }
  assert.match(agents, /deferred[\s\S]*backlog/);
  assert.match(agents, /可检索/);
});

test('public docs surface keeps the default entry chain and isolates historical program wording', () => {
  const readme = readText('README.md');
  const readmeZh = readText('README.zh-CN.md');
  const docsReadme = readText(path.join('docs', 'README.md'));
  const docsReadmeZh = readText(path.join('docs', 'README.zh-CN.md'));
  const docsStatus = readText(path.join('docs', 'status.md'));
  const docsArchitecture = readText(path.join('docs', 'architecture.md'));
  const currentProgram = JSON.parse(readText(path.join('contracts', 'runtime-program', 'current-program.json')));

  assert.match(docsReadme, /RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces/);
  assert.match(docsReadme, /OPL Product Entry -> OPL Runtime Manager -> external Hermes-Agent runtime substrate -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces/);
  assert.match(docsReadmeZh, /RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces/);
  assert.match(docsReadmeZh, /OPL Product Entry -> OPL Runtime Manager -> external Hermes-Agent runtime substrate -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces/);
  assert.match(docsStatus, /RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> RedCube visual-domain truth surfaces/);
  assert.match(docsStatus, /OPL Runtime Manager/);
  assert.match(docsStatus, /invokeProductEntry/);
  assert.match(docsStatus, /invokeFederatedProductEntry/);
  assert.match(docsStatus, /invokeDomainEntry/);
  assert.match(`${readme}\n${readmeZh}\n${docsStatus}`, /TypeScript orchestration plus Python native helpers[\s\S]*Repo-tracked JavaScript is retired[\s\S]*TypeScript orchestration 加 Python native helpers[\s\S]*已跟踪 JavaScript 已退役[\s\S]*新实现默认走 TypeScript orchestration 或 Python native helper[\s\S]*已跟踪 JavaScript 已退役/);
  assert.match(docsArchitecture, /RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces/);
  assert.match(docsArchitecture, /invokeProductEntry/);
  assert.match(docsArchitecture, /invokeFederatedProductEntry/);
  assert.match(docsArchitecture, /invokeDomainEntry/);
  assert.equal(currentProgram.current_state.runtime_substrate_owner, 'optional_hosted_runtime_carrier');
  assert.match(
    currentProgram.longrun_goal.final_target_route.redcube_direct_entry,
    /RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces/,
  );
  assert.match(
    currentProgram.longrun_goal.final_target_route.opl_federated_entry,
    /OPL Product Entry -> OPL Runtime Manager -> external Hermes-Agent runtime substrate -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces/,
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
