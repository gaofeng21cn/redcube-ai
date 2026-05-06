// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import {
  applyReviewMutation,
  createDeliverable,
  intakeSource,
  reviewRenderOutput,
  runDeliverableRoute,
} from './gateway-test-api.ts';
import { withMockHermesUpstream } from './mock-codex-cli.ts';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function writeJson(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function stageArtifactFile(created, stageId) {
  const contractFile = path.join(path.dirname(created.deliverableFile), 'contracts', 'hydrated-deliverable.json');
  const contract = readJson(contractFile);
  const stages = [
    ...(Array.isArray(contract.stage_sequence?.stages) ? contract.stage_sequence.stages : []),
    ...(Array.isArray(contract.stage_sequence?.alternate_stages) ? contract.stage_sequence.alternate_stages : []),
  ];
  const stage = stages.find((item) => item.stage_id === stageId);
  return path.join(path.dirname(created.deliverableFile), 'artifacts', stage?.output_artifact || `${stageId}.json`);
}

function xhsRouteArtifact(results, route) {
  return readJson(results.find((item) => item.route === route).result.artifactFile);
}

async function runXhsChain({ workspaceRoot, deliverableId, mode = 'draft_new', baselineDeliverableId = '', visualRoute = 'author_image_pages' }) {
  if (visualRoute === 'author_image_pages' || visualRoute === 'repair_image_pages') {
    process.env.REDCUBE_IMAGE_GENERATION_MOCK = '1';
  }
  const common = {
    workspaceRoot,
    overlay: 'xiaohongshu',
    topicId: 'topic-a',
    deliverableId,
    mode,
    baselineDeliverableId,
  };
  const routes = [
    'research',
    'storyline',
    'single_note_plan',
    'visual_direction',
    visualRoute,
    'visual_director_review',
    'screenshot_review',
    'publish_copy',
  ];
  const results = [];
  for (const route of routes) {
      const result = await runDeliverableRoute({ ...common, route });
      results.push({ route, result });
    }
  return results;
}

test('xiaohongshu ships dedicated official prompt pack', () => {
  const files = [
    'research.md',
    'storyline.md',
    'single_note_plan.md',
    'visual_direction.md',
    'author_image_pages.md',
    'repair_image_pages.md',
    'render_html.md',
    'director_review.md',
    'screenshot_review.md',
    'publish_copy.md',
    'export_bundle.md',
  ].map((file) => path.resolve('prompts', 'xiaohongshu', file));

  for (const file of files) {
    assert.equal(existsSync(file), true, file);
  }
});

test('xiaohongshu author_image_pages writes mocked GPT-Image-2 full-page assets and repair preserves passing pages', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-image-pages-'));
    const created = await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: '甲状腺门诊小红书科普',
      goal: '为门诊患者生成可发布的科普图文',
    });

    process.env.REDCUBE_IMAGE_GENERATION_MOCK = '1';
    for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction']) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const authoredResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      route: 'author_image_pages',
    });
    assert.equal(authoredResult.ok, true);
    const authored = readJson(authoredResult.artifactFile);
    assert.equal(authored.status, 'completed');
    assert.equal(authored.image_generation_runtime.endpoint, '/responses');
    assert.equal(authored.image_generation_runtime.token_persisted, false);
    assert.equal(authored.image_generation_runtime.request_model, 'gpt-image-2');
    assert.equal(authored.image_pages_bundle.source_visual_route, 'author_image_pages');
    assert.equal(authored.image_pages_bundle.dimensions.ratio, '3:4');
    assert.equal(authored.image_pages_bundle.editable, false);
    assert.equal(authored.image_page_manifest.slides.length > 0, true);
    assert.equal(authored.image_generation_calls.length, authored.image_page_manifest.slides.length);
    assert.equal(authored.image_generation_calls[0].default_image_model, 'gpt-image-2');
    assert.equal(authored.image_generation_calls[0].image_generation_tool_options.type, 'image_generation');
    assert.equal(existsSync(authored.image_page_manifest.slides[0].image_file), true);
    assert.equal(existsSync(authored.image_page_manifest.prompt_manifest), true);
    assert.equal(existsSync(authored.image_page_manifest.style_manifest), true);
    assert.equal(existsSync(authored.image_page_manifest.generation_metadata_file), true);
    assert.equal(authored.image_page_manifest.slides[0].dimensions.width, 1086);
    assert.equal(authored.image_page_manifest.slides[0].dimensions.height, 1448);
    const authoredStyleManifest = readJson(authored.image_page_manifest.style_manifest);
    assert.equal(
      authoredStyleManifest.default_style_profile_file.endsWith('prompts/xiaohongshu/image-first-default-style-profile.json'),
      true,
    );
    assert.equal(authoredStyleManifest.style_profile.profile_id, 'xiaohongshu_image_first_medical_handdrawn_note_default_v1');
    assert.equal(authoredStyleManifest.style_reference.mode, 'built_in_style_reference_template');
    assert.equal(authoredStyleManifest.style_reference.artifact_materialization, 'repo_builtin_reference_manifest_only');
    assert.equal(authoredStyleManifest.style_reference.copied_files.length, 0);
    assert.equal(authoredStyleManifest.style_reference.built_in_reference_files.length, 3);
    assert.equal(authoredStyleManifest.fact_copy_guard.reference_images_style_only, true);
    assert.equal(authoredStyleManifest.fact_copy_guard.forbidden_reference_carryover.includes('author_names'), true);
    for (const reference of authoredStyleManifest.style_reference.built_in_reference_files) {
      assert.equal(reference.repo_reference.startsWith('prompts/xiaohongshu/style-references/medical-handdrawn-note-default/'), true);
      assert.equal(existsSync(path.resolve(reference.repo_reference)), true);
      assert.equal(reference.copied_file, '');
      assert.match(reference.file_name, /no_author\.png$/);
    }

    const blockedSlide = authored.image_page_manifest.slides[1] || authored.image_page_manifest.slides[0];
    writeJson(stageArtifactFile(created, 'screenshot_review'), {
      route: 'screenshot_review',
      status: 'block',
      blocked_slide_ids: [blockedSlide.slide_id],
      slide_reviews: authored.image_page_manifest.slides.map((slide) => ({
        slide_id: slide.slide_id,
        title: slide.title,
        status: slide.slide_id === blockedSlide.slide_id ? 'block' : 'pass',
        checks: { block_content_fit_ok: slide.slide_id !== blockedSlide.slide_id },
        issues: slide.slide_id === blockedSlide.slide_id ? ['block_content_overflow_detected'] : [],
        mechanical_issues: slide.slide_id === blockedSlide.slide_id ? ['block_content_overflow_detected'] : [],
        ai_review: {
          judgement: slide.slide_id === blockedSlide.slide_id ? 'block' : 'pass',
          visual_findings: [slide.slide_id === blockedSlide.slide_id ? '文字拥挤，需要重绘整页图' : '可保留'],
          recommended_fix: slide.slide_id === blockedSlide.slide_id ? 'redraw this XHS page only' : 'none',
        },
      })),
    });

    const repairedResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      route: 'repair_image_pages',
    });
    assert.equal(repairedResult.ok, true);
    const repaired = readJson(repairedResult.artifactFile);
    assert.equal(repaired.image_generation_calls.length, 1);
    assert.deepEqual(repaired.repair_image_pages.blocked_slide_ids, [blockedSlide.slide_id]);
    const preservedBefore = authored.image_page_manifest.slides.find((slide) => slide.slide_id !== blockedSlide.slide_id);
    if (preservedBefore) {
      const preservedAfter = repaired.image_page_manifest.slides.find((slide) => slide.slide_id === preservedBefore.slide_id);
      assert.equal(preservedAfter.preserved, true);
      assert.equal(preservedAfter.hash, preservedBefore.hash);
      assert.equal(preservedAfter.preserved_slide_hash, preservedBefore.hash);
    }
  });
});

test('xiaohongshu style_reference_dir replaces built-in no-author style manifest only', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-style-ref-'));
    const styleRefDir = path.join(workspaceRoot, 'operator-style-ref');
    mkdirSync(styleRefDir, { recursive: true });
    writeFileSync(path.join(styleRefDir, 'operator-style.png'), Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000000020001e221bc330000000049454e44ae426082', 'hex'));
    const created = await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: '甲状腺门诊小红书科普',
      goal: '为门诊患者生成可发布的科普图文',
    });
    const contractFile = path.join(path.dirname(created.deliverableFile), 'contracts', 'hydrated-deliverable.json');
    const contract = readJson(contractFile);
    contract.delivery_request = {
      ...(contract.delivery_request || {}),
      style_reference_dir: styleRefDir,
    };
    writeJson(contractFile, contract);

    process.env.REDCUBE_IMAGE_GENERATION_MOCK = '1';
    for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction']) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const authoredResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      route: 'author_image_pages',
    });
    assert.equal(authoredResult.ok, true);
    const authored = readJson(authoredResult.artifactFile);
    const styleManifest = readJson(authored.image_page_manifest.style_manifest);

    assert.equal(styleManifest.style_reference.mode, 'user_style_reference_dir');
    assert.equal(styleManifest.style_reference.artifact_materialization, 'copied_operator_references');
    assert.equal(styleManifest.style_reference.copied_files.length, 1);
    assert.equal(styleManifest.style_reference.copied_files[0].file_name, 'operator-style.png');
    assert.equal(existsSync(styleManifest.style_reference.copied_files[0].copied_file), true);
    assert.equal(styleManifest.fact_copy_guard.reference_images_style_only, true);
  });
});

test('xiaohongshu render_html blocks until single_note_plan and visual_direction exist', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-e2e-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: '甲状腺门诊小红书科普',
      goal: '为门诊患者生成可发布的科普图文',
    });

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      route: 'render_html',
    });

    assert.equal(result.ok, false);
    assert.match(result.run.error.message, /render_html.*single_note_plan.*visual_direction/i);
  });
});

test('xiaohongshu render_html fails when prompt pack shell asset is missing', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-e2e-'));
    const created = await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: '甲状腺门诊小红书科普',
      goal: '为门诊患者生成可发布的科普图文',
    });

    const contractFile = path.join(path.dirname(created.deliverableFile), 'contracts', 'hydrated-deliverable.json');
    const contract = readJson(contractFile);
    contract.prompt_pack.render_contract.shell_file = 'missing-shell.html';
    writeFileSync(contractFile, JSON.stringify(contract, null, 2), 'utf-8');

    for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction']) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      route: 'render_html',
    });

    assert.equal(result.ok, false);
    assert.match(result.run.error.message, /Missing prompt pack asset/i);
  });
});

test('xiaohongshu mainline produces real stage artifacts through publish_copy', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-e2e-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: '甲状腺门诊小红书科普',
      goal: '为门诊患者生成可发布的科普图文',
    });

    const chain = await runXhsChain({ workspaceRoot, deliverableId: 'note-a' });
    for (const { route, result } of chain) {
      assert.equal(result.ok, true, route);
    }

    const research = readJson(chain[0].result.artifactFile);
    assert.equal(typeof research.research?.topic_summary, 'string');
    assert.equal(typeof research.research?.fact_library_summary, 'string');
    assert.equal(Array.isArray(research.research?.reference_source_list), true);
    assert.equal(Array.isArray(research.research?.evidence_gaps), true);
    assert.equal(typeof research.research?.source_sufficiency_judgement, 'string');
    assert.equal(research.research?.audience_judgement ?? null, null);
    assert.equal(research.research?.why_now ?? null, null);
    assert.equal(research.research?.tension ?? null, null);
    assert.equal(research.research?.memory_hook ?? null, null);

    const plan = readJson(chain[2].result.artifactFile);
    assert.equal(Array.isArray(plan.single_note_plan?.title_options), true);
    assert.equal(plan.single_note_plan.title_options.length >= 3, true);
    assert.equal(Array.isArray(plan.single_note_plan?.slides), true);
    assert.equal(plan.single_note_plan.slides.every((slide) => typeof slide.page_goal === 'string' && slide.page_goal.length > 0), true);
    assert.equal(plan.single_note_plan.slides.every((slide) => Array.isArray(slide.page_core_content) && slide.page_core_content.length >= 3), true);
    assert.equal(plan.single_note_plan.slides.every((slide) => typeof slide.visual_presentation?.layout_family === 'string'), true);
    assert.equal(plan.single_note_plan.slides.every((slide) => typeof slide.source_language === 'string' && slide.source_language.length > 0), true);
    assert.equal(plan.single_note_plan.slides.every((slide) => typeof slide.progression_role === 'string' && slide.progression_role.length > 0), true);
    assert.equal(plan.single_note_plan.slides.every((slide) => typeof slide.transition === 'string' && slide.transition.length > 0), true);

    const visual = readJson(chain[3].result.artifactFile);
    assert.equal(visual.candidate_race.status, 'single_candidate_passthrough');
    assert.equal(visual.candidate_race.reuse_claimed, false);
    assert.equal(typeof visual.visual_direction?.director_statement, 'string');
    assert.equal(typeof visual.visual_direction?.visual_motif, 'string');
    assert.equal(Array.isArray(visual.visual_direction?.rhythm_curve), true);
    assert.equal(Array.isArray(visual.visual_direction?.peak_pages), true);
    assert.equal(typeof visual.visual_direction?.page_family_ceiling, 'object');
    assert.equal(Array.isArray(visual.visual_direction?.forbidden_regressions), true);
    assert.equal(Array.isArray(visual.visual_direction?.anti_template_constraints), true);
    assert.equal(typeof visual.visual_direction?.source_language_discipline, 'string');
    assert.equal(Array.isArray(visual.visual_direction?.page_role_table), true);

    const render = readJson(chain[4].result.artifactFile);
    assert.equal(render.route, 'author_image_pages');
    assert.equal(render.image_pages_bundle?.source_visual_route, 'author_image_pages');
    assert.equal(render.image_pages_bundle?.dimensions?.ratio, '3:4');
    assert.equal(render.image_pages_bundle?.editable, false);
    assert.equal(render.image_page_manifest?.slides.length, plan.single_note_plan.slides.length);
    assert.equal(render.image_generation_calls.length, plan.single_note_plan.slides.length);
    assert.equal(render.image_generation_calls[0].default_image_model, 'gpt-image-2');
    assert.equal(render.image_page_manifest.slides.every((slide) => existsSync(slide.image_file)), true);
    assert.equal(existsSync(render.image_page_manifest.prompt_manifest), true);
    assert.equal(existsSync(render.image_page_manifest.style_manifest), true);

    const directorReview = readJson(chain[5].result.artifactFile);
    assert.equal(typeof directorReview.visual_director_review?.director_intent_landed, 'boolean');
    assert.equal(typeof directorReview.visual_director_review?.memory_hook_present, 'boolean');
    assert.equal(typeof directorReview.visual_director_review?.homogeneous_layout_risk, 'number');
    assert.equal(Array.isArray(directorReview.visual_director_review?.weak_pages), true);
    const review = readJson(chain[6].result.artifactFile);
    assert.equal(typeof review.checks?.overflow_free, 'boolean');
    assert.equal(typeof review.checks?.visual_density_ok, 'boolean');
    assert.equal(typeof review.checks?.anti_template_ok, 'boolean');
    assert.equal(typeof review.checks?.memory_hook_present, 'boolean');
    assert.equal(review.slide_reviews.every((slide) => existsSync(slide.screenshot_file)), true);

    const copy = readJson(chain[7].result.artifactFile);
    assert.equal(Array.isArray(copy.publish_copy?.titles), true);
    assert.equal(typeof copy.publish_copy?.body, 'string');
    assert.equal(copy.publish_copy?.quality_gate?.gate_pass, true);

    const report = await reviewRenderOutput({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      checks: {
        ...review.checks,
        ...copy.review_state_patch?.latest_checks,
      },
    });
    assert.equal(report.status, 'pass');
  });
});

test('xiaohongshu explicit render_html route remains available for deterministic HTML maintenance', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-html-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-html',
      title: '甲状腺门诊小红书科普 HTML',
      goal: '验证显式 HTML 分支仍可运行',
    });

    const chain = await runXhsChain({ workspaceRoot, deliverableId: 'note-html', visualRoute: 'render_html' });
    for (const { route, result } of chain) {
      assert.equal(result.ok, true, route);
    }
    const render = xhsRouteArtifact(chain, 'render_html');
    assert.equal(existsSync(render.html_bundle?.html_file), true);
    assert.equal(render.render_execution?.route, 'render_html');
    assert.equal(render.html_bundle?.render_strategy, 'image_first_page_authoring');
    assert.equal(render.html_bundle?.slides.every((slide) => typeof slide.content === 'string' && slide.content.includes('data-recipe-id=')), true);
    const html = readFileSync(render.html_bundle.html_file, 'utf-8');
    assert.match(html, /slide-display-area/);
    assert.match(html, /const slidesData = \[/);
    assert.match(html, /id="redcube-render-plan"/);
  });
});

test('xiaohongshu manual thyroid clinic case keeps clinic-topic fidelity instead of generic tool-flow copy', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-manual-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-01',
      title: '甲状腺门诊小红书科普',
      goal: '为门诊患者生成可发布的科普图文',
    });

    const chain = await runXhsChain({ workspaceRoot, deliverableId: 'note-01' });
    for (const { route, result } of chain) {
      assert.equal(result.ok, true, route);
    }

    const plan = xhsRouteArtifact(chain, 'single_note_plan');
    const copy = xhsRouteArtifact(chain, 'publish_copy');
    const planText = (plan.single_note_plan?.slides || [])
      .map((slide) => [slide.title, ...(slide.page_core_content || [])].join(' '))
      .join(' ');
    assert.equal(/工具清单|先找工具|先看功能/i.test(planText), false);
    assert.equal(/甲状腺|门诊/i.test(`${planText}\n${copy.publish_copy?.body || ''}`), true);
  });
});

test('xiaohongshu optimize_existing binds baseline and emits relative review', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-e2e-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'baseline-a',
      title: '甲状腺门诊小红书科普 baseline',
      goal: '旧版已发布笔记',
    });
    const baselineChain = await runXhsChain({ workspaceRoot, deliverableId: 'baseline-a' });
    assert.equal(baselineChain.at(-1).result.ok, true);
    const baselineApproved = await applyReviewMutation({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'baseline-a',
      mutation: {
        type: 'approve_publish',
        actor: 'human',
        notes: '认可稿基线',
      },
    });
    assert.equal(baselineApproved.state.approval_state.status, 'approved');

    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: '甲状腺门诊小红书科普优化版',
      goal: '在保留旧版优点的前提下提升封面钩子与信息图质量',
    });
    const chain = await runXhsChain({
      workspaceRoot,
      deliverableId: 'note-a',
      mode: 'optimize_existing',
      baselineDeliverableId: 'baseline-a',
    });
    assert.equal(chain.at(-1).result.ok, true);

    const directorReview = readJson(chain[5].result.artifactFile);
    assert.equal(typeof directorReview.visual_director_review?.director_intent_landed, 'boolean');
    assert.equal(typeof directorReview.visual_director_review?.memory_hook_present, 'boolean');
    assert.equal(typeof directorReview.visual_director_review?.homogeneous_layout_risk, 'number');
    assert.equal(Array.isArray(directorReview.visual_director_review?.weak_pages), true);
    const review = readJson(chain[6].result.artifactFile);
    assert.equal(typeof review.checks?.baseline_comparison_passed, 'boolean');
    assert.equal(review.baseline_review?.baseline_deliverable_id, 'baseline-a');
  });
});

test('xiaohongshu export_bundle performs real delivery and series surfaces when needed', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-e2e-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-series',
      title: '甲状腺门诊科普系列',
      goal: '面向门诊患者做系列化科普图文',
    });
    const chain = await runXhsChain({ workspaceRoot, deliverableId: 'note-series' });
    assert.equal(chain.at(-1).result.ok, true);

    const exportResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-series',
      route: 'export_bundle',
    });
    assert.equal(exportResult.ok, true);
    const bundle = readJson(exportResult.artifactFile);
    assert.equal(bundle.export_bundle?.source_surface_kind, 'image_pages');
    assert.equal(bundle.export_bundle?.source_visual_route, 'author_image_pages');
    assert.equal(bundle.export_bundle?.html_file, '');
    assert.equal(bundle.export_bundle?.publish_html_file, '');
    assert.equal(Array.isArray(bundle.export_bundle?.source_artifacts?.pages), true);
    assert.equal(bundle.export_bundle.source_artifacts.pages.length > 0, true);
    assert.equal(
      bundle.export_bundle.source_artifacts.pages.every((page) => existsSync(page.png_file)),
      true,
    );
    assert.equal(existsSync(bundle.export_bundle?.caption_file), true);
    assert.equal(Array.isArray(bundle.export_bundle?.png_files), true);
    assert.equal(bundle.export_bundle.png_files.length > 0, true);
    assert.equal(Array.isArray(bundle.export_bundle?.publish_image_files), true);
    assert.equal(bundle.export_bundle.publish_image_files.length, bundle.export_bundle.png_files.length);
    assert.equal(bundle.export_bundle.publish_image_files.every((file) => existsSync(file)), true);
    assert.equal(typeof bundle.export_bundle?.delivery_state?.current, 'string');
    assert.equal(bundle.export_bundle.delivery_state.current, 'output_ready');
    assert.equal(Object.hasOwn(bundle, 'publication_state_file'), false);
    assert.equal(existsSync(path.join(workspaceRoot, 'topics', 'topic-a', 'publication-state.json')), true);
    assert.equal(existsSync(bundle.series_surfaces?.delivery_overview_file), true);
    assert.equal(existsSync(bundle.series_surfaces?.path_mapping_file), true);
    assert.equal(existsSync(bundle.series_surfaces?.cadence_file), true);
  });
});

test('xiaohongshu research/storyline/plan/visual_direction consume shared source truth', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-source-'));
    const richFile = path.join(workspaceRoot, 'rich-material.md');
    writeFileSync(
      richFile,
      [
        '# 门诊沟通记录',
        '患者最关心的是“先复查还是先吃药”。',
        '如果没有先讲清判断顺序，患者会把时间花在错误动作上。',
        '门诊真实痛点是：把来源翻译成人能理解的话。',
      ].join('\n'),
      'utf-8',
    );

    await intakeSource({
      workspaceRoot,
      topicId: 'topic-rich',
      title: '门诊沟通 rich',
      sourceFiles: [richFile],
    });
    await intakeSource({
      workspaceRoot,
      topicId: 'topic-brief',
      title: '门诊沟通 brief',
      brief: '做一个门诊患者可收藏的判断顺序总结。',
      keywords: ['门诊', '患者', '判断顺序'],
    });

    for (const topicId of ['topic-rich', 'topic-brief']) {
      await createDeliverable({
        workspaceRoot,
        overlay: 'xiaohongshu',
        profileId: 'standard_note',
        topicId,
        deliverableId: `${topicId}-note`,
        title: `交付物 ${topicId}`,
        goal: '验证 shared source truth 消费',
      });
    }

    const richChain = [];
    for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction']) {
      richChain.push(await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-rich',
        deliverableId: 'topic-rich-note',
        route,
      }));
    }
    const briefChain = [];
    for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction']) {
      briefChain.push(await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-brief',
        deliverableId: 'topic-brief-note',
        route,
      }));
    }

    const richResearch = readJson(richChain[0].artifactFile);
    const briefResearch = readJson(briefChain[0].artifactFile);
    assert.equal(richResearch.research?.input_mode, 'files');
    assert.equal(briefResearch.research?.input_mode, 'brief_keywords');
    assert.equal(richResearch.research?.source_truth_material_count > 0, true);
    assert.equal(Array.isArray(richResearch.research?.source_truth_material_ids), true);
    assert.notEqual(richResearch.research?.topic_summary, briefResearch.research?.topic_summary);

    const richStoryline = readJson(richChain[1].artifactFile);
    assert.equal(Array.isArray(richStoryline.storyline?.source_truth_material_ids), true);
    assert.notDeepEqual(richStoryline.storyline?.source_truth_material_ids, briefResearch.research?.source_truth_material_ids || []);

    const richPlan = readJson(richChain[2].artifactFile);
    assert.equal(
      richPlan.single_note_plan.slides.some((slide) => slide.page_core_content.some((item) => item.includes('先复查还是先吃药'))),
      true,
    );

    const richVisual = readJson(richChain[3].artifactFile);
    assert.equal(richVisual.visual_direction?.source_truth_confidence, 'medium');
  });
});
