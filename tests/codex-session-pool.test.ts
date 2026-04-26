// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  generateStructuredArtifactBatchViaCodexCli,
  readCodexCliContract,
} from '@redcube/codex-cli-client';

test('Codex batch surface preserves per-stage contracts and records reuse as unsupported for exec-only CLI', async () => {
  const promptDir = mkdtempSync(path.join(tmpdir(), 'redcube-codex-session-pool-'));
  const promptPack = 'prompts/0_series_planning.md';
  const calls = [];

  const result = await generateStructuredArtifactBatchViaCodexCli({
    contract: readCodexCliContract({
      REDCUBE_CODEX_COMMAND: '["node","/tmp/mock-codex.mjs"]',
      REDCUBE_CODEX_MODEL: 'gpt-5.4',
      REDCUBE_CODEX_REASONING_EFFORT: 'xhigh',
    }),
    cwd: promptDir,
    sessionPool: {
      descriptor_id: 'pool-ppt-run',
      reuse_strategy: 'same_session_if_supported',
    },
    stages: [
      {
        stage_id: 'outline',
        family: 'redcube',
        route: 'ppt_outline',
        promptRelativePath: promptPack,
        context: { topic: 'session pool' },
        outputContract: { type: 'object', required: ['stage'] },
        timeoutMs: 111,
      },
      {
        stage_id: 'draft',
        family: 'redcube',
        route: 'ppt_draft',
        promptRelativePath: promptPack,
        context: { topic: 'session pool', depends_on: 'outline' },
        outputContract: { type: 'object', required: ['stage'] },
        timeoutMs: 222,
      },
    ],
    spawnSyncImpl(command, args, options) {
      calls.push({ command, args, options });
      const outputFlagIndex = args.indexOf('--output-last-message');
      const stage = calls.length === 1 ? 'outline' : 'draft';
      writeFileSync(
        args[outputFlagIndex + 1],
        `REDCUBE_STAGE_JSON_BEGIN\n{"stage":"${stage}"}\nREDCUBE_STAGE_JSON_END`,
        'utf-8',
      );
      return {
        status: 0,
        stdout: [
          JSON.stringify({ event: 'run.started', run_id: `run-${stage}` }),
          JSON.stringify({ event: 'run.completed', run_id: `run-${stage}`, usage: { total_tokens: calls.length } }),
        ].join('\n'),
        stderr: '',
        error: null,
      };
    },
  });

  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map((call) => call.options.timeout), [111, 222]);
  assert.ok(calls.every((call) => call.args.includes('--ephemeral')));
  assert.deepEqual(result.data.map((stage) => stage.stage_id), ['outline', 'draft']);
  assert.deepEqual(result.data.map((stage) => stage.data.stage), ['outline', 'draft']);
  assert.equal(result.batchRuntime.owner, 'codex_cli');
  assert.equal(result.batchRuntime.batch_descriptor.kind, 'codex_cli_batch_descriptor');
  assert.equal(result.batchRuntime.session_pool.descriptor_id, 'pool-ppt-run');
  assert.equal(result.batchRuntime.session_pool.reuse_supported, false);
  assert.equal(result.batchRuntime.session_pool.reuse_claimed, false);
  assert.equal(result.batchRuntime.session_pool.reuse_status, 'unsupported_by_exec_surface');
  assert.equal(result.batchRuntime.session_pool.invocation_count, 2);
  assert.deepEqual(result.batchRuntime.session_pool.stage_session_ids, [
    result.data[0].generationRuntime.session_id,
    result.data[1].generationRuntime.session_id,
  ]);
  assert.notEqual(result.data[0].generationRuntime.session_id, result.data[1].generationRuntime.session_id);
});

test('Codex batch surface rejects duplicate stage ids before invocation', async () => {
  await assert.rejects(
    () => generateStructuredArtifactBatchViaCodexCli({
      stages: [
        { stage_id: 'same', route: 'a', promptRelativePath: 'x.md' },
        { stage_id: 'same', route: 'b', promptRelativePath: 'x.md' },
      ],
      spawnSyncImpl() {
        throw new Error('must not invoke Codex for invalid descriptors');
      },
    }),
    /stage_id 必须唯一/,
  );
});
