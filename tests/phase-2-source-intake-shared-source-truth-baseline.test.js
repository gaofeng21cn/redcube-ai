import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const BASELINE_CONTRACT = 'contracts/runtime-program/phase-2-source-intake-shared-source-truth-baseline.json';
const BASELINE_BRIEF = 'docs/program/phase-2/phase_2_source_intake_shared_source_truth_baseline.md';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readImplementation(file) {
  const source = read(file);
  const shell = source.trim().match(/^export \* from '\.\/([^']+\.ts)';$/);
  return shell ? read(path.join(path.dirname(file), shell[1])) : source;
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('phase-2 minimum baseline contract remains absorbed provenance behind the current repo-verified product entry tranche', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(BASELINE_CONTRACT);

  assert.equal(currentProgram.current_state.phase_id, 'repo_verified_product_entry_and_opl_federation');
  assert.equal(currentProgram.current_state.active_baton.id, 'managed_product_entry_hardening');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_source_intake_shared_source_truth_baseline.commit, 'a4424d2');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_family_source_truth_consumption_convergence.commit, 'e894641');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_runtime_watch_locator_integrity_hardening.status, 'closeout_completed');
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
  const gatewayIntake = readImplementation('packages/redcube-gateway/src/actions/intake-source.js');
  const mcpServer = read('apps/redcube-mcp/dist/server.js');
  const sharedSourceTruth = readImplementation('packages/redcube-runtime/src/shared-source-truth.js');
  const deliverableRouteLocal = readImplementation('packages/redcube-runtime/src/deliverable-route-local.js');

  const artifactIds = contract.artifact_schema.canonical_artifacts.map((item) => item.artifact_id);
  assert.deepEqual(artifactIds, ['source_index', 'extracted_materials', 'source_audit', 'source_brief']);
  assert.equal(contract.artifact_schema.integration_contracts.gateway_actions.includes('intakeSource'), true);
  assert.equal(contract.artifact_schema.integration_contracts.mcp_tools.includes('redcube_sources'), true);
  assert.equal(contract.artifact_schema.integration_contracts.cli_commands.some((item) => item.includes('redcube source intake')), true);
  assert.deepEqual(contract.artifact_schema.integration_contracts.consumer_families.ppt_deck, ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction']);
  assert.deepEqual(contract.artifact_schema.integration_contracts.consumer_families.xiaohongshu, ['research', 'storyline', 'single_note_plan', 'visual_direction']);
  assert.equal(gatewayIntake.includes("surface_kind: 'source_intake'"), true);
  assert.equal(mcpServer.includes("name: 'redcube_sources'"), true);
  assert.equal(mcpServer.includes("intake_source: 'intakeSource'"), true);
  assert.equal(sharedSourceTruth.includes('source_index'), true);
  assert.equal(sharedSourceTruth.includes('extracted_materials'), true);
  assert.equal(sharedSourceTruth.includes('source_audit'), true);
  assert.equal(sharedSourceTruth.includes('source_brief'), true);
  assert.equal(deliverableRouteLocal.includes('shared_source_truth: loadSharedSourceTruth(workspaceRoot, topicId)'), true);
});

test('phase-2 minimum baseline contract records gate surface, tests, and the absorbed next tranche honestly', () => {
  const contract = readJson(BASELINE_CONTRACT);

  assert.equal(contract.gate_surface.required_truth.includes('formal entry remains MCP / CLI only'), true);
  assert.equal(contract.gate_surface.source_readiness_gate.authoritative_artifact, 'topics/<topic>/canonical/source-audit.json');
  assert.equal(contract.gate_surface.audit_and_review_surfaces.includes('auditDeliverable'), true);
  assert.equal(contract.gate_surface.audit_and_review_surfaces.includes('runtimeWatch'), true);
  assert.equal(contract.minimal_test_surface.truth_freeze_tests.includes('tests/phase-2-source-intake-shared-source-truth-baseline.test.js'), true);
  assert.equal(contract.minimal_test_surface.baseline_capability_tests.includes('tests/source-intake.test.js'), true);
  assert.equal(contract.minimal_test_surface.baseline_capability_tests.includes('tests/mcp-gateway.test.js'), true);
  assert.equal(contract.closeout_evidence.must_record.includes('Phase 2 minimal baseline is now on the mainline'), true);
  assert.equal(contract.closeout_evidence.must_not_claim.includes('controller became a formal entry'), true);
  assert.equal(contract.closeout.next_tranche_candidate, 'phase_2_review_export_gate_audit_hardening');
});
