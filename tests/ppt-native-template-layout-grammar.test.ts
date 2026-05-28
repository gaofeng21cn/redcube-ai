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

    assert.equal(editableShapePlan.deck_layout_rhythm_plan?.owner, 'llm_agent');
    assert.equal(editableShapePlan.deck_layout_rhythm_plan?.required, true);
    assert.equal(editableShapePlan.deck_layout_rhythm_plan?.slides.length, editableShapePlan.slides.length);
    assert.equal(
      editableShapePlan.deck_layout_rhythm_plan.slides.every((slide) => (
        typeof slide.rhetorical_role === 'string'
        && typeof slide.selected_archetype === 'string'
        && typeof slide.primary_grid === 'string'
        && typeof slide.composition_signature_budget === 'string'
        && typeof slide.proof_object === 'string'
      )),
      true,
    );
    assert.equal(editableShapePlan.template_layout_grammar?.owner, 'llm_agent');
    assert.equal(editableShapePlan.template_layout_grammar?.required, true);
    assert.equal(editableShapePlan.template_layout_grammar?.materializer_role, 'execute_selected_archetype_zones_only');
    assert.equal(editableShapePlan.template_layout_grammar?.helper_template_layout_allowed, false);
    assert.equal(editableShapePlan.template_layout_grammar?.archetype_catalog.length >= 5, true);
    assert.equal(
      editableShapePlan.template_layout_grammar.archetype_catalog
        .every((archetype) => (
          typeof archetype.use_when === 'string'
          && typeof archetype.layout_description === 'string'
          && Array.isArray(archetype.required_zones)
          && archetype.required_zones.length >= 3
          && Array.isArray(archetype.prohibited)
          && archetype.prohibited.length >= 1
          && Array.isArray(archetype.content_schema?.required_shape_roles)
          && archetype.content_schema.required_shape_roles.length >= 1
          && Array.isArray(archetype.content_schema?.required_shape_role_groups)
          && archetype.content_schema.required_shape_role_groups.length >= 1
        )),
      true,
    );
    assert.equal(
      editableShapePlan.template_layout_grammar.archetype_catalog
        .some((archetype) => archetype.archetype_id === 'professional_system_map'),
      true,
    );
    editableShapePlan.slides.forEach(assertTemplateLayoutBinding);
  });
});

test('native PPT AI shape plan rejects missing deck-level layout rhythm before materialization', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-missing-rhythm-');
    await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-missing-layout-rhythm' });
    const restoreRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'remove_deck_layout_rhythm_plan',
    });
    try {
      const nativeResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-missing-layout-rhythm',
        route: 'author_pptx_native',
      });
      assert.equal(nativeResult.ok, false);
      assert.match(
        String(nativeResult.error?.message || nativeResult.error || ''),
        /deck_layout_rhythm_plan/i,
      );
    } finally {
      restoreRoute();
    }
  });
});

test('native PPT AI shape plan rejects repeated deck layout rhythm before officecli materialization', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-repeated-rhythm-');
    await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-repeated-layout-rhythm' });
    const restoreRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'repeat_native_deck_layout_rhythm',
    });
    try {
      const nativeResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-repeated-layout-rhythm',
        route: 'author_pptx_native',
      });
      assert.equal(nativeResult.ok, false);
      assert.match(
        String(nativeResult.error?.message || nativeResult.error || ''),
        /deck-level layout rhythm|consecutive_selected_archetype|distinct_composition/i,
      );
    } finally {
      restoreRoute();
    }
  });
});

test('native PPT AI shape plan retries missing template layout grammar before materialization', async () => {
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
      assert.equal(nativeResult.ok, true);
      const authored = readJson(nativeResult.artifactFile);
      assert.equal(authored.native_ppt_bundle.ai_first_shape_plan_preflight.attempts, 2);
      assert.equal(authored.native_ppt_bundle.ai_first_shape_plan_preflight.self_repair_used, true);
      assert.equal(
        authored.native_ppt_bundle.ai_first_shape_plan_preflight.attempt_artifact_refs
          .some((file) => file.includes('plan-validation-input-attempt-01-structural-validation.json')),
        true,
      );
      const editableShapePlan = readJson(authored.native_ppt_bundle.editable_shape_plan_file);
      editableShapePlan.slides.forEach(assertTemplateLayoutBinding);
    } finally {
      restoreRoute();
    }
  });
});

test('native PPT AI shape plan records structural-failure candidates for live blocker audit', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-structural-candidate-');
    const deliverableId = 'deck-structural-candidate';
    await runNativePlanningChain({ workspaceRoot, deliverableId });
    const restoreRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'always_remove_template_layout_binding',
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
      assert.equal(nativeResult.ok, false);
      assert.match(
        String(nativeResult.error?.message || nativeResult.error || ''),
        /template_layout_binding/i,
      );
      const candidateRefs = nativeResult.run.artifact_refs
        .filter((file) => file.includes('plan-validation-input-attempt-') && file.endsWith('-candidate.json'));
      assert.equal(candidateRefs.length >= 1, true);
      const firstCandidate = readJson(candidateRefs[0]);
      assert.equal(Boolean(firstCandidate.editable_shape_plan), true);
      assert.equal(firstCandidate.editable_shape_plan.slides.some((slide) => !slide.template_layout_binding), true);
      const structuralRefs = nativeResult.run.artifact_refs
        .filter((file) => file.endsWith('-structural-validation.json'));
      assert.equal(structuralRefs.length >= 1, true);
      const firstFeedback = readJson(structuralRefs[0]);
      assert.equal(
        firstFeedback.required_structural_fixes
          .some((fix) => fix.missing_fields.includes('template_layout_binding')),
        true,
      );
    } finally {
      restoreRoute();
    }
  });
});

test('native PPT AI shape plan reports invalid template zones separately from missing binding', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-invalid-zone-');
    const deliverableId = 'deck-invalid-zone';
    await runNativePlanningChain({ workspaceRoot, deliverableId });
    const restoreRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'always_invalid_template_zone_safe_inset',
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
      assert.equal(nativeResult.ok, false);
      const structuralRefs = nativeResult.run.artifact_refs
        .filter((file) => file.endsWith('-structural-validation.json'));
      assert.equal(structuralRefs.length >= 1, true);
      const firstFeedback = readJson(structuralRefs[0]);
      const invalidZoneFix = firstFeedback.required_structural_fixes
        .find((fix) => fix.reason === 'native_shape_plan_template_layout_binding_invalid');
      assert.equal(Boolean(invalidZoneFix), true);
      assert.equal(
        invalidZoneFix.missing_fields.includes('template_layout_binding'),
        false,
      );
      assert.equal(
        invalidZoneFix.invalid_template_zones
          .some((zone) => (
            zone.zone_id === 'title_zone'
            && zone.invalid_fields.includes('safe_inset_in')
            && zone.required_fields.includes('safe_inset_in>=0.15')
          )),
        true,
      );
    } finally {
      restoreRoute();
    }
  });
});
