import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';

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

function writeJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
}

function writeText(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, value, 'utf-8');
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

test('xiaohongshu Codex-backed mainline owns protected creative outputs instead of JS builders', () => {
  const packEntry = read('packages/redcube-pack-xiaohongshu/src/index.ts');
  const runtime = read('packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.js');
  const storylinePrompt = read('prompts/xiaohongshu/storyline.md');
  const singleNotePlanPrompt = read('prompts/xiaohongshu/single_note_plan.md');
  const renderHtmlPrompt = read('prompts/xiaohongshu/render_html.md');
  const fixHtmlPrompt = read('prompts/xiaohongshu/fix_html.md');
  const renderShell = read('prompts/xiaohongshu/render_shell.html');
  const publishCopyPrompt = read('prompts/xiaohongshu/publish_copy.md');
  const directorReviewPrompt = read('prompts/xiaohongshu/director_review.md');
  const screenshotReviewPrompt = read('prompts/xiaohongshu/screenshot_review.md');

  assert.equal(existsSync(path.resolve('packages/redcube-pack-xiaohongshu/src/planning.js')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-pack-xiaohongshu/src/render-compiler.js')), false);
  assert.equal(packEntry.includes('buildXhsPlanSlides'), false);
  assert.equal(packEntry.includes('buildXhsVisualDirection'), false);
  assert.equal(packEntry.includes('buildXhsRenderHtml'), false);
  assert.equal(packEntry.includes('compileXhsRenderSlides'), false);
  assert.equal(runtime.includes("const seed = promptSeed(contract, 'storyline');"), false);
  assert.equal(runtime.includes("audience_judgement: safeText(seed?.storyline?.audience_judgement, research?.research?.audience_judgement)"), false);
  assert.equal(runtime.includes("const authoredArtifact = promptArtifact(contract, 'storyline', buildStorylineInputs(contract, research));"), false);
  assert.equal(runtime.includes("const seed = promptSeed(contract, 'single_note_plan', { title: contract.title });"), false);
  assert.equal(runtime.includes("const seed = promptSeed(contract, 'visual_direction');"), false);
  assert.equal(runtime.includes("const renderArtifact = deps.promptArtifact(contract, 'render_html')?.render_markup_artifact || {};"), false);
  assert.equal(runtime.includes("const seed = promptSeed(contract, 'publish_copy', {"), false);
  assert.equal(runtime.includes("const authoredArtifact = promptArtifact(contract, 'publish_copy', {"), false);
  assert.equal(runtime.includes('const body = safeText(publishSeed.body);'), false);
  assert.equal(runtime.includes('const body = `${titles[0] || contract.title}。先别急着上工具'), false);
  assert.equal(runtime.includes('const distinctLayoutRatio = Number((layoutFamilies.length / Math.max(slides.length, 1)).toFixed(2));'), false);
  assert.equal(runtime.includes('const directorIntentLanded = layoutFamilies.length >='), false);
  assert.equal(runtime.includes('@redcube/pack-xiaohongshu'), false);
  assert.match(storylinePrompt, /## runtime_artifact/);
  assert.match(singleNotePlanPrompt, /视觉锚点与版心分布/);
  assert.match(singleNotePlanPrompt, /相邻.*安全间距/);
  assert.match(singleNotePlanPrompt, /Font Awesome Free/);
  assert.match(singleNotePlanPrompt, /"page_core_content": \[/);
  assert.match(singleNotePlanPrompt, /"visual_presentation": \{/);
  assert.match(renderHtmlPrompt, /Font Awesome Free/);
  assert.match(renderHtmlPrompt, /孤立单字贴纸/);
  assert.match(renderHtmlPrompt, /父容器|成组容器|群组容器/);
  assert.match(renderHtmlPrompt, /读者可见文字.*data-qa-block/);
  assert.match(renderHtmlPrompt, /相邻读者可见.*安全间距/);
  assert.match(renderHtmlPrompt, /visible_text_qa_coverage/);
  assert.match(fixHtmlPrompt, /读者可见文字.*data-qa-block/);
  assert.match(fixHtmlPrompt, /相邻读者可见.*安全间距/);
  assert.match(renderHtmlPrompt, /## runtime_artifact/);
  assert.match(fixHtmlPrompt, /父容器|成组容器|群组容器/);
  assert.equal(renderHtmlPrompt.includes('"template_registry"'), false);
  assert.match(renderShell, /font-awesome\/6\.5\.1/);
  assert.match(publishCopyPrompt, /## runtime_artifact/);
  assert.match(publishCopyPrompt, /"body": "/);
  assert.match(directorReviewPrompt, /视觉锚点是否语义明确/);
  assert.match(directorReviewPrompt, /"visual_director_review": \{/);
  assert.match(screenshotReviewPrompt, /孤立单字/);
  assert.match(screenshotReviewPrompt, /父容器|组块|成组/);
  assert.match(screenshotReviewPrompt, /读者可见文字.*data-qa-block/);
  assert.match(screenshotReviewPrompt, /相邻读者可见.*视觉贴住/);
});

test('xiaohongshu route artifacts record Codex-backed creative ownership for story, visual, review, and publish surfaces', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-creative-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: 'P19 小红书创作权收口',
      goal: '验证小红书主创作权已从 JS builder 收回到 Codex-backed / director-first mainline',
    });

    const routes = ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'publish_copy'];
    const results = [];
    for (const route of routes) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route,
      });
      assert.equal(result.ok, true, route);
      results.push(result);
    }

    const storyline = readJson(results[1].artifactFile);
    assert.equal(storyline.lifecycle_stage, 'story_architecture');
    assert.equal(storyline.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(storyline.storyline.creative_sources.narrative_arc.owner, 'host_agent');
    assert.equal(storyline.storyline.creative_sources.narrative_arc.primary_surface, 'codex_native_host_agent');
    assert.equal(storyline.storyline.creative_sources.narrative_arc.materialized_from, 'codex_cli_json_output');

    const plan = readJson(results[2].artifactFile);
    assert.equal(plan.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(
      plan.single_note_plan.slides.every((slide) => slide.creative_sources?.page_core_content?.owner === 'host_agent'),
      true,
    );
    assert.equal(
      plan.single_note_plan.slides.every((slide) => slide.creative_sources?.page_core_content?.materialized_from === 'codex_cli_json_output'),
      true,
    );
    assert.equal(
      plan.single_note_plan.slides.every((slide) => slide.creative_sources?.visual_presentation?.primary_surface === 'codex_native_host_agent'),
      true,
    );

    const visual = readJson(results[3].artifactFile);
    assert.equal(visual.lifecycle_stage, 'visual_authorship');
    assert.equal(visual.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(visual.visual_direction.creative_sources.director_statement.owner, 'host_agent');
    assert.equal(visual.visual_direction.creative_sources.director_statement.primary_surface, 'codex_native_host_agent');
    assert.equal(visual.visual_direction.creative_sources.director_statement.materialized_from, 'codex_cli_json_output');
    assert.equal(visual.visual_direction.visual_anchor_system.preferred_library, 'Font Awesome Free');
    assert.match(visual.visual_direction.visual_anchor_system.required_peak_page_anchor, /Font Awesome Free/);
    assert.match(visual.visual_direction.signature_exposure_grammar.cover_note, /封面署名/);
    assert.match(visual.visual_direction.signature_exposure_grammar.continuity_rule, /署名显示/);

    const render = readJson(results[4].artifactFile);
    assert.equal(render.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(
      render.html_bundle.slides.every((slide) => slide.creative_sources?.recipe_selection?.owner === 'host_agent'),
      true,
    );
    assert.equal(
      render.html_bundle.slides.every((slide) => slide.creative_sources?.final_markup?.owner === 'host_agent'),
      true,
    );
    assert.equal(
      render.html_bundle.slides.every((slide) => slide.creative_sources?.final_markup?.materialized_from === 'codex_cli_json_output'),
      true,
    );
    const html = readFileSync(render.html_bundle.html_file, 'utf-8');
    assert.equal(html.includes('prompt_pack_artifact'), false);
    assert.equal(render.html_bundle.director_contract.visual_anchor_system.preferred_library, 'Font Awesome Free');
    assert.match(render.html_bundle.director_contract.signature_exposure_grammar.closing_page, /结尾页/);

    const directorReview = readJson(results[5].artifactFile);
    assert.equal(directorReview.review_overlay, 'visual_director_review');
    assert.equal(directorReview.review_authorship.primary_surface, 'codex_native_host_agent');
    assert.equal(directorReview.review_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(typeof directorReview.visual_director_review?.director_intent_landed, 'boolean');
    assert.equal(typeof directorReview.visual_director_review?.anti_template_ok, 'boolean');
    assert.equal(directorReview.visual_director_review?.creative_sources?.review_judgement?.materialized_from, 'codex_cli_json_output');
    const directorReviewMarkdown = readFileSync(
      directorReview.artifact_refs.find((ref) => ref.endsWith('_视觉总监复盘.md')),
      'utf-8',
    );
    assert.match(directorReviewMarkdown, /- review_owner: codex_native_host_agent/);
    assert.equal((directorReviewMarkdown.match(/codex_native_host_agent/g) || []).length, 1);

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
    assert.equal(typeof screenshotReview.checks?.director_intent_landed, 'boolean');
    assert.equal(typeof screenshotReview.checks?.anti_template_ok, 'boolean');

    const copy = readJson(results[7].artifactFile);
    assert.equal(copy.lifecycle_stage, 'delivery_packaging');
    assert.equal(copy.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(copy.publish_copy.creative_sources.body.owner, 'host_agent');
    assert.equal(copy.publish_copy.creative_sources.first_comment.primary_surface, 'codex_native_host_agent');
    assert.equal(copy.publish_copy.creative_sources.body.materialized_from, 'codex_cli_json_output');
  });
});

test('xiaohongshu screenshot_review forwards current slide source_html alongside screenshots', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-screenshot-source-html-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: 'P19 小红书截图质控源码对照',
      goal: '验证截图质控会同时参考当前卡片 HTML 源码',
    });

    const restoreVariant = withEnv({
      REDCUBE_MOCK_XHS_SCREENSHOT_REVIEW_VARIANT: 'require_source_html',
    });
    try {
      const routes = ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review'];
      for (const route of routes) {
        const result = await runDeliverableRoute({
          workspaceRoot,
          overlay: 'xiaohongshu',
          topicId: 'topic-a',
          deliverableId: 'note-a',
          route,
        });
        assert.equal(result.ok, true, route);
      }
    } finally {
      restoreVariant();
    }
  });
});

test('xiaohongshu screenshot_review accepts weak_pages lists longer than four items', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-weak-pages-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: 'P19 小红书弱页清单回归',
      goal: '验证 screenshot_review 接受多于四页的 weak_pages 清单',
    });

    const restoreVariant = withEnv({
      REDCUBE_MOCK_XHS_SCREENSHOT_REVIEW_VARIANT: 'many_weak_pages',
    });
    try {
      for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review']) {
        const result = await runDeliverableRoute({
          workspaceRoot,
          overlay: 'xiaohongshu',
          topicId: 'topic-a',
          deliverableId: 'note-a',
          route,
        });
        assert.equal(result.ok, true, route);
      }

      const reviewResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route: 'screenshot_review',
      });
      assert.equal(reviewResult.ok, true);

      const screenshotReview = readJson(reviewResult.artifactFile);
      assert.equal(screenshotReview.ai_review.weak_pages.length > 4, true);
      assert.deepEqual(
        screenshotReview.ai_review.weak_pages,
        screenshotReview.slide_reviews.map((slide) => slide.slide_id),
      );
    } finally {
      restoreVariant();
    }
  });
});

test('xiaohongshu uses workspace-level author profile and exports a human-usable publish package', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-workspace-author-'));
    const fakeConfigHome = path.join(workspaceRoot, 'fake-config-home');

    writeJson(path.join(fakeConfigHome, 'identity.json'), {
      defaultProfileId: 'global_default',
      routing: {
        medicalProfileId: 'global_default',
        generalProfileId: 'global_default',
      },
      profiles: {
        global_default: {
          signatureDisplay: '全局默认作者',
          signatureSubtitle: '全局默认品牌',
        },
      },
    });

    writeJson(path.join(workspaceRoot, '.redcube', 'runtime.json'), {
      promptsDir: './prompts',
    });
    writeJson(path.join(workspaceRoot, '.redcube', 'identity.json'), {
      defaultProfileId: 'traveling_anthropologist',
      routing: {
        medicalProfileId: 'traveling_anthropologist',
        generalProfileId: 'traveling_anthropologist',
      },
      profiles: {
        traveling_anthropologist: {
          signatureDisplay: '旅行中的人类学家',
          signatureSubtitle: '一切有迹可循 · RedCube AI',
        },
      },
    });
    writeText(
      path.join(workspaceRoot, '.redcube', 'prompts', 'aligned', '自动小红书', '作者档案库.md'),
      [
        '# 作者档案库（可扩展）',
        '',
        '## profile_id: traveling_anthropologist',
        '',
        '- 账号名：旅行中的人类学家',
        '- 署名显示：旅行中的人类学家',
        '- 署名副标：一切有迹可循 · RedCube AI',
        '- 内容策略：叙事驱动的探索之旅',
        '- 文风特征：有故事感但不失专业，逻辑清晰，可读性强',
        '- 叙事重点：误区/痛点 -> 关键洞察 -> 方法拆解 -> 行动建议',
        '- 标题偏好：兼顾信息量与网感，强调读后可执行',
        '- 禁忌：空泛鸡汤、结论跳步、无证据类判断',
      ].join('\n'),
    );

    const restoreConfig = withEnv({
      REDCUBE_CONFIG_HOME: fakeConfigHome,
    });
    try {
      await createDeliverable({
        workspaceRoot,
        overlay: 'xiaohongshu',
        profileId: 'standard_note',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        title: 'AI 工作流测试',
        goal: '验证 workspace 作者档案会稳定进入小红书交付链路',
      });

      for (const route of [
        'research',
        'storyline',
        'single_note_plan',
        'visual_direction',
        'render_html',
        'visual_director_review',
        'screenshot_review',
        'publish_copy',
        'export_bundle',
      ]) {
        const result = await runDeliverableRoute({
          workspaceRoot,
          overlay: 'xiaohongshu',
          topicId: 'topic-a',
          deliverableId: 'note-a',
          route,
        });
        assert.equal(result.ok, true, route);
      }

      const deliverableDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', 'note-a');
      const stableHtml = readFileSync(path.join(deliverableDir, 'views', 'note-a.html'), 'utf-8');
      const publishCopy = readJson(path.join(deliverableDir, 'artifacts', 'publish_copy.json'));
      const exportBundle = readJson(path.join(deliverableDir, 'artifacts', 'publish_bundle.json'));

      assert.match(stableHtml, /旅行中的人类学家/);
      assert.match(stableHtml, /一切有迹可循 · RedCube AI/);
      assert.equal(publishCopy.publish_copy.author_signature.signature_display, '旅行中的人类学家');
      assert.equal(publishCopy.publish_copy.author_signature.signature_subtitle, '一切有迹可循 · RedCube AI');
      assert.equal(existsSync(path.join(deliverableDir, 'publish', 'README.md')), true);
      assert.equal(existsSync(path.join(deliverableDir, 'publish', 'manifest.json')), true);
      assert.equal(existsSync(path.join(deliverableDir, 'publish', 'note-a.html')), true);
      assert.equal(existsSync(path.join(deliverableDir, 'publish', 'note-a-caption.txt')), true);
      assert.equal(exportBundle.export_bundle.publish_dir, path.join(deliverableDir, 'publish'));
      assert.equal(exportBundle.export_bundle.publish_html_file, path.join(deliverableDir, 'publish', 'note-a.html'));
      assert.equal(exportBundle.export_bundle.publish_caption_file, path.join(deliverableDir, 'publish', 'note-a-caption.txt'));
      assert.equal(exportBundle.export_bundle.author_signature.signature_display, '旅行中的人类学家');
    } finally {
      restoreConfig();
    }
  });
});

test('xiaohongshu render_html keeps stable HTML empty until screenshot_review passes and exposes current candidate separately', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-current-surface-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: 'P19 小红书当前候选 surface',
      goal: '验证 render_html 只写当前候选，不抢占稳定交付版',
    });

    for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html']) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const deliverableDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', 'note-a');
    const stableViewHtmlFile = path.join(deliverableDir, 'views', 'note-a.html');
    const draftViewHtmlFile = path.join(deliverableDir, 'views', 'note-a.draft.html');
    const currentCandidateHtmlFile = path.join(deliverableDir, 'views', 'note-a.current.html');
    const viewsReadmeFile = path.join(deliverableDir, 'views', 'README.md');

    assert.equal(existsSync(stableViewHtmlFile), false);
    assert.equal(existsSync(draftViewHtmlFile), true);
    assert.equal(existsSync(currentCandidateHtmlFile), true);
    assert.equal(readFileSync(currentCandidateHtmlFile, 'utf-8'), readFileSync(draftViewHtmlFile, 'utf-8'));
    assert.equal(existsSync(viewsReadmeFile), true);
    assert.match(readFileSync(viewsReadmeFile, 'utf-8'), /当前候选 HTML：note-a\.current\.html/);
  });
});

test('xiaohongshu review stages self-heal current candidate alias from the live draft source', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-current-heal-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: 'P21 小红书 current candidate 自愈',
      goal: '验证 review 阶段会把 current.html 自愈回当前候选源，避免 draft/current 分叉',
    });

    for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html']) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const deliverableDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', 'note-a');
    const draftViewHtmlFile = path.join(deliverableDir, 'views', 'note-a.draft.html');
    const currentCandidateHtmlFile = path.join(deliverableDir, 'views', 'note-a.current.html');
    writeText(currentCandidateHtmlFile, '<html><body>stale current candidate</body></html>');
    assert.notEqual(readFileSync(currentCandidateHtmlFile, 'utf-8'), readFileSync(draftViewHtmlFile, 'utf-8'));

    const reviewResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      route: 'visual_director_review',
    });
    assert.equal(reviewResult.ok, true);
    assert.equal(readFileSync(currentCandidateHtmlFile, 'utf-8'), readFileSync(draftViewHtmlFile, 'utf-8'));
  });
});

test('xiaohongshu fix_html targets weak_pages together with blocked pages in the same rerun batch', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-weak-page-targeting-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: 'P19 小红书弱页同轮修复',
      goal: '验证 fix_html 会把 weak_pages 与 blocked 页一起纳入修页目标',
    });

    const restoreVariant = withEnv({
      REDCUBE_MOCK_XHS_RENDER_VARIANT: 'repair_marker_extra_weak',
      REDCUBE_MOCK_XHS_SCREENSHOT_REVIEW_VARIANT: 'block_with_extra_weak_page',
    });
    try {
      for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review']) {
        const result = await runDeliverableRoute({
          workspaceRoot,
          overlay: 'xiaohongshu',
          topicId: 'topic-a',
          deliverableId: 'note-a',
          route,
        });
        assert.equal(result.ok, true, route);
      }

      const reviewResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route: 'screenshot_review',
      });
      assert.equal(reviewResult.ok, false);

      const fixResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route: 'fix_html',
      });
      assert.equal(fixResult.ok, true);
      const fixArtifact = readJson(fixResult.artifactFile);
      assert.deepEqual(
        fixArtifact.html_bundle.repair_scope.target_slide_ids,
        ['N02', 'N04'],
      );
    } finally {
      restoreVariant();
    }
  });
});

test('xiaohongshu fix_html uses runtime-owned repair summary when model omits render_summary', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-fix-summary-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: 'P21 小红书 fix_html 摘要归 runtime',
      goal: '验证 fix_html 在模型不回 render_summary 时仍能完成局部修页',
    });

    const restoreVariant = withEnv({
      REDCUBE_MOCK_XHS_RENDER_VARIANT: 'repair_marker,omit_render_summary_on_fix',
      REDCUBE_MOCK_XHS_SCREENSHOT_REVIEW_VARIANT: 'block_until_fix_html',
    });
    try {
      for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review']) {
        const result = await runDeliverableRoute({
          workspaceRoot,
          overlay: 'xiaohongshu',
          topicId: 'topic-a',
          deliverableId: 'note-a',
          route,
        });
        assert.equal(result.ok, true, route);
      }

      const reviewResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route: 'screenshot_review',
      });
      assert.equal(reviewResult.ok, false);

      const fixResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route: 'fix_html',
      });
      assert.equal(fixResult.ok, true);

      const fixArtifact = readJson(fixResult.artifactFile);
      assert.deepEqual(fixArtifact.html_bundle.repair_scope.target_slide_ids, ['N02']);
      assert.equal(Array.isArray(fixArtifact.html_bundle.render_summary), true);
      assert.match(fixArtifact.html_bundle.render_summary[0], /N02/);
      assert.match(fixArtifact.html_bundle.render_summary[1], /可发布间距|遮挡|贴边/);
    } finally {
      restoreVariant();
    }
  });
});

test('xiaohongshu fix_html honors operator-targeted slide revision briefs even when screenshot_review already passes', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-operator-revision-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: 'P21 小红书定点返修入口',
      goal: '验证 operator 点名返修时，fix_html 可以只修指定卡片',
    });

    const restoreVariant = withEnv({
      REDCUBE_MOCK_XHS_RENDER_VARIANT: 'require_operator_revision_context',
    });
    try {
      for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review']) {
        const result = await runDeliverableRoute({
          workspaceRoot,
          overlay: 'xiaohongshu',
          topicId: 'topic-a',
          deliverableId: 'note-a',
          route,
        });
        assert.equal(result.ok, true, route);
      }

      const revisionBriefFile = path.join(
        workspaceRoot,
        'topics',
        'topic-a',
        'deliverables',
        'note-a',
        'views',
        'operator',
        '当前返修要求.md',
      );
      writeText(revisionBriefFile, [
        '# 当前返修要求',
        '',
        '```json',
        JSON.stringify({
          target_slide_ids: ['N06'],
          global_requirements: ['把成组模块真正收进父容器，恢复稳定内边距。'],
          slide_feedback: [
            {
              slide_id: 'N06',
              issues: ['最下层子卡超出父组块边界。'],
              keep: ['维持当前三层职责切分和语义图标。'],
              avoid: ['不要整套重绘。'],
            },
          ],
        }, null, 2),
        '```',
        '',
      ].join('\n'));

      const fixResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route: 'fix_html',
      });
      assert.equal(fixResult.ok, true);

      const fixArtifact = readJson(fixResult.artifactFile);
      assert.deepEqual(fixArtifact.html_bundle.repair_scope.target_slide_ids, ['N06']);
    } finally {
      restoreVariant();
    }
  });
});

test('xiaohongshu screenshot_review keeps local visual blocks on fix_html even when director_intent_landed turns soft-false', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-soft-director-false-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: 'P21 小红书局部返修升级策略',
      goal: '验证局部遮挡场景即使 director_intent_landed 软性为 false 也继续走 fix_html',
    });

    const restoreVariant = withEnv({
      REDCUBE_MOCK_XHS_SCREENSHOT_REVIEW_VARIANT: 'local_block_with_director_soft_false',
    });
    try {
      for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review']) {
        const result = await runDeliverableRoute({
          workspaceRoot,
          overlay: 'xiaohongshu',
          topicId: 'topic-a',
          deliverableId: 'note-a',
          route,
        });
        assert.equal(result.ok, true, route);
      }

      const reviewResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route: 'screenshot_review',
      });
      assert.equal(reviewResult.ok, false);

      const deliverableDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', 'note-a');
      const reviewState = readJson(path.join(deliverableDir, 'reports', 'review-state.json'));
      assert.equal(reviewState.latest_checks.director_intent_landed, false);
      assert.equal(reviewState.rerun_from_stage, 'fix_html');
    } finally {
      restoreVariant();
    }
  });
});

test('xiaohongshu rerender keeps stable views untouched and writes candidate draft separately', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-stable-views-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: 'P19 小红书稳定视图验证',
      goal: '验证小红书候选稿不会覆盖稳定视图，且稳定截图入口与通过 capture 对齐',
    });

    const routes = ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review'];
    const results = [];
    for (const route of routes) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route,
      });
      assert.equal(result.ok, true, route);
      results.push(result);
    }

    const deliverableDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', 'note-a');
    const stableViewHtmlFile = path.join(deliverableDir, 'views', 'note-a.html');
    const draftViewHtmlFile = path.join(deliverableDir, 'views', 'note-a.draft.html');
    const currentCandidateHtmlFile = path.join(deliverableDir, 'views', 'note-a.current.html');

    const stableViewHtmlContent = readFileSync(stableViewHtmlFile, 'utf-8');
    const stableViewHtmlStat = statSync(stableViewHtmlFile).mtimeMs;

    await new Promise((resolve) => setTimeout(resolve, 25));
    const rerender = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      route: 'render_html',
    });
    assert.equal(rerender.ok, true);

    assert.equal(statSync(stableViewHtmlFile).mtimeMs, stableViewHtmlStat);
    assert.equal(readFileSync(stableViewHtmlFile, 'utf-8'), stableViewHtmlContent);
    assert.equal(existsSync(draftViewHtmlFile), true);
    assert.equal(existsSync(currentCandidateHtmlFile), true);
    assert.equal(readFileSync(currentCandidateHtmlFile, 'utf-8'), readFileSync(draftViewHtmlFile, 'utf-8'));
  });
});

test('xiaohongshu export_bundle records the stable reviewed HTML instead of the latest draft candidate', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-export-stable-html-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: 'P19 小红书稳定导出 HTML',
      goal: '验证 export_bundle 记录的 html_file 指向稳定通过版',
    });

    for (const route of [
      'research',
      'storyline',
      'single_note_plan',
      'visual_direction',
      'render_html',
      'visual_director_review',
      'screenshot_review',
      'publish_copy',
      'export_bundle',
    ]) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const deliverableDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', 'note-a');
    const exportArtifact = readJson(path.join(deliverableDir, 'artifacts', 'publish_bundle.json'));
    assert.equal(exportArtifact.export_bundle.html_file, path.join(deliverableDir, 'views', 'note-a.html'));
  });
});

test('xiaohongshu marks an existing publish package stale when a newer candidate is blocked by screenshot_review', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-publish-stale-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: 'P21 小红书 publish stale 标记',
      goal: '验证当前候选阻断时，旧 publish 包不会继续伪装成最新版',
    });

    for (const route of [
      'research',
      'storyline',
      'single_note_plan',
      'visual_direction',
      'render_html',
      'visual_director_review',
      'screenshot_review',
      'publish_copy',
      'export_bundle',
    ]) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const deliverableDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', 'note-a');
    const publishManifestFile = path.join(deliverableDir, 'publish', 'manifest.json');
    const publishReadmeFile = path.join(deliverableDir, 'publish', 'README.md');
    assert.equal(readJson(publishManifestFile).delivery_state.current, 'output_ready');

    const restoreVariant = withEnv({
      REDCUBE_MOCK_XHS_RENDER_VARIANT: 'repair_marker',
      REDCUBE_MOCK_XHS_SCREENSHOT_REVIEW_VARIANT: 'block_until_fix_html',
    });
    try {
      for (const route of ['render_html', 'visual_director_review']) {
        const result = await runDeliverableRoute({
          workspaceRoot,
          overlay: 'xiaohongshu',
          topicId: 'topic-a',
          deliverableId: 'note-a',
          route,
        });
        assert.equal(result.ok, true, route);
      }

      const reviewResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route: 'screenshot_review',
      });
      assert.equal(reviewResult.ok, false);
    } finally {
      restoreVariant();
    }

    const staleManifest = readJson(publishManifestFile);
    assert.equal(staleManifest.delivery_state.current, 'stale_previous_output');
    assert.equal(staleManifest.delivery_state.latest_candidate_status, 'blocked_for_revision');
    assert.equal(staleManifest.delivery_state.latest_candidate_html_file, path.join(deliverableDir, 'views', 'note-a.current.html'));
    assert.equal(staleManifest.delivery_state.latest_review_screenshots_dir, path.join(deliverableDir, 'reports', 'screenshots'));
    assert.match(readFileSync(publishReadmeFile, 'utf-8'), /当前 publish 包状态：stale_previous_output/);
    assert.match(readFileSync(publishReadmeFile, 'utf-8'), /最新候选 HTML：\.\.\/views\/note-a\.current\.html/);
    assert.match(readFileSync(publishReadmeFile, 'utf-8'), /最新审稿截图：\.\.\/reports\/screenshots/);
  });
});
