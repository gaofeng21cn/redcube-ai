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

test('ppt fix_html only regenerates blocked slides and preserves previously passed slides', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults: initialRoutes } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-rerun-targeted-',
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

    const restoreVariant = withEnv({
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'require_targeted_revision_rerender,require_mechanical_feedback',
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
      assert.equal(renderArtifact.html_bundle.slides.some((slide) => slide.slide_id === 'S01'), true);
      assert.equal(renderArtifact.html_bundle.slides.some((slide) => slide.slide_id === 'S06'), true);
      assert.equal(renderArtifact.render_execution?.mode, 'targeted_revision_only');
      assert.deepEqual(renderArtifact.render_execution?.freshly_rendered_slide_ids, ['S06']);
      assert.equal(renderArtifact.render_execution?.reused_slide_ids.includes('S01'), true);
      assert.deepEqual(renderArtifact.targeted_rerun, {
        default_route: 'fix_html',
        scope: 'slide',
        target_slide_ids: ['S06'],
        reused_slide_ids: renderArtifact.render_execution.reused_slide_ids,
        source_review_stages: ['visual_director_review', 'screenshot_review'],
      });
    } finally {
      restoreVariant();
    }
  });
});

test('ppt render_html route cache invalidates when operator revision brief changes', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-render-operator-revision-cache-',
      routes: PPT_ROUTES_TO_RENDER_HTML,
    });
    for (const { route, result } of routeResults) {
      assert.equal(result.ok, true, route);
    }

    const refreshedRerender = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'render_html',
    });
    assert.equal(refreshedRerender.ok, true);

    const cachedRerender = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'render_html',
    });
    assert.equal(cachedRerender.ok, true);
    assert.equal(cachedRerender.summary.cache_status, 'hit');

    const paths = getPptDeliverableSurfacePaths(workspaceRoot);
    mkdirSync(paths.operatorSlidesDir, { recursive: true });
    await new Promise((resolve) => setTimeout(resolve, 25));
    writeFileSync(path.join(paths.operatorSlidesDir, '当前返修要求.md'), [
      '# 当前返修要求',
      '',
      '```json',
      JSON.stringify({
        target_slide_ids: ['S06'],
        global_requirements: ['只重画 S06，其他页面复用。'],
        slide_feedback: [
          {
            slide_id: 'S06',
            issues: ['底部说明太重。'],
            avoid: ['不要继续加卡片。'],
          },
        ],
      }, null, 2),
      '```',
      '',
    ].join('\n'), 'utf-8');

    const revisedRerender = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'render_html',
    });
    assert.equal(revisedRerender.ok, true);
    assert.equal(revisedRerender.summary.cache_status, 'miss');
    assert.equal(revisedRerender.artifact?.render_execution?.mode, 'targeted_revision_only');
    assert.deepEqual(revisedRerender.artifact?.render_execution?.freshly_rendered_slide_ids, ['S06']);
  });
});

test('ppt visual review route cache invalidates after fix_html updates current HTML', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-review-cache-after-fix-',
      routes: PPT_ROUTES_TO_SCREENSHOT_REVIEW,
    });
    for (const { route, result } of routeResults) {
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
    await new Promise((resolve) => setTimeout(resolve, 25));
    writeFileSync(path.join(artifactsDir, 'quality_gate.json'), JSON.stringify({
      status: 'block',
      checks: {
        ai_review_passed: false,
        block_content_fit_ok: false,
      },
      slide_reviews: [
        {
          slide_id: 'S06',
          status: 'block',
          issues: ['ai_review_failed'],
          mechanical_issues: ['block_content_overflow_detected'],
          ai_review: {
            judgement: 'block',
            visual_findings: ['底部说明太重，需要定点回修。'],
            recommended_fix: '只重建 S06，压缩底部说明并恢复留白。',
          },
        },
      ],
      ai_review: {
        weak_pages: ['S06'],
        review_summary: '当前只需回到 fix_html 修 S06。',
      },
    }, null, 2), 'utf-8');

    const restoreVariant = withEnv({
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'require_targeted_revision_rerender,require_mechanical_feedback',
    });
    try {
      const fixed = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'fix_html',
      });
      assert.equal(fixed.ok, true);
      assert.equal(fixed.artifact?.render_execution?.mode, 'targeted_revision_only');
      assert.deepEqual(fixed.artifact?.render_execution?.freshly_rendered_slide_ids, ['S06']);

      const directorReview = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'visual_director_review',
      });
      assert.equal(directorReview.ok, true);
      assert.equal(directorReview.summary.cache_status, 'miss');

      const screenshotReview = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'screenshot_review',
      });
      assert.equal(screenshotReview.ok, true);
      assert.equal(screenshotReview.summary.cache_status, 'miss');
    } finally {
      restoreVariant();
    }
  });
});

test('ppt fix_html escalates when the same slide is blocked again after a prior fix_html', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-repeat-block-escalation-',
      routes: PPT_ROUTES_TO_SCREENSHOT_REVIEW,
    });
    for (const { route, result } of routeResults) {
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
    const blockedGate = {
      status: 'block',
      checks: {
        ai_review_passed: false,
        block_content_fit_ok: false,
      },
      slide_reviews: [
        {
          slide_id: 'S06',
          status: 'block',
          issues: ['ai_review_failed'],
          mechanical_issues: ['block_content_overflow_detected'],
          ai_review: {
            judgement: 'block',
            visual_findings: ['同一页仍然拥挤，微调不足。'],
            recommended_fix: '必须删减底部说明并重排结构。',
          },
        },
      ],
      ai_review: {
        weak_pages: ['S06'],
        review_summary: 'S06 仍然阻塞。',
      },
    };
    await new Promise((resolve) => setTimeout(resolve, 25));
    writeFileSync(path.join(artifactsDir, 'quality_gate.json'), JSON.stringify(blockedGate, null, 2), 'utf-8');

    const firstRestoreVariant = withEnv({
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'require_targeted_revision_rerender,require_mechanical_feedback',
    });
    try {
      const firstFix = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'fix_html',
      });
      assert.equal(firstFix.ok, true);
      assert.deepEqual(firstFix.artifact?.render_execution?.freshly_rendered_slide_ids, ['S06']);
    } finally {
      firstRestoreVariant();
    }

    await new Promise((resolve) => setTimeout(resolve, 25));
    writeFileSync(path.join(artifactsDir, 'quality_gate.json'), JSON.stringify({
      ...blockedGate,
      ai_review: {
        weak_pages: ['S06'],
        review_summary: 'S06 在上一轮 fix_html 后仍然阻塞。',
      },
    }, null, 2), 'utf-8');

    const secondRestoreVariant = withEnv({
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'require_targeted_revision_rerender,require_mechanical_feedback,require_repeat_block_escalation',
    });
    try {
      const secondFix = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'fix_html',
      });
      assert.equal(secondFix.ok, true);
      assert.equal(secondFix.summary.cache_status, 'miss');
      assert.deepEqual(secondFix.artifact?.render_execution?.freshly_rendered_slide_ids, ['S06']);
    } finally {
      secondRestoreVariant();
    }
  });
});

test('ppt screenshot_review accepts pass_with_minor_watch as advisory pass', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-pass-with-minor-watch-',
      routes: [...PPT_ROUTES_TO_RENDER_HTML, 'visual_director_review'],
    });
    for (const { route, result } of routeResults) {
      assert.equal(result.ok, true, route);
    }

    const restoreVariant = withEnv({
      REDCUBE_MOCK_PPT_SCREENSHOT_REVIEW_VARIANT: 'pass_with_minor_watch',
    });
    try {
      const reviewed = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'screenshot_review',
      });
      assert.equal(reviewed.ok, true);
      assert.equal(reviewed.artifact?.status, 'pass');
      assert.equal(reviewed.artifact?.slide_reviews.every((slide) => slide.ai_review?.judgement === 'pass'), true);
    } finally {
      restoreVariant();
    }
  });
});

test('ppt fix_html targets slides blocked only by mechanical screenshot checks', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults: initialRoutes } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-rerun-mechanical-only-',
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
        review_summary: '导演层通过，本轮只剩机械层的遮挡与密度问题。',
        rewrite_action: 'none',
      },
    }, null, 2), 'utf-8');
    writeFileSync(path.join(artifactsDir, 'quality_gate.json'), JSON.stringify({
      status: 'block',
      checks: {
        ai_review_passed: true,
        occlusion_free: false,
        visual_density_ok: false,
      },
      slide_reviews: [
        {
          slide_id: 'S05',
          status: 'pass',
          issues: [],
          mechanical_issues: ['occlusion_detected', 'visual_density_out_of_range'],
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
            judgement: 'pass',
            visual_findings: ['内容方向正确，但当前截图存在遮挡与密度偏高问题。'],
            recommended_fix: '压缩卡片正文并恢复组件间留白。',
          },
        },
      ],
      ai_review: {
        weak_pages: [],
        review_summary: '当前只需要对机械失败页做定点返修。',
      },
    }, null, 2), 'utf-8');

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
      assert.deepEqual(renderArtifact.render_execution?.freshly_rendered_slide_ids, ['S05']);
      assert.equal(renderArtifact.render_execution?.reused_slide_ids.includes('S01'), true);
    } finally {
      restoreVariant();
    }
  });
});

test('ppt fix_html prioritizes screenshot-blocked slides over advisory weak pages', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults: initialRoutes } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-rerun-blocked-over-weak-',
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
        review_summary: 'S08 还是本批最弱的通过页，但不挡导出。',
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
          slide_id: 'S05',
          status: 'block',
          issues: ['ai_visual_risk'],
          ai_review: {
            judgement: 'block',
            visual_findings: ['S05 标题过重，挡住门控阶梯的首眼主峰。'],
            recommended_fix: '只修 S05 标题，不要带着 advisory weak page 一起重画。',
          },
        },
      ],
      ai_review: {
        weak_pages: ['S05'],
        review_summary: '当前只有 S05 挡导出，S08 只是弱通过页。',
      },
    }, null, 2), 'utf-8');

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
      assert.deepEqual(renderArtifact.render_execution?.freshly_rendered_slide_ids, ['S05']);
      assert.equal(renderArtifact.render_execution?.reused_slide_ids.includes('S08'), true);
    } finally {
      restoreVariant();
    }
  });
});

test('ppt fix_html honors operator revision brief slide ids in targeted rerender', async () => {
  await withMockHermesUpstream(async () => {
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
  await withMockHermesUpstream(async () => {
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

test('ppt render_html ignores stale targeted revision context after visual_direction refresh', async () => {
  await withMockHermesUpstream(async () => {
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
  await withMockHermesUpstream(async () => {
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

test('ppt screenshot_review forwards current slide source_html alongside screenshots', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-screenshot-source-html-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Med Auto Science 同行讲课',
      goal: '验证截图质控会同时参考当前页 HTML 源码',
    });

    const restoreVariant = withEnv({
      REDCUBE_MOCK_PPT_SCREENSHOT_REVIEW_VARIANT: 'require_source_html',
    });
    try {
      const routes = ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review'];
      for (const route of routes) {
        const result = await runDeliverableRoute({
          workspaceRoot,
          overlay: 'ppt_deck',
          topicId: 'topic-a',
          deliverableId: 'deck-a',
          route,
        });
        assert.equal(result.ok, true, route);
      }
    } finally {
      restoreVariant();
    }
  });
});

test('ppt screenshot_review pass refreshes latest-capture pointer and export_pptx records the stable reviewed HTML', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-latest-capture-',
      goal: '验证 PPT 通过版截图指针和导出 source_html 都锚定稳定表面',
      routes: PPT_ROUTES_TO_SCREENSHOT_REVIEW,
    });
    for (const { route, result } of routeResults) {
      assert.equal(result.ok, true, route);
    }

    const deliverableDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', 'deck-a');
    const qualityGate = readJson(path.join(deliverableDir, 'artifacts', 'quality_gate.json'));
    const latestCaptureFile = path.join(deliverableDir, 'reports', 'screenshots', 'latest-capture.json');
    const stableHtmlFile = path.join(deliverableDir, 'views', 'deck-a.html');

    assert.equal(existsSync(latestCaptureFile), true);
    assert.deepEqual(readJson(latestCaptureFile), {
      capture_id: qualityGate.review_capture.capture_id,
      review_markdown_file: qualityGate.review_capture.review_markdown_file,
      slide_count: qualityGate.slide_reviews.length,
    });

    const exportResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'export_pptx',
    });
    assert.equal(exportResult.ok, true);

    const exportArtifact = readJson(path.join(deliverableDir, 'artifacts', 'publish_bundle.json'));
    assert.equal(exportArtifact.export_bundle.source_html, stableHtmlFile);
  });
});
