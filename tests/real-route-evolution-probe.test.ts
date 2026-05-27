// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';

import {
  runRealRouteEvolutionProbe,
  typedBlockerForTest,
} from '../scripts/run-real-route-evolution-probe.ts';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function tempDir(prefix) {
  return mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('real route evolution probe runs image route artifacts, review gates, export, and second-run cache reuse', async () => {
  const workspaceRoot = tempDir('rca-real-route-probe-workspace-');
  const outputDir = tempDir('rca-real-route-probe-output-');

  const report = await runRealRouteEvolutionProbe({
    providerMode: 'mock',
    routes: ['image'],
    iterations: 2,
    routeTimeoutMs: 60000,
    probeCodex: false,
    workspaceRoot,
    outputDir,
    runId: 'test-real-route-probe-cache',
  });

  assert.equal(report.status, 'completed');
  assert.equal(report.provider_mode, 'mock');
  assert.equal(report.source_readiness.planning_ready, true);
  assert.equal(report.typed_blockers.length, 0);
  assert.equal(report.quality_gate_policy.visual_director_review_required, true);
  assert.equal(report.quality_gate_policy.screenshot_review_required, true);
  assert.equal(report.quality_gate_policy.export_gate_required, true);
  assert.equal(report.quality_gate_policy.agent_lab_score_is_not_visual_quality_verdict, true);
  assert.equal(report.no_forbidden_write_policy.repo_source_write_expected, false);
  assert.equal(report.no_forbidden_write_policy.artifact_writes_confined_to_workspace_root, workspaceRoot);

  const lane = report.lanes.find((item) => item.lane === 'image');
  assert.equal(lane.status, 'completed');
  assert.equal(lane.cache_summary.route_run_count, 16);
  assert.equal(lane.cache_summary.cache_miss_count, 8);
  assert.equal(lane.cache_summary.cache_hit_count, 8);
  assert.equal(lane.cache_summary.second_iteration_all_cached, true);

  const secondRunRoutes = lane.route_runs.filter((run) => run.iteration === 2);
  assert.equal(secondRunRoutes.length, 8);
  for (const routeRun of secondRunRoutes) {
    assert.equal(routeRun.cache_status, 'hit', routeRun.route);
    assert.equal(routeRun.gate_refs.visual_director_review_preserved, true, routeRun.route);
    assert.equal(routeRun.gate_refs.screenshot_review_preserved, true, routeRun.route);
    assert.equal(routeRun.gate_refs.export_gate_preserved, true, routeRun.route);
  }

  const exportRun = lane.route_runs.find((run) => run.route === 'export_pptx' && run.iteration === 1);
  assert.equal(exportRun.ok, true);
  assert.equal(exportRun.artifact_refs.some((ref) => ref.endsWith('.pptx')), true);
  assert.equal(exportRun.artifact_refs.some((ref) => ref.endsWith('.pdf')), true);
  assert.equal(existsSync(report.report_file), true);
  assert.equal(existsSync(report.performance_report_file), true);
  assert.equal(readJson(report.report_file).status, 'completed');
  assert.equal(report.performance_report.surface_kind, 'redcube_performance_report');
  assert.equal(report.performance_report.totals.route_run_count, 16);
  assert.equal(readJson(report.performance_report_file).surface_kind, 'redcube_performance_report');
});

test('real route evolution probe reports typed blockers for route execution timeout', async () => {
  const workspaceRoot = tempDir('rca-real-route-timeout-workspace-');
  const outputDir = tempDir('rca-real-route-timeout-output-');

  const report = await runRealRouteEvolutionProbe({
    providerMode: 'mock',
    routes: ['image'],
    iterations: 1,
    routeTimeoutMs: 1,
    probeCodex: false,
    workspaceRoot,
    outputDir,
    runId: 'test-real-route-probe-timeout',
  });

  assert.equal(report.status, 'blocked');
  assert.equal(report.lanes[0].status, 'blocked');
  assert.equal(report.typed_blockers.some((blocker) => blocker.blocker_kind === 'route_execution_timeout'), true);
  assert.equal(report.quality_gate_policy.screenshot_review_required, true);
  assert.equal(report.quality_gate_policy.agent_lab_score_is_not_visual_quality_verdict, true);
  assert.equal(existsSync(report.report_file), true);
  assert.equal(readJson(report.report_file).typed_blockers[0].blocker_kind, 'route_execution_timeout');
});

test('real route evolution probe preserves native renderer dependency typed blockers', () => {
  const blocker = typedBlockerForTest({
    lane: 'native',
    route: 'author_pptx_native',
    error: {
      message: JSON.stringify({
        typed_blocker_kind: 'missing_renderer_dependency',
        error_kind: 'missing_renderer_dependency',
        renderer_selection: 'capability_probe_auto',
        bootstrap_policy: 'auto_install_then_probe',
        message: 'native PPT true render proof requires a supported renderer capability',
      }),
    },
  });

  assert.equal(blocker.blocker_kind, 'missing_renderer_dependency');
  assert.equal(blocker.lane, 'native');
  assert.equal(blocker.route, 'author_pptx_native');
});
