// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  REDCUBE_STAGE_JSON_BEGIN,
  REDCUBE_STAGE_JSON_END,
  generateStructuredArtifactViaCodexCli,
  probeCodexCli,
  readCodexCliContract,
} from './package-surfaces.ts';

test('readCodexCliContract falls back to local Codex defaults', () => {
  const homeRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-codex-home-'));
  const contract = readCodexCliContract({ HOME: homeRoot });

  try {
    assert.deepEqual(contract.command, ['codex']);
    assert.equal(contract.sandbox, 'workspace-write');
    assert.equal(contract.model, null);
    assert.equal(contract.reasoning_effort, null);
    assert.equal(contract.model_selection, 'inherit_local_codex_default');
    assert.equal(contract.reasoning_selection, 'inherit_local_codex_default');
  } finally {
    rmSync(homeRoot, { recursive: true, force: true });
  }
});

test('readCodexCliContract prefers the OPL-managed canonical Codex shim when present', () => {
  const homeRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-codex-canonical-home-'));
  const canonicalBin = path.join(homeRoot, 'bin', 'codex-canonical');
  mkdirSync(path.dirname(canonicalBin), { recursive: true });
  writeFileSync(canonicalBin, '#!/usr/bin/env bash\nexit 0\n', { mode: 0o755 });

  try {
    const contract = readCodexCliContract({ HOME: homeRoot });
    assert.deepEqual(contract.command, [canonicalBin]);
  } finally {
    rmSync(homeRoot, { recursive: true, force: true });
  }
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

test('generateStructuredArtifactViaCodexCli records deterministic prompt telemetry without faking provider tokens', async () => {
  const result = await generateStructuredArtifactViaCodexCli({
    family: 'ppt_deck',
    route: 'storyline',
    promptRelativePath: 'prompts/ppt_deck/storyline.md',
    context: {
      target_slide_ids: ['S05'],
      revision_context: {
        operator_revision_brief: {
          target_slide_ids: ['S07'],
        },
      },
      slides: [
        { slide_id: 'S01', title: '开场' },
      ],
    },
    outputContract: {
      type: 'object',
      required: ['headline'],
    },
    contract: readCodexCliContract({
      REDCUBE_CODEX_COMMAND: '["node","/tmp/mock-codex.mjs"]',
      REDCUBE_CODEX_MODEL: 'gpt-5.4',
    }),
    spawnSyncImpl(_command, args) {
      const outputFlagIndex = args.indexOf('--output-last-message');
      writeFileSync(
        args[outputFlagIndex + 1],
        [
          REDCUBE_STAGE_JSON_BEGIN,
          JSON.stringify({ headline: 'AI-first storyline' }),
          REDCUBE_STAGE_JSON_END,
        ].join('\n'),
        'utf-8',
      );
      return {
        status: 0,
        stdout: JSON.stringify({
          event: 'run.completed',
          run_id: 'mock-run',
          usage: {
            prompt_tokens: 11,
            completion_tokens: 2,
            total_tokens: 13,
          },
        }),
        stderr: '',
        error: null,
      };
    },
  });

  assert.equal(result.data.headline, 'AI-first storyline');
  assert.equal(result.generationRuntime.prompt_pack_file, 'prompts/ppt_deck/storyline.md');
  assert.equal(result.generationRuntime.prompt_tokens, 11);
  assert.equal(result.generationRuntime.completion_tokens, 2);
  assert.equal(result.generationRuntime.total_tokens, 13);
  assert.equal(Number.isInteger(result.generationRuntime.prompt_bytes), true);
  assert.equal(result.generationRuntime.prompt_bytes > 0, true);
  assert.equal(Number.isInteger(result.generationRuntime.context_bytes), true);
  assert.equal(result.generationRuntime.context_bytes > 0, true);
  assert.deepEqual(result.generationRuntime.prompt_files, ['prompts/ppt_deck/storyline.md']);
  assert.deepEqual(result.generationRuntime.slide_scope.target_slide_ids, ['S05', 'S07']);
  assert.deepEqual(result.generationRuntime.slide_scope.slide_ids, ['S01', 'S05', 'S07']);
  assert.equal(Number.isInteger(result.generationRuntime.estimated_prompt_tokens), true);
  assert.equal(result.generationRuntime.estimated_prompt_tokens > 0, true);
});

test('codex-cli client keeps async codex exec attached while preserving timeout cleanup', () => {
  const source = readFileSync(
    new URL('../packages/redcube-codex-cli-client/src/index-parts/command-process.ts', import.meta.url),
    'utf-8',
  );

  assert.match(source, /detached:\s*false/);
  assert.match(source, /process\.kill\(-pid,\s*'SIGKILL'\)/);
  assert.match(source, /child\.kill\('SIGKILL'\)/);
});
