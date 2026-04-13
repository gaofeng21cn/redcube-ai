import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const HARDENING_CONTRACT = 'contracts/runtime-program/phase-2-review-export-gate-audit-hardening.json';
const HARDENING_BRIEF = 'docs/program/phase-2/phase_2_review_export_gate_audit_hardening.md';
const BASELINE_CONTRACT = 'contracts/runtime-program/phase-2-source-intake-shared-source-truth-baseline.json';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('phase-2 review/export/gate/audit hardening stays absorbed provenance while repo-verified product entry federation is the active tranche', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(HARDENING_CONTRACT);

  assert.equal(currentProgram.current_state.phase_id, 'repo_verified_product_entry_and_opl_federation');
  assert.equal(currentProgram.current_state.workstream, 'repo_verified_product_entry_and_opl_federation');
  assert.equal(currentProgram.current_state.active_baton.id, 'managed_product_entry_hardening');
  assert.equal(contract.status, 'closeout_completed');
  assert.equal(contract.review_status, 'passed');
  assert.equal(contract.program_mode, 'autonomous_longrun');
  assert.deepEqual(contract.formal_entry.repo_verified, ['MCP', 'CLI']);
  assert.equal(contract.formal_entry.controller_repo_verified, false);
  assert.equal(contract.foundations.phase_2_source_intake_shared_source_truth_baseline.status, 'closeout_completed');
  assert.equal(contract.foundations.phase_2_source_intake_shared_source_truth_baseline.commit, 'a4424d2');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_source_intake_shared_source_truth_baseline.status, 'closeout_completed');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_family_source_truth_consumption_convergence.status, 'closeout_completed');
  assert.equal(currentProgram.current_state.active_baton.scope.required_audit_surfaces.includes('auditDeliverable'), true);
  assert.equal(existsSync(path.resolve(HARDENING_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(BASELINE_CONTRACT)), true);
});

test('phase-2 review/export/gate/audit hardening contract freezes canonical audit and runtime-watch surfaces without promoting controller', () => {
  const contract = readJson(HARDENING_CONTRACT);
  const auditAction = read('packages/redcube-gateway/src/actions/audit-deliverable.js');
  const runtimeWatchAction = read('packages/redcube-gateway/src/actions/runtime-watch.js');

  assert.equal(contract.object_boundary.in_scope.includes('auditDeliverable reads canonical source readiness before approving downstream family work'), true);
  assert.equal(contract.object_boundary.in_scope.includes('runtimeWatch exposes shared source readiness plus export gate summaries across stable families'), true);
  assert.equal(contract.object_boundary.out_of_scope.includes('controller expansion'), true);
  assert.equal(contract.gate_surface.required_truth.includes('formal entry remains MCP / CLI only'), true);
  assert.equal(contract.gate_surface.required_truth.includes('source readiness gate is enforced from canonical source-audit.json inside audit and watch surfaces'), true);
  assert.equal(contract.audit_and_watch_surface.audit_action, 'auditDeliverable');
  assert.equal(contract.audit_and_watch_surface.runtime_watch_action, 'runtimeWatch');
  assert.equal(contract.audit_and_watch_surface.embedded_summaries.includes('source_readiness_summary'), true);
  assert.equal(contract.audit_and_watch_surface.embedded_summaries.includes('gate_summary'), true);
  assert.equal(auditAction.includes('source_readiness_summary'), true);
  assert.equal(runtimeWatchAction.includes('source_readiness_summary'), true);
});

test('phase-2 review/export/gate/audit hardening brief and public docs keep the absorbed tranche honest', () => {
  const brief = read(HARDENING_BRIEF);
  const readme = read('README.md');
  const readmeZh = read('README.zh-CN.md');
  const runtimeArchitecture = read('docs/runtime_architecture.md');
  const policy = read('docs/policies/runtime_operating_model.md');
  const docsIndex = read('docs/README.md');
  const docsIndexZh = read('docs/README.zh-CN.md');

  assert.equal(existsSync(path.resolve(HARDENING_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(HARDENING_BRIEF)), true);
  assert.equal(brief.includes('review / export / gate / audit hardening'), true);
  assert.equal(brief.includes('source_readiness_summary'), true);
  assert.equal(brief.includes('gate_summary'), true);
  assert.equal(readme.includes('review / export / gate / audit hardening now has an absorbed tranche on the same mainline'), true);
  assert.equal(readmeZh.includes('review / export / gate / audit hardening 已在同一主线上吸收一条 tranche'), true);
  assert.equal(runtimeArchitecture.includes('review / export / gate / audit hardening` 已吸收为前置 provenance'), true);
  assert.equal(
    policy.includes('review / export / gate / audit hardening` 与 `family source-truth consumption convergence` 已在当前主线上吸收为前置 provenance'),
    true,
  );
  assert.equal(docsIndex.includes('phase_2_review_export_gate_audit_hardening.md'), true);
  assert.equal(docsIndexZh.includes('phase_2_review_export_gate_audit_hardening.md'), true);
});
