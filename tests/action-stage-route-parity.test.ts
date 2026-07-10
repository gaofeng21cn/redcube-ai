// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRedCubeActionMetadata } from '@redcube/domain-entry';
import { readJson } from './helpers/opl-agent-pack-contracts.ts';

const ROUTE_POLICY = 'ordered_stage_attempts_no_skip';

function actionStageCoverage(manifest, actionId) {
  return manifest.stages
    .filter((stage) => stage.allowed_action_refs.includes(actionId))
    .map((stage) => stage.stage_id);
}

function canReach(manifest, from, to, allowedStageIds) {
  if (from === to) return true;
  const stagesById = new Map(manifest.stages.map((stage) => [stage.stage_id, stage]));
  const pending = [from];
  const seen = new Set(pending);
  while (pending.length > 0) {
    const current = pending.shift();
    for (const next of stagesById.get(current)?.next_stage_refs ?? []) {
      if (!allowedStageIds.has(next) || seen.has(next)) continue;
      if (next === to) return true;
      seen.add(next);
      pending.push(next);
    }
  }
  return false;
}

test('mutating RCA actions declare ordered routes with exact manifest coverage', () => {
  const manifest = readJson('agent/stages/manifest.json');
  const trackedCatalog = readJson('contracts/action_catalog.json');
  const trackedStageControlPlane = readJson('contracts/stage_control_plane.json');
  const sourceCatalog = buildRedCubeActionMetadata().family_action_catalog;

  assert.deepEqual(
    trackedCatalog.actions.map(({ action_id, effect, stage_route }) => ({ action_id, effect, stage_route })),
    sourceCatalog.actions.map(({ action_id, effect, stage_route }) => ({ action_id, effect, stage_route })),
  );
  for (const stage of manifest.stages) {
    const trackedStage = trackedStageControlPlane.stages.find((entry) => entry.stage_id === stage.stage_id);
    assert.deepEqual(trackedStage.action_refs, stage.allowed_action_refs, `${stage.stage_id}.action_refs`);
    assert.deepEqual(trackedStage.allowed_action_refs, stage.allowed_action_refs, `${stage.stage_id}.allowed_action_refs`);
  }

  for (const action of sourceCatalog.actions) {
    if (action.effect === 'read_only') {
      assert.equal('stage_route' in action, false, action.action_id);
      assert.notDeepEqual(actionStageCoverage(manifest, action.action_id), [], action.action_id);
      continue;
    }

    const route = action.stage_route;
    assert.ok(route, action.action_id);
    assert.equal(route.route_policy, ROUTE_POLICY, action.action_id);
    assert.equal(route.entry_stage_ref, route.required_stage_refs[0], action.action_id);
    assert.notDeepEqual(route.required_stage_refs, [], action.action_id);
    assert.notDeepEqual(route.terminal_stage_refs, [], action.action_id);

    const routedStages = [...route.required_stage_refs, ...route.optional_stage_refs];
    assert.equal(new Set(routedStages).size, routedStages.length, action.action_id);
    assert.deepEqual(
      new Set(routedStages),
      new Set(actionStageCoverage(manifest, action.action_id)),
      action.action_id,
    );

    const routedStageSet = new Set(routedStages);
    for (let index = 0; index < route.required_stage_refs.length - 1; index += 1) {
      assert.equal(
        canReach(
          manifest,
          route.required_stage_refs[index],
          route.required_stage_refs[index + 1],
          routedStageSet,
        ),
        true,
        `${action.action_id}: ${route.required_stage_refs[index]} -> ${route.required_stage_refs[index + 1]}`,
      );
    }
    assert.equal(route.terminal_stage_refs.every((terminal) => routedStageSet.has(terminal)), true, action.action_id);
    for (const optionalStage of route.optional_stage_refs) {
      assert.equal(canReach(manifest, route.entry_stage_ref, optionalStage, routedStageSet), true, action.action_id);
      assert.equal(
        route.terminal_stage_refs.some((terminal) => canReach(manifest, optionalStage, terminal, routedStageSet)),
        true,
        action.action_id,
      );
    }
  }
});

test('invoke_product_entry preserves the no-skip mainline and review-or-package terminals', () => {
  const catalog = buildRedCubeActionMetadata().family_action_catalog;
  const action = catalog.actions.find((entry) => entry.action_id === 'invoke_product_entry');

  assert.deepEqual(action.stage_route, {
    entry_stage_ref: 'source_intake',
    required_stage_refs: [
      'source_intake',
      'communication_strategy',
      'visual_direction',
      'artifact_creation',
      'review_and_revision',
    ],
    optional_stage_refs: ['package_and_handoff'],
    terminal_stage_refs: ['review_and_revision', 'package_and_handoff'],
    route_policy: ROUTE_POLICY,
  });
});
