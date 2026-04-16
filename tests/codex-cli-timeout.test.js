import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start === -1) {
    throw new Error(`Missing function ${name}`);
  }
  const next = source.indexOf('\nfunction ', start + 1);
  return source.slice(start, next === -1 ? undefined : next);
}

test('codex cli grants longer default timeout to image-backed review prompts while preserving explicit overrides', () => {
  const source = readFileSync('packages/redcube-codex-cli-client/src/index.js', 'utf-8');
  const helperCode = [
    extractFunction(source, 'safeText'),
    extractFunction(source, 'normalizeLocalFileInspection'),
    extractFunction(source, 'resolveGenerationTimeoutMs'),
  ].join('\n\n');

  const helpers = new Function(`
    const DEFAULT_CODEX_GENERATION_TIMEOUT_MS = 600000;
    const DEFAULT_CODEX_VISUAL_REVIEW_TIMEOUT_MS = 1800000;
    ${helperCode}
    return { resolveGenerationTimeoutMs };
  `)();

  assert.equal(helpers.resolveGenerationTimeoutMs(undefined, []), 600000);
  assert.equal(helpers.resolveGenerationTimeoutMs(undefined, [
    { path: '/tmp/slide-01.png', media_type: 'image/png', label: 'slide-01' },
  ]), 1800000);
  assert.equal(helpers.resolveGenerationTimeoutMs(123456, [
    { path: '/tmp/slide-01.png', media_type: 'image/png', label: 'slide-01' },
  ]), 123456);
});
