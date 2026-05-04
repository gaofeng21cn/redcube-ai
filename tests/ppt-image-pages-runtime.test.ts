// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import { buildDeckRecord, hydratePptDeckContract } from '@redcube/overlay-ppt';
import { getDeliverablePaths } from '@redcube/runtime-protocol';
import { runPptDeckRoute } from '../packages/redcube-runtime-family-ppt/dist/index.js';

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
  contract.stage_requirements.repair_image_pages = { requires_artifacts: ['author_image_pages', 'screenshot_review'] };
  contract.lifecycle_model.route_to_stage.author_image_pages = 'visual_authorship';
  contract.lifecycle_model.route_to_stage.repair_image_pages = 'visual_authorship';
  return contract;
}

function stageArtifactFile(paths, contract, stageId) {
  const stage = [
    ...(Array.isArray(contract.stage_sequence?.stages) ? contract.stage_sequence.stages : []),
    ...(Array.isArray(contract.stage_sequence?.alternate_stages) ? contract.stage_sequence.alternate_stages : []),
  ].find((item) => item.stage_id === stageId);
  return path.join(paths.artifactsDir, stage?.output_artifact || `${stageId}.json`);
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
  writeJson(stageArtifactFile(paths, contract, 'slide_blueprint'), {
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
  writeJson(stageArtifactFile(paths, contract, 'visual_direction'), {
    route: 'visual_direction',
    visual_direction: {
      palette: ['ink', 'red', 'white'],
      visual_rules: ['image-first page', 'readable large type'],
    },
  });
  return { workspaceRoot, topicId, deliverableId, contract, paths };
}

test('ppt author_image_pages writes mocked Responses PNG pages and generation metadata', async () => {
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
  writeJson(stageArtifactFile(paths, contract, 'author_image_pages'), authored);
  writeJson(stageArtifactFile(paths, contract, 'screenshot_review'), {
    route: 'screenshot_review',
    status: 'block',
    blocked_slide_ids: ['S02'],
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
  });

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
