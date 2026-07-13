import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

import { createDeliverable, reviewRenderOutput, runDeliverableRoute } from './product-domain-action-test-api.js';
import { withMockCodexRuntime } from './mock-codex-cli.js';
import { resolveRedCubePythonCommand } from '../scripts/run-test-group-lib.ts';

let cachedPythonCommand = null;

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function hasPythonPptPipeline() {
  const explicitTestPython = String(process.env.REDCUBE_TEST_PYTHON || '').trim();
  cachedPythonCommand = cachedPythonCommand || (
    explicitTestPython ? { command: explicitTestPython, args: [] } : resolveRedCubePythonCommand()
  );
  return spawnSync(
    cachedPythonCommand.command,
    [...(cachedPythonCommand.args || []), '-c', 'import pptx, playwright, PIL'],
    { encoding: 'utf-8' },
  ).status === 0;
}

async function runImageFirstChain(workspaceRoot, deliverableId) {
  const results = [];
  for (const route of [
    'storyline',
    'detailed_outline',
    'slide_blueprint',
    'visual_direction',
    'author_image_pages',
    'visual_director_review',
    'screenshot_review',
  ]) {
    results.push({
      route,
      result: await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId,
        route,
      }),
    });
  }
  return results;
}

test('ppt HTML workflow starts directly without a program-owned predecessor scheduler', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-html-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-html',
      title: '肠癌 AI 讲课 deck',
      goal: '给学生讲清肠癌 AI 的问题、方法与边界',
    });
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-html',
      route: 'render_html',
    });
    assert.equal(result.ok, true);
    assert.equal(result.summary.programmatic_route_continuation, false);
    const artifact = readJson(result.artifactFile);
    assert.equal(artifact.route, 'render_html');
    assert.equal(artifact.status, 'completed_with_quality_debt');
    assert.equal(artifact.progress_first.next_stage_may_start, true);
    assert.equal(artifact.quality_debt.blocks_stage_transition, false);
    assert.match(artifact.stage_attempt_diagnostic.error_message, /slide|visual_direction/i);
  });
});

test('ppt HTML workflow advances with quality debt when one generated page is missing', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-html-partial-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-html-partial',
      title: '肠癌 AI 讲课 deck',
      goal: '验证 HTML 缺一页仍可推进',
    });
    for (const route of ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction']) {
      const planning = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-html-partial',
        route,
      });
      assert.equal(planning.ok, true, route);
    }
    process.env.REDCUBE_MOCK_PPT_RENDER_VARIANT = 'omit_last_slide';
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-html-partial',
      route: 'render_html',
    });
    delete process.env.REDCUBE_MOCK_PPT_RENDER_VARIANT;
    assert.equal(result.ok, true);
    const artifact = readJson(result.artifactFile);
    assert.equal(artifact.status, 'completed_with_quality_debt');
    assert.equal(artifact.html_bundle.actual_page_count > 0, true);
    assert.equal(artifact.html_bundle.actual_page_count < artifact.html_bundle.expected_page_count, true);
    for (const route of ['visual_director_review', 'screenshot_review']) {
      const downstream = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-html-partial',
        route,
      });
      assert.equal(downstream.ok, true, route);
    }
  });
});

test('ppt HTML workflow advances with quality debt when its shell asset is missing', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-fail-closed-'));
    const created = await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '肠癌 AI 讲课 deck',
      goal: '给学生讲清肠癌 AI 的问题、方法与边界',
    });
    const contractFile = path.join(path.dirname(created.deliverableFile), 'contracts', 'hydrated-deliverable.json');
    const contract = readJson(contractFile);
    contract.prompt_pack.render_contract.shell_file = 'missing-shell.html';
    writeFileSync(contractFile, JSON.stringify(contract, null, 2), 'utf-8');
    for (const route of ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction']) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'render_html',
    });
    assert.equal(result.ok, true, JSON.stringify(result, null, 2));
    assert.equal(result.run.status, 'completed_with_quality_debt');
    assert.equal(result.run.error, null);
    assert.equal(result.artifact.status, 'completed_with_quality_debt');
    assert.match(result.artifact.stage_attempt_diagnostic.error_message, /Missing prompt pack asset/i);
    assert.equal(result.artifact.progress_first.next_stage_may_start, true);
    assert.equal(result.artifact.quality_debt.blocks_stage_transition, false);
    assert.equal(result.artifact.quality_debt.blocks_visual_ready_claim, true);
    assert.equal(result.artifact.quality_debt.blocks_export_ready_claim, true);
    assert.deepEqual(result.artifact.typed_blocker_refs, []);
  });
});

test('ppt image-first workflow reaches screenshot review and real export or hard block', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-e2e-'));
    const deliverableId = 'deck-image';
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId,
      title: '肠癌 AI 讲课 deck',
      goal: '给学生讲清肠癌 AI 的问题、方法与边界',
    });
    const chain = await runImageFirstChain(workspaceRoot, deliverableId);
    assert.equal(chain.every(({ result }) => result.ok), true);
    const blueprint = readJson(chain.find(({ route }) => route === 'slide_blueprint').result.artifactFile);
    const authored = readJson(chain.find(({ route }) => route === 'author_image_pages').result.artifactFile);
    const review = readJson(chain.find(({ route }) => route === 'screenshot_review').result.artifactFile);
    assert.equal(authored.image_page_manifest.page_count, blueprint.slide_blueprint.slides.length);
    assert.equal(authored.image_page_manifest.slides.every((slide) => existsSync(slide.image_file)), true);
    assert.equal(review.review_capture.source_visual_route, 'author_image_pages');
    assert.equal(review.slide_reviews.every((slide) => existsSync(slide.screenshot_file)), true);
    assert.equal((await reviewRenderOutput({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
    })).status, 'pass');

    const exportResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
      route: 'export_pptx',
    });
    if (hasPythonPptPipeline()) {
      assert.equal(exportResult.ok, true);
      const bundle = readJson(exportResult.artifactFile);
      assert.equal(existsSync(bundle.export_bundle.pptx_file), true);
      assert.equal(bundle.export_bundle.page_count_match, true);
    } else {
      assert.equal(exportResult.ok, false);
      assert.match(exportResult.run.error.message, /python|playwright|pptx/i);
    }
  });
});
