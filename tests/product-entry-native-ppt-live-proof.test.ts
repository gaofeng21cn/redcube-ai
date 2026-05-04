// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';

import {
  getProductEntrySession,
  invokeProductEntry,
} from './gateway-test-api.ts';
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
      title: 'Native PPT live product-entry proof',
      goal: '证明 RedCube product-entry 可以通过真实 native PPT helper 完成交付证明。',
      route,
      stop_after_stage: stopAfterStage,
      user_intent: userIntent,
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
      title: 'Native PPT live proof source readiness',
      brief: '验证 source readiness 到 native PPT product-entry 交付链路。',
      keywords: ['native PPT', 'LibreOffice', 'Poppler', 'product-entry'],
    });
    assert.equal(sourceReadiness.planningReady, true);
    assert.equal(sourceReadiness.recommended_action, 'create_deliverable');

    const planned = await invokeRoute({
      workspaceRoot,
      entrySessionId,
      route: 'storyline',
      stopAfterStage: 'visual_direction',
      userIntent: '先完成 source-backed planning artifacts，然后进入 native PPT authoring live proof。',
    });
    assert.equal(planned.ok, true);
    assert.equal(routeSurface(planned).summary.executed_route, 'visual_direction');
    assert.equal(planned.entry_session.created_deliverable, true);
    assert.equal(existsSync(planned.entry_session.session_file), true);

    const authored = await invokeRoute({
      workspaceRoot,
      entrySessionId,
      route: 'author_pptx_native',
      userIntent: '使用 native PPT proof lane 生成可编辑 PPTX，保持后续 review/export gates。',
    });
    const nativeArtifact = artifactFor(authored);
    assert.equal(nativeArtifact.route, 'author_pptx_native');
    assert.equal(nativeArtifact.native_ppt_bundle.editable_artifact, true);
    assert.equal(nativeArtifact.native_ppt_bundle.source_visual_route, 'author_pptx_native');
    assert.equal(nativeArtifact.native_ppt_bundle.python_helper_invocation.package_module, 'redcube_ai.native_helpers.ppt_deck.native');
    assert.equal(existsSync(nativeArtifact.native_ppt_bundle.pptx_file), true);
    assert.equal(existsSync(nativeArtifact.native_ppt_bundle.pdf_file), true);
    assert.equal(existsSync(nativeArtifact.native_ppt_bundle.shape_manifest_file), true);
    assertRealNativeRenderProof(nativeArtifact.native_ppt_bundle.render_proof);

    const shapeManifest = readJson(nativeArtifact.native_ppt_bundle.shape_manifest_file);
    assert.equal(shapeManifest.builder.kind, 'redcube_drawingml_writer');
    assert.equal(shapeManifest.builder.screenshot_packaging, false);
    assert.equal(shapeManifest.render_proof.synthetic_preview, false);
    assertRealNativeRenderProof(shapeManifest.render_proof);

    const director = await invokeRoute({
      workspaceRoot,
      entrySessionId,
      route: 'visual_director_review',
      userIntent: 'review the native PPT visual artifact before screenshot review',
    });
    const directorArtifact = artifactFor(director);
    assert.equal(directorArtifact.status, 'pass');

    const screenshot = await invokeRoute({
      workspaceRoot,
      entrySessionId,
      route: 'screenshot_review',
      userIntent: 'review native PPT render-proof screenshots and shape manifest metrics',
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
    assert.equal(session.entry_session.entry_session_id, entrySessionId);
    assert.equal(session.entry_session.session_file.startsWith(runtimeStateRoot), true);
    assert.equal(session.delivery_identity.deliverable_id, DELIVERABLE_ID);
    assert.equal(session.summary.deliverable_id, DELIVERABLE_ID);
    assert.equal(session.session_continuity.restore_point.latest_handle, session.continuation_snapshot.latest_run_id);
    assert.equal(session.native_proof_artifact_inventory.surface_kind, 'native_ppt_proof_artifact_inventory');
    assert.equal(session.native_proof_artifact_inventory.summary.has_pptx, true);
    assert.equal(session.native_proof_artifact_inventory.summary.has_pdf, true);
    assert.equal(session.native_proof_artifact_inventory.summary.has_shape_manifest, true);
    assert.equal(session.summary.native_proof_artifact_ref_count > 0, true);
  });
});
