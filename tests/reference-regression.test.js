import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import {
  applyReviewMutation,
  createDeliverable,
  intakeSource,
  runDeliverableRoute,
} from '../packages/redcube-gateway/src/index.js';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function loadFixture(relativeDir, name) {
  const dir = path.resolve('tests', 'reference-samples', relativeDir);
  const meta = readJson(path.join(dir, `${name}.json`));
  const sourceText = meta.sourceFile ? readFileSync(path.join(dir, meta.sourceFile), 'utf-8') : '';
  return { dir, meta, sourceText };
}

async function createSourceBackedDeliverable({ workspaceRoot, fixture, deliverableId, mode = 'draft_new', baselineDeliverableId = '' }) {
  if (fixture.sourceText) {
    const sourceFile = path.join(workspaceRoot, `${deliverableId}.md`);
    writeFileSync(sourceFile, fixture.sourceText, 'utf-8');
    await intakeSource({
      workspaceRoot,
      topicId: fixture.meta.topicId,
      title: fixture.meta.title,
      sourceFiles: [sourceFile],
    });
  }
  await createDeliverable({
    workspaceRoot,
    overlay: fixture.meta.overlay,
    profileId: fixture.meta.profileId,
    topicId: fixture.meta.topicId,
    deliverableId,
    title: fixture.meta.title,
    goal: fixture.meta.goal,
  });

  const routes = fixture.meta.overlay === 'xiaohongshu'
    ? ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'publish_copy']
    : ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html', 'screenshot_review'];

  const results = [];
  for (const route of routes) {
    results.push(await runDeliverableRoute({
      workspaceRoot,
      overlay: fixture.meta.overlay,
      topicId: fixture.meta.topicId,
      deliverableId,
      route,
      mode,
      baselineDeliverableId,
    }));
  }
  return results;
}

test('reference samples declare their sidecar source file so regressions are truly source-backed', () => {
  for (const [relativeDir, name] of [['ppt_deck', 'approved-deck'], ['xiaohongshu', 'approved-note']]) {
    const fixture = loadFixture(relativeDir, name);
    assert.equal(fixture.meta.sourceFile, `${name}.md`);
    assert.equal(fixture.sourceText.length > 0, true);
  }
});

test('xiaohongshu approved sample supports relative regression review', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-reference-xhs-'));
  const fixture = loadFixture('xiaohongshu', 'approved-note');

  const baseline = await createSourceBackedDeliverable({
    workspaceRoot,
    fixture,
    deliverableId: 'baseline-approved',
  });
  assert.equal(baseline.at(-1).ok, true);
  const approved = await applyReviewMutation({
    workspaceRoot,
    topicId: fixture.meta.topicId,
    deliverableId: 'baseline-approved',
    mutation: {
      type: 'approve_publish',
      actor: 'human',
      notes: 'reference approved sample',
    },
  });
  assert.equal(approved.state.approval_state.status, 'approved');

  const candidate = await createSourceBackedDeliverable({
    workspaceRoot,
    fixture,
    deliverableId: 'candidate-next',
    mode: 'optimize_existing',
    baselineDeliverableId: 'baseline-approved',
  });
  const review = readJson(candidate[6].artifactFile);
  assert.equal(review.baseline_review?.baseline_deliverable_id, 'baseline-approved');
  assert.equal(typeof review.checks?.baseline_comparison_passed, 'boolean');
  assert.equal(review.checks?.baseline_comparison_passed, true);
});

test('xiaohongshu optimize_existing blocks unapproved baseline sample', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-reference-xhs-'));
  const fixture = loadFixture('xiaohongshu', 'approved-note');

  const baseline = await createSourceBackedDeliverable({
    workspaceRoot,
    fixture,
    deliverableId: 'baseline-unapproved',
  });
  assert.equal(baseline.at(-1).ok, true);

  const candidate = await createSourceBackedDeliverable({
    workspaceRoot,
    fixture,
    deliverableId: 'candidate-blocked',
    mode: 'optimize_existing',
    baselineDeliverableId: 'baseline-unapproved',
  });
  assert.equal(candidate[6].ok, false);
  assert.match(candidate[6].run.error.message, /not approved/i);
});

test('ppt_deck approved sample supports relative regression review', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-reference-ppt-'));
  const fixture = loadFixture('ppt_deck', 'approved-deck');

  const baseline = await createSourceBackedDeliverable({
    workspaceRoot,
    fixture,
    deliverableId: 'baseline-approved',
  });
  assert.equal(baseline.at(-1).ok, true);

  const candidate = await createSourceBackedDeliverable({
    workspaceRoot,
    fixture,
    deliverableId: 'candidate-next',
    mode: 'optimize_existing',
    baselineDeliverableId: 'baseline-approved',
  });
  const review = readJson(candidate.at(-1).artifactFile);
  assert.equal(review.baseline_review?.baseline_deliverable_id, 'baseline-approved');
  assert.equal(typeof review.checks?.baseline_comparison_passed, 'boolean');
  assert.equal(review.checks?.baseline_comparison_passed, true);
});
