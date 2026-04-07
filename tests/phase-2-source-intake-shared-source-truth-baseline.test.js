import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const BASELINE_CONTRACT = 'contracts/runtime-program/phase-2-source-intake-shared-source-truth-baseline.json';
const BASELINE_BRIEF = 'docs/phase_2_source_intake_shared_source_truth_baseline.md';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('phase-2 minimum baseline contract is active on the current mainline and stays bounded to MCP/CLI source intake plus shared source truth', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(BASELINE_CONTRACT);

  assert.equal(currentProgram.current_state.phase_id, 'Phase2');
  assert.equal(currentProgram.current_state.active_baton.id, contract.tranche_id);
  assert.equal(contract.status, 'closeout_completed');
  assert.equal(contract.review_status, 'passed');
  assert.equal(contract.program_mode, 'autonomous_longrun');
  assert.deepEqual(contract.formal_entry.repo_verified, ['MCP', 'CLI']);
  assert.equal(contract.formal_entry.controller_repo_verified, false);
  assert.equal(contract.foundations.phase_1_render_ceiling_upgrade.status, 'completed');
  assert.equal(contract.foundations.p0_truth_surface_and_green_baseline_convergence.review_closeout, 'passed');
  assert.equal(contract.foundations.p0_truth_surface_and_green_baseline_convergence.green_baseline_credible, true);
  assert.equal(contract.foundations.stable_deliverable_manual_test_driven_hardening.commit, '96dc6c1');
  assert.equal(contract.foundations.phase_2_activation_package_freeze.commit, '3a7fbd6');
  assert.equal(contract.object_boundary.in_scope.includes('source intake baseline on shared substrate'), true);
  assert.equal(contract.object_boundary.in_scope.includes('shared source truth baseline on shared substrate'), true);
  assert.equal(contract.object_boundary.out_of_scope.includes('controller expansion'), true);
});

test('phase-2 minimum baseline contract freezes canonical quartet, formal entry surfaces, and family consumption expectations', () => {
  const contract = readJson(BASELINE_CONTRACT);
  const gatewayIntake = read('packages/redcube-gateway/src/actions/intake-source.js');
  const mcpServer = read('apps/redcube-mcp/src/server.js');
  const sharedSourceTruth = read('packages/redcube-runtime/src/shared-source-truth.js');
  const deliverableRoutes = read('packages/redcube-runtime/src/deliverable-routes.js');

  const artifactIds = contract.artifact_schema.canonical_artifacts.map((item) => item.artifact_id);
  assert.deepEqual(artifactIds, ['source_index', 'extracted_materials', 'source_audit', 'source_brief']);
  assert.equal(contract.artifact_schema.integration_contracts.gateway_actions.includes('intakeSource'), true);
  assert.equal(contract.artifact_schema.integration_contracts.mcp_tools.includes('intake_source'), true);
  assert.equal(contract.artifact_schema.integration_contracts.cli_commands.some((item) => item.includes('redcube source intake')), true);
  assert.deepEqual(contract.artifact_schema.integration_contracts.consumer_families.ppt_deck, ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction']);
  assert.deepEqual(contract.artifact_schema.integration_contracts.consumer_families.xiaohongshu, ['research', 'storyline', 'single_note_plan', 'visual_direction']);
  assert.equal(gatewayIntake.includes("surface_kind: 'source_intake'"), true);
  assert.equal(mcpServer.includes("name: 'intake_source'"), true);
  assert.equal(sharedSourceTruth.includes('source_index'), true);
  assert.equal(sharedSourceTruth.includes('extracted_materials'), true);
  assert.equal(sharedSourceTruth.includes('source_audit'), true);
  assert.equal(sharedSourceTruth.includes('source_brief'), true);
  assert.equal(deliverableRoutes.includes('shared_source_truth: loadSharedSourceTruth(workspaceRoot, topicId)'), true);
});

test('phase-2 minimum baseline brief and docs indexes expose the baseline as active while keeping scope honest', () => {
  const brief = read(BASELINE_BRIEF);
  const readme = read('README.md');
  const readmeZh = read('README.zh-CN.md');
  const runtimeArchitecture = read('docs/runtime_architecture.md');
  const docsIndex = read('docs/README.md');
  const docsIndexZh = read('docs/README.zh-CN.md');
  const policy = read('docs/policies/runtime_operating_model.md');
  const positioning = read('docs/domain-harness-os-positioning.md');

  assert.equal(existsSync(path.resolve(BASELINE_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(BASELINE_BRIEF)), true);
  assert.equal(brief.includes('已经吸收到主线的最小 baseline'), true);
  assert.equal(brief.includes('formal entry：仍只有 `MCP / CLI`'), true);
  assert.equal(brief.includes('它已经不是 activation-package freeze'), true);
  assert.equal(brief.includes('但也不是“整个 Phase 2 都已完成”'), true);
  assert.equal(readme.includes('Phase 2 minimal baseline for source intake + shared source truth is now on the mainline'), true);
  assert.equal(readmeZh.includes('Phase 2 source intake + shared source truth 的最小 baseline 已进入正式主线'), true);
  assert.equal(runtimeArchitecture.includes('Phase 2 source intake + shared source truth 的最小 baseline 已进入正式主线'), true);
  assert.equal(policy.includes('当前 Phase 2 最小 baseline'), true);
  assert.equal(positioning.includes('当前 Phase 2 最小 baseline 状态'), true);
  assert.equal(docsIndex.includes('phase_2_source_intake_shared_source_truth_baseline.md'), true);
  assert.equal(docsIndexZh.includes('phase_2_source_intake_shared_source_truth_baseline.md'), true);
});

test('phase-2 minimum baseline contract records gate surface, tests, and next tranche honestly', () => {
  const contract = readJson(BASELINE_CONTRACT);

  assert.equal(contract.gate_surface.required_truth.includes('formal entry remains MCP / CLI only'), true);
  assert.equal(contract.gate_surface.source_readiness_gate.authoritative_artifact, 'topics/<topic>/canonical/source-audit.json');
  assert.equal(contract.gate_surface.audit_and_review_surfaces.includes('auditDeliverable'), true);
  assert.equal(contract.gate_surface.audit_and_review_surfaces.includes('runtimeWatch'), true);
  assert.equal(contract.minimal_test_surface.truth_freeze_tests.includes('tests/phase-2-source-intake-shared-source-truth-baseline.test.js'), true);
  assert.equal(contract.minimal_test_surface.baseline_capability_tests.includes('tests/source-intake.test.js'), true);
  assert.equal(contract.minimal_test_surface.baseline_capability_tests.includes('tests/import-legacy-project.test.js'), true);
  assert.equal(contract.minimal_test_surface.baseline_capability_tests.includes('tests/mcp-gateway.test.js'), true);
  assert.equal(contract.closeout_evidence.must_record.includes('Phase 2 minimal baseline is now on the mainline'), true);
  assert.equal(contract.closeout_evidence.must_not_claim.includes('controller became a formal entry'), true);
  assert.equal(contract.closeout.next_tranche_candidate, 'phase_2_review_export_gate_audit_hardening');
});
