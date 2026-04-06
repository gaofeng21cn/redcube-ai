import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';

import {
  createDeliverable,
  runDeliverableRoute,
} from '../packages/redcube-gateway/src/index.js';
import { resolveExecutorAdapter } from '../packages/redcube-runtime/src/index.js';
import {
  AUDIT_FILE,
  buildCreativeOwnershipAudit,
  writeAuditFile,
} from '../scripts/p19-creative-ownership-audit-lib.mjs';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

test('P19 keeps codex-native host-agent as the primary execution contract and external_llm optional', async () => {
  const hostAgent = resolveExecutorAdapter();
  assert.equal(hostAgent.adapter, 'host_agent');
  assert.equal(hostAgent.execution_model.mainline_adapter, 'host_agent');
  assert.equal(hostAgent.execution_model.primary_surface, 'codex_native_host_agent');
  assert.equal(hostAgent.execution_model.adapter_role, 'primary_creative_executor');
  assert.equal(hostAgent.execution_model.agent_first_requires_external_llm, false);
  assert.equal(hostAgent.execution_model.external_llm_role, 'optional_compatibility_adapter');

  const externalLlm = resolveExecutorAdapter({ adapter: 'external_llm' });
  assert.equal(externalLlm.execution_model.mainline_adapter, 'host_agent');
  assert.equal(externalLlm.execution_model.adapter_role, 'optional_compatibility_adapter');
  assert.equal(externalLlm.execution_model.agent_first_requires_external_llm, false);

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
  assert.equal(result.run.executor.adapter, 'host_agent');
  assert.equal(result.run.executor.execution_model.mainline_adapter, 'host_agent');
  assert.equal(result.run.executor.execution_model.primary_surface, 'codex_native_host_agent');
  assert.equal(result.run.executor.execution_model.external_llm_role, 'optional_compatibility_adapter');

  const artifact = readJson(result.artifactFile);
  assert.equal(artifact.execution_model.mainline_adapter, 'host_agent');
  assert.equal(artifact.execution_model.primary_surface, 'codex_native_host_agent');
  assert.equal(artifact.execution_model.agent_first_requires_external_llm, false);
});

test('P19 audit freezes unified lifecycle, shared review overlay, and current open residue across xiaohongshu + ppt', () => {
  const audit = buildCreativeOwnershipAudit();

  assert.equal(audit.milestone, 'P19.A');
  assert.equal(audit.execution_model.mainline_adapter, 'host_agent');
  assert.equal(audit.execution_model.primary_surface, 'codex_native_host_agent');
  assert.equal(audit.execution_model.agent_first_requires_external_llm, false);
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
  assert.equal(audit.residue.ppt_deck.status, 'open');
  assert.equal(audit.residue.ppt_deck.findings.length >= 3, true);

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
  assert.equal(stored.milestone, 'P19.A');
  assert.equal(stored.residue.xiaohongshu.status, 'cleared');
  assert.equal(stored.residue.ppt_deck.status, 'open');
  assert.equal(stored.review_overlay.ppt_deck.status, 'active');
});
