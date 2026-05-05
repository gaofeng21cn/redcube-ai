// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const MANUAL_TEST_CONTRACT = 'contracts/runtime-program/stable-deliverable-manual-test-driven-hardening.json';
const HARDENING_BACKLOG = 'contracts/runtime-program/stable-deliverable-hardening-backlog.json';
const BASELINE_CONTRACT = 'contracts/runtime-program/phase-2-source-intake-shared-source-truth-baseline.json';
const HARDENING_CONTRACT = 'contracts/runtime-program/phase-2-review-export-gate-audit-hardening.json';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('stable deliverable manual-test contract remains the completed foundation baton behind the current repo-verified product entry tranche', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(MANUAL_TEST_CONTRACT);

  assert.equal(currentProgram.current_state.phase_id, 'repo_verified_product_entry_and_opl_federation');
  assert.equal(currentProgram.current_state.review_closeout.status, 'passed');
  assert.equal(currentProgram.current_state.green_baseline.credible, true);
  assert.equal(currentProgram.current_state.active_baton.id, 'managed_product_entry_hardening');
  assert.equal(currentProgram.current_state.foundation_milestones.stable_deliverable_manual_test_driven_hardening.status, 'closeout_completed');
  assert.equal(currentProgram.current_state.foundation_milestones.stable_deliverable_manual_test_driven_hardening.commit, '96dc6c1');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_source_intake_shared_source_truth_baseline.commit, 'a4424d2');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_family_source_truth_consumption_convergence.commit, 'e894641');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_runtime_watch_locator_integrity_hardening.status, 'closeout_completed');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_family_parity_governance_surface_convergence.status, 'closeout_completed');
  assert.equal(existsSync(path.resolve(HARDENING_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(BASELINE_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(MANUAL_TEST_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(HARDENING_BACKLOG)), true);
  assert.equal(contract.activation.owner, 'Codex App');
  assert.equal(contract.activation.required, true);
  assert.equal(contract.activation.opens_phase_2, false);
  assert.equal(contract.status, 'closeout_completed');
  assert.equal(contract.review_status, 'passed');
  assert.equal(contract.execution_summary.suite_result, 'pass');
});

test('stable deliverable manual-test contract is scoped only to ppt_deck and xiaohongshu', () => {
  const contract = readJson(MANUAL_TEST_CONTRACT);

  assert.deepEqual(contract.scope.deliverables, ['ppt_deck', 'xiaohongshu']);
  assert.deepEqual(contract.scope.formal_entry, ['MCP', 'CLI']);
  assert.equal(contract.scope.controller_repo_verified, false);
});

test('stable deliverable manual-test contract freezes tracked-only truth-freeze reproduction commands', () => {
  const contract = readJson(MANUAL_TEST_CONTRACT);

  assert.equal(contract.tracked_only_truth_freeze_reproduction.required, true);
  assert.equal(contract.tracked_only_truth_freeze_reproduction.clean_clone_required, true);
  assert.deepEqual(contract.tracked_only_truth_freeze_reproduction.targeted_tests, [
    'tests/runtime-alignment-p0.test.ts',
    'tests/poster-production-hardening-freeze.test.ts',
    'tests/p21-operations-and-evaluation-os.test.ts',
    'tests/stable-deliverable-manual-test-package.test.ts',
  ]);
  assert.equal(
    contract.tracked_only_truth_freeze_reproduction.required_commands.includes(
      'node --test tests/runtime-alignment-p0.test.ts tests/poster-production-hardening-freeze.test.ts tests/p21-operations-and-evaluation-os.test.ts tests/stable-deliverable-manual-test-package.test.ts',
    ),
    true,
  );
  assert.equal(contract.tracked_only_truth_freeze_reproduction.required_commands.includes('npm run test:full'), true);
});

test('stable deliverable manual-test contract defines ppt_deck and xiaohongshu manual cases with routes, artifacts, sampling, and pass/fail criteria', () => {
  const contract = readJson(MANUAL_TEST_CONTRACT);
  const ppt = contract.manual_cases.find((item) => item.deliverable === 'ppt_deck');
  const xhs = contract.manual_cases.find((item) => item.deliverable === 'xiaohongshu');

  assert.equal(Boolean(ppt), true);
  assert.equal(ppt.profile_id, 'lecture_student');
  assert.deepEqual(ppt.route_sequence, [
    'storyline',
    'detailed_outline',
    'slide_blueprint',
    'visual_direction',
    'render_html',
    'visual_director_review',
    'screenshot_review',
    'fix_html',
    'export_pptx',
  ]);
  assert.equal(ppt.expected_artifacts.includes('ppt export bundle or explicit hard block'), true);
  assert.equal(ppt.failure_sampling.length > 0, true);
  assert.equal(ppt.pass_criteria.length > 0, true);
  assert.equal(ppt.fail_criteria.length > 0, true);

  assert.equal(Boolean(xhs), true);
  assert.equal(xhs.profile_id, 'standard_note');
  assert.deepEqual(xhs.route_sequence, [
    'research',
    'storyline',
    'single_note_plan',
    'visual_direction',
    'render_html',
    'visual_director_review',
    'screenshot_review',
    'fix_html',
    'publish_copy',
    'export_bundle',
  ]);
  assert.equal(xhs.expected_artifacts.includes('publish copy artifact'), true);
  assert.equal(xhs.expected_artifacts.includes('export bundle with html/caption/png delivery surfaces'), true);
  assert.equal(xhs.failure_sampling.length > 0, true);
  assert.equal(xhs.pass_criteria.length > 0, true);
  assert.equal(xhs.fail_criteria.length > 0, true);
});

test('stable deliverable manual-test backlog surface remains machine-readable after baton absorption', () => {
  const contract = readJson(MANUAL_TEST_CONTRACT);
  const backlog = readJson(HARDENING_BACKLOG);

  assert.equal(existsSync(path.resolve(MANUAL_TEST_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(HARDENING_BACKLOG)), true);
  assert.equal(contract.backlog_capture.file, HARDENING_BACKLOG);
  assert.equal(backlog.status, 'manual_test_completed_no_findings');
  assert.deepEqual(backlog.allowed_scope, ['ppt_deck', 'xiaohongshu']);
  assert.equal(backlog.execution_summary.suite_result, 'pass');
  assert.equal(backlog.execution_summary.findings_recorded, 0);
  assert.deepEqual(backlog.items, []);
});
