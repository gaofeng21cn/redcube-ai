// @ts-nocheck
import {
  assert,
  cpSync,
  createDeliverable,
  existsSync,
  getPublicationProjection,
  mkdirSync,
  mkdtempSync,
  os,
  path,
  readFileSync,
  readdirSync,
  rmSync,
  runDeliverableRoute,
  spawnSync,
  startMockCodexCli,
  statSync,
  test,
  withEnv,
  writeFileSync,
} from './shared.ts';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
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

function rewriteRenderSlideContent(renderArtifact, slideId, rewriteContent) {
  return {
    ...renderArtifact,
    html_bundle: {
      ...renderArtifact.html_bundle,
      slides: renderArtifact.html_bundle.slides.map((slide) => (
        slide.slide_id === slideId ? { ...slide, content: rewriteContent(slide.content) } : slide
      )),
    },
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
    assert.ok(exportArtifact.export_bundle.final_delivery.pptx_file.endsWith('Med Auto Science 同行讲课.pptx'));
    assert.ok(exportArtifact.export_bundle.final_delivery.pdf_file.endsWith('Med Auto Science 同行讲课.pdf'));
    assert.equal(existsSync(exportArtifact.export_bundle.final_delivery.pptx_file), true);
    assert.equal(existsSync(exportArtifact.export_bundle.final_delivery.pdf_file), true);
  });
});

test('ppt rerunning upstream HTML retires the stale publish bundle while publication projection falls back to draft', async () => {
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
    const publishPdfFile = path.join(surfacePaths.publishDir, 'deck-a.pdf');
    const archiveDir = path.join(surfacePaths.publishDir, 'archive');
    const readmeFile = path.join(surfacePaths.publishDir, 'README.md');
    assert.equal(existsSync(publishPptxFile), true);
    assert.equal(existsSync(publishPdfFile), true);

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
    assert.equal(existsSync(publishPptxFile), false);
    assert.equal(existsSync(publishPdfFile), false);
    assert.equal(existsSync(archiveDir), true);
    const retiredDirs = readdirSync(archiveDir, { withFileTypes: true }).filter((entry) => entry.isDirectory());
    assert.equal(retiredDirs.length > 0, true);
    const latestRetiredDir = path.join(archiveDir, retiredDirs.at(-1).name);
    assert.equal(existsSync(path.join(latestRetiredDir, 'deck-a.pptx')), true);
    assert.equal(existsSync(path.join(latestRetiredDir, 'deck-a.pdf')), true);
    assert.match(read(readmeFile), /当前导出状态：no_current_export/);
    assert.match(read(readmeFile), /退役导出归档：archive\//);
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

test('ppt visual_director_review blocks audience-facing operator metadata leaked into rendered HTML', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-director-metadata-leak-',
      routes: PPT_ROUTES_TO_RENDER_HTML,
    });
    for (const { route, result } of routeResults) {
      assert.equal(result.ok, true, route);
    }

    const renderResult = routeResults.at(-1).result;
    const renderArtifact = readJson(renderResult.artifactFile);
    const poisonedRenderArtifact = rewriteRenderSlideContent(renderArtifact, 'S02', (content) => content.replace(
      '</section>',
      `<aside data-qa-block="operator-leak" style="font-size:22px;color:#0F172A;">
        当前节点：2/8，下一步进入 visual_director_review。
        制作目标：按 prompt 输出 operator internal review。
      </aside></section>`,
    ));
    writeFileSync(renderResult.artifactFile, JSON.stringify(poisonedRenderArtifact, null, 2), 'utf-8');

    const directorReview = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'visual_director_review',
    });
    assert.equal(directorReview.ok, false);
    const directorArtifact = readJson(path.join(getPptDeliverableSurfacePaths(workspaceRoot).deliverableDir, 'artifacts', 'director_review.json'));
    assert.equal(directorArtifact.status, 'block');
    assert.equal(directorArtifact.visual_director_review?.anti_template_ok, false);
    assert.equal(directorArtifact.review_state_patch?.current_status, 'blocked_for_revision');
    assert.match(directorArtifact.visual_director_review?.review_summary || '', /metadata|operator|制作目标|当前节点/);
  });
});

test('ppt visual_director_review allows public Prompt Engineering concept copy', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-director-public-prompt-copy-',
      routes: PPT_ROUTES_TO_RENDER_HTML,
    });
    for (const { route, result } of routeResults) {
      assert.equal(result.ok, true, route);
    }

    const renderResult = routeResults.at(-1).result;
    const renderArtifact = readJson(renderResult.artifactFile);
    const publicPromptRenderArtifact = rewriteRenderSlideContent(renderArtifact, 'S02', (content) => content.replace(
      '</section>',
      `<aside data-qa-block="public-ai-concept" style="font-size:22px;color:#0F172A;">
        Prompt Engineering 是面向听众解释 AI 能力边界的公开概念。
      </aside></section>`,
    ));
    writeFileSync(renderResult.artifactFile, JSON.stringify(publicPromptRenderArtifact, null, 2), 'utf-8');

    const directorReview = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'visual_director_review',
    });
    assert.equal(directorReview.ok, true);
  });
});

test('ppt visual_director_review blocks consecutive homogeneous dense white-card slides', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-director-card-density-',
      routes: PPT_ROUTES_TO_RENDER_HTML,
    });
    for (const { route, result } of routeResults) {
      assert.equal(result.ok, true, route);
    }

    const renderResult = routeResults.at(-1).result;
    const renderArtifact = readJson(renderResult.artifactFile);
    const denseWhitePanel = (slideId) => `
      <div data-slide-root="true" data-slide-id="${slideId}" style="position:relative;width:1152px;height:648px;background:#F8FAFC;padding:48px;">
        <header data-qa-block="header"><h2>同构白卡页面</h2></header>
        <section data-qa-block="dense-card-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
          <article data-qa-block="card-1" style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:18px;padding:20px;">白色父面板一</article>
          <article data-qa-block="card-2" style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:18px;padding:20px;">白色父面板二</article>
          <article data-qa-block="card-3" style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:18px;padding:20px;">白色父面板三</article>
          <article data-qa-block="card-4" style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:18px;padding:20px;">白色父面板四</article>
        </section>
        <footer data-qa-block="footer">${slideId}</footer>
      </div>
    `;
    const denseSlideIds = new Set(['S02', 'S03', 'S04', 'S05']);
    const poisonedRenderArtifact = {
      ...renderArtifact,
      html_bundle: {
        ...renderArtifact.html_bundle,
        slides: renderArtifact.html_bundle.slides.map((slide) => (
          denseSlideIds.has(slide.slide_id)
            ? { ...slide, layout_family: 'dense_white_card_grid', content: denseWhitePanel(slide.slide_id) }
            : slide
        )),
      },
    };
    writeFileSync(renderResult.artifactFile, JSON.stringify(poisonedRenderArtifact, null, 2), 'utf-8');

    const directorReview = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'visual_director_review',
    });
    assert.equal(directorReview.ok, false);
    const directorArtifact = readJson(path.join(getPptDeliverableSurfacePaths(workspaceRoot).deliverableDir, 'artifacts', 'director_review.json'));
    assert.equal(directorArtifact.status, 'block');
    assert.equal(directorArtifact.visual_director_review?.anti_template_ok, false);
    assert.equal(directorArtifact.review_state_patch?.current_status, 'blocked_for_revision');
    assert.match(directorArtifact.visual_director_review?.review_summary || '', /homogeneous|white-card|同构|白色/);
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

test('ppt render_html forwards recent slide style metadata to later batches to preserve deck continuity', async () => {
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

test('ppt render_html uses section batches for full regeneration while keeping cross-page continuity stable', async () => {
  await withMockHermesUpstream(async () => {
    const restoreVariant = withEnv({
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'require_section_batches',
    });
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-render-section-batch-'));
    try {
      await createDeliverable({
        workspaceRoot,
        overlay: 'ppt_deck',
        profileId: 'lecture_peer',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        title: 'Med Auto Science 同行讲课',
        goal: '验证 full render_html 会按章节批次生成，并参考最近章节页面保持整套一致性',
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
      assert.equal(renderArtifact.render_execution?.batch_size, 6);
      assert.equal(renderArtifact.render_execution?.batch_count, 3);
      assert.equal(
        renderArtifact.render_execution?.codex_batch_runtime?.durable_cache?.stage_cache_status
          ?.every((stage) => stage.cache_status === 'fresh'),
        true,
      );
    } finally {
      restoreVariant();
    }
  });
});

test('ppt render_html persists durable batch artifacts and resumes from completed batches', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-render-durable-batches-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Med Auto Science 同行讲课',
      goal: '验证 render_html 中断后能复用已完成批次继续生成',
    });

    const setupRoutes = await runPptRoutes({
      workspaceRoot,
      deliverableId: 'deck-a',
      routes: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction'],
    });
    for (const { route, result } of setupRoutes) {
      assert.equal(result.ok, true, route);
    }

    const restoreFailAfterFirst = withEnv({
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'fail_after_first_render_batch',
    });
    try {
      const interrupted = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'render_html',
      });
      assert.equal(interrupted.ok, false);
      assert.match(interrupted.run.error.message, /forced interruption/);
    } finally {
      restoreFailAfterFirst();
    }

    const batchRoot = path.join(
      workspaceRoot,
      'topics',
      'topic-a',
      'deliverables',
      'deck-a',
      'artifacts',
      'render_batches',
      'render_html',
    );
    const batchFilesAfterInterruption = readdirSync(batchRoot)
      .filter((entry) => /^render_html_batch_\d{2}_S\d/.test(entry) && entry.endsWith('.json'))
      .sort();
    assert.deepEqual(batchFilesAfterInterruption, ['render_html_batch_01_S01_S02_S03.json']);
    const firstBatchStageId = batchFilesAfterInterruption[0].replace(/\.json$/, '');
    const firstBatchFile = path.join(batchRoot, `${firstBatchStageId}.json`);
    const firstSlideFile = path.join(batchRoot, firstBatchStageId, 'S01.html');
    assert.equal(existsSync(firstBatchFile), true);
    assert.equal(existsSync(firstSlideFile), true);
    const firstBatchMtimeMs = statSync(firstBatchFile).mtimeMs;

    await new Promise((resolve) => setTimeout(resolve, 25));
    const resumed = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'render_html',
    });
    assert.equal(resumed.ok, true);
    const renderArtifact = readJson(resumed.artifactFile);
    assert.equal(renderArtifact.render_execution?.codex_batch_runtime?.durable_cache?.reused_batch_count >= 1, true);
    assert.equal(renderArtifact.render_execution?.codex_batch_runtime?.durable_cache?.generated_batch_count >= 1, true);
    assert.equal(statSync(firstBatchFile).mtimeMs, firstBatchMtimeMs);
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
