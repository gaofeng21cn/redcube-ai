// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';

import {
  REDCUBE_STAGE_JSON_BEGIN,
  REDCUBE_STAGE_JSON_END,
  generateStructuredArtifactViaCodexCli,
  readCodexCliContract,
} from './package-surfaces.ts';

async function captureGenerationTimeout(options = {}) {
  const observedTimeouts = [];
  await generateStructuredArtifactViaCodexCli({
    family: 'ppt_deck',
    route: 'storyline',
    promptRelativePath: 'prompts/ppt_deck/storyline.md',
    context: { title: 'Timeout contract' },
    outputContract: {
      type: 'object',
      required: ['ok'],
    },
    contract: readCodexCliContract({
      REDCUBE_CODEX_COMMAND: '["node","/tmp/mock-codex.mjs"]',
    }),
    spawnSyncImpl(_command, args, spawnOptions) {
      observedTimeouts.push(spawnOptions.timeout);
      const outputFlagIndex = args.indexOf('--output-last-message');
      writeFileSync(
        args[outputFlagIndex + 1],
        [
          REDCUBE_STAGE_JSON_BEGIN,
          JSON.stringify({ ok: true }),
          REDCUBE_STAGE_JSON_END,
        ].join('\n'),
        'utf-8',
      );
      return {
        status: 0,
        stdout: JSON.stringify({ event: 'run.completed', run_id: 'mock-run' }),
        stderr: '',
        error: null,
      };
    },
    ...options,
  });

  return observedTimeouts.at(-1);
}

test('codex cli grants longer default timeout to image-backed review prompts while preserving explicit overrides', async () => {
  assert.equal(await captureGenerationTimeout(), 600000);
  assert.equal(
    await captureGenerationTimeout({
      localFileInspection: [
        { path: '/tmp/slide-01.png', media_type: 'image/png', label: 'slide-01' },
      ],
    }),
    1800000,
  );
  assert.equal(
    await captureGenerationTimeout({
      timeoutMs: 123456,
      localFileInspection: [
        { path: '/tmp/slide-01.png', media_type: 'image/png', label: 'slide-01' },
      ],
    }),
    123456,
  );
});

test('codex cli grants render_html routes the same longer default timeout as image-backed review prompts', async () => {
  assert.equal(
    await captureGenerationTimeout({ route: 'render_html' }),
    1800000,
  );
  assert.equal(
    await captureGenerationTimeout({ family: 'xiaohongshu', route: 'render_html' }),
    1800000,
  );
  assert.equal(
    await captureGenerationTimeout({ family: 'ppt_deck', route: 'storyline' }),
    600000,
  );
});

test('codex cli structured generation timeout can be extended by environment without per-route code changes', async () => {
  const original = process.env.REDCUBE_CODEX_GENERATION_TIMEOUT_MS;
  process.env.REDCUBE_CODEX_GENERATION_TIMEOUT_MS = '1200000';
  try {
    assert.equal(await captureGenerationTimeout({ family: 'ppt_deck', route: 'detailed_outline' }), 1200000);
  } finally {
    if (original === undefined) {
      delete process.env.REDCUBE_CODEX_GENERATION_TIMEOUT_MS;
    } else {
      process.env.REDCUBE_CODEX_GENERATION_TIMEOUT_MS = original;
    }
  }
});
