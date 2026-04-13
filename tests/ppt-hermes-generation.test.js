import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import {
  createDeliverable,
  intakeSource,
  runDeliverableRoute,
} from '../packages/redcube-gateway/src/index.js';
import {
  startMockCodexCli,
  withEnv,
} from './helpers/mock-codex-cli.js';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

async function withMockHermesUpstream(testFn) {
  const upstream = await startMockCodexCli();
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

test('ppt core authoring stages carry Codex generation evidence and keep operator meta instructions out of audience-facing content', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-hermes-generation-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'MedAutoScience 系统介绍',
      goal: '面向医学人工智能小同行正式讲课，封面必须署名，重点回答三件事，先讲什么后讲什么要清楚，不要把内部文档原话放进 PPT。',
    });

    const storylineResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    });
    const outlineResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'detailed_outline',
    });
    const blueprintResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'slide_blueprint',
    });
    const visualResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'visual_direction',
    });

    assert.equal(storylineResult.ok, true);
    assert.equal(outlineResult.ok, true);
    assert.equal(blueprintResult.ok, true);
    assert.equal(visualResult.ok, true);

    const storyline = readJson(storylineResult.artifactFile);
    const outline = readJson(outlineResult.artifactFile);
    const blueprint = readJson(blueprintResult.artifactFile);
    const visual = readJson(visualResult.artifactFile);

    assert.match(storyline.creative_execution?.generation_runtime?.run_id || '', /^run_(mock|codex)_/);
    assert.equal(storyline.creative_execution?.generation_runtime?.owner, 'codex_cli');
    assert.equal(storyline.storyline?.creative_sources?.core_metaphor?.materialized_from, 'codex_cli_json_output');
    assert.equal(storyline.storyline?.creative_sources?.narrative_arc?.materialized_from, 'codex_cli_json_output');

    const audienceFacingText = [
      storyline.storyline?.core_metaphor,
      ...(storyline.storyline?.narrative_arc?.hook || []),
      ...(storyline.storyline?.narrative_arc?.journey || []),
      ...(storyline.storyline?.narrative_arc?.resolution || []),
      ...((outline.detailed_outline?.slides || []).flatMap((slide) => [
        slide.title,
        slide.page_objective,
        slide.core_sentence,
        ...(slide.page_core_content || []),
        slide.speaker_notes,
        slide.transition_sentence,
      ])),
      ...((blueprint.slide_blueprint?.slides || []).flatMap((slide) => [
        slide.title,
        slide.page_goal,
        slide.core_sentence,
        ...(slide.page_core_content || []).map((item) => item?.text || item),
        slide.speaker_notes,
        slide.transition_sentence,
      ])),
      visual.visual_direction?.visual_manifest,
      ...(visual.visual_direction?.what_it_is || []),
    ].join('\n');

    assert.equal(/封面必须署名|重点回答三件事|内部文档/.test(audienceFacingText), false);
    assert.equal(/先讲 面向医学人工智能小同行正式讲课/.test(audienceFacingText), false);
    assert.equal((outline.detailed_outline?.slides || []).length >= 6, true);
    assert.equal((blueprint.slide_blueprint?.slides || []).length >= 6, true);
  });
});

test('ppt authoring context keeps lecture_peer audience and public source labels aligned to source truth', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-hermes-audience-'));
    const sourceFile = path.join(workspaceRoot, 'med-auto-science.md');
    writeFileSync(sourceFile, [
      '# 项目概览',
      '',
      '`Med Auto Science` 是共享 `Unified Harness Engineering Substrate` 之上的医学 `Research Ops` gateway 与 `Domain Harness OS`。',
    ].join('\n'), 'utf-8');

    await intakeSource({
      workspaceRoot,
      topicId: 'topic-a',
      title: 'MedAutoScience 系统介绍',
      brief: '为医学人工智能小同行讲课，讲清系统为什么能支撑自动科研。',
      keywords: ['MedAutoScience', '自动科研', '医学人工智能'],
      sourceFiles: [sourceFile],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'MedAutoScience 系统介绍',
      goal: '面向医学人工智能小同行正式讲课，讲清系统设计、推进路径与模块复用。',
    });

    const storylineResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    });

    const storyline = readJson(storylineResult.artifactFile);
    assert.equal(storyline.storyline?.audience, '临床科研同行');
    assert.equal(storyline.storyline?.fact_library_summary.includes('<p align'), false);
    assert.equal(storyline.storyline?.fact_library_summary.includes('English'), false);
  });
});
