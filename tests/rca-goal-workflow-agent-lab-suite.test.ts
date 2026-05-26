// @ts-nocheck
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  createDeliverable,
  exportDomainActionAdapter,
  invokeOplHostedProductEntry,
  prepareProductEntryWorkspace,
  runDeliverableRoute,
  SERIAL_ENV_TEST,
  withMockCodexRuntime,
  withMockCodexRuntimeState,
} from './product-domain-action-case-shared.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const oplBin = process.env.OPL_BIN || '/Users/gaofeng/workspace/one-person-lab/bin/opl';
const suitePath = 'contracts/production_acceptance/rca-goal-workflow-agent-lab-suite.json';
const agentLabHandoffPath = 'contracts/agent_lab_handoff.json';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
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

function assertGoalWorkflowSuiteShape(suite) {
  assert.equal(suite.surface_kind, 'rca_goal_workflow_agent_lab_suite_handoff');
  assert.equal(suite.owner, 'redcube_ai');
  assert.equal(suite.consumer, 'opl_agent_lab');
  assert.equal(suite.suite_kind, 'agent_lab_external_suite');
  assert.equal(suite.suite_id, 'redcube-ai.goal-workflow.minimal-autonomous-visual-delivery.v1');
  assert.equal(Array.isArray(suite.tasks), true);
  assert.equal(suite.tasks.length, 1);
  assert.equal(Array.isArray(suite.required_observations), true);
  assert.equal(suite.required_observations.includes('forbidden_authority_flags_all_false'), true);
  assert.equal(suite.handoff_surface.agent_lab_handoff_contract_ref, agentLabHandoffPath);
  assert.equal(suite.handoff_surface.agent_lab_suite_ref, suitePath);
  assert.equal(suite.artifact_sample_policy.sample_kind, 'mock_provider_artifact_producing_e2e');
  assert.equal(suite.artifact_sample_policy.proves_artifact_export_chain, true);
  assert.equal(suite.artifact_sample_policy.proves_live_image_provider, false);
  assert.equal(suite.artifact_sample_policy.route_chain.at(-1), 'export_bundle');
  assert.equal(
    suite.artifact_sample_refs.includes(
      'artifact-sample:test:rca-goal-workflow-agent-lab-suite#artifact-producing-xiaohongshu-export-bundle',
    ),
    true,
  );
  assert.equal(suite.goal_mode.input_style, '/goal');
  assert.equal(suite.goal_mode.single_goal_required, true);
  assert.equal(suite.goal_mode.stage_by_stage_operator_plan_required, false);
  assert.equal(suite.goal_mode.codex_app_outer_loop_required_after_task_start, false);
  assert.equal(suite.goal_mode.human_monitoring_required_after_task_start, false);
  assert.equal(suite.target_workflow.entry_mode, 'opl_hosted');
  assert.equal(suite.target_workflow.task_intent, 'run_opl_stage_execution_plan');
  assert.equal(suite.target_workflow.deliverable_family, 'xiaohongshu');
  assert.equal(suite.target_workflow.profile_id, 'standard_note');
  assert.equal(suite.target_workflow.default_lifecycle_policy, 'auto_to_terminal');
  assert.equal(suite.target_workflow.explicit_stop_after_stage, null);
  assert.equal(suite.target_workflow.artifact_body_required_in_suite, false);
  assert.deepEqual(suite.accepted_terminal_shapes, [
    'domain_receipt',
    'typed_blocker',
    'no_regression_evidence',
  ]);
  assert.equal(suite.not_authorized_claims.includes('visual_ready'), true);
  assert.equal(suite.not_authorized_claims.includes('production_soak_complete'), true);
  assert.equal(
    suite.target_runtime_consumption_refs.includes('redcube product manifest#/goal_workflow_agent_lab_suite'),
    true,
  );
  assert.equal(
    suite.target_runtime_consumption_refs.includes(
      'redcube domain-handler export#/mapped_surfaces/goal_workflow_agent_lab_suite',
    ),
    true,
  );
  assert.equal(
    suite.target_runtime_consumption_refs.includes(
      'redcube domain-handler export#/source_manifest_refs/goal_workflow_agent_lab_suite_ref',
    ),
    true,
  );
  assert.equal(suite.no_forbidden_write_refs.length > 0, true);
  assert.equal(suite.quality_floor_refs.includes('quality-floor:rca/goal-workflow/visual-authority-boundary'), true);
  assertRefsOnlyAuthorityBoundary(suite.authority_boundary, 'suite.authority_boundary');

  const task = suite.tasks[0];
  assert.equal(task.task_id, 'agent-lab-task:rca/goal-workflow/minimal-autonomous-visual-delivery');
  assert.equal(task.domain_id, 'redcube-ai');
  assert.equal(task.task_family, 'visual_deliverable_goal_workflow');
  assert.equal(task.environment.environment_kind, 'local_workspace');
  assert.equal(task.scorecard.domain_owned, true);
  assert.equal(task.scorecard.opl_scorecard_role, 'scorecard_ref_projection_only');
  assert.equal(task.scorecard.passed, true);
  assert.equal(task.scorecard.quality_floor_refs.includes('quality-floor:rca/goal-workflow/visual-authority-boundary'), true);
  assert.equal(task.promotion_gate.gate_status, 'passed');
  assert.equal(task.promotion_gate.regression_suite_refs.includes('tests/rca-goal-workflow-agent-lab-suite.test.ts'), true);
  assert.equal(task.promotion_gate.no_forbidden_write_proof_refs.length > 0, true);
  assert.equal(task.trajectory.stage_attempt_refs.length > 0, true);
  assert.equal(task.trajectory.file_refs.includes(suitePath), true);
}

test('RCA /goal workflow AgentLab suite is a top-level external suite contract', () => {
  const suite = readJson(suitePath);
  const handoff = readJson(agentLabHandoffPath);
  const descriptor = readJson('contracts/domain_descriptor.json');

  assertGoalWorkflowSuiteShape(suite);
  assert.equal(handoff.surface_kind, 'domain_agent_lab_production_evidence_handoff');
  assert.equal(handoff.external_suite_seed.suite_id, suite.suite_id);
  assert.equal(handoff.external_suite_seed.tasks[0].suite_ref, suitePath);
  assert.equal(handoff.no_forbidden_write_proof_refs.includes(suite.no_forbidden_write_refs[0]), true);
  assert.equal(descriptor.standard_contract_refs.agent_lab_handoff, agentLabHandoffPath);
});

test('OPL AgentLab runner consumes the RCA /goal workflow suite without missing observations', {
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
  assert.equal(suiteResult.suite_id, 'redcube-ai.goal-workflow.minimal-autonomous-visual-delivery.v1');
  assert.equal(suiteResult.status, 'passed');
  assert.deepEqual(suiteResult.missing_observations, []);
  assert.equal(suiteResult.summary.forbidden_authority_flag_count, 0);
  assert.equal(suiteResult.summary.memory_body_observed, false);
});

test('artifact-producing xiaohongshu goal workflow reaches export bundle without operator monitoring', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'redcube-goal-xhs-artifact-'));
    const previousImageGenerationMock = process.env.REDCUBE_IMAGE_GENERATION_MOCK;
    process.env.REDCUBE_IMAGE_GENERATION_MOCK = '1';
    try {
      await createDeliverable({
        workspaceRoot,
        overlay: 'xiaohongshu',
        profileId: 'standard_note',
        topicId: 'topic-a',
        deliverableId: 'note-series',
        title: '甲状腺门诊科普系列',
        goal: '验证 RCA 从单一目标自主推进到小红书图文导出 bundle',
      });

      const common = {
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-series',
      };
      const routes = [
        'research',
        'storyline',
        'single_note_plan',
        'visual_direction',
        'author_image_pages',
        'visual_director_review',
        'screenshot_review',
        'publish_copy',
        'export_bundle',
      ];
      const results = [];
      for (const route of routes) {
        const result = await runDeliverableRoute({ ...common, route });
        assert.equal(result.ok, true, route);
        results.push({ route, result });
      }

      const authorArtifact = JSON.parse(fs.readFileSync(
        results.find((entry) => entry.route === 'author_image_pages').result.artifactFile,
        'utf8',
      ));
      assert.equal(authorArtifact.status, 'completed');
      assert.equal(authorArtifact.image_pages_bundle.source_visual_route, 'author_image_pages');
      assert.equal(authorArtifact.image_pages_bundle.dimensions.ratio, '3:4');
      assert.equal(authorArtifact.image_page_manifest.slides.length > 0, true);
      assert.equal(
        authorArtifact.image_page_manifest.slides.every((slide) => fs.existsSync(slide.image_file)),
        true,
      );

      const reviewArtifact = JSON.parse(fs.readFileSync(
        results.find((entry) => entry.route === 'screenshot_review').result.artifactFile,
        'utf8',
      ));
      assert.equal(typeof reviewArtifact.checks.overflow_free, 'boolean');
      assert.equal(
        reviewArtifact.slide_reviews.every((slide) => fs.existsSync(slide.screenshot_file)),
        true,
      );

      const exportArtifact = JSON.parse(fs.readFileSync(results.at(-1).result.artifactFile, 'utf8'));
      assert.equal(exportArtifact.status, 'completed');
      assert.equal(exportArtifact.export_bundle.source_surface_kind, 'image_pages');
      assert.equal(exportArtifact.export_bundle.source_visual_route, 'author_image_pages');
      assert.equal(exportArtifact.export_bundle.delivery_state.current, 'output_ready');
      assert.equal(exportArtifact.export_bundle.png_files.length, authorArtifact.image_page_manifest.slides.length);
      assert.equal(exportArtifact.export_bundle.publish_image_files.length, exportArtifact.export_bundle.png_files.length);
      assert.equal(
        exportArtifact.export_bundle.publish_image_files.every((file) => fs.existsSync(file)),
        true,
      );
      assert.equal(fs.existsSync(exportArtifact.export_bundle.caption_file), true);
      assert.equal(fs.existsSync(path.join(workspaceRoot, 'topics', 'topic-a', 'publication-state.json')), true);
      assert.equal(fs.existsSync(exportArtifact.series_surfaces.delivery_overview_file), true);
      assert.equal(fs.existsSync(exportArtifact.series_surfaces.path_mapping_file), true);
      assert.equal(fs.existsSync(exportArtifact.series_surfaces.cadence_file), true);
    } finally {
      if (previousImageGenerationMock === undefined) {
        delete process.env.REDCUBE_IMAGE_GENERATION_MOCK;
      } else {
        process.env.REDCUBE_IMAGE_GENERATION_MOCK = previousImageGenerationMock;
      }
    }
  });
});

test('manifest and domain-handler export expose the RCA /goal workflow AgentLab suite', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const manifestModule = await import('../packages/redcube-domain-entry/dist/index.js');
    const manifest = await manifestModule.getProductEntryManifest({
      workspace_root: workspaceRoot,
    });
    const projection = await exportDomainActionAdapter({
      workspace_root: workspaceRoot,
    });

    assertGoalWorkflowSuiteShape(manifest.goal_workflow_agent_lab_suite);
    assert.deepEqual(
      manifest.operator_evidence_readiness_projection.goal_workflow_agent_lab_suite,
      manifest.goal_workflow_agent_lab_suite,
    );
    assertGoalWorkflowSuiteShape(projection.mapped_surfaces.goal_workflow_agent_lab_suite);
    assert.equal(
      projection.source_manifest_refs.goal_workflow_agent_lab_suite_ref,
      '/goal_workflow_agent_lab_suite',
    );
    assert.equal(
      manifest.owner_route.projection_refs.some((entry) => entry.ref === '/goal_workflow_agent_lab_suite'),
      true,
    );
    assert.equal(
      manifest.domain_owner_receipt_contract.goal_workflow_agent_lab_suite_owner_projection.refs_only,
      true,
    );
    assert.equal(
      manifest.domain_owner_receipt_contract.goal_workflow_agent_lab_suite_owner_projection.authorizes_quality_or_export,
      false,
    );
  });
});

test('OPL-hosted /goal workflow starts one-shot RCA product entry without stop-after-stage monitoring', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'goal-note-a',
      title: 'Goal workflow note',
      goal: '验证 RCA 可以从单一 /goal 进入小红书视觉交付闭环',
    });

    const response = await invokeOplHostedProductEntry({
      target_domain_id: 'redcube_ai',
      task_intent: 'run_opl_stage_execution_plan',
      entry_mode: 'opl_hosted',
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      runtime_session_contract: {
        runtime_owner: 'configured_family_runtime_provider',
      },
      return_surface_contract: {
        surface_kind: 'product_entry',
      },
      entry_session_contract: {
        entry_session_id: 'session-goal-workflow',
      },
      delivery_request: {
        deliverable_family: 'xiaohongshu',
        topic_id: 'topic-a',
        deliverable_id: 'goal-note-a',
        profile_id: 'standard_note',
        title: 'Goal workflow note',
        goal: '验证 RCA 可以从单一 /goal 进入小红书视觉交付闭环',
        lifecycle_policy: 'auto_to_terminal',
      },
    });

    const plan = response.product_entry_surface.domain_entry_surface.result_surface;
    assert.equal(response.ok, true);
    assert.equal(response.entry_mode, 'opl_hosted');
    assert.equal(plan.surface_kind, 'opl_stage_execution_plan');
    assert.equal(plan.entry_mode, 'opl_hosted');
    assert.equal(plan.delivery_identity.deliverable_family, 'xiaohongshu');
    assert.equal(plan.control_policy.mode, 'auto_to_terminal');
    assert.equal(plan.control_policy.requested_stop_after_stage, null);
    assert.equal(plan.control_policy.approval_required, false);
    assert.equal(plan.control_policy.gate_status, 'approved');
    assert.equal(response.runtime_loop_closure.control_policy.default_run_mode, 'auto_to_terminal');
    assert.equal(
      response.runtime_loop_closure.control_policy.stop_policy,
      'stop_only_on_explicit_stop_after_stage_or_runtime_review_gate',
    );
    assert.equal(response.runtime_loop_closure.source_linkage.entry_mode, 'opl_hosted');
    assert.equal(response.product_entry_surface.domain_entry_surface.task_intent, 'run_opl_stage_execution_plan');
    assert.equal(response.product_entry_surface.summary.approval_required, false);
    assert.equal(
      response.product_entry_surface.continuation_snapshot.stage_execution_plan.control_policy.requested_stop_after_stage,
      null,
    );
  });
});
