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

test('native PPT AI shape plan records template layout grammar and per-slide zone bindings', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-template-layout-');
    const deliverableId = 'deck-template-layout-grammar';
    await runNativePlanningChain({ workspaceRoot, deliverableId });

    const authorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
      route: 'author_pptx_native',
    });
    assert.equal(authorResult.ok, true);
    const authored = readJson(authorResult.artifactFile);
    const editableShapePlan = readJson(authored.native_ppt_bundle.editable_shape_plan_file);

    assert.equal(editableShapePlan.template_layout_grammar?.owner, 'llm_agent');
    assert.equal(editableShapePlan.template_layout_grammar?.required, true);
    assert.equal(editableShapePlan.template_layout_grammar?.materializer_role, 'execute_selected_archetype_zones_only');
    assert.equal(editableShapePlan.template_layout_grammar?.helper_template_layout_allowed, false);
    assert.equal(editableShapePlan.template_layout_grammar?.archetype_catalog.length >= 5, true);
    assert.equal(
      editableShapePlan.template_layout_grammar.archetype_catalog
        .some((archetype) => archetype.archetype_id === 'professional_system_map'),
      true,
    );
    editableShapePlan.slides.forEach(assertTemplateLayoutBinding);
  });
});

test('native PPT AI shape plan rejects missing template layout grammar before materialization', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-missing-layout-grammar-');
    await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-missing-layout-grammar' });
    const restoreRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'remove_template_layout_grammar',
    });
    try {
      const nativeResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-missing-layout-grammar',
        route: 'author_pptx_native',
      });
      assert.equal(nativeResult.ok, false);
      assert.match(
        String(nativeResult.error?.message || nativeResult.error || ''),
        /template_layout_grammar|selected_archetype|layout zone/i,
      );
    } finally {
      restoreRoute();
    }
  });
});
