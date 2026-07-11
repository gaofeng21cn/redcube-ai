// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildRedCubeActionMetadata,
  invokeProductEntry,
} from '@redcube/domain-entry';
import {
  SERIAL_ENV_TEST,
  prepareProductEntryWorkspace,
  readJson,
  withMockCodexRuntimeState,
} from './product-domain-action-case-shared.ts';

function request(workspaceRoot, id, delivery) {
  return {
    workspace_locator: { workspace_root: workspaceRoot },
    entry_session_contract: { entry_session_id: `session-${id}` },
    delivery_request: {
      deliverable_family: 'ppt_deck',
      topic_id: 'topic-a',
      deliverable_id: `deck-${id}`,
      profile_id: 'lecture_student',
      title: `Stage order ${id}`,
      goal: 'Verify product-entry stage ordering',
      ...delivery,
    },
  };
}

function plan(response) {
  return response.domain_entry_surface.result_surface;
}

function stageIds(response) {
  return plan(response).stage_attempts.map((stage) => stage.stage_id);
}

test('canonical stage source generates one storyline owner and explicit top-level handoffs', () => {
  const manifest = readJson('agent/stages/manifest.json');
  const familyActionCatalog = buildRedCubeActionMetadata().family_action_catalog;
  for (const declared of manifest.stages) {
    assert.deepEqual(declared.next_stage_refs, declared.handoff.next_stage_refs, declared.stage_id);
    assert.equal(declared.allowed_action_refs.every((actionId) => (
      familyActionCatalog.actions.some((action) => action.action_id === actionId)
    )), true, declared.stage_id);
  }
  assert.deepEqual(manifest.stages.find((stage) => stage.stage_id === 'source_intake').domain_stage_refs, [
    'source_readiness',
    'research',
  ]);
  assert.deepEqual(
    manifest.stages.filter((stage) => stage.domain_stage_refs.includes('storyline')).map((stage) => stage.stage_id),
    ['communication_strategy'],
  );
  manifest.stages.forEach((stage, index) => {
    const expected = manifest.stages[index + 1] ? [manifest.stages[index + 1].stage_id] : [];
    assert.deepEqual(stage.next_stage_refs, expected, stage.stage_id);
    assert.deepEqual(stage.handoff.next_stage_refs, expected, stage.stage_id);
  });
});

test('product entry fails closed when stop is before route', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    await assert.rejects(
      () => invokeProductEntry(request(workspaceRoot, 'reverse', {
        route: 'visual_direction',
        stop_after_stage: 'detailed_outline',
      })),
      /stop_after_stage=detailed_outline precedes delivery_request\.route=visual_direction/,
    );
  });
});

test('new-session alternate route stays explicit instead of running the default chain', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const response = await invokeProductEntry(request(workspaceRoot, 'native', {
      route: 'author_pptx_native',
    }));

    assert.equal(response.summary.task_intent, 'run_opl_stage_execution_plan');
    assert.equal(plan(response).control_policy.route_strategy, 'alternate_route_dependency_recovery');
    assert.equal(plan(response).control_policy.requested_stop_after_stage, 'author_pptx_native');
    assert.equal(stageIds(response).at(-1), 'author_pptx_native');
    assert.equal(stageIds(response).includes('author_image_pages'), false);
  });
});

test('normal stop target produces the canonical main-sequence prefix', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const response = await invokeProductEntry(request(workspaceRoot, 'prefix', {
      stop_after_stage: 'detailed_outline',
    }));

    assert.deepEqual(stageIds(response), ['storyline', 'detailed_outline']);
    assert.equal(plan(response).control_policy.route_strategy, 'primary_stop_prefix');
  });
});

test('alternate route recovers its declared dependencies in order', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const response = await invokeProductEntry(request(workspaceRoot, 'html', {
      route: 'render_html',
    }));

    assert.deepEqual(stageIds(response), [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'render_html',
    ]);
    assert.equal(plan(response).control_policy.dependency_recovery_applied, true);
  });
});
