// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

import {
  getDeliverablePaths,
  readStageFolderArtifact,
  stageFolderAttemptPaths,
  stageFolderOutputPath,
  writeStageFolderArtifact,
} from '@redcube/runtime-protocol';
import {
  createDeliverable,
  runDeliverableRoute,
} from './product-domain-action-test-api.ts';
import { withMockCodexRuntime } from './mock-codex-cli.ts';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function withTempOplState(fn) {
  const previous = process.env.OPL_STATE_DIR;
  const root = mkdtempSync(path.join(os.tmpdir(), 'redcube-opl-stage-state-'));
  const cleanup = () => {
    if (previous === undefined) {
      delete process.env.OPL_STATE_DIR;
    } else {
      process.env.OPL_STATE_DIR = previous;
    }
    rmSync(root, { recursive: true, force: true });
  };
  process.env.OPL_STATE_DIR = root;
  try {
    const result = fn(root);
    if (result && typeof result.then === 'function') {
      return result.finally(cleanup);
    }
    cleanup();
    return result;
  } catch (error) {
    cleanup();
    throw error;
  }
}

test('RCA stage folder artifact write creates manifest, receipt, current pointer, and output ref', () => {
  withTempOplState((stateRoot) => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-stage-folder-'));
    const paths = getDeliverablePaths(workspaceRoot, 'topic-a', 'deck-a');
    const artifactFile = path.join(paths.artifactsDir, 'author_image_pages.json');
    mkdirSync(path.dirname(artifactFile), { recursive: true });
    writeFileSync(artifactFile, JSON.stringify({ route: 'author_image_pages', status: 'ok' }), 'utf-8');

    const written = writeStageFolderArtifact({
      deliverablePaths: paths,
      programId: paths.programId,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      routeStageId: 'author_image_pages',
      canonicalStageId: 'artifact_creation',
      stageOrder: 4,
      attemptId: 'attempt-1',
      artifactFile,
      requiredOutputs: ['author_image_pages.json'],
      ownerReceiptRefs: ['rca-owner-receipt:visual-stage:deck-a'],
      artifactRefs: ['workspace-runtime-ref:author_image_pages.json'],
    });

    assert.equal(written.root.startsWith(path.join(stateRoot, 'runtime-state', 'domains', 'redcube_ai')), true);
    assert.equal(existsSync(written.manifest_file), true);
    assert.equal(existsSync(written.receipt_file), true);
    assert.equal(existsSync(path.join(written.root, 'deliverable.json')), true);
    assert.equal(existsSync(path.join(written.stage_dir, 'stage.json')), true);
    assert.equal(written.artifact_refs.includes(path.join(written.root, 'deliverable.json')), true);
    assert.equal(written.artifact_refs.includes(path.join(written.stage_dir, 'stage.json')), true);
    assert.equal(readFileSync(written.latest_pointer, 'utf-8').trim(), 'attempt-1');
    assert.equal(readJson(written.current_file).current_stage.stage_id, 'artifact_creation');
    const manifest = readJson(written.manifest_file);
    assert.deepEqual(manifest.required_outputs, ['author_image_pages.json']);
    assert.deepEqual(manifest.present_outputs, ['author_image_pages.json']);
    assert.equal(manifest.stage_id, 'artifact_creation');
    assert.equal(manifest.route_stage_id, 'author_image_pages');
    assert.equal(manifest.terminal_status, 'success');
    assert.equal(manifest.output_hashes[0].path, 'author_image_pages.json');
    assert.equal(manifest.output_hashes[0].role, 'output');
    assert.equal(typeof manifest.output_hashes[0].sha256, 'string');
    assert.equal(manifest.output_hashes[0].sha256.length, 64);
    assert.equal(manifest.receipt_hashes[0].path, 'domain-owner-receipt.json');
    assert.equal(manifest.receipt_hashes[0].role, 'receipt');
    assert.deepEqual(manifest.evidence_hashes, []);
    assert.equal(manifest.authority_boundary.opl_can_issue_owner_receipt, false);

    const loaded = readStageFolderArtifact({
      deliverablePaths: paths,
      canonicalStageId: 'artifact_creation',
      routeStageId: 'author_image_pages',
    });
    assert.equal(loaded?.artifact.route, 'author_image_pages');
    assert.equal(loaded?.status, 'success');
    assert.equal(loaded?.manifest.program_id, paths.programId);
  });
});

test('RCA stage folder artifact read marks output-only folders as orphan, not completed stage', () => {
  withTempOplState(() => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-stage-folder-orphan-'));
    const paths = getDeliverablePaths(workspaceRoot, 'topic-a', 'deck-a');
    const attempt = stageFolderAttemptPaths({
      deliverablePaths: paths,
      canonicalStageId: 'artifact_creation',
      stageOrder: 4,
      attemptId: 'attempt-orphan',
    });
    writeFileSync(path.join(attempt.outputs_dir, 'author_image_pages.json'), '{}', 'utf-8');
    writeFileSync(attempt.latest_pointer, 'attempt-orphan\n', 'utf-8');

    const loaded = readStageFolderArtifact({
      deliverablePaths: paths,
      canonicalStageId: 'artifact_creation',
      routeStageId: 'author_image_pages',
    });

    assert.equal(loaded?.status, 'orphan');
    assert.equal(loaded?.artifact, null);
    assert.deepEqual(loaded?.orphan_outputs, ['author_image_pages.json']);
  });
});

test('RCA stage folder output locator does not create an attempt folder', () => {
  withTempOplState(() => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-stage-folder-locator-'));
    const paths = getDeliverablePaths(workspaceRoot, 'topic-a', 'deck-a');

    const outputPath = stageFolderOutputPath({
      deliverablePaths: paths,
      routeStageId: 'research',
      canonicalStageId: 'source_intake',
      stageOrder: 1,
      attemptId: 'locator-only',
      outputName: 'research.json',
    });

    assert.equal(path.basename(outputPath), 'research.json');
    assert.equal(existsSync(path.dirname(path.dirname(outputPath))), false);
  });
});

test('RCA stage folder program identity separates same topic deliverable across workspaces', () => {
  withTempOplState(() => {
    const workspaceA = mkdtempSync(path.join(os.tmpdir(), 'redcube-stage-folder-program-a-'));
    const workspaceB = mkdtempSync(path.join(os.tmpdir(), 'redcube-stage-folder-program-b-'));
    const pathsA = getDeliverablePaths(workspaceA, 'topic-a', 'deck-a');
    const pathsB = getDeliverablePaths(workspaceB, 'topic-a', 'deck-a');

    assert.notEqual(pathsA.programId, pathsB.programId);
    assert.equal(pathsA.topicId, 'topic-a');
    assert.equal(pathsB.topicId, 'topic-a');

    const outputA = stageFolderOutputPath({
      deliverablePaths: pathsA,
      routeStageId: 'research',
      canonicalStageId: 'source_intake',
      stageOrder: 1,
      attemptId: 'same-attempt',
      outputName: 'research.json',
    });
    const outputB = stageFolderOutputPath({
      deliverablePaths: pathsB,
      routeStageId: 'research',
      canonicalStageId: 'source_intake',
      stageOrder: 1,
      attemptId: 'same-attempt',
      outputName: 'research.json',
    });

    assert.notEqual(outputA, outputB);
    assert.equal(outputA.includes(path.join('deliverables', pathsA.programId, 'topic-a', 'deck-a')), true);
    assert.equal(outputB.includes(path.join('deliverables', pathsB.programId, 'topic-a', 'deck-a')), true);
  });
});

test('RCA stage folder artifact read is route-aware inside one canonical Stage', () => {
  withTempOplState(() => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-stage-folder-routes-'));
    const paths = getDeliverablePaths(workspaceRoot, 'topic-a', 'deck-a');
    const authorArtifact = path.join(paths.artifactsDir, 'author.json');
    const repairArtifact = path.join(paths.artifactsDir, 'repair.json');
    mkdirSync(paths.artifactsDir, { recursive: true });
    writeFileSync(authorArtifact, JSON.stringify({ route: 'author_image_pages' }), 'utf-8');
    writeFileSync(repairArtifact, JSON.stringify({ route: 'repair_image_pages' }), 'utf-8');

    writeStageFolderArtifact({
      deliverablePaths: paths,
      programId: paths.programId,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      routeStageId: 'author_image_pages',
      canonicalStageId: 'artifact_creation',
      stageOrder: 4,
      attemptId: 'attempt-author',
      artifactFile: authorArtifact,
      outputName: 'image_pages_bundle.json',
      ownerReceiptRefs: ['rca-owner-receipt:author'],
    });
    writeStageFolderArtifact({
      deliverablePaths: paths,
      programId: paths.programId,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      routeStageId: 'repair_image_pages',
      canonicalStageId: 'artifact_creation',
      stageOrder: 4,
      attemptId: 'attempt-repair',
      artifactFile: repairArtifact,
      outputName: 'image_pages_repair_bundle.json',
      ownerReceiptRefs: ['rca-owner-receipt:repair'],
    });

    assert.equal(
      readStageFolderArtifact({
        deliverablePaths: paths,
        routeStageId: 'author_image_pages',
      })?.artifact.route,
      'author_image_pages',
    );
    assert.equal(
      readStageFolderArtifact({
        deliverablePaths: paths,
        routeStageId: 'repair_image_pages',
      })?.artifact.route,
      'repair_image_pages',
    );
    assert.equal(
      path.basename(stageFolderOutputPath({
        deliverablePaths: paths,
        routeStageId: 'repair_image_pages',
        canonicalStageId: 'artifact_creation',
        stageOrder: 4,
        attemptId: 'attempt-repair',
        outputName: 'image_pages_repair_bundle.json',
      })),
      'image_pages_repair_bundle.json',
    );
  });
});

test('RCA stage folder artifact read does not substitute another route in the same canonical Stage', () => {
  withTempOplState(() => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-stage-folder-route-substitution-'));
    const paths = getDeliverablePaths(workspaceRoot, 'topic-a', 'deck-a');
    const directorArtifact = path.join(paths.artifactsDir, 'visual-director-review.json');
    mkdirSync(paths.artifactsDir, { recursive: true });
    writeFileSync(directorArtifact, JSON.stringify({
      route: 'visual_director_review',
      status: 'block',
    }), 'utf-8');

    writeStageFolderArtifact({
      deliverablePaths: paths,
      programId: paths.programId,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      routeStageId: 'visual_director_review',
      canonicalStageId: 'review_and_revision',
      stageOrder: 5,
      attemptId: 'attempt-director-block',
      artifactFile: directorArtifact,
      outputName: 'visual_director_review.json',
      typedBlockerRefs: ['rca-typed-blocker:visual-director-review'],
    });

    assert.equal(
      readStageFolderArtifact({
        deliverablePaths: paths,
        routeStageId: 'screenshot_review',
        canonicalStageId: 'review_and_revision',
      }),
      null,
    );
    assert.equal(
      readStageFolderArtifact({
        deliverablePaths: paths,
        routeStageId: 'visual_director_review',
        canonicalStageId: 'review_and_revision',
      })?.artifact.route,
      'visual_director_review',
    );
  });
});

test('RCA route execution writes manifest-backed Stage Folder attempt and current pointer', async () => {
  await withMockCodexRuntime(async () => {
    await withTempOplState(async (stateRoot) => {
      const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-stage-folder-route-'));
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
        route: 'research',
        runId: 'route-run-1',
      });
      assert.equal(result.ok, true);
      assert.equal(result.artifactFile.includes(path.join('runtime-state', 'domains', 'redcube_ai')), true);
      assert.equal(existsSync(result.artifactFile), true);
      assert.equal(path.basename(result.artifactFile), 'research.json');

      const paths = getDeliverablePaths(workspaceRoot, 'topic-a', 'note-a');
      const loaded = readStageFolderArtifact({
        deliverablePaths: paths,
        routeStageId: 'research',
      });
      assert.equal(loaded?.status, 'success');
      assert.equal(loaded?.artifact?.route, 'research');
      assert.equal(loaded?.manifest?.stage_id, 'source_intake');
      assert.equal(loaded?.manifest?.attempt_id, 'route-run-1');
      assert.equal(existsSync(loaded?.manifest_file), true);
      assert.equal(readJson(path.join(path.dirname(loaded.manifest_file), 'receipts', 'domain-owner-receipt.json')).owner, 'redcube_ai');
      assert.equal(readJson(path.join(stateRoot, 'runtime-state', 'domains', 'redcube_ai', 'deliverables', paths.programId, 'topic-a', 'note-a', 'current.json')).current_stage.status, 'success');
    });
  });
});
