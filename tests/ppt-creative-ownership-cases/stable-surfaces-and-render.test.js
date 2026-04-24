import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';

import {
  createDeliverable,
  runDeliverableRoute,
} from '../../packages/redcube-gateway/src/index.js';
import {
  getPublicationProjection,
} from '../../packages/redcube-governance/src/index.js';
import {
  startMockCodexCli,
  withEnv,
} from '../helpers/mock-codex-cli.js';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn7ytcAAAAASUVORK5CYII=',
  'base64',
);
const DEFAULT_PPT_CREATIVE_METADATA = {
  profileId: 'lecture_peer',
  topicId: 'topic-a',
  deliverableId: 'deck-a',
  title: 'Med Auto Science 同行讲课',
  goal: '向医学人工智能小同行讲清自动科研为什么成立、怎么做、模块如何复用',
};
const PPT_ROUTES_TO_RENDER_HTML = ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html'];
const PPT_ROUTES_TO_SCREENSHOT_REVIEW = [...PPT_ROUTES_TO_RENDER_HTML, 'visual_director_review', 'screenshot_review'];
const PPT_ROUTES_TO_EXPORT_PPTX = [...PPT_ROUTES_TO_SCREENSHOT_REVIEW, 'export_pptx'];
const preparedPptWorkspaceCache = new Map();

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
          artifactRelativePath: path.relative(workspaceRoot, result.artifactFile),
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
  return {
    workspaceRoot,
    routeResults: prepared.routeArtifacts.map(({ route, artifactRelativePath }) => ({
      route,
      result: {
        ok: true,
        artifactFile: path.join(workspaceRoot, artifactRelativePath),
      },
    })),
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

test('ppt screenshot_review writes immutable capture screenshots and export uses the reviewed capture directory', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-capture-proof-',
      routes: PPT_ROUTES_TO_SCREENSHOT_REVIEW,
    });
    for (const { route, result } of routeResults) {
      assert.equal(result.ok, true, route);
    }

    const screenshotReview = readJson(routeResults.at(-1).result.artifactFile);
    assert.equal(
      screenshotReview.slide_reviews.every((slide) => /\/reports\/screenshots\/capture-[^/]+\/slide-\d+\.png$/.test(slide.screenshot_file)),
      true,
    );
    assert.match(screenshotReview.review_capture?.screenshots_dir || '', /\/reports\/screenshots\/capture-[^/]+$/);

    const exportResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'export_pptx',
    });
    assert.equal(exportResult.ok, true);
    const exportArtifact = readJson(exportResult.artifactFile);
    assert.equal(
      exportArtifact.export_bundle.real_conversion_invocation.command.includes(screenshotReview.review_capture.screenshots_dir),
      true,
    );
  });
});

test('ppt rerunning upstream HTML keeps the last exported publish bundle visible while publication projection falls back to draft', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-stale-export-',
      routes: PPT_ROUTES_TO_EXPORT_PPTX,
    });
    for (const { route, result } of routeResults) {
      assert.equal(result.ok, true, route);
    }

    const surfacePaths = getPptDeliverableSurfacePaths(workspaceRoot);
    const publishPptxFile = path.join(surfacePaths.publishDir, 'deck-a.pptx');
    const archiveDir = path.join(surfacePaths.publishDir, 'archive');
    const readmeFile = path.join(surfacePaths.publishDir, 'README.md');
    assert.equal(existsSync(publishPptxFile), true);

    const rerender = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'render_html',
    });
    assert.equal(rerender.ok, true);

    const projection = getPublicationProjection({
      workspaceRoot,
      topicId: 'topic-a',
    }).publication;
    assert.equal(projection.current, 'draft');
    assert.equal(projection.deliverables['deck-a']?.current, 'draft');
    assert.equal(projection.deliverables['deck-a']?.delivery_state, null);
    assert.equal(existsSync(publishPptxFile), true);
    assert.equal(existsSync(archiveDir), false);
    assert.match(read(readmeFile), /当前导出状态：last_export_available/);
    assert.match(read(readmeFile), /最近一次导出的 .* 仍保留在当前目录/);
    assert.match(read(readmeFile), /可能落后于最新 HTML 与截图质控/);
  });
});

test('ppt rerender keeps a missing canonical publish bundle missing until a new export recreates it', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-export-restore-',
      routes: PPT_ROUTES_TO_EXPORT_PPTX,
    });
    for (const { route, result } of routeResults) {
      assert.equal(result.ok, true, route);
    }

    const surfacePaths = getPptDeliverableSurfacePaths(workspaceRoot);
    const publishPptxFile = path.join(surfacePaths.publishDir, 'deck-a.pptx');
    assert.equal(existsSync(publishPptxFile), true);
    rmSync(publishPptxFile, { force: true });
    assert.equal(existsSync(publishPptxFile), false);

    const rerender = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'render_html',
    });
    assert.equal(rerender.ok, true);
    assert.equal(existsSync(publishPptxFile), false);
  });
});

test('ppt rerender keeps the reviewed HTML stable and writes newer markup into a draft file until screenshot_review catches up', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-reviewed-html-',
      routes: PPT_ROUTES_TO_SCREENSHOT_REVIEW,
    });
    for (const { route, result } of routeResults) {
      assert.equal(result.ok, true, route);
    }

    const surfacePaths = getPptDeliverableSurfacePaths(workspaceRoot);
    const reviewMarkdownFile = path.join(surfacePaths.reportsDir, 'deck-a_视觉质控.md');
    const stableViewHtmlFile = path.join(surfacePaths.viewsDir, 'deck-a.html');
    const draftViewHtmlFile = path.join(surfacePaths.viewsDir, 'deck-a.draft.html');
    const stableViewSlidesFile = path.join(surfacePaths.viewsDir, 'deck-a.slides.json');
    const draftViewSlidesFile = path.join(surfacePaths.viewsDir, 'deck-a.draft.slides.json');
    const reviewedHtmlMtimeMs = statSync(stableViewHtmlFile).mtimeMs;
    const reviewMarkdownMtimeMs = statSync(reviewMarkdownFile).mtimeMs;
    const stableViewHtmlMtimeMs = statSync(stableViewHtmlFile).mtimeMs;
    const stableViewHtmlContent = read(stableViewHtmlFile);
    const stableViewSlidesContent = read(stableViewSlidesFile);

    await new Promise((resolve) => setTimeout(resolve, 25));
    const rerender = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'render_html',
    });
    assert.equal(rerender.ok, true);

    assert.equal(statSync(stableViewHtmlFile).mtimeMs, reviewedHtmlMtimeMs);
    assert.equal(statSync(reviewMarkdownFile).mtimeMs, reviewMarkdownMtimeMs);
    assert.equal(existsSync(draftViewHtmlFile), true);
    assert.equal(statSync(draftViewHtmlFile).mtimeMs >= reviewedHtmlMtimeMs, true);
    assert.equal(statSync(stableViewHtmlFile).mtimeMs, stableViewHtmlMtimeMs);
    assert.equal(read(stableViewHtmlFile), stableViewHtmlContent);
    assert.equal(read(stableViewSlidesFile), stableViewSlidesContent);
    assert.equal(existsSync(draftViewHtmlFile), true);
    assert.equal(existsSync(draftViewSlidesFile), true);

    await new Promise((resolve) => setTimeout(resolve, 25));
    const directorReview = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'visual_director_review',
    });
    assert.equal(directorReview.ok, true);
    const screenshotReview = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'screenshot_review',
    });
    assert.equal(screenshotReview.ok, true);

    assert.equal(statSync(stableViewHtmlFile).mtimeMs > reviewedHtmlMtimeMs, true);
    assert.equal(statSync(reviewMarkdownFile).mtimeMs > reviewMarkdownMtimeMs, true);
    assert.equal(statSync(stableViewHtmlFile).mtimeMs > stableViewHtmlMtimeMs, true);
    assert.equal(existsSync(draftViewHtmlFile), true);
    assert.equal(existsSync(draftViewSlidesFile), true);
  });
});

test('ppt blocked screenshot_review keeps the prior default HTML and preserves the failed candidate as draft', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-blocked-html-',
      routes: PPT_ROUTES_TO_SCREENSHOT_REVIEW,
    });
    for (const { route, result } of routeResults) {
      assert.equal(result.ok, true, route);
    }

    const surfacePaths = getPptDeliverableSurfacePaths(workspaceRoot);
    const reviewedHtmlFile = path.join(surfacePaths.viewsDir, 'deck-a.html');
    const draftHtmlFile = path.join(surfacePaths.viewsDir, 'deck-a.draft.html');
    const reviewMarkdownFile = path.join(surfacePaths.reportsDir, 'deck-a_视觉质控.md');
    const slidesReadmeFile = path.join(surfacePaths.operatorSlidesDir, 'README.md');
    const stableViewHtmlFile = path.join(surfacePaths.viewsDir, 'deck-a.html');
    const draftViewHtmlFile = path.join(surfacePaths.viewsDir, 'deck-a.draft.html');
    const stableViewSlidesFile = path.join(surfacePaths.viewsDir, 'deck-a.slides.json');
    const draftViewSlidesFile = path.join(surfacePaths.viewsDir, 'deck-a.draft.slides.json');
    const qualityGateFile = path.join(
      workspaceRoot,
      'topics',
      'topic-a',
      'deliverables',
      'deck-a',
      'artifacts',
      'quality_gate.json',
    );
    const reviewedHtmlMtimeMs = statSync(reviewedHtmlFile).mtimeMs;
    const reviewedHtmlContent = read(reviewedHtmlFile);
    const reviewMarkdownMtimeMs = statSync(reviewMarkdownFile).mtimeMs;
    const stableViewHtmlMtimeMs = statSync(stableViewHtmlFile).mtimeMs;
    const stableViewHtmlContent = read(stableViewHtmlFile);
    const stableViewSlidesContent = read(stableViewSlidesFile);

    await new Promise((resolve) => setTimeout(resolve, 25));
    const rerender = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'render_html',
    });
    assert.equal(rerender.ok, true);
    assert.equal(existsSync(draftHtmlFile), true);

    const restoreVariant = withEnv({
      REDCUBE_MOCK_PPT_SCREENSHOT_REVIEW_VARIANT: 'force_block',
    });
    try {
      const directorReview = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'visual_director_review',
      });
      assert.equal(directorReview.ok, true);
      const screenshotReview = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'screenshot_review',
      });
      assert.equal(screenshotReview.ok, false);
      const reviewArtifact = readJson(qualityGateFile);
      assert.equal(reviewArtifact.status, 'block');
    } finally {
      restoreVariant();
    }

    assert.equal(statSync(reviewedHtmlFile).mtimeMs, reviewedHtmlMtimeMs);
    assert.equal(read(reviewedHtmlFile), reviewedHtmlContent);
    assert.equal(statSync(reviewMarkdownFile).mtimeMs > reviewMarkdownMtimeMs, true);
    assert.equal(existsSync(draftHtmlFile), true);
    assert.match(read(slidesReadmeFile), /草稿 HTML：deck-a\.draft\.html/);
    assert.match(read(slidesReadmeFile), /最近一次截图质控：block/);
    assert.equal(statSync(stableViewHtmlFile).mtimeMs, stableViewHtmlMtimeMs);
    assert.equal(read(stableViewHtmlFile), stableViewHtmlContent);
    assert.equal(read(stableViewSlidesFile), stableViewSlidesContent);
    assert.equal(existsSync(draftViewHtmlFile), true);
    assert.equal(existsSync(draftViewSlidesFile), true);
  });
});

test('ppt screenshot_review publishes stable root screenshots from the approved capture', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults: routes } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-stable-screenshots-',
      routes: PPT_ROUTES_TO_SCREENSHOT_REVIEW,
    });
    for (const { route, result } of routes) {
      assert.equal(result.ok, true, route);
    }

    const reviewArtifact = readJson(routes.at(-1).result.artifactFile);
    const captureScreenshotsDir = reviewArtifact.review_capture.screenshots_dir;
    const stableScreenshotsDir = path.join(
      workspaceRoot,
      'topics',
      'topic-a',
      'deliverables',
      'deck-a',
      'reports',
      'screenshots',
    );
    const stableSlideFile = path.join(stableScreenshotsDir, 'slide-01.png');
    const captureSlideFile = path.join(captureScreenshotsDir, 'slide-01.png');

    assert.equal(existsSync(stableSlideFile), true);
    assert.equal(existsSync(captureSlideFile), true);
    assert.equal(readFileSync(stableSlideFile).equals(readFileSync(captureSlideFile)), true);
  });
});

test('ppt render_html hydrates review metadata onto slide root when upstream HTML omits those attrs', async () => {
  await withMockHermesUpstream(async () => {
    const restoreVariant = withEnv({
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'missing_root_meta',
    });
    try {
      const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-render-meta-'));
      await createDeliverable({
        workspaceRoot,
        overlay: 'ppt_deck',
        profileId: 'lecture_peer',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        title: 'Med Auto Science 同行讲课',
        goal: '向医学人工智能小同行讲清自动科研为什么成立、怎么做、模块如何复用',
      });

      const results = await runPptRoutes({
        workspaceRoot,
        deliverableId: 'deck-a',
        routes: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html'],
      });
      for (const { route, result } of results) {
        assert.equal(result.ok, true, route);
      }

      const render = readJson(results.at(-1).result.artifactFile);
      assert.equal(
        render.html_bundle.slides.every((slide) => /data-title="/.test(slide.content)),
        true,
      );
      assert.equal(
        render.html_bundle.slides.every((slide) => /data-layout-family="/.test(slide.content)),
        true,
      );
      assert.equal(
        render.html_bundle.slides.every((slide) => /data-speaker-seconds="/.test(slide.content)),
        true,
      );
      assert.equal(
        render.html_bundle.slides.every((slide) => /data-recipe-id="/.test(slide.content)),
        true,
      );
      assert.equal(
        render.html_bundle.slides.every((slide) => /data-template-id="/.test(slide.content)),
        true,
      );
      assert.equal(
        render.html_bundle.slides.every((slide) => /data-peak-page="/.test(slide.content)),
        true,
      );
    } finally {
      restoreVariant();
    }
  });
});

test('ppt render_html fails fast when upstream HTML omits review anchors', async () => {
  await withMockHermesUpstream(async () => {
    const restoreVariant = withEnv({
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'missing_review_anchors',
    });
    try {
      const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-review-anchors-'));
      await createDeliverable({
        workspaceRoot,
        overlay: 'ppt_deck',
        profileId: 'lecture_peer',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        title: 'Med Auto Science 同行讲课',
        goal: '向医学人工智能小同行讲清自动科研为什么成立、怎么做、模块如何复用',
      });

      const routes = await runPptRoutes({
        workspaceRoot,
        deliverableId: 'deck-a',
        routes: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html'],
      });
      for (const { route, result } of routes.slice(0, -1)) {
        assert.equal(result.ok, true, route);
      }
      const renderResult = routes.at(-1).result;
      assert.equal(renderResult.ok, false);
      assert.match(renderResult.run.error.message, /data-qa-block|data-primary-point/i);
    } finally {
      restoreVariant();
    }
  });
});

test('ppt render_html batches upstream slide generation instead of sending the whole deck at once', async () => {
  await withMockHermesUpstream(async () => {
    const restoreVariant = withEnv({
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'require_render_batching',
    });
    try {
      const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-render-batching-'));
      await createDeliverable({
        workspaceRoot,
        overlay: 'ppt_deck',
        profileId: 'lecture_peer',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        title: 'Med Auto Science 同行讲课',
        goal: '向医学人工智能小同行讲清自动科研为什么成立、怎么做、模块如何复用',
      });

      const routes = await runPptRoutes({
        workspaceRoot,
        deliverableId: 'deck-a',
        routes: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html'],
      });
      for (const { route, result } of routes) {
        assert.equal(result.ok, true, route);
      }
    } finally {
      restoreVariant();
    }
  });
});

test('ppt render_html forwards recent slide HTML to later batches to preserve deck continuity', async () => {
  await withMockHermesUpstream(async () => {
    const restoreVariant = withEnv({
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'require_reference_window',
    });
    try {
      const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-render-reference-window-'));
      await createDeliverable({
        workspaceRoot,
        overlay: 'ppt_deck',
        profileId: 'lecture_peer',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        title: 'Med Auto Science 同行讲课',
        goal: '向医学人工智能小同行讲清自动科研为什么成立、怎么做、模块如何复用',
      });

      const routes = await runPptRoutes({
        workspaceRoot,
        deliverableId: 'deck-a',
        routes: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html'],
      });
      for (const { route, result } of routes) {
        assert.equal(result.ok, true, route);
      }
      const renderArtifact = readJson(routes.at(-1).result.artifactFile);
      assert.equal(renderArtifact.render_execution?.reference_window, 3);
    } finally {
      restoreVariant();
    }
  });
});

test('ppt render_html uses single-slide batches for full regeneration to keep cross-page continuity stable', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-render-single-slide-batch-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Med Auto Science 同行讲课',
      goal: '验证 full render_html 会按逐页批次生成，并参考最近页面保持整套一致性',
    });

    const routes = await runPptRoutes({
      workspaceRoot,
      deliverableId: 'deck-a',
      routes: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html'],
    });
    for (const { route, result } of routes) {
      assert.equal(result.ok, true, route);
    }

    const renderArtifact = readJson(routes.at(-1).result.artifactFile);
    assert.equal(renderArtifact.render_execution?.mode, 'full_regeneration');
    assert.equal(renderArtifact.render_execution?.batch_size, 1);
    assert.equal(renderArtifact.render_execution?.batch_count >= 8, true);
  });
});

test('ppt screenshot_review runs slide review batches in parallel once Codex exec is async', async () => {
  await withMockHermesUpstream(async () => {
    const lockDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-screenshot-parallel-'));
    const overlapFile = path.join(lockDir, 'overlap.txt');
    const restoreVariant = withEnv({
      REDCUBE_MOCK_PPT_SCREENSHOT_REVIEW_VARIANT: 'require_parallel_batches',
      REDCUBE_MOCK_PPT_SCREENSHOT_PARALLEL_LOCK_DIR: lockDir,
      REDCUBE_MOCK_PPT_SCREENSHOT_PARALLEL_OVERLAP_FILE: overlapFile,
    });
    try {
      const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-screenshot-parallel-workspace-'));
      await createDeliverable({
        workspaceRoot,
        overlay: 'ppt_deck',
        profileId: 'lecture_peer',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        title: 'Med Auto Science 同行讲课',
        goal: '向医学人工智能小同行讲清自动科研为什么成立、怎么做、模块如何复用',
      });

      const routes = await runPptRoutes({
        workspaceRoot,
        deliverableId: 'deck-a',
        routes: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review'],
      });
      for (const { route, result } of routes) {
        assert.equal(result.ok, true, route);
      }
      assert.equal(existsSync(overlapFile), true);
    } finally {
      restoreVariant();
    }
  });
});

test('ppt fix_html forwards prior director and screenshot review feedback to Codex', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults: routes } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-rerun-context-',
      routes: PPT_ROUTES_TO_RENDER_HTML,
    });
    for (const { route, result } of routes) {
      assert.equal(result.ok, true, route);
    }

    const artifactsDir = path.join(
      workspaceRoot,
      'topics',
      'topic-a',
      'deliverables',
      'deck-a',
      'artifacts',
    );
    writeFileSync(path.join(artifactsDir, 'director_review.json'), JSON.stringify({
      status: 'block',
      visual_director_review: {
        weak_pages: ['S06'],
        review_summary: 'S06 judgement ladder 还不够像真正的判定门，需要增强爬升关系。',
        rewrite_action: 'revise_render_html',
      },
    }, null, 2), 'utf-8');
    writeFileSync(path.join(artifactsDir, 'quality_gate.json'), JSON.stringify({
      status: 'block',
      checks: {
        occlusion_free: false,
      },
      slide_reviews: [
        {
          slide_id: 'S02',
          status: 'block',
          issues: ['occlusion_detected'],
          ai_review: {
            judgement: 'block',
            visual_findings: ['底部说明带压进主体区域，左栏最后一条内容被截断。'],
            recommended_fix: '把底部说明带移出主体容器并释放左栏纵向空间。',
          },
        },
        {
          slide_id: 'S06',
          status: 'block',
          issues: ['occlusion_detected'],
          ai_review: {
            judgement: 'block',
            visual_findings: ['判定门更像说明卡叠放，第二、三道门与右侧标签发生遮挡。'],
            recommended_fix: '重建三阶爬升关系，并给终点框留下独立留白。',
          },
        },
      ],
      ai_review: {
        weak_pages: ['S02', 'S06'],
        review_summary: 'S02 与 S06 存在遮挡，需要回到 render_html 重建布局。',
      },
    }, null, 2), 'utf-8');
    const screenshotsDir = path.join(
      workspaceRoot,
      'topics',
      'topic-a',
      'deliverables',
      'deck-a',
      'reports',
      'screenshots',
    );
    mkdirSync(screenshotsDir, { recursive: true });
    writeFileSync(path.join(screenshotsDir, 'slide-02.png'), TINY_PNG);
    writeFileSync(path.join(screenshotsDir, 'slide-06.png'), TINY_PNG);

    const restoreVariant = withEnv({
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'require_revision_context',
    });
    try {
      const renderResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'fix_html',
      });
      assert.equal(renderResult.ok, true);
    } finally {
      restoreVariant();
    }
  });
});

