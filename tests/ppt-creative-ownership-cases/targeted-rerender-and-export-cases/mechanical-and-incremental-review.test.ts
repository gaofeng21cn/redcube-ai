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

test('ppt fix_html ignores AI-passed mechanical false positives when another slide blocks', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults: initialRoutes } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-rerun-ignore-ai-passed-mechanical-',
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
        review_summary: '导演层通过，本轮只剩一个真实阻断页。',
        rewrite_action: 'none',
      },
    }, null, 2), 'utf-8');
    writeFileSync(path.join(artifactsDir, 'quality_gate.json'), JSON.stringify({
      status: 'block',
      checks: {
        ai_review_passed: false,
        occlusion_free: false,
        block_content_fit_ok: false,
      },
      slide_reviews: [
        {
          slide_id: 'S05',
          status: 'block',
          issues: ['ai_visual_risk'],
          mechanical_issues: ['block_content_overflow_detected'],
          ai_review: {
            judgement: 'block',
            visual_findings: ['S05 存在观众可见的核心短词坏断句。'],
            recommended_fix: '只修 S05，放宽文本容器并保护核心短词。',
          },
        },
        {
          slide_id: 'S06',
          status: 'pass',
          issues: [],
          mechanical_issues: ['occlusion_detected'],
          ai_review: {
            judgement: 'pass',
            visual_findings: ['S06 视觉审阅已通过，机械提示为非阻断提示。'],
            recommended_fix: 'none',
          },
        },
      ],
      ai_review: {
        weak_pages: [],
        review_summary: '当前只有 S05 阻断；S06 是 AI 通过的机械提示页，不应进入重画目标。',
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
      assert.equal(renderArtifact.render_execution?.reused_slide_ids.includes('S06'), true);
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

test('ppt screenshot_review incrementally reviews only freshly fixed slides and reuses prior passed pages', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-incremental-screenshot-review-',
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
    const priorQualityGateFile = path.join(artifactsDir, 'quality_gate.json');
    const priorQualityGate = readJson(priorQualityGateFile);
    const priorS01Screenshot = priorQualityGate.slide_reviews.find((slide) => slide.slide_id === 'S01')?.screenshot_file;
    const blockedQualityGate = {
      ...priorQualityGate,
      status: 'block',
      checks: {
        ...priorQualityGate.checks,
        ai_review_passed: false,
        block_content_fit_ok: false,
      },
      slide_reviews: priorQualityGate.slide_reviews.map((slide) => (
        slide.slide_id === 'S05'
          ? {
              ...slide,
              status: 'block',
              issues: ['ai_visual_risk'],
              mechanical_issues: ['block_content_overflow_detected'],
              ai_review: {
                judgement: 'block',
                visual_findings: ['S05 主面板底部标签贴近下缘，只需要局部修页。'],
                recommended_fix: '只修 S05，放宽底部留白。',
              },
            }
          : slide
      )),
      ai_review: {
        ...priorQualityGate.ai_review,
        weak_pages: ['S05'],
        review_summary: '当前只有 S05 需要 fix_html 后复核。',
      },
    };
    writeFileSync(priorQualityGateFile, JSON.stringify(blockedQualityGate, null, 2), 'utf-8');

    const restoreRenderVariant = withEnv({
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'require_targeted_revision_rerender',
    });
    try {
      const fixResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'fix_html',
      });
      assert.equal(fixResult.ok, true);
      assert.deepEqual(fixResult.artifact?.render_execution?.freshly_rendered_slide_ids, ['S05']);
    } finally {
      restoreRenderVariant();
    }

    const directorReview = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'visual_director_review',
    });
    assert.equal(directorReview.ok, true);

    const restoreScreenshotVariant = withEnv({
      REDCUBE_MOCK_PPT_SCREENSHOT_REVIEW_VARIANT: 'require_page_local_review,require_source_html',
      REDCUBE_MOCK_PPT_SCREENSHOT_EXPECTED_SLIDE_IDS: 'S05',
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
      assert.equal(reviewed.artifact?.review_execution?.review_scope, 'incremental_page_review');
      assert.deepEqual(reviewed.artifact?.review_execution?.reviewed_slide_ids, ['S05']);
      assert.equal(reviewed.artifact?.review_execution?.reused_slide_ids.includes('S01'), true);
      assert.equal(reviewed.artifact?.review_capture?.capture_mode, 'delta');
      assert.equal(reviewed.artifact?.review_capture?.requires_full_materialization_before_export, true);
      const captureManifest = readJson(reviewed.artifact?.review_capture?.manifest_file);
      assert.deepEqual(captureManifest.slides.map((slide) => slide.slide_id), ['S05']);
      assert.equal(existsSync(path.join(reviewed.artifact?.review_capture?.screenshots_dir, 'slide-01.png')), false);
      assert.equal(reviewed.artifact?.slide_reviews.length, priorQualityGate.slide_reviews.length);
      assert.equal(reviewed.artifact?.slide_reviews.find((slide) => slide.slide_id === 'S05')?.ai_review?.judgement, 'pass');
      assert.equal(reviewed.artifact?.slide_reviews.find((slide) => slide.slide_id === 'S01')?.screenshot_file, priorS01Screenshot);
      assert.match(
        reviewed.artifact?.slide_reviews.find((slide) => slide.slide_id === 'S05')?.screenshot_file || '',
        /\/reports\/screenshots\/capture-[^/]+\/slide-05\.png$/,
      );
      assert.equal(reviewed.artifact?.status, 'pass');
    } finally {
      restoreScreenshotVariant();
    }
  });
});

