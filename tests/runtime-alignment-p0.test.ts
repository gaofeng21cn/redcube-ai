// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const HERMES_ACTIVATION_CONTRACT = 'contracts/runtime-program/hermes-runtime-substrate-activation-package.json';
const HERMES_CAPABILITY_MAP_CONTRACT = 'contracts/runtime-program/hermes-runtime-capability-extraction-map.json';
const HERMES_CLOSURE_CONTRACT = 'contracts/runtime-program/hermes-managed-family-closure-truth.json';
const HERMES_ACTIVATION_BRIEF = 'docs/program/hermes/hermes_runtime_substrate_activation_package.md';
const HERMES_CAPABILITY_MAP_BRIEF = 'docs/program/hermes/hermes_runtime_capability_extraction_map.md';
const HERMES_CLOSURE_BRIEF = 'docs/program/hermes/hermes_managed_family_closure_truth.md';
const PHASE_2_FAMILY_PARITY_CONTRACT = 'contracts/runtime-program/phase-2-family-parity-governance-surface-convergence.json';
const PHASE_2_RUNTIME_WATCH_CONTRACT = 'contracts/runtime-program/phase-2-runtime-watch-locator-integrity-hardening.json';
const P21_CLOSEOUT_CONTRACT = 'contracts/runtime-program/p21-operations-evaluation-closeout.json';
const POSTER_FREEZE_CONTRACT = 'contracts/runtime-program/poster-production-hardening-freeze.json';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('repo-tracked docs keep durable runtime truth while public readmes stay shell-first and codex-default', () => {
  const pkg = JSON.parse(read('package.json'));
  const cli = read('apps/redcube-cli/src/cli.ts');

  assert.equal(Boolean(pkg.scripts.redcube), true);
  assert.equal(Boolean(pkg.scripts.mcp), true);
  assert.equal(Boolean(pkg.scripts.controller), false);
  assert.equal(cli.includes("preferredEntry: ['CLI', 'MCP']"), true);
  for (const file of [
    'AGENTS.md',
    'README.md',
    'README.zh-CN.md',
    'docs/README.md',
    'docs/README.zh-CN.md',
    'docs/project.md',
    'docs/invariants.md',
    'docs/runtime_architecture.md',
    'docs/policies/runtime_operating_model.md',
    'docs/status.md',
    'contracts/README.md',
  ]) {
    assert.equal(existsSync(path.resolve(file)), true, file);
  }
});

test('CLI help exposes the current deliverable adapter set, including the explicit Hermes proof lane', () => {
  const cli = read('apps/redcube-cli/src/cli.ts');

  assert.equal(
    cli.includes('[--adapter <host_agent|hermes_native_proof>]'),
    true,
  );
  assert.equal(
    cli.includes('external_llm'),
    false,
  );
});

test('current program points to the current mainline while retaining durable identity boundaries and historical local provenance', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);

  assert.equal(currentProgram.program_id, 'redcube-runtime-program');
  assert.equal(
    currentProgram.longrun_goal.north_star.includes('keep CLI as the default formal entry while retaining MCP as the supported protocol layer'),
    true,
  );
  assert.equal(
    currentProgram.longrun_goal.north_star.includes('preserve durable identity, audit/watch/review/projection truth while leaving managed web runtime as a future shape on the same substrate'),
    true,
  );
  assert.equal(
    currentProgram.longrun_goal.north_star.includes('keep OPL Runtime Manager as a thin federated runtime manager over external Hermes-Agent rather than a RedCube truth owner'),
    true,
  );
  assert.equal(currentProgram.longrun_goal.runtime_manager_boundary.manager, 'OPL Runtime Manager');
  assert.equal(
    currentProgram.longrun_goal.runtime_manager_boundary.consumes_redcube_surfaces.includes(
      'skill_catalog.domain_projection.opl_runtime_manager_registration',
    ),
    true,
  );
  assert.equal(currentProgram.longrun_goal.runtime_manager_boundary.does_not_own.includes('visual-domain truth'), true);
  assert.match(currentProgram.longrun_goal.final_target_route.opl_federated_entry, /OPL Runtime Manager -> external Hermes-Agent runtime substrate/);
  assert.match(currentProgram.longrun_goal.language_target.typescript_owner, /product entry/);
  assert.match(currentProgram.longrun_goal.language_target.python_owner, /native Office\/PPT/);
  assert.equal(currentProgram.formal_entry.default_formal_entry, 'CLI');
  assert.deepEqual(currentProgram.formal_entry.supported_protocol_layer, ['MCP']);
  assert.equal(currentProgram.execution_handle_contract.program_id.role, 'active mainline control-plane pointer');
  assert.deepEqual(currentProgram.execution_handle_contract.topic_id.durable_surfaces, [
    'topics/<topic>/canonical/source-audit.json',
    'topics/<topic>/publication-state.json',
  ]);
  assert.deepEqual(currentProgram.execution_handle_contract.deliverable_id.durable_surfaces, [
    'topics/<topic>/deliverables/<deliverable>/deliverable.json',
    'topics/<topic>/deliverables/<deliverable>/contracts/delivery-contract.json',
    'topics/<topic>/deliverables/<deliverable>/reports/review-state.json',
  ]);
  assert.deepEqual(currentProgram.execution_handle_contract.run_id.durable_surfaces, [
    'runtime/runs/<run>.json',
    'runtime/events/<run>.jsonl',
    'runtimeWatch',
    'ops_eval_summary',
  ]);
  assert.equal(currentProgram.current_state.runtime_substrate_owner, 'optional_hosted_runtime_carrier');
  assert.equal(currentProgram.current_state.runtime_manager_status.target_layer, 'OPL Runtime Manager');
  assert.equal(
    currentProgram.current_state.runtime_manager_status.registration_surface,
    'skill_catalog.domain_projection.opl_runtime_manager_registration',
  );
  assert.equal(currentProgram.current_state.runtime_manager_status.full_sidecar_enabled_now, false);
  assert.equal(currentProgram.current_state.deployment_host, 'codex_local_operator_host');
  assert.equal(currentProgram.current_state.host_agent_longterm_owner, false);
  assert.equal(currentProgram.current_state.phase_label, 'Repo-Verified Product Entry And OPL Federation');
  assert.equal(currentProgram.current_state.workstream, 'repo_verified_product_entry_and_opl_federation');
  assert.equal(currentProgram.current_state.active_baton.id, 'managed_product_entry_hardening');
  assert.equal(currentProgram.current_state.active_baton.review_status, 'verified');
  assert.equal(
    currentProgram.current_state.active_baton.artifacts.product_entry_contract,
    'contracts/runtime-program/redcube-product-entry-mvp.json',
  );
  assert.equal(
    currentProgram.current_state.active_baton.artifacts.federated_product_entry_contract,
    'contracts/runtime-program/opl-gateway-federated-product-entry.json',
  );
  assert.equal(
    currentProgram.current_state.active_baton.artifacts.managed_product_entry_contract,
    'contracts/runtime-program/managed-product-entry-hardening.json',
  );
  assert.equal(currentProgram.current_state.foundation_milestones.hermes_runtime_substrate_canonical_closure.status, 'historical_local_migration_artifact');
  assert.equal(currentProgram.current_state.foundation_milestones.hermes_stable_family_closure_truth.status, 'historical_local_migration_artifact');
  assert.equal(currentProgram.current_state.foundation_milestones.hermes_managed_family_closure_truth.status, 'historical_local_migration_artifact');
  assert.equal(currentProgram.current_state.foundation_milestones.upstream_hermes_agent_activation_package.status, 'closeout_completed');
  assert.equal(currentProgram.current_state.foundation_milestones.upstream_hermes_runtime_owner_cutover.status, 'closeout_completed');
  assert.equal(currentProgram.current_state.foundation_milestones.service_safe_domain_entry_adapter.status, 'closeout_completed');
  assert.deepEqual(currentProgram.current_state.active_baton.scope.consumer_families, [
    'ppt_deck',
    'xiaohongshu',
    'poster_onepager',
  ]);
  assert.deepEqual(currentProgram.current_state.active_baton.scope.required_identity_fields, [
    'program_id',
    'topic_id',
    'deliverable_id',
    'run_id',
  ]);
});

test('phase-2 provenance and historical snapshots remain tracked but are no longer the active mainline tranche', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const phase2FamilyParity = readJson(PHASE_2_FAMILY_PARITY_CONTRACT);
  const phase2RuntimeWatch = readJson(PHASE_2_RUNTIME_WATCH_CONTRACT);
  const p21 = readJson(P21_CLOSEOUT_CONTRACT);
  const poster = readJson(POSTER_FREEZE_CONTRACT);

  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_runtime_watch_locator_integrity_hardening.status, 'closeout_completed');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_family_parity_governance_surface_convergence.status, 'closeout_completed');
  assert.equal(phase2RuntimeWatch.status, 'closeout_completed');
  assert.equal(phase2FamilyParity.status, 'closeout_completed');
  assert.equal(p21.historical_snapshot, true);
  assert.equal(p21.is_active_mainline, false);
  assert.equal(poster.historical_snapshot, true);
  assert.equal(poster.is_active_mainline, false);
});

test('truth-freeze suites do not read ignored local tooling state directly', () => {
  const forbiddenRoots = [
    ['.', 'omx', '/'].join(''),
    ['.', 'codex', '/'].join(''),
  ];
  const readPrefixes = [
    'read(',
    'readJson(',
    'existsSync(path.resolve(',
  ];
  const backtick = '`';

  for (const file of [
    'tests/runtime-alignment-p0.test.ts',
    'tests/hermes-runtime-canonical-path.test.ts',
    'tests/poster-production-hardening-freeze.test.ts',
    'tests/p21-operations-and-evaluation-os.test.ts',
    'tests/stable-deliverable-manual-test-package.test.ts',
    'tests/phase-2-source-intake-activation-package-freeze.test.ts',
    'tests/phase-2-source-intake-shared-source-truth-baseline.test.ts',
    'tests/phase-2-family-source-truth-consumption-convergence.test.ts',
    'tests/phase-2-publication-projection-delivery-contract-convergence.test.ts',
    'tests/phase-2-direct-delivery-operator-handoff-hardening.test.ts',
    'tests/phase-2-operator-surface-consistency-hardening.test.ts',
  ]) {
    const text = read(file);
    for (const root of forbiddenRoots) {
      for (const prefix of readPrefixes) {
        assert.equal(
          text.includes(`${prefix}'${root}`) || text.includes(`${prefix}"${root}`) || text.includes(`${prefix}${backtick}${root}`),
          false,
          `${file} -> ${prefix}${root}`,
        );
      }
    }
  }
});

test('P0 truth surfaces keep CLI and MCP implemented while controller surface is absent', () => {
  assert.equal(existsSync(path.resolve('apps/redcube-cli/src/cli.ts')), true);
  assert.equal(existsSync(path.resolve('apps/redcube-mcp/src/server.ts')), true);
  assert.equal(existsSync(path.resolve('apps/redcube-cli/src/cli.js')), false);
  assert.equal(existsSync(path.resolve('apps/redcube-mcp/src/server.js')), false);
  assert.equal(existsSync(path.resolve('apps/redcube-cli/dist/cli.js')), true);
  assert.equal(existsSync(path.resolve('apps/redcube-mcp/dist/server.js')), true);
  assert.equal(existsSync(path.resolve('apps/redcube-controller/src/index.js')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-controller/package.json')), false);
});
