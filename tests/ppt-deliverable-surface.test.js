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
} from '../packages/redcube-gateway/src/index.js';

test('createDeliverable hydrates ppt deck contract surface', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-surface-'));

  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
  });

  const deliverableDir = path.dirname(created.deliverableFile);
  const surfaceFiles = [
    'contracts/stage-sequence.json',
    'contracts/review-surface.json',
    'contracts/layout-rules.json',
    'contracts/baseline-policy.json',
    'views/display-registry.json',
  ];

  for (const file of surfaceFiles) {
    assert.equal(existsSync(path.join(deliverableDir, file)), true, file);
  }

  const displayRegistry = JSON.parse(
    readFileSync(path.join(deliverableDir, 'views/display-registry.json'), 'utf-8'),
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
});

test('auditDeliverable blocks when hydrated ppt deck surface is missing', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-surface-'));

  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
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
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
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
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
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
