import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';

import {
  probeCodexCli,
  readCodexCliContract,
} from '../packages/redcube-codex-cli-client/src/index.js';

test('readCodexCliContract falls back to local Codex defaults', () => {
  const contract = readCodexCliContract({});

  assert.deepEqual(contract.command, ['codex']);
  assert.equal(contract.sandbox, 'workspace-write');
  assert.equal(contract.model, null);
  assert.equal(contract.reasoning_effort, null);
  assert.equal(contract.model_selection, 'inherit_local_codex_default');
  assert.equal(contract.reasoning_selection, 'inherit_local_codex_default');
});

test('readCodexCliContract accepts JSON-array command and explicit model controls', () => {
  const contract = readCodexCliContract({
    REDCUBE_CODEX_COMMAND: '["node","/tmp/mock-codex.mjs"]',
    REDCUBE_CODEX_SANDBOX: 'danger-full-access',
    REDCUBE_CODEX_MODEL: 'gpt-5.4',
    REDCUBE_CODEX_REASONING_EFFORT: 'xhigh',
  });

  assert.deepEqual(contract.command, ['node', '/tmp/mock-codex.mjs']);
  assert.equal(contract.sandbox, 'danger-full-access');
  assert.equal(contract.model, 'gpt-5.4');
  assert.equal(contract.reasoning_effort, 'xhigh');
  assert.equal(contract.model_selection, 'gpt-5.4');
  assert.equal(contract.reasoning_selection, 'xhigh');
});

test('probeCodexCli proves the local exec surface with a mock spawn implementation', async () => {
  const result = await probeCodexCli({
    contract: readCodexCliContract({
      REDCUBE_CODEX_COMMAND: '["node","/tmp/mock-codex.mjs"]',
      REDCUBE_CODEX_MODEL: 'gpt-5.4',
      REDCUBE_CODEX_REASONING_EFFORT: 'xhigh',
    }),
    spawnSyncImpl(command, args) {
      const outputFlagIndex = args.indexOf('--output-last-message');
      writeFileSync(args[outputFlagIndex + 1], 'READY\n', 'utf-8');
      return {
        status: 0,
        stdout: [
          JSON.stringify({ event: 'run.started', run_id: 'mock-run' }),
          JSON.stringify({ event: 'run.completed', run_id: 'mock-run', usage: { total_tokens: 0 } }),
        ].join('\n'),
        stderr: '',
        error: null,
      };
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.runtime_owner, 'codex_cli');
  assert.equal(result.contract.model_selection, 'gpt-5.4');
  assert.equal(result.contract.reasoning_selection, 'xhigh');
  assert.equal(result.steps.exec_surface.ok, true);
  assert.equal(result.steps.exec_surface.terminal_event, 'run.completed');
});
