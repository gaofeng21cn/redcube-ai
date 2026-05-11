// @ts-nocheck
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
} from './gateway-test-api.ts';
import {
  loadReferenceSampleFixture,
  createOverlayRegistry,
  pptDeckOverlay,
  summarizeReferenceCoverage,
  validateReferenceSampleMeta,
  xiaohongshuOverlay,
} from './package-surfaces.ts';
import { withMockCodexRuntime } from './mock-codex-cli.ts';

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

const OVERLAY_ROUTES = {
  xiaohongshu: ['research', 'storyline', 'single_note_plan', 'visual_direction', 'author_image_pages', 'visual_director_review', 'screenshot_review', 'publish_copy'],
  ppt_deck: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'author_image_pages', 'visual_director_review', 'screenshot_review'],
};

function resolveRoutes(overlay) {
  return OVERLAY_ROUTES[overlay] ?? OVERLAY_ROUTES.ppt_deck;
}

function resolveReviewRouteIndex(overlay) {
  return resolveRoutes(overlay).indexOf('screenshot_review');
}

async function ensureFixtureSourceIntake({ workspaceRoot, fixture, preparedSourceTopics }) {
  if (!fixtureUsesSourceBackedRuntime(fixture)) return;
  const intakeKey = `${fixture.meta.overlay}:${fixture.meta.topicId}`;
  if (preparedSourceTopics.has(intakeKey)) return;
  const sourceFile = path.join(workspaceRoot, `${fixture.meta.topicId}.md`);
  writeFileSync(sourceFile, fixture.sourceText, 'utf-8');
  await intakeSource({
    workspaceRoot,
    topicId: fixture.meta.topicId,
    title: fixture.meta.title,
    sourceFiles: [sourceFile],
  });
  preparedSourceTopics.add(intakeKey);
}

async function createReferenceDeliverable({
  workspaceRoot,
  fixture,
  deliverableId,
  mode = 'draft_new',
  baselineDeliverableId = '',
  preparedSourceTopics = new Set(),
  maxRouteIndex,
}) {
  await ensureFixtureSourceIntake({ workspaceRoot, fixture, preparedSourceTopics });

  await createDeliverable({
    workspaceRoot,
    overlay: fixture.meta.overlay,
    profileId: fixture.meta.profileId,
    topicId: fixture.meta.topicId,
    deliverableId,
    title: fixture.meta.title,
    goal: fixture.meta.goal,
  });

  const routes = resolveRoutes(fixture.meta.overlay);
  const limit = Number.isInteger(maxRouteIndex) ? Math.min(maxRouteIndex, routes.length - 1) : routes.length - 1;
  const results = [];
  for (let routeIndex = 0; routeIndex <= limit; routeIndex += 1) {
    const route = routes[routeIndex];
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: fixture.meta.overlay,
      topicId: fixture.meta.topicId,
      deliverableId,
      route,
      mode,
      baselineDeliverableId,
    });
    results.push(result);
    if (!result.ok) break;
  }
  return results;
}

async function assertReferenceRelativeRegression({
  workspaceRoot,
  fixture,
  baselineDeliverableId,
  candidateDeliverableId,
  preparedSourceTopics,
  reviewRouteIndex = -1,
  message,
}) {
  const baseline = await createReferenceDeliverable({
    workspaceRoot,
    fixture,
    deliverableId: baselineDeliverableId,
    preparedSourceTopics,
  });
  assert.equal(baseline.at(-1).ok, true, message);

  const candidate = await createReferenceDeliverable({
    workspaceRoot,
    fixture,
    deliverableId: candidateDeliverableId,
    mode: 'optimize_existing',
    baselineDeliverableId,
    preparedSourceTopics,
    maxRouteIndex: resolveReviewRouteIndex(fixture.meta.overlay),
  });
  const review = readJson(candidate.at(reviewRouteIndex).artifactFile);
  assert.equal(review.baseline_review?.baseline_deliverable_id, baselineDeliverableId, message);
  assert.equal(review.baseline_review?.baseline_comparison_passed, true, message);
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
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-reference-xhs-'));
    const preparedSourceTopics = new Set();
    const fixture = loadFixture('xiaohongshu', 'approved-note');

    const baseline = await createReferenceDeliverable({
      workspaceRoot,
      fixture,
      deliverableId: 'baseline-a',
      preparedSourceTopics,
    });
    assert.equal(baseline.at(-1).ok, true);

    const blockedCandidate = await createReferenceDeliverable({
      workspaceRoot,
      fixture,
      deliverableId: 'candidate-blocked',
      mode: 'optimize_existing',
      baselineDeliverableId: 'baseline-a',
      preparedSourceTopics,
      maxRouteIndex: resolveReviewRouteIndex(fixture.meta.overlay),
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
      preparedSourceTopics,
      maxRouteIndex: resolveReviewRouteIndex(fixture.meta.overlay),
    });
    const review = readJson(candidate[6].artifactFile);
    assert.equal(review.baseline_review?.baseline_deliverable_id, 'baseline-a');
    assert.equal(review.baseline_review?.baseline_comparison_passed, true);
  });
});

test('ppt_deck active profiles all have approved samples that support relative regression review', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-reference-ppt-'));
    const preparedSourceTopics = new Set();
    for (const sampleId of ['approved-deck', 'approved-peer-deck', 'approved-executive-deck', 'approved-defense-deck']) {
      const fixture = loadFixture('ppt_deck', sampleId);
      await assertReferenceRelativeRegression({
        workspaceRoot,
        fixture,
        baselineDeliverableId: `${sampleId}-baseline`,
        candidateDeliverableId: `${sampleId}-candidate`,
        preparedSourceTopics,
        message: sampleId,
      });
    }
  });
});
