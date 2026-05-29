// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';

import { runCli } from '../../apps/redcube-cli/dist/cli.js';

function minimalLongSurface(kind, extra = {}) {
  return {
    ok: true,
    surface_kind: kind,
    recommended_action: 'continue',
    summary: {
      status: 'completed',
      route: 'screenshot_review',
      run_id: 'run-summary-1',
      stage_execution_plan_ref: 'opl-stage-summary-1',
    },
    run: {
      run_id: 'run-summary-1',
      status: 'completed',
      telemetry: {
        latency_ms: 1234,
      },
    },
    stage_execution_plan: {
      plan_ref: 'opl-stage-summary-1',
      status: 'completed',
    },
    review_execution: {
      target_slide_ids: ['S05'],
      reviewed_slide_ids: ['S05'],
      reused_slide_ids: ['S01', 'S02'],
    },
    review_state_patch: {
      blocking_reasons: ['title_typography_inconsistent'],
    },
    cache_status: 'miss',
    artifactFile: '/tmp/redcube/artifacts/screenshot_review.json',
    full_payload_that_should_not_be_printed: {
      nested: true,
    },
    ...extra,
  };
}

async function captureCli(argv, domainActions) {
  let printed = null;
  const result = await runCli(argv, {
    domainActions,
    cwd: () => '/tmp/redcube-workspace',
    printJson(value) {
      printed = value;
    },
  });
  assert.notEqual(printed, null);
  return { printed, result };
}

test('CLI --json-summary narrows long operator surfaces to machine-readable key fields', async () => {
  const cases = [
    {
      name: 'deliverable run',
      argv: ['deliverable', 'run', '--workspace-root', '/tmp/ws', '--overlay', 'ppt_deck', '--topic-id', 'topic-a', '--deliverable-id', 'deck-a', '--route', 'screenshot_review', '--json-summary'],
      domainActions: {
        runDeliverableRoute: async () => minimalLongSurface('route_run'),
      },
      expectedSurfaceKind: 'route_run',
    },
    {
      name: 'deliverable execute',
      argv: ['deliverable', 'execute', '--workspace-root', '/tmp/ws', '--overlay', 'ppt_deck', '--topic-id', 'topic-a', '--deliverable-id', 'deck-a', '--json-summary'],
      domainActions: {
        invokeDomainEntry: async () => minimalLongSurface('domain_entry', {
          result_surface: {
            surface_kind: 'opl_stage_execution_plan',
          },
        }),
      },
      expectedSurfaceKind: 'domain_entry',
    },
    {
      name: 'product invoke',
      argv: ['product', 'invoke', '--workspace-root', '/tmp/ws', '--entry-session-id', 'session-a', '--overlay', 'ppt_deck', '--topic-id', 'topic-a', '--deliverable-id', 'deck-a', '--json-summary'],
      domainActions: {
        invokeProductEntry: async () => minimalLongSurface('product_entry', {
          continuation_snapshot: {
            latest_run_id: 'run-summary-1',
            latest_stage_execution_plan_ref: 'opl-stage-summary-1',
          },
        }),
      },
      expectedSurfaceKind: 'product_entry',
    },
    {
      name: 'runs get',
      argv: ['runs', 'get', '--workspace-root', '/tmp/ws', '--run-id', 'run-summary-1', '--json-summary'],
      domainActions: {
        getRun: async () => minimalLongSurface('run_record'),
      },
      expectedSurfaceKind: 'run_record',
    },
    {
      name: 'review get',
      argv: ['review', 'get', '--workspace-root', '/tmp/ws', '--topic-id', 'topic-a', '--deliverable-id', 'deck-a', '--json-summary'],
      domainActions: {
        getReviewState: async () => minimalLongSurface('review_state'),
      },
      expectedSurfaceKind: 'review_state',
    },
  ];

  for (const item of cases) {
    const { printed, result } = await captureCli(item.argv, item.domainActions);
    assert.equal(result.ok, true, item.name);
    assert.equal(printed.ok, true, item.name);
    assert.equal(printed.surface_kind, item.expectedSurfaceKind, item.name);
    assert.equal(printed.status, 'completed', item.name);
    assert.equal(printed.route, 'screenshot_review', item.name);
    assert.equal(printed.run_id, 'run-summary-1', item.name);
    assert.equal(printed.stage_execution_plan_ref, 'opl-stage-summary-1', item.name);
    assert.equal(printed.latency_ms, 1234, item.name);
    assert.deepEqual(printed.target_slide_ids, ['S05'], item.name);
    assert.deepEqual(printed.reviewed_slide_ids, ['S05'], item.name);
    assert.deepEqual(printed.reused_slide_ids, ['S01', 'S02'], item.name);
    assert.deepEqual(printed.blocking_reasons, ['title_typography_inconsistent'], item.name);
    assert.equal(printed.next_action, 'continue', item.name);
    assert.equal(printed.recommended_action, 'continue', item.name);
    assert.equal(printed.cache_status, 'miss', item.name);
    assert.equal(printed.artifact_file, '/tmp/redcube/artifacts/screenshot_review.json', item.name);
    assert.equal(printed.full_payload_that_should_not_be_printed, undefined, item.name);
    assert.equal(printed.run, undefined, item.name);
    assert.equal(printed.stage_execution_plan, undefined, item.name);
  }
});

test('CLI --quiet emits JSON summary output instead of the full surface', async () => {
  const { printed } = await captureCli(
    ['review', 'get', '--workspace-root', '/tmp/ws', '--topic-id', 'topic-a', '--deliverable-id', 'deck-a', '--quiet'],
    {
      getReviewState: async () => minimalLongSurface('review_state'),
    },
  );

  assert.equal(printed.ok, true);
  assert.equal(printed.surface_kind, 'review_state');
  assert.equal(printed.run_id, 'run-summary-1');
  assert.equal(printed.artifact_file, '/tmp/redcube/artifacts/screenshot_review.json');
  assert.equal(printed.full_payload_that_should_not_be_printed, undefined);
});
