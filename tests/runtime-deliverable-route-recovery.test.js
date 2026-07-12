import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  createDeliverable,
  runDeliverableRoute,
} from './product-domain-action-test-api.js';
import {
  startMockCodexCli,
  withEnv,
} from './mock-codex-cli.js';
import { completeSourceReadiness } from './helpers/complete-source-readiness.js';

const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  fileURLToPath(new URL('./helpers/mock-redcube-python-with-playwright.js', import.meta.url)),
]);

function readArtifact(result) {
  return JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
}

async function withMockCodexRuntime(testFn) {
  const upstream = await startMockCodexCli();
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
    REDCUBE_PYTHON_COMMAND: MOCK_REDCUBE_PYTHON_COMMAND,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

async function createDeck(workspaceRoot, deliverableId = 'deck-a') {
  await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-a',
    title: 'Single AI route control proof',
    brief: '验证每次 domain route 调用只执行显式请求的 stage。',
    keywords: ['ppt', 'progress-first', 'codex'],
  });
  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId,
    title: 'Single AI route control proof',
    goal: '验证 RCA 不拥有第二套 stage 路由控制面',
  });
}

async function runRoute(workspaceRoot, route, options = {}) {
  return runDeliverableRoute({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: options.deliverableId || 'deck-a',
    route,
    stopAfterStage: options.stopAfterStage,
  });
}

test('runDeliverableRoute executes only the explicitly requested route', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-single-route-'));
    await createDeck(workspaceRoot);
    const result = await runRoute(workspaceRoot, 'render_html', { stopAfterStage: 'export_pptx' });

    assert.equal(result.ok, true);
    assert.equal(result.summary.requested_route, 'render_html');
    assert.equal(result.summary.executed_route, 'render_html');
    assert.equal(result.summary.route_selection_owner, 'codex_cli');
    assert.equal(result.summary.programmatic_route_continuation, false);
    assert.equal(result.summary.next_stage_may_start, true);
    assert.equal(Object.hasOwn(result.summary, 'auto_recovered_dependency_routes'), false);
    assert.equal(Object.hasOwn(result.summary, 'continued_route_sequence'), false);
    const artifact = readArtifact(result);
    assert.equal(artifact.status, 'completed_with_quality_debt');
    assert.equal(artifact.progress_first.next_stage_may_start, true);
  });
});

test('stopAfterStage is not interpreted by RCA as permission to schedule later stages', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-no-route-scheduler-'));
    await createDeck(workspaceRoot, 'deck-native');
    const result = await runRoute(workspaceRoot, 'author_pptx_native', {
      deliverableId: 'deck-native',
      stopAfterStage: 'export_pptx',
    });

    assert.equal(result.ok, true);
    assert.equal(result.summary.executed_route, 'author_pptx_native');
    assert.equal(result.summary.programmatic_route_continuation, false);
    const artifact = readArtifact(result);
    assert.equal(artifact.status, 'completed_with_quality_debt');
    assert.equal(artifact.quality_debt.blocks_stage_transition, false);
  });
});

test('review quality debt recommends repair without automatically running repair or export', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-no-scheduler-'));
    await createDeck(workspaceRoot);
    for (const route of [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'author_image_pages',
      'visual_director_review',
    ]) {
      const result = await runRoute(workspaceRoot, route);
      assert.equal(result.ok, true, route);
    }

    const restoreEnv = withEnv({ REDCUBE_MOCK_PPT_SCREENSHOT_REVIEW_VARIANT: 'force_block' });
    try {
      const result = await runRoute(workspaceRoot, 'screenshot_review', { stopAfterStage: 'export_pptx' });
      assert.equal(result.ok, true);
      assert.equal(result.summary.executed_route, 'screenshot_review');
      assert.equal(result.summary.programmatic_route_continuation, false);
      const artifact = readArtifact(result);
      assert.equal(artifact.status, 'completed_with_quality_debt');
      assert.equal(artifact.quality_debt.blocks_stage_transition, false);
      assert.equal(artifact.progress_first.next_stage_may_start, true);
    } finally {
      restoreEnv();
    }
  });
});
