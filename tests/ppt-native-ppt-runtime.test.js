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
    const expectedEngineContract = {
      kind: 'redcube_native_ppt_python_engine',
      language: 'python',
      contract_version: 1,
      owned_routes: ['author_pptx_native', 'repair_pptx_native'],
      input_boundary: 'slide_blueprint_plus_visual_direction_json',
      review_boundary: 'rendered_pptx_screenshots',
    };
    assert.deepEqual(authored.native_ppt_bundle?.engine_contract, expectedEngineContract);
    assert.equal(authored.native_ppt_bundle?.shape_manifest_schema_version, 1);
    assert.equal(existsSync(authored.native_ppt_bundle?.pptx_file), true);
    assert.equal(existsSync(authored.native_ppt_bundle?.shape_manifest_file), true);
    const shapeManifest = readJson(authored.native_ppt_bundle.shape_manifest_file);
    assert.equal(shapeManifest.schema_version, 1);
    assert.deepEqual(shapeManifest.engine_contract, expectedEngineContract);
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

    const deliverableDir = path.join(workspaceRoot, 'topics', 'topic-a', 'deliverables', 'deck-repair');
    const screenshotReviewFile = path.join(deliverableDir, 'artifacts', 'quality_gate.json');
    writeJson(screenshotReviewFile, {
      route: 'screenshot_review',
      status: 'block',
      checks: {
        overflow_free: false,
        occlusion_free: true,
        visual_density_ok: true,
        speaker_fit_ok: true,
        edge_clearance_ok: false,
        block_content_fit_ok: true,
        title_typography_ok: true,
      },
      slide_reviews: [
        {
          slide_id: 'S02',
          title: '阻断页',
          layout_family: 'multi_zone_compare',
          screenshot_file: '',
          status: 'block',
          checks: {
            overflow_free: false,
            occlusion_free: true,
            visual_density_ok: true,
            speaker_fit_ok: true,
          },
          metrics: {},
          issues: ['overflow_detected', 'edge_clearance_out_of_range'],
          ai_review: {
            judgement: 'block',
            visual_findings: ['S02 底部说明贴边，需要直接修 PPTX 页面。'],
            recommended_fix: '上移并压缩底部文案，恢复卡内底部留白。',
          },
        },
      ],
    });

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
    assert.equal(repaired.native_ppt_repair_log?.consumed_review_stage, 'screenshot_review');
    assert.equal(repaired.native_ppt_bundle?.repair_log_file, repaired.native_ppt_repair_log?.repair_log_file);
    assert.equal(existsSync(repaired.native_ppt_repair_log?.repair_log_file), true);
  });
});
