// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';

import { withEnv } from './mock-codex-cli.ts';
import { mkUserScopedTestWorkspace } from './helpers/test-workspace.ts';
import {
  readJson,
  runNativePlanningChain,
  withMockNativePptRuntime,
} from './helpers/ppt-native-ppt-runtime-fixtures.ts';
import { runDeliverableRoute } from './product-domain-action-test-api.ts';

function assertTemplateLayoutBinding(slide) {
  const grammarBinding = slide.template_layout_binding || {};
  const zones = Array.isArray(grammarBinding.zones) ? grammarBinding.zones : [];
  const zoneIds = new Set(zones.map((zone) => zone.zone_id).filter(Boolean));
  assert.equal(typeof grammarBinding.selected_archetype, 'string');
  assert.equal(typeof grammarBinding.archetype_instance_id, 'string');
  assert.equal(typeof grammarBinding.rhythm_role, 'string');
  assert.equal(grammarBinding.zone_gap_in_min >= 0.32, true);
  assert.equal(grammarBinding.zone_inset_in_min >= 0.15, true);
  assert.equal(zones.length >= 3, true);
  assert.equal(
    zones.every((zone) => (
      typeof zone.zone_id === 'string'
      && typeof zone.semantic_role === 'string'
      && zone.bounds
      && Number(zone.bounds.width_in) > 0
      && Number(zone.bounds.height_in) > 0
    )),
    true,
  );
  assert.equal(
    slide.native_shapes.every((shape) => (
      shape.quality_role === 'decorative'
      || ['page_number', 'page_no', 'footer', 'cover_meta'].includes(shape.role)
      || zoneIds.has(shape.layout_zone_id)
    )),
    true,
  );
}

test('native PPT structural retry requires zone binding for structural support shapes', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-structural-zone-binding-');
    const deliverableId = 'deck-structural-zone-binding';
    await runNativePlanningChain({ workspaceRoot, deliverableId });
    const restoreRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'drop_structural_shape_layout_zone_once',
      REDCUBE_NATIVE_PPT_PLAN_MAX_ATTEMPTS: '2',
    });
    try {
      const nativeResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId,
        route: 'author_pptx_native',
      });
      assert.equal(nativeResult.ok, true);
      const authored = readJson(nativeResult.artifactFile);
      const preflight = authored.native_ppt_bundle.ai_first_shape_plan_preflight;
      assert.equal(preflight.self_repair_used, true);
      const structuralRefs = preflight.attempt_artifact_refs
        .filter((file) => file.endsWith('-structural-validation.json'));
      assert.equal(structuralRefs.length >= 1, true);
      const feedback = readJson(structuralRefs[0]);
      assert.equal(
        feedback.required_structural_fixes
          .some((fix) => fix.missing_fields.includes('native_shapes[S01-bridge-connector].layout_zone_id')),
        true,
      );
      assert.match(feedback.repair_request, /structural contract violations/);
      const editableShapePlan = readJson(authored.native_ppt_bundle.editable_shape_plan_file);
      editableShapePlan.slides.forEach((slide) => {
        const zoneIds = new Set(slide.template_layout_binding.zones.map((zone) => zone.zone_id));
        slide.native_shapes
          .filter((shape) => shape.quality_role === 'structural')
          .forEach((shape) => assert.equal(zoneIds.has(shape.layout_zone_id), true));
      });
    } finally {
      restoreRoute();
    }
  });
});

test('native PPT retry preserves passed layout grammar when fixing page number failures', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-page-number-preserve-layout-');
    const deliverableId = 'deck-page-number-preserve-layout';
    await runNativePlanningChain({ workspaceRoot, deliverableId });
    const restoreRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'drop_layout_binding_after_page_number_feedback',
    });
    try {
      const nativeResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId,
        route: 'author_pptx_native',
      });
      assert.equal(nativeResult.ok, true);
      const authored = readJson(nativeResult.artifactFile);
      const preflight = authored.native_ppt_bundle.ai_first_shape_plan_preflight;
      assert.equal(preflight.self_repair_used, true);
      assert.equal(preflight.attempts >= 2, true);
      assert.equal(
        preflight.attempt_artifact_refs
          .some((file) => file.includes('plan-validation-input-attempt-02-structural-validation.json')),
        true,
      );
      const editableShapePlan = readJson(authored.native_ppt_bundle.editable_shape_plan_file);
      editableShapePlan.slides.forEach(assertTemplateLayoutBinding);
      assert.equal(
        editableShapePlan.slides.every((slide) => slide.native_shapes.some((shape) => (
          ['page_number', 'page_no', 'page'].includes(shape.role)
          && String(shape.editable_text || shape.text || '').trim()
        ))),
        true,
      );
    } finally {
      restoreRoute();
    }
  });
});
