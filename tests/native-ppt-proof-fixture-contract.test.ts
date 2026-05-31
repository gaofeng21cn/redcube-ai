// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { resolveRedCubePythonCommand } from '../scripts/run-test-group-lib.ts';

function buildNativeProofFixture() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-native-proof-fixture-'));
  const outputFile = path.join(workspaceRoot, 'native-helper-input.json');
  execFileSync(
    process.execPath,
    [
      'tools/native-ppt-proof/build-fixture-input.mjs',
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

function pythonCacheEnv(workspaceRoot) {
  return {
    ...process.env,
    PYTHONPATH: path.resolve('python'),
    PYTHONDONTWRITEBYTECODE: '1',
    PYTHONPYCACHEPREFIX: path.join(workspaceRoot, 'pycache'),
    PYTEST_ADDOPTS: `${process.env.PYTEST_ADDOPTS || ''} -p no:cacheprovider -o cache_dir=${path.join(workspaceRoot, 'pytest-cache')}`.trim(),
  };
}

function validatePlan(inputFile, workspaceRoot) {
  const python = resolveRedCubePythonCommand();
  const stdout = execFileSync(
    python.command,
    [
      ...(python.args || []),
      '-m',
      'redcube_ai.native_helpers.ppt_deck.native',
      '--input-json',
      inputFile,
      '--mode',
      'validate_plan',
      '--output-pptx',
      path.join(workspaceRoot, 'out.pptx'),
      '--shape-manifest',
      path.join(workspaceRoot, 'shape-manifest.json'),
      '--preview-dir',
      path.join(workspaceRoot, 'previews'),
      '--engine-contract',
      'contracts/runtime-program/ppt-native-python-engine-contract.json',
    ],
    {
      cwd: path.resolve('.'),
      env: pythonCacheEnv(workspaceRoot),
      encoding: 'utf-8',
    },
  );
  return JSON.parse(stdout);
}

test('native PPT proof fixture emits the complete AI-first native shape plan contract', () => {
  const { outputFile, payload, workspaceRoot } = buildNativeProofFixture();
  const plan = payload.editable_shape_plan;

  assert.equal(payload.fixture_id, 'ppt_native_visual_benchmark_v2');
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

  for (const slide of plan.slides) {
    const binding = slide.template_layout_binding;
    const zoneIds = new Set(binding.zones.map((zone) => zone.zone_id));
    assert.equal(binding.selected_archetype, slide.layout_family);
    assert.equal(binding.zone_gap_in_min >= 0.32, true);
    assert.equal(binding.zone_inset_in_min >= 0.15, true);
    assert.deepEqual([...zoneIds], ['title_zone', 'claim_zone', 'body_zone']);
    for (const shape of slide.native_shapes) {
      if (['decorative', 'auxiliary'].includes(shape.quality_role)) {
        continue;
      }
      assert.equal(zoneIds.has(shape.layout_zone_id), true, `${slide.slide_id}:${shape.shape_id}`);
    }
  }

  const validation = validatePlan(outputFile, workspaceRoot);
  assert.deepEqual(validation, {
    ok: true,
    stage: 'ai_first_shape_plan_preflight',
    slide_count: 6,
    failure_count: 0,
    failures: [],
  });
});
