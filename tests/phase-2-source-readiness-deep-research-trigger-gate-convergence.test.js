import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const TRANCHE_CONTRACT = 'contracts/runtime-program/phase-2-source-readiness-deep-research-trigger-gate-convergence.json';
const TRANCHE_BRIEF = 'docs/program/phase-2/phase_2_source_readiness_deep_research_trigger_gate_convergence.md';
const FUTURE_TARGET = 'docs/source_readiness_deep_research_longrun_target_state.md';
const PREDECESSOR_CONTRACT = 'contracts/runtime-program/phase-2-direct-delivery-lifecycle-stage-convergence.json';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('source-readiness deep research trigger+gate convergence stays absorbed provenance while Hermes canonical closure is the active tranche', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(TRANCHE_CONTRACT);
  const predecessor = readJson(PREDECESSOR_CONTRACT);

  assert.equal(contract.tranche_id, 'phase_2_source_readiness_deep_research_trigger_gate_convergence');
  assert.equal(contract.status, 'closeout_completed');
  assert.equal(contract.review_status, 'passed');
  assert.equal(predecessor.closeout.absorbed_to_main, true);
  assert.equal(currentProgram.current_state.phase_label, 'Hermes / managed family closure truth');
  assert.equal(currentProgram.current_state.workstream, 'hermes_managed_family_closure_truth');
  assert.equal(currentProgram.current_state.active_baton.id, 'hermes_managed_family_closure_truth');
  assert.equal(currentProgram.current_state.active_baton.scope.runtime_planes.includes('source_readiness'), true);
  assert.equal(currentProgram.current_state.active_baton.scope.consumer_families.includes('xiaohongshu'), true);
  assert.equal(currentProgram.current_state.active_baton.scope.consumer_families.includes('poster_onepager'), true);
  assert.equal(currentProgram.current_state.active_baton.scope.excluded_scope.includes('controller expansion'), true);
  assert.equal(existsSync(path.resolve(TRANCHE_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(PREDECESSOR_CONTRACT)), true);
});

test('source-readiness deep research trigger+gate convergence freezes trigger logic, planning_ready gate, and future-facing target honestly', () => {
  const contract = readJson(TRANCHE_CONTRACT);
  const brief = read(TRANCHE_BRIEF);
  const futureTarget = read(FUTURE_TARGET);
  const runtimeArchitecture = read('docs/runtime_architecture.md');
  const runtimePolicy = read('docs/policies/runtime_operating_model.md');
  const quickstart = read('docs/human_quickstart.md');
  const readme = read('README.md');
  const readmeZh = read('README.zh-CN.md');
  const docsIndex = read('docs/README.md');
  const docsIndexZh = read('docs/README.zh-CN.md');

  assert.equal(existsSync(path.resolve(TRANCHE_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(TRANCHE_BRIEF)), true);
  assert.equal(existsSync(path.resolve(FUTURE_TARGET)), true);
  assert.equal(contract.trigger_and_gate_surface.research_positioning.belongs_to, 'source_readiness');
  assert.equal(contract.trigger_and_gate_surface.force_trigger_conditions.includes('input only contains topic, keywords, or rough idea'), true);
  assert.equal(contract.trigger_and_gate_surface.pass_condition.includes('planning_ready=true'), true);
  assert.equal(contract.governance_alignment.required_summary_fields.includes('gate_summary.source_planning_ready'), true);
  assert.equal(brief.includes('planning_ready 必须成为 machine-readable release gate'), true);
  assert.equal(futureTarget.includes('future-facing 目标态文档'), true);
  assert.equal(futureTarget.includes('它本身**不会**自动改写 `contracts/runtime-program/current-program.json`'), true);
  assert.equal(runtimeArchitecture.includes('source-plane 更深层的扩展仍属于同一主线上的持续增强'), true);
  assert.equal(runtimePolicy.includes('更深层 source-plane 扩展仍属于同一主线上的后续增强'), true);
  assert.equal(quickstart.includes('等 Step 1 达到 `planning_ready` 后，再继续推进后续视觉交付步骤'), true);
  assert.equal(readme.includes('planning_ready must become the formal machine-readable release gate inside Source Readiness'), true);
  assert.equal(readmeZh.includes('`planning_ready` 必须成为 `Source Readiness` 内部正式、可机读的放行 gate'), true);
  assert.equal(docsIndex.includes('source_readiness_deep_research_longrun_target_state.md'), true);
  assert.equal(docsIndexZh.includes('source_readiness_deep_research_longrun_target_state.md'), true);
  assert.equal(docsIndex.includes('phase_2_source_readiness_deep_research_trigger_gate_convergence.md'), true);
  assert.equal(docsIndexZh.includes('phase_2_source_readiness_deep_research_trigger_gate_convergence.md'), true);
});
