import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import {
  createDeliverable,
  runDeliverableRoute,
} from '../../packages/redcube-gateway/src/index.js';
import {
  startMockCodexCli,
  withEnv,
} from '../helpers/mock-codex-cli.js';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn7ytcAAAAASUVORK5CYII=',
  'base64',
);
const PPT_ROUTES_TO_RENDER_HTML = ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html'];

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

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

test('ppt fix_html forwards prior director and screenshot review feedback to Codex', async () => {
  await withMockHermesUpstream(async () => {
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
    } finally {
      restoreVariant();
    }
  });
});
