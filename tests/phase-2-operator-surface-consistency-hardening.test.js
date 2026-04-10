import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const TRANCHE_CONTRACT = 'contracts/runtime-program/phase-2-operator-surface-consistency-hardening.json';
const TRANCHE_BRIEF = 'docs/phase_2_operator_surface_consistency_hardening.md';
const PREDECESSOR_CONTRACT = 'contracts/runtime-program/phase-2-workspace-operator-quickstart-convergence.json';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('operator surface consistency hardening stays absorbed provenance while runtime watch locator integrity hardening becomes the active tranche', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(TRANCHE_CONTRACT);
  const predecessor = readJson(PREDECESSOR_CONTRACT);

  assert.equal(contract.tranche_id, 'phase_2_operator_surface_consistency_hardening');
  assert.equal(contract.status, 'closeout_completed');
  assert.equal(contract.review_status, 'passed');
  assert.equal(predecessor.closeout.absorbed_to_main, true);
  assert.equal(currentProgram.current_state.phase_label, 'Phase 2 / runtime watch locator integrity hardening');
  assert.equal(currentProgram.current_state.workstream, 'phase_2_runtime_watch_locator_integrity_hardening');
  assert.equal(currentProgram.current_state.active_baton.id, 'phase_2_runtime_watch_locator_integrity_hardening');
  assert.equal(currentProgram.current_state.completed_batons.phase_2_operator_surface_consistency_hardening.scope.required_operator_surfaces.includes('review watch'), true);
  assert.deepEqual(currentProgram.current_state.completed_batons.phase_2_operator_surface_consistency_hardening.scope.required_embedded_summaries, ['source_readiness_summary', 'gate_summary', 'operator_handoff', 'lifecycle_stage_summary']);
  assert.equal(currentProgram.current_state.completed_batons.phase_2_operator_surface_consistency_hardening.scope.excluded_scope.includes('controller expansion'), true);
  assert.equal(currentProgram.current_state.completed_batons.phase_2_operator_surface_consistency_hardening.scope.excluded_scope.includes('xiaohongshu rewrite into direct-delivery'), true);
  assert.equal(currentProgram.current_state.completed_batons.phase_2_workspace_operator_quickstart_convergence.artifacts.tranche_contract, PREDECESSOR_CONTRACT);
});

test('operator surface consistency hardening freezes doctor/help/runtime-watch convergence honestly across current truth surfaces', () => {
  const contract = readJson(TRANCHE_CONTRACT);
  const brief = read(TRANCHE_BRIEF);
  const projectTruth = read('contracts/project-truth/AGENTS.md');
  const readme = read('README.md');
  const readmeZh = read('README.zh-CN.md');
  const docsIndex = read('docs/README.md');
  const docsIndexZh = read('docs/README.zh-CN.md');
  const runtimeArchitecture = read('docs/runtime_architecture.md');
  const runtimePolicy = read('docs/policies/runtime_operating_model.md');
  const positioning = read('docs/domain-harness-os-positioning.md');

  assert.equal(existsSync(path.resolve(TRANCHE_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(TRANCHE_BRIEF)), true);
  assert.deepEqual(contract.minimal_test_surface.truth_freeze_tests, ['tests/phase-2-operator-surface-consistency-hardening.test.js']);
  assert.equal(contract.operator_surface_alignment.workspace_doctor.must_not_emit_recommended_action.includes('initialize_workspace_contract'), true);
  assert.equal(contract.operator_surface_alignment.cli_help_surface.supported_commands.includes('review watch'), true);
  assert.equal(contract.operator_surface_alignment.runtime_watch_boundary.required_embedded_summaries.includes('lifecycle_stage_summary'), true);
  assert.equal(brief.includes('closeout 已完成并吸收到当前 mainline'), true);
  assert.equal(brief.includes('`CLI review watch` / `MCP runtime_watch`'), true);
  assert.equal(projectTruth.includes('contracts/runtime-program/phase-2-operator-surface-consistency-hardening.json'), true);
  assert.equal(readme.includes('operator surface consistency hardening now has an absorbed tranche on the same mainline'), true);
  assert.equal(readmeZh.includes('operator surface consistency hardening 已在同一主线上吸收一条 tranche'), true);
  assert.equal(docsIndex.includes('Phase 2 operator surface consistency hardening'), true);
  assert.equal(docsIndexZh.includes('Phase 2 operator surface consistency hardening'), true);
  assert.equal(runtimeArchitecture.includes('`operator surface consistency hardening` 已把 `workspace doctor` 的 bootstrap guidance、command-scoped CLI help，以及 `CLI review watch` / `MCP runtime_watch` 的 locator truth 收紧到同一 canonical operator route 与 `runtimeWatch` governance path'), true);
  assert.equal(runtimePolicy.includes('`operator surface consistency hardening` 已在当前主线上吸收'), true);
  assert.equal(positioning.includes('当前已吸收 tranche 是 `runtime watch locator integrity hardening`'), true);
});
