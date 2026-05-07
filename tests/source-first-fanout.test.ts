// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  getReviewState,
  runSourceFirstFanout,
} from './gateway-test-api.ts';
import {
  startMockCodexCli,
  withEnv,
} from './mock-codex-cli.ts';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  path.join(MODULE_DIR, 'helpers/mock-redcube-python-with-playwright.ts'),
]);

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

async function withMockRuntime(testFn) {
  const upstream = await startMockCodexCli();
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
    REDCUBE_PYTHON_COMMAND: MOCK_REDCUBE_PYTHON_COMMAND,
    REDCUBE_IMAGE_GENERATION_MOCK: '1',
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

test('source-first fanout prepares one shared source pack then runs PPT and XHS family gates independently', async () => {
  await withMockRuntime(async () => {
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
    assert.equal(result.source_barrier.planningReady, true);
    assert.equal(result.source_barrier.intake.cache_status, 'miss');
    assert.equal(result.summary.source_barrier_status, 'planning_ready');
    assert.equal(result.summary.deliverable_count, 2);
    assert.equal(result.summary.managed_run_count, 2);
    assert.equal(result.summary.parallel_family_ready, true);

    assert.equal(result.source_pack_federation.artifact_kind, 'cross_family_source_pack_federation');
    assert.deepEqual(
      result.source_pack_federation.consumer_families.map((consumer) => consumer.family_id),
      ['ppt_deck', 'xiaohongshu'],
    );
    assert.deepEqual(
      result.source_pack_federation.consumer_families.map((consumer) => consumer.deliverables[0].deliverable_id),
      ['deck-fanout', 'note-fanout'],
    );

    assert.equal(result.planner.planner_kind, 'source_first_cross_family_fanout');
    assert.equal(result.planner.barrier.authoritative_surface, 'shared_source_truth');
    assert.equal(result.planner.barrier.planned_reuse, true);
    assert.equal(result.planner.barrier.actual_reuse.frozen_source_pack_reused, false);
    assert.equal(result.planner.barrier.reuse_truth_source, 'source_pack_manifest.reuse');
    assert.equal(result.planner.family_execution.parallel_after_barrier, true);
    assert.equal(result.planner.family_execution.quality_gate_policy, 'preserve_each_family_review_and_export_gates');
    assert.deepEqual(result.planner.managed_dag.layers[0].task_ids, [
      'source_pack:topic-fanout/source-pack/planning_ready',
    ]);
    assert.deepEqual(result.planner.managed_dag.layers[1].task_ids, [
      'ppt_deck:deck-fanout:storyline',
      'xiaohongshu:note-fanout:research',
    ]);

    const [deckRun, noteRun] = result.managed_runs;
    assert.equal(deckRun.managed_run.overlay, 'ppt_deck');
    assert.equal(deckRun.managed_run.current_stage, 'export_pptx');
    assert.equal(noteRun.managed_run.overlay, 'xiaohongshu');
    assert.equal(noteRun.managed_run.current_stage, 'export_bundle');
    assert.notEqual(deckRun.managed_run.managed_run_id, noteRun.managed_run.managed_run_id);
    assert.deepEqual(
      deckRun.managed_run.route_runs.map((stageRun) => stageRun.stage_id),
      [
        'storyline',
        'detailed_outline',
        'slide_blueprint',
        'visual_direction',
        'author_image_pages',
        'visual_director_review',
        'screenshot_review',
        'export_pptx',
      ],
    );
    assert.deepEqual(
      noteRun.managed_run.route_runs.map((stageRun) => stageRun.stage_id),
      [
        'research',
        'storyline',
        'single_note_plan',
        'visual_direction',
        'author_image_pages',
        'visual_director_review',
        'screenshot_review',
        'publish_copy',
        'export_bundle',
      ],
    );

    const deckReview = await getReviewState({
      workspaceRoot,
      topicId: 'topic-fanout',
      deliverableId: 'deck-fanout',
    });
    const noteReview = await getReviewState({
      workspaceRoot,
      topicId: 'topic-fanout',
      deliverableId: 'note-fanout',
    });
    assert.equal(deckReview.state.deliverable_id, 'deck-fanout');
    assert.equal(noteReview.state.deliverable_id, 'note-fanout');
    assert.notDeepEqual(deckReview.state, noteReview.state);

    const deckExport = readJson(path.join(
      workspaceRoot,
      'topics/topic-fanout/deliverables/deck-fanout/artifacts/publish_bundle.json',
    ));
    const noteExport = readJson(path.join(
      workspaceRoot,
      'topics/topic-fanout/deliverables/note-fanout/artifacts/publish_bundle.json',
    ));
    assert.equal(deckExport.overlay, 'ppt_deck');
    assert.equal(deckExport.route, 'export_pptx');
    assert.equal(noteExport.overlay, 'xiaohongshu');
    assert.equal(noteExport.route, 'export_bundle');
  });
});
