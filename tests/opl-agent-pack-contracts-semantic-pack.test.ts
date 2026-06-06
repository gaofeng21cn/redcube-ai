// @ts-nocheck
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  assertCleanAgentRepoPathRef,
  readJson,
  repoRoot,
  requiredDomainPackPaths,
} from './helpers/opl-agent-pack-contracts.ts';

test('RCA canonical semantic pack paths are concrete, clean, and stage semantic refs resolve under agent', () => {
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const stageControlPlane = readJson('contracts/stage_control_plane.json');

  assert.equal(packCompilerInput.canonical_semantic_pack_root, 'agent/');
  assert.equal(packCompilerInput.canonical_semantic_pack_role, 'repo_source_declarative_visual_pack');
  assert.deepEqual(packCompilerInput.legacy_detail_asset_roots, [
    'prompts/ppt_deck/',
    'prompts/xiaohongshu/',
  ]);
  assert.equal(
    packCompilerInput.legacy_detail_asset_policy,
    'implementation_detail_prompt_assets_only_not_stage_control_prompt_refs',
  );
  assert.deepEqual(packCompilerInput.required_domain_pack_paths, requiredDomainPackPaths);

  for (const relativePath of packCompilerInput.required_domain_pack_paths) {
    assert.equal(relativePath.startsWith('agent/'), true, relativePath);
    const fullPath = path.join(repoRoot, relativePath);
    assert.equal(fs.existsSync(fullPath), true, relativePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert.notEqual(content.trim(), '', relativePath);
    assert.equal(/\b(?:TODO|TBD)\b/i.test(content), false, relativePath);
  }

  const stageIds = stageControlPlane.stages.map((stage) => stage.stage_id);
  assert.deepEqual(stageIds, [
    'source_intake',
    'communication_strategy',
    'visual_direction',
    'artifact_creation',
    'review_and_revision',
    'package_and_handoff',
  ]);

  for (const stage of stageControlPlane.stages) {
    assert.deepEqual(stage.prompt_refs, [
      {
        ref_kind: 'repo_path',
        ref: `agent/prompts/${stage.stage_id}.md`,
        role: 'canonical_stage_prompt_policy',
      },
    ], stage.stage_id);
    assert.equal(stage.stage_contract.source_scope_refs.length > 0, true, stage.stage_id);
    assert.equal(stage.stage_contract.cohort_query_refs.length > 0, true, stage.stage_id);
    assert.equal(stage.stage_contract.trigger_refs.length > 0, true, stage.stage_id);
    assert.equal(stage.stage_contract.monitor_refs.length > 0, true, stage.stage_id);
    assert.equal(stage.stage_contract.dashboard_metric_refs.length > 0, true, stage.stage_id);
    assert.equal(stage.stage_contract.metric_refs.length >= 4, true, stage.stage_id);
    assert.equal(
      stage.stage_contract.progress_delta_policy.surface_kind,
      'opl_stage_progress_delta_policy',
      stage.stage_id,
    );
    assert.deepEqual(
      stage.stage_contract.progress_delta_policy.required_fields,
      [
        'progress_delta_classification',
        'deliverable_progress_delta',
        'platform_repair_delta',
        'next_forced_delta',
      ],
      stage.stage_id,
    );
    assert.equal(
      stage.stage_contract.progress_delta_policy.platform_only_is_not_deliverable_progress,
      true,
      stage.stage_id,
    );
    assert.equal(
      stage.stage_contract.typed_blocker_lineage_policy.surface_kind,
      'family-stall-lineage.v1',
      stage.stage_id,
    );
    assert.equal(
      stage.stage_contract.typed_blocker_lineage_policy.required_fields.includes('blocker_family'),
      true,
      stage.stage_id,
    );
    assert.equal(
      stage.stage_contract.typed_blocker_lineage_policy.required_fields.includes('repeat_count'),
      true,
      stage.stage_id,
    );
    assert.equal(
      stage.stage_contract.typed_blocker_lineage_policy.required_fields.includes('next_forced_delta'),
      true,
      stage.stage_id,
    );
    assert.equal(
      stage.stage_contract.typed_blocker_lineage_policy.required_fields.includes('escalation_owner'),
      true,
      stage.stage_id,
    );
    assert.equal(
      stage.stage_contract.metric_refs.some((metricRef) => metricRef.role === 'expected_success_ref'),
      true,
      stage.stage_id,
    );
    assert.equal(
      stage.stage_contract.metric_refs.some((metricRef) => metricRef.role === 'boundary_success_rate_ref'),
      true,
      stage.stage_id,
    );
    assert.deepEqual(stage.stage_contract.recorded_runtime_event_refs, stage.stage_contract.runtime_event_refs);
    assert.deepEqual(stage.stage_contract.owner_receipt_refs, [`owner_receipt:${stage.stage_id}`]);
    assert.equal(stage.stage_contract.append_only_event_log_refs.length, 1, stage.stage_id);
    assert.equal(stage.stage_contract.attempt_ledger_refs.length, 1, stage.stage_id);
    assert.deepEqual(stage.stage_contract.cross_provider_attempt_index, {
      surface_kind: 'cross_provider_attempt_index',
      version: 'cross-provider-attempt-index.v1',
      owner: 'one-person-lab',
      provider_attempt_owner: 'one-person-lab',
      domain_adapter_owner: 'redcube_ai',
      local_session_ref: `/session_continuity/${stage.stage_id}`,
      provider_attempt_ledger_ref: `attempt-ledger:opl/redcube_ai/${stage.stage_id}`,
      provider_attempt_ref_required: true,
      provider_attempt_ledger_ref_required: true,
      missing_provider_ledger_policy: 'fail_closed_typed_blocker_projection',
      local_session_ref_is_not_provider_attempt_ref: true,
      rca_does_not_own_provider_attempt_ledger: true,
      can_claim_current_without_provider_ledger: false,
    }, stage.stage_id);
    assert.equal(
      stage.stage_contract.closeout_receipt_refs.includes(`owner_receipt:${stage.stage_id}`),
      true,
      stage.stage_id,
    );
    assert.deepEqual(
      stage.stage_contract.replay_evidence_refs.map((replayRef) => replayRef.role),
      [
        'append_only_event_log_ref',
        'opl_stage_attempt_ledger_ref',
        'recorded_runtime_event_refs',
        'stage_closeout_receipt_ref',
        'domain_owner_receipt_ref',
      ],
      stage.stage_id,
    );
    assert.equal(stage.authority_boundary.provider_completion_is_visual_ready, false, stage.stage_id);
    assert.equal(stage.authority_boundary.provider_completion_is_exportable, false, stage.stage_id);
    assert.equal(stage.authority_boundary.provider_completion_is_domain_ready, false, stage.stage_id);
    assert.equal(
      stage.stage_contract.trigger_refs.some((triggerRef) =>
        triggerRef.role === 'opl_provider_stage_launch_trigger'),
      true,
      stage.stage_id,
    );
    assertCleanAgentRepoPathRef(stage.prompt_refs[0], 'agent/prompts/', `${stage.stage_id}.prompt_refs`);
    const stageSkillRefs = stage.skills.filter((skill) => skill.ref_kind === 'repo_path');
    assert.equal(stageSkillRefs.length > 0, true, stage.stage_id);
    assert.equal(
      stage.skills.some((skill) => skill.ref_kind === 'skill_id' && skill.ref === 'redcube-ai'),
      true,
      stage.stage_id,
    );
    for (const [index, skillRef] of stageSkillRefs.entries()) {
      assertCleanAgentRepoPathRef(skillRef, 'agent/skills/', `${stage.stage_id}.skills[${index}]`);
    }
    assert.equal(Array.isArray(stage.knowledge_refs), true, stage.stage_id);
    assert.equal(stage.knowledge_refs.length > 0, true, stage.stage_id);
    for (const [index, knowledgeRef] of stage.knowledge_refs.entries()) {
      assertCleanAgentRepoPathRef(knowledgeRef, 'agent/knowledge/', `${stage.stage_id}.knowledge_refs[${index}]`);
    }
    assert.equal(Array.isArray(stage.evaluation), true, stage.stage_id);
    assert.equal(stage.evaluation.length > 0, true, stage.stage_id);
    assert.equal(
      stage.evaluation.some((evaluationRef) => evaluationRef.role === 'owner_receipt_gate'),
      true,
      stage.stage_id,
    );
    for (const [index, evaluationRef] of stage.evaluation.entries()) {
      assertCleanAgentRepoPathRef(evaluationRef, 'agent/quality_gates/', `${stage.stage_id}.evaluation[${index}]`);
    }
    assert.equal(stage.legacy_prompt_asset_refs.length, 2, stage.stage_id);
    for (const legacyRef of stage.legacy_prompt_asset_refs) {
      assert.equal(legacyRef.ref.startsWith('prompts/'), true, stage.stage_id);
    }
  }
});
