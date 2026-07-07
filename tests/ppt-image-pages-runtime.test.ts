// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import { buildDeckRecord, hydratePptDeckContract } from '@redcube/overlay-ppt';
import {
  canonicalStageForRoute,
  getDeliverablePaths,
  stageOrderForCanonicalStage,
  stageFolderOutputPath,
  writeStageFolderArtifact,
} from '@redcube/runtime-protocol';
import { runPptDeckRoute } from '../packages/redcube-runtime/dist/families/ppt/index.js';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function writeJson(file, data) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function injectImagePageRoutes(contract) {
  const stages = contract.stage_sequence.stages;
  const visualIndex = stages.findIndex((stage) => stage.stage_id === 'visual_direction');
  const screenshotIndex = stages.findIndex((stage) => stage.stage_id === 'screenshot_review');
  stages.splice(visualIndex + 1, 0, {
    stage_id: 'author_image_pages',
    label: 'Author image pages',
    output_artifact: 'author_image_pages.json',
  });
  stages.splice(screenshotIndex + 2, 0, {
    stage_id: 'repair_image_pages',
    label: 'Repair image pages',
    output_artifact: 'repair_image_pages.json',
  });
  contract.stage_requirements.author_image_pages = { requires_artifacts: ['slide_blueprint', 'visual_direction'] };
  contract.stage_requirements.repair_image_pages = {
    requires_artifacts: ['author_image_pages'],
    requires_review_from_any: ['visual_director_review', 'screenshot_review'],
  };
  contract.lifecycle_model.route_to_stage.author_image_pages = 'visual_authorship';
  contract.lifecycle_model.route_to_stage.repair_image_pages = 'visual_authorship';
  return contract;
}

function stageContractEntry(contract, stageId) {
  return [
    ...(Array.isArray(contract.stage_sequence?.stages) ? contract.stage_sequence.stages : []),
    ...(Array.isArray(contract.stage_sequence?.alternate_stages) ? contract.stage_sequence.alternate_stages : []),
  ].find((item) => item.stage_id === stageId);
}

function stageOutputName(contract, stageId) {
  const stage = stageContractEntry(contract, stageId);
  return stage?.output_artifact || `${stageId}.json`;
}

function stageFolderFixtureOutputFile(paths, contract, stageId, attemptId = `seed-${stageId}`) {
  const canonicalStageId = canonicalStageForRoute(stageId);
  return stageFolderOutputPath({
    deliverablePaths: paths,
    routeStageId: stageId,
    canonicalStageId,
    stageOrder: stageOrderForCanonicalStage(canonicalStageId),
    attemptId,
    outputName: stageOutputName(contract, stageId),
  });
}

function writeStageArtifact(paths, contract, stageId, artifact, status = 'success') {
  const canonicalStageId = canonicalStageForRoute(stageId);
  const attemptId = `seed-${stageId}`;
  const outputName = stageOutputName(contract, stageId);
  const artifactFile = stageFolderFixtureOutputFile(paths, contract, stageId, attemptId);
  writeJson(artifactFile, artifact);
  writeStageFolderArtifact({
    deliverablePaths: paths,
    routeStageId: stageId,
    canonicalStageId,
    stageOrder: stageOrderForCanonicalStage(canonicalStageId),
    attemptId,
    artifactFile,
    outputName,
    status,
    ownerReceiptRefs: status === 'success' ? [`rca-owner-receipt:test-seed:${stageId}`] : [],
    typedBlockerRefs: status === 'blocked' ? [`rca-typed-blocker:test-seed:${stageId}`] : [],
    blockingReasons: artifact?.blocking_reasons || artifact?.review_state_patch?.blocking_reasons || artifact?.issues || [],
  });
}

function seedWorkspace() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-image-pages-'));
  const topicId = 'topic-a';
  const deliverableId = 'deck-a';
  const record = buildDeckRecord({
    topicId,
    deliverableId,
    title: 'Image page route deck',
    profileId: 'lecture_student',
    goal: 'Validate image page runtime route',
  });
  const contract = injectImagePageRoutes(hydratePptDeckContract({
    topicId,
    deliverableId,
    title: 'Image page route deck',
    profileId: 'lecture_student',
    goal: 'Validate image page runtime route',
  }));
  const paths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  writeJson(paths.deliverableFile, { ...record, hydrated_contract_ref: 'contracts/hydrated-deliverable.json' });
  writeJson(path.join(paths.deliverableDir, 'contracts/hydrated-deliverable.json'), contract);
  writeStageArtifact(paths, contract, 'slide_blueprint', {
    route: 'slide_blueprint',
    slide_blueprint: {
      slides: [
        {
          slide_id: 'S01',
          title: 'Opening signal',
          layout_family: 'cover_signal',
          core_sentence: 'One clear opening page.',
        },
        {
          slide_id: 'S02',
          title: 'Blocked page',
          layout_family: 'multi_zone_compare',
          core_sentence: 'This page will be repaired.',
        },
      ],
    },
  });
  writeStageArtifact(paths, contract, 'visual_direction', {
    route: 'visual_direction',
    visual_direction: {
      palette: ['ink', 'red', 'white'],
      visual_rules: ['image-first page', 'readable large type'],
    },
  });
  return { workspaceRoot, topicId, deliverableId, contract, paths };
}

test('ppt author_image_pages writes mocked PNG pages and generation metadata', async () => {
  const { workspaceRoot, topicId, deliverableId, contract, paths } = seedWorkspace();
  const restoreMock = Object.assign(process.env, { REDCUBE_IMAGE_GENERATION_MOCK: '1' });
  assert.equal(restoreMock.REDCUBE_IMAGE_GENERATION_MOCK, '1');

  const artifact = await runPptDeckRoute({
    workspaceRoot,
    topicId,
    deliverableId,
    route: 'author_image_pages',
    contract,
  });

  assert.equal(artifact.status, 'completed');
  assert.equal(artifact.image_generation_runtime.endpoint, '/responses');
  assert.equal(artifact.image_generation_runtime.token_persisted, false);
  assert.equal(artifact.image_page_manifest.slides.length, 2);
  assert.equal(artifact.image_generation_calls.length, 2);
  assert.equal(artifact.image_generation_calls[0].provider.length > 0, true);
  assert.equal(artifact.image_generation_calls[0].request_model.length > 0, true);
  assert.equal(artifact.image_generation_calls[0].image_generation_tool_options.type, 'image_generation');
  assert.equal(artifact.image_generation_calls[0].endpoint, '/responses');
  assert.equal(artifact.image_generation_calls[0].default_image_model, 'gpt-image-2');
  assert.equal(artifact.image_pages_bundle.source_visual_route, 'author_image_pages');
  assert.equal(artifact.image_pages_bundle.editable, false);
  assert.equal(existsSync(artifact.image_page_manifest.slides[0].image_file), true);
  assert.equal(existsSync(artifact.image_page_manifest.prompt_manifest), true);
  assert.equal(existsSync(artifact.image_page_manifest.style_manifest), true);
  assert.equal(existsSync(artifact.image_page_manifest.generation_metadata_file), true);
  const deckPromptManifest = readJson(artifact.image_page_manifest.prompt_manifest);
  const slidePromptManifest = readJson(artifact.image_pages_bundle.pages[0].prompt_manifest_file);
  assert.equal(deckPromptManifest.fact_governance.fact_whitelist_surface, 'shared_source_truth.readable_shared_source_truth_fields');
  assert.equal(deckPromptManifest.verified_asset_policy.deterministic_overlay_only, true);
  assert.equal(deckPromptManifest.long_deck_contract.contract_id, 'ppt_image_first_long_deck_production_v1');
  assert.equal(deckPromptManifest.forbidden_generated_artifacts.includes('fake QR code'), true);
  assert.equal(deckPromptManifest.audience_language_policy.visible_operator_language_allowed, false);
  assert.equal(deckPromptManifest.audience_language_policy.forbidden_visible_fragments.includes('汇报讨论用途'), true);
  assert.equal(deckPromptManifest.layout_legibility_policy.title_safe_zone_clear.required, true);
  assert.equal(deckPromptManifest.layout_legibility_policy.table_legibility.min_body_font_pt, 11);
  assert.equal(slidePromptManifest.fact_governance.verification_ledger_surface, 'reports/fact-verification-ledger.json');
  assert.equal(slidePromptManifest.verified_asset_policy.composition_repair_allowed, false);
  assert.equal(slidePromptManifest.long_deck_contract.full_long_deck_default_regression, false);
  assert.equal(slidePromptManifest.audience_language_policy.forbidden_visible_fragments.includes('author_pptx_native'), true);
  assert.equal(slidePromptManifest.layout_legibility_policy.table_legibility.max_blank_ratio_in_card, 0.38);
  assert.equal(artifact.image_page_manifest.slides[0].dimensions.width, 1536);
  assert.equal(artifact.image_page_manifest.slides[0].dimensions.height, 864);
  assert.equal(existsSync(artifact.image_pages_bundle.pages[0].prompt_manifest_file), true);
  assert.equal(existsSync(artifact.image_pages_bundle.pages[0].style_manifest_file), true);
});

test('ppt repair_image_pages regenerates only blocked screenshot-review pages', async () => {
  const { workspaceRoot, topicId, deliverableId, contract, paths } = seedWorkspace();
  process.env.REDCUBE_IMAGE_GENERATION_MOCK = '1';

  const authored = await runPptDeckRoute({
    workspaceRoot,
    topicId,
    deliverableId,
    route: 'author_image_pages',
    contract,
  });
  writeStageArtifact(paths, contract, 'author_image_pages', authored);
  writeStageArtifact(paths, contract, 'screenshot_review', {
    route: 'screenshot_review',
    status: 'block',
    blocked_slide_ids: ['S02'],
    review_state_patch: {
      rerun_from_stage: 'repair_image_pages',
      rerun_policy: {
        status: 'rerun_required',
        rerun_from_stage: 'repair_image_pages',
      },
    },
    slide_reviews: [
      {
        slide_id: 'S01',
        title: 'Opening signal',
        status: 'pass',
        checks: { block_content_fit_ok: true },
        issues: [],
        ai_review: { judgement: 'pass', visual_findings: ['ok'], recommended_fix: 'none' },
      },
      {
        slide_id: 'S02',
        title: 'Blocked page',
        status: 'block',
        checks: { block_content_fit_ok: false },
        issues: ['block_content_overflow_detected'],
        mechanical_issues: ['block_content_overflow_detected'],
        ai_review: {
          judgement: 'block',
          visual_findings: ['text overflow'],
          recommended_fix: 'reduce text and redraw only this page',
        },
      },
    ],
  }, 'blocked');

  const repaired = await runPptDeckRoute({
    workspaceRoot,
    topicId,
    deliverableId,
    route: 'repair_image_pages',
    contract,
  });

  const s01Before = authored.image_page_manifest.slides.find((slide) => slide.slide_id === 'S01');
  const s01After = repaired.image_page_manifest.slides.find((slide) => slide.slide_id === 'S01');
  const s02After = repaired.image_page_manifest.slides.find((slide) => slide.slide_id === 'S02');
  assert.equal(repaired.image_generation_calls.length, 1);
  assert.deepEqual(repaired.repair_image_pages.blocked_slide_ids, ['S02']);
  assert.equal(s01After.preserved, true);
  assert.equal(s01After.hash, s01Before.hash);
  assert.equal(s01After.preserved_slide_hash, s01Before.hash);
  assert.equal(s02After.preserved, false);
  assert.deepEqual(repaired.repair_image_pages.preserved_slide_hashes, [{
    slide_id: 'S01',
    preserved_slide_hash: s01Before.hash,
    image_file: s01Before.image_file,
  }]);
});

test('ppt repair_image_pages targets reviewed pages when deck-level image review blocks without slide ids', async () => {
  const { workspaceRoot, topicId, deliverableId, contract, paths } = seedWorkspace();
  process.env.REDCUBE_IMAGE_GENERATION_MOCK = '1';

  const authored = await runPptDeckRoute({
    workspaceRoot,
    topicId,
    deliverableId,
    route: 'author_image_pages',
    contract,
  });
  writeStageArtifact(paths, contract, 'author_image_pages', authored);
  writeStageArtifact(paths, contract, 'screenshot_review', {
    route: 'screenshot_review',
    status: 'block',
    checks: {
      teaching_progression_clear: false,
    },
    review_execution: {
      reviewed_slide_ids: ['S01', 'S02'],
    },
    review_state_patch: {
      rerun_from_stage: 'repair_image_pages',
      blocking_reasons: ['teaching_progression_clear'],
      rerun_policy: {
        status: 'rerun_required',
        rerun_from_stage: 'repair_image_pages',
      },
    },
    slide_reviews: [
      {
        slide_id: 'S01',
        title: 'Opening signal',
        status: 'pass',
        checks: { block_content_fit_ok: true },
        issues: [],
        ai_review: { judgement: 'pass', visual_findings: ['ok'], recommended_fix: 'none' },
      },
      {
        slide_id: 'S02',
        title: 'Blocked page',
        status: 'pass',
        checks: { block_content_fit_ok: true },
        issues: [],
        ai_review: { judgement: 'pass', visual_findings: ['ok'], recommended_fix: 'none' },
      },
    ],
  }, 'blocked');

  const repaired = await runPptDeckRoute({
    workspaceRoot,
    topicId,
    deliverableId,
    route: 'repair_image_pages',
    contract,
  });

  assert.equal(repaired.image_generation_calls.length, 2);
  assert.deepEqual(repaired.repair_image_pages.blocked_slide_ids, ['S01', 'S02']);
  assert.deepEqual(repaired.repair_image_pages.preserved_slide_hashes, []);
  assert.equal(
    repaired.image_page_manifest.slides.every((slide) => slide.preserved === false),
    true,
  );
});
