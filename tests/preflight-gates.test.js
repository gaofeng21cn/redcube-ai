import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import { createDeliverable, runDeliverableRoute } from '../packages/redcube-gateway/src/index.js';
import { completeSourceReadiness } from './helpers/complete-source-readiness.js';
import { startMockCodexCli, withEnv } from './helpers/mock-codex-cli.js';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

async function withMockHermesUpstream(testFn) {
  const upstream = await startMockCodexCli();
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

test('xiaohongshu screenshot_review fails fast on deterministic HTML preflight before AI visual review', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-preflight-'));
    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: '甲状腺门诊科普',
      brief: '验证截图审阅前置门禁。',
      keywords: ['甲状腺'],
    });
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: '甲状腺门诊小红书科普',
      goal: '生成可发布图文',
    });
    for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction']) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const renderResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      route: 'render_html',
    });
    assert.equal(renderResult.ok, true, 'render_html');
    const renderArtifactFile = path.join(workspaceRoot, 'topics/topic-a/deliverables/note-a/artifacts/render_bundle.json');
    const renderArtifact = readJson(renderArtifactFile);
    renderArtifact.html_bundle.slides[0].content = renderArtifact.html_bundle.slides[0].content
      .replaceAll('data-qa-block=', 'data-broken-qa-block=')
      .replaceAll('data-primary-point=', 'data-broken-primary-point=');
    writeFileSync(renderArtifactFile, JSON.stringify(renderArtifact, null, 2), 'utf-8');

    const directorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      route: 'visual_director_review',
    });
    assert.equal(directorResult.ok, true, 'visual_director_review');

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      route: 'screenshot_review',
    });

    assert.equal(result.ok, false);
    const qualityGate = readJson(path.join(workspaceRoot, 'topics/topic-a/deliverables/note-a/artifacts/quality_gate.json'));
    assert.equal(qualityGate.status, 'block');
    assert.equal(qualityGate.preflight_gate.status, 'block');
    assert.equal(qualityGate.preflight_gate.ai_review_skipped, true);
    assert.deepEqual(qualityGate.review_state_patch.rerun_policy, {
      status: 'rerun_required',
      rerun_from_stage: 'fix_html',
      default_route: 'fix_html',
      scope: 'page',
      target_slide_ids: qualityGate.preflight_gate.target_slide_ids,
      source_review_stage: 'preflight_gate',
    });
  });
});
