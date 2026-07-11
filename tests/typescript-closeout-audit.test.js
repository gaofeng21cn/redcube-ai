import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

import {
  assertNoTrackedProductJavaScript,
  trackedProductJavaScript,
} from '../scripts/run-typescript-closeout-audit.ts';

test('product source stays TypeScript while ordinary tests may use JavaScript', () => {
  const tracked = execFileSync('git', ['ls-files', 'apps', 'packages'], { encoding: 'utf-8' })
    .split('\n')
    .filter(Boolean);
  assert.deepEqual(trackedProductJavaScript(tracked), []);
  assert.doesNotThrow(() => assertNoTrackedProductJavaScript(['tests/example.test.js']));
  assert.throws(
    () => assertNoTrackedProductJavaScript(['packages/example/src/index.js']),
    /packages\/example\/src\/index\.js/,
  );
});
