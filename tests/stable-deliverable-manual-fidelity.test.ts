// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync } from 'node:fs';

import { createDeliverable, runDeliverableRoute } from '@redcube/gateway';
import {
  startMockCodexCli,
  withEnv,
} from './helpers/mock-codex-cli.ts';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

async function runRoutes({ workspaceRoot, overlay, topicId, deliverableId, routes }) {
  const results = [];
  for (const route of routes) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay,
      topicId,
      deliverableId,
      route,
    });
    results.push({ route, result });
  }
  return results;
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

test('ppt_deck manual thyroid case does not fall back to AI research-chain default narrative', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-manual-ppt-fidelity-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'manual-ppt-thyroid-basics',
      deliverableId: 'lecture-01',
      title: 'Thyroid Basics',
      goal: 'Explain thyroid fundamentals to undergraduate students',
    });

    const results = await runRoutes({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'manual-ppt-thyroid-basics',
      deliverableId: 'lecture-01',
      routes: ['storyline', 'detailed_outline'],
    });

    for (const { route, result } of results) {
      assert.equal(result.ok, true, route);
    }

    const storyline = readJson(results[0].result.artifactFile);
    const outline = readJson(results[1].result.artifactFile);
    const text = JSON.stringify({
      storyline: storyline.storyline,
      detailed_outline: outline.detailed_outline,
    });

    assert.match(text, /Thyroid Basics|thyroid/i);
    for (const stalePhrase of [
      '把 AI 放回科研链',
      '旧工作流为什么会在这里失效',
      '把科研任务拆成一条 4 段式机制轨道',
      '判断梯：哪些环节适合 AI，哪些必须人工签收',
    ]) {
      assert.equal(text.includes(stalePhrase), false, stalePhrase);
    }
  });
});

test('xiaohongshu manual thyroid clinic case does not fall back to generic tool-order narrative', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-manual-xhs-fidelity-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'manual-xhs-thyroid-clinic',
      deliverableId: 'note-01',
      title: '甲状腺门诊小红书科普',
      goal: '为门诊患者生成可发布的科普图文',
    });

    const results = await runRoutes({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'manual-xhs-thyroid-clinic',
      deliverableId: 'note-01',
      routes: ['research', 'storyline', 'single_note_plan'],
    });

    for (const { route, result } of results) {
      assert.equal(result.ok, true, route);
    }

    const research = readJson(results[0].result.artifactFile);
    const storyline = readJson(results[1].result.artifactFile);
    const plan = readJson(results[2].result.artifactFile);
    const text = JSON.stringify({
      research: research.research,
      storyline: storyline.storyline,
      single_note_plan: plan.single_note_plan,
    });

    assert.match(text, /甲状腺|门诊/);
    for (const stalePhrase of [
      '先别急着上工具',
      '为什么很多人第一步就做反',
      '很多人一上来就先找工具、先看功能、先抄别人的做法',
    ]) {
      assert.equal(text.includes(stalePhrase), false, stalePhrase);
    }
  });
});
