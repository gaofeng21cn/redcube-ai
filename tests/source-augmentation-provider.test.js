import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveSourceAugmentationAdapter } from '../packages/redcube-runtime/src/index.js';

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
