// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';

import {
  createDeliverable,
  runDeliverableRoute,
} from './gateway-test-api.ts';
import { resolveExecutorAdapter } from './package-surfaces.ts';
import {
  AUDIT_FILE,
  buildCreativeOwnershipAudit,
  writeAuditFile,
} from '../scripts/p19-creative-ownership-audit-lib.ts';
import {
  startMockCodexCli,
  withEnv,
} from './mock-codex-cli.ts';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

test('current runtime defaults to Codex substrate while Hermes proof stays opt-in', async () => {
  const upstream = await startMockCodexCli();
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
  });

  try {
    const runtimeExecutor = resolveExecutorAdapter();
    assert.equal(runtimeExecutor.adapter, 'codex_cli');
    assert.equal(runtimeExecutor.execution_model.mainline_adapter, 'codex_cli');
    assert.equal(runtimeExecutor.execution_model.primary_surface, 'codex_cli_runtime');
    assert.equal(runtimeExecutor.execution_model.adapter_role, 'primary_creative_executor');
    assert.equal(runtimeExecutor.execution_model.runtime_substrate_owner, 'Codex CLI');
    assert.equal(runtimeExecutor.execution_model.deployment_host, 'codex_local_operator_host');
    assert.equal(runtimeExecutor.execution_model.freeze_origin_milestone, 'P19.A');

    assert.throws(
      () => resolveExecutorAdapter({ adapter: 'external_llm' }),
      /Unsupported executor adapter: external_llm/,
    );

    const hermesNativeProof = resolveExecutorAdapter({ adapter: 'hermes_agent' });
    assert.equal(hermesNativeProof.adapter, 'hermes_agent');
    assert.equal(hermesNativeProof.primary, false);
    assert.equal(hermesNativeProof.execution_model.mainline_adapter, 'hermes_agent');
    assert.equal(hermesNativeProof.execution_model.primary_surface, 'hermes_agent_loop');
    assert.equal(hermesNativeProof.execution_model.adapter_role, 'opt_in_proof_executor');
    assert.equal(hermesNativeProof.execution_model.default_model_selection, 'inherit_local_hermes_default');
    assert.equal(hermesNativeProof.execution_model.default_reasoning_effort, 'inherit_local_hermes_default');

    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-p19-executor-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'P19 执行模型冻结',
      goal: '验证 host-agent 为正式主执行器',
    });

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    });

    assert.equal(result.ok, true);
    assert.equal(result.run.executor.adapter, 'codex_cli');
    assert.equal(result.run.executor.execution_model.mainline_adapter, 'codex_cli');
    assert.equal(result.run.executor.execution_model.primary_surface, 'codex_cli_runtime');
    assert.equal(result.run.executor.execution_model.runtime_substrate_owner, 'Codex CLI');
    assert.equal(result.run.executor.execution_model.deployment_host, 'codex_local_operator_host');

    const artifact = readJson(result.artifactFile);
    assert.equal(artifact.execution_model.mainline_adapter, 'codex_cli');
    assert.equal(artifact.execution_model.primary_surface, 'codex_cli_runtime');
    assert.equal(artifact.execution_model.runtime_substrate_owner, 'Codex CLI');
    assert.equal(artifact.execution_model.freeze_origin_milestone, 'P19.A');
  } finally {
    restoreEnv();
    await upstream.close();
  }
});

test('P19 audit freezes unified lifecycle, shared review overlay, and current open residue across xiaohongshu + ppt', () => {
  const audit = buildCreativeOwnershipAudit();

  assert.equal(audit.milestone, 'P19.D');
  assert.equal(audit.phase, 'shared_execution_and_audit_closeout');
  assert.deepEqual(audit.completed_milestones, ['P19.A', 'P19.B', 'P19.C']);
  assert.equal(audit.closeout_ready, true);
  assert.equal(audit.execution_model.mainline_adapter, 'codex_cli');
  assert.equal(audit.execution_model.primary_surface, 'codex_cli_runtime');
  assert.equal(audit.execution_model.proof_executor, 'hermes_agent');
  assert.equal(audit.execution_model.freeze_origin_milestone, 'P19.A');
  assert.deepEqual(audit.unified_lifecycle.stages, [
    'source_readiness',
    'story_architecture',
    'visual_authorship',
    'delivery_packaging',
  ]);
  assert.equal(audit.research_ownership.positioning, 'shared_source_readiness_optional_augmentation');
  assert.deepEqual(audit.review_overlay.shared_layers, ['visual_director_review', 'screenshot_review']);
  assert.equal(audit.review_overlay.xiaohongshu.status, 'active');
  assert.equal(audit.review_overlay.ppt_deck.status, 'active');

  assert.equal(audit.residue.xiaohongshu.status, 'cleared');
  assert.deepEqual(audit.residue.xiaohongshu.findings, []);
  assert.equal(audit.residue.ppt_deck.status, 'cleared');
  assert.equal(audit.residue.ppt_deck.findings.length, 0);
  assert.equal(audit.closeout_scope.story_architecture, 'cleared_across_families');
  assert.equal(audit.closeout_scope.visual_authorship, 'cleared_across_families');
  assert.equal(audit.closeout_scope.review_overlay, 'dual_layer_active_across_families');
  assert.deepEqual(audit.closeout_scope.remaining_shared_closeout, []);
  assert.deepEqual(
    audit.residue.ppt_deck.findings.map((finding) => finding.protected_output),
    [],
  );

  assert.equal(audit.team_gate.shared_contract_frozen, true);
  assert.equal(audit.team_gate.shared_lifecycle_contract_frozen, true);
  assert.equal(audit.team_gate.research_ownership_frozen, true);
  assert.equal(audit.team_gate.lifecycle_alignment_red_tests_written, true);
  assert.equal(audit.team_gate.ppt_visual_director_review_contract_frozen, true);
  assert.equal(audit.team_gate.lane_write_scopes_by_shared_lifecycle, true);
  assert.deepEqual(audit.team_gate.missing_gates, []);
  assert.equal(audit.team_lane_contract.tracking_model, 'unified_lifecycle');
  assert.deepEqual(
    audit.team_lane_contract.lanes.map((lane) => lane.lane_id),
    [
      'shared_lifecycle_review_overlay_convergence',
      'xiaohongshu_creative_ownership_recovery',
      'ppt_deck_creative_ownership_recovery',
      'red_tests_regression_audit_closeout',
    ],
  );
  assert.deepEqual(audit.team_lane_contract.final_convergence_order, [
    'shared_lifecycle_review_overlay_convergence',
    'xiaohongshu_creative_ownership_recovery',
    'ppt_deck_creative_ownership_recovery',
    'red_tests_regression_audit_closeout',
  ]);
});

test('P19 audit emits a machine-readable closeout report artifact', () => {
  const audit = buildCreativeOwnershipAudit();
  writeAuditFile(audit);

  assert.equal(existsSync(AUDIT_FILE), true);
  const stored = readJson(AUDIT_FILE);
  assert.equal(stored.milestone, 'P19.D');
  assert.equal(stored.phase, 'shared_execution_and_audit_closeout');
  assert.equal(stored.closeout_ready, true);
  assert.equal(stored.execution_model.proof_executor, 'hermes_agent');
  assert.equal(stored.residue.xiaohongshu.status, 'cleared');
  assert.equal(stored.residue.ppt_deck.status, 'cleared');
  assert.equal(stored.review_overlay.ppt_deck.status, 'active');
});
