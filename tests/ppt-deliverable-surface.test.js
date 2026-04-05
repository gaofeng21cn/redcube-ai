import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';

import {
  auditDeliverable,
  createDeliverable,
  runDeliverableRoute,
} from '../packages/redcube-gateway/src/index.js';

test('createDeliverable hydrates ppt deck contract surface', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-surface-'));

  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });

  const deliverableDir = path.dirname(created.deliverableFile);
  const surfaceFiles = [
    'contracts/stage-sequence.json',
    'contracts/stage-requirements.json',
    'contracts/prompt-pack.json',
    'contracts/review-surface.json',
    'contracts/layout-rules.json',
    'contracts/baseline-policy.json',
    'contracts/export-bundle.json',
    'contracts/hydrated-deliverable.json',
    'views/display-registry.json',
  ];

  for (const file of surfaceFiles) {
    assert.equal(existsSync(path.join(deliverableDir, file)), true, file);
  }

  const displayRegistry = JSON.parse(
    readFileSync(path.join(deliverableDir, 'views/display-registry.json'), 'utf-8'),
  );
  const hydratedContract = JSON.parse(
    readFileSync(path.join(deliverableDir, 'contracts/hydrated-deliverable.json'), 'utf-8'),
  );
  const promptPack = JSON.parse(
    readFileSync(path.join(deliverableDir, 'contracts/prompt-pack.json'), 'utf-8'),
  );

  assert.deepEqual(
    displayRegistry.surfaces.map((surface) => surface.id),
    [
      'source_index',
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'render_html',
      'screenshot_review',
      'export_pptx',
    ],
  );
  assert.equal(hydratedContract.profile_id, 'lecture_student');
  assert.equal(hydratedContract.export_bundle.bundle_id, 'lecture_student_bundle');
  assert.equal(hydratedContract.prompt_pack.root, 'prompts/ppt_deck');
  assert.equal(hydratedContract.prompt_pack.stages.render_html.file, 'render_html.md');
  assert.equal(hydratedContract.prompt_pack.render_contract.render_strategy, 'prompt_director_first');
  assert.equal(hydratedContract.prompt_pack.render_contract.shell_file, 'render_shell.html');
  assert.equal(hydratedContract.prompt_pack.render_contract.compiler_module, 'render_pack.js');
  assert.equal(hydratedContract.prompt_pack.render_contract.recipe_registry.default, 'ppt.compare_zones');
  assert.equal(promptPack.render_contract.recipe_registry.cover_hero, 'ppt.hero_signal');
  assert.equal(promptPack.render_contract.recipe_registry.summary_peak, 'ppt.summary_peak');
  assert.equal(promptPack.render_contract.compiler_module, 'render_pack.js');
  assert.deepEqual(
    JSON.parse(
      readFileSync(path.join(deliverableDir, 'contracts/stage-requirements.json'), 'utf-8'),
    ).render_html.requires_artifacts,
    ['slide_blueprint', 'visual_direction'],
  );
  assert.equal(
    hydratedContract.review_surface.required_checks.includes('term_explained_on_first_use'),
    true,
  );
});

test('auditDeliverable blocks when hydrated ppt deck surface is missing', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-surface-'));

  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });

  unlinkSync(
    path.join(path.dirname(created.deliverableFile), 'contracts/review-surface.json'),
  );

  const report = await auditDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    mode: 'draft_new',
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['deliverable_contract_missing:review_surface']);
  assert.equal(report.rerun_from_stage, 'intake');
  assert.equal(report.recommended_action, 'rehydrate_deliverable_surface');
});

test('auditDeliverable passes when hydrated ppt deck surface exists and baseline is bound', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-surface-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-approved-v1',
    title: '甲状腺门诊科普 baseline',
    goal: '已认可基线',
  });
  for (const route of ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html', 'screenshot_review']) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-approved-v1',
      route,
    });
    assert.equal(result.ok, true, route);
  }

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });

  const report = await auditDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    mode: 'optimize_existing',
    baselineDeliverableId: 'deck-approved-v1',
  });

  assert.equal(report.status, 'pass');
  assert.deepEqual(report.issues, []);
  assert.equal(report.rerun_from_stage, null);
  assert.equal(report.recommended_action, 'continue');
});

test('auditDeliverable blocks when hydrated ppt deck surface content is invalid', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-surface-'));

  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'executive_briefing',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '向院领导汇报门诊容量与改造建议',
  });

  writeFileSync(
    path.join(path.dirname(created.deliverableFile), 'contracts/review-surface.json'),
    '{}',
    'utf-8',
  );

  const report = await auditDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    mode: 'draft_new',
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['deliverable_contract_invalid:review_surface']);
  assert.equal(report.rerun_from_stage, 'intake');
  assert.equal(report.recommended_action, 'rehydrate_deliverable_surface');
});

test('auditDeliverable blocks when prompt pack misses render contract seed', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-surface-'));

  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });

  writeFileSync(
    path.join(path.dirname(created.deliverableFile), 'contracts/prompt-pack.json'),
    JSON.stringify({
      pack_id: 'ppt_deck_mainline_v1',
      root: 'prompts/ppt_deck',
      routes: {
        render_html: 'prompts/ppt_deck/render_html.md',
      },
      stages: {
        render_html: { file: 'render_html.md' },
      },
    }, null, 2),
    'utf-8',
  );

  const report = await auditDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    mode: 'draft_new',
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['deliverable_contract_invalid:prompt_pack']);
  assert.equal(report.rerun_from_stage, 'intake');
  assert.equal(report.recommended_action, 'rehydrate_deliverable_surface');
});
