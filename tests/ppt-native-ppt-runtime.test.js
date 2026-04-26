import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import {
  createDeliverable,
  runDeliverableRoute,
} from '../packages/redcube-gateway/src/index.js';
import { withMockHermesUpstream } from './helpers/mock-codex-cli.js';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function writeJson(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function nativeEngineContract() {
  return readJson(path.resolve('contracts/runtime-program/ppt-native-python-engine-contract.json'));
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

test('native PPT lane authors editable PPTX and still passes review/export gates', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-native-ppt-'));
    await runNativePlanningChain({ workspaceRoot });

    const authorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-native',
      route: 'author_pptx_native',
    });
    assert.equal(authorResult.ok, true);
    const authored = readJson(authorResult.artifactFile);
    assert.equal(authored.native_ppt_bundle?.editable_artifact, true);
    assert.deepEqual(authored.ai_first_editing_contract, {
      contract_id: 'ppt_native_ai_first_editing_contract_v1',
      creative_owner: 'llm_agent',
      editable_shape_plan_required: true,
      editable_shape_manifest_required: true,
      python_helper_role: 'execute_validate_export_only',
      template_substitution_allowed: false,
      preserved_gates: ['visual_director_review', 'screenshot_review', 'export_pptx'],
    });
    assert.equal(authored.unit_repair_scope?.scope, 'deck');
    assert.equal(authored.native_ppt_bundle?.ai_first_editing_contract?.creative_owner, 'llm_agent');
    assert.equal(existsSync(authored.native_ppt_bundle?.editable_shape_plan_file), true);
    const editableShapePlan = readJson(authored.native_ppt_bundle.editable_shape_plan_file);
    assert.equal(editableShapePlan.contract_kind, 'redcube_ai_first_native_ppt_shape_plan');
    assert.equal(editableShapePlan.slides.length, authored.native_ppt_bundle?.slides.length);
    assert.equal(editableShapePlan.slides.every((slide) => Array.isArray(slide.native_shapes) && slide.native_shapes.length >= 2), true);
    const expectedEngineContract = nativeEngineContract();
    assert.deepEqual(authored.native_ppt_bundle?.engine_contract, expectedEngineContract);
    assert.equal(
      authored.native_ppt_bundle?.engine_contract_file,
      path.resolve('contracts/runtime-program/ppt-native-python-engine-contract.json'),
    );
    assert.equal(authored.native_ppt_bundle?.shape_manifest_schema_version, 1);
    assert.equal(existsSync(authored.native_ppt_bundle?.pptx_file), true);
    assert.equal(existsSync(authored.native_ppt_bundle?.shape_manifest_file), true);
    const shapeManifest = readJson(authored.native_ppt_bundle.shape_manifest_file);
    assert.equal(shapeManifest.schema_version, 1);
    assert.deepEqual(shapeManifest.engine_contract, expectedEngineContract);
    assert.equal(shapeManifest.engine_contract_file, authored.native_ppt_bundle.engine_contract_file);
    assert.deepEqual(shapeManifest.ai_first_editing_contract, authored.ai_first_editing_contract);
    assert.equal(shapeManifest.editable_shape_plan_file, authored.native_ppt_bundle.editable_shape_plan_file);
    assert.equal(authored.native_ppt_bundle?.source_visual_route, 'author_pptx_native');
    assert.equal(authored.native_ppt_bundle?.slides.length >= 6, true);
    assert.equal(
      authored.native_ppt_bundle.slides.every((slide) => slide.text_box_count >= 2 && slide.shape_count >= 2),
      true,
    );
    assert.equal(
      authored.native_ppt_bundle.preview_screenshots.every((file) => existsSync(file)),
      true,
    );

    for (const route of ['visual_director_review', 'screenshot_review', 'export_pptx']) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-native',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const exportArtifactFile = path.join(
      workspaceRoot,
      'topics',
      'topic-a',
      'deliverables',
      'deck-native',
      'artifacts',
      'publish_bundle.json',
    );
    const exported = readJson(exportArtifactFile);
    assert.equal(exported.export_bundle?.source_visual_route, 'author_pptx_native');
    assert.equal(exported.export_bundle?.source_pptx, authored.native_ppt_bundle.pptx_file);
    assert.equal(exported.export_bundle?.native_ppt_shape_manifest, authored.native_ppt_bundle.shape_manifest_file);
    assert.equal(existsSync(exported.export_bundle?.pptx_file), true);
    assert.equal(existsSync(exported.export_bundle?.pdf_file), true);
  });
});

test('native PPT proof lane records the Python engine contract as the single ownership source', () => {
  const engineContract = nativeEngineContract();
  const proofLane = readJson(path.resolve('contracts/runtime-program/ppt-native-authoring-proof-lane.json'));
  const currentProgram = readJson(path.resolve('contracts/runtime-program/current-program.json'));

  assert.equal(engineContract.language, 'python');
  assert.deepEqual(engineContract.owned_routes, ['author_pptx_native', 'repair_pptx_native']);
  assert.deepEqual(engineContract.ai_first_boundary, {
    creative_owner: 'llm_agent',
    helper_role: 'execute_validate_export_only',
    template_substitution_allowed: false,
    editable_shape_plan_required: true,
    editable_shape_manifest_required: true,
  });
  assert.equal(
    proofLane.candidate_route_model.runtime_executor_proof.engine_contract,
    'contracts/runtime-program/ppt-native-python-engine-contract.json',
  );
  assert.equal(
    currentProgram.current_state.exploration_lanes.ppt_native_authoring_proof_lane.engine_contract,
    'contracts/runtime-program/ppt-native-python-engine-contract.json',
  );
});

test('native PPT repair consumes screenshot feedback and targets blocked slides', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-native-ppt-repair-'));
    await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-repair' });

    const authorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-repair',
      route: 'author_pptx_native',
    });
    assert.equal(authorResult.ok, true);

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

    const deliverableDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', 'deck-repair');
    const screenshotReviewFile = path.join(deliverableDir, 'artifacts', 'quality_gate.json');
    const priorReview = readJson(screenshotReviewFile);
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
    writeJson(screenshotReviewFile, blockedReview);

    const repairResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-repair',
      route: 'repair_pptx_native',
    });
    assert.equal(repairResult.ok, true);
    const repaired = readJson(repairResult.artifactFile);
    assert.equal(repaired.native_ppt_bundle?.source_visual_route, 'repair_pptx_native');
    assert.equal(existsSync(repaired.native_ppt_bundle?.pptx_file), true);
    assert.deepEqual(repaired.native_ppt_repair_log?.target_slide_ids, ['S02']);
    assert.deepEqual(repaired.unit_repair_scope?.target_slide_ids, ['S02']);
    assert.equal(repaired.unit_repair_scope?.scope, 'page');
    assert.equal(repaired.ai_first_editing_contract?.python_helper_role, 'execute_validate_export_only');
    assert.equal(repaired.native_ppt_repair_log?.consumed_review_stage, 'screenshot_review');
    assert.equal(repaired.native_ppt_bundle?.repair_log_file, repaired.native_ppt_repair_log?.repair_log_file);
    assert.equal(existsSync(repaired.native_ppt_repair_log?.repair_log_file), true);

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
