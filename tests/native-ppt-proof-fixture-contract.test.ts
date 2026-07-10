// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { runNativePlanValidation } from './helpers/ppt-native-python-layout-fixtures.ts';

function buildNativeProofFixture() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-native-proof-fixture-'));
  const outputFile = path.join(workspaceRoot, 'native-helper-input.json');
  execFileSync(
    process.execPath,
    [
      '--experimental-strip-types',
      'tools/native-ppt-proof/build-fixture-input.ts',
      'tests/fixtures/ppt-native-visual-benchmark/benchmark.json',
      outputFile,
      'data_charts',
    ],
    {
      cwd: path.resolve('.'),
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  return {
    workspaceRoot,
    outputFile,
    payload: JSON.parse(readFileSync(outputFile, 'utf-8')),
  };
}

test('native PPT proof fixture emits the complete AI-first native shape plan contract', () => {
  const { payload } = buildNativeProofFixture();
  const plan = payload.editable_shape_plan;

  assert.equal(payload.fixture_id, 'ppt_native_ppt_master_parity_benchmark_v3');
  assert.equal(payload.suite_id, 'data_charts');
  assert.equal(plan.contract_kind, 'redcube_ai_first_native_ppt_shape_plan');
  assert.equal(plan.design_spec_lock.owner, 'llm_agent');
  assert.equal(plan.design_spec_lock.layout_archetypes.length >= 6, true);
  assert.equal(plan.template_layout_grammar.owner, 'llm_agent');
  assert.equal(plan.template_layout_grammar.required, true);
  assert.equal(plan.template_layout_grammar.materializer_role, 'execute_selected_archetype_zones_only');
  assert.equal(plan.template_layout_grammar.helper_template_layout_allowed, false);
  assert.deepEqual(
    plan.template_layout_grammar.reference_discipline.source_projects,
    ['ppt-master', 'PPTAgent', 'officecli-pptx', 'presenton', 'ppt-agent-skills'],
  );
  assert.equal(plan.template_layout_grammar.archetype_catalog.length, 6);
  assert.equal(plan.deck_layout_rhythm_plan.owner, 'llm_agent');
  assert.equal(plan.deck_layout_rhythm_plan.slides.length, plan.slides.length);
  const semanticFamilies = new Set(plan.slides.map((slide) => slide.semantic_composition));
  const objectKinds = new Set(plan.slides.flatMap((slide) => slide.native_shapes.map((shape) => shape.kind)));
  assert.deepEqual([...semanticFamilies], [
    'relationship_graph',
    'timeline',
    'decision_ladder',
    'data_chart',
    'data_table',
    'image_evidence',
  ]);
  for (const kind of ['chart', 'table', 'picture', 'connector']) {
    assert.equal(objectKinds.has(kind), true, kind);
  }
  assert.equal(plan.slides.every((slide) => slide.speaker_notes), true);
  assert.equal(plan.slides.filter((slide) => slide.transition?.type).length >= 2, true);

  for (const slide of plan.slides) {
    const binding = slide.template_layout_binding;
    const zoneIds = new Set(binding.zones.map((zone) => zone.zone_id));
    assert.equal(binding.selected_archetype, slide.layout_family);
    assert.equal(binding.zone_gap_in_min >= 0.32, true);
    assert.equal(binding.zone_inset_in_min >= 0.15, true);
    for (const requiredZone of ['title_zone', 'claim_zone', 'body_zone']) {
      assert.equal(zoneIds.has(requiredZone), true, `${slide.slide_id}:${requiredZone}`);
    }
    for (const shape of slide.native_shapes) {
      if (['decorative', 'auxiliary'].includes(shape.quality_role)) {
        continue;
      }
      assert.equal(zoneIds.has(shape.layout_zone_id), true, `${slide.slide_id}:${shape.shape_id}`);
    }
  }
  const validation = runNativePlanValidation(payload, 'redcube-native-proof-fixture-contract-');
  assert.equal(validation.ok, true, JSON.stringify(validation, null, 2));
});

test('native PPT proof artifact index retains package readback and quality verdict evidence', () => {
  const index = JSON.parse(readFileSync(
    path.resolve('tools/native-ppt-proof/artifact-index-fixture.json'),
    'utf-8',
  ));
  const requiredIds = new Set(index.retention_contract.required_artifact_ids);
  const artifactIds = new Set(index.artifacts.map((artifact) => artifact.artifact_id));

  for (const artifactId of ['native_package_readback_json', 'native_quality_verdict_json']) {
    assert.equal(requiredIds.has(artifactId), true, artifactId);
    assert.equal(artifactIds.has(artifactId), true, artifactId);
  }
});
