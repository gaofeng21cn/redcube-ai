import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  canonicalStageForRoute,
  getDeliverablePaths,
  readStageFolderArtifact,
  stageOrderForCanonicalStage,
  writeStageFolderArtifact,
} from '@redcube/runtime-protocol';

import {
  createDeliverable,
  runDeliverableRoute,
} from './product-domain-action-test-api.js';
import { withEnv, withMockCodexRuntime } from './mock-codex-cli.js';
import { mkUserScopedTestWorkspace } from './helpers/test-workspace.js';
import { readJson, writeJson } from './helpers/json-io.ts';

const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  fileURLToPath(new URL('./helpers/mock-redcube-python-with-playwright.js', import.meta.url)),
]);

function readRouteStageArtifact(workspaceRoot, topicId, deliverableId, routeStageId) {
  const canonicalStageId = canonicalStageForRoute(routeStageId);
  const loaded = readStageFolderArtifact({
    deliverablePaths: getDeliverablePaths(workspaceRoot, topicId, deliverableId),
    routeStageId,
    canonicalStageId,
    stageOrder: stageOrderForCanonicalStage(canonicalStageId),
  });
  assert.equal(Boolean(loaded?.artifact), true, routeStageId);
  return loaded.artifact;
}

function writeRouteStageArtifact(workspaceRoot, topicId, deliverableId, routeStageId, artifact) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const canonicalStageId = canonicalStageForRoute(routeStageId);
  const artifactFile = path.join(deliverablePaths.artifactsDir, `${routeStageId}.manual-test-artifact.json`);
  writeJson(artifactFile, artifact);
  writeStageFolderArtifact({
    deliverablePaths,
    programId: deliverablePaths.programId,
    topicId,
    deliverableId,
    routeStageId,
    canonicalStageId,
    stageOrder: stageOrderForCanonicalStage(canonicalStageId),
    attemptId: `manual-${routeStageId}`,
    artifactFile,
    outputName: `${routeStageId}.json`,
    ownerReceiptRefs: artifact?.status === 'block' || artifact?.status === 'failed'
      ? []
      : [`rca-owner-receipt:test:${routeStageId}:${deliverableId}`],
    typedBlockerRefs: artifact?.status === 'block' || artifact?.status === 'failed'
      ? [`rca-typed-blocker:test:${routeStageId}:${deliverableId}`]
      : [],
    blockingReasons: artifact?.blocking_reasons || artifact?.review_state_patch?.blocking_reasons || [],
  });
  return artifactFile;
}

async function runNativePlanningChain({ workspaceRoot, deliverableId = 'deck-native' }) {
  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId,
    title: 'Native PPT 探索 deck',
    goal: '验证 PPT family 可在 HTML 路线之外直接生成可编辑 PPTX',
  });

  for (const route of ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction']) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
      route,
    });
    assert.equal(result.ok, true, route);
  }
}

async function withMockNativePptRuntime(testFn) {
  const restoreEnv = withEnv({
    REDCUBE_PYTHON_COMMAND: MOCK_REDCUBE_PYTHON_COMMAND,
  });
  try {
    return await withMockCodexRuntime(testFn);
  } finally {
    restoreEnv();
  }
}

test('native PPT repair consumes screenshot feedback and targets blocked slides', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-repair-');
    await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-repair' });

    const authorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-repair',
      route: 'author_pptx_native',
    });
    assert.equal(authorResult.ok, true);
    const authored = readJson(authorResult.artifactFile);

    for (const route of ['visual_director_review', 'screenshot_review']) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-repair',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const priorReview = readRouteStageArtifact(workspaceRoot, 'topic-a', 'deck-repair', 'screenshot_review');
    const blockedReview = {
      ...priorReview,
      status: 'block',
      checks: {
        ...priorReview.checks,
        overflow_free: false,
        edge_clearance_ok: false,
        ai_review_passed: false,
      },
      slide_reviews: priorReview.slide_reviews.map((slide) => (
        slide.slide_id === 'S02'
          ? {
              ...slide,
              status: 'block',
              checks: {
                ...slide.checks,
                overflow_free: false,
                edge_clearance_ok: false,
              },
              issues: ['overflow_detected', 'edge_clearance_out_of_range'],
              ai_review: {
                judgement: 'block',
                visual_findings: ['S02 底部说明贴边，需要直接修 PPTX 页面。'],
                recommended_fix: '上移并压缩底部文案，恢复卡内底部留白。',
              },
            }
          : slide
      )),
      review_state_patch: {
        ...priorReview.review_state_patch,
        current_status: 'blocked_for_revision',
        ready_for_export: false,
        pending_reviews: ['overflow_free', 'edge_clearance_ok', 'ai_review_passed'],
        blocking_reasons: ['overflow_free', 'edge_clearance_ok', 'ai_review_passed'],
        rerun_from_stage: 'repair_pptx_native',
        rerun_policy: {
          status: 'rerun_required',
          rerun_from_stage: 'repair_pptx_native',
          default_route: 'repair_pptx_native',
          scope: 'page',
          target_slide_ids: ['S02'],
          source_review_stage: 'screenshot_review',
        },
      },
    };
    writeRouteStageArtifact(workspaceRoot, 'topic-a', 'deck-repair', 'screenshot_review', blockedReview);

    const repairResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-repair',
      route: 'repair_pptx_native',
    });
    assert.equal(repairResult.ok, true);
    const repaired = readJson(repairResult.artifactFile);
    const expectedPreservedSlideIds = authored.native_ppt_bundle.slides
      .map((slide) => slide.slide_id)
      .filter((slideId) => slideId !== 'S02');
    assert.equal(repaired.native_ppt_bundle?.source_visual_route, 'repair_pptx_native');
    assert.equal(existsSync(repaired.native_ppt_bundle?.pptx_file), true);
    assert.deepEqual(repaired.native_ppt_repair_log?.target_slide_ids, ['S02']);
    assert.deepEqual(repaired.native_ppt_repair_log?.preserved_slide_ids, expectedPreservedSlideIds);
    assert.equal(repaired.native_ppt_repair_log?.repair_evidence?.evidence_surface, 'native_ppt_repair_evidence_v1');
    assert.equal(repaired.native_ppt_repair_log?.repair_evidence?.non_blocking_slide_reuse_ok, true);
    assert.equal(repaired.native_ppt_repair_log?.per_slide_hashes.find((slide) => slide.slide_id === 'S02')?.targeted, true);
    assert.equal(
      repaired.native_ppt_repair_log?.per_slide_hashes.find((slide) => slide.slide_id === 'S02')?.hash_status,
      'changed_by_targeted_repair',
    );
    assert.equal(
      repaired.native_ppt_repair_log?.per_slide_hashes.find((slide) => slide.slide_id === 'S01')?.hash_status,
      'unchanged',
    );
    assert.equal(
      repaired.native_ppt_repair_log?.preserved_slide_hashes.every((slide) => slide.proof_status === 'unchanged'),
      true,
    );
    assert.equal(repaired.native_ppt_repair_log?.repair_units[0]?.slide_id, 'S02');
    assert.equal(repaired.native_ppt_repair_log?.repair_units[0]?.input?.source_review_stage, 'screenshot_review');
    assert.equal(
      repaired.native_ppt_repair_log?.repair_units[0]?.reason?.recommended_fix,
      '上移并压缩底部文案，恢复卡内底部留白。',
    );
    assert.ok(repaired.native_ppt_repair_log?.repair_units[0]?.input?.before_slide_hash);
    assert.ok(repaired.native_ppt_repair_log?.repair_units[0]?.output?.after_slide_hash);
    assert.equal(repaired.native_ppt_repair_log?.blocked_slide_ids_source, 'screenshot_review.slide_reviews.status_block');
    assert.equal(repaired.native_ppt_repair_log?.scope, 'page');
    assert.deepEqual(repaired.unit_repair_scope?.target_slide_ids, ['S02']);
    assert.equal(repaired.unit_repair_scope?.scope, 'page');
    assert.equal(repaired.ai_first_editing_contract?.python_helper_role, 'execute_validate_export_only');
    assert.equal(repaired.native_ppt_repair_log?.consumed_review_stage, 'screenshot_review');
    assert.equal(repaired.native_ppt_bundle?.repair_log_file, repaired.native_ppt_repair_log?.repair_log_file);
    assert.equal(existsSync(repaired.native_ppt_repair_log?.repair_log_file), true);
    const repairedShapeManifest = readJson(repaired.native_ppt_bundle.shape_manifest_file);
    const repairedSlides = new Map(repairedShapeManifest.slides.map((slide) => [slide.slide_id, slide]));
    assert.equal(repairedSlides.get('S02')?.repaired, true);
    assert.equal(repairedSlides.get('S01')?.repaired, false);
    assert.equal(repairedSlides.get('S03')?.repaired, false);
    const repairLog = readJson(repaired.native_ppt_repair_log.repair_log_file);
    assert.deepEqual(repairLog.target_slide_ids, ['S02']);
    assert.deepEqual(repairLog.preserved_slide_ids, expectedPreservedSlideIds);
    assert.deepEqual(repairLog.repair_units, repaired.native_ppt_repair_log.repair_units);

    const directorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-repair',
      route: 'visual_director_review',
    });
    assert.equal(directorResult.ok, true);
    const directorReview = readJson(directorResult.artifactFile);
    assert.equal(directorReview.review_execution?.review_scope, 'incremental_page_review');
    assert.deepEqual(directorReview.review_execution?.reviewed_slide_ids, ['S02']);
    assert.equal(directorReview.review_execution?.reused_slide_ids.includes('S01'), true);

    const screenshotResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-repair',
      route: 'screenshot_review',
    });
    assert.equal(screenshotResult.ok, true);
    const screenshotReview = readJson(screenshotResult.artifactFile);
    assert.equal(screenshotReview.review_execution?.review_scope, 'incremental_page_review');
    assert.deepEqual(screenshotReview.review_execution?.reviewed_slide_ids, ['S02']);
    assert.equal(screenshotReview.review_execution?.reused_slide_ids.includes('S01'), true);
    assert.deepEqual(screenshotReview.mechanical_review?.incremental_review?.reviewed_slide_ids, ['S02']);
  });
});

test('native PPT repair can consume visual director native preflight feedback before screenshot review', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-director-repair-');
    await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-director-repair' });

    const authorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-director-repair',
      route: 'author_pptx_native',
    });
    assert.equal(authorResult.ok, true);

    writeRouteStageArtifact(workspaceRoot, 'topic-a', 'deck-director-repair', 'visual_director_review', {
      route: 'visual_director_review',
      status: 'block',
      visual_director_review: {
        director_intent_landed: true,
        anti_template_ok: false,
        weak_pages: ['S01'],
        review_summary: 'deterministic preflight blocked S01: native content slot fill failed; native content depth failed',
        deterministic_preflight: {
          findings: [
            'S01: native content slot fill failed',
            'S01: native content depth failed',
          ],
        },
      },
      review_state_patch: {
        current_status: 'blocked_for_revision',
        ready_for_export: false,
        pending_reviews: ['anti_template_failed'],
        blocking_reasons: ['anti_template_failed'],
        rerun_from_stage: 'repair_pptx_native',
        rerun_policy: {
          status: 'rerun_required',
          rerun_from_stage: 'repair_pptx_native',
        },
      },
    });

    const repairResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-director-repair',
      route: 'repair_pptx_native',
    });
    assert.equal(repairResult.ok, true);
    const repaired = readJson(repairResult.artifactFile);
    assert.equal(repaired.native_ppt_bundle?.source_visual_route, 'repair_pptx_native');
    assert.equal(repaired.native_ppt_repair_log?.feedback_count, 1);
    assert.deepEqual(repaired.native_ppt_repair_log?.target_slide_ids, ['S01']);
    assert.equal(repaired.native_ppt_repair_log?.repair_evidence?.repair_units[0]?.reason?.visual_findings.includes('S01: native content slot fill failed'), true);
    assert.equal(repaired.native_ppt_repair_log?.repair_evidence?.repair_units[0]?.reason?.visual_findings.includes('S01: native content depth failed'), true);
  });
});

test('native PPT repair inherits prior AI design spec lock when targeted repair output omits it', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-repair-spec-lock-');
    const deliverableId = 'deck-repair-spec-lock';
    await runNativePlanningChain({ workspaceRoot, deliverableId });

    const authorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
      route: 'author_pptx_native',
    });
    assert.equal(authorResult.ok, true);
    const authored = readJson(authorResult.artifactFile);
    const authoredPlan = readJson(authored.native_ppt_bundle.editable_shape_plan_file);
    assert.equal(authoredPlan.design_spec_lock?.owner, 'llm_agent');

    writeRouteStageArtifact(workspaceRoot, 'topic-a', deliverableId, 'visual_director_review', {
      route: 'visual_director_review',
      status: 'block',
      visual_director_review: {
        director_intent_landed: true,
        anti_template_ok: false,
        weak_pages: ['S01'],
        review_summary: 'deterministic preflight blocked S01: native content depth failed',
        deterministic_preflight: {
          findings: ['S01: native content depth failed'],
        },
      },
      review_state_patch: {
        current_status: 'blocked_for_revision',
        ready_for_export: false,
        blocking_reasons: ['anti_template_failed'],
        rerun_from_stage: 'repair_pptx_native',
        rerun_policy: {
          status: 'rerun_required',
          rerun_from_stage: 'repair_pptx_native',
        },
      },
    });

    const restoreMutation = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'repair_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'repair_missing_design_spec_lock',
    });
    try {
      const repairResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId,
        route: 'repair_pptx_native',
      });
      assert.equal(repairResult.ok, true);
      const repaired = readJson(repairResult.artifactFile);
      const repairedPlan = readJson(repaired.native_ppt_bundle.editable_shape_plan_file);
      assert.deepEqual(repairedPlan.design_spec_lock, authoredPlan.design_spec_lock);
      assert.equal(repairedPlan.design_spec_lock_inheritance?.source, 'prior_ai_authored_native_shape_plan');
      assert.equal(repairedPlan.design_spec_lock_inheritance?.helper_generated_design, false);
    } finally {
      restoreMutation();
    }
  });
});
