import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const POSTER_FREEZE_CONTRACT = 'contracts/runtime-program/poster-production-hardening-freeze.json';
const P21_CLOSEOUT_CONTRACT = 'contracts/runtime-program/p21-operations-evaluation-closeout.json';
const MANUAL_TEST_CONTRACT = 'contracts/runtime-program/stable-deliverable-manual-test-driven-hardening.json';
const PHASE_2_ACTIVATION_CONTRACT = 'contracts/runtime-program/phase-2-source-intake-activation-package-freeze.json';
const PHASE_2_ACTIVATION_BRIEF = 'docs/phase_2_source_intake_activation_package_freeze.md';
const PHASE_2_BASELINE_CONTRACT = 'contracts/runtime-program/phase-2-source-intake-shared-source-truth-baseline.json';
const PHASE_2_BASELINE_BRIEF = 'docs/phase_2_source_intake_shared_source_truth_baseline.md';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('P0 truth surfaces freeze current formal entry to MCP and CLI until controller exists', () => {
  const pkg = JSON.parse(read('package.json'));
  const cli = read('apps/redcube-cli/src/cli.js');
  const projectTruth = read('contracts/project-truth/AGENTS.md');
  const runtimePolicy = read('docs/policies/runtime_operating_model.md');

  assert.equal(Boolean(pkg.scripts.redcube), true);
  assert.equal(Boolean(pkg.scripts.mcp), true);
  assert.equal(Boolean(pkg.scripts.controller), false);
  assert.equal(cli.includes("preferredEntry: ['MCP', 'CLI']"), true);
  assert.equal(projectTruth.includes('Current repo-verified formal entry surfaces: `MCP`, `CLI`.'), true);
  assert.equal(projectTruth.includes(MANUAL_TEST_CONTRACT), true);
  assert.equal(projectTruth.includes(PHASE_2_ACTIVATION_CONTRACT), true);
  assert.equal(projectTruth.includes(PHASE_2_BASELINE_CONTRACT), true);
  assert.equal(runtimePolicy.includes('当前正式入口优先 `MCP`、`CLI`') || runtimePolicy.includes('当前正式入口是 `MCP`、`CLI`'), true);

  for (const file of [
    'README.md',
    'README.zh-CN.md',
    'docs/README.md',
    'docs/README.zh-CN.md',
    'docs/runtime_architecture.md',
    'docs/domain-harness-os-positioning.md',
  ]) {
    const text = read(file);
    assert.equal(text.includes('MCP / CLI / controller'), false, file);
    assert.equal(text.includes('`MCP`, `CLI`, and `controller`'), false, file);
  }
});

test('P0 truth remains passed and credible while Phase 2 minimum baseline is the active mainline tranche', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);

  assert.equal(currentProgram.program_id, 'redcube-runtime-program');
  assert.equal(currentProgram.current_state.phase_id, 'Phase2');
  assert.equal(currentProgram.current_state.phase_label, 'Phase 2 / source intake + shared source truth baseline');
  assert.equal(currentProgram.current_state.workstream, 'phase_2_source_intake_shared_source_truth_baseline');
  assert.equal(currentProgram.current_state.review_closeout.status, 'passed');
  assert.equal(currentProgram.current_state.active_mainline.id, 'redcube-runtime-program');
  assert.equal(
    currentProgram.current_state.active_mainline.label,
    'redcube-runtime-program / phase 2 source intake + shared source truth baseline',
  );
  assert.equal(currentProgram.current_state.active_mainline.unique, true);
  assert.equal(currentProgram.current_state.green_baseline.credible, true);
  assert.equal(currentProgram.current_state.foundation_milestones.p0_truth_surface_and_green_baseline_convergence.review_closeout, 'passed');
  assert.equal(currentProgram.current_state.foundation_milestones.p0_truth_surface_and_green_baseline_convergence.green_baseline_credible, true);
  assert.equal(currentProgram.current_state.next_phase.p1_allowed, false);
  assert.equal(currentProgram.current_state.next_phase.phase_2_allowed, true);
  assert.equal(currentProgram.current_state.active_baton.id, 'phase_2_source_intake_shared_source_truth_baseline');
  assert.equal(currentProgram.current_state.active_baton.status, 'closeout_completed');
  assert.equal(currentProgram.current_state.active_baton.review_status, 'passed');
  assert.equal(currentProgram.current_state.active_baton.scope.baseline_only, true);
  assert.equal(currentProgram.current_state.active_baton.scope.implementation_in_scope, true);
  assert.deepEqual(currentProgram.current_state.active_baton.scope.consumer_families, ['ppt_deck', 'xiaohongshu']);
  assert.deepEqual(currentProgram.current_state.active_baton.scope.runtime_planes, ['source_intake', 'shared_source_truth']);
  assert.equal(
    currentProgram.current_state.active_baton.artifacts.baseline_contract,
    PHASE_2_BASELINE_CONTRACT,
  );
  assert.equal(
    currentProgram.current_state.active_baton.artifacts.baseline_brief,
    PHASE_2_BASELINE_BRIEF,
  );
  assert.equal(
    currentProgram.current_state.completed_batons.stable_deliverable_manual_test_driven_hardening.commit,
    '96dc6c1',
  );
  assert.equal(
    currentProgram.current_state.completed_batons.phase_2_activation_package_freeze.commit,
    '3a7fbd6',
  );
});

test('P0 tracked program contract keeps poster and P21 residues as historical snapshots, not the active program', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const p21 = readJson(P21_CLOSEOUT_CONTRACT);
  const poster = readJson(POSTER_FREEZE_CONTRACT);

  assert.equal(currentProgram.historical_snapshots.p21_operations_evaluation.status, 'historical_snapshot');
  assert.equal(currentProgram.historical_snapshots.p21_operations_evaluation.is_active_mainline, false);
  assert.equal(currentProgram.historical_snapshots.poster_production_hardening.status, 'historical_snapshot');
  assert.equal(currentProgram.historical_snapshots.poster_production_hardening.is_active_mainline, false);
  assert.equal(currentProgram.historical_snapshots.legacy_redcube_ai_mainline.status, 'inactive_historical_scaffold');
  assert.equal(currentProgram.historical_snapshots.legacy_redcube_ai_mainline.is_active_mainline, false);
  assert.equal(p21.historical_snapshot, true);
  assert.equal(p21.is_active_mainline, false);
  assert.equal(poster.historical_snapshot, true);
  assert.equal(poster.is_active_mainline, false);
});

test('P0 tracked program contract records the required credible green baseline verification commands', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);

  assert.equal(currentProgram.current_state.green_baseline.clean_clone_required, true);
  assert.deepEqual(currentProgram.current_state.green_baseline.blocked_by, []);
  assert.deepEqual(currentProgram.current_state.green_baseline.required_verification, [
    'git status --short',
    'git diff --check',
    'git diff --stat',
    'npm test',
    'npm run typecheck',
  ]);
});

test('P0 tracked repo truth does not depend on ignored .codex host docs or ignored .omx plan references', () => {
  const rootAgents = read('AGENTS.md');
  const projectTruth = read('contracts/project-truth/AGENTS.md');

  for (const text of [rootAgents, projectTruth]) {
    assert.equal(text.includes('contracts/dev-hosts/omx-cli.md'), false);
    assert.equal(text.includes('contracts/dev-hosts/codex-app.md'), false);
  }

  assert.equal(projectTruth.includes('.omx/plans/'), false);
  assert.equal(rootAgents.includes('Canonical host adapter references are maintained by the installed runtime/tooling surface; do not depend on repo-local dev-host docs.'), true);
});

test('P0 tracked docs keep Phase 2 minimum baseline on the mainline while formal entry remains MCP and CLI only', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const readme = read('README.md');
  const readmeZh = read('README.zh-CN.md');
  const runtimeArchitecture = read('docs/runtime_architecture.md');
  const baselineBrief = read(PHASE_2_BASELINE_BRIEF);

  assert.equal(currentProgram.current_state.foundation_milestones.p0_truth_surface_and_green_baseline_convergence.review_closeout, 'passed');
  assert.equal(readme.includes('Phase 2 minimal baseline for source intake + shared source truth is now on the mainline'), true);
  assert.equal(readme.includes('CLI` and `MCP` now hydrate canonical shared source truth on the same substrate'), true);
  assert.equal(readmeZh.includes('Phase 2 source intake + shared source truth 的最小 baseline 已进入正式主线'), true);
  assert.equal(readmeZh.includes('CLI / MCP 已可在同一 substrate 上水合 canonical shared source truth'), true);
  assert.equal(runtimeArchitecture.includes('Phase 2 source intake + shared source truth 的最小 baseline 已进入正式主线'), true);
  assert.equal(baselineBrief.includes('当前这份文档记录的是已经吸收到主线的最小 baseline'), true);
  assert.equal(baselineBrief.includes('formal entry：仍只有 `MCP / CLI`'), true);
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
    'tests/runtime-alignment-p0.test.js',
    'tests/poster-production-hardening-freeze.test.js',
    'tests/p21-operations-and-evaluation-os.test.js',
    'tests/stable-deliverable-manual-test-package.test.js',
    'tests/phase-2-source-intake-activation-package-freeze.test.js',
    'tests/phase-2-source-intake-shared-source-truth-baseline.test.js',
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
  assert.equal(existsSync(path.resolve('apps/redcube-cli/src/cli.js')), true);
  assert.equal(existsSync(path.resolve('apps/redcube-mcp/src/server.js')), true);
  assert.equal(existsSync(path.resolve('apps/redcube-controller/src/index.js')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-controller/package.json')), false);
});
