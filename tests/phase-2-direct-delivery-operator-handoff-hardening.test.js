import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const TRANCHE_CONTRACT = 'contracts/runtime-program/phase-2-direct-delivery-operator-handoff-hardening.json';
const TRANCHE_BRIEF = 'docs/program/phase-2/phase_2_direct_delivery_operator_handoff_hardening.md';
const PREDECESSOR_CONTRACT = 'contracts/runtime-program/phase-2-publication-projection-delivery-contract-convergence.json';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('phase-2 direct-delivery operator handoff tranche is frozen as a repo-tracked contract', () => {
  const contract = readJson(TRANCHE_CONTRACT);
  const predecessor = readJson(PREDECESSOR_CONTRACT);

  assert.equal(contract.tranche_id, 'phase_2_direct_delivery_operator_handoff_hardening');
  assert.equal(contract.program_mode, 'autonomous_longrun');
  assert.equal(contract.formal_entry.controller_repo_verified, false);
  assert.equal(contract.foundations.phase_2_publication_projection_delivery_contract_convergence.commit, '57c9310');
  assert.equal(predecessor.closeout.next_tranche_candidate, 'phase_2_direct_delivery_operator_handoff_hardening');
  assert.equal(contract.object_boundary.in_scope.some((item) => item.includes('operator_handoff')), true);
  assert.equal(contract.direct_delivery_handoff_surface.required_contract_fields.includes('operator_handoff.owner_surface'), true);
  assert.equal(contract.direct_delivery_handoff_surface.required_summary_fields.includes('delivery_state_owner'), true);
  assert.equal(contract.governance_alignment.required_gate_summary_fields.includes('operator_handoff_status'), true);
  assert.equal(contract.governance_alignment.required_gate_summary_fields.includes('delivery_state_owner'), true);
  assert.equal(contract.object_boundary.out_of_scope.includes('controller expansion'), true);
  assert.equal(contract.object_boundary.out_of_scope.includes('paper_poster or conference_poster academic contract advancement'), true);
});

test('phase-2 direct-delivery operator handoff brief keeps the tranche honest', () => {
  const brief = read(TRANCHE_BRIEF);
  const runtimePolicy = read('docs/policies/runtime_operating_model.md');
  const runtimeArchitecture = read('docs/runtime_architecture.md');
  const readme = read('README.md');
  const readmeZh = read('README.zh-CN.md');
  const docsIndex = read('docs/README.md');
  const docsIndexZh = read('docs/README.zh-CN.md');

  assert.equal(brief.includes('operator_handoff.owner_surface'), true);
  assert.equal(brief.includes('request_changes'), true);
  assert.equal(brief.includes('promote_baseline'), true);
  assert.equal(brief.includes('formal entry 仍只有 `MCP / CLI`'), true);
  assert.equal(runtimePolicy.includes('formal-entry matrix 固定为：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`'), true);
  assert.equal(runtimeArchitecture.includes('`direct-delivery operator handoff hardening` 已把 `ppt_deck` / guarded `poster_onepager` 的 `operator_handoff` 收紧到同一 canonical governance path'), true);
  assert.equal(readme.includes('Current repo-verified public entry surfaces are `CLI` and `MCP`'), true);
  assert.equal(readmeZh.includes('当前仓内已实现且可验证的公开正式入口是 `CLI` 与 `MCP`'), true);
  assert.equal(docsIndex.includes('phase_2_direct_delivery_operator_handoff_hardening.md'), true);
  assert.equal(docsIndexZh.includes('phase_2_direct_delivery_operator_handoff_hardening.md'), true);
});
