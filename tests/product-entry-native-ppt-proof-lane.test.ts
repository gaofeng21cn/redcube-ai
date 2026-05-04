// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync } from 'node:fs';

import { getProductEntryManifest } from './gateway-test-api.ts';

const HELPER_CATALOG_FILE = 'contracts/runtime-program/python-native-helper-catalog.json';

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

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
  assert.equal(pptPolicy.native_ppt_proof_lane.status, 'production_selectable_optional');
  assert.equal(pptPolicy.native_ppt_proof_lane.default_enabled, false);
  assert.equal(pptPolicy.native_ppt_proof_lane.production_selectable, true);
  assert.deepEqual(pptPolicy.native_ppt_proof_lane.runnable_routes, ['author_pptx_native', 'repair_pptx_native']);
  assert.deepEqual(pptPolicy.native_ppt_proof_lane.replaces_routes, ['render_html', 'fix_html']);
  assert.deepEqual(
    pptPolicy.native_ppt_proof_lane.preserved_gates,
    ['visual_director_review', 'screenshot_review', 'export_pptx'],
  );
  assert.deepEqual(pptPolicy.native_ppt_proof_lane.ai_first_editing_contract, {
    contract_id: 'ppt_native_ai_first_editing_contract_v1',
    creative_owner: 'llm_agent',
    editable_shape_plan_required: true,
    editable_shape_manifest_required: true,
    python_helper_role: 'execute_validate_export_only',
    template_substitution_allowed: false,
    preserved_gates: ['visual_director_review', 'screenshot_review', 'export_pptx'],
  });
  assert.deepEqual(pptPolicy.native_ppt_proof_lane.unit_repair_scope, {
    repair_route: 'repair_pptx_native',
    scope: 'page',
    target_source: 'screenshot_review.blocked_slide_ids',
    passed_slides_reused: true,
    preserved_slide_policy: 'do_not_reauthor_passed_slides',
  });
  assert.deepEqual(pptPolicy.native_ppt_proof_lane.engine_capabilities, {
    authoring_ir: 'redcube_svg_ir',
    pptx_writer: 'redcube_drawingml_writer',
    editable_pptx: true,
    strict_svg_preflight: true,
    true_render_proof_required: true,
    true_render_proof_renderer: 'libreoffice_headless',
    cross_platform_render_required: true,
    screenshot_packaging: false,
  });
  assert.equal(pptPolicy.native_ppt_proof_lane.true_render_proof.required, true);
  assert.equal(pptPolicy.native_ppt_proof_lane.true_render_proof.renderer_kind, 'libreoffice_headless');
  assert.equal(pptPolicy.native_ppt_proof_lane.true_render_proof.renderer_pipeline, 'libreoffice_headless_pdf_png_v1');
  assert.equal(pptPolicy.native_ppt_proof_lane.true_render_proof.runtime, 'libreoffice_headless');
  assert.equal(pptPolicy.native_ppt_proof_lane.true_render_proof.cross_platform_render_required, true);
  assert.equal(pptPolicy.native_ppt_proof_lane.true_render_proof.synthetic_preview_allowed, false);
});

test('native helper doctor stays diagnostic-only and preserves product-entry proof lane gates', async () => {
  const catalog = readJson(HELPER_CATALOG_FILE);
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-native-ppt-doctor-'));
  const manifest = await getProductEntryManifest({
    workspace_locator: {
      workspace_root: workspaceRoot,
    },
  });
  const proofLane = manifest.deliverable_facade.family_route_policy.ppt_deck.native_ppt_proof_lane;

  assert.equal(catalog.package.diagnostics.surface_kind, 'python_native_helper_doctor');
  assert.equal(catalog.package.diagnostics.executes_review_export_gates, false);
  assert.equal(catalog.package.diagnostics.route_authority, 'diagnostic_only');
  assert.equal(catalog.package.diagnostics.bypass_product_entry_allowed, false);
  assert.deepEqual(proofLane.preserved_gates, ['visual_director_review', 'screenshot_review', 'export_pptx']);
  assert.deepEqual(catalog.bypass_policy.required_review_export_gates, proofLane.preserved_gates);
});
