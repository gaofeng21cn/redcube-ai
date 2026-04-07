import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const MANUAL_TEST_CONTRACT = 'contracts/runtime-program/stable-deliverable-manual-test-driven-hardening.json';
const HARDENING_BACKLOG = 'contracts/runtime-program/stable-deliverable-hardening-backlog.json';
const OPERATOR_BRIEF = 'docs/stable_deliverable_manual_test_brief.md';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('stable deliverable manual-test contract stays explicitly gated behind Codex App activation', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(MANUAL_TEST_CONTRACT);

  assert.equal(currentProgram.current_state.review_closeout.status, 'passed');
  assert.equal(currentProgram.current_state.green_baseline.credible, true);
  assert.equal(currentProgram.current_state.next_phase.p1_allowed, false);
  assert.equal(currentProgram.current_state.next_phase.phase_2_allowed, false);
  assert.equal(currentProgram.current_state.next_baton.id, contract.baton_id);
  assert.equal(currentProgram.current_state.next_baton.activation.required, true);
  assert.equal(currentProgram.current_state.next_baton.activation.mode, 'explicit_codex_app_only');
  assert.equal(currentProgram.current_state.next_baton.activation.activated, true);
  assert.equal(currentProgram.current_state.next_baton.activation.opens_phase_2, false);
  assert.equal(contract.activation.owner, 'Codex App');
  assert.equal(contract.activation.required, true);
  assert.equal(contract.activation.opens_phase_2, false);
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
    'tests/runtime-alignment-p0.test.js',
    'tests/poster-production-hardening-freeze.test.js',
    'tests/p21-operations-and-evaluation-os.test.js',
    'tests/stable-deliverable-manual-test-package.test.js',
  ]);
  assert.equal(
    contract.tracked_only_truth_freeze_reproduction.required_commands.includes(
      'node --test tests/runtime-alignment-p0.test.js tests/poster-production-hardening-freeze.test.js tests/p21-operations-and-evaluation-os.test.js tests/stable-deliverable-manual-test-package.test.js',
    ),
    true,
  );
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
    'publish_copy',
    'export_bundle',
  ]);
  assert.equal(xhs.expected_artifacts.includes('publish copy artifact'), true);
  assert.equal(xhs.expected_artifacts.includes('export bundle with html/caption/png delivery surfaces'), true);
  assert.equal(xhs.failure_sampling.length > 0, true);
  assert.equal(xhs.pass_criteria.length > 0, true);
  assert.equal(xhs.fail_criteria.length > 0, true);
});

test('stable deliverable manual-test brief and backlog surface stay repo-tracked and machine-readable', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(MANUAL_TEST_CONTRACT);
  const backlog = readJson(HARDENING_BACKLOG);
  const brief = read(OPERATOR_BRIEF);

  assert.equal(existsSync(path.resolve(MANUAL_TEST_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(HARDENING_BACKLOG)), true);
  assert.equal(existsSync(path.resolve(OPERATOR_BRIEF)), true);
  assert.equal(currentProgram.current_state.next_baton.artifacts.manual_test_contract, MANUAL_TEST_CONTRACT);
  assert.equal(currentProgram.current_state.next_baton.artifacts.manual_test_brief, OPERATOR_BRIEF);
  assert.equal(currentProgram.current_state.next_baton.artifacts.hardening_backlog, HARDENING_BACKLOG);
  assert.equal(contract.backlog_capture.file, HARDENING_BACKLOG);
  assert.equal(backlog.status, 'awaiting_manual_findings');
  assert.deepEqual(backlog.allowed_scope, ['ppt_deck', 'xiaohongshu']);
  assert.deepEqual(backlog.items, []);
  assert.equal(brief.includes('stable deliverable manual-test-driven hardening'), true);
  assert.equal(brief.includes('Codex App'), true);
  assert.equal(brief.includes('ppt_deck'), true);
  assert.equal(brief.includes('xiaohongshu'), true);
  assert.equal(brief.includes('Phase 2 / source intake + shared source truth'), true);
});
