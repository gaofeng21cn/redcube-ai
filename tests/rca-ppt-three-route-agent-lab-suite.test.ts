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
const agentLabHandoffPath = 'contracts/agent_lab_handoff.json';
const capabilityMapPath = 'contracts/capability_map.json';
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

function assertPptCapabilityMapShape(map, handoff, adoption) {
  const expectedCapabilityIds = [
    'rca-ppt-story-architect',
    'rca-ppt-visual-director',
    'rca-ppt-page-author',
    'rca-ppt-reviewer',
    'rca-native-ppt-designer',
    'rca-template-profiler',
  ];
  const expectedTokens = [
    'visual_density',
    'layout_quality',
    'page_authoring',
    'native_pptx_editability',
    'template_profile',
    'ppt_review',
    'storyline',
  ];

  assert.equal(map.surface_kind, 'opl_standard_agent_capability_map');
  assert.equal(map.domain_capability_map_kind, 'rca_professional_capability_map');
  assert.equal(map.owner, 'redcube_ai');
  assert.equal(map.professional_skill_policy.skill_files_are_method_source_of_truth, true);
  assert.equal(map.professional_skill_policy.capability_map_is_routing_metadata_only, true);
  assert.deepEqual(map.professional_capabilities.map((entry) => entry.capability_id), expectedCapabilityIds);
  assert.deepEqual(Object.keys(map.feedback_token_index), expectedTokens);

  for (const capability of map.professional_capabilities) {
    assert.equal(fs.existsSync(path.join(repoRoot, capability.skill_ref)), true, capability.skill_ref);
    assert.equal(capability.allowed_change_refs.includes(capability.skill_ref), true, capability.capability_id);
  }

  assert.equal(handoff.capability_map_ref, capabilityMapPath);
  assert.equal(handoff.external_suite_improvement_policy.capability_map_ref, capabilityMapPath);
  assert.deepEqual(handoff.external_suite_improvement_policy.feedback_token_contract, expectedTokens);
  assert.equal(handoff.patch_surface_hints.allowed_patch_roots.includes('agent/professional_skills/'), true);
  assert.equal(handoff.patch_surface_hints.forbidden_patch_roots.includes('owner receipts'), true);
  assert.equal(handoff.authority_boundary.opl_meta_agent_can_patch_repo_source_docs_tests_skills, true);
  assert.equal(handoff.authority_boundary.opl_meta_agent_can_write_visual_truth_artifacts, false);
  assert.equal(handoff.authority_boundary.opl_meta_agent_can_write_artifact_blobs, false);
  assert.equal(handoff.authority_boundary.opl_meta_agent_can_write_export_or_quality_verdicts, false);
  assert.equal(handoff.authority_boundary.opl_meta_agent_can_write_runtime_data, false);
  assert.equal(adoption.source_refs.capability_map_ref, capabilityMapPath);

  for (const token of expectedTokens) {
    assert.equal(Boolean(handoff.change_ref_mappings[token]), true, token);
    assert.equal(handoff.change_ref_mappings[token].capability_map_pointer, `/feedback_token_index/${token}`);
    assert.deepEqual(
      handoff.change_ref_mappings[token].capability_ids,
      map.feedback_token_index[token].canonical_capability_ids,
      token,
    );
  }

  assert.deepEqual(map.feedback_token_index.storyline.canonical_capability_ids, ['rca-ppt-story-architect']);
  assert.equal(
    map.feedback_token_index.native_pptx_editability.canonical_capability_ids.includes('rca-native-ppt-designer'),
    true,
  );
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
  assert.deepEqual(suite.native_pptx_real_route_probe.required_report_observations, [
    'native_pptx_terminal_export_refs_observed',
    'agent_lab_run_report_ref_observed',
    'mock_visual_quality_claims_absent',
  ]);
  assert.equal(
    suite.target_runtime_consumption_refs.includes('opl_generated:product_entry_manifest#/ppt_three_route_agent_lab_suite'),
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
    suite.target_verification_refs.includes('target-verification:redcube-ai/real-native-pptx-product-entry-route-terminal-refs'),
    true,
  );
  assert.equal(suite.native_pptx_real_route_probe.product_entry_domain_route_required, true);
  assert.equal(suite.native_pptx_real_route_probe.task_intent, 'run_deliverable_route');
  assert.equal(suite.native_pptx_real_route_probe.terminal_route, 'export_pptx');
  assert.deepEqual(suite.native_pptx_real_route_probe.route_chain, [
    'storyline',
    'detailed_outline',
    'slide_blueprint',
    'visual_direction',
    'author_pptx_native',
    'visual_director_review',
    'screenshot_review',
    'export_pptx',
  ]);
  assert.deepEqual(suite.native_pptx_real_route_probe.terminal_evidence_required_ref_groups, [
    'editable_pptx',
    'pdf',
    'render_screenshots',
    'shape_manifest',
    'visual_director_review_receipt',
    'screenshot_review_receipt',
    'export_receipt',
    'artifact_gallery',
    'agent_lab_run_report',
  ]);
  assert.equal(suite.native_pptx_real_route_probe.forbidden_evidence_sources.includes('handwritten_pptx_script_as_workflow'), true);
  assert.equal(suite.native_pptx_real_route_probe.forbidden_evidence_sources.includes('mock_provider_visual_quality_claim'), true);
  assert.equal(suite.terminal_evidence_contract.agent_lab_role.records_refs_only, true);
  assert.equal(suite.terminal_evidence_contract.agent_lab_role.writes_rca_visual_verdict, false);
  assert.equal(suite.terminal_evidence_contract.agent_lab_role.writes_owner_receipt, false);
  assert.equal(suite.terminal_evidence_contract.agent_lab_role.writes_artifact_body, false);
  assert.equal(
    suite.target_verification_refs.includes(
      'target-verification:redcube-ai/mock-artifact-producing-ppt-three-route-export-bundles',
    ),
    true,
  );
  assert.equal(suite.artifact_sample_policy.sample_kind, 'mock_provider_artifact_producing_ppt_three_route_export');
  assert.equal(suite.artifact_sample_policy.proves_artifact_export_chain, true);
  assert.equal(suite.artifact_sample_policy.proves_visual_design_quality, false);
  assert.equal(suite.artifact_sample_policy.mock_provider_boundary.proves_visual_sample_quality, false);
  assert.equal(suite.artifact_sample_policy.mock_provider_boundary.can_claim_visual_ready, false);
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
  assert.equal(suite.artifact_sample_refs.includes('artifact-sample:path:artifacts/native_ppt/<deliverable>-shape-manifest.json'), true);
  assert.equal(suite.artifact_sample_refs.includes('artifact-sample:path:reports/native_ppt/<deliverable>-screenshots/slide-1.png'), true);
  assert.equal(suite.artifact_sample_refs.includes('artifact-sample:path:artifacts/director_review.json'), true);
  assert.equal(suite.artifact_sample_refs.includes('artifact-sample:path:artifacts/quality_gate.json'), true);
  assert.equal(suite.artifact_sample_refs.includes('artifact-sample:path:artifacts/publish_bundle.json'), true);
  assert.equal(suite.artifact_sample_refs.includes('artifact-sample:path:publish/artifact_gallery/index.json'), true);
  assert.equal(suite.artifact_sample_refs.includes('artifact-sample:path:<probe-output>/real-route-evolution-probe.json'), true);
  assert.equal(suite.native_live_evidence_policy.required_for_native_visual_quality_claim, true);
  assert.equal(suite.native_live_evidence_policy.mock_provider_can_satisfy, false);
  assert.equal(suite.native_live_evidence_policy.agent_lab_records_refs_only, true);
  assert.deepEqual(suite.native_live_evidence_policy.required_terminal_routes, [
    'author_pptx_native',
    'visual_director_review',
    'screenshot_review',
    'export_pptx',
  ]);
  assert.equal(
    suite.native_live_evidence_policy.required_artifact_refs.includes('editable_pptx_file'),
    true,
  );
  assert.equal(
    suite.native_live_evidence_policy.required_artifact_refs.includes('render_preview_screenshot_png'),
    true,
  );
  assert.equal(
    suite.native_live_evidence_policy.required_artifact_refs.includes('artifact_gallery_index_file'),
    true,
  );
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

test('RCA PPT capability map routes OMA feedback tokens to professional skills only', () => {
  assertPptCapabilityMapShape(
    readRepoJson(capabilityMapPath),
    readRepoJson(agentLabHandoffPath),
    readRepoJson('contracts/standard-agent-principles-adoption.json'),
  );
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
          const html = fs.readFileSync(visualArtifact.html_bundle.html_file, 'utf8');
          assert.equal(html.includes('[object Object]'), false);
          assert.equal(html.includes('04 / 03'), false);
          assert.equal(html.includes('08 / 08'), true);
          assertCommonExport({ exported });
          assert.equal(fs.existsSync(exported.export_bundle.source_html), true);
          assert.equal(exported.export_bundle.review_capture.source_visual_route, 'render_html');
        }

        if (routeCase.visualRoute === 'author_pptx_native') {
          assert.equal(visualArtifact.native_ppt_bundle.source_visual_route, 'author_pptx_native');
          assert.equal(visualArtifact.native_ppt_bundle.editable_artifact, true);
          assert.equal(visualArtifact.native_ppt_bundle.visual_sample_claim.proves_artifact_export_chain, true);
          assert.equal(visualArtifact.native_ppt_bundle.visual_sample_claim.proves_visual_design_quality, false);
          assert.equal(visualArtifact.native_ppt_bundle.visual_sample_claim.mock_fixture_visual_sample_allowed, false);
          assert.equal(visualArtifact.native_ppt_bundle.test_double_boundary.kind, 'deterministic_codex_test_double');
          assert.equal(fs.existsSync(visualArtifact.native_ppt_bundle.pptx_file), true);
          assert.equal(fs.existsSync(visualArtifact.native_ppt_bundle.pdf_file), true);
          assert.equal(fs.existsSync(visualArtifact.native_ppt_bundle.shape_manifest_file), true);
          assert.equal(
            visualArtifact.native_ppt_bundle.preview_screenshots.every((file) => fs.existsSync(file)),
            true,
          );
          assert.equal(fs.existsSync(results.find((entry) => entry.route === 'visual_director_review').result.artifactFile), true);
          assert.equal(fs.existsSync(results.find((entry) => entry.route === 'screenshot_review').result.artifactFile), true);
          assert.equal(fs.existsSync(results.find((entry) => entry.route === 'export_pptx').result.artifactFile), true);
          assertCommonExport({ exported, expectedRoute: 'author_pptx_native' });
          assert.equal(exported.export_bundle.renderer_proof.source_surface_kind, 'native_pptx');
          assert.equal(exported.export_bundle.source_pptx, visualArtifact.native_ppt_bundle.pptx_file);
          assert.equal(exported.export_bundle.native_ppt_shape_manifest, visualArtifact.native_ppt_bundle.shape_manifest_file);
          assert.equal(
            exported.export_bundle.renderer_proof.preview_screenshots.every((file) => fs.existsSync(file)),
            true,
          );
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
