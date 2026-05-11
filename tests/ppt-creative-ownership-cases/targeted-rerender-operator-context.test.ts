// @ts-nocheck
import {
  assert,
  cpSync,
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
const PPT_ROUTES_TO_RENDER_HTML = ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html'];
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

test('ppt fix_html honors operator revision brief slide ids in targeted rerender', async () => {
  await withMockCodexRuntime(async () => {
    const { workspaceRoot, routeResults: initialRoutes } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-rerun-operator-brief-',
      routes: PPT_ROUTES_TO_RENDER_HTML,
    });
    for (const { route, result } of initialRoutes) {
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
        review_summary: 'S06 需要继续压缩风险支路。',
        rewrite_action: 'revise_render_html',
      },
    }, null, 2), 'utf-8');
    writeFileSync(path.join(artifactsDir, 'quality_gate.json'), JSON.stringify({
      status: 'block',
      checks: {
        ai_review_passed: false,
      },
      slide_reviews: [
        {
          slide_id: 'S06',
          status: 'block',
          issues: ['ai_review_failed'],
          screenshot_file: path.join(
            workspaceRoot,
            'topics',
            'topic-a',
            'deliverables',
            'deck-a',
            'reports',
            'screenshots',
            'slide-06.png',
          ),
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
    }, null, 2), 'utf-8');

    const operatorBriefFile = path.join(
      getPptDeliverableSurfacePaths(workspaceRoot).operatorSlidesDir,
      '当前返修要求.md',
    );
    writeFileSync(operatorBriefFile, [
      '# 当前返修要求',
      '',
      '```json',
      JSON.stringify({
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
      }, null, 2),
      '```',
      '',
    ].join('\n'), 'utf-8');

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
    const { workspaceRoot, routeResults: initialRoutes } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-rerun-operator-only-',
      goal: '验证 operator 定点返修不会把其他 advisory weak pages 一起带入 fix_html',
      routes: PPT_ROUTES_TO_RENDER_HTML,
    });
    for (const { route, result } of initialRoutes) {
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
      status: 'pass',
      visual_director_review: {
        weak_pages: ['S06'],
        review_summary: 'S06 仍是本轮最弱通过页，但不挡导出。',
        rewrite_action: 'revise_render_html',
      },
    }, null, 2), 'utf-8');
    writeFileSync(path.join(artifactsDir, 'quality_gate.json'), JSON.stringify({
      status: 'pass',
      checks: {
        ai_review_passed: true,
      },
      slide_reviews: [],
      ai_review: {
        weak_pages: [],
        review_summary: '截图质控已通过；本轮只有讲者定点修页要求。',
      },
    }, null, 2), 'utf-8');

    const operatorBriefFile = path.join(
      getPptDeliverableSurfacePaths(workspaceRoot).operatorSlidesDir,
      '当前返修要求.md',
    );
    writeFileSync(operatorBriefFile, [
      '# 当前返修要求',
      '',
      '```json',
      JSON.stringify({
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
      }, null, 2),
      '```',
      '',
    ].join('\n'), 'utf-8');

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
    const { workspaceRoot, routeResults: initialRoutes } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-rerun-page-local-parallel-',
      goal: '验证 fix_html 每页只携带单页上下文，并发返修互不依赖的问题页。',
      routes: PPT_ROUTES_TO_RENDER_HTML,
    });
    for (const { route, result } of initialRoutes) {
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
      status: 'pass',
      visual_director_review: {
        weak_pages: [],
        review_summary: '导演层通过，本轮只处理讲者点名的两个页面。',
        rewrite_action: 'none',
      },
    }, null, 2), 'utf-8');
    writeFileSync(path.join(artifactsDir, 'quality_gate.json'), JSON.stringify({
      status: 'pass',
      checks: {
        ai_review_passed: true,
      },
      slide_reviews: [],
      ai_review: {
        weak_pages: [],
        review_summary: '截图质控已通过；本轮只有讲者定点修页要求。',
      },
    }, null, 2), 'utf-8');

    const operatorBriefFile = path.join(
      getPptDeliverableSurfacePaths(workspaceRoot).operatorSlidesDir,
      '当前返修要求.md',
    );
    writeFileSync(operatorBriefFile, [
      '# 当前返修要求',
      '',
      '```json',
      JSON.stringify({
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
      }, null, 2),
      '```',
      '',
    ].join('\n'), 'utf-8');

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

test('ppt render_html ignores stale targeted revision context after visual_direction refresh', async () => {
  await withMockCodexRuntime(async () => {
    const { workspaceRoot, routeResults: initialRoutes } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-stale-targeted-context-',
      goal: '验证 visual_direction 更新后，render_html 不会继续吃旧的定点返修上下文',
      routes: PPT_ROUTES_TO_RENDER_HTML,
    });
    for (const { route, result } of initialRoutes) {
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
      status: 'pass',
      visual_director_review: {
        weak_pages: ['S08'],
        review_summary: '旧导演审阅认为 S08 还是最弱通过页。',
        rewrite_action: 'revise_render_html',
      },
    }, null, 2), 'utf-8');
    writeFileSync(path.join(artifactsDir, 'quality_gate.json'), JSON.stringify({
      status: 'pass',
      checks: {
        ai_review_passed: true,
      },
      slide_reviews: [],
      ai_review: {
        weak_pages: [],
        review_summary: '旧截图质控已通过。',
      },
    }, null, 2), 'utf-8');

    const operatorBriefFile = path.join(
      getPptDeliverableSurfacePaths(workspaceRoot).operatorSlidesDir,
      '当前返修要求.md',
    );
    writeFileSync(operatorBriefFile, [
      '# 当前返修要求',
      '',
      '```json',
      JSON.stringify({
        target_slide_ids: ['S04'],
        global_requirements: [
          '本轮只修 S04，不要顺手改动其他页。',
        ],
        slide_feedback: [
          {
            slide_id: 'S04',
            issues: ['旧返修要求：只压 S04 中段正式主链的节点拥挤。'],
          },
        ],
      }, null, 2),
      '```',
      '',
    ].join('\n'), 'utf-8');

    await new Promise((resolve) => setTimeout(resolve, 25));
    const refreshedVisual = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'visual_direction',
    });
    assert.equal(refreshedVisual.ok, true);

    const rerender = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'render_html',
    });
    assert.equal(rerender.ok, true);

    const renderArtifact = readJson(rerender.artifactFile);
    assert.equal(renderArtifact.render_execution?.mode, 'full_regeneration');
    assert.deepEqual(renderArtifact.render_execution?.reused_slide_ids, []);
    assert.equal(renderArtifact.render_execution?.freshly_rendered_slide_ids.length >= 8, true);
    assert.equal(renderArtifact.render_execution?.freshly_rendered_slide_ids.includes('S04'), true);
    assert.equal(renderArtifact.render_execution?.freshly_rendered_slide_ids.includes('S08'), true);
  });
});

test('ppt fix_html still allows targeted revision after visual_direction refresh when review and operator brief are fresh for the current HTML', async () => {
  await withMockCodexRuntime(async () => {
    const { workspaceRoot, routeResults: initialRoutes } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-fix-after-visual-refresh-',
      goal: '验证 visual_direction 更新后，fix_html 仍能针对当前 HTML 做定点返修',
      routes: PPT_ROUTES_TO_RENDER_HTML,
    });
    for (const { route, result } of initialRoutes) {
      assert.equal(result.ok, true, route);
    }

    await new Promise((resolve) => setTimeout(resolve, 25));
    const refreshedVisual = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'visual_direction',
    });
    assert.equal(refreshedVisual.ok, true);

    const artifactsDir = path.join(
      workspaceRoot,
      'topics',
      'topic-a',
      'deliverables',
      'deck-a',
      'artifacts',
    );
    writeFileSync(path.join(artifactsDir, 'director_review.json'), JSON.stringify({
      status: 'pass',
      visual_director_review: {
        weak_pages: ['S08'],
        review_summary: '当前 HTML 只需针对定点页面继续修整。',
        rewrite_action: 'revise_render_html',
      },
    }, null, 2), 'utf-8');
    writeFileSync(path.join(artifactsDir, 'quality_gate.json'), JSON.stringify({
      status: 'block',
      checks: {
        ai_review_passed: false,
      },
      slide_reviews: [
        {
          slide_id: 'S04',
          status: 'block',
          issues: ['ai_visual_risk'],
          screenshot_file: path.join(
            workspaceRoot,
            'topics',
            'topic-a',
            'deliverables',
            'deck-a',
            'reports',
            'screenshots',
            'slide-04.png',
          ),
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
          screenshot_file: path.join(
            workspaceRoot,
            'topics',
            'topic-a',
            'deliverables',
            'deck-a',
            'reports',
            'screenshots',
            'slide-05.png',
          ),
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
    writeFileSync(path.join(screenshotsDir, 'slide-04.png'), TINY_PNG);
    writeFileSync(path.join(screenshotsDir, 'slide-05.png'), TINY_PNG);

    const operatorBriefFile = path.join(
      getPptDeliverableSurfacePaths(workspaceRoot).operatorSlidesDir,
      '当前返修要求.md',
    );
    writeFileSync(operatorBriefFile, [
      '# 当前返修要求',
      '',
      '```json',
      JSON.stringify({
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
      }, null, 2),
      '```',
      '',
    ].join('\n'), 'utf-8');

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

test('ppt fix_html forwards prior director and screenshot review feedback to Codex', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-rerun-context-'));
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
      checks: { occlusion_free: false },
      slide_reviews: [
        {
          slide_id: 'S02',
          status: 'block',
          issues: ['occlusion_detected'],
          metrics: {
            block_content_failures: [
              {
                block_id: 'ring-overview',
                overflow_reason: 'surface_text_targets_overlap',
                overlap_width: 168,
                overlap_height: 58,
              },
            ],
          },
          ai_review: {
            judgement: 'block',
            visual_findings: ['底部说明带压进主体区域，左栏最后一条内容被截断。'],
            recommended_fix: '把底部说明带移出主体容器并释放左栏纵向空间。',
          },
        },
        {
          slide_id: 'S06',
          status: 'block',
          issues: ['occlusion_detected', 'title_typography_inconsistent'],
          checks: {
            title_typography_ok: false,
          },
          metrics: {
            title_font_size: 30,
            title_font_reference: 44,
            title_font_delta: 14,
          },
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
    const screenshotsDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', 'deck-a', 'reports', 'screenshots');
    mkdirSync(screenshotsDir, { recursive: true });
    writeFileSync(path.join(screenshotsDir, 'slide-02.png'), TINY_PNG);
    writeFileSync(path.join(screenshotsDir, 'slide-06.png'), TINY_PNG);

    const operatorSlidesDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', 'deck-a', 'views', 'operator', '幻灯片');
    mkdirSync(operatorSlidesDir, { recursive: true });
    await new Promise((resolve) => setTimeout(resolve, 25));
    writeFileSync(path.join(operatorSlidesDir, '当前返修要求.md'), [
      '# 当前返修要求',
      '',
      '```json',
      JSON.stringify({
        target_slide_ids: ['S02'],
        global_requirements: ['本轮只修截图阻断页，不要顺手重画已通过页面。'],
        slide_feedback: [
          {
            slide_id: 'S02',
            issues: ['左栏底部说明带压进主体区域，必须释放纵向空间。'],
            avoid: ['不要新增说明卡片。'],
          },
        ],
      }, null, 2),
      '```',
      '',
    ].join('\n'), 'utf-8');

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
      const renderArtifact = readJson(renderResult.artifactFile);
      assert.deepEqual(renderArtifact.revision_context?.operator_revision_brief?.target_slide_ids, ['S02']);
      const s02Focus = renderArtifact.html_bundle.slides.find((slide) => slide.slide_id === 'S02')?.revision_focus;
      assert.equal(s02Focus?.operator_requested_revision, true);
      assert.match(s02Focus?.recommended_fix || '', /释放纵向空间/);
      assert.match(s02Focus?.recommended_fix || '', /内部元素重叠 168x58px/);
      const s06Focus = renderArtifact.html_bundle.slides.find((slide) => slide.slide_id === 'S06')?.revision_focus;
      assert.match(s06Focus?.recommended_fix || '', /主标题字号 30px/);
      assert.match(s06Focus?.recommended_fix || '', /参考档位 44px/);
      assert.match(s06Focus?.recommended_fix || '', /低于参考 14px/);
    } finally {
      restoreVariant();
    }
  });
});
