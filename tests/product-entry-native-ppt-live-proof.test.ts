// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';

import {
  getProductEntrySession,
  invokeProductEntry,
} from './product-domain-action-test-api.ts';
import { buildOplRouteAttemptIndexForTest } from './helpers/route-attempt-test-api.ts';
import { completeSourceReadiness } from './helpers/complete-source-readiness.ts';
import { mkUserScopedTestWorkspace } from './helpers/test-workspace.ts';
import {
  startMockCodexCli,
  withEnv,
} from './helpers/mock-codex-cli.ts';

const TOPIC_ID = 'topic-native-live';
const DELIVERABLE_ID = 'deck-native-live';
const MANAGED_PYTHON_RELATIVE_SEGMENTS = [
  'projects',
  'redcube-ai',
  'runtime-state',
  'python',
  'stable-playwright',
  'venv',
  'bin',
  'python',
];

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function resolveCodexHome() {
  return String(process.env.CODEX_HOME || '').trim()
    ? path.resolve(process.env.CODEX_HOME)
    : path.join(os.homedir(), '.codex');
}

function resolveManagedPythonCommand() {
  const explicit = String(process.env.REDCUBE_TEST_PYTHON || '').trim();
  const command = explicit || path.join(resolveCodexHome(), ...MANAGED_PYTHON_RELATIVE_SEGMENTS);
  assert.equal(existsSync(command), true, `managed RedCube Python is missing: ${command}`);
  return command;
}

async function withLiveNativePptProductEntryRuntime(testFn) {
  const upstream = await startMockCodexCli();
  const runtimeStateRoot = path.join(
    resolveCodexHome(),
    'projects',
    'redcube-ai',
    'runtime-state',
    'native-ppt-live-product-proof',
  );
  mkdirSync(runtimeStateRoot, { recursive: true });
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
    REDCUBE_PYTHON_COMMAND: resolveManagedPythonCommand(),
    REDCUBE_RUNTIME_STATE_ROOT: runtimeStateRoot,
  });
  try {
    return await testFn({ runtimeStateRoot });
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

async function invokeRoute({ workspaceRoot, entrySessionId, route, stopAfterStage, userIntent }) {
  return invokeProductEntry({
    workspace_locator: {
      workspace_root: workspaceRoot,
    },
    entry_session_contract: {
      entry_session_id: entrySessionId,
    },
    task_intent: 'run_deliverable_route',
    delivery_request: {
      deliverable_family: 'ppt_deck',
      topic_id: TOPIC_ID,
      deliverable_id: DELIVERABLE_ID,
      profile_id: 'lecture_student',
      title: '可编辑演示交付闭环验证',
      goal: '证明从目标到可编辑演示文件的交付链路可以自动推进，并保留可复核的审查与导出证据。',
      route,
      stop_after_stage: stopAfterStage,
      user_intent: userIntent,
      cross_provider_attempt_index: buildOplRouteAttemptIndexForTest({
        route,
        runId: `${entrySessionId}/${route}`,
        topicId: TOPIC_ID,
        deliverableId: DELIVERABLE_ID,
      }),
    },
  });
}

function routeSurface(response) {
  return response.domain_entry_surface.result_surface;
}

function artifactFor(response) {
  const surface = routeSurface(response);
  assert.equal(surface.surface_kind, 'route_run');
  assert.equal(surface.ok, true);
  assert.equal(existsSync(surface.artifactFile), true);
  return readJson(surface.artifactFile);
}

function assertRealNativeRenderProof(renderProof) {
  assert.equal(renderProof.source_surface_kind, 'native_pptx');
  assert.equal(renderProof.renderer_kind, 'libreoffice_headless');
  assert.equal(renderProof.renderer_pipeline, 'libreoffice_headless_pdf_png_v1');
  assert.equal(renderProof.runtime, 'libreoffice_headless');
  assert.equal(renderProof.command_family, 'soffice --headless');
  assert.equal(renderProof.synthetic_preview, false);
  assert.equal(renderProof.required, true);
  assert.match(String(renderProof.libreoffice_version || ''), /LibreOffice/i);
  assert.match(String(renderProof.poppler_version || ''), /pdftoppm|poppler/i);
  assert.equal(Array.isArray(renderProof.preview_screenshots), true);
  assert.equal(renderProof.preview_screenshots.length > 0, true);
  for (const screenshot of renderProof.preview_screenshots) {
    assert.equal(existsSync(screenshot), true, screenshot);
    assert.equal(statSync(screenshot).size > 0, true, screenshot);
  }
}

test('live product-entry native PPT proof reaches review and export gates with real LibreOffice/Poppler render proof', { timeout: 120_000, concurrency: false }, async () => {
  await withLiveNativePptProductEntryRuntime(async ({ runtimeStateRoot }) => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-live-product-');
    const entrySessionId = `session-native-ppt-live-proof-${path.basename(workspaceRoot)}`;

    const sourceReadiness = await completeSourceReadiness({
      workspaceRoot,
      topicId: TOPIC_ID,
      title: '可编辑演示交付源材料准备',
      brief: '验证源材料准备到可编辑演示交付链路的审查与导出证据。',
      keywords: ['editable PPTX', 'LibreOffice', 'Poppler', 'review evidence'],
    });
    assert.equal(sourceReadiness.planningReady, true);
    assert.equal(sourceReadiness.recommended_action, 'create_deliverable');

    const planned = await invokeRoute({
      workspaceRoot,
      entrySessionId,
      route: 'storyline',
      stopAfterStage: 'visual_direction',
      userIntent: '先完成 source-backed planning artifacts，然后进入可编辑演示文件生成与审查。',
    });
    assert.equal(planned.ok, true);
    assert.equal(routeSurface(planned).summary.executed_route, 'visual_direction');
    assert.equal(planned.entry_session.created_deliverable, true);
    assert.equal(existsSync(planned.entry_session.session_file), true);

    const authored = await invokeRoute({
      workspaceRoot,
      entrySessionId,
      route: 'author_pptx_native',
      userIntent: '生成可编辑 PPTX，保持后续 review/export gates。',
    });
    const nativeArtifact = artifactFor(authored);
    assert.equal(nativeArtifact.route, 'author_pptx_native');
    assert.equal(nativeArtifact.native_ppt_bundle.editable_artifact, true);
    assert.equal(nativeArtifact.native_ppt_bundle.source_visual_route, 'author_pptx_native');
    assert.equal(nativeArtifact.native_ppt_bundle.python_helper_invocation.package_module, 'redcube_ai.native_helpers.ppt_deck.native');
    assert.equal(nativeArtifact.native_ppt_bundle.officecli_gate.view_issues.data.count, 0);
    assert.equal(existsSync(nativeArtifact.native_ppt_bundle.pptx_file), true);
    assert.equal(existsSync(nativeArtifact.native_ppt_bundle.pdf_file), true);
    assert.equal(existsSync(nativeArtifact.native_ppt_bundle.shape_manifest_file), true);
    assertRealNativeRenderProof(nativeArtifact.native_ppt_bundle.render_proof);

    const shapeManifest = readJson(nativeArtifact.native_ppt_bundle.shape_manifest_file);
    assert.equal(shapeManifest.builder.kind, 'officecli_pptx_materializer');
    assert.equal(shapeManifest.builder.screenshot_packaging, false);
    assert.equal(shapeManifest.render_proof.synthetic_preview, false);
    assertRealNativeRenderProof(shapeManifest.render_proof);

    const director = await invokeRoute({
      workspaceRoot,
      entrySessionId,
      route: 'visual_director_review',
      userIntent: 'review the editable presentation visual artifact before screenshot review',
    });
    const directorArtifact = artifactFor(director);
    assert.equal(directorArtifact.status, 'pass');

    const screenshot = await invokeRoute({
      workspaceRoot,
      entrySessionId,
      route: 'screenshot_review',
      userIntent: 'review rendered editable presentation screenshots and shape manifest metrics',
    });
    const screenshotArtifact = artifactFor(screenshot);
    assert.equal(screenshotArtifact.status, 'pass');
    assert.equal(screenshotArtifact.metrics.source_surface_kind, 'native_pptx');
    assert.equal(screenshotArtifact.mechanical_review.metrics.source_surface_kind, 'native_pptx');
    assert.equal(screenshotArtifact.mechanical_review.metrics.render_proof_source, 'libreoffice_headless');
    assert.equal(screenshotArtifact.mechanical_review.metrics.synthetic_preview, false);
    assert.equal(
      screenshotArtifact.mechanical_review.slide_reviews.every(
        (slide) => slide.metrics.native_quality_source === 'shape_manifest'
          && slide.metrics.render_proof_source === 'libreoffice_headless'
          && slide.metrics.synthetic_preview === false,
      ),
      true,
    );

    const exported = await invokeRoute({
      workspaceRoot,
      entrySessionId,
      route: 'export_pptx',
      userIntent: 'export the reviewed native PPT artifact without synthetic preview or PowerPoint automation',
    });
    const exportArtifact = artifactFor(exported);
    assert.equal(exportArtifact.export_bundle.source_visual_route, 'author_pptx_native');
    assert.equal(exportArtifact.export_bundle.source_pptx, nativeArtifact.native_ppt_bundle.pptx_file);
    assert.equal(exportArtifact.export_bundle.native_ppt_shape_manifest, nativeArtifact.native_ppt_bundle.shape_manifest_file);
    assert.equal(existsSync(exportArtifact.export_bundle.pptx_file), true);
    assert.equal(existsSync(exportArtifact.export_bundle.pdf_file), true);

    const session = await getProductEntrySession({
      entrySessionId,
    });
    assert.equal(session.ok, true);
    assert.equal(session.surface_kind, 'product_entry_session');
    assert.equal(session.projection_kind, 'rca_product_entry_session_domain_snapshot_refs');
    assert.equal(session.entry_session_ref.entry_session_id, entrySessionId);
    assert.equal(session.entry_session_ref.session_file_ref.ref.startsWith(runtimeStateRoot), true);
    assert.equal(session.delivery_locator_refs.deliverable_id, DELIVERABLE_ID);
    assert.equal(session.summary.deliverable_id, DELIVERABLE_ID);
    assert.equal(session.currentness_refs.latest_visual_run_ref, session.summary.latest_visual_run_ref);
    assert.equal(session.authority_boundary.refs_only, true);
    assert.equal(session.authority_boundary.rca_owns_generic_session_shell, false);
  });
});
