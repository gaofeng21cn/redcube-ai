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
      managed_run_id: 'managed-summary-1',
    },
    run: {
      run_id: 'run-summary-1',
      status: 'completed',
      telemetry: {
        latency_ms: 1234,
      },
    },
    managed_run: {
      managed_run_id: 'managed-summary-1',
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

async function captureCli(argv, gateway) {
  let printed = null;
  const result = await runCli(argv, {
    gateway,
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
      gateway: {
        runDeliverableRoute: async () => minimalLongSurface('route_run'),
      },
      expectedSurfaceKind: 'route_run',
    },
    {
      name: 'deliverable execute',
      argv: ['deliverable', 'execute', '--workspace-root', '/tmp/ws', '--overlay', 'ppt_deck', '--topic-id', 'topic-a', '--deliverable-id', 'deck-a', '--json-summary'],
      gateway: {
        runManagedDeliverable: async () => minimalLongSurface('managed_run'),
      },
      expectedSurfaceKind: 'managed_run',
    },
    {
      name: 'product invoke',
      argv: ['product', 'invoke', '--workspace-root', '/tmp/ws', '--entry-session-id', 'session-a', '--overlay', 'ppt_deck', '--topic-id', 'topic-a', '--deliverable-id', 'deck-a', '--json-summary'],
      gateway: {
        invokeProductEntry: async () => minimalLongSurface('product_entry', {
          continuation_snapshot: {
            latest_run_id: 'run-summary-1',
            latest_managed_run_id: 'managed-summary-1',
          },
        }),
      },
      expectedSurfaceKind: 'product_entry',
    },
    {
      name: 'managed get',
      argv: ['managed', 'get', '--workspace-root', '/tmp/ws', '--managed-run-id', 'managed-summary-1', '--json-summary'],
      gateway: {
        getManagedRun: async () => minimalLongSurface('managed_run_record'),
      },
      expectedSurfaceKind: 'managed_run_record',
    },
    {
      name: 'managed supervise',
      argv: ['managed', 'supervise', '--workspace-root', '/tmp/ws', '--managed-run-id', 'managed-summary-1', '--json-summary'],
      gateway: {
        superviseManagedRun: async () => minimalLongSurface('managed_supervision'),
      },
      expectedSurfaceKind: 'managed_supervision',
    },
    {
      name: 'runs get',
      argv: ['runs', 'get', '--workspace-root', '/tmp/ws', '--run-id', 'run-summary-1', '--json-summary'],
      gateway: {
        getRun: async () => minimalLongSurface('run_record'),
      },
      expectedSurfaceKind: 'run_record',
    },
    {
      name: 'review get',
      argv: ['review', 'get', '--workspace-root', '/tmp/ws', '--topic-id', 'topic-a', '--deliverable-id', 'deck-a', '--json-summary'],
      gateway: {
        getReviewState: async () => minimalLongSurface('review_state'),
      },
      expectedSurfaceKind: 'review_state',
    },
    {
      name: 'review watch',
      argv: ['review', 'watch', '--workspace-root', '/tmp/ws', '--topic-id', 'topic-a', '--deliverable-id', 'deck-a', '--run-id', 'run-summary-1', '--json-summary'],
      gateway: {
        runtimeWatch: async () => minimalLongSurface('runtime_watch'),
      },
      expectedSurfaceKind: 'runtime_watch',
    },
  ];

  for (const item of cases) {
    const { printed, result } = await captureCli(item.argv, item.gateway);
    assert.equal(result.ok, true, item.name);
    assert.equal(printed.ok, true, item.name);
    assert.equal(printed.surface_kind, item.expectedSurfaceKind, item.name);
    assert.equal(printed.status, 'completed', item.name);
    assert.equal(printed.route, 'screenshot_review', item.name);
    assert.equal(printed.run_id, 'run-summary-1', item.name);
    assert.equal(printed.managed_run_id, 'managed-summary-1', item.name);
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
    assert.equal(printed.managed_run, undefined, item.name);
  }
});

test('CLI --quiet emits JSON summary output instead of the full surface', async () => {
  const { printed } = await captureCli(
    ['review', 'watch', '--workspace-root', '/tmp/ws', '--topic-id', 'topic-a', '--deliverable-id', 'deck-a', '--run-id', 'run-summary-1', '--quiet'],
    {
      runtimeWatch: async () => minimalLongSurface('runtime_watch'),
    },
  );

  assert.equal(printed.ok, true);
  assert.equal(printed.surface_kind, 'runtime_watch');
  assert.equal(printed.run_id, 'run-summary-1');
  assert.equal(printed.artifact_file, '/tmp/redcube/artifacts/screenshot_review.json');
  assert.equal(printed.full_payload_that_should_not_be_printed, undefined);
});
