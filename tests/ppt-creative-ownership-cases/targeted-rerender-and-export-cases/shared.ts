// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

import {
  canonicalStageForRoute,
  getDeliverablePaths,
  readStageFolderArtifact,
  stageOrderForCanonicalStage,
  writeStageFolderArtifact,
} from '@redcube/runtime-protocol';
import {
  createDeliverable,
} from '@redcube/domain-entry';
import { runDeliverableRoute } from '../../helpers/route-attempt-test-api.ts';
import {
  startMockCodexCli,
  withEnv,
} from '../../helpers/mock-codex-cli.ts';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function writeJson(file, data) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

let stageFixtureWriteCounter = 0;

function nextStageFixtureAttemptId(routeStageId, label) {
  stageFixtureWriteCounter += 1;
  return [
    Date.now(),
    String(stageFixtureWriteCounter).padStart(6, '0'),
    label,
    routeStageId,
  ].join('-');
}

function relocatePreparedArtifact(value, fromWorkspaceRoot, toWorkspaceRoot) {
  if (typeof value === 'string') {
    return value.includes(fromWorkspaceRoot)
      ? value.split(fromWorkspaceRoot).join(toWorkspaceRoot)
      : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => relocatePreparedArtifact(item, fromWorkspaceRoot, toWorkspaceRoot));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        relocatePreparedArtifact(item, fromWorkspaceRoot, toWorkspaceRoot),
      ]),
    );
  }
  return value;
}

function relocateWorkspaceJsonSidecars(rootDir, fromWorkspaceRoot, toWorkspaceRoot) {
  for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
    const file = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      relocateWorkspaceJsonSidecars(file, fromWorkspaceRoot, toWorkspaceRoot);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const content = readFileSync(file, 'utf-8');
    if (!content.includes(fromWorkspaceRoot)) continue;
    writeFileSync(file, content.split(fromWorkspaceRoot).join(toWorkspaceRoot), 'utf-8');
  }
}

function writeLatestCapturePointer(workspaceRoot, topicId, deliverableId, artifact) {
  if (!artifact?.review_capture) return;
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const captureId = String(artifact.review_capture.capture_id || '').trim();
  const reviewMarkdownFile = String(artifact.review_capture.review_markdown_file || '').trim();
  if (!captureId || !reviewMarkdownFile) return;
  writeJson(path.join(deliverablePaths.reportsDir, 'screenshots', 'latest-capture.json'), {
    capture_id: captureId,
    review_markdown_file: reviewMarkdownFile,
    slide_count: Array.isArray(artifact.slide_reviews) ? artifact.slide_reviews.length : 0,
  });
}

function readRouteStageArtifact(workspaceRoot, routeStageId, topicId = 'topic-a', deliverableId = 'deck-a') {
  const canonicalStageId = canonicalStageForRoute(routeStageId);
  const loaded = readStageFolderArtifact({
    deliverablePaths: getDeliverablePaths(workspaceRoot, topicId, deliverableId),
    routeStageId,
    canonicalStageId,
    stageOrder: stageOrderForCanonicalStage(canonicalStageId),
  });
  assert.equal(Boolean(loaded?.artifact), true, routeStageId);
  return loaded.artifact;
}

function writeRouteStageArtifact(
  workspaceRoot,
  routeStageId,
  artifact,
  topicId = 'topic-a',
  deliverableId = 'deck-a',
  label = 'manual',
) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const canonicalStageId = canonicalStageForRoute(routeStageId);
  const artifactFile = path.join(
    deliverablePaths.deliverableDir,
    'stage-test-inputs',
    `${routeStageId}.${label}-artifact.json`,
  );
  writeJson(artifactFile, artifact);
  const written = writeStageFolderArtifact({
    deliverablePaths,
    programId: deliverablePaths.programId,
    topicId,
    deliverableId,
    routeStageId,
    canonicalStageId,
    stageOrder: stageOrderForCanonicalStage(canonicalStageId),
    attemptId: nextStageFixtureAttemptId(routeStageId, label),
    artifactFile,
    outputName: `${routeStageId}.json`,
    ownerReceiptRefs: artifact?.status === 'block' || artifact?.status === 'failed'
      ? []
      : [`rca-owner-receipt:test:${routeStageId}:${deliverableId}`],
    typedBlockerRefs: artifact?.status === 'block' || artifact?.status === 'failed'
      ? [`rca-typed-blocker:test:${routeStageId}:${deliverableId}`]
      : [],
    blockingReasons: artifact?.blocking_reasons || artifact?.review_state_patch?.blocking_reasons || [],
  });
  if (routeStageId === 'screenshot_review') {
    writeLatestCapturePointer(workspaceRoot, topicId, deliverableId, artifact);
  }
  return written.output_file;
}

const DEFAULT_PPT_CREATIVE_METADATA = {
  profileId: 'lecture_peer',
  topicId: 'topic-a',
  deliverableId: 'deck-a',
  title: 'Med Auto Science 同行讲课',
  goal: '向医学人工智能小同行讲清自动科研为什么成立、怎么做、模块如何复用',
};
const PPT_ROUTES_TO_RENDER_HTML = ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html'];
const PPT_ROUTES_TO_SCREENSHOT_REVIEW = [...PPT_ROUTES_TO_RENDER_HTML, 'visual_director_review', 'screenshot_review'];
const preparedPptWorkspaceCache = new Map();

async function withMockCodexRuntime(testFn) {
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

async function runPptRoutes({ workspaceRoot, deliverableId, routes }) {
  const results = [];
  for (const route of routes) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
      route,
    });
    results.push({ route, result });
  }
  return results;
}

async function getPreparedPptWorkspaceSnapshot({
  profileId = DEFAULT_PPT_CREATIVE_METADATA.profileId,
  topicId = DEFAULT_PPT_CREATIVE_METADATA.topicId,
  deliverableId = DEFAULT_PPT_CREATIVE_METADATA.deliverableId,
  title = DEFAULT_PPT_CREATIVE_METADATA.title,
  goal = DEFAULT_PPT_CREATIVE_METADATA.goal,
  routes,
}) {
  const cacheKey = JSON.stringify({ profileId, topicId, deliverableId, title, goal, routes });
  if (!preparedPptWorkspaceCache.has(cacheKey)) {
    preparedPptWorkspaceCache.set(cacheKey, (async () => {
      const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-prepared-'));
      await createDeliverable({
        workspaceRoot,
        overlay: 'ppt_deck',
        profileId,
        topicId,
        deliverableId,
        title,
        goal,
      });
      const routeResults = await runPptRoutes({
        workspaceRoot,
        deliverableId,
        routes,
      });
      for (const { route, result } of routeResults) {
        assert.equal(result.ok, true, route);
      }
      return {
        workspaceRoot,
        routeArtifacts: routeResults.map(({ route, result }) => ({
          route,
          artifact: readJson(result.artifactFile),
        })),
      };
    })());
  }
  return preparedPptWorkspaceCache.get(cacheKey);
}

async function clonePreparedPptWorkspace({
  clonePrefix,
  profileId,
  topicId,
  deliverableId,
  title,
  goal,
  routes,
}) {
  const prepared = await getPreparedPptWorkspaceSnapshot({
    profileId,
    topicId,
    deliverableId,
    title,
    goal,
    routes,
  });
  const workspaceRoot = path.join(
    mkdtempSync(path.join(os.tmpdir(), clonePrefix || 'redcube-ppt-clone-')),
    'workspace',
  );
  cpSync(prepared.workspaceRoot, workspaceRoot, { recursive: true });
  relocateWorkspaceJsonSidecars(workspaceRoot, prepared.workspaceRoot, workspaceRoot);
  return {
    workspaceRoot,
    routeResults: prepared.routeArtifacts.map(({ route, artifact }) => {
      const relocatedArtifact = relocatePreparedArtifact(artifact, prepared.workspaceRoot, workspaceRoot);
      return {
        route,
        result: {
          ok: true,
          artifact: relocatedArtifact,
          artifactFile: writeRouteStageArtifact(
            workspaceRoot,
            route,
            relocatedArtifact,
            topicId || DEFAULT_PPT_CREATIVE_METADATA.topicId,
            deliverableId || DEFAULT_PPT_CREATIVE_METADATA.deliverableId,
            'prepared-clone',
          ),
        },
      };
    }),
  };
}

function getPptDeliverableSurfacePaths(workspaceRoot, topicId = 'topic-a', deliverableId = 'deck-a') {
  const deliverableDir = path.join(
    workspaceRoot,
    'topics',
    topicId,
    'deliverables',
    deliverableId,
  );
  const viewsDir = path.join(deliverableDir, 'views');
  const operatorDir = path.join(viewsDir, 'operator');
  return {
    deliverableDir,
    viewsDir,
    operatorDir,
    operatorOutlineDir: path.join(operatorDir, '大纲'),
    operatorSlidesDir: path.join(operatorDir, '幻灯片'),
    operatorReferencesDir: path.join(operatorDir, '参考材料'),
    reportsDir: path.join(deliverableDir, 'reports'),
    publishDir: path.join(deliverableDir, 'publish'),
  };
}

export {
  DEFAULT_PPT_CREATIVE_METADATA,
  PPT_ROUTES_TO_RENDER_HTML,
  PPT_ROUTES_TO_SCREENSHOT_REVIEW,
  assert,
  clonePreparedPptWorkspace,
  createDeliverable,
  existsSync,
  getPptDeliverableSurfacePaths,
  mkdirSync,
  mkdtempSync,
  os,
  path,
  readFileSync,
  readJson,
  readRouteStageArtifact,
  runDeliverableRoute,
  test,
  withEnv,
  withMockCodexRuntime,
  writeFileSync,
  writeJson,
  writeRouteStageArtifact,
};
