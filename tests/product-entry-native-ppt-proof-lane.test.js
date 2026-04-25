import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';

import { getProductEntryManifest } from '../packages/redcube-gateway/src/index.js';

test('product-entry manifest exposes native PPT proof lane without changing the default PPT stage sequence', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-native-ppt-manifest-'));
  const manifest = await getProductEntryManifest({
    workspace_locator: {
      workspace_root: workspaceRoot,
    },
  });

  const pptPolicy = manifest.deliverable_facade.family_route_policy.ppt_deck;
  assert.equal(pptPolicy.default_visual_route, 'render_html');
  assert.deepEqual(
    pptPolicy.protected_stage_sequence,
    [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'render_html',
      'visual_director_review',
      'screenshot_review',
      'fix_html',
      'export_pptx',
    ],
  );
  assert.equal(pptPolicy.native_ppt_proof_lane.status, 'opt_in_proof_lane');
  assert.equal(pptPolicy.native_ppt_proof_lane.default_enabled, false);
  assert.deepEqual(pptPolicy.native_ppt_proof_lane.replaces_routes, ['render_html', 'fix_html']);
  assert.deepEqual(
    pptPolicy.native_ppt_proof_lane.preserved_gates,
    ['visual_director_review', 'screenshot_review', 'export_pptx'],
  );
});
