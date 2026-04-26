// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';

import {
  createDeliverable,
  runDeliverableRoute,
} from '@redcube/gateway';
import {
  getPublicationProjection,
} from '@redcube/governance';
import {
  startMockCodexCli,
  withEnv,
} from '../helpers/mock-codex-cli.ts';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readImplementation(file) {
  const source = read(file);
  const shell = source.trim().match(/^export \* from '\.\/([^']+\.ts)';$/);
  return shell ? read(path.join(path.dirname(file), shell[1])) : source;
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

test('ppt clears code-authored Story Architecture / Visual Authorship residue and adds explicit visual_director_review', () => {
  const packTypes = read('packages/redcube-pack-ppt/src/index.ts');
  const runtime = [
    read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime.ts'),
    read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/authoring.ts'),
    read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/core.ts'),
    read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/render.ts'),
    read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/stages.ts'),
    read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/surface.ts'),
  ].join('\n');
  const renderCompiler = existsSync(path.resolve('packages/redcube-pack-ppt/src/render-compiler.js'))
    ? read('packages/redcube-pack-ppt/src/render-compiler.js')
    : '';
  const storylinePrompt = read('prompts/ppt_deck/storyline.md');
  const outlinePrompt = read('prompts/ppt_deck/detailed_outline.md');
  const visualPrompt = read('prompts/ppt_deck/visual_direction.md');
  const renderHtmlPrompt = read('prompts/ppt_deck/render_html.md');
  const fixHtmlPrompt = read('prompts/ppt_deck/fix_html.md');
  const renderShell = read('prompts/ppt_deck/render_shell.html');
  const directorReviewPrompt = read('prompts/ppt_deck/director_review.md');
  const screenshotReviewPrompt = read('prompts/ppt_deck/screenshot_review.md');
  const reviewScript = [
    read('packages/redcube-runtime/scripts/ppt_deck_review.py'),
    read('python/redcube_ai/native_helpers/ppt_deck/review.py'),
  ].join('\n');
  const overlayProfiles = readImplementation('packages/redcube-overlay-ppt/src/profiles.ts');

  assert.equal(runtime.includes("const seed = promptSeed('storyline', {"), false);
  assert.equal(runtime.includes("core_metaphor: safeText(seed?.storyline?.core_metaphor)"), false);
  assert.equal(renderCompiler.includes('function pickRecipeId('), false);
  assert.equal(renderCompiler.includes('function renderSlideMarkup('), false);
  assert.equal(renderCompiler.includes('function renderTemplate('), false);
  assert.equal(renderCompiler.includes("renderContract?.template_registry?.[recipeId]"), false);
  assert.equal(renderCompiler.includes("materializedFrom: 'prompt_runtime_template'"), false);
  assert.equal(renderCompiler.includes('compiled.content = renderTemplate(templateText, buildTemplateState(compiled, canvas));'), false);
  assert.equal(existsSync(path.resolve('packages/redcube-pack-ppt/src/render-compiler.js')), false);
  assert.equal(packTypes.includes('buildPptDetailedOutline'), false);
  assert.equal(packTypes.includes('buildPptSlideBlueprint'), false);
  assert.equal(packTypes.includes('buildPptVisualDirection'), false);
  assert.equal(packTypes.includes('compilePptRenderSlides'), false);
  assert.equal(runtime.includes('@redcube/pack-ppt'), false);
  assert.equal(runtime.includes("const renderArtifact = deps.promptArtifact('render_html')?.render_markup_artifact || {};"), false);
  assert.equal(runtime.includes('compileRenderSlides({'), false);
  assert.equal(runtime.includes("const seed = promptSeed('visual_director_review')?.visual_director_review || {};"), false);
  assert.match(storylinePrompt, /## runtime_artifact/);
  assert.match(outlinePrompt, /"render_recipe_id": "ppt\./);
  assert.match(visualPrompt, /"peak_pages": \[/);
  assert.match(visualPrompt, /"typography_plan": \{/);
  assert.match(visualPrompt, /Font Awesome Free/);
  assert.match(visualPrompt, /纵向信息分布/);
  assert.match(visualPrompt, /相邻可读块安全间距/);
  assert.match(renderHtmlPrompt, /## runtime_artifact/);
  assert.match(renderHtmlPrompt, /Font Awesome Free/);
  assert.match(renderHtmlPrompt, /孤立单字贴纸/);
  assert.match(renderHtmlPrompt, /header safe zone/);
  assert.match(renderHtmlPrompt, /foundation \/ substrate \/ base band/);
  assert.match(renderHtmlPrompt, /任何带字元素都必须拥有独立留白/);
  assert.match(renderHtmlPrompt, /父容器|成组容器|群组容器/);
  assert.match(renderHtmlPrompt, /读者可见文字.*data-qa-block/);
  assert.match(renderHtmlPrompt, /同一页面家族重复出现/);
  assert.match(renderHtmlPrompt, /reference_slides/);
  assert.match(renderHtmlPrompt, /typography_plan/);
  assert.match(renderHtmlPrompt, /单行成立.*<br\/>/);
  assert.match(renderHtmlPrompt, /controller.*唯一主峰/);
  assert.match(renderHtmlPrompt, /风险支路.*短窄/);
  assert.match(renderHtmlPrompt, /底部说明.*最多保留 ?2/);
  assert.match(renderHtmlPrompt, /纵向信息分布/);
  assert.match(renderHtmlPrompt, /左拆右并/);
  assert.match(renderHtmlPrompt, /页码语法/);
  assert.match(renderHtmlPrompt, /正文页主标题字号必须在整套 deck 中保持一致/);
  assert.match(renderHtmlPrompt, /连接线.*放在节点徽标.*下层/);
  assert.match(renderHtmlPrompt, /相邻读者可见.*安全间距/);
  assert.match(fixHtmlPrompt, /纵向信息分布/);
  assert.match(fixHtmlPrompt, /Font Awesome Free/);
  assert.match(fixHtmlPrompt, /孤立单字贴纸/);
  assert.match(fixHtmlPrompt, /父容器|成组容器|群组容器/);
  assert.match(fixHtmlPrompt, /读者可见文字.*data-qa-block/);
  assert.match(fixHtmlPrompt, /左拆右并/);
  assert.match(fixHtmlPrompt, /页码/);
  assert.match(fixHtmlPrompt, /相邻读者可见.*安全间距/);
  assert.equal(renderHtmlPrompt.includes('"template_registry"'), false);
  assert.match(renderShell, /font-awesome\/6\.5\.1/);
  assert.match(renderShell, /titleFontSize/);
  assert.match(renderShell, /headerRect/);
  assert.match(renderShell, /edgeClearance/);
  assert.match(directorReviewPrompt, /foundation \/ substrate \/ base band/);
  assert.match(directorReviewPrompt, /所有带字元素是否拥有独立留白/);
  assert.match(directorReviewPrompt, /纵向信息分布/);
  assert.match(directorReviewPrompt, /左拆右并/);
  assert.match(directorReviewPrompt, /页码语法/);
  assert.match(directorReviewPrompt, /同一页面家族重复出现/);
  assert.match(directorReviewPrompt, /controller.*唯一主峰/);
  assert.match(directorReviewPrompt, /底部说明.*最多保留 ?2/);
  assert.match(reviewScript, /group frame|group_frame|parent group|parent_frame/i);
  assert.match(reviewScript, /device_scale_factor=.*2/);
  assert.match(reviewScript, /--device-scale-factor/);
  assert.match(reviewScript, /edge_clearance_out_of_range/);
  assert.match(reviewScript, /block_content_overflow_detected/);
  assert.match(reviewScript, /adjacent_readable_blocks_too_close/);
  assert.match(reviewScript, /title_typography_inconsistent/);
  assert.match(reviewScript, /edge_clearance_ok/);
  assert.match(reviewScript, /block_content_fit_ok/);
  assert.match(reviewScript, /title_typography_ok/);
  assert.match(screenshotReviewPrompt, /读者可见文字.*data-qa-block/);
  assert.match(screenshotReviewPrompt, /相邻读者可见.*视觉贴住/);
  assert.match(screenshotReviewPrompt, /截图裁切错误.*当前页截图.*可见证据/);
  assert.match(overlayProfiles, /edge_clearance_ok/);
  assert.match(overlayProfiles, /block_content_fit_ok/);
  assert.match(overlayProfiles, /title_typography_ok/);
  assert.match(runtime, /controller.*唯一主峰/);
  assert.match(runtime, /风险支路.*短窄/);
  assert.match(runtime, /底部说明.*最多保留 ?2/);
  assert.match(runtime, /纵向信息分布/);
  assert.match(runtime, /左拆右并/);
  assert.match(runtime, /页码语法/);
  assert.match(runtime, /reference_window/);
  assert.match(runtime, /typography_plan/);
  assert.equal(existsSync(path.resolve('prompts/ppt_deck/director_review.md')), true);
  assert.equal(existsSync(path.resolve('prompts/ppt_deck/render-artifacts/ppt.hero_signal.html')), true);
  assert.equal(existsSync(path.resolve('prompts/ppt_deck/render-artifacts/ppt.summary_peak.html')), true);
});

test('ppt review script ignores decorative foundation blocks that only serve as step backplates', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-review-script-'));
  const htmlFile = path.join(workspaceRoot, 'deck.html');
  const outputDir = path.join(workspaceRoot, 'screenshots');
  const reviewMarkdown = path.join(workspaceRoot, 'review.md');
  mkdirSync(outputDir, { recursive: true });
  const inspection = {
    slideId: 'S05',
    title: '第二步：controller 带着门控推进执行与复核',
    layoutFamily: 'judgement_ladder',
    speakerSeconds: 60,
    primaryPoints: 1,
    wrapper: {
      clientWidth: 1152,
      clientHeight: 648,
      scrollWidth: 1152,
      scrollHeight: 648,
    },
    bodyScroll: false,
    blocks: [
      {
        id: 'ladder-foundation',
        left: 80,
        top: 180,
        width: 700,
        height: 340,
        right: 780,
        bottom: 520,
        area: 238000,
        textNodeCount: 0,
        hasSurfaceFrame: true,
      },
      {
        id: 'gate-step-1',
        left: 110,
        top: 220,
        width: 360,
        height: 88,
        right: 470,
        bottom: 308,
        area: 31680,
        textNodeCount: 4,
        hasSurfaceFrame: true,
      },
    ],
    auditBlocks: [
      {
        id: 'ladder-foundation',
        left: 80,
        top: 180,
        width: 700,
        height: 340,
        right: 780,
        bottom: 520,
        area: 238000,
        textNodeCount: 0,
        hasSurfaceFrame: true,
        edgeClearance: { left: 80, top: 180, right: 372, bottom: 128 },
        internalPadding: { left: 20, top: 20, right: 20, bottom: 20 },
      },
      {
        id: 'gate-step-1',
        left: 110,
        top: 220,
        width: 360,
        height: 88,
        right: 470,
        bottom: 308,
        area: 31680,
        textNodeCount: 4,
        hasSurfaceFrame: true,
        edgeClearance: { left: 110, top: 220, right: 682, bottom: 340 },
        internalPadding: { left: 24, top: 18, right: 24, bottom: 18 },
      },
    ],
    titleMeta: {
      titleFontSize: 44,
      titleLineCount: 2,
      titleBlockId: 'header',
    },
  };
  writeFileSync(htmlFile, `<!doctype html>
<html>
<body>
  <div class="slide visible">
    <div class="slide-content-wrapper" style="width:1152px;height:648px;overflow:hidden;position:relative;background:#fff;"></div>
  </div>
  <script>
    const inspection = ${JSON.stringify(inspection)};
    window.redcubeDeckReview = {
      totalSlides: 1,
      showSlide() { return inspection; },
      inspectCurrentSlide() { return inspection; }
    };
  </script>
</body>
</html>`, 'utf-8');
  const result = spawnSync(
    process.env.REDCUBE_TEST_PYTHON || 'python3',
    [
      path.resolve('packages/redcube-runtime/scripts/ppt_deck_review.py'),
      '--html',
      htmlFile,
      '--output-dir',
      outputDir,
      '--review-markdown',
      reviewMarkdown,
      '--max-primary-points',
      '5',
      '--frame-width',
      '1152',
      '--frame-height',
      '648',
    ],
    { encoding: 'utf-8' },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.slide_reviews[0].checks.occlusion_free, true);
  assert.deepEqual(payload.slide_reviews[0].metrics.overlaps, []);
});

test('ppt review script ignores stack-like grouping containers without their own surfaced frame when checking internal padding', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-review-padding-'));
  const htmlFile = path.join(workspaceRoot, 'deck.html');
  const outputDir = path.join(workspaceRoot, 'screenshots');
  const reviewMarkdown = path.join(workspaceRoot, 'review.md');
  mkdirSync(outputDir, { recursive: true });
  const inspection = {
    slideId: 'S08',
    title: '骨架可以复用，医学语义与研究判断不能外包',
    layoutFamily: 'multi_zone_compare',
    speakerSeconds: 60,
    primaryPoints: 1,
    wrapper: {
      clientWidth: 1152,
      clientHeight: 648,
      scrollWidth: 1152,
      scrollHeight: 648,
    },
    bodyScroll: false,
    blocks: [
      {
        id: 'reuse-rail',
        left: 92,
        top: 226,
        width: 252,
        height: 302,
        right: 344,
        bottom: 528,
        area: 76104,
        textNodeCount: 4,
        hasSurfaceFrame: true,
      },
    ],
    auditBlocks: [
      {
        id: 'reuse-rail',
        left: 92,
        top: 226,
        width: 252,
        height: 302,
        right: 344,
        bottom: 528,
        area: 76104,
        textNodeCount: 4,
        hasSurfaceFrame: true,
        edgeClearance: { left: 92, top: 226, right: 808, bottom: 120 },
        internalPadding: { left: 16, top: 24, right: 16, bottom: 24 },
      },
      {
        id: 'reuse-stack',
        left: 108,
        top: 268,
        width: 220,
        height: 204,
        right: 328,
        bottom: 472,
        area: 44880,
        textNodeCount: 3,
        hasSurfaceFrame: false,
        edgeClearance: { left: 108, top: 268, right: 824, bottom: 176 },
        internalPadding: { left: 0, top: 0, right: 0, bottom: 0 },
      },
    ],
    titleMeta: {
      titleFontSize: 44,
      titleLineCount: 1,
      titleBlockId: 'header',
    },
  };
  writeFileSync(htmlFile, `<!doctype html>
<html>
<body>
  <div class="slide visible">
    <div class="slide-content-wrapper" style="width:1152px;height:648px;overflow:hidden;position:relative;background:#fff;"></div>
  </div>
  <script>
    const inspection = ${JSON.stringify(inspection)};
    window.redcubeDeckReview = {
      totalSlides: 1,
      showSlide() { return inspection; },
      inspectCurrentSlide() { return inspection; }
    };
  </script>
</body>
</html>`, 'utf-8');
  const result = spawnSync(
    process.env.REDCUBE_TEST_PYTHON || 'python3',
    [
      path.resolve('packages/redcube-runtime/scripts/ppt_deck_review.py'),
      '--html',
      htmlFile,
      '--output-dir',
      outputDir,
      '--review-markdown',
      reviewMarkdown,
      '--max-primary-points',
      '5',
      '--frame-width',
      '1152',
      '--frame-height',
      '648',
    ],
    { encoding: 'utf-8' },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.slide_reviews[0].checks.edge_clearance_ok, true);
  assert.deepEqual(payload.slide_reviews[0].metrics.edge_clearance_failures, []);
});

test('ppt route artifacts record Codex-backed ownership for Story Architecture, Visual Authorship, and visual_director_review overlay', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-creative-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'P19 PPT 创作权收口',
      goal: '验证 PPT 主创作权已从 JS 收回到 Codex-backed / director-first mainline',
    });
    const routes = ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review'];
    const results = [];
    for (const route of routes) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
      results.push(result);
    }

    const storyline = readJson(results[0].artifactFile);
    assert.equal(storyline.creative_execution?.owner, 'host_agent');
    assert.equal(storyline.creative_execution?.lifecycle_stage, 'story_architecture');
    assert.equal(storyline.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(storyline.storyline.creative_sources?.core_metaphor?.materialized_from, 'codex_cli_json_output');
    assert.equal(storyline.storyline.creative_sources?.narrative_arc?.materialized_from, 'codex_cli_json_output');

    const outline = readJson(results[1].artifactFile);
    assert.equal(outline.creative_execution?.owner, 'host_agent');
    assert.equal(outline.creative_execution?.lifecycle_stage, 'story_architecture');
    assert.equal(outline.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(
      outline.detailed_outline.slides.every((slide) => slide.creative_authorship?.major_text?.owner === 'host_agent'),
      true,
    );

    const blueprint = readJson(results[2].artifactFile);
    assert.equal(blueprint.creative_execution?.owner, 'host_agent');
    assert.equal(blueprint.creative_execution?.lifecycle_stage, 'story_architecture');
    assert.equal(blueprint.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(
      blueprint.slide_blueprint.slides.every((slide) => slide.creative_authorship?.page_core_content?.owner === 'host_agent'),
      true,
    );
    assert.equal(
      blueprint.slide_blueprint.slides.every((slide) => slide.creative_authorship?.page_core_content?.materialized_from === 'codex_cli_json_output'),
      true,
    );
    assert.equal(
      blueprint.slide_blueprint.slides.every((slide) => slide.creative_authorship?.speaker_notes?.owner === 'host_agent'),
      true,
    );

    const visual = readJson(results[3].artifactFile);
    assert.equal(visual.creative_execution?.owner, 'host_agent');
    assert.equal(visual.creative_execution?.lifecycle_stage, 'visual_authorship');
    assert.equal(visual.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(visual.visual_direction?.creative_authorship?.visual_direction?.owner, 'host_agent');
    assert.equal(visual.visual_direction?.creative_authorship?.visual_direction?.materialized_from, 'codex_cli_json_output');

    const render = readJson(results[4].artifactFile);
    assert.equal(render.creative_execution?.owner, 'host_agent');
    assert.equal(render.creative_execution?.lifecycle_stage, 'visual_authorship');
    assert.equal(render.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(
      render.html_bundle.slides.every((slide) => slide.creative_authorship?.final_html_markup?.owner === 'host_agent'),
      true,
    );
    assert.equal(
      render.html_bundle.slides.every((slide) => slide.creative_authorship?.final_html_markup?.materialized_from === 'codex_cli_json_output'),
      true,
    );

    const directorReview = readJson(results[5].artifactFile);
    assert.equal(directorReview.review_execution?.owner, 'host_agent');
    assert.equal(directorReview.review_execution?.overlay, 'visual_director_review');
    assert.equal(directorReview.review_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(directorReview.visual_director_review?.review_model, 'director_first_visual_judgement');
    assert.equal(directorReview.visual_director_review?.creative_sources?.review_judgement?.materialized_from, 'codex_cli_json_output');

    const screenshotReview = readJson(results[6].artifactFile);
    assert.equal(screenshotReview.review_overlay, 'screenshot_review');
    assert.equal(screenshotReview.review_execution?.owner, 'host_agent');
    assert.equal(screenshotReview.review_execution?.overlay, 'screenshot_review');
    assert.equal(screenshotReview.review_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(screenshotReview.ai_review?.review_model, 'screenshot_director_first_visual_judgement');
    assert.equal(typeof screenshotReview.ai_review?.review_summary, 'string');
    assert.equal(
      screenshotReview.ai_review?.creative_sources?.review_judgement?.materialized_from,
      'codex_cli_json_output',
    );
  });
});

test('ppt route artifacts materialize lecture operator view files inside the canonical deliverable surface', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-operator-surface-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Med Auto Science 同行讲课',
      goal: '向医学人工智能小同行讲清自动科研为什么成立、怎么做、模块如何复用',
    });

    const routes = ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html'];
    const artifacts = [];
    for (const route of routes) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
      artifacts.push(readJson(result.artifactFile));
    }

    const surfacePaths = getPptDeliverableSurfacePaths(workspaceRoot);
    const storylineFile = artifacts[0].artifact_refs.find((ref) => ref.endsWith('/views/operator/故事主线.md'));
    const detailedOutlineFile = artifacts[1].artifact_refs.find((ref) => ref.endsWith('/views/operator/详细大纲.md'));
    const blueprintFile = artifacts[2].artifact_refs.find((ref) => ref.includes('/views/operator/大纲/') && ref.endsWith('.md') && !ref.endsWith('_视觉导演稿.md'));
    const visualDirectionFile = artifacts[3].artifact_refs.find((ref) => ref.endsWith('/views/operator/大纲/Med Auto Science 同行讲课_视觉导演稿.md'));
    const htmlFile = artifacts[4].artifact_refs.find((ref) => ref.endsWith('/views/deck-a.draft.html'));
    const referenceIndexFile = artifacts[4].artifact_refs.find((ref) => ref.endsWith('/views/operator/参考材料/来源索引.md'));

    assert.equal(existsSync(path.resolve(storylineFile)), true);
    assert.equal(existsSync(path.resolve(detailedOutlineFile)), true);
    assert.equal(existsSync(path.resolve(blueprintFile)), true);
    assert.equal(existsSync(path.resolve(visualDirectionFile)), true);
    assert.equal(existsSync(path.resolve(htmlFile)), true);
    assert.equal(existsSync(path.resolve(referenceIndexFile)), true);

    assert.match(read(storylineFile), /## Hook/);
    assert.match(read(detailedOutlineFile), /## 逐页预算/);
    assert.match(read(blueprintFile), /幻灯片: 01/);
    assert.match(read(visualDirectionFile), /## 本章视觉宣言/);
    assert.match(read(htmlFile), /slidesData/);
    assert.match(read(referenceIndexFile), /来源索引/);
    assert.equal(path.dirname(storylineFile), surfacePaths.operatorDir);
    assert.equal(path.dirname(detailedOutlineFile), surfacePaths.operatorDir);
    assert.equal(path.dirname(referenceIndexFile), surfacePaths.operatorReferencesDir);
  });
});
