import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

import {
  auditDeliverable,
  reviewRenderOutput,
  runtimeWatch,
} from '../packages/redcube-gateway/src/index.js';

test('auditDeliverable blocks optimize_existing task without baseline', async () => {
  const report = await auditDeliverable({
    overlay: 'ppt_deck',
    mode: 'optimize_existing',
    baselineDeliverableId: '',
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['baseline_missing']);
  assert.equal(report.rerun_from_stage, 'intake');
  assert.equal(report.recommended_action, 'bind_baseline_deliverable');
});

test('reviewRenderOutput emits rerun target when visual density is too high', async () => {
  const report = await reviewRenderOutput({
    overlay: 'ppt_deck',
    checks: { visual_density_ok: false, overflow_free: true },
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['visual_density_too_high']);
  assert.equal(report.rerun_from_stage, 'visual_direction');
});

test('reviewRenderOutput reports missing visual density check separately', async () => {
  const report = await reviewRenderOutput({
    overlay: 'ppt_deck',
    checks: {},
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['visual_density_check_missing']);
  assert.equal(report.rerun_from_stage, 'render_review');
  assert.equal(report.recommended_action, 'supply_render_checks');
});

test('runtimeWatch reports pending review loop state', async () => {
  const report = await runtimeWatch({
    run: {
      run_id: 'run-1',
      current_stage: 'render_review',
      status: 'blocked',
      pending_reviews: ['render_review'],
      resumable: true,
    },
  });

  assert.equal(report.ok, true);
  assert.equal(report.run_id, 'run-1');
  assert.equal(report.current_stage, 'render_review');
  assert.equal(report.status, 'review_pending');
  assert.deepEqual(report.pending_reviews, ['render_review']);
  assert.equal(report.resumable, true);
});

test('@redcube/gateway manifest declares runtime dependency for review loop actions', () => {
  const gatewayPackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-gateway/package.json'), 'utf-8'),
  );
  const runtimePackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-runtime/package.json'), 'utf-8'),
  );

  assert.equal(
    gatewayPackageJson.dependencies?.['@redcube/runtime'],
    runtimePackageJson.version,
  );
});
