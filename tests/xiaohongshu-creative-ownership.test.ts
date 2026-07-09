// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { cpSync, mkdtempSync } from 'node:fs';

import {
  createDeliverable,
  runDeliverableRoute,
} from './product-domain-action-test-api.ts';
import {
  startMockCodexCli,
  withEnv,
} from './mock-codex-cli.ts';

const XHS_OVERLAY = 'xiaohongshu';
const XHS_PROFILE_ID = 'standard_note';
const XHS_TOPIC_ID = 'topic-a';
const XHS_DELIVERABLE_ID = 'note-a';
const XHS_BASE_ROUTES = ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html'];
const XHS_ROUTES_THROUGH_VISUAL_REVIEW = [...XHS_BASE_ROUTES, 'visual_director_review'];
const XHS_ROUTES_THROUGH_SCREENSHOT_REVIEW = [...XHS_ROUTES_THROUGH_VISUAL_REVIEW, 'screenshot_review'];
const XHS_ROUTES_THROUGH_PUBLISH_COPY = [...XHS_ROUTES_THROUGH_SCREENSHOT_REVIEW, 'publish_copy'];

const preparedWorkspaceCache = new Map();
let sharedMockCodexRuntime = null;
let restoreMockHermesEnv = null;

function withOptionalEnv(env = {}) {
  if (Object.keys(env).length === 0) {
    return () => {};
  }
  return withEnv(env);
}

async function ensureMockCodexRuntime() {
  if (sharedMockCodexRuntime) {
    return;
  }
  sharedMockCodexRuntime = await startMockCodexCli();
  restoreMockHermesEnv = withEnv({
    REDCUBE_CODEX_COMMAND: sharedMockCodexRuntime.command,
  });
}

async function runXhsRoute(workspaceRoot, route) {
  const result = await runDeliverableRoute({
    workspaceRoot,
    overlay: XHS_OVERLAY,
    topicId: XHS_TOPIC_ID,
    deliverableId: XHS_DELIVERABLE_ID,
    route,
  });
  assert.equal(result.ok, true, route);
  return result;
}

async function runXhsRoutes(workspaceRoot, routes) {
  const results = [];
  for (const route of routes) {
    results.push(await runXhsRoute(workspaceRoot, route));
  }
  return results;
}

async function createXhsWorkspace({ workspacePrefix, title, goal }) {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), workspacePrefix));
  await createDeliverable({
    workspaceRoot,
    overlay: XHS_OVERLAY,
    profileId: XHS_PROFILE_ID,
    topicId: XHS_TOPIC_ID,
    deliverableId: XHS_DELIVERABLE_ID,
    title,
    goal,
  });
  return workspaceRoot;
}

function cloneWorkspace(sourceWorkspaceRoot, clonePrefix) {
  const cloneParent = mkdtempSync(path.join(os.tmpdir(), clonePrefix));
  const cloneWorkspaceRoot = path.join(cloneParent, 'workspace');
  cpSync(sourceWorkspaceRoot, cloneWorkspaceRoot, { recursive: true });
  return cloneWorkspaceRoot;
}

async function getPreparedWorkspaceClone({
  cacheKey,
  workspacePrefix,
  clonePrefix,
  title,
  goal,
  routes,
  env = {},
}) {
  if (!preparedWorkspaceCache.has(cacheKey)) {
    const workspaceRoot = await createXhsWorkspace({
      workspacePrefix,
      title,
      goal,
    });
    const restoreEnv = withOptionalEnv(env);
    try {
      const results = await runXhsRoutes(workspaceRoot, routes);
      preparedWorkspaceCache.set(cacheKey, { workspaceRoot, results });
    } finally {
      restoreEnv();
    }
  }
  const prepared = preparedWorkspaceCache.get(cacheKey);
  return cloneWorkspace(prepared.workspaceRoot, clonePrefix);
}

async function withMockCodexRuntime(testFn) {
  await ensureMockCodexRuntime();
  return await testFn();
}

test.after(async () => {
  if (restoreMockHermesEnv) {
    restoreMockHermesEnv();
    restoreMockHermesEnv = null;
  }
  if (sharedMockCodexRuntime) {
    await sharedMockCodexRuntime.close();
    sharedMockCodexRuntime = null;
  }
});

test('xiaohongshu route artifacts record Codex-backed creative ownership for story, visual, review, and publish surfaces', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = await getPreparedWorkspaceClone({
      cacheKey: 'xhs-through-publish-copy-default',
      workspacePrefix: 'redcube-xhs-creative-fixture-',
      clonePrefix: 'redcube-xhs-creative-clone-',
      title: 'P19 小红书创作权收口',
      goal: '验证小红书主创作权已从 JS builder 收回到 Codex-backed / director-first mainline',
      routes: XHS_ROUTES_THROUGH_PUBLISH_COPY,
    });
    const results = await runXhsRoutes(workspaceRoot, XHS_ROUTES_THROUGH_PUBLISH_COPY);
    const artifactsByRoute = Object.fromEntries(results.map((result) => [result.artifact?.route, result.artifact]));

    const storyline = artifactsByRoute.storyline;
    assert.equal(storyline.lifecycle_stage, 'story_architecture');
    assert.equal(storyline.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(storyline.storyline.creative_sources.narrative_arc.owner, 'codex_cli');
    assert.equal(storyline.storyline.creative_sources.narrative_arc.primary_surface, 'codex_cli_runtime');
    assert.equal(storyline.storyline.creative_sources.narrative_arc.materialized_from, 'codex_cli_json_output');

    const plan = artifactsByRoute.single_note_plan;
    assert.equal(plan.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(plan.single_note_plan.slides.every((slide) => slide.creative_sources?.page_core_content?.owner === 'codex_cli'), true);
    assert.equal(plan.single_note_plan.slides.every((slide) => slide.creative_sources?.visual_presentation?.primary_surface === 'codex_cli_runtime'), true);

    const visual = artifactsByRoute.visual_direction;
    assert.equal(visual.lifecycle_stage, 'visual_authorship');
    assert.equal(visual.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(visual.visual_direction.creative_sources.director_statement.owner, 'codex_cli');
    assert.equal(visual.visual_direction.creative_sources.director_statement.primary_surface, 'codex_cli_runtime');

    const render = artifactsByRoute.render_html;
    assert.equal(render.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(render.html_bundle.slides.every((slide) => slide.creative_sources?.final_markup?.owner === 'codex_cli'), true);

    const directorReview = artifactsByRoute.visual_director_review;
    assert.equal(directorReview.review_overlay, 'visual_director_review');
    assert.equal(directorReview.review_authorship.primary_surface, 'codex_cli_runtime');
    assert.equal(directorReview.review_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(directorReview.visual_director_review?.creative_sources?.review_judgement?.materialized_from, 'codex_cli_json_output');

    const screenshotReview = artifactsByRoute.screenshot_review;
    assert.equal(screenshotReview.review_overlay, 'screenshot_review');
    assert.equal(screenshotReview.review_execution?.owner, 'codex_cli');
    assert.equal(screenshotReview.review_execution?.overlay, 'screenshot_review');
    assert.equal(screenshotReview.review_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(screenshotReview.ai_review?.review_model, 'screenshot_director_first_visual_judgement');
    assert.equal(
      screenshotReview.ai_review?.creative_sources?.review_judgement?.materialized_from,
      'codex_cli_json_output',
    );

    const copy = artifactsByRoute.publish_copy;
    assert.equal(copy.lifecycle_stage, 'delivery_packaging');
    assert.equal(copy.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(copy.publish_copy.creative_sources.body.owner, 'codex_cli');
    assert.equal(copy.publish_copy.creative_sources.first_comment.primary_surface, 'codex_cli_runtime');
  });
});
