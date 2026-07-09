// @ts-nocheck
import {
  assert,
  createDeliverable,
  existsSync,
  mkdirSync,
  mkdtempSync,
  os,
  path,
  readFileSync,
  runDeliverableRoute,
  startMockCodexCli,
  test,
  withEnv,
  writeFileSync,
} from './shared.ts';

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
const PPT_ROUTES_TO_FIX_HTML_INPUTS = [
  'storyline',
  'detailed_outline',
  'slide_blueprint',
  'visual_direction',
  'render_html',
  'visual_director_review',
  'screenshot_review',
];

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

async function preparePptWorkspace({
  workspacePrefix = 'redcube-ppt-',
  profileId = DEFAULT_PPT_CREATIVE_METADATA.profileId,
  topicId = DEFAULT_PPT_CREATIVE_METADATA.topicId,
  deliverableId = DEFAULT_PPT_CREATIVE_METADATA.deliverableId,
  title = DEFAULT_PPT_CREATIVE_METADATA.title,
  goal = DEFAULT_PPT_CREATIVE_METADATA.goal,
  routes = PPT_ROUTES_TO_FIX_HTML_INPUTS,
}) {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), workspacePrefix));
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
  return { workspaceRoot };
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

function writeJson(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function pptArtifactsDir(workspaceRoot) {
  return path.join(getPptDeliverableSurfacePaths(workspaceRoot).deliverableDir, 'artifacts');
}

function pptScreenshotsDir(workspaceRoot) {
  return path.join(getPptDeliverableSurfacePaths(workspaceRoot).reportsDir, 'screenshots');
}

function screenshotFile(workspaceRoot, slideNumber) {
  return path.join(pptScreenshotsDir(workspaceRoot), `slide-${slideNumber}.png`);
}

function writeReviewArtifacts(workspaceRoot, { directorReview, qualityGate }) {
  const artifactsDir = pptArtifactsDir(workspaceRoot);
  writeJson(path.join(artifactsDir, 'director_review.json'), directorReview);
  writeJson(path.join(artifactsDir, 'quality_gate.json'), qualityGate);
}

function writeTinyScreenshots(workspaceRoot, slideNumbers) {
  const screenshotsDir = pptScreenshotsDir(workspaceRoot);
  mkdirSync(screenshotsDir, { recursive: true });
  for (const slideNumber of slideNumbers) {
    writeFileSync(screenshotFile(workspaceRoot, slideNumber), TINY_PNG);
  }
}

function writeOperatorBrief(workspaceRoot, brief) {
  const operatorSlidesDir = getPptDeliverableSurfacePaths(workspaceRoot).operatorSlidesDir;
  mkdirSync(operatorSlidesDir, { recursive: true });
  writeFileSync(path.join(operatorSlidesDir, '当前返修要求.md'), [
    '# 当前返修要求',
    '',
    '```json',
    JSON.stringify(brief, null, 2),
    '```',
    '',
  ].join('\n'), 'utf-8');
}

test('ppt fix_html honors operator revision brief slide ids in targeted rerender', async () => {
  await withMockCodexRuntime(async () => {
    const { workspaceRoot } = await preparePptWorkspace({
      workspacePrefix: 'redcube-ppt-rerun-operator-brief-',
    });

    writeReviewArtifacts(workspaceRoot, {
      directorReview: {
        status: 'block',
        visual_director_review: {
          weak_pages: ['S06'],
          review_summary: 'S06 需要继续压缩风险支路。',
          rewrite_action: 'revise_render_html',
        },
      },
      qualityGate: {
        status: 'block',
        checks: {
          ai_review_passed: false,
        },
        slide_reviews: [
          {
            slide_id: 'S06',
            status: 'block',
            issues: ['ai_review_failed'],
            screenshot_file: screenshotFile(workspaceRoot, '06'),
            ai_review: {
              judgement: 'block',
              visual_findings: ['红色支路过长，底部说明太碎。'],
              recommended_fix: '只重建 S06，压缩风险支路并减少底部说明。',
            },
          },
        ],
        ai_review: {
          weak_pages: ['S06'],
          review_summary: '当前只需回到 render_html 修 S06。',
        },
      },
    });
    writeOperatorBrief(workspaceRoot, {
      target_slide_ids: ['S02', 'S05'],
      global_requirements: [
        '整套正文页标题字号一致，避免个别页突然缩小',
        '中文优先，不要不必要地中英混用',
      ],
      slide_feedback: [
        {
          slide_id: 'S02',
          issues: ['右侧 1/2/3/4 节点连线必须退到数字节点下层，不能压在数字前景上。'],
        },
        {
          slide_id: 'S05',
          issues: ['右上卡片文字不能溢出，必要时优先换行和缩短句子。'],
        },
      ],
    });

    const restoreVariant = withEnv({
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'require_targeted_revision_rerender',
    });
    try {
      const rerender = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'fix_html',
      });
      assert.equal(rerender.ok, true);
      const renderArtifact = readJson(rerender.artifactFile);
      assert.equal(renderArtifact.html_bundle.slides.length >= 8, true);
      assert.equal(renderArtifact.html_bundle.slides.some((slide) => slide.slide_id === 'S02'), true);
      assert.equal(renderArtifact.html_bundle.slides.some((slide) => slide.slide_id === 'S05'), true);
      assert.equal(renderArtifact.html_bundle.slides.some((slide) => slide.slide_id === 'S06'), true);
    } finally {
      restoreVariant();
    }
  });
});

test('ppt fix_html scopes targeted rerender to operator-requested slides when only advisory weak pages remain', async () => {
  await withMockCodexRuntime(async () => {
    const { workspaceRoot } = await preparePptWorkspace({
      workspacePrefix: 'redcube-ppt-rerun-operator-only-',
      goal: '验证 operator 定点返修不会把其他 advisory weak pages 一起带入 fix_html',
    });

    writeReviewArtifacts(workspaceRoot, {
      directorReview: {
        status: 'pass',
        visual_director_review: {
          weak_pages: ['S06'],
          review_summary: 'S06 仍是本轮最弱通过页，但不挡导出。',
          rewrite_action: 'revise_render_html',
        },
      },
      qualityGate: {
        status: 'pass',
        checks: {
          ai_review_passed: true,
        },
        slide_reviews: [],
        ai_review: {
          weak_pages: [],
          review_summary: '截图质控已通过；本轮只有讲者定点修页要求。',
        },
      },
    });
    writeOperatorBrief(workspaceRoot, {
      target_slide_ids: ['S02'],
      global_requirements: [
        '本轮只修 S02，不要顺手带上其他已通过页面。',
      ],
      slide_feedback: [
        {
          slide_id: 'S02',
          issues: ['拉开纵向信息分布，让底部也承担结构收束，不要让信息继续挤在中段。'],
        },
      ],
    });

    const restoreVariant = withEnv({
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'require_targeted_revision_rerender,require_scoped_revision_context',
    });
    try {
      const rerender = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'fix_html',
      });
      assert.equal(rerender.ok, true);
      const renderArtifact = readJson(rerender.artifactFile);
      assert.equal(renderArtifact.render_execution?.mode, 'targeted_revision_only');
      assert.deepEqual(renderArtifact.render_execution?.freshly_rendered_slide_ids, ['S02']);
      assert.equal(renderArtifact.render_execution?.reused_slide_ids.includes('S06'), true);
    } finally {
      restoreVariant();
    }
  });
});

test('ppt fix_html runs page-local repair units in parallel for independent targeted slides', async () => {
  await withMockCodexRuntime(async () => {
    const { workspaceRoot } = await preparePptWorkspace({
      workspacePrefix: 'redcube-ppt-rerun-page-local-parallel-',
      goal: '验证 fix_html 每页只携带单页上下文，并发返修互不依赖的问题页。',
    });

    writeReviewArtifacts(workspaceRoot, {
      directorReview: {
        status: 'pass',
        visual_director_review: {
          weak_pages: [],
          review_summary: '导演层通过，本轮只处理讲者点名的两个页面。',
          rewrite_action: 'none',
        },
      },
      qualityGate: {
        status: 'pass',
        checks: {
          ai_review_passed: true,
        },
        slide_reviews: [],
        ai_review: {
          weak_pages: [],
          review_summary: '截图质控已通过；本轮只有讲者定点修页要求。',
        },
      },
    });
    writeOperatorBrief(workspaceRoot, {
      target_slide_ids: ['S02', 'S05'],
      global_requirements: [
        '本轮只修 S02 和 S05，其他页面保持不动。',
      ],
      slide_feedback: [
        {
          slide_id: 'S02',
          issues: ['右侧节点连线压到数字前景，只修本页 HTML。'],
        },
        {
          slide_id: 'S05',
          issues: ['右上卡片文字溢出，只修本页 HTML。'],
        },
      ],
    });

    const lockDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-fix-html-parallel-'));
    const overlapFile = path.join(lockDir, 'overlap.txt');
    const restoreVariant = withEnv({
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'require_targeted_revision_rerender,require_scoped_revision_context,require_page_local_fix_context,require_parallel_batches',
      REDCUBE_MOCK_PPT_RENDER_PARALLEL_LOCK_DIR: lockDir,
      REDCUBE_MOCK_PPT_RENDER_PARALLEL_OVERLAP_FILE: overlapFile,
    });
    try {
      const rerender = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'fix_html',
      });
      assert.equal(rerender.ok, true);
      assert.deepEqual(rerender.artifact?.render_execution?.freshly_rendered_slide_ids, ['S02', 'S05']);
      assert.equal(existsSync(overlapFile), true);
    } finally {
      restoreVariant();
    }
  });
});

test('ppt fix_html still allows targeted revision after visual_direction refresh when review and operator brief are fresh for the current HTML', async () => {
  await withMockCodexRuntime(async () => {
    const { workspaceRoot } = await preparePptWorkspace({
      workspacePrefix: 'redcube-ppt-fix-after-visual-refresh-',
      goal: '验证 visual_direction 更新后，fix_html 仍能针对当前 HTML 做定点返修',
    });

    await new Promise((resolve) => setTimeout(resolve, 25));
    const refreshedVisual = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'visual_direction',
    });
    assert.equal(refreshedVisual.ok, true);

    writeReviewArtifacts(workspaceRoot, {
      directorReview: {
        status: 'pass',
        visual_director_review: {
          weak_pages: ['S08'],
          review_summary: '当前 HTML 只需针对定点页面继续修整。',
          rewrite_action: 'revise_render_html',
        },
      },
      qualityGate: {
        status: 'block',
        checks: {
          ai_review_passed: false,
        },
        slide_reviews: [
          {
            slide_id: 'S04',
            status: 'block',
            issues: ['ai_visual_risk'],
            screenshot_file: screenshotFile(workspaceRoot, '04'),
            ai_review: {
              judgement: 'block',
              visual_findings: ['S04 入口卡与底部长条过近，需要回到 fix_html 上移并恢复底部留白。'],
              recommended_fix: '只修当前 HTML 的 S04，不要触发整套重画。',
            },
          },
          {
            slide_id: 'S05',
            status: 'block',
            issues: ['ai_visual_risk'],
            screenshot_file: screenshotFile(workspaceRoot, '05'),
            ai_review: {
              judgement: 'block',
              visual_findings: ['S05 截图疑似非当前页，但 operator 已人工核实为假阳性。'],
              recommended_fix: '不要重画 S05；等待下一轮 screenshot_review 复核。',
            },
          },
        ],
        ai_review: {
          weak_pages: ['S04', 'S05'],
          review_summary: '当前 HTML 只需做定点返修。',
        },
      },
    });
    writeTinyScreenshots(workspaceRoot, ['04', '05']);
    writeOperatorBrief(workspaceRoot, {
      target_slide_ids: ['S04', 'S09'],
      exclude_slide_ids: ['S05'],
      global_requirements: [
        '只对当前 HTML 做定点返修，不要触发整套重画。',
        'S05 是 operator 已核实的截图审查假阳性，本轮不得重画。',
      ],
      slide_feedback: [
        {
          slide_id: 'S04',
          issues: ['恢复 S04 入口卡和节点的底部安全距。'],
        },
        {
          slide_id: 'S09',
          issues: ['把标题收回单行。'],
        },
      ],
    });

    const restoreVariant = withEnv({
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'require_targeted_revision_rerender',
    });
    try {
      const rerender = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'fix_html',
      });
      assert.equal(rerender.ok, true);
      const renderArtifact = readJson(rerender.artifactFile);
      assert.equal(renderArtifact.render_execution?.mode, 'targeted_revision_only');
      assert.equal(renderArtifact.render_execution?.freshly_rendered_slide_ids.includes('S04'), true);
      assert.equal(renderArtifact.render_execution?.freshly_rendered_slide_ids.includes('S05'), false);
    } finally {
      restoreVariant();
    }
  });
});
