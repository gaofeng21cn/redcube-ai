// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const CLOSEOUT_CONTRACT = 'contracts/runtime-program/ppt-mainline-quality-closeout.json';
const NATIVE_PROOF_CONTRACT = 'contracts/runtime-program/ppt-native-authoring-proof-lane.json';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('ppt mainline quality closeout records historical visual debt as resolved by later HTML-mainline work', () => {
  const closeout = readJson(CLOSEOUT_CONTRACT);

  assert.equal(closeout.closeout_id, 'ppt_mainline_quality_closeout');
  assert.equal(closeout.status, 'closeout_completed');
  assert.equal(closeout.scope.default_visual_route_at_closeout, 'render_html');
  assert.equal(closeout.scope.current_default_visual_route, 'author_image_pages');
  assert.equal(closeout.scope.current_default_route_contract, 'contracts/runtime-program/ppt-image-first-production-route.json');
  assert.equal(closeout.scope.historical_debt_status, 'resolved_by_later_work');
  assert.equal(closeout.scope.historical_opl_series_deck_required_for_closeout, false);
  assert.deepEqual(closeout.scope.out_of_scope, [
    'rerun historical OPL-series PPT',
    'manual repair of a historical PPT artifact',
    'native PPT proof lane as HTML-mainline fallback',
    'current image-first default route promotion',
    'new product-entry semantics',
  ]);
});

test('ppt mainline quality closeout freezes planned done deferred skipped and verification accounting', () => {
  const closeout = readJson(CLOSEOUT_CONTRACT);

  for (const field of ['planned', 'done', 'deferred', 'skipped', 'verification', 'commit_push_state']) {
    assert.equal(Object.hasOwn(closeout.closeout, field), true, field);
  }
  assert.equal(closeout.closeout.deferred.length, 0);
  assert.equal(closeout.closeout.skipped.includes('historical OPL-series deck rerun'), true);
  assert.equal(closeout.closeout.skipped.includes('native PPT promotion or fallback wiring'), true);
  assert.equal(closeout.closeout.skipped.includes('current image-first route proof rerun inside this historical HTML closeout'), true);
  assert.equal(closeout.closeout.verification.targeted_ppt_quality_tests.status, 'pass');
  assert.equal(closeout.closeout.commit_push_state.expected, 'commit_and_push_after_fresh_verification');
});

test('ppt mainline quality closeout keeps native PPT proof lane separate from HTML quality closure', () => {
  const closeout = readJson(CLOSEOUT_CONTRACT);
  const nativeProof = readJson(NATIVE_PROOF_CONTRACT);

  assert.equal(nativeProof.candidate_route_model.status, 'production_selectable_optional');
  assert.equal(nativeProof.candidate_route_model.default_enabled, false);
  assert.equal(nativeProof.scope.default_mainline_changed, false);
  assert.equal(nativeProof.scope.default_visual_route, 'author_image_pages');
  assert.deepEqual(nativeProof.scope.replaces_routes, ['author_image_pages', 'repair_image_pages']);
  assert.deepEqual(nativeProof.scope.legacy_html_replaces_routes, ['render_html', 'fix_html']);
  assert.equal(closeout.boundary.current_default_visual_route, 'author_image_pages');
  assert.equal(closeout.boundary.html_authoring_lane_role, 'production_selectable_optional_historical_default');
  assert.equal(closeout.boundary.native_ppt_proof_lane_role, 'second_line_editable_pptx_candidate');
  assert.equal(closeout.boundary.native_ppt_used_for_this_closeout, false);
  assert.equal(closeout.boundary.html_mainline_verdict, 'meets_expected_quality_closure_contract');
});
