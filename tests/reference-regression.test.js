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
import {
  loadReferenceSampleFixture,
  summarizeReferenceCoverage,
  validateReferenceSampleMeta,
} from '../packages/redcube-runtime/src/index.js';
import { createOverlayRegistry } from '../packages/redcube-overlay-core/src/index.js';
import { pptDeckOverlay } from '../packages/redcube-overlay-ppt/src/index.js';
import { xiaohongshuOverlay } from '../packages/redcube-overlay-xiaohongshu/src/index.js';
import { withMockHermesUpstream } from './helpers/mock-codex-cli.js';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function loadFixture(relativeDir, name) {
  return loadReferenceSampleFixture({
    rootDir: path.resolve('tests', 'reference-samples'),
    familyId: relativeDir,
    sampleId: name,
  });
}

function fixtureUsesSourceBackedRuntime(fixture) {
  return fixture.meta.referenceMode === 'source_backed';
}

async function createReferenceDeliverable({ workspaceRoot, fixture, deliverableId, mode = 'draft_new', baselineDeliverableId = '' }) {
  if (fixtureUsesSourceBackedRuntime(fixture)) {
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
    : ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review'];

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

test('reference samples declare provenance metadata and runtime mode explicitly', () => {
  for (const [relativeDir, name] of [['ppt_deck', 'approved-deck'], ['xiaohongshu', 'approved-note']]) {
    const fixture = loadFixture(relativeDir, name);
    assert.equal(fixture.meta.sourceFile, `${name}.md`);
    assert.equal(fixture.sourceText.length > 0, true);
    assert.match(fixture.meta.referenceMode, /^(seed_backed_with_source_provenance|source_backed)$/);
  }
});

test('approved reference samples conform to formal schema with approval, provenance, and scope', () => {
  for (const [familyId, sampleId] of [['ppt_deck', 'approved-deck'], ['xiaohongshu', 'approved-note']]) {
    const fixture = loadReferenceSampleFixture({
      rootDir: path.resolve('tests', 'reference-samples'),
      familyId,
      sampleId,
    });
    assert.equal(fixture.validation.ok, true);
    assert.equal(fixture.meta.schemaVersion, 1);
    assert.equal(fixture.meta.sampleId, sampleId);
    assert.equal(fixture.meta.status, 'approved');
    assert.equal(fixture.meta.scope.overlay, familyId);
    assert.deepEqual(fixture.meta.scope.profileIds, [fixture.meta.profileId]);
    assert.equal(Array.isArray(fixture.meta.scope.supportedModes), true);
    assert.equal(fixture.meta.scope.supportedModes.includes('optimize_existing'), true);
    assert.equal(typeof fixture.meta.approval.approvedBy, 'string');
    assert.match(fixture.meta.approval.approvedAt, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(typeof fixture.meta.provenance.kind, 'string');
    assert.equal(typeof fixture.meta.provenance.sourceRef, 'string');
  }
});

test('reference sample schema validator rejects incomplete approved metadata', () => {
  const result = validateReferenceSampleMeta({
    schemaVersion: 1,
    sampleId: 'broken-sample',
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'ppt-reference',
    title: 'broken',
    goal: 'broken',
    sourceFile: 'broken.md',
    referenceMode: 'source_backed',
    status: 'approved',
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((item) => item.includes('approval')), true);
  assert.equal(result.errors.some((item) => item.includes('provenance')), true);
  assert.equal(result.errors.some((item) => item.includes('scope')), true);
});

test('reference coverage matrix fully covers active family/profile combinations', () => {
  const overlayRegistry = createOverlayRegistry({
    ppt_deck: pptDeckOverlay,
    xiaohongshu: xiaohongshuOverlay,
  });
  const coverage = summarizeReferenceCoverage({
    rootDir: path.resolve('tests', 'reference-samples'),
    overlayRegistry,
  });

  assert.equal(coverage.expectedProfileCount, 5);
  assert.equal(coverage.approvedSampleCount, 5);
  assert.equal(coverage.ok, true);
  assert.deepEqual(coverage.missingProfiles, []);
});

test('xiaohongshu optimize_existing blocks unapproved baseline until approval, then supports relative regression review', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-reference-xhs-'));
    const fixture = loadFixture('xiaohongshu', 'approved-note');

    const baseline = await createReferenceDeliverable({
      workspaceRoot,
      fixture,
      deliverableId: 'baseline-a',
    });
    assert.equal(baseline.at(-1).ok, true);

    const blockedCandidate = await createReferenceDeliverable({
      workspaceRoot,
      fixture,
      deliverableId: 'candidate-blocked',
      mode: 'optimize_existing',
      baselineDeliverableId: 'baseline-a',
    });
    assert.equal(blockedCandidate[6].ok, false);
    assert.match(blockedCandidate[6].run.error.message, /not approved/i);

    const approved = await applyReviewMutation({
      workspaceRoot,
      topicId: fixture.meta.topicId,
      deliverableId: 'baseline-a',
      mutation: {
        type: 'approve_publish',
        actor: 'human',
        notes: 'reference approved sample',
      },
    });
    assert.equal(approved.state.approval_state.status, 'approved');

    const candidate = await createReferenceDeliverable({
      workspaceRoot,
      fixture,
      deliverableId: 'candidate-approved',
      mode: 'optimize_existing',
      baselineDeliverableId: 'baseline-a',
    });
    const review = readJson(candidate[6].artifactFile);
    assert.equal(review.baseline_review?.baseline_deliverable_id, 'baseline-a');
    assert.equal(review.baseline_review?.baseline_comparison_passed, true);
  });
});

test('ppt_deck active profiles all have approved samples that support relative regression review', async () => {
  await withMockHermesUpstream(async () => {
    for (const sampleId of ['approved-deck', 'approved-peer-deck', 'approved-executive-deck', 'approved-defense-deck']) {
      const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), `redcube-reference-${sampleId}-`));
      const fixture = loadFixture('ppt_deck', sampleId);

      const baseline = await createReferenceDeliverable({
        workspaceRoot,
        fixture,
        deliverableId: `${sampleId}-baseline`,
      });
      assert.equal(baseline.at(-1).ok, true, sampleId);

      const candidate = await createReferenceDeliverable({
        workspaceRoot,
        fixture,
        deliverableId: `${sampleId}-candidate`,
        mode: 'optimize_existing',
        baselineDeliverableId: `${sampleId}-baseline`,
      });
      const review = readJson(candidate.at(-1).artifactFile);
      assert.equal(review.baseline_review?.baseline_deliverable_id, `${sampleId}-baseline`);
      assert.equal(review.baseline_review?.baseline_comparison_passed, true);
    }
  });
});
