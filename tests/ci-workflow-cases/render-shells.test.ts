// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';

import { readRepoFile } from './shared.ts';

test('render shells prefer a deterministic CJK font before platform fallbacks', () => {
  const xiaohongshuShell = readRepoFile('prompts/xiaohongshu/render_shell.html');
  const pptShell = readRepoFile('prompts/ppt_deck/render_shell.html');
  const posterShell = readRepoFile('prompts/poster_onepager/render_shell.html');

  assert.match(
    xiaohongshuShell,
    /font-family:\s*'Noto Sans CJK SC',\s*'Noto Sans SC',\s*-apple-system,\s*BlinkMacSystemFont,\s*'PingFang SC',\s*'Microsoft YaHei',\s*sans-serif;/
  );
  assert.match(
    pptShell,
    /font-family:\s*'Noto Sans CJK SC',\s*'Noto Sans SC',\s*-apple-system,\s*BlinkMacSystemFont,\s*'PingFang SC',\s*'Microsoft YaHei',\s*sans-serif;/
  );
  assert.match(
    posterShell,
    /font-family:\s*'Noto Sans CJK SC',\s*'Noto Sans SC',\s*-apple-system,\s*BlinkMacSystemFont,\s*'PingFang SC',\s*'Microsoft YaHei',\s*sans-serif;/
  );
});

test('ppt render shell protects short Chinese terms from single-character orphan wrapping', () => {
  const pptShell = readRepoFile('prompts/ppt_deck/render_shell.html');

  assert.match(pptShell, /rca-cjk-token/);
  assert.match(pptShell, /protectCjkShortTokens/);
  for (const token of [
    '自动推进',
    '资料同步推进',
    '线索',
    '问题',
    '走向',
    '对齐',
    '阶段产物可审查',
    '证据边界',
    '不越界',
  ]) {
    assert.match(pptShell, new RegExp(token));
  }
});
