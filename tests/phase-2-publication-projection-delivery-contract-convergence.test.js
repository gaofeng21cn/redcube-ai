import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const TRANCHE_CONTRACT = 'contracts/runtime-program/phase-2-publication-projection-delivery-contract-convergence.json';
const TRANCHE_BRIEF = 'docs/phase_2_publication_projection_delivery_contract_convergence.md';
const FAMILY_TRANCHE_CONTRACT = 'contracts/runtime-program/phase-2-family-source-truth-consumption-convergence.json';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('phase-2 publication projection delivery contract convergence stays absorbed provenance while source-readiness deep research trigger gate convergence is the active tranche', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(TRANCHE_CONTRACT);

  assert.equal(currentProgram.current_state.phase_id, 'Phase2');
  assert.equal(currentProgram.current_state.workstream, 'phase_2_workspace_operator_quickstart_convergence');
  assert.equal(currentProgram.current_state.active_baton.id, 'phase_2_workspace_operator_quickstart_convergence');
  assert.equal(currentProgram.current_state.completed_batons.phase_2_publication_projection_delivery_contract_convergence.commit, '57c9310');
  assert.equal(currentProgram.current_state.completed_batons.phase_2_publication_projection_delivery_contract_convergence.scope.hardening_axis, 'publication_projection_delivery_contract_convergence');
  assert.deepEqual(currentProgram.current_state.completed_batons.phase_2_publication_projection_delivery_contract_convergence.scope.required_shared_contract_surfaces, ['delivery_contract', 'publication_projection']);
  assert.equal(contract.status, 'closeout_completed');
  assert.equal(contract.review_status, 'passed');
  assert.equal(contract.program_mode, 'autonomous_longrun');
  assert.deepEqual(contract.formal_entry.repo_verified, ['MCP', 'CLI']);
  assert.equal(contract.formal_entry.controller_repo_verified, false);
  assert.equal(currentProgram.current_state.completed_batons.phase_2_family_source_truth_consumption_convergence.commit, 'e894641');
  assert.equal(
    currentProgram.current_state.completed_batons.phase_2_family_source_truth_consumption_convergence.artifacts.tranche_contract,
    FAMILY_TRANCHE_CONTRACT,
  );
  assert.equal(
    currentProgram.current_state.completed_batons.phase_2_publication_projection_delivery_contract_convergence.artifacts.tranche_contract,
    TRANCHE_CONTRACT,
  );
  assert.equal(contract.foundations.phase_2_family_source_truth_consumption_convergence.commit, 'e894641');
  assert.equal(contract.closeout.next_tranche_candidate, 'phase_2_direct_delivery_operator_handoff_hardening');
});

test('phase-2 publication projection delivery contract convergence freezes one hydrated delivery contract surface across the stable families', () => {
  const contract = readJson(TRANCHE_CONTRACT);
  const pptProfiles = read('packages/redcube-overlay-ppt/src/profiles.js');
  const xhsContracts = read('packages/redcube-overlay-xiaohongshu/src/contracts.js');
  const posterContracts = read('packages/redcube-overlay-poster-onepager/src/contracts.js');
  const pptSurface = read('packages/redcube-overlay-ppt/src/surface.js');
  const xhsSurface = read('packages/redcube-overlay-xiaohongshu/src/surface.js');
  const posterSurface = read('packages/redcube-overlay-poster-onepager/src/surface.js');
  const reviewState = read('packages/redcube-governance/src/review-state.js');

  assert.equal(contract.delivery_contract_surface.families.ppt_deck.required_export_route, 'export_pptx');
  assert.equal(contract.delivery_contract_surface.families.ppt_deck.projection_model, 'direct_delivery');
  assert.equal(contract.delivery_contract_surface.families.xiaohongshu.required_export_route, 'export_bundle');
  assert.equal(contract.delivery_contract_surface.families.xiaohongshu.projection_model, 'human_publication');
  assert.equal(contract.delivery_contract_surface.families.xiaohongshu.human_gate_required, true);
  assert.deepEqual(contract.delivery_contract_surface.families.xiaohongshu.mutation_surfaces, ['approve_publish', 'promote_publish']);
  assert.equal(contract.delivery_contract_surface.families.poster_onepager.guarded_profile, 'knowledge_poster');
  assert.equal(contract.publication_projection_surface.schema_version, 2);
  assert.equal(contract.publication_projection_surface.projection_kind, 'topic_delivery_projection');
  assert.equal(contract.publication_projection_surface.canonical_source, 'review_state.delivery_projection');
  assert.equal(pptProfiles.includes('delivery_contract'), true);
  assert.equal(xhsContracts.includes('delivery_contract'), true);
  assert.equal(posterContracts.includes('delivery_contract'), true);
  assert.equal(pptSurface.includes('contracts/delivery-contract.json'), true);
  assert.equal(xhsSurface.includes('contracts/delivery-contract.json'), true);
  assert.equal(posterSurface.includes('contracts/delivery-contract.json'), true);
  assert.equal(reviewState.includes("projection_kind: 'topic_delivery_projection'"), true);
  assert.equal(reviewState.includes("kind: 'review_state.delivery_projection'"), true);
});

test('phase-2 publication projection delivery contract convergence brief and docs keep the tranche honest', () => {
  const brief = read(TRANCHE_BRIEF);
  const readme = read('README.md');
  const readmeZh = read('README.zh-CN.md');
  const runtimeArchitecture = read('docs/runtime_architecture.md');
  const positioning = read('docs/domain-harness-os-positioning.md');
  const policy = read('docs/policies/runtime_operating_model.md');
  const docsIndex = read('docs/README.md');
  const docsIndexZh = read('docs/README.zh-CN.md');

  assert.equal(existsSync(path.resolve(TRANCHE_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(TRANCHE_BRIEF)), true);
  assert.equal(brief.includes('publication projection / delivery contract convergence'), true);
  assert.equal(brief.includes('delivery_contract'), true);
  assert.equal(brief.includes('publication-state.json'), true);
  assert.equal(brief.includes('phase_2_direct_delivery_operator_handoff_hardening'), true);
  assert.equal(readme.includes('publication projection / delivery contract convergence now has an absorbed tranche on the same mainline'), true);
  assert.equal(readmeZh.includes('publication projection / delivery contract convergence 已在同一主线上吸收一条 tranche'), true);
  assert.equal(runtimeArchitecture.includes('publication projection / delivery contract convergence` 已把 topic 级 `publication-state.json` 收紧到 hydrated `delivery_contract` 与 canonical review state'), true);
  assert.equal(positioning.includes('当前 absorbed tranche 则把 topic 级 `publication-state.json` 收紧到 hydrated `delivery_contract` 与 canonical review state'), true);
  assert.equal(policy.includes('`direct-delivery lifecycle stage convergence` 已在当前主线上吸收'), true);
  assert.equal(docsIndex.includes('phase_2_publication_projection_delivery_contract_convergence.md'), true);
  assert.equal(docsIndexZh.includes('phase_2_publication_projection_delivery_contract_convergence.md'), true);
});
