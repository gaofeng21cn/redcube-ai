// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveSourceAugmentationAdapter } from '../packages/redcube-runtime/dist/source-augmentation-executor.js';

test('resolveSourceAugmentationAdapter exposes a formal default adapter surface', () => {
  const adapter = resolveSourceAugmentationAdapter();

  assert.equal(adapter.adapter, 'external_command');
  assert.equal(adapter.execution_surface, 'external_command');
  assert.equal(adapter.executor_identity, 'source_augmentation_external_command');
  assert.equal(typeof adapter.run, 'function');
});

test('resolveSourceAugmentationAdapter rejects unsupported adapters explicitly', () => {
  assert.throws(() => resolveSourceAugmentationAdapter({ adapter: 'unknown_adapter' }), {
    message: /Unsupported source augmentation adapter/,
  });
});

test('resolveSourceAugmentationAdapter can expose the built-in result_file adapter surface', () => {
  const adapter = resolveSourceAugmentationAdapter({
    adapter: 'result_file',
    resultFile: '/tmp/source-augmentation-result.json',
  });

  assert.equal(adapter.adapter, 'result_file');
  assert.equal(adapter.execution_surface, 'result_file');
  assert.equal(adapter.executor_identity, '/tmp/source-augmentation-result.json');
  assert.equal(typeof adapter.run, 'function');
});
