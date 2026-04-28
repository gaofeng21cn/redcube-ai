// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import {
  createDeliverable,
  intakeSource,
  runDeliverableRoute,
} from './gateway-test-api.ts';
import { withMockHermesUpstream } from './helpers/mock-codex-cli.ts';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function expectSharedSummary(summary, role) {
  assert.equal(summary.authoritative_source_kind, 'shared_source_truth');
  assert.equal(summary.consumption_role, role);
  assert.equal(typeof summary.input_mode, 'string');
  assert.equal(typeof summary.confidence, 'string');
  assert.equal(typeof summary.material_count, 'number');
  assert.equal(Array.isArray(summary.material_ids), true);
  assert.equal(Array.isArray(summary.source_labels), true);
  assert.equal(summary.source_audit_status, 'pass');
  assert.equal(Array.isArray(summary.source_audit_blocking_reasons), true);
}

test('ppt_deck emits shared source_truth_consumption across story and visual routes', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-family-source-truth-'));
    await intakeSource({
      workspaceRoot,
      topicId: 'topic-a',
      title: '甲状腺门诊科普',
      brief: '为本科生讲授甲状腺基础知识，需要围绕定义、检查、误区与判断顺序组织正式课件。',
      keywords: ['甲状腺', '教学', '门诊科普'],
    });
    const created = await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '甲状腺门诊科普 deck',
      goal: '为本科生讲授甲状腺基础知识',
    });
    const hydratedContract = readJson(path.join(path.dirname(created.deliverableFile), 'contracts', 'hydrated-deliverable.json'));
    assert.equal(hydratedContract.source_truth_contract.authoritative_surface, 'shared_source_truth');

    for (const [route, role] of [
      ['storyline', 'story_architecture'],
      ['detailed_outline', 'story_architecture'],
      ['slide_blueprint', 'story_architecture'],
      ['visual_direction', 'visual_authorship'],
    ]) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
      const artifact = readJson(result.artifactFile);
      expectSharedSummary(artifact.source_truth_consumption, role);
    }
  });
});

test('xiaohongshu emits shared source_truth_consumption across source/story/visual routes', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-family-source-truth-'));
    await intakeSource({
      workspaceRoot,
      topicId: 'topic-a',
      title: '甲状腺门诊科普图文',
      brief: '为门诊患者生成可发布的小红书科普图文，需要强调检查、误区与行动建议。',
      keywords: ['甲状腺', '门诊', '小红书'],
    });
    const created = await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: '甲状腺门诊小红书科普',
      goal: '为门诊患者生成可发布的科普图文',
    });
    const hydratedContract = readJson(path.join(path.dirname(created.deliverableFile), 'contracts', 'hydrated-deliverable.json'));
    assert.equal(hydratedContract.source_truth_contract.authoritative_surface, 'shared_source_truth');

    for (const [route, role] of [
      ['research', 'source_readiness'],
      ['storyline', 'story_architecture'],
      ['single_note_plan', 'story_architecture'],
      ['visual_direction', 'visual_authorship'],
    ]) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route,
      });
      assert.equal(result.ok, true, route);
      const artifact = readJson(result.artifactFile);
      expectSharedSummary(artifact.source_truth_consumption, role);
    }
  });
});

test('ppt_deck and xiaohongshu share a machine-readable source_pack federation for the same topic', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-pack-federation-'));
    const intake = await intakeSource({
      workspaceRoot,
      topicId: 'topic-federated',
      title: '甲状腺门诊跨 family 科普',
      brief: '同一个 topic 的冻结素材需要同时支撑 PPT 与小红书产出，且后续 family 可以继续并行消费。',
      keywords: ['甲状腺', 'PPT', '小红书'],
    });

    assert.equal(intake.artifactFiles.sourcePackFederationFile.endsWith('canonical/source-pack-federation.json'), true);
    const intakeFederation = readJson(intake.artifactFiles.sourcePackFederationFile);
    assert.equal(intakeFederation.artifact_kind, 'cross_family_source_pack_federation');
    assert.equal(intakeFederation.topic_id, 'topic-federated');
    assert.equal(intakeFederation.source_pack.authoritative_source_kind, 'shared_source_truth');
    assert.equal(intakeFederation.source_pack.readiness.sufficiency_status, intake.augmentation.trigger.source_sufficiency_status);
    assert.deepEqual(intakeFederation.consumer_families, []);

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-federated',
      deliverableId: 'deck-federated',
      title: '甲状腺门诊跨 family PPT',
      goal: '生成可授课 PPT',
    });
    const createdNote = await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-federated',
      deliverableId: 'note-federated',
      title: '甲状腺门诊跨 family 小红书',
      goal: '生成可发布小红书图文',
    });

    const federation = readJson(intake.artifactFiles.sourcePackFederationFile);
    assert.equal(createdNote.sourcePackFederationFile, intake.artifactFiles.sourcePackFederationFile);
    assert.equal(federation.source_pack.artifact_files.source_readiness_pack, 'canonical/source-readiness-pack.json');
    assert.equal(federation.source_pack.artifact_files.source_index, 'canonical/source-index.json');
    assert.equal(federation.source_pack.artifact_files.source_pack_manifest, 'canonical/source-pack-manifest.json');
    assert.deepEqual(
      federation.consumer_families.map((consumer) => consumer.family_id),
      ['ppt_deck', 'xiaohongshu'],
    );
    assert.deepEqual(
      federation.consumer_families.map((consumer) => consumer.deliverables[0].deliverable_id),
      ['deck-federated', 'note-federated'],
    );
    assert.equal(federation.parallel_family_ready, true);
  });
});

test('poster_onepager keeps guarded knowledge-poster boundary while emitting shared source_truth_consumption', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-family-source-truth-'));
    await intakeSource({
      workspaceRoot,
      topicId: 'topic-a',
      title: '甲状腺门诊知识海报',
      brief: '为门诊患者生成单页知识海报，需要强调判断顺序、证据要点和行动建议。',
      keywords: ['甲状腺', '海报', '门诊知识'],
    });
    const created = await createDeliverable({
      workspaceRoot,
      overlay: 'poster_onepager',
      profileId: 'knowledge_poster',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      title: '甲状腺门诊知识海报',
      goal: '为门诊患者生成单页知识海报',
    });
    const hydratedContract = readJson(path.join(path.dirname(created.deliverableFile), 'contracts', 'hydrated-deliverable.json'));
    assert.equal(hydratedContract.profile_id, 'knowledge_poster');
    assert.equal(hydratedContract.source_truth_contract.poster_guarded_boundary.academic_contract_active, false);

    for (const [route, role] of [
      ['storyline', 'story_architecture'],
      ['poster_blueprint', 'story_architecture'],
      ['visual_direction', 'visual_authorship'],
    ]) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'poster_onepager',
        topicId: 'topic-a',
        deliverableId: 'poster-a',
        route,
      });
      assert.equal(result.ok, true, route);
      const artifact = readJson(result.artifactFile);
      expectSharedSummary(artifact.source_truth_consumption, role);
    }
  });
});


test('ppt_deck treats operator slide plans as suggestions unless they are approved session artifacts', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-slide-plan-suggestion-'));
    const sourceOutline = Array.from({ length: 32 }, (_, index) => `## Slide ${index + 1}: 来源资料建议页 ${index + 1}`).join('\n\n');
    const sourceOutlineFile = path.join(workspaceRoot, 'source-outline.md');
    writeFileSync(sourceOutlineFile, sourceOutline, 'utf-8');
    await intakeSource({
      workspaceRoot,
      topicId: 'topic-approved-plan',
      title: 'OPL 系列项目介绍',
      brief: '介绍 OPL 系列项目和 Med Auto Science 自动科研，面向医生专家，20 分钟以上。',
      sourceFiles: [sourceOutlineFile],
    });
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-approved-plan',
      deliverableId: 'deck-approved-plan',
      title: 'OPL 系列项目介绍',
      goal: '来源资料里有 32 页逐页建议，但本轮没有人工批准逐页计划；AI 应基于完整资料自行规划。',
    });

    const storylineResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-approved-plan',
      deliverableId: 'deck-approved-plan',
      route: 'storyline',
    });
    assert.equal(storylineResult.ok, true);

    const outlineResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-approved-plan',
      deliverableId: 'deck-approved-plan',
      route: 'detailed_outline',
    });
    assert.equal(outlineResult.ok, true);
    const outline = readJson(outlineResult.artifactFile);
    assert.notEqual(outline.detailed_outline.slides.length, 32);
    assert.equal(Number(outline.detailed_outline.slides[0].slide_no), 1);
    assert.equal(outline.detailed_outline.slides.length >= 6, true);

    const blueprintResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-approved-plan',
      deliverableId: 'deck-approved-plan',
      route: 'slide_blueprint',
    });
    assert.equal(blueprintResult.ok, true);
    const blueprint = readJson(blueprintResult.artifactFile);
    assert.notEqual(blueprint.slide_blueprint.slides.length, 32);
    assert.equal(blueprint.slide_blueprint.slides.length, outline.detailed_outline.slides.length);
  });
});
