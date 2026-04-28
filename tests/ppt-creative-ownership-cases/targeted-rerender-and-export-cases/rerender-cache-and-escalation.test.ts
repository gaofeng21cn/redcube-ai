// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import {
  createDeliverable,
  runDeliverableRoute,
} from '@redcube/gateway';
import {
  startMockCodexCli,
  withEnv,
} from '../../helpers/mock-codex-cli.ts';

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

