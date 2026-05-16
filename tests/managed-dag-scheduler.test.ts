// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';

import { planManagedDeliverableDag, executeManagedDagLayers } from './package-surfaces.ts';

test('managed DAG scheduler exposes dependency layers for a single deliverable without relaxing stage order', () => {
  const plan = planManagedDeliverableDag({
    deliverables: [
      {
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        stages: [
          { stage_id: 'storyline' },
          { stage_id: 'detailed_outline', requires_stages: ['storyline'] },
          { stage_id: 'slide_blueprint', requires_stages: ['detailed_outline'] },
          { stage_id: 'visual_direction', requires_stages: ['slide_blueprint'] },
        ],
      },
    ],
  });

  assert.equal(plan.scheduler_kind, 'managed_deliverable_dag');
  assert.equal(plan.domain_scope, 'visual_deliverable_internal_dag_only');
  assert.equal(plan.functional_harness_owner, false);
  assert.equal(plan.generic_runtime_owner, false);
  assert.equal(plan.generic_scheduler_owner, false);
  assert.equal(plan.generic_daemon_owner, false);
  assert.equal(plan.generic_lifecycle_owner, false);
  assert.equal(plan.generic_queue_owner, false);
  assert.equal(plan.stage_attempt_orchestrator_owner, false);
  assert.equal(plan.generic_attempt_ledger_owner, false);
  assert.equal(plan.typed_closeout_transport_owner, false);
  assert.equal(plan.generic_runner_owner, false);
  assert.equal(plan.generic_transition_runner_owner, false);
  assert.equal(plan.generic_workbench_owner, false);
  assert.equal(plan.memory_transport_owner, false);
  assert.equal(plan.memory_refs_only_writeback_chain_owner, false);
  assert.equal(plan.artifact_lifecycle_owner, false);
  assert.equal(plan.review_repair_transport_owner, false);
  assert.equal(plan.restart_dead_letter_repair_human_gate_state_chain_owner, false);
  assert.equal(plan.native_helper_generic_envelope_owner, false);
  assert.equal(plan.authority_boundary.owner, 'redcube_ai');
  assert.equal(plan.authority_boundary.opl_family_scheduler_owner, 'opl');
  assert.equal(plan.authority_boundary.managed_dag_scheduler_scope, 'visual_deliverable_internal_dag_only');
  assert.deepEqual(plan.authority_boundary.retained_authority, [
    'visual_truth',
    'review_export_verdict',
    'artifact_authority',
    'visual_memory_body',
    'owner_receipt',
    'native_helper_implementation',
    'typed_blocker',
    'safe_action_refs',
  ]);
  assert.equal(plan.parallel_safe, true);
  assert.deepEqual(plan.layers.map((layer) => layer.task_ids), [
    ['ppt_deck:deck-a:storyline'],
    ['ppt_deck:deck-a:detailed_outline'],
    ['ppt_deck:deck-a:slide_blueprint'],
    ['ppt_deck:deck-a:visual_direction'],
  ]);
  assert.equal(plan.tasks.find((task) => task.stage_id === 'visual_direction').depends_on[0], 'ppt_deck:deck-a:slide_blueprint');
});

test('managed DAG scheduler runs independent family deliverables in the same layer after shared source readiness', () => {
  const plan = planManagedDeliverableDag({
    sourcePackId: 'topic-a/source-pack',
    deliverables: [
      {
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        stages: [
          { stage_id: 'storyline' },
          { stage_id: 'detailed_outline', requires_stages: ['storyline'] },
        ],
      },
      {
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        stages: [
          { stage_id: 'storyline' },
          { stage_id: 'single_note_plan', requires_stages: ['storyline'] },
        ],
      },
    ],
  });

  assert.deepEqual(plan.layers.map((layer) => layer.task_ids), [
    ['source_pack:topic-a/source-pack'],
    ['ppt_deck:deck-a:storyline', 'xiaohongshu:note-a:storyline'],
    ['ppt_deck:deck-a:detailed_outline', 'xiaohongshu:note-a:single_note_plan'],
  ]);
  assert.equal(plan.max_parallel_width, 2);
  assert.deepEqual(plan.optimization, {
    source_pack_reuse: true,
    cross_family_parallelism: true,
    quality_gate_policy: 'preserve_stage_dependencies_and_review_hard_stops',
  });
});

test('managed DAG scheduler rejects missing dependencies instead of silently dropping quality gates', () => {
  assert.throws(
    () => planManagedDeliverableDag({
      deliverables: [
        {
          overlay: 'ppt_deck',
          topicId: 'topic-a',
          deliverableId: 'deck-a',
          stages: [
            { stage_id: 'visual_direction', requires_stages: ['slide_blueprint'] },
          ],
        },
      ],
    }),
    /Missing DAG dependency/,
  );
});

test('managed DAG layer executor runs same-layer tasks concurrently and preserves dependency order', async () => {
  const plan = planManagedDeliverableDag({
    sourcePackId: 'topic-a/source-pack',
    deliverables: [
      { overlay: 'ppt_deck', topicId: 'topic-a', deliverableId: 'deck-a', stages: [{ stage_id: 'storyline' }] },
      { overlay: 'xiaohongshu', topicId: 'topic-a', deliverableId: 'note-a', stages: [{ stage_id: 'storyline' }] },
    ],
  });
  const timeline = [];
  const result = await executeManagedDagLayers({
    plan,
    executeTask: async (task) => {
      timeline.push(`start:${task.task_id}`);
      if (task.task_kind === 'deliverable_route') {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      timeline.push(`end:${task.task_id}`);
      return { ok: true, task_id: task.task_id };
    },
  });

  assert.equal(result.execution_kind, 'managed_dag_layer_execution');
  assert.equal(result.layer_results.length, 2);
  assert.deepEqual(result.layer_results[1].task_results.map((item) => item.task_id).sort(), [
    'ppt_deck:deck-a:storyline',
    'xiaohongshu:note-a:storyline',
  ]);
  assert.equal(timeline.indexOf('end:source_pack:topic-a/source-pack') < timeline.indexOf('start:ppt_deck:deck-a:storyline'), true);
  assert.equal(timeline.indexOf('start:ppt_deck:deck-a:storyline') < timeline.indexOf('end:xiaohongshu:note-a:storyline'), true);
  assert.equal(timeline.indexOf('start:xiaohongshu:note-a:storyline') < timeline.indexOf('end:ppt_deck:deck-a:storyline'), true);
});

test('managed DAG layer executor stops after a completed hard boundary without running later layers', async () => {
  const plan = planManagedDeliverableDag({
    deliverables: [
      {
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        stages: [
          { stage_id: 'storyline' },
          { stage_id: 'detailed_outline', requires_stages: ['storyline'] },
        ],
      },
    ],
  });
  const executed = [];
  const result = await executeManagedDagLayers({
    plan,
    executeTask: async (task) => {
      executed.push(task.task_id);
      return { ok: true, done: task.stage_id === 'storyline' };
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.stopped_layer_index, 0);
  assert.deepEqual(executed, ['ppt_deck:deck-a:storyline']);
});
