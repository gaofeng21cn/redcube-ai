// @ts-nocheck
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  createDeliverable,
  exportDomainActionAdapter,
  prepareProductEntryWorkspace,
  runDeliverableRoute,
  SERIAL_ENV_TEST,
  withMockCodexRuntime,
  withMockCodexRuntimeState,
} from './product-domain-action-case-shared.ts';
import { withEnv } from './helpers/mock-codex-cli.ts';
import { mkUserScopedTestWorkspace } from './helpers/test-workspace.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const oplBin = process.env.OPL_BIN || '/Users/gaofeng/workspace/one-person-lab/bin/opl';
const suitePath = 'contracts/production_acceptance/rca-ppt-three-route-agent-lab-suite.json';
const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  fileURLToPath(new URL('./helpers/mock-redcube-python-with-playwright.ts', import.meta.url)),
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readRepoJson(relativePath) {
  return readJson(path.join(repoRoot, relativePath));
}

function assertRefsOnlyAuthorityBoundary(boundary, label) {
  assert.equal(boundary.refs_only, true, label);
  for (const key of [
    'can_write_domain_truth',
    'can_write_memory_body',
    'can_authorize_quality_verdict',
    'can_authorize_export_verdict',
    'can_mutate_domain_artifact',
    'can_write_owner_receipt',
  ]) {
    assert.equal(boundary[key], false, `${label}.${key}`);
  }
  assert.equal(boundary.opl_agent_lab_can_write_rca_visual_truth, false, label);
  assert.equal(boundary.opl_agent_lab_can_authorize_quality_verdict, false, label);
  assert.equal(boundary.opl_agent_lab_can_authorize_export_verdict, false, label);
  assert.equal(boundary.opl_agent_lab_can_mutate_artifact_body, false, label);
  assert.equal(boundary.opl_agent_lab_can_write_owner_receipt, false, label);
}

function assertPptThreeRouteSuiteShape(suite) {
  assert.equal(suite.surface_kind, 'rca_ppt_three_route_agent_lab_suite_handoff');
  assert.equal(suite.owner, 'redcube_ai');
  assert.equal(suite.consumer, 'opl_agent_lab');
  assert.equal(suite.suite_kind, 'agent_lab_external_suite');
  assert.equal(suite.suite_id, 'redcube-ai.ppt-three-route-agent-lab-suite.v1');
  assert.equal(suite.handoff_surface.agent_lab_suite_ref, suitePath);
  assert.equal(suite.handoff_surface.refs_only, true);
  assert.equal(suite.deliverable_family, 'ppt_deck');
  assert.equal(suite.route_family_summary.default_visual_route, 'author_image_pages');
  assert.equal(suite.route_family_summary.default_visual_policy, 'image_first');
  assert.deepEqual(suite.route_family_summary.explicit_routes, ['render_html', 'author_pptx_native']);
  assert.equal(suite.route_family_summary.artifact_body_required_in_suite, false);
  assert.equal(suite.declares_visual_ready, false);
  assert.equal(suite.declares_exportable, false);
  assert.equal(suite.declares_production_soak_complete, false);
  assert.deepEqual(
    suite.tasks.map((route) => route.primary_route),
    ['author_image_pages', 'render_html', 'author_pptx_native'],
  );
  assert.deepEqual(
    suite.tasks.map((route) => route.selection_mode),
    ['default', 'explicit_operator_selection_required', 'explicit_operator_selection_required'],
  );
  assert.equal(suite.required_observations.includes('task_manifests_observed'), true);
  assert.equal(suite.required_observations.includes('recovery_probes_observed'), true);
  assert.equal(suite.required_observations.includes('forbidden_authority_flags_all_false'), true);
  assert.equal(
    suite.target_runtime_consumption_refs.includes('redcube product manifest#/ppt_three_route_agent_lab_suite'),
    true,
  );
  assert.equal(
    suite.target_runtime_consumption_refs.includes(
      'redcube domain-handler export#/mapped_surfaces/ppt_three_route_agent_lab_suite',
    ),
    true,
  );
  assert.equal(
    suite.target_runtime_consumption_refs.includes(
      'redcube domain-handler export#/source_manifest_refs/ppt_three_route_agent_lab_suite_ref',
    ),
    true,
  );
  assert.equal(suite.target_verification_refs.includes('target-verification:redcube-ai/product-manifest-read'), true);
  assert.equal(suite.target_verification_refs.includes('target-verification:redcube-ai/domain-handler-export-read'), true);
  assert.equal(
    suite.target_verification_refs.includes(
      'target-verification:redcube-ai/mock-artifact-producing-ppt-three-route-export-bundles',
    ),
    true,
  );
  assert.equal(suite.artifact_sample_policy.sample_kind, 'mock_provider_artifact_producing_ppt_three_route_export');
  assert.equal(suite.artifact_sample_policy.proves_artifact_export_chain, true);
  assert.equal(suite.artifact_sample_policy.proves_live_image_provider, false);
  assert.equal(suite.artifact_sample_policy.codex_native_imagegen_policy.executor_task_surface, 'codex_native_imagegen_skill');
  assert.equal(suite.artifact_sample_policy.codex_native_imagegen_policy.explicit_provider_token_required, false);
  assert.equal(suite.artifact_sample_policy.route_cases.length, 3);
  assert.equal(
    suite.artifact_sample_refs.includes(
      'artifact-sample:test:rca-ppt-three-route-agent-lab-suite#artifact-producing-ppt-three-route-export-bundles',
    ),
    true,
  );
  assert.equal(suite.artifact_sample_refs.includes('artifact-sample:path:publish/<deliverable>.pptx'), true);
  assert.equal(suite.artifact_sample_refs.includes('artifact-sample:path:publish/<deliverable>.pdf'), true);
  assert.deepEqual(suite.accepted_terminal_shapes, [
    'domain_receipt',
    'typed_blocker',
    'no_regression_evidence',
  ]);
  assert.equal(suite.not_authorized_claims.includes('visual_ready'), true);
  assert.equal(suite.not_authorized_claims.includes('production_soak_complete'), true);
  assertRefsOnlyAuthorityBoundary(suite.authority_boundary, 'suite.authority_boundary');

  const task = suite.tasks[0];
  assert.equal(task.task_id, 'agent-lab-task:rca/ppt-three-route/default-image-first');
  assert.equal(task.task_family, 'ppt_three_route_technical_route_contract');
  assert.equal(task.scorecard.domain_owned, true);
  assert.equal(task.scorecard.opl_scorecard_role, 'scorecard_ref_projection_only');
  assert.equal(task.scorecard.score_is_rca_visual_verdict, false);
  assert.equal(task.scorecard.claims_exportable, false);
  assert.equal(task.scorecard.review_refs.includes('agent/quality_gates/review_export_memory.md'), true);
  assert.equal(task.trajectory.file_refs.includes(suitePath), true);
  assert.equal(task.promotion_gate.gate_status, 'passed');
  assert.equal(task.promotion_gate.artifact_producing_runtime_tests_changed, true);
  assert.equal(task.promotion_gate.regression_suite_refs.includes('tests/rca-ppt-three-route-agent-lab-suite.test.ts'), true);
}

async function runPlanningChain({ workspaceRoot, deliverableId }) {
  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId,
    title: `PPT 三路线测试 ${deliverableId}`,
    goal: '验证 RCA PPT 可以从单一目标自主推进到可导出的 PPTX/PDF 产物链路',
  });

  for (const route of ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction']) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
      route,
    });
    assert.equal(result.ok, true, `${deliverableId}:${route}`);
  }
}

async function runPptVisualRoute({ workspaceRoot, deliverableId, visualRoute }) {
  await runPlanningChain({ workspaceRoot, deliverableId });
  const results = [];
  for (const route of [visualRoute, 'visual_director_review', 'screenshot_review', 'export_pptx']) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
      route,
    });
    assert.equal(result.ok, true, `${deliverableId}:${route}`);
    results.push({ route, result });
  }
  return results;
}

function artifactFor(results, route) {
  const entry = results.find((candidate) => candidate.route === route);
  assert.equal(Boolean(entry), true, route);
  assert.equal(fs.existsSync(entry.result.artifactFile), true, entry.result.artifactFile);
  return readJson(entry.result.artifactFile);
}

function assertCommonExport({ exported, expectedRoute }) {
  assert.equal(exported.status, 'completed');
  assert.equal(exported.export_bundle.delivery_state.current, 'output_ready');
  assert.equal(fs.existsSync(exported.export_bundle.pptx_file), true);
  assert.equal(fs.existsSync(exported.export_bundle.pdf_file), true);
  assert.equal(fs.existsSync(exported.export_bundle.presenter_notes_file), true);
  assert.equal(fs.existsSync(exported.export_bundle.final_delivery.pptx_file), true);
  assert.equal(fs.existsSync(exported.export_bundle.final_delivery.pdf_file), true);
  if (expectedRoute) {
    assert.equal(exported.export_bundle.source_visual_route, expectedRoute);
  }
}

test('RCA PPT three-route AgentLab suite is a top-level refs-only external suite contract', () => {
  assertPptThreeRouteSuiteShape(readRepoJson(suitePath));
});

test('artifact-producing PPT workflow reaches export_pptx through image-first, HTML, and native PPT routes', SERIAL_ENV_TEST, async () => {
  const restoreEnv = withEnv({
    REDCUBE_PYTHON_COMMAND: MOCK_REDCUBE_PYTHON_COMMAND,
    REDCUBE_IMAGE_GENERATION_MOCK: '1',
  });
  try {
    await withMockCodexRuntime(async () => {
      const workspaceRoot = mkUserScopedTestWorkspace('redcube-ppt-three-route-');
      const routeCases = [
        { deliverableId: 'deck-image-first', visualRoute: 'author_image_pages' },
        { deliverableId: 'deck-html', visualRoute: 'render_html' },
        { deliverableId: 'deck-native', visualRoute: 'author_pptx_native' },
      ];

      for (const routeCase of routeCases) {
        const results = await runPptVisualRoute({ workspaceRoot, ...routeCase });
        const visualArtifact = artifactFor(results, routeCase.visualRoute);
        const screenshot = artifactFor(results, 'screenshot_review');
        const exported = artifactFor(results, 'export_pptx');

        assert.equal(screenshot.status, 'pass');
        assert.equal(screenshot.review_capture.source_visual_route, routeCase.visualRoute);
        assert.equal(
          screenshot.slide_reviews.every((slide) => fs.existsSync(slide.screenshot_file)),
          true,
        );

        if (routeCase.visualRoute === 'author_image_pages') {
          assert.equal(visualArtifact.image_pages_bundle.source_visual_route, 'author_image_pages');
          assert.equal(visualArtifact.image_pages_bundle.editable, false);
          assert.equal(
            visualArtifact.image_page_manifest.slides.every((slide) => fs.existsSync(slide.image_file)),
            true,
          );
          assertCommonExport({ exported, expectedRoute: 'author_image_pages' });
          assert.equal(exported.export_bundle.editable, false);
          assert.equal(fs.existsSync(exported.export_bundle.artifact_gallery.index_file), true);
        }

        if (routeCase.visualRoute === 'render_html') {
          assert.equal(visualArtifact.html_bundle.page_count > 0, true);
          assert.equal(fs.existsSync(visualArtifact.html_bundle.html_file), true);
          assert.equal(fs.existsSync(visualArtifact.html_bundle.slides_file), true);
          assertCommonExport({ exported });
          assert.equal(fs.existsSync(exported.export_bundle.source_html), true);
          assert.equal(exported.export_bundle.review_capture.source_visual_route, 'render_html');
        }

        if (routeCase.visualRoute === 'author_pptx_native') {
          assert.equal(visualArtifact.native_ppt_bundle.source_visual_route, 'author_pptx_native');
          assert.equal(visualArtifact.native_ppt_bundle.editable_artifact, true);
          assert.equal(fs.existsSync(visualArtifact.native_ppt_bundle.pptx_file), true);
          assert.equal(fs.existsSync(visualArtifact.native_ppt_bundle.shape_manifest_file), true);
          assertCommonExport({ exported, expectedRoute: 'author_pptx_native' });
          assert.equal(exported.export_bundle.renderer_proof.source_surface_kind, 'native_pptx');
          assert.equal(fs.existsSync(exported.export_bundle.artifact_gallery.index_file), true);
        }
      }
    });
  } finally {
    restoreEnv();
  }
});

test('OPL AgentLab runner consumes the RCA PPT three-route suite without missing observations', {
  skip: !fs.existsSync(oplBin) ? `OPL bin not found: ${oplBin}` : false,
}, () => {
  const result = spawnSync(oplBin, [
    'agent-lab',
    'run',
    '--suite',
    path.join(repoRoot, suitePath),
    '--json',
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  const suiteResult = payload.agent_lab_run.suite_result;
  assert.equal(payload.agent_lab_run.surface_id, 'opl_agent_lab_external_suite_run');
  assert.equal(suiteResult.suite_id, 'redcube-ai.ppt-three-route-agent-lab-suite.v1');
  assert.equal(suiteResult.status, 'passed');
  assert.deepEqual(suiteResult.missing_observations, []);
  assert.equal(suiteResult.summary.forbidden_authority_flag_count, 0);
  assert.equal(suiteResult.summary.memory_body_observed, false);
});

test('manifest and domain-handler export expose the RCA PPT three-route AgentLab suite', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const manifestModule = await import('../packages/redcube-domain-entry/dist/index.js');
    const manifest = await manifestModule.getProductEntryManifest({
      workspace_root: workspaceRoot,
    });
    const projection = await exportDomainActionAdapter({
      workspace_root: workspaceRoot,
    });

    assertPptThreeRouteSuiteShape(manifest.ppt_three_route_agent_lab_suite);
    assert.deepEqual(
      manifest.operator_evidence_readiness_projection.ppt_three_route_agent_lab_suite,
      manifest.ppt_three_route_agent_lab_suite,
    );
    assertPptThreeRouteSuiteShape(projection.mapped_surfaces.ppt_three_route_agent_lab_suite);
    assert.equal(
      projection.source_manifest_refs.ppt_three_route_agent_lab_suite_ref,
      '/ppt_three_route_agent_lab_suite',
    );
    assert.equal(
      manifest.owner_route.projection_refs.some((entry) => entry.ref === '/ppt_three_route_agent_lab_suite'),
      true,
    );
  });
});
