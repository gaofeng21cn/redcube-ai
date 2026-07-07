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
import { refreshStageFolderRouteArtifact } from '../packages/redcube-runtime/dist/deliverable-route-local.js';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function writeJson(file, data) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}

function writeStageFolderOutputFixture(input, artifact) {
  const outputName = input.outputName || `${input.routeStageId}.json`;
  const artifactFile = stageFolderOutputPath({
    ...input,
    outputName,
  });
  writeJson(artifactFile, artifact);
  return writeStageFolderArtifact({
    ...input,
    artifactFile,
    outputName,
  });
}

function stageFolderAttemptOutputFile(input, outputName) {
  return stageFolderOutputPath({
    ...input,
    outputName,
  });
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

    const written = writeStageFolderOutputFixture({
      deliverablePaths: paths,
      programId: paths.programId,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      routeStageId: 'author_image_pages',
      canonicalStageId: 'artifact_creation',
      stageOrder: 4,
      attemptId: 'attempt-1',
      requiredOutputs: ['author_image_pages.json'],
      ownerReceiptRefs: ['rca-owner-receipt:visual-stage:deck-a'],
      artifactRefs: ['workspace-runtime-ref:author_image_pages.json'],
    }, { route: 'author_image_pages', status: 'ok' });

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
    assert.equal(manifest.authority_boundary.owner, 'one-person-lab');
    assert.equal(manifest.authority_boundary.substrate_owner, 'one-person-lab');
    assert.equal(manifest.authority_boundary.domain_authority_owner, 'redcube_ai');
    assert.equal(manifest.authority_boundary.rca_owns_stage_folder_substrate, false);
    assert.equal(
      manifest.authority_boundary.stage_folder_current_pointer_role,
      'artifact_attempt_pointer_not_opl_stage_run_current_pointer',
    );
    assert.equal(
      manifest.authority_boundary.stage_folder_terminal_status_role,
      'domain_owner_closeout_receipt_projection_not_opl_stage_run_terminal_state',
    );
    assert.equal(manifest.authority_boundary.stage_transition_authority_required_for_opl_stage_run_current, true);
    assert.equal(manifest.authority_boundary.can_write_opl_stage_run_current_pointer, false);
    assert.equal(manifest.authority_boundary.can_write_opl_stage_run_terminal_state, false);
    assert.equal(manifest.authority_boundary.can_publish_current_owner_delta, false);
    assert.equal(manifest.authority_boundary.opl_can_issue_owner_receipt, false);
    const currentPointer = readJson(written.current_file);
    assert.equal(currentPointer.authority_boundary.owner, 'one-person-lab');
    assert.equal(currentPointer.authority_boundary.domain_authority_owner, 'redcube_ai');
    assert.equal(
      currentPointer.authority_boundary.stage_folder_current_pointer_role,
      'artifact_attempt_pointer_not_opl_stage_run_current_pointer',
    );
    assert.equal(currentPointer.authority_boundary.can_write_opl_stage_run_current_pointer, false);
    assert.equal(currentPointer.authority_boundary.can_write_opl_stage_run_terminal_state, false);
    assert.equal(currentPointer.authority_boundary.can_publish_current_owner_delta, false);

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

test('RCA stage folder success closeout fails closed without explicit owner receipt refs', () => {
  withTempOplState((stateRoot) => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-stage-folder-missing-owner-ref-'));
    const paths = getDeliverablePaths(workspaceRoot, 'topic-a', 'deck-a');
    const base = {
      deliverablePaths: paths,
      programId: paths.programId,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      routeStageId: 'author_image_pages',
      canonicalStageId: 'artifact_creation',
      stageOrder: 4,
      attemptId: 'attempt-missing-owner-ref',
      outputName: 'author_image_pages.json',
      status: 'success',
    };
    const artifactFile = stageFolderOutputPath(base);
    writeJson(artifactFile, { route: 'author_image_pages', status: 'ok' });
    const pointers = stageFolderAttemptPaths(base);

    assert.throws(
      () => writeStageFolderArtifact({
        ...base,
        artifactFile,
      }),
      /requires explicit ownerReceiptRefs/,
    );
    assert.equal(existsSync(path.join(stateRoot, 'runtime-state', 'domains', 'redcube_ai', 'deliverables', paths.programId, 'topic-a', 'deck-a', 'current.json')), false);
    assert.equal(existsSync(path.join(stateRoot, 'runtime-state', 'domains', 'redcube_ai', 'deliverables', paths.programId, 'topic-a', 'deck-a', 'latest.json')), false);
    assert.equal(existsSync(pointers.latest_pointer), false);
    assert.equal(existsSync(pointers.stage_current_file), false);
  });
});

test('RCA stage folder blocked closeout fails closed without explicit typed blocker refs', () => {
  withTempOplState((stateRoot) => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-stage-folder-missing-blocker-ref-'));
    const paths = getDeliverablePaths(workspaceRoot, 'topic-a', 'deck-a');
    const base = {
      deliverablePaths: paths,
      programId: paths.programId,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      routeStageId: 'screenshot_review',
      canonicalStageId: 'review_and_revision',
      stageOrder: 5,
      attemptId: 'attempt-missing-blocker-ref',
      outputName: 'screenshot_review.json',
      status: 'blocked',
    };
    const artifactFile = stageFolderOutputPath(base);
    writeJson(artifactFile, { route: 'screenshot_review', status: 'block' });
    const pointers = stageFolderAttemptPaths(base);

    assert.throws(
      () => writeStageFolderArtifact({
        ...base,
        artifactFile,
      }),
      /requires explicit typedBlockerRefs/,
    );
    assert.equal(existsSync(path.join(stateRoot, 'runtime-state', 'domains', 'redcube_ai', 'deliverables', paths.programId, 'topic-a', 'deck-a', 'current.json')), false);
    assert.equal(existsSync(path.join(stateRoot, 'runtime-state', 'domains', 'redcube_ai', 'deliverables', paths.programId, 'topic-a', 'deck-a', 'latest.json')), false);
    assert.equal(existsSync(pointers.latest_pointer), false);
    assert.equal(existsSync(pointers.stage_current_file), false);
  });
});

test('RCA stage folder manifest exposes canonical output roles, stage receipts, and helper refs', () => {
  withTempOplState(() => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-stage-folder-role-'));
    const paths = getDeliverablePaths(workspaceRoot, 'topic-a', 'deck-a');
    const base = {
      deliverablePaths: paths,
      programId: paths.programId,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      routeStageId: 'author_pptx_native',
      canonicalStageId: 'artifact_creation',
      stageOrder: 4,
      attemptId: 'attempt-role',
      outputName: 'render-output-v2.json',
      outputRole: 'render_manifest',
    };
    const helperFile = stageFolderAttemptOutputFile(base, 'helper/shape-manifest.json');
    writeJson(helperFile, { surface_kind: 'native_shape_manifest' });

    const written = writeStageFolderOutputFixture({
      ...base,
      requiredOutputRoles: ['render_manifest'],
      ownerReceiptRefs: ['rca-owner-receipt:render-manifest'],
      helperOutputRefs: [{
        role: 'native_shape_manifest',
        file: helperFile,
        sha256: '0'.repeat(64),
        evidence_ref: 'native_ppt_bundle.shape_manifest_file',
        review_receipt_ref: 'rca-owner-receipt:screenshot-review',
      }],
    }, { route: 'author_pptx_native', status: 'ok' });

    const manifest = readJson(written.manifest_file);
    assert.equal(manifest.stage_output_role_interface.surface_kind, 'rca_stage_output_role_interface');
    assert.equal(manifest.stage_output_role_interface.file_name_is_interface, false);
    assert.equal(manifest.stage_output_role_interface.role_manifest_receipt_is_interface, true);
    assert.deepEqual(manifest.stage_output_role_interface.required_roles, ['render_manifest']);
    assert.deepEqual(manifest.required_outputs, ['render-output-v2.json']);
    assert.deepEqual(manifest.required_output_roles, ['render_manifest']);
    assert.deepEqual(manifest.present_output_roles, ['render_manifest']);
    assert.equal(Array.isArray(manifest.output_refs), true);
    assert.equal(manifest.output_refs.some((entry) => entry === 'render-output-v2.json'), false);
    const renderRef = manifest.output_refs.find((entry) => entry.role === 'render_manifest');
    assert.equal(renderRef.output_ref, 'outputs/render-output-v2.json');
    assert.equal(renderRef.manifest_ref, 'manifest.json');
    assert.equal(renderRef.receipt_ref, 'receipts/domain-owner-receipt.json');
    assert.equal(typeof renderRef.sha256, 'string');
    assert.equal(renderRef.sha256.length, 64);
    assert.equal(manifest.stage_receipts[0].receipt_kind, 'domain_owner_receipt');
    assert.equal(manifest.stage_receipts[0].receipt_ref, 'rca-owner-receipt:render-manifest');
    assert.deepEqual(manifest.stage_receipts[0].output_roles, ['render_manifest']);
    assert.equal(manifest.helper_output_refs[0].role, 'native_shape_manifest');
    assert.equal(manifest.helper_output_refs[0].evidence_ref, 'native_ppt_bundle.shape_manifest_file');
    assert.equal(manifest.helper_output_refs[0].review_receipt_ref, 'rca-owner-receipt:screenshot-review');

    const loaded = readStageFolderArtifact({
      deliverablePaths: paths,
      routeStageId: 'author_pptx_native',
      canonicalStageId: 'artifact_creation',
      outputRole: 'render_manifest',
    });
    assert.equal(loaded?.status, 'success');
    assert.equal(path.basename(loaded?.output_file), 'render-output-v2.json');
    assert.equal(loaded?.artifact.route, 'author_pptx_native');
  });
});

test('RCA blocked stage folder attempts expose typed blocker stage receipts', () => {
  withTempOplState(() => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-stage-folder-blocked-'));
    const paths = getDeliverablePaths(workspaceRoot, 'topic-a', 'deck-a');

    const written = writeStageFolderOutputFixture({
      deliverablePaths: paths,
      programId: paths.programId,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      routeStageId: 'screenshot_review',
      canonicalStageId: 'review_and_revision',
      stageOrder: 5,
      attemptId: 'attempt-blocked',
      outputRole: 'review_verdict',
      typedBlockerRefs: ['rca-typed-blocker:screenshot-review'],
      blockingReasons: ['review_blocked'],
    }, { route: 'screenshot_review', status: 'block' });

    const manifest = readJson(written.manifest_file);
    assert.equal(manifest.status, 'blocked');
    assert.deepEqual(manifest.required_output_roles, ['review_verdict']);
    assert.deepEqual(manifest.owner_receipt_refs, []);
    assert.deepEqual(manifest.typed_blocker_refs, ['rca-typed-blocker:screenshot-review']);
    assert.equal(manifest.stage_receipts[0].receipt_kind, 'domain_typed_blocker');
    assert.equal(manifest.stage_receipts[0].typed_blocker_ref, 'rca-typed-blocker:screenshot-review');
    assert.equal(manifest.stage_receipts[0].evidence_file, 'evidence/typed-blocker-ref.json');
    assert.equal(readJson(written.blocker_evidence_file).blocking_reasons[0], 'review_blocked');

    const loaded = readStageFolderArtifact({
      deliverablePaths: paths,
      routeStageId: 'screenshot_review',
      canonicalStageId: 'review_and_revision',
    });
    assert.equal(loaded?.status, 'blocked');
    assert.equal(loaded?.artifact.status, 'block');
  });
});

test('RCA review, repair, and export routes map to receipt-backed stage output roles', () => {
  withTempOplState(() => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-stage-folder-route-roles-'));
    const paths = getDeliverablePaths(workspaceRoot, 'topic-a', 'deck-a');
    const cases = [
      ['visual_director_review', 'review_and_revision', 'review_verdict'],
      ['screenshot_review', 'review_and_revision', 'review_verdict'],
      ['repair_image_pages', 'artifact_creation', 'render_manifest'],
      ['export_pptx', 'package_and_handoff', 'export_bundle'],
    ];

    for (const [routeStageId, canonicalStageId, outputRole] of cases) {
      const written = writeStageFolderOutputFixture({
        deliverablePaths: paths,
        programId: paths.programId,
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        routeStageId,
        canonicalStageId,
        stageOrder: routeStageId === 'export_pptx' ? 6 : routeStageId === 'repair_image_pages' ? 4 : 5,
        attemptId: `attempt-${routeStageId}`,
        outputName: `${routeStageId}-role.json`,
        ownerReceiptRefs: [`rca-owner-receipt:${routeStageId}`],
      }, { route: routeStageId, status: 'ok' });
      const manifest = readJson(written.manifest_file);
      assert.equal(manifest.present_output_roles.includes(outputRole), true);
      assert.equal(manifest.stage_receipts[0].receipt_ref, `rca-owner-receipt:${routeStageId}`);
      assert.equal(manifest.stage_receipts[0].output_roles.includes(outputRole), true);
      if (routeStageId === 'export_pptx') {
        assert.equal(manifest.present_output_roles.includes('handoff_manifest'), true);
      }
    }
  });
});

test('RCA route closeout records native helper, export, gallery, and handoff refs in Stage Manifest', () => {
  withTempOplState(() => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-stage-folder-route-helper-'));
    const paths = getDeliverablePaths(workspaceRoot, 'topic-a', 'deck-a');
    const exportBase = {
      deliverablePaths: paths,
      programId: paths.programId,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      routeStageId: 'export_pptx',
      canonicalStageId: 'package_and_handoff',
      stageOrder: 6,
      attemptId: 'attempt-export',
    };
    const files = {
      artifact: stageFolderAttemptOutputFile(exportBase, 'export_pptx.json'),
      pptx: stageFolderAttemptOutputFile(exportBase, 'deck.pptx'),
      pdf: stageFolderAttemptOutputFile(exportBase, 'deck.pdf'),
      notes: stageFolderAttemptOutputFile(exportBase, 'notes.md'),
      handoff: stageFolderAttemptOutputFile(exportBase, 'handoff-manifest.json'),
      gallery: stageFolderAttemptOutputFile(exportBase, 'gallery-index.json'),
      capture: stageFolderAttemptOutputFile(exportBase, 'capture-manifest.json'),
      shapeManifest: stageFolderAttemptOutputFile(exportBase, 'shape-manifest.json'),
    };
    for (const [key, file] of Object.entries(files)) {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, key === 'pptx' || key === 'pdf' ? key : `${JSON.stringify({ key }, null, 2)}\n`, 'utf-8');
    }
    const artifact = {
      route: 'export_pptx',
      status: 'completed',
      owner_receipt_refs: ['rca-owner-receipt:export-pptx-ready'],
      native_ppt_bundle: {
        shape_manifest_file: files.shapeManifest,
      },
      export_bundle: {
        pptx_file: files.pptx,
        pdf_file: files.pdf,
        presenter_notes_file: files.notes,
        final_delivery: { manifest_file: files.handoff },
        artifact_gallery: { index_file: files.gallery },
        review_capture: { export_manifest_file: files.capture },
      },
      review_capture: {
        export_manifest_file: files.capture,
      },
    };
    writeJson(files.artifact, artifact);

    const written = refreshStageFolderRouteArtifact({
      deliverablePaths: paths,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'export_pptx',
      attemptId: 'attempt-export',
      artifactFile: files.artifact,
      artifact,
    });

    const manifest = readJson(written.manifest_file);
    assert.deepEqual(manifest.present_output_roles, ['export_bundle', 'handoff_manifest']);
    assert.equal(manifest.stage_receipts[0].receipt_ref, 'rca-owner-receipt:export-pptx-ready');
    const helperRoles = manifest.helper_output_refs.map((ref) => ref.role).sort();
    for (const role of [
      'artifact_gallery_ref_index',
      'export_capture_manifest',
      'export_pdf',
      'export_pptx',
      'export_presenter_notes',
      'handoff_manifest',
      'native_shape_manifest',
    ]) {
      assert.equal(helperRoles.includes(role), true);
    }
    const handoffRef = manifest.helper_output_refs.find((ref) => ref.role === 'handoff_manifest');
    assert.equal(handoffRef.sha256.length, 64);
    assert.equal(handoffRef.output_ref.includes('handoff-manifest.json'), true);
    for (const helperRef of manifest.helper_output_refs) {
      assert.equal(typeof helperRef.output_ref, 'string');
      assert.equal(typeof helperRef.sha256, 'string');
      assert.equal(helperRef.sha256.length, 64);
      assert.equal(Object.prototype.hasOwnProperty.call(helperRef, 'body'), false);
      assert.equal(Object.prototype.hasOwnProperty.call(helperRef, 'content'), false);
      assert.equal(Object.prototype.hasOwnProperty.call(helperRef, 'blob'), false);
      assert.equal(Object.prototype.hasOwnProperty.call(helperRef, 'visual_truth'), false);
      assert.equal(Object.prototype.hasOwnProperty.call(helperRef, 'review_export_judgment'), false);
    }
  });
});

test('RCA route stage folder helper supplies deterministic owner receipt refs', () => {
  withTempOplState((stateRoot) => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-stage-folder-route-helper-missing-ref-'));
    const paths = getDeliverablePaths(workspaceRoot, 'topic-a', 'deck-a');
    const base = {
      deliverablePaths: paths,
      programId: paths.programId,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      routeStageId: 'export_pptx',
      canonicalStageId: 'package_and_handoff',
      stageOrder: 6,
      attemptId: 'attempt-export-missing-ref',
      outputName: 'export_pptx.json',
    };
    const artifactFile = stageFolderAttemptOutputFile(base, 'export_pptx.json');
    const artifact = {
      route: 'export_pptx',
      status: 'completed',
      export_bundle: {},
    };
    writeJson(artifactFile, artifact);
    const pointers = stageFolderAttemptPaths(base);

    const result = refreshStageFolderRouteArtifact({
      deliverablePaths: paths,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'export_pptx',
      attemptId: 'attempt-export-missing-ref',
      artifactFile,
      artifact,
    });
    assert.deepEqual(result.manifest.owner_receipt_refs, [
      'rca-owner-receipt:visual-stage:ppt_deck:export_pptx:deck-a',
    ]);
    assert.equal(existsSync(path.join(stateRoot, 'runtime-state', 'domains', 'redcube_ai', 'deliverables', paths.programId, 'topic-a', 'deck-a', 'current.json')), true);
    assert.equal(existsSync(path.join(stateRoot, 'runtime-state', 'domains', 'redcube_ai', 'deliverables', paths.programId, 'topic-a', 'deck-a', 'latest.json')), true);
    assert.equal(existsSync(pointers.latest_pointer), true);
    assert.equal(existsSync(pointers.stage_current_file), true);
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

    writeStageFolderOutputFixture({
      deliverablePaths: paths,
      programId: paths.programId,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      routeStageId: 'author_image_pages',
      canonicalStageId: 'artifact_creation',
      stageOrder: 4,
      attemptId: 'attempt-author',
      outputName: 'image_pages_bundle.json',
      ownerReceiptRefs: ['rca-owner-receipt:author'],
    }, { route: 'author_image_pages' });
    writeStageFolderOutputFixture({
      deliverablePaths: paths,
      programId: paths.programId,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      routeStageId: 'repair_image_pages',
      canonicalStageId: 'artifact_creation',
      stageOrder: 4,
      attemptId: 'attempt-repair',
      outputName: 'image_pages_repair_bundle.json',
      ownerReceiptRefs: ['rca-owner-receipt:repair'],
    }, { route: 'repair_image_pages' });

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

    writeStageFolderOutputFixture({
      deliverablePaths: paths,
      programId: paths.programId,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      routeStageId: 'visual_director_review',
      canonicalStageId: 'review_and_revision',
      stageOrder: 5,
      attemptId: 'attempt-director-block',
      outputName: 'visual_director_review.json',
      typedBlockerRefs: ['rca-typed-blocker:visual-director-review'],
    }, {
      route: 'visual_director_review',
      status: 'block',
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
      assert.deepEqual(loaded?.manifest?.owner_receipt_refs, [
        'rca-owner-receipt:visual-stage:xiaohongshu:research:note-a',
      ]);
      assert.equal(
        loaded?.manifest?.owner_receipt_refs.some((ref) => ref.startsWith('rca-owner-receipt:stage-artifact:')),
        false,
      );
      assert.equal(loaded?.manifest?.stage_id, 'source_intake');
      assert.equal(loaded?.manifest?.attempt_id, 'opl-stage-attempt-test-redcube_ai-route-run-1');
      assert.equal(existsSync(loaded?.manifest_file), true);
      assert.equal(readJson(path.join(path.dirname(loaded.manifest_file), 'receipts', 'domain-owner-receipt.json')).owner, 'redcube_ai');
      assert.equal(readJson(path.join(stateRoot, 'runtime-state', 'domains', 'redcube_ai', 'deliverables', paths.programId, 'topic-a', 'note-a', 'current.json')).current_stage.status, 'success');
    });
  });
});
