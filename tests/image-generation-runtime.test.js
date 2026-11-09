import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { generateImage } from '../agent/tools/generate-image.mjs';

test('image requests delegate only domain inputs and keep the selected model', async () => {
  const request = {
    prompt: 'Approved slide content', output_path: '/output/new-slide.png',
    reference_image_paths: ['/input/approved-slide.png'], size: '2048x1152',
  };
  let calls = 0;
  const result = await generateImage(request, async () => ({
    runDomainImageGeneration: async (input) => {
      calls += 1;
      assert.deepEqual(input, { ...request, model: 'gpt-image-2' });
      return {
        surface_kind: 'opl_domain_image_generation', status: 'completed',
        output_path: input.output_path, image_sha256: 'a'.repeat(64),
        model: input.model, operation: 'edit', request_id: null,
        diagnostic: 'provider secret must not cross this surface',
      };
    },
  }));
  assert.equal(calls, 1);
  assert.equal(result.operation, 'edit');
  assert.equal(result.status, 'completed');
  assert.equal('diagnostic' in result, false);
});

test('provider configuration and credential inputs cannot bypass the shared owner', async () => {
  let loaded = false;
  for (const extra of [
    { env: { OPENAI_API_KEY: 'synthetic-secret' } },
    { config_path: '/other/config.toml' }, { base_url: 'https://other.test' },
    { model: 'a-different-model' }, { timeout_ms: 0 }, { reference_image_paths: [2] },
  ]) {
    const result = await generateImage({ prompt: 'Slide', output_path: '/new.png', ...extra }, async () => {
      loaded = true;
      return {};
    });
    assert.equal(result.failure_code, 'invalid_image_request');
  }
  assert.equal(loaded, false);
});

test('typed owner failures are redacted and unknown outcomes are never retried', async () => {
  let calls = 0;
  const result = await generateImage({ prompt: 'Slide', output_path: '/new.png' }, async () => ({
    runDomainImageGeneration: async () => {
      calls += 1;
      throw Object.assign(new Error('synthetic-secret in provider response'), {
        details: {
          failure_code: 'image_generation_unknown', outcome: 'unknown',
          retry_allowed: true, token: 'synthetic-secret',
        },
      });
    },
  }));
  assert.equal(calls, 1);
  assert.deepEqual(result, {
    surface_kind: 'rca_image_generation_failure', status: 'blocked',
    failure_code: 'image_generation_unknown', outcome: 'unknown', retry_allowed: false,
  });
  assert.equal(JSON.stringify(result).includes('synthetic-secret'), false);
  const untyped = await generateImage({ prompt: 'Slide', output_path: '/new.png' }, async () => ({
    runDomainImageGeneration: async () => { throw { details: { failure_code: 'synthetic-secret', outcome: 'synthetic-secret' } }; },
  }));
  assert.equal(untyped.failure_code, 'image_generation_unknown');
  assert.equal(untyped.outcome, 'unknown');
});

test('missing shared entry is a pre-call blocker', async () => {
  for (const load of [async () => { throw new Error('missing module'); }, async () => ({})]) {
    const result = await generateImage({ prompt: 'Slide', output_path: '/new.png' }, load);
    assert.equal(result.failure_code, 'framework_image_generation_unavailable');
    assert.equal(result.outcome, 'not_started');
  }
});

test('projected carrier helper resolves the public module and accepts stdin requests', (t) => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'rca-model-consumer-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const helper = path.join(root, 'agent/tools/generate-image.mjs');
  const framework = path.join(root, 'node_modules/opl-framework');
  mkdirSync(path.dirname(helper), { recursive: true });
  mkdirSync(framework, { recursive: true });
  copyFileSync('plugins/redcube-ai/agent/tools/generate-image.mjs', helper);
  writeFileSync(path.join(framework, 'package.json'), JSON.stringify({
    name: 'opl-framework', type: 'module', exports: { './domain-task-runtime': './runtime.mjs' },
  }));
  writeFileSync(path.join(framework, 'runtime.mjs'), `
    import { writeFileSync } from 'node:fs';
    export async function runDomainImageGeneration(input) {
      writeFileSync(input.output_path, input.prompt);
      return { surface_kind: 'opl_domain_image_generation', status: 'completed',
        output_path: input.output_path, image_sha256: 'a'.repeat(64), model: input.model,
        operation: input.reference_image_paths?.length ? 'edit' : 'generate', request_id: null };
    }
  `);
  for (const [operation, refs] of [['generate', []], ['edit', ['/input.png']]]) {
    const output = path.join(root, `${operation}.png`);
    const run = spawnSync(process.execPath, [helper], {
      input: JSON.stringify({ prompt: 'Approved content', output_path: output, reference_image_paths: refs }),
      encoding: 'utf8', cwd: root,
    });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(JSON.parse(run.stdout).operation, operation);
    assert.equal(readFileSync(output, 'utf8'), 'Approved content');
  }
  const invalid = spawnSync(process.execPath, [helper], { input: '{bad', encoding: 'utf8', cwd: root });
  assert.equal(invalid.status, 1);
  assert.equal(JSON.parse(invalid.stdout).failure_code, 'invalid_image_request');
  assert.equal(invalid.stderr, '');
});
