import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const FINAL_TARGET_CONTRACT = 'contracts/runtime-program/upstream-hermes-agent-final-target-shape.json';
const FINAL_TARGET_BRIEF = 'docs/program/upstream_hermes_agent_final_target_shape.md';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('upstream Hermes-Agent final target shape is frozen as the OPL-callable RedCube visual-domain node', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const finalTarget = readJson(FINAL_TARGET_CONTRACT);

  assert.equal(finalTarget.target_shape_id, 'upstream_hermes_agent_final_target_shape');
  assert.equal(finalTarget.status, 'closeout_completed');
  assert.equal(
    finalTarget.final_target_route.redcube_direct_entry,
    'User -> RedCube Product Entry -> RedCube Gateway -> Hermes runtime substrate -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces',
  );
  assert.equal(
    finalTarget.final_target_route.opl_federated_entry,
    'User -> OPL Product Entry -> OPL Gateway -> Hermes runtime substrate -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces',
  );
  assert.equal(finalTarget.runtime_boundary.runtime_owner, 'upstream_hermes_agent');
  assert.deepEqual(finalTarget.entry_surface_contract.formal_entry.repo_verified, ['CLI', 'MCP']);
  assert.equal(
    finalTarget.entry_surface_contract.service_safe_domain_entry.contract,
    'contracts/runtime-program/service-safe-domain-entry-adapter.json',
  );
  assert.equal(finalTarget.entry_surface_contract.product_entry_service_surface.status, 'repo_verified_service_surface_landed');
  assert.equal(finalTarget.entry_surface_contract.product_entry_service_surface.ui_shell_status, 'not_landed');
  assert.equal(
    finalTarget.current_gap.hard_blockers.length,
    0,
  );
  assert.equal(
    currentProgram.longrun_goal.final_target_shape_contract,
    FINAL_TARGET_CONTRACT,
  );
  assert.equal(
    currentProgram.current_state.foundation_milestones.upstream_hermes_agent_final_target_shape.status,
    'closeout_completed',
  );
  assert.equal(
    currentProgram.current_state.foundation_milestones.upstream_hermes_agent_final_target_shape.contract,
    FINAL_TARGET_CONTRACT,
  );
  assert.equal(
    currentProgram.current_state.foundation_milestones.upstream_hermes_agent_final_target_shape.brief,
    FINAL_TARGET_BRIEF,
  );
});

test('canonical docs freeze the final target shape without overclaiming landed product entry', () => {
  const rootReadme = read('README.md');
  const rootReadmeZh = read('README.zh-CN.md');
  const docsReadme = read('docs/README.md');
  const docsReadmeZh = read('docs/README.zh-CN.md');
  const project = read('docs/project.md');
  const status = read('docs/status.md');
  const architecture = read('docs/architecture.md');
  const positioning = read('docs/domain-harness-os-positioning.md');
  const runtimeArchitecture = read('docs/runtime_architecture.md');
  const handoff = read('docs/references/lightweight_product_entry_and_opl_handoff.md');
  const contractsReadme = read('contracts/README.md');
  const brief = read(FINAL_TARGET_BRIEF);

  assert.equal(rootReadme.includes('Hermes runtime substrate -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces'), true);
  assert.equal(rootReadme.includes('The mature end-user `product entry` shell is still not landed'), true);
  assert.equal(rootReadmeZh.includes('Hermes runtime substrate -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces'), true);
  assert.equal(rootReadmeZh.includes('成熟的最终用户 `product entry` 前台壳并未落地'), true);
  assert.equal(docsReadme.includes('upstream_hermes_agent_final_target_shape.md'), true);
  assert.equal(docsReadmeZh.includes('upstream_hermes_agent_final_target_shape.md'), true);
  assert.equal(project.includes('OPL Product Entry -> OPL Gateway -> Hermes runtime substrate -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces'), true);
  assert.equal(status.includes('最终目标形态'), true);
  assert.equal(status.includes('标准 `run-test-group` live launcher 已 fresh 通过'), true);
  assert.equal(architecture.includes('RedCube service-safe domain entry'), true);
  assert.equal(positioning.includes('可调用的 visual-domain 产品 / 服务节点'), true);
  assert.equal(runtimeArchitecture.includes('runtime substrate -> RedCube service-safe domain entry -> visual-domain truth surfaces'), true);
  assert.equal(handoff.includes('最终目标形态'), true);
  assert.equal(contractsReadme.includes('redcube-product-entry-mvp.json'), true);
  assert.equal(brief.includes('最终目标不是让 `RedCube AI` 变成整个 `OPL`'), true);
  assert.equal(brief.includes('repo-verified 的 `RedCube Product Entry` service surface 已落地'), true);
  assert.equal(brief.includes('不是 runtime substrate proof，也不再是 repo-verified product-entry service surface'), true);
});
