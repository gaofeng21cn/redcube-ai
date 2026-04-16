import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';

import {
  createDeliverable,
  runDeliverableRoute,
} from '../packages/redcube-gateway/src/index.js';
import {
  getPublicationProjection,
} from '../packages/redcube-governance/src/index.js';
import {
  startMockCodexCli,
  withEnv,
} from './helpers/mock-codex-cli.js';

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

test('ppt clears code-authored Story Architecture / Visual Authorship residue and adds explicit visual_director_review', () => {
  const pack = read('packages/redcube-pack-ppt/src/index.js');
  const packTypes = read('packages/redcube-pack-ppt/src/index.ts');
  const runtime = read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime.js');
  const renderCompiler = existsSync(path.resolve('packages/redcube-pack-ppt/src/render-compiler.js'))
    ? read('packages/redcube-pack-ppt/src/render-compiler.js')
    : '';
  const storylinePrompt = read('prompts/ppt_deck/storyline.md');
  const outlinePrompt = read('prompts/ppt_deck/detailed_outline.md');
  const visualPrompt = read('prompts/ppt_deck/visual_direction.md');
  const renderHtmlPrompt = read('prompts/ppt_deck/render_html.md');
  const renderShell = read('prompts/ppt_deck/render_shell.html');
  const directorReviewPrompt = read('prompts/ppt_deck/director_review.md');
  const reviewScript = read('packages/redcube-runtime/scripts/ppt_deck_review.py');
  const overlayProfiles = read('packages/redcube-overlay-ppt/src/profiles.js');

  assert.equal(runtime.includes("const seed = promptSeed('storyline', {"), false);
  assert.equal(runtime.includes("core_metaphor: safeText(seed?.storyline?.core_metaphor)"), false);
  assert.equal(renderCompiler.includes('function pickRecipeId('), false);
  assert.equal(renderCompiler.includes('function renderSlideMarkup('), false);
  assert.equal(renderCompiler.includes('function renderTemplate('), false);
  assert.equal(renderCompiler.includes("renderContract?.template_registry?.[recipeId]"), false);
  assert.equal(renderCompiler.includes("materializedFrom: 'prompt_runtime_template'"), false);
  assert.equal(renderCompiler.includes('compiled.content = renderTemplate(templateText, buildTemplateState(compiled, canvas));'), false);
  assert.equal(existsSync(path.resolve('packages/redcube-pack-ppt/src/render-compiler.js')), false);
  assert.equal(pack.includes('function toBlueprintContent('), false);
  assert.equal(pack.includes("speaker_seconds: preset.speaker_seconds + (slide.layout_family === 'judgement_ladder' ? 10 : 0),"), false);
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
  assert.match(renderHtmlPrompt, /## runtime_artifact/);
  assert.match(renderHtmlPrompt, /header safe zone/);
  assert.match(renderHtmlPrompt, /foundation \/ substrate \/ base band/);
  assert.match(renderHtmlPrompt, /任何带字元素都必须拥有独立留白/);
  assert.match(renderHtmlPrompt, /同一页面家族重复出现/);
  assert.match(renderHtmlPrompt, /controller.*唯一主峰/);
  assert.match(renderHtmlPrompt, /风险支路.*短窄/);
  assert.match(renderHtmlPrompt, /底部说明.*最多保留 ?2/);
  assert.match(renderHtmlPrompt, /正文页主标题字号必须在整套 deck 中保持一致/);
  assert.match(renderHtmlPrompt, /连接线.*放在节点徽标.*下层/);
  assert.equal(renderHtmlPrompt.includes('"template_registry"'), false);
  assert.match(renderShell, /titleFontSize/);
  assert.match(renderShell, /headerRect/);
  assert.match(renderShell, /edgeClearance/);
  assert.match(directorReviewPrompt, /foundation \/ substrate \/ base band/);
  assert.match(directorReviewPrompt, /所有带字元素是否拥有独立留白/);
  assert.match(directorReviewPrompt, /同一页面家族重复出现/);
  assert.match(directorReviewPrompt, /controller.*唯一主峰/);
  assert.match(directorReviewPrompt, /底部说明.*最多保留 ?2/);
  assert.match(reviewScript, /device_scale_factor=.*2/);
  assert.match(reviewScript, /--device-scale-factor/);
  assert.match(reviewScript, /edge_clearance_out_of_range/);
  assert.match(reviewScript, /title_typography_inconsistent/);
  assert.match(reviewScript, /edge_clearance_ok/);
  assert.match(reviewScript, /title_typography_ok/);
  assert.match(overlayProfiles, /edge_clearance_ok/);
  assert.match(overlayProfiles, /title_typography_ok/);
  assert.match(runtime, /controller.*唯一主峰/);
  assert.match(runtime, /风险支路.*短窄/);
  assert.match(runtime, /底部说明.*最多保留 ?2/);
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

test('ppt route artifacts materialize lecture workbench files for the staged workflow', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-workbench-'));
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

    const storylineFile = artifacts[0].artifact_refs.find((ref) => ref.endsWith('/故事主线.md'));
    const detailedOutlineFile = artifacts[1].artifact_refs.find((ref) => ref.endsWith('/详细大纲.md'));
    const blueprintFile = artifacts[2].artifact_refs.find((ref) => ref.includes('/大纲/') && ref.endsWith('.md') && !ref.endsWith('_视觉导演稿.md'));
    const visualDirectionFile = artifacts[3].artifact_refs.find((ref) => ref.endsWith('_视觉导演稿.md'));
    const htmlFile = artifacts[4].artifact_refs.find((ref) => ref.includes('/幻灯片/') && ref.endsWith('.html'));
    const referenceIndexFile = artifacts[4].artifact_refs.find((ref) => ref.endsWith('/参考材料/来源索引.md'));

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
  });
});

test('ppt screenshot_review writes immutable capture screenshots and export uses the reviewed capture directory', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-capture-proof-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Med Auto Science 同行讲课',
      goal: '向医学人工智能小同行讲清自动科研为什么成立、怎么做、模块如何复用',
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

    const screenshotReview = readJson(results.at(-1).artifactFile);
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

test('ppt rerunning upstream HTML keeps the last exported workbench PPTX visible while publication projection falls back to draft', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-stale-export-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Med Auto Science 同行讲课',
      goal: '向医学人工智能小同行讲清自动科研为什么成立、怎么做、模块如何复用',
    });

    const initialRoutes = [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'render_html',
      'visual_director_review',
      'screenshot_review',
      'export_pptx',
    ];
    for (const route of initialRoutes) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const workbenchPptxDir = path.join(workspaceRoot, 'Med Auto Science 同行讲课', 'pptx');
    const workbenchPptxFile = path.join(workbenchPptxDir, 'Med Auto Science 同行讲课.pptx');
    const archiveDir = path.join(workbenchPptxDir, 'archive');
    const readmeFile = path.join(workbenchPptxDir, 'README.md');
    assert.equal(existsSync(workbenchPptxFile), true);

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
    assert.equal(existsSync(workbenchPptxFile), true);
    assert.equal(existsSync(archiveDir), false);
    assert.match(read(readmeFile), /当前导出状态：last_export_available/);
    assert.match(read(readmeFile), /最近一次导出的 .* 仍保留在当前目录/);
    assert.match(read(readmeFile), /可能落后于最新 HTML 与截图质控/);
  });
});

test('ppt rerender restores the last exported workbench PPTX when only the workbench surface copy is missing', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-export-restore-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Med Auto Science 同行讲课',
      goal: '向医学人工智能小同行讲清自动科研为什么成立、怎么做、模块如何复用',
    });

    const initialRoutes = [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'render_html',
      'visual_director_review',
      'screenshot_review',
      'export_pptx',
    ];
    for (const route of initialRoutes) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const workbenchPptxFile = path.join(workspaceRoot, 'Med Auto Science 同行讲课', 'pptx', 'Med Auto Science 同行讲课.pptx');
    assert.equal(existsSync(workbenchPptxFile), true);
    rmSync(workbenchPptxFile, { force: true });
    assert.equal(existsSync(workbenchPptxFile), false);

    const rerender = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'render_html',
    });
    assert.equal(rerender.ok, true);
    assert.equal(existsSync(workbenchPptxFile), true);
  });
});

test('ppt rerender keeps the reviewed HTML stable and writes newer markup into a draft file until screenshot_review catches up', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-reviewed-html-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Med Auto Science 同行讲课',
      goal: '向医学人工智能小同行讲清自动科研为什么成立、怎么做、模块如何复用',
    });

    const initialRoutes = [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'render_html',
      'visual_director_review',
      'screenshot_review',
    ];
    for (const route of initialRoutes) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const workbenchSlidesDir = path.join(workspaceRoot, 'Med Auto Science 同行讲课', '幻灯片');
    const reviewedHtmlFile = path.join(workbenchSlidesDir, 'Med Auto Science 同行讲课.html');
    const draftHtmlFile = path.join(workbenchSlidesDir, 'Med Auto Science 同行讲课_当前草稿.html');
    const reviewMarkdownFile = path.join(workbenchSlidesDir, 'Med Auto Science 同行讲课_视觉质控.md');
    const deliverableViewsDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', 'deck-a', 'views');
    const stableViewHtmlFile = path.join(deliverableViewsDir, 'deck-a.html');
    const draftViewHtmlFile = path.join(deliverableViewsDir, 'deck-a.draft.html');
    const stableViewSlidesFile = path.join(deliverableViewsDir, 'deck-a.slides.json');
    const draftViewSlidesFile = path.join(deliverableViewsDir, 'deck-a.draft.slides.json');
    const reviewedHtmlMtimeMs = statSync(reviewedHtmlFile).mtimeMs;
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

    assert.equal(statSync(reviewedHtmlFile).mtimeMs, reviewedHtmlMtimeMs);
    assert.equal(statSync(reviewMarkdownFile).mtimeMs, reviewMarkdownMtimeMs);
    assert.equal(existsSync(draftHtmlFile), true);
    assert.equal(statSync(draftHtmlFile).mtimeMs >= reviewedHtmlMtimeMs, true);
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

    assert.equal(statSync(reviewedHtmlFile).mtimeMs > reviewedHtmlMtimeMs, true);
    assert.equal(statSync(reviewMarkdownFile).mtimeMs > reviewMarkdownMtimeMs, true);
    assert.equal(existsSync(draftHtmlFile), false);
    assert.equal(statSync(stableViewHtmlFile).mtimeMs > stableViewHtmlMtimeMs, true);
    assert.equal(existsSync(draftViewHtmlFile), true);
    assert.equal(existsSync(draftViewSlidesFile), true);
  });
});

test('ppt blocked screenshot_review keeps the prior default HTML and preserves the failed candidate as draft', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-blocked-html-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Med Auto Science 同行讲课',
      goal: '向医学人工智能小同行讲清自动科研为什么成立、怎么做、模块如何复用',
    });

    const initialRoutes = [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'render_html',
      'visual_director_review',
      'screenshot_review',
    ];
    for (const route of initialRoutes) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const workbenchSlidesDir = path.join(workspaceRoot, 'Med Auto Science 同行讲课', '幻灯片');
    const reviewedHtmlFile = path.join(workbenchSlidesDir, 'Med Auto Science 同行讲课.html');
    const draftHtmlFile = path.join(workbenchSlidesDir, 'Med Auto Science 同行讲课_当前草稿.html');
    const reviewMarkdownFile = path.join(workbenchSlidesDir, 'Med Auto Science 同行讲课_视觉质控.md');
    const slidesReadmeFile = path.join(workbenchSlidesDir, 'README.md');
    const deliverableViewsDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', 'deck-a', 'views');
    const stableViewHtmlFile = path.join(deliverableViewsDir, 'deck-a.html');
    const draftViewHtmlFile = path.join(deliverableViewsDir, 'deck-a.draft.html');
    const stableViewSlidesFile = path.join(deliverableViewsDir, 'deck-a.slides.json');
    const draftViewSlidesFile = path.join(deliverableViewsDir, 'deck-a.draft.slides.json');
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
    assert.match(read(slidesReadmeFile), /草稿 HTML：Med Auto Science 同行讲课_当前草稿\.html/);
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
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-stable-screenshots-'));
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

test('ppt render_html runs slide batches in parallel once Codex exec is async', async () => {
  await withMockHermesUpstream(async () => {
    const lockDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-render-parallel-'));
    const overlapFile = path.join(lockDir, 'overlap.txt');
    const restoreVariant = withEnv({
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'require_parallel_batches',
      REDCUBE_MOCK_PPT_RENDER_PARALLEL_LOCK_DIR: lockDir,
      REDCUBE_MOCK_PPT_RENDER_PARALLEL_OVERLAP_FILE: overlapFile,
    });
    try {
      const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-render-parallel-workspace-'));
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
      assert.equal(existsSync(overlapFile), true);
    } finally {
      restoreVariant();
    }
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
      routes: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html'],
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

test('ppt fix_html only regenerates blocked slides and preserves previously passed slides', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-rerun-targeted-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Med Auto Science 同行讲课',
      goal: '向医学人工智能小同行讲清自动科研为什么成立、怎么做、模块如何复用',
    });

    const initialRoutes = await runPptRoutes({
      workspaceRoot,
      deliverableId: 'deck-a',
      routes: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html'],
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
    } finally {
      restoreVariant();
    }
  });
});

test('ppt fix_html targets slides blocked only by mechanical screenshot checks', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-rerun-mechanical-only-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Med Auto Science 同行讲课',
      goal: '向医学人工智能小同行讲清自动科研为什么成立、怎么做、模块如何复用',
    });

    const initialRoutes = await runPptRoutes({
      workspaceRoot,
      deliverableId: 'deck-a',
      routes: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html'],
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
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-rerun-blocked-over-weak-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Med Auto Science 同行讲课',
      goal: '向医学人工智能小同行讲清自动科研为什么成立、怎么做、模块如何复用',
    });

    const initialRoutes = await runPptRoutes({
      workspaceRoot,
      deliverableId: 'deck-a',
      routes: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html'],
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
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-rerun-operator-brief-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Med Auto Science 同行讲课',
      goal: '向医学人工智能小同行讲清自动科研为什么成立、怎么做、模块如何复用',
    });

    const initialRoutes = await runPptRoutes({
      workspaceRoot,
      deliverableId: 'deck-a',
      routes: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html'],
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
      workspaceRoot,
      'Med Auto Science 同行讲课',
      '幻灯片',
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
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-latest-capture-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Med Auto Science 同行讲课',
      goal: '验证 PPT 通过版截图指针和导出 source_html 都锚定稳定表面',
    });

    for (const route of [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'render_html',
      'visual_director_review',
      'screenshot_review',
    ]) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
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
