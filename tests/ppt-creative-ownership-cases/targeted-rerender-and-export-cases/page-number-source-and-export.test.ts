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

test('ppt screenshot_review backfills page number consistency for legacy incremental prior reviews', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-incremental-legacy-page-number-review-',
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
    const blockedQualityGate = {
      ...priorQualityGate,
      status: 'block',
      checks: {
        ...priorQualityGate.checks,
        ai_review_passed: false,
        block_content_fit_ok: false,
      },
      slide_reviews: priorQualityGate.slide_reviews.map((slide) => {
        const legacySlide = {
          ...slide,
          checks: {
            ...slide.checks,
          },
          metrics: {
            ...slide.metrics,
          },
        };
        delete legacySlide.checks.page_number_consistency_ok;
        delete legacySlide.metrics.page_number_audit;
        if (slide.slide_id !== 'S05') return legacySlide;
        return {
          ...legacySlide,
          status: 'block',
          issues: ['ai_visual_risk'],
          mechanical_issues: ['block_content_overflow_detected'],
          ai_review: {
            judgement: 'block',
            visual_findings: ['S05 主面板底部标签贴近下缘，只需要局部修页。'],
            recommended_fix: '只修 S05，放宽底部留白。',
          },
        };
      }),
      ai_review: {
        ...priorQualityGate.ai_review,
        weak_pages: ['S05'],
        review_summary: '当前只有 S05 需要 fix_html 后复核。',
      },
    };
    delete blockedQualityGate.checks.page_number_consistency_ok;
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
      assert.equal(reviewed.artifact?.checks?.page_number_consistency_ok, true);
      assert.equal(
        reviewed.artifact?.slide_reviews.every((slide) => slide.checks?.page_number_consistency_ok === true),
        true,
      );
    } finally {
      restoreScreenshotVariant();
    }
  });
});

test('ppt visual_director_review incrementally reviews only freshly fixed slides and reuses prior director result', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-incremental-director-review-',
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
    writeFileSync(priorQualityGateFile, JSON.stringify({
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
    }, null, 2), 'utf-8');

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

    const restoreDirectorVariant = withEnv({
      REDCUBE_MOCK_PPT_DIRECTOR_REVIEW_VARIANT: 'require_page_local_delta_review',
      REDCUBE_MOCK_PPT_DIRECTOR_EXPECTED_SLIDE_IDS: 'S05',
    });
    try {
      const reviewed = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'visual_director_review',
      });
      assert.equal(reviewed.ok, true);
      assert.equal(reviewed.artifact?.review_execution?.review_scope, 'incremental_page_review');
      assert.deepEqual(reviewed.artifact?.review_execution?.reviewed_slide_ids, ['S05']);
      assert.equal(reviewed.artifact?.review_execution?.reused_slide_ids.includes('S01'), true);
      assert.equal(reviewed.artifact?.status, 'pass');
    } finally {
      restoreDirectorVariant();
    }
  });
});

test('ppt screenshot_review recalculates page number consistency after incremental page fixes', async () => {
  await withMockHermesUpstream(async () => {
    const { workspaceRoot, routeResults } = await clonePreparedPptWorkspace({
      clonePrefix: 'redcube-ppt-incremental-page-number-review-',
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
                visual_findings: ['S05 只需要局部修页。'],
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
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'require_targeted_revision_rerender,drift_page_number_s05',
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
      assert.equal(fixResult.summary.fix_html_escalation_status, 'escalation_unavailable');
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
      assert.equal(reviewed.ok, false);
      const qualityGate = readJson(priorQualityGateFile);
      assert.equal(qualityGate.review_execution?.review_scope, 'incremental_page_review');
      assert.deepEqual(qualityGate.review_execution?.reviewed_slide_ids, ['S05']);
      assert.equal(qualityGate.checks?.page_number_consistency_ok, false);
      const s05 = qualityGate.slide_reviews.find((slide) => slide.slide_id === 'S05');
      assert.equal(s05?.checks?.page_number_consistency_ok, false);
      assert.equal(s05?.mechanical_issues?.includes('page_number_consistency_failed'), true);
      assert.equal(s05?.metrics?.page_number_audit?.failures?.includes('syntax_family'), true);
      assert.equal(qualityGate.review_state_patch?.rerun_from_stage, 'fix_html');
    } finally {
      restoreScreenshotVariant();
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
