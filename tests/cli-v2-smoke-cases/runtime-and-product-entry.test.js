import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(file, 'utf-8');
}

test('CLI product-entry path keeps RCA as handler target while OPL owns hosted wrappers', () => {
  const dispatch = read('apps/redcube-cli/src/cli-parts/dispatch.ts');
  assert.match(dispatch, /product/);
  assert.match(dispatch, /domain-handler/);
  assert.match(dispatch, /invokeProductEntry|invoke_product_entry|product entry/i);
  assert.doesNotMatch(dispatch, /opl_generated:product_status/);
});

test('CLI proof commands remain controlled helpers, not runtime readiness claims', () => {
  const dispatch = read('apps/redcube-cli/src/cli-parts/dispatch.ts');
  assert.match(dispatch, /image-ppt/);
  assert.match(dispatch, /native-ppt/);
  assert.doesNotMatch(dispatch, /production_ready|live_ready|release_ready/);
});
