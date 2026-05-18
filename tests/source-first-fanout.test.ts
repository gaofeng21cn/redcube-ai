// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, writeFileSync } from 'node:fs';

import {
  runSourceFirstFanout,
} from './product-domain-action-test-api.ts';

test('source-first fanout prepares one shared source pack then returns OPL stage plans for PPT and XHS families', async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-first-fanout-'));
    const sourceFile = path.join(workspaceRoot, 'thyroid-source.md');
    writeFileSync(
      sourceFile,
      '# 甲状腺门诊科普素材\n\n甲状腺结节评估应先区分症状、超声风险特征与甲状腺功能检查结果，再决定复查、穿刺或转诊。面向患者的小红书内容需要强调行动建议，面向学生的 PPT 需要强调判断顺序。\n',
      'utf-8',
    );
    const result = await runSourceFirstFanout({
      workspaceRoot,
      topicId: 'topic-fanout',
      title: '甲状腺门诊跨 family 科普',
      brief: '同一个 topic 的素材先完成 source readiness，再分别生成 PPT 与小红书，两个 family 保留各自 review/export gate。',
      keywords: ['甲状腺', 'PPT', '小红书'],
      sourceFiles: [sourceFile],
      deliverables: [
        {
          overlay: 'ppt_deck',
          profileId: 'lecture_student',
          deliverableId: 'deck-fanout',
          title: '甲状腺门诊跨 family PPT',
          goal: '生成可授课 PPT',
          userIntent: '生成最终 PPT',
        },
        {
          overlay: 'xiaohongshu',
          profileId: 'standard_note',
          deliverableId: 'note-fanout',
          title: '甲状腺门诊跨 family 小红书',
          goal: '生成可发布小红书图文',
          userIntent: '生成最终小红书图文',
        },
      ],
    });

    assert.equal(result.ok, true);
    assert.equal(result.surface_kind, 'source_first_fanout');
    assert.equal(result.recommended_action, 'submit_fanout_to_opl_stage_attempt_runtime');
    assert.equal(result.source_barrier.planningReady, true);
    assert.equal(result.source_barrier.intake.cache_status, 'miss');
    assert.equal(result.summary.source_barrier_status, 'planning_ready');
    assert.equal(result.summary.deliverable_count, 2);
    assert.equal(result.summary.stage_execution_plan_count, 2);
    assert.equal(result.summary.stage_runtime_projection_count, 0);
    assert.equal(result.summary.parallel_family_ready, true);
    assert.deepEqual(result.stage_runtime_projections, []);

    assert.equal(result.source_pack_fanout.artifact_kind, 'cross_family_source_pack_fanout');
    assert.deepEqual(
      result.source_pack_fanout.consumer_families.map((consumer) => consumer.family_id),
      ['ppt_deck', 'xiaohongshu'],
    );
    assert.deepEqual(
      result.source_pack_fanout.consumer_families.map((consumer) => consumer.deliverables[0].deliverable_id),
      ['deck-fanout', 'note-fanout'],
    );

    assert.equal(result.planner.planner_kind, 'source_first_opl_stage_plan_fanout');
    assert.equal(result.planner.barrier.authoritative_surface, 'shared_source_truth');
    assert.equal(result.planner.barrier.planned_reuse, true);
    assert.equal(result.planner.barrier.actual_reuse.frozen_source_pack_reused, false);
    assert.equal(result.planner.barrier.reuse_truth_source, 'source_pack_manifest.reuse');
    assert.equal(result.planner.family_execution.parallel_after_barrier, true);
    assert.equal(result.planner.family_execution.quality_gate_policy, 'preserve_each_family_review_and_export_gates');
    assert.equal(result.planner.family_execution.stage_attempt_runtime_owner, 'configured_family_runtime_provider');
    assert.equal(result.planner.family_execution.stage_scheduler_owner, 'one-person-lab');
    assert.equal(result.planner.repo_local_stage_runtime.active_caller, false);
    assert.deepEqual(result.planner.opl_stage_execution_plan_dag.layers[0].task_ids, [
      'source_pack:topic-fanout/source-pack/planning_ready',
    ]);
    assert.deepEqual(result.planner.opl_stage_execution_plan_dag.layers[1].task_ids, [
      'opl-stage-execution-plan:ppt_deck:topic-fanout:deck-fanout:auto-to-terminal',
      'opl-stage-execution-plan:xiaohongshu:topic-fanout:note-fanout:auto-to-terminal',
    ]);

    const [deckPlan, notePlan] = result.stage_execution_plans;
    assert.equal(deckPlan.surface_kind, 'opl_stage_execution_plan');
    assert.equal(deckPlan.owner, 'one-person-lab');
    assert.equal(deckPlan.execution_model.default_product_entry_executes_repo_local_managed_runner, false);
    assert.equal(deckPlan.execution_model.rca_role, 'visual_domain_authority_functions_and_route_handler_refs');
    assert.equal(deckPlan.delivery_identity.deliverable_family, 'ppt_deck');
    assert.equal(notePlan.delivery_identity.deliverable_family, 'xiaohongshu');
    assert.deepEqual(
      deckPlan.stage_attempts.map((stageRun) => stageRun.stage_id),
      [
        'storyline',
        'detailed_outline',
        'slide_blueprint',
        'visual_direction',
        'author_image_pages',
        'visual_director_review',
        'screenshot_review',
        'repair_image_pages',
        'export_pptx',
      ],
    );
    assert.deepEqual(
      notePlan.stage_attempts.map((stageRun) => stageRun.stage_id),
      [
        'research',
        'storyline',
        'single_note_plan',
        'visual_direction',
        'author_image_pages',
        'visual_director_review',
        'screenshot_review',
        'repair_image_pages',
        'publish_copy',
        'export_bundle',
      ],
    );
});
