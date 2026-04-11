import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import { runtimeStateDisplayPath } from '../packages/redcube-runtime/src/runtime-state.js';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const ACTIVATION_CONTRACT = 'contracts/runtime-program/phase-2-source-intake-activation-package-freeze.json';
const ACTIVATION_BRIEF = 'docs/program/phase-2/phase_2_source_intake_activation_package_freeze.md';
const BASELINE_CONTRACT = 'contracts/runtime-program/phase-2-source-intake-shared-source-truth-baseline.json';
const HARDENING_CONTRACT = 'contracts/runtime-program/phase-2-review-export-gate-audit-hardening.json';
const DOCS_INDEX = 'docs/README.md';
const DOCS_INDEX_ZH = 'docs/README.zh-CN.md';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('phase-2 activation package freeze remains a machine-readable completed predecessor after Hermes canonical closure advanced the same mainline', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(ACTIVATION_CONTRACT);

  assert.equal(currentProgram.current_state.active_baton.id, 'hermes_stable_family_closure_truth');
  assert.equal(currentProgram.current_state.foundation_milestones.stable_deliverable_manual_test_driven_hardening.status, 'closeout_completed');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_source_intake_shared_source_truth_baseline.status, 'closeout_completed');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_family_source_truth_consumption_convergence.commit, 'e894641');
  assert.equal(existsSync(path.resolve(HARDENING_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(BASELINE_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(ACTIVATION_CONTRACT)), true);
  assert.equal(contract.status, 'closeout_completed');
  assert.equal(contract.review_status, 'passed');
  assert.equal(contract.activation.owner, 'Codex App');
  assert.equal(contract.activation.required, true);
  assert.equal(contract.activation.activated, true);
  assert.equal(contract.activation.opens_p1, false);
  assert.equal(contract.activation.opens_phase_2, false);
  assert.equal(contract.activation.opens_phase_2_implementation, false);
  assert.equal(contract.scope.freeze_only, true);
  assert.equal(contract.scope.implementation_in_scope, false);
  assert.deepEqual(contract.scope.formal_entry, ['MCP', 'CLI']);
  assert.equal(contract.scope.controller_repo_verified, false);
  assert.deepEqual(contract.scope.consumer_families_after_activation, ['ppt_deck', 'xiaohongshu']);
});

test('phase-2 activation package freeze records activation conditions and canonical source artifacts explicitly', () => {
  const contract = readJson(ACTIVATION_CONTRACT);

  assert.equal(contract.activation_conditions.required_program_truth.p0_review_closeout, 'passed');
  assert.equal(contract.activation_conditions.required_program_truth.green_baseline_credible, true);
  assert.deepEqual(contract.activation_conditions.required_program_truth.formal_entry, ['MCP', 'CLI']);
  assert.equal(contract.activation_conditions.explicit_promotion_required_before_phase_2_implementation, true);
  assert.equal(contract.activation_conditions.required_completed_batons[0].id, 'stable_deliverable_manual_test_driven_hardening');

  const artifactIds = contract.artifact_schema.canonical_artifacts.map((item) => item.artifact_id);
  assert.deepEqual(artifactIds, ['source_index', 'extracted_materials', 'source_audit', 'source_brief']);
  assert.equal(
    contract.artifact_schema.canonical_artifacts.some((item) => item.path === 'topics/<topic>/canonical/source-index.json'),
    true,
  );
  assert.equal(
    contract.artifact_schema.canonical_artifacts.some((item) => item.required_fields.includes('confidence')),
    true,
  );
});

test('phase-2 activation package freeze keeps gate surface, operator flow, minimum test surface, and closeout evidence intact', () => {
  const contract = readJson(ACTIVATION_CONTRACT);

  assert.equal(contract.gate_surface.pre_activation_review_gates.includes('formal entry remains MCP / CLI only'), true);
  assert.equal(contract.gate_surface.operator_gates.some((item) => item.gate_id === 'truth_surface_synced'), true);
  assert.equal(contract.gate_surface.implementation_opening_gates.includes('Codex App must explicitly activate a dedicated Phase 2 implementation baton'), true);
  assert.equal(contract.operator_flow.length >= 5, true);
  assert.equal(contract.operator_flow[0].action, 'confirm current frozen truth');
  assert.deepEqual(contract.minimal_test_surface.freeze_tests, [
    'tests/runtime-alignment-p0.test.js',
    'tests/poster-production-hardening-freeze.test.js',
    'tests/stable-deliverable-manual-test-package.test.js',
    'tests/phase-2-source-intake-activation-package-freeze.test.js',
  ]);
  assert.equal(contract.minimal_test_surface.existing_capability_tests_to_hold.includes('tests/source-intake.test.js'), true);
  assert.equal(
    contract.closeout_evidence_requirements.report_surfaces.includes(
      runtimeStateDisplayPath('context', 'CURRENT_PROGRAM.md'),
    ),
    true,
  );
  assert.equal(contract.closeout_evidence_requirements.repo_tracked_truth_surfaces.includes(ACTIVATION_BRIEF), true);
  assert.equal(contract.closeout_evidence_requirements.must_not_claim.includes('Phase 2 implementation has started'), true);
});

test('phase-2 activation package brief and docs indexes stay synced to the contract after baseline absorption', () => {
  const brief = read(ACTIVATION_BRIEF);
  const docsIndex = read(DOCS_INDEX);
  const docsIndexZh = read(DOCS_INDEX_ZH);

  assert.equal(existsSync(path.resolve(ACTIVATION_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(ACTIVATION_BRIEF)), true);
  assert.equal(brief.includes('如何被显式激活'), true);
  assert.equal(brief.includes('不是 `Phase 2` 实现启动令'), true);
  assert.equal(brief.includes('当前 baton 明确不做'), true);
  assert.equal(brief.includes('最小 Phase 2 baseline 已在其基础上进入主线'), true);
  assert.equal(docsIndex.includes('phase_2_source_intake_activation_package_freeze.md'), true);
  assert.equal(docsIndexZh.includes('phase_2_source_intake_activation_package_freeze.md'), true);
});
