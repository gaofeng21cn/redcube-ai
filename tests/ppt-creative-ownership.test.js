import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import {
  createDeliverable,
  runDeliverableRoute,
} from '../packages/redcube-gateway/src/index.js';
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
  const directorReviewPrompt = read('prompts/ppt_deck/director_review.md');

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
  assert.equal(renderHtmlPrompt.includes('"template_registry"'), false);
  assert.match(directorReviewPrompt, /foundation \/ substrate \/ base band/);
  assert.match(directorReviewPrompt, /所有带字元素是否拥有独立留白/);
  assert.match(directorReviewPrompt, /同一页面家族重复出现/);
  assert.equal(existsSync(path.resolve('prompts/ppt_deck/director_review.md')), true);
  assert.equal(existsSync(path.resolve('prompts/ppt_deck/render-artifacts/ppt.hero_signal.html')), true);
  assert.equal(existsSync(path.resolve('prompts/ppt_deck/render-artifacts/ppt.summary_peak.html')), true);
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

test('ppt rerun render_html forwards prior director and screenshot review feedback to Codex', async () => {
  await withMockHermesUpstream(async () => {
    const restoreVariant = withEnv({
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'require_revision_context',
    });
    try {
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
        routes: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction'],
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

      const renderResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'render_html',
      });
      assert.equal(renderResult.ok, true);
    } finally {
      restoreVariant();
    }
  });
});
