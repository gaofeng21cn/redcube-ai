import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const TRANCHE_CONTRACT = 'contracts/runtime-program/phase-2-runtime-watch-locator-integrity-hardening.json';
const TRANCHE_BRIEF = 'docs/program/phase-2/phase_2_runtime_watch_locator_integrity_hardening.md';
const PREDECESSOR_CONTRACT = 'contracts/runtime-program/phase-2-operator-surface-consistency-hardening.json';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('runtime watch locator integrity hardening remains absorbed provenance after Hermes canonical closure took the active tranche', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(TRANCHE_CONTRACT);
  const predecessor = readJson(PREDECESSOR_CONTRACT);

  assert.equal(contract.tranche_id, 'phase_2_runtime_watch_locator_integrity_hardening');
  assert.equal(contract.status, 'closeout_completed');
  assert.equal(contract.review_status, 'passed');
  assert.equal(predecessor.closeout.absorbed_to_main, true);
  assert.equal(currentProgram.current_state.phase_label, 'Hermes / managed family closure truth');
  assert.equal(currentProgram.current_state.workstream, 'hermes_managed_family_closure_truth');
  assert.equal(currentProgram.current_state.active_baton.id, 'hermes_managed_family_closure_truth');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_runtime_watch_locator_integrity_hardening.status, 'closeout_completed');
  assert.deepEqual(contract.run_locator_integrity_surface.required_run_record_fields, ['topic_id', 'deliverable_id']);
  assert.deepEqual(contract.run_locator_integrity_surface.canonical_locator_fields, ['workspaceRoot', 'topicId', 'deliverableId', 'runId']);
  assert.equal(currentProgram.current_state.active_baton.scope.required_operator_surfaces.includes('review watch'), true);
  assert.equal(existsSync(path.resolve(PREDECESSOR_CONTRACT)), true);
});

test('runtime watch locator integrity hardening freezes run identity persistence and quartet fail-closed behavior honestly across current truth surfaces', () => {
  const contract = readJson(TRANCHE_CONTRACT);
  const brief = read(TRANCHE_BRIEF);
  const rootAgents = read('AGENTS.md');
  const readme = read('README.md');
  const readmeZh = read('README.zh-CN.md');
  const docsIndex = read('docs/README.md');
  const docsIndexZh = read('docs/README.zh-CN.md');
  const runtimeArchitecture = read('docs/runtime_architecture.md');
  const runtimePolicy = read('docs/policies/runtime_operating_model.md');
  const positioning = read('docs/domain-harness-os-positioning.md');

  assert.equal(existsSync(path.resolve(TRANCHE_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(TRANCHE_BRIEF)), true);
  assert.deepEqual(contract.minimal_test_surface.truth_freeze_tests, ['tests/phase-2-runtime-watch-locator-integrity-hardening.test.js']);
  assert.deepEqual(contract.run_locator_integrity_surface.required_run_record_fields, ['topic_id', 'deliverable_id']);
  assert.equal(contract.run_locator_integrity_surface.deliverable_watch_without_run_rule.includes('without runId or run'), true);
  assert.equal(brief.includes('`topic_id` / `deliverable_id`'), true);
  assert.equal(brief.includes('quartet locator'), true);
  assert.equal(brief.includes('只给 `workspaceRoot/topicId/deliverableId`、不带 `runId` / `run` 时'), true);
  assert.equal(rootAgents.includes('contracts/runtime-program/current-program.json'), true);
  assert.equal(readme.includes('phase-2 runtime watch locator integrity hardening remains absorbed provenance on the same mainline'), true);
  assert.equal(readmeZh.includes('runtime watch locator integrity hardening 继续作为同一主线上的 absorbed provenance'), true);
  assert.equal(docsIndex.includes('Phase 2 runtime watch locator integrity hardening'), true);
  assert.equal(docsIndexZh.includes('Phase 2 runtime watch locator integrity hardening'), true);
  assert.equal(runtimeArchitecture.includes('`runtime watch locator integrity hardening` 已把 deliverable-scope run record 的 `topic_id` / `deliverable_id` 收紧进 canonical run envelope'), true);
  assert.equal(runtimePolicy.includes('`runtime watch locator integrity hardening` 已在当前主线上吸收'), true);
  assert.equal(positioning.includes('当前 active tranche 是 `Hermes stable family closure truth`'), true);
});
