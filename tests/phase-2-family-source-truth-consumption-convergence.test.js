import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const TRANCHE_CONTRACT = 'contracts/runtime-program/phase-2-family-source-truth-consumption-convergence.json';
const TRANCHE_BRIEF = 'docs/program/phase-2/phase_2_family_source_truth_consumption_convergence.md';
const PREDECESSOR_CONTRACT = 'contracts/runtime-program/phase-2-review-export-gate-audit-hardening.json';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('phase-2 family source-truth consumption convergence stays absorbed provenance while repo-verified product entry federation is the active tranche', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(TRANCHE_CONTRACT);

  assert.equal(currentProgram.current_state.phase_id, 'repo_verified_product_entry_and_opl_federation');
  assert.equal(currentProgram.current_state.workstream, 'repo_verified_product_entry_and_opl_federation');
  assert.equal(currentProgram.current_state.active_baton.id, 'managed_product_entry_hardening');
  assert.equal(contract.status, 'closeout_completed');
  assert.equal(contract.review_status, 'passed');
  assert.equal(contract.formal_entry.controller_repo_verified, false);
  assert.deepEqual(contract.formal_entry.repo_verified, ['MCP', 'CLI']);
  assert.equal(contract.foundations.phase_2_review_export_gate_audit_hardening.commit, 'a5b1158');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_family_source_truth_consumption_convergence.commit, 'e894641');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_runtime_watch_locator_integrity_hardening.status, 'closeout_completed');
  assert.equal(existsSync(path.resolve(TRANCHE_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(PREDECESSOR_CONTRACT)), true);
});

test('phase-2 family source-truth consumption convergence freezes shared source_truth_contract and guarded poster boundary without promoting controller', () => {
  const contract = readJson(TRANCHE_CONTRACT);
  const pptProfiles = read('packages/redcube-overlay-ppt/src/profiles.js');
  const xhsContracts = read('packages/redcube-overlay-xiaohongshu/src/contracts.js');
  const posterContracts = read('packages/redcube-overlay-poster-onepager/src/contracts.js');

  assert.equal(contract.object_boundary.in_scope.includes('ppt_deck, xiaohongshu, and guarded poster_onepager expose one shared source_truth_contract surface inside hydrated deliverable contracts'), true);
  assert.equal(contract.source_truth_contract_surface.route_gate_rule, 'authoritative_fail_closed_in_audit_and_runtime_watch');
  assert.deepEqual(
    contract.source_truth_contract_surface.authoritative_artifacts,
    ['source_index', 'extracted_materials', 'source_audit', 'source_brief'],
  );
  assert.equal(contract.source_truth_contract_surface.poster_guarded_boundary.profile_id, 'knowledge_poster');
  assert.equal(contract.source_truth_contract_surface.poster_guarded_boundary.academic_contract_active, false);
  assert.equal(contract.export_and_governance_alignment.required_hydrated_export_surfaces.poster_onepager, 'export_bundle');
  assert.equal(pptProfiles.includes('source_truth_contract'), true);
  assert.equal(xhsContracts.includes('source_truth_contract'), true);
  assert.equal(posterContracts.includes('source_truth_contract'), true);
});

test('phase-2 family source-truth consumption convergence brief and public docs explain the tranche honestly', () => {
  const brief = read(TRANCHE_BRIEF);
  const readme = read('README.md');
  const readmeZh = read('README.zh-CN.md');
  const runtimeArchitecture = read('docs/runtime_architecture.md');
  const policy = read('docs/policies/runtime_operating_model.md');
  const docsIndex = read('docs/README.md');
  const docsIndexZh = read('docs/README.zh-CN.md');

  assert.equal(existsSync(path.resolve(TRANCHE_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(TRANCHE_BRIEF)), true);
  assert.equal(brief.includes('family source-truth consumption convergence'), true);
  assert.equal(brief.includes('source_truth_contract'), true);
  assert.equal(brief.includes('source_truth_consumption'), true);
  assert.equal(readme.includes('family source-truth consumption convergence now has an absorbed tranche on the same mainline'), true);
  assert.equal(readmeZh.includes('family source-truth consumption convergence 已在同一主线上吸收一条 tranche'), true);
  assert.equal(runtimeArchitecture.includes('ppt_deck / xiaohongshu / poster_onepager 已围绕同一 source_truth_contract 与 source_truth_consumption summary 收口消费语义'), true);
  assert.equal(policy.includes('authoritative fail-closed source gate 继续留在 auditDeliverable / runtimeWatch，而 family artifact 需输出统一的 source_truth_consumption summary'), true);
  assert.equal(docsIndex.includes('phase_2_family_source_truth_consumption_convergence.md'), true);
  assert.equal(docsIndexZh.includes('phase_2_family_source_truth_consumption_convergence.md'), true);
});
