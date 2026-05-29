// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import {
  collectNativeRouteAttemptEvidenceForTest,
  materializeRouteTimeoutBlockerArtifactForTest,
  runRealRouteEvolutionProbe,
  summarizeRouteRunForTest,
  typedBlockerForTest,
} from '../scripts/run-real-route-evolution-probe.ts';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function writeJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
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
  const timeoutBlocker = report.typed_blockers.find((blocker) => blocker.blocker_kind === 'route_execution_timeout');
  assert.equal(Boolean(timeoutBlocker), true);
  assert.equal(existsSync(timeoutBlocker.artifact_file), true);
  const blockerArtifact = readJson(timeoutBlocker.artifact_file);
  assert.equal(blockerArtifact.surface_kind, 'redcube_real_route_probe_route_timeout_blocker');
  assert.equal(blockerArtifact.authority_boundary.refs_only, true);
  assert.equal(report.quality_gate_policy.screenshot_review_required, true);
  assert.equal(report.quality_gate_policy.agent_lab_score_is_not_visual_quality_verdict, true);
  assert.equal(existsSync(report.report_file), true);
  assert.equal(readJson(report.report_file).typed_blockers[0].artifact_file, timeoutBlocker.artifact_file);
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

test('real route evolution probe summarizes failed route diagnostic artifact refs', () => {
  const routeRun = summarizeRouteRunForTest({
    lane: 'native',
    route: 'author_pptx_native',
    iteration: 1,
    productEntryResult: {
      ok: false,
      domain_entry_surface: {
        result_surface: {
          ok: false,
          run: {
            run_id: 'run-native-failed',
            status: 'failed',
            artifact_refs: ['/tmp/native-attempt-01.json'],
            error: {
              artifact_refs: ['/tmp/native-attempt-01-validation.json'],
            },
          },
          error: {
            artifact_refs: ['/tmp/native-attempt-02-candidate.json'],
          },
        },
      },
    },
  });

  assert.deepEqual([...routeRun.artifact_refs].sort(), [
    '/tmp/native-attempt-01.json',
    '/tmp/native-attempt-01-validation.json',
    '/tmp/native-attempt-02-candidate.json',
  ].sort());
});

test('real route evolution probe summarizes latest native attempt validation refs for timeout blockers', () => {
  const workspaceRoot = tempDir('rca-real-route-native-timeout-workspace-');
  const outputDir = tempDir('rca-real-route-native-timeout-output-');
  const nativeDir = path.join(
    workspaceRoot,
    'topics',
    'topic-real-route-evolution',
    'deliverables',
    'deck-native',
    'artifacts',
    'native_ppt',
  );
  writeJson(
    path.join(nativeDir, 'deck-native-author_pptx_native-plan-validation-input-attempt-01.json'),
    { editable_shape_plan: { slides: [] } },
  );
  writeJson(
    path.join(nativeDir, 'deck-native-author_pptx_native-plan-validation-input-attempt-02-validation.json'),
    {
      ok: false,
      stage: 'ai_first_shape_plan_preflight',
      slide_count: 1,
      failure_count: 2,
      failures: [{
        slide_id: 'S01',
        failures: [
          {
            reason: 'ai_first_shape_outside_template_layout_zone',
            shape_id: 'S01_title',
            layout_zone_id: 'title_zone',
            required_delta_in: { bottom: 0.4 },
          },
          {
            reason: 'ai_first_native_sample_zone_too_short',
            selected_archetype: 'sample_status_proof_board',
            zone_id: 'proof_zone',
            height_in: 1.15,
            minimum_height_in: 1.35,
          },
        ],
      }],
    },
  );

  const evidence = collectNativeRouteAttemptEvidenceForTest({
    workspaceRoot,
    topicId: 'topic-real-route-evolution',
    deliverableId: 'deck-native',
    route: 'author_pptx_native',
  });

  assert.equal(evidence.artifact_refs.length, 2);
  assert.equal(evidence.latest_attempt_summary.attempt_index, 2);
  assert.equal(evidence.latest_attempt_summary.ok, false);
  assert.deepEqual(evidence.latest_attempt_summary.failure_reasons, [
    'ai_first_shape_outside_template_layout_zone',
    'ai_first_native_sample_zone_too_short',
  ]);
  assert.deepEqual(evidence.latest_attempt_summary.failed_shape_ids, ['S01_title']);
  assert.deepEqual(evidence.latest_attempt_summary.selected_archetypes, ['sample_status_proof_board']);
  assert.equal(evidence.latest_attempt_summary.refs_only, true);
  assert.equal(evidence.latest_attempt_summary.can_claim_visual_ready, false);

  const blockerFile = materializeRouteTimeoutBlockerArtifactForTest({
    outputDir,
    lane: 'native',
    route: 'author_pptx_native',
    iteration: 1,
    deliverableId: 'deck-native',
    error: Object.assign(new Error('spawnSync node ETIMEDOUT'), {
      code: 'ETIMEDOUT',
      failure_kind: 'route_timeout',
    }),
    routeTimeoutMs: 900000,
    routeRuns: [],
    workspaceRoot,
    topicId: 'topic-real-route-evolution',
  });
  const blocker = readJson(blockerFile);
  assert.equal(blocker.surface_kind, 'redcube_real_route_probe_route_timeout_blocker');
  assert.equal(blocker.native_attempt_artifact_refs.length, 2);
  assert.equal(blocker.latest_native_attempt_summary.attempt_index, 2);
  assert.equal(blocker.latest_native_attempt_summary.can_claim_visual_ready, false);
  assert.match(blocker.recommended_action, /latest_native_ppt_attempt/);
});

test('real route evolution probe mock native sample honors hard one-slide planning constraint', async () => {
  const workspaceRoot = tempDir('rca-real-route-native-sample-workspace-');
  const outputDir = tempDir('rca-real-route-native-sample-output-');

  const report = await runRealRouteEvolutionProbe({
    providerMode: 'mock',
    routes: ['native'],
    iterations: 1,
    routeTimeoutMs: 120000,
    nativeSampleSlideCount: 1,
    probeCodex: false,
    workspaceRoot,
    outputDir,
    runId: 'test-real-route-probe-native-sample',
  });

  assert.equal(report.status, 'completed');
  assert.deepEqual(report.typed_blockers, []);
  const lane = report.lanes.find((item) => item.lane === 'native');
  assert.equal(lane.status, 'completed');

  const deliverableRoot = path.join(
    workspaceRoot,
    'topics',
    'topic-real-route-evolution',
    'deliverables',
    'deck-native',
  );
  const outline = readJson(path.join(deliverableRoot, 'artifacts', 'detailed_outline.json'));
  const blueprint = readJson(path.join(deliverableRoot, 'artifacts', 'slide_blueprint.json'));
  const nativeBundle = readJson(path.join(deliverableRoot, 'artifacts', 'native_ppt_bundle.json'));

  assert.equal(outline.detailed_outline.slides.length, 1);
  assert.equal(blueprint.slide_blueprint.slides.length, 1);
  assert.equal(nativeBundle.native_ppt_bundle.slides.length, 1);
  assert.equal(
    nativeBundle.native_ppt_bundle.ai_first_shape_plan_output_contract.editable_shape_plan.authoring_mode,
    'native_visual_sample_compact',
  );
  assert.deepEqual(
    nativeBundle.native_ppt_bundle.ai_first_shape_plan_output_contract.editable_shape_plan.target_slide_ids,
    ['S01'],
  );
  assert.equal(nativeBundle.native_ppt_bundle.visual_sample_claim.proves_artifact_export_chain, true);
  assert.equal(nativeBundle.native_ppt_bundle.visual_sample_claim.proves_visual_design_quality, false);

  const exportRun = lane.route_runs.find((run) => run.route === 'export_pptx');
  assert.equal(exportRun.ok, true);
  assert.equal(exportRun.artifact_refs.some((ref) => ref.endsWith('.pptx')), true);
  assert.equal(exportRun.artifact_refs.some((ref) => ref.endsWith('.pdf')), true);
});

test('real route evolution probe writes numeric evidence into source materials full text', async () => {
  const workspaceRoot = tempDir('rca-real-route-source-evidence-workspace-');
  const outputDir = tempDir('rca-real-route-source-evidence-output-');

  const report = await runRealRouteEvolutionProbe({
    providerMode: 'mock',
    routes: ['image'],
    iterations: 1,
    routeTimeoutMs: 60000,
    probeCodex: false,
    workspaceRoot,
    outputDir,
    runId: 'test-real-route-probe-source-evidence',
  });

  assert.equal(report.status, 'completed');

  const extractedMaterialsFile = path.join(
    workspaceRoot,
    'topics',
    'topic-real-route-evolution',
    'canonical',
    'extracted-materials.json',
  );
  const extracted = readJson(extractedMaterialsFile);
  const content = extracted.materials
    .map((material) => String(material.content_text || ''))
    .join('\n');

  assert.match(content, /topic_count=1\.0/);
  assert.match(content, /route_count=3\.0/);
  assert.match(content, /iteration_count_per_route=1\.0/);
  assert.match(content, /required_gate_coverage=3\/3/);
});
