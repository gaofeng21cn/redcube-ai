import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const TRANCHE_CONTRACT = 'contracts/runtime-program/phase-2-direct-delivery-lifecycle-stage-convergence.json';
const TRANCHE_BRIEF = 'docs/program/phase-2/phase_2_direct_delivery_lifecycle_stage_convergence.md';
const PREDECESSOR_CONTRACT = 'contracts/runtime-program/phase-2-direct-delivery-operator-handoff-hardening.json';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('phase-2 direct-delivery lifecycle stage convergence stays absorbed provenance while Hermes canonical closure keeps current lifecycle names intact', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(TRANCHE_CONTRACT);
  const predecessor = readJson(PREDECESSOR_CONTRACT);

  assert.equal(contract.tranche_id, 'phase_2_direct_delivery_lifecycle_stage_convergence');
  assert.equal(contract.status, 'closeout_completed');
  assert.equal(contract.review_status, 'passed');
  assert.equal(predecessor.closeout.next_tranche_candidate, 'phase_2_direct_delivery_lifecycle_stage_convergence');
  assert.equal(currentProgram.current_state.phase_label, 'Hermes / runtime substrate canonical closure');
  assert.equal(currentProgram.current_state.workstream, 'hermes_runtime_substrate_canonical_closure');
  assert.equal(currentProgram.current_state.active_baton.id, 'hermes_runtime_substrate_canonical_closure');
  assert.deepEqual(
    currentProgram.durable_surface_contract.required_embedded_summaries,
    ['source_readiness_summary', 'gate_summary', 'operator_handoff', 'lifecycle_stage_summary'],
  );
  assert.equal(currentProgram.current_state.active_baton.scope.excluded_scope.includes('managed web runtime completion claim'), true);
  assert.equal(existsSync(path.resolve(TRANCHE_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(PREDECESSOR_CONTRACT)), true);
  assert.equal(contract.lifecycle_stage_contract_surface.human_to_macro_stage.plan, 'story_architecture');
  assert.equal(contract.lifecycle_stage_contract_surface.operator_handoff_within, 'delivery');
  assert.equal(contract.object_boundary.out_of_scope.includes('xiaohongshu rewrite into direct-delivery'), true);
});

test('phase-2 direct-delivery lifecycle stage convergence brief and docs keep future target separate from current truth rewrite', () => {
  const brief = read(TRANCHE_BRIEF);
  const runtimeArchitecture = read('docs/runtime_architecture.md');
  const runtimePolicy = read('docs/policies/runtime_operating_model.md');
  const docsIndex = read('docs/README.md');
  const docsIndexZh = read('docs/README.zh-CN.md');

  assert.equal(brief.includes('`operator_handoff / closeout` 仍属于 `Delivery`，不是第六步'), true);
  assert.equal(brief.includes('`visual_director_review / screenshot_review` 仍属于 `Visual` 内部的 review overlay'), true);
  assert.equal(runtimeArchitecture.includes('`direct-delivery lifecycle stage convergence` 已把 direct-delivery human workline 与当前 macro lifecycle 的 machine-readable bridge 收紧到同一 canonical contract surface'), true);
  assert.equal(runtimePolicy.includes('direct-delivery family 现在必须暴露 machine-readable `lifecycle_stage_contract` 与 `lifecycle_stage_summary`，同时保持 `Story Architecture` / `Visual Authorship` / `Delivery Packaging` 的当前命名不被改写'), true);
  assert.equal(docsIndex.includes('phase_2_direct_delivery_lifecycle_stage_convergence.md'), true);
  assert.equal(docsIndexZh.includes('phase_2_direct_delivery_lifecycle_stage_convergence.md'), true);
});
