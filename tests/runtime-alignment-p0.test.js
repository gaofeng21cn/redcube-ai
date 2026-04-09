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
const PHASE_2_HARDENING_CONTRACT = 'contracts/runtime-program/phase-2-review-export-gate-audit-hardening.json';
const PHASE_2_HARDENING_BRIEF = 'docs/phase_2_review_export_gate_audit_hardening.md';
const PHASE_2_FAMILY_CONVERGENCE_CONTRACT = 'contracts/runtime-program/phase-2-family-source-truth-consumption-convergence.json';
const PHASE_2_FAMILY_CONVERGENCE_BRIEF = 'docs/phase_2_family_source_truth_consumption_convergence.md';
const PHASE_2_PUBLICATION_PROJECTION_CONTRACT = 'contracts/runtime-program/phase-2-publication-projection-delivery-contract-convergence.json';
const PHASE_2_PUBLICATION_PROJECTION_BRIEF = 'docs/phase_2_publication_projection_delivery_contract_convergence.md';
const PHASE_2_DIRECT_DELIVERY_HANDOFF_CONTRACT = 'contracts/runtime-program/phase-2-direct-delivery-operator-handoff-hardening.json';
const PHASE_2_DIRECT_DELIVERY_HANDOFF_BRIEF = 'docs/phase_2_direct_delivery_operator_handoff_hardening.md';
const PHASE_2_DIRECT_DELIVERY_LIFECYCLE_CONVERGENCE_CONTRACT = 'contracts/runtime-program/phase-2-direct-delivery-lifecycle-stage-convergence.json';
const PHASE_2_DIRECT_DELIVERY_LIFECYCLE_CONVERGENCE_BRIEF = 'docs/phase_2_direct_delivery_lifecycle_stage_convergence.md';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('P0 truth surfaces freeze the formal-entry matrix as CLI default, MCP protocol layer, and controller internal surface', () => {
  const pkg = JSON.parse(read('package.json'));
  const cli = read('apps/redcube-cli/src/cli.js');
  const projectTruth = read('contracts/project-truth/AGENTS.md');
  const runtimePolicy = read('docs/policies/runtime_operating_model.md');

  assert.equal(Boolean(pkg.scripts.redcube), true);
  assert.equal(Boolean(pkg.scripts.mcp), true);
  assert.equal(Boolean(pkg.scripts.controller), false);
  assert.equal(cli.includes("preferredEntry: ['MCP', 'CLI']"), true);
  assert.equal(projectTruth.includes('`default_formal_entry`: `CLI`'), true);
  assert.equal(projectTruth.includes('`supported_protocol_layer`: `MCP`'), true);
  assert.equal(projectTruth.includes('`internal_controller_surface`: `controller`'), true);
  assert.equal(projectTruth.includes('`MCP` is repo-verified in the current mainline'), true);
  assert.equal(projectTruth.includes('`program_id` is the control-plane pointer for the active RedCube mainline'), true);
  assert.equal(projectTruth.includes('`topic_id` is the topic aggregate-root identity'), true);
  assert.equal(projectTruth.includes('`deliverable_id` is the durable deliverable identity inside a topic'), true);
  assert.equal(projectTruth.includes('`run_id` is the single route-execution handle'), true);
  assert.equal(projectTruth.includes(MANUAL_TEST_CONTRACT), true);
  assert.equal(projectTruth.includes(PHASE_2_ACTIVATION_CONTRACT), true);
  assert.equal(projectTruth.includes(PHASE_2_BASELINE_CONTRACT), true);
  assert.equal(projectTruth.includes(PHASE_2_HARDENING_CONTRACT), true);
  assert.equal(projectTruth.includes(PHASE_2_DIRECT_DELIVERY_HANDOFF_CONTRACT), true);
  assert.equal(runtimePolicy.includes('当前 formal-entry matrix 固定为：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`'), true);

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

test('P0 truth remains passed and credible while Phase 2 direct-delivery lifecycle stage convergence is the active mainline tranche', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);

  assert.equal(currentProgram.program_id, 'redcube-runtime-program');
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
  assert.deepEqual(currentProgram.durable_surface_contract.audit_and_watch_surfaces, ['auditDeliverable', 'runtimeWatch']);
  assert.deepEqual(currentProgram.durable_surface_contract.review_and_projection_surfaces, ['getReviewState', 'getPublicationProjection']);
  assert.deepEqual(currentProgram.durable_surface_contract.required_embedded_summaries, ['source_readiness_summary', 'gate_summary', 'operator_handoff', 'lifecycle_stage_summary']);
  assert.equal(currentProgram.current_state.phase_id, 'Phase2');
  assert.equal(currentProgram.current_state.phase_label, 'Phase 2 / direct-delivery lifecycle stage convergence');
  assert.equal(currentProgram.current_state.workstream, 'phase_2_direct_delivery_lifecycle_stage_convergence');
  assert.equal(currentProgram.current_state.review_closeout.status, 'passed');
  assert.equal(currentProgram.current_state.active_mainline.id, 'redcube-runtime-program');
  assert.equal(
    currentProgram.current_state.active_mainline.label,
    'redcube-runtime-program / phase 2 direct-delivery lifecycle stage convergence',
  );
  assert.equal(currentProgram.current_state.active_mainline.unique, true);
  assert.equal(currentProgram.current_state.green_baseline.credible, true);
  assert.equal(currentProgram.current_state.foundation_milestones.p0_truth_surface_and_green_baseline_convergence.review_closeout, 'passed');
  assert.equal(currentProgram.current_state.foundation_milestones.p0_truth_surface_and_green_baseline_convergence.green_baseline_credible, true);
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_source_intake_shared_source_truth_baseline.commit, 'a4424d2');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_family_source_truth_consumption_convergence.status, 'closeout_completed');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_family_source_truth_consumption_convergence.commit, 'e894641');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_publication_projection_delivery_contract_convergence.status, 'closeout_completed');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_direct_delivery_operator_handoff_hardening.status, 'closeout_completed');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_direct_delivery_lifecycle_stage_convergence.status, 'closeout_completed');
  assert.equal(currentProgram.current_state.next_phase.p1_allowed, false);
  assert.equal(currentProgram.current_state.next_phase.phase_2_allowed, true);
  assert.equal(currentProgram.current_state.active_baton.id, 'phase_2_direct_delivery_lifecycle_stage_convergence');
  assert.equal(currentProgram.current_state.active_baton.status, 'closeout_completed');
  assert.equal(currentProgram.current_state.active_baton.review_status, 'passed');
  assert.equal(currentProgram.current_state.active_baton.scope.hardening_axis, 'direct_delivery_lifecycle_stage_convergence');
  assert.equal(currentProgram.current_state.active_baton.scope.implementation_in_scope, true);
  assert.deepEqual(currentProgram.current_state.active_baton.scope.consumer_families, ['ppt_deck', 'xiaohongshu']);
  assert.deepEqual(currentProgram.current_state.active_baton.scope.guarded_poster_surface, ['poster_onepager']);
  assert.deepEqual(currentProgram.current_state.active_baton.scope.runtime_planes, ['source_readiness', 'story_architecture', 'visual_authorship', 'delivery_packaging', 'direct_delivery_lifecycle_stage_convergence', 'review', 'export', 'gate', 'audit']);
  assert.deepEqual(currentProgram.current_state.active_baton.scope.required_shared_contract_surfaces, ['delivery_contract', 'operator_handoff', 'lifecycle_stage_contract']);
  assert.deepEqual(currentProgram.current_state.active_baton.scope.required_audit_surfaces, ['auditDeliverable', 'runtimeWatch', 'getReviewState', 'getPublicationProjection']);
  assert.equal(
    currentProgram.current_state.active_baton.artifacts.tranche_contract,
    PHASE_2_DIRECT_DELIVERY_LIFECYCLE_CONVERGENCE_CONTRACT,
  );
  assert.equal(
    currentProgram.current_state.active_baton.artifacts.tranche_brief,
    PHASE_2_DIRECT_DELIVERY_LIFECYCLE_CONVERGENCE_BRIEF,
  );
  assert.equal(
    currentProgram.current_state.completed_batons.stable_deliverable_manual_test_driven_hardening.commit,
    '96dc6c1',
  );
  assert.equal(
    currentProgram.current_state.completed_batons.phase_2_source_intake_shared_source_truth_baseline.commit,
    'a4424d2',
  );
  assert.equal(
    currentProgram.current_state.completed_batons.phase_2_review_export_gate_audit_hardening.commit,
    'a5b1158',
  );
  assert.equal(
    currentProgram.current_state.completed_batons.phase_2_family_source_truth_consumption_convergence.commit,
    'e894641',
  );
  assert.equal(
    currentProgram.current_state.completed_batons.phase_2_publication_projection_delivery_contract_convergence.commit,
    '57c9310',
  );
  assert.equal(
    currentProgram.current_state.completed_batons.phase_2_direct_delivery_operator_handoff_hardening.commit,
    '9b23a0e',
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

test('P0 tracked docs keep source readiness baseline on the mainline while direct-delivery lifecycle stage convergence advances on the same mainline', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const readme = read('README.md');
  const readmeZh = read('README.zh-CN.md');
  const runtimeArchitecture = read('docs/runtime_architecture.md');
  const runtimePolicy = read('docs/policies/runtime_operating_model.md');
  const baselineBrief = read(PHASE_2_BASELINE_BRIEF);
  const hardeningBrief = read(PHASE_2_HARDENING_BRIEF);
  const handoffBrief = read(PHASE_2_DIRECT_DELIVERY_HANDOFF_BRIEF);
  const lifecycleBrief = read(PHASE_2_DIRECT_DELIVERY_LIFECYCLE_CONVERGENCE_BRIEF);

  assert.equal(currentProgram.current_state.foundation_milestones.p0_truth_surface_and_green_baseline_convergence.review_closeout, 'passed');
  assert.equal(readme.includes('source intake + shared source truth` is now on the mainline as part of the stable `Source Readiness` capability surface'), true);
  assert.equal(readme.includes('review / export / gate / audit hardening now has an absorbed tranche on the same mainline'), true);
  assert.equal(readme.includes('`program_id` is the active mainline control-plane pointer'), true);
  assert.equal(readme.includes('`run_id` is the per-run execution handle for one routed delivery execution'), true);
  assert.equal(readmeZh.includes('source intake + shared source truth` 已作为稳定 `Source Readiness` 能力面进入正式主线'), true);
  assert.equal(readmeZh.includes('review / export / gate / audit hardening` 已在同一主线上吸收一条 tranche') || readmeZh.includes('review / export / gate / audit hardening 已在同一主线上吸收一条 tranche'), true);
  assert.equal(readme.includes('direct-delivery operator handoff hardening now has an absorbed tranche on the same mainline'), true);
  assert.equal(readme.includes('direct-delivery lifecycle stage convergence now has an absorbed tranche on the same mainline'), true);
  assert.equal(readmeZh.includes('direct-delivery operator handoff hardening 已在同一主线上吸收一条 tranche'), true);
  assert.equal(readmeZh.includes('direct-delivery lifecycle stage convergence 已在同一主线上吸收一条 tranche'), true);
  assert.equal(readmeZh.includes('`program_id`：active mainline 的 control-plane 指针'), true);
  assert.equal(readmeZh.includes('`run_id`：单次 routed delivery execution 的 per-run 执行句柄'), true);
  assert.equal(runtimeArchitecture.includes('source intake + shared source truth` 已作为 `Source Readiness` 的正式能力面进入当前主线'), true);
  assert.equal(runtimeArchitecture.includes('`operator_handoff`'), true);
  assert.equal(runtimeArchitecture.includes('`direct-delivery lifecycle stage convergence` 已把 direct-delivery human workline 与当前 macro lifecycle 的 machine-readable bridge 收紧到同一 canonical contract surface'), true);
  assert.equal(runtimeArchitecture.includes('`program_id`'), true);
  assert.equal(runtimeArchitecture.includes('`run_id`'), true);
  assert.equal(runtimeArchitecture.includes('`getReviewState`、`getPublicationProjection`'), true);
  assert.equal(runtimePolicy.includes('`program_id`'), true);
  assert.equal(runtimePolicy.includes('`run_id`'), true);
  assert.equal(runtimePolicy.includes('machine-readable `operator_handoff`'), true);
  assert.equal(runtimePolicy.includes('machine-readable `lifecycle_stage_contract` 与 `lifecycle_stage_summary`'), true);
  assert.equal(runtimePolicy.includes('`topics/<topic>/deliverables/<deliverable>/reports/review-state.json`'), true);
  assert.equal(baselineBrief.includes('当前这份文档记录的是已经吸收到主线的最小 baseline'), true);
  assert.equal(hardeningBrief.includes('source_readiness_summary'), true);
  assert.equal(handoffBrief.includes('operator_handoff.owner_surface'), true);
  assert.equal(lifecycleBrief.includes('lifecycle_stage_summary'), true);
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
    'tests/phase-2-family-source-truth-consumption-convergence.test.js',
    'tests/phase-2-publication-projection-delivery-contract-convergence.test.js',
    'tests/phase-2-direct-delivery-operator-handoff-hardening.test.js',
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
