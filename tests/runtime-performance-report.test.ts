import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

import { buildPerformanceReport as buildGatewayPerformanceReport } from '@redcube/gateway';
import { buildPerformanceReport } from '@redcube/runtime';
import { executeCli } from '../apps/redcube-cli/dist/cli.js';

function writeJson(file: string, value: unknown): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
}

test('buildPerformanceReport aggregates route telemetry, child calls, review scope, cache, captures, and blocked checks', () => {
  const workspaceRoot = mkdtempWorkspace();
  const deliverableDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', 'deck-a');

  writeJson(path.join(workspaceRoot, 'runtime', 'runs', 'run-1.json'), {
    run_id: 'run-1',
    route: 'screenshot_review',
    overlay: 'ppt_deck',
    topic_id: 'topic-a',
    deliverable_id: 'deck-a',
    status: 'quality_blocked',
    error_kind: 'quality_blocked',
    telemetry: {
      run_id: 'run-1',
      route: 'screenshot_review',
      overlay: 'ppt_deck',
      status: 'quality_blocked',
      latency_ms: 1200,
      prompt_bytes: 400,
      context_bytes: 200,
      review_scope: 'incremental_page_review',
      cache_status: 'miss',
      blocked_checks: ['block_content_fit_ok'],
      slide_scope: {
        target_slide_ids: ['S02'],
        reviewed_slide_ids: ['S02'],
        reused_slide_ids: ['S01'],
      },
      child_calls: [
        {
          call_id: 'slide:S02',
          call_kind: 'slide_batch',
          review_scope: 'slide_batch',
          estimated_prompt_tokens: 30,
          prompt_bytes: 120,
          context_bytes: 70,
          target_slide_ids: ['S02'],
          provider_usage: { input_tokens: 25, cached_tokens: 10 },
        },
        {
          call_id: 'summary',
          call_kind: 'summary',
          review_scope: 'summary',
          estimated_prompt_tokens: 20,
          prompt_bytes: 90,
          context_bytes: 40,
        },
      ],
    },
  });
  writeJson(path.join(deliverableDir, 'artifacts', 'render_batches', 'fix_html', 'fix_html_batch_01_S02.json'), {
    route: 'fix_html',
    stage_id: 'fix_html_batch_01_S02',
    cache_status: 'reused',
    slide_ids: ['S02'],
    generationRuntime: {
      estimated_prompt_tokens: 80,
    },
  });
  writeJson(path.join(deliverableDir, 'reports', 'screenshots', 'capture-b', 'capture-manifest.json'), {
    capture_id: 'capture-b',
    capture_mode: 'delta',
    slide_count: 1,
    slides: [{ slide_id: 'S02', capture_path: '/tmp/slide-02.png' }],
  });
  mkdirSync(path.join(deliverableDir, 'reports'), { recursive: true });
  writeFileSync(
    path.join(deliverableDir, 'reports', 'review-history.jsonl'),
    `${JSON.stringify({ stage: 'screenshot_review', status: 'block', latest_checks: { block_content_fit_ok: false } })}\n`,
    'utf-8',
  );

  const report = buildPerformanceReport({ workspaceRoot, topicId: 'topic-a', deliverableId: 'deck-a' });

  assert.equal(report.surface_kind, 'redcube_performance_report');
  assert.equal(report.totals.route_run_count, 1);
  assert.equal(report.totals.estimated_prompt_tokens, 50);
  assert.equal(report.routes.screenshot_review.status_counts.quality_blocked, 1);
  assert.equal(report.routes.screenshot_review.latency_ms, 1200);
  assert.equal(report.routes.screenshot_review.estimated_prompt_tokens, 50);
  assert.equal(report.routes.screenshot_review.child_calls.count, 2);
  assert.equal(report.routes.screenshot_review.child_calls.estimated_prompt_tokens, 50);
  assert.deepEqual(report.routes.screenshot_review.review_scope_counts, {
    incremental_page_review: 1,
    slide_batch: 1,
    summary: 1,
  });
  assert.deepEqual(report.routes.screenshot_review.target_slide_ids, ['S02']);
  assert.deepEqual(report.routes.screenshot_review.reused_slide_ids, ['S01']);
  assert.equal(report.routes.screenshot_review.blocked_checks.block_content_fit_ok, 1);
  assert.equal(report.render_batches.cache_status_counts.reused, 1);
  assert.equal(report.render_batches.estimated_prompt_tokens, 80);
  assert.equal(report.capture_manifests.capture_mode_counts.delta, 1);
  assert.equal(report.review_history.blocked_checks.block_content_fit_ok, 1);
});

test('performance report is exposed through gateway and CLI surfaces', async () => {
  const workspaceRoot = mkdtempWorkspace();
  writeJson(path.join(workspaceRoot, 'runtime', 'runs', 'run-1.json'), {
    run_id: 'run-1',
    route: 'render_html',
    topic_id: 'topic-a',
    deliverable_id: 'deck-a',
    status: 'completed',
    telemetry: {
      route: 'render_html',
      status: 'completed',
      latency_ms: 250,
      estimated_prompt_tokens: 100,
      cache_status: 'hit',
    },
  });

  const gatewayReport = await buildGatewayPerformanceReport({ workspaceRoot });
  assert.equal(gatewayReport.routes.render_html.status_counts.completed, 1);

  const cliReport = await executeCli([
    'report',
    'performance',
    '--workspace-root',
    workspaceRoot,
    '--topic-id',
    'topic-a',
    '--deliverable-id',
    'deck-a',
  ]);
  assert.equal(cliReport.surface_kind, 'redcube_performance_report');
  assert.equal(cliReport.routes.render_html.cache_status_counts.hit, 1);
});

function mkdtempWorkspace(): string {
  return path.join(os.tmpdir(), `redcube-performance-report-${Date.now()}-${Math.random().toString(16).slice(2)}`);
}
