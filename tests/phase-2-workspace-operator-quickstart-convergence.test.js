import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const TRANCHE_CONTRACT = 'contracts/runtime-program/phase-2-workspace-operator-quickstart-convergence.json';
const TRANCHE_BRIEF = 'docs/phase_2_workspace_operator_quickstart_convergence.md';
const PREDECESSOR_CONTRACT = 'contracts/runtime-program/phase-2-source-readiness-deep-research-trigger-gate-convergence.json';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('workspace operator quickstart convergence becomes absorbed provenance once operator surface consistency hardening takes the active tranche', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(TRANCHE_CONTRACT);
  const predecessor = readJson(PREDECESSOR_CONTRACT);

  assert.equal(contract.tranche_id, 'phase_2_workspace_operator_quickstart_convergence');
  assert.equal(contract.status, 'closeout_completed');
  assert.equal(contract.review_status, 'passed');
  assert.equal(predecessor.closeout.absorbed_to_main, true);
  assert.equal(currentProgram.current_state.phase_label, 'Phase 2 / operator surface consistency hardening');
  assert.equal(currentProgram.current_state.workstream, 'phase_2_operator_surface_consistency_hardening');
  assert.equal(currentProgram.current_state.active_baton.id, 'phase_2_operator_surface_consistency_hardening');
  assert.equal(currentProgram.current_state.completed_batons.phase_2_workspace_operator_quickstart_convergence.commit, 'bf2df47');
  assert.equal(currentProgram.current_state.completed_batons.phase_2_workspace_operator_quickstart_convergence.scope.required_operator_surfaces.includes('workspace doctor'), true);
  assert.equal(currentProgram.current_state.completed_batons.phase_2_workspace_operator_quickstart_convergence.scope.required_operator_surfaces.includes('source research'), true);
  assert.equal(currentProgram.current_state.completed_batons.phase_2_workspace_operator_quickstart_convergence.scope.required_operator_surfaces.includes('deliverable run'), true);
  assert.equal(currentProgram.current_state.completed_batons.phase_2_workspace_operator_quickstart_convergence.scope.excluded_scope.includes('controller expansion'), true);
  assert.equal(currentProgram.current_state.completed_batons.phase_2_workspace_operator_quickstart_convergence.scope.excluded_scope.includes('xiaohongshu rewrite into direct-delivery'), true);
  assert.equal(currentProgram.current_state.completed_batons.phase_2_source_readiness_deep_research_trigger_gate_convergence.artifacts.tranche_contract, PREDECESSOR_CONTRACT);
});

test('workspace operator quickstart convergence freezes brand-new or thin workspace bootstrap, docs, and help surface honestly', () => {
  const contract = readJson(TRANCHE_CONTRACT);
  const brief = read(TRANCHE_BRIEF);
  const readme = read('README.md');
  const readmeZh = read('README.zh-CN.md');
  const docsIndex = read('docs/README.md');
  const docsIndexZh = read('docs/README.zh-CN.md');
  const quickstart = read('docs/human_quickstart.md');

  assert.equal(existsSync(path.resolve(TRANCHE_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(TRANCHE_BRIEF)), true);
  assert.equal(contract.operator_quickstart_surface.canonical_route.join(' -> '), 'workspace doctor -> source intake / source research -> deliverable create -> deliverable audit -> deliverable run');
  assert.equal(contract.workspace_bootstrap_surface.doctor_surface, 'redcube workspace doctor');
  assert.equal(contract.workspace_bootstrap_surface.doctor_on_brand_new_recommended_action, 'run_source_intake');
  assert.equal(contract.workspace_bootstrap_surface.bootstrap_writers.includes('source research'), true);
  assert.equal(contract.governance_alignment.required_surfaces.includes('getPublicationProjection'), true);
  assert.equal(brief.includes('closeout 已完成并吸收到当前 mainline'), true);
  assert.equal(brief.includes('`workspace doctor -> source intake / source research -> deliverable create -> deliverable audit -> deliverable run`'), true);
  assert.equal(brief.includes('brand-new workspace 上返回 `run_source_intake`'), true);
  assert.equal(quickstart.includes('`redcube source intake`（材料已足够时）'), true);
  assert.equal(quickstart.includes('`redcube source research`（材料薄或只有主题时）'), true);
  assert.equal(quickstart.includes('`redcube deliverable run`'), true);
  assert.equal(readme.includes('workspace / operator quickstart convergence now has an absorbed tranche on the same mainline'), true);
  assert.equal(readmeZh.includes('workspace / operator quickstart convergence 已在同一主线上吸收一条 tranche'), true);
  assert.equal(docsIndex.includes('phase_2_workspace_operator_quickstart_convergence.md'), true);
  assert.equal(docsIndexZh.includes('phase_2_workspace_operator_quickstart_convergence.md'), true);
  assert.equal(docsIndex.includes('current recommended next-line brief'), false);
  assert.equal(docsIndexZh.includes('当前推荐 next-line brief'), false);
});
