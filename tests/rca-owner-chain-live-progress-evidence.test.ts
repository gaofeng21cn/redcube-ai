// @ts-nocheck
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  createDeliverable,
  dispatchDomainActionAdapter,
  runDeliverableRoute,
  SERIAL_ENV_TEST,
  withMockCodexRuntime,
  withMockCodexRuntimeState,
} from './product-domain-action-case-shared.ts';
import { withEnv } from './helpers/mock-codex-cli.ts';
import { mkUserScopedTestWorkspace } from './helpers/test-workspace.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  fileURLToPath(new URL('./helpers/mock-redcube-python-with-playwright.ts', import.meta.url)),
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readRepoJson(relativePath) {
  return readJson(path.join(repoRoot, relativePath));
}

function assertNoReadyClaims(surface) {
  const serialized = JSON.stringify(surface);
  for (const forbidden of [
    '"visual_ready_claimed":true',
    '"exportable_claimed":true',
    '"handoffable_claimed":true',
    '"domain_ready_claimed":true',
    '"production_ready_claimed":true',
    '"claims_visual_ready":true',
    '"claims_exportable":true',
    '"claims_handoffable":true',
    '"claims_production_visual_soak_complete":true',
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
}

function assertRefPrefix(value, prefix, label) {
  assert.equal(typeof value, 'string', label);
  assert.equal(value.startsWith(prefix), true, `${label}: ${value}`);
}

async function runImageFirstOwnerChainCanary(workspaceRoot) {
  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-owner-chain',
    deliverableId: 'deck-owner-chain',
    title: 'Owner-chain canary',
    goal: '验证 RCA image-first visual owner-chain canary refs',
  });

  for (const route of ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction']) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-owner-chain',
      deliverableId: 'deck-owner-chain',
      route,
    });
    assert.equal(result.ok, true, route);
  }

  const routeResults = [];
  for (const route of ['author_image_pages', 'visual_director_review', 'screenshot_review', 'export_pptx']) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-owner-chain',
      deliverableId: 'deck-owner-chain',
      route,
    });
    assert.equal(result.ok, true, route);
    routeResults.push({ route, result, artifact: readJson(result.artifactFile) });
  }
  return routeResults;
}

test('RCA owner-chain evidence contract records mock-safe visual canary refs without readiness overclaim', () => {
  const evidence = readRepoJson('contracts/owner_chain_live_progress_evidence.json');
  const liveProgress = readRepoJson('contracts/live_stage_run_progress_evidence.json');

  assert.equal(evidence.progress_readout.current_status, 'mock_safe_visual_owner_chain_canary_recorded_live_provider_evidence_open');
  assert.equal(evidence.progress_readout.live_progress_claim_kind, 'mock_safe_artifact_producing_owner_chain_canary_plus_refs_only_owner_actions');
  assert.equal(evidence.progress_readout.artifact_generation_run, true);
  assert.equal(evidence.progress_readout.mock_safe_artifact_generation_run, true);
  assert.equal(evidence.progress_readout.image_api_called, false);
  assert.equal(evidence.progress_readout.workspace_artifact_written, true);
  assert.equal(evidence.progress_readout.repo_tracks_workspace_artifacts, false);
  assert.equal(evidence.progress_readout.visual_ready_claimed, false);
  assert.equal(evidence.progress_readout.exportable_claimed, false);
  assert.equal(evidence.progress_readout.domain_ready_claimed, false);
  assert.equal(evidence.progress_readout.production_ready_claimed, false);

  assert.equal(evidence.live_visual_owner_chain_canary.canary_kind, 'mock_safe_artifact_producing_visual_owner_chain');
  assert.equal(evidence.live_visual_owner_chain_canary.deliverable_family, 'ppt_deck');
  assert.deepEqual(evidence.live_visual_owner_chain_canary.route_chain, [
    'storyline',
    'detailed_outline',
    'slide_blueprint',
    'visual_direction',
    'author_image_pages',
    'visual_director_review',
    'screenshot_review',
    'export_pptx',
  ]);
  assert.equal(evidence.live_visual_owner_chain_canary.image_api_called, false);
  assert.equal(evidence.live_visual_owner_chain_canary.mock_provider_required, true);
  assert.deepEqual(evidence.live_visual_owner_chain_canary.observed_owner_receipt_refs, [
    'rca-owner-receipt:review-export:ppt_deck:visual_director_review:deck-owner-chain',
    'rca-owner-receipt:review-export:ppt_deck:screenshot_review:deck-owner-chain',
    'rca-owner-receipt:review-export:ppt_deck:export_pptx:deck-owner-chain',
  ]);
  assert.deepEqual(evidence.live_visual_owner_chain_canary.observed_review_export_receipt_refs, [
    'rca-review-export:ppt_deck:visual_director_review:deck-owner-chain',
    'rca-review-export:ppt_deck:screenshot_review:deck-owner-chain',
    'rca-review-export:ppt_deck:export_pptx:deck-owner-chain',
  ]);
  assert.deepEqual(evidence.live_visual_owner_chain_canary.observed_typed_blocker_refs, []);
  assert.equal(evidence.live_visual_owner_chain_canary.claims_visual_ready, false);
  assert.equal(evidence.live_visual_owner_chain_canary.claims_exportable, false);
  assert.equal(evidence.live_visual_owner_chain_canary.claims_domain_ready, false);
  assert.equal(evidence.live_visual_owner_chain_canary.claims_production_ready, false);

  assert.equal(evidence.rca_owned_owner_action_canary.canary_kind, 'refs_only_owner_action_runtime_canary');
  assert.deepEqual(evidence.rca_owned_owner_action_canary.observed_return_shapes, [
    'workspace_receipt_proof',
    'domain_receipt',
    'no_regression_evidence',
    'typed_blocker',
  ]);
  assertRefPrefix(
    evidence.rca_owned_owner_action_canary.observed_owner_receipt_ref,
    'rca-owner-receipt:visual-stage:',
    'observed_owner_receipt_ref',
  );
  assertRefPrefix(
    evidence.rca_owned_owner_action_canary.observed_no_regression_evidence_ref,
    'rca-no-regression:visual-stage:',
    'observed_no_regression_evidence_ref',
  );
  assertRefPrefix(
    evidence.rca_owned_owner_action_canary.observed_typed_blocker_ref,
    'rca-typed-blocker:workspace_receipt_proof_missing_required_refs:',
    'observed_typed_blocker_ref',
  );
  assert.equal(evidence.rca_owned_owner_action_canary.payload_body_included, false);
  assert.deepEqual(evidence.rca_owned_owner_action_canary.readiness_claims, {
    claims_visual_ready: false,
    claims_exportable: false,
    claims_handoffable: false,
    claims_production_visual_soak_complete: false,
  });

  assert.equal(evidence.remaining_evidence_gates.real_visual_artifact_generation, 'mock_safe_canary_recorded_live_provider_not_run');
  assert.equal(evidence.remaining_evidence_gates.real_review_export_receipt_instance, 'mock_safe_canary_recorded_live_provider_not_run');
  assert.equal(evidence.remaining_evidence_gates.temporal_controlled_visual_stage_long_soak, 'open');
  assert.equal(liveProgress.source_contract_refs.owner_chain_input_ref, 'contracts/owner_chain_live_progress_evidence.json');
  assert.equal(liveProgress.refs.owner_receipt_refs.includes(evidence.rca_owned_owner_action_canary.observed_owner_receipt_ref), true);
  assert.equal(liveProgress.refs.no_regression_refs.includes('rca-no-regression:visual-stage:production-evidence-tail-ppt-image-first-no-regression'), true);
  assert.equal(liveProgress.refs.typed_blocker_refs.includes('rca-typed-blocker:review-export:human-ready-export-handoff-pending'), true);
  assert.equal(liveProgress.refs.typed_blocker_refs.includes('rca-typed-blocker:controlled-soak:temporal-long-soak-pending'), true);
  assert.equal(liveProgress.refs.human_gate_refs.includes('human_gate:redcube_operator_review_gate'), true);
  assert.equal(
    liveProgress.progress_entries.every((entry) => entry.ready_claim_allowed === false),
    true,
  );
  assert.equal(liveProgress.authority_boundary.declares_visual_ready, false);
  assert.equal(liveProgress.authority_boundary.declares_exportable, false);
  assert.equal(liveProgress.authority_boundary.declares_handoffable, false);
  assert.equal(liveProgress.authority_boundary.declares_production_visual_stage_long_soak_complete, false);
  assertNoReadyClaims(liveProgress);
  assertNoReadyClaims(evidence);
});

test('RCA mock-safe visual owner-chain canary reaches review/export refs and owner-action refs', SERIAL_ENV_TEST, async () => {
  const restoreEnv = withEnv({
    REDCUBE_PYTHON_COMMAND: MOCK_REDCUBE_PYTHON_COMMAND,
    REDCUBE_IMAGE_GENERATION_MOCK: '1',
  });
  try {
    await withMockCodexRuntime(async () => {
      const workspaceRoot = mkUserScopedTestWorkspace('redcube-owner-chain-canary-');
      const routeResults = await runImageFirstOwnerChainCanary(workspaceRoot);
      const byRoute = Object.fromEntries(routeResults.map((entry) => [entry.route, entry]));
      const author = byRoute.author_image_pages.artifact;
      const director = byRoute.visual_director_review.artifact;
      const screenshot = byRoute.screenshot_review.artifact;
      const exported = byRoute.export_pptx.artifact;

      assert.equal(author.status, 'completed');
      assert.equal(author.image_generation_runtime.provider_token_source, 'mock');
      assert.equal(author.image_generation_runtime.provider_token_required, false);
      assert.equal(author.image_generation_runtime.token_persisted, false);
      assert.equal(author.image_pages_bundle.source_visual_route, 'author_image_pages');
      assert.equal(author.image_page_manifest.slides.every((slide) => fs.existsSync(slide.image_file)), true);

      assert.deepEqual(director.owner_receipt_refs, [
        'rca-owner-receipt:review-export:ppt_deck:visual_director_review:deck-owner-chain',
      ]);
      assert.deepEqual(director.typed_blocker_refs, []);
      assert.deepEqual(screenshot.owner_receipt_refs, [
        'rca-owner-receipt:review-export:ppt_deck:screenshot_review:deck-owner-chain',
      ]);
      assert.deepEqual(screenshot.typed_blocker_refs, []);
      assert.equal(screenshot.status, 'pass');
      assert.equal(screenshot.review_capture.source_visual_route, 'author_image_pages');

      assert.deepEqual(exported.owner_receipt_refs, [
        'rca-owner-receipt:review-export:ppt_deck:export_pptx:deck-owner-chain',
      ]);
      assert.deepEqual(exported.typed_blocker_refs, []);
      assert.equal(
        exported.export_bundle.review_receipt_refs.includes(screenshot.owner_receipt_refs[0]),
        true,
      );
      assert.equal(exported.export_bundle.source_visual_route, 'author_image_pages');
      assert.equal(fs.existsSync(exported.export_bundle.pptx_file), true);
      assert.equal(fs.existsSync(exported.export_bundle.pdf_file), true);
      assert.equal(fs.existsSync(exported.export_bundle.artifact_gallery.index_file), true);
      assertNoReadyClaims({ author, director, screenshot, exported });
    });

    await withMockCodexRuntimeState(async () => {
      const workspaceRoot = mkUserScopedTestWorkspace('redcube-owner-action-canary-');
      const proof = await dispatchDomainActionAdapter({
        task: {
          action: 'emit_workspace_receipt_proof',
          workspace_root: workspaceRoot,
          proof_id: 'owner-chain-canary',
          attempt_ref: 'workspace-runtime-ref:attempt:owner-chain-canary',
          artifact_locator_ref: '/artifact_locator_contract',
          review_export_ref: 'rca-review-export:ppt_deck:export_pptx:deck-owner-chain',
          forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
          artifact_refs: ['workspace-runtime-ref:artifact:deck-owner-chain-png-pages'],
        },
      });
      assert.equal(proof.result_surface.surface_kind, 'workspace_receipt_proof');
      assert.equal(proof.result_surface.receipt_refs.domain_owner_receipt_ref, 'rca-owner-receipt:visual-stage:owner-chain-canary-domain-owner');
      assert.equal(proof.result_surface.receipt_refs.no_regression_evidence_ref, 'rca-no-regression:visual-stage:owner-chain-canary-no-regression');
      assert.deepEqual(proof.result_surface.live_visual_route_owner_chain_refs.readiness_claims, {
        claims_visual_ready: false,
        claims_exportable: false,
        claims_handoffable: false,
        claims_production_visual_soak_complete: false,
      });
      assert.equal(proof.result_surface.live_visual_route_owner_chain_refs.payload_body_included, false);
      assert.equal(fs.existsSync(proof.result_surface.proof_file), true);
      assert.equal(fs.existsSync(proof.result_surface.runtime_files.domain_owner_receipt_file), true);
      assert.equal(fs.existsSync(proof.result_surface.runtime_files.no_regression_evidence_file), true);

      const blocker = await dispatchDomainActionAdapter({
        task: {
          action: 'emit_workspace_receipt_proof',
          workspace_root: workspaceRoot,
          proof_id: 'owner-chain-canary-blocker',
        },
      });
      assert.equal(blocker.result_surface.surface_kind, 'typed_blocker');
      assert.equal(blocker.result_surface.blocker_ref, 'rca-typed-blocker:workspace_receipt_proof_missing_required_refs:owner-chain-canary-blocker');
      assert.deepEqual(blocker.result_surface.missing_required_fields, [
        'attempt_ref',
        'artifact_locator_ref',
        'review_export_ref',
        'forbidden_write_proof_ref',
      ]);
      assert.equal(blocker.result_surface.visual_ready_claimed, false);
      assert.equal(blocker.result_surface.exportable_claimed, false);
      assert.equal(blocker.result_surface.handoffable_claimed, false);
      assertNoReadyClaims({ proof, blocker });
    });
  } finally {
    restoreEnv();
  }
});
