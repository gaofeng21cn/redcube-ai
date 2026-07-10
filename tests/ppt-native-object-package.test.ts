// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { buildNativeShapePlanOutputContract } from '../packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/native-ppt-shape-plan-contract.ts';
import { createNativePptShapePlanNormalizeParts } from '../packages/redcube-runtime/dist/families/ppt/ppt-deck-runtime-family-parts/native-ppt-shape-plan-normalize.js';
import {
  createAiSlide,
  materializerPayload,
  pythonTestEnv,
  resolveTestPythonCommand,
  runNativeMaterializer,
} from './helpers/ppt-native-python-layout-fixtures.ts';
import {
  bounds,
  createNativeObjectWorkspace,
  packageBindingResult,
  pythonAnimationFailures,
  relocateRelationshipBackedParts,
  runPackageReadback,
  runNativeObjectMaterializer,
  runNativeObjectMaterializerFailure,
  shape,
  validatePptx,
} from './helpers/ppt-native-object-package-fixtures.ts';

function officecliJsonParseResult(args, payload) {
  const python = resolveTestPythonCommand();
  return spawnSync(python.command, [...(python.args || []), '-c', `
import json
import subprocess
import sys
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.materializer import parse_json_output

fixture = json.loads(sys.argv[1])
completed = subprocess.CompletedProcess(fixture['args'], 0, stdout=json.dumps(fixture['payload']), stderr='')
parse_json_output(completed)
`, JSON.stringify({ args, payload })], {
    cwd: process.cwd(),
    env: pythonTestEnv(),
    encoding: 'utf-8',
  });
}

test('native PPT shape-plan contract exposes typed object, template, and presentation semantics', () => {
  const contract = buildNativeShapePlanOutputContract({
    aiFirstEditingContract: {},
    route: 'author_pptx_native',
  }).editable_shape_plan;
  const objectContract = contract.materializable_shape_kind_contract;
  for (const kind of ['text_box', 'shape', 'connector', 'picture', 'group', 'path', 'chart', 'table']) {
    assert.equal(objectContract.allowed_kind_values.includes(kind), true, kind);
  }
  assert.equal(objectContract.unknown_kind_policy, 'fail_fast_before_materialization');
  assert.equal(objectContract.object_specific_fields.picture[0], 'source_file | source_data_uri');
  assert.deepEqual(contract.template_intake_contract.supported_modes, ['replace_slides', 'fill_existing']);
  assert.equal(contract.template_intake_contract.source_canvas_must_be_preserved, true);
  assert.equal(contract.template_intake_contract.fill_existing_requires_complete_target_coverage, true);
  assert.equal(contract.presentation_semantics_contract.package_readback_required, true);
  assert.equal(
    contract.presentation_semantics_contract.animation_target_policy.stable_drawingml_group_target,
    'reject_before_materialization',
  );
  assert.deepEqual(
    contract.presentation_semantics_contract.animation_target_policy.supported_top_level_kinds,
    ['text_box', 'shape', 'rect', 'rounded_rect', 'oval', 'path'],
  );
  assert.equal(contract.presentation_semantics_contract.animation_target_policy.native_data_object_chart, 'supported');
  assert.deepEqual(
    contract.presentation_semantics_contract.animation_target_policy.rejected_targets,
    ['missing', 'group_child', 'group', 'table', 'metric_grid', 'picture', 'line', 'connector'],
  );
  assert.equal(contract.presentation_semantics_contract.animation_target_policy.zero_write_preflight_required, true);
});

test('native PPT plan preflight rejects stable DrawingML animation targets with repair feedback', () => {
  const parts = createNativePptShapePlanNormalizeParts({
    safeArray: (value) => Array.isArray(value) ? value : [],
    safeText: (value, fallback = '') => String(value ?? fallback).trim(),
  });
  let planError;
  assert.throws(() => parts.normalizeEditableShapePlan({
    editable_shape_plan: {
      slides: [{
        slide_id: 'S01',
        native_shapes: [{
          shape_id: 'S01-stable-chart',
          kind: 'chart',
          materialization_intent: 'stable_drawingml',
        }],
        animation_timeline: [{ target_shape_id: 'S01-stable-chart', effect: 'fade' }],
      }],
    },
  }, 'author_pptx_native'), (error) => {
    planError = error;
    return /animation target preflight failed/.test(String(error?.message));
  });
  const feedback = parts.structuralFeedbackFromPlanError({
    route: 'author_pptx_native',
    error: planError,
    attemptIndex: 1,
    attemptArtifactRefs: [],
  });
  assert.equal(feedback.validator.reason, 'native_shape_plan_animation_target_unsupported');
  assert.equal(feedback.validator.failures[0].reason, 'animation_target_stable_drawingml_group_unsupported');
  assert.equal(feedback.required_structural_fixes[0].shape_id, 'S01-stable-chart');
  assert.match(feedback.repair_request, /target a top-level native shape or native_data_object chart/);
});

for (const fixture of [
  { label: 'missing target', targetShape: null, targetId: 'S01-missing', expectedReason: 'animation_target_missing' },
  {
    label: 'group child target',
    targetShape: {
      shape_id: 'S01-group',
      kind: 'group',
      children: [{ shape_id: 'S01-target', kind: 'rect' }],
    },
    targetId: 'S01-target',
    expectedReason: 'animation_target_group_child',
  },
  { label: 'group target', targetShape: { shape_id: 'S01-target', kind: 'group', children: [] }, targetId: 'S01-target', expectedReason: 'animation_target_kind_unsupported' },
  { label: 'native table target', targetShape: { shape_id: 'S01-target', kind: 'table', materialization_intent: 'native_data_object' }, targetId: 'S01-target', expectedReason: 'animation_target_kind_unsupported' },
  { label: 'native metric grid target', targetShape: { shape_id: 'S01-target', kind: 'metric_grid', materialization_intent: 'native_data_object' }, targetId: 'S01-target', expectedReason: 'animation_target_kind_unsupported' },
  { label: 'picture target', targetShape: { shape_id: 'S01-target', kind: 'picture' }, targetId: 'S01-target', expectedReason: 'animation_target_kind_unsupported' },
  { label: 'line target', targetShape: { shape_id: 'S01-target', kind: 'line' }, targetId: 'S01-target', expectedReason: 'animation_target_kind_unsupported' },
  { label: 'connector target', targetShape: { shape_id: 'S01-target', kind: 'connector' }, targetId: 'S01-target', expectedReason: 'animation_target_kind_unsupported' },
]) {
  test(`native PPT plan preflight rejects ${fixture.label} with typed repair feedback`, () => {
    const parts = createNativePptShapePlanNormalizeParts({
      safeArray: (value) => Array.isArray(value) ? value : [],
      safeText: (value, fallback = '') => String(value ?? fallback).trim(),
    });
    let planError;
    assert.throws(() => parts.normalizeEditableShapePlan({
      editable_shape_plan: {
        slides: [{
          slide_id: 'S01',
          native_shapes: fixture.targetShape ? [fixture.targetShape] : [],
          animation_timeline: [{ target_shape_id: fixture.targetId, effect: 'fade' }],
        }],
      },
    }, 'author_pptx_native'), (error) => {
      planError = error;
      return /animation target preflight failed/.test(String(error?.message));
    });
    const feedback = parts.structuralFeedbackFromPlanError({
      route: 'author_pptx_native',
      error: planError,
      attemptIndex: 1,
      attemptArtifactRefs: [],
    });
    assert.equal(feedback.validator.reason, 'native_shape_plan_animation_target_unsupported');
    assert.equal(feedback.validator.failures[0].reason, fixture.expectedReason);
    assert.equal(feedback.required_structural_fixes[0].shape_id, fixture.targetId);
  });
}

test('native PPT TS and Python animation preflight accept canonical top-level shapes, aliases, and native charts', () => {
  const supportedTargets = [
    'text_box', 'text', 'shape', 'preset_shape', 'rect', 'rectangle',
    'rounded_rect', 'panel', 'oval', 'circle', 'path',
  ].map((kind, index) => ({ shape_id: `S${index + 1}-target`, kind }));
  supportedTargets.push({
    shape_id: 'S-chart-target',
    kind: 'chart',
    materialization_intent: 'native_data_object',
  });
  const parts = createNativePptShapePlanNormalizeParts({
    safeArray: (value) => Array.isArray(value) ? value : [],
    safeText: (value, fallback = '') => String(value ?? fallback).trim(),
  });
  for (const target of supportedTargets) {
    assert.throws(() => parts.normalizeEditableShapePlan({
      editable_shape_plan: {
        slides: [{
          slide_id: 'S01',
          native_shapes: [target],
          animation_timeline: [{ target_shape_id: target.shape_id, effect: 'fade' }],
        }],
      },
    }, 'author_pptx_native'), /requires editable_shape_plan\.design_spec_lock/);
  }
  assert.deepEqual(pythonAnimationFailures(supportedTargets), []);
});

test('native PPT materializer rejects malformed OfficeCLI JSON instead of treating it as zero issues', () => {
  const python = resolveTestPythonCommand();
  const result = spawnSync(python.command, [...(python.args || []), '-c', `
import subprocess
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.materializer import parse_json_output

completed = subprocess.CompletedProcess(['officecli'], 0, stdout='{not-json', stderr='')
parse_json_output(completed)
`], {
    cwd: process.cwd(),
    env: pythonTestEnv(),
    encoding: 'utf-8',
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /invalid JSON/);
});

test('native PPT materializer rejects empty OfficeCLI JSON output', () => {
  const python = resolveTestPythonCommand();
  const result = spawnSync(python.command, [...(python.args || []), '-c', `
import subprocess
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.materializer import parse_json_output

completed = subprocess.CompletedProcess(['officecli'], 0, stdout='', stderr='')
parse_json_output(completed)
`], {
    cwd: process.cwd(),
    env: pythonTestEnv(),
    encoding: 'utf-8',
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /empty JSON/);
});

for (const fixture of [
  { label: 'empty object', payload: {} },
  { label: 'data-only object', payload: { data: {} } },
  { label: 'unsuccessful envelope', payload: { success: false, data: { count: 0 } } },
  { label: 'invalid issue count', payload: { success: true, data: { count: 'not-a-count' } } },
  { label: 'negative issue count', payload: { success: true, data: { count: -1 } } },
]) {
  test(`native PPT materializer rejects OfficeCLI ${fixture.label}`, () => {
    const result = officecliJsonParseResult(
      ['officecli', 'view', 'deck.pptx', 'issues', '--json'],
      fixture.payload,
    );
    assert.notEqual(result.status, 0, `${fixture.label} was accepted`);
  });
}

test('native PPT materializer accepts command-valid OfficeCLI JSON envelopes', () => {
  const fixtures = [
    {
      args: ['officecli', 'validate', 'deck.pptx', '--json'],
      payload: { success: true, data: 'Validation passed: no errors found.' },
    },
    {
      args: ['officecli', 'view', 'deck.pptx', 'issues', '--json'],
      payload: { success: true, data: { count: 0, issues: [] } },
    },
    {
      args: ['officecli', 'view', 'deck.pptx', 'text', '--json'],
      payload: { success: true, data: { totalSlides: 1, slides: [] } },
    },
  ];
  for (const fixture of fixtures) {
    const result = officecliJsonParseResult(fixture.args, fixture.payload);
    assert.equal(result.status, 0, `${JSON.stringify(fixture)}\n${result.stdout}\n${result.stderr}`);
  }
});

test('native PPT package binding rejects chart category drift', () => {
  const result = packageBindingResult({
    shape_id: 'S01-chart',
    kind: 'chart',
    semantic_kind: 'chart',
    materialization_intent: 'native_data_object',
    chart_type: 'column',
    categories: ['A', 'B'],
    series: [{ name: 'Actual', values: [1, 2] }],
  }, {
    name: 'S01-chart',
    kind: 'chart',
    chart_type: 'column',
    categories: ['A', 'C'],
    series: [{ name: 'Actual', values: [1, 2] }],
    relationship_type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart',
    relationship_resolved: true,
    content_type: 'application/vnd.openxmlformats-officedocument.drawingml.chart+xml',
  });
  assert.notEqual(result.status, 0, 'chart category drift was accepted');
  assert.match(`${result.stdout}\n${result.stderr}`, /chart categories/);
});

test('native PPT package binding rejects chart series drift', () => {
  const result = packageBindingResult({
    shape_id: 'S01-chart',
    kind: 'chart',
    semantic_kind: 'chart',
    materialization_intent: 'native_data_object',
    chart_type: 'column',
    categories: ['A', 'B'],
    series: [{ name: 'Actual', values: [1, 2] }],
  }, {
    name: 'S01-chart',
    kind: 'chart',
    chart_type: 'column',
    categories: ['A', 'B'],
    series: [{ name: 'Actual', values: [1, 3] }],
    relationship_type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart',
    relationship_resolved: true,
    content_type: 'application/vnd.openxmlformats-officedocument.drawingml.chart+xml',
  });
  assert.notEqual(result.status, 0, 'chart series drift was accepted');
  assert.match(`${result.stdout}\n${result.stderr}`, /chart series/);
});

test('native PPT package binding rejects chart type drift', () => {
  const result = packageBindingResult({
    shape_id: 'S01-chart',
    kind: 'chart',
    semantic_kind: 'chart',
    materialization_intent: 'native_data_object',
    chart_type: 'column',
    categories: ['A', 'B'],
    series: [{ name: 'Actual', values: [1, 2] }],
  }, {
    name: 'S01-chart',
    kind: 'chart',
    chart_type: 'line',
    categories: ['A', 'B'],
    series: [{ name: 'Actual', values: [1, 2] }],
    relationship_type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart',
    relationship_resolved: true,
    content_type: 'application/vnd.openxmlformats-officedocument.drawingml.chart+xml',
  });
  assert.notEqual(result.status, 0, 'chart type drift was accepted');
  assert.match(`${result.stdout}\n${result.stderr}`, /chart type/);
});

test('native PPT package binding rejects missing chart type evidence', () => {
  const result = packageBindingResult({
    shape_id: 'S01-chart',
    kind: 'chart',
    semantic_kind: 'chart',
    materialization_intent: 'native_data_object',
    categories: ['A'],
    series: [{ name: 'Actual', values: [1] }],
  }, {
    name: 'S01-chart',
    kind: 'chart',
    chart_type: 'column',
    categories: ['A'],
    series: [{ name: 'Actual', values: [1] }],
    relationship_type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart',
    relationship_resolved: true,
    content_type: 'application/vnd.openxmlformats-officedocument.drawingml.chart+xml',
  });
  assert.notEqual(result.status, 0, 'missing chart type evidence was accepted');
  assert.match(`${result.stdout}\n${result.stderr}`, /chart type evidence missing/);
});

test('native PPT package binding rejects table data drift', () => {
  const result = packageBindingResult({
    shape_id: 'S01-table',
    kind: 'table',
    semantic_kind: 'table',
    data: [['Metric', 'Value'], ['Quality', 'Pass']],
    first_row: true,
  }, {
    name: 'S01-table',
    kind: 'table',
    data: [['Metric', 'Value'], ['Quality', 'Fail']],
    cells: [],
  });
  assert.notEqual(result.status, 0, 'table data drift was accepted');
  assert.match(`${result.stdout}\n${result.stderr}`, /table data/);
});

test('native PPT package binding rejects table style drift', () => {
  const result = packageBindingResult({
    shape_id: 'S01-table',
    kind: 'table',
    semantic_kind: 'table',
    data: [['Metric', 'Value'], ['Quality', 'Pass']],
    first_row: true,
    header_fill: '#17324D',
    header_color: '#FFFFFF',
    header_font: 'Aptos Display',
    header_font_size: 15,
    body_font_size: 13,
  }, {
    name: 'S01-table',
    kind: 'table',
    data: [['Metric', 'Value'], ['Quality', 'Pass']],
    cells: [
      { row: 1, column: 1, text: 'Metric', font: 'Aptos Display', font_size_pt: 15, bold: true, color: '#FFFFFF', fill: '#FF0000' },
      { row: 1, column: 2, text: 'Value', font: 'Aptos Display', font_size_pt: 15, bold: true, color: '#FFFFFF', fill: '#FF0000' },
      { row: 2, column: 1, text: 'Quality', font: 'Aptos', font_size_pt: 13, bold: false, color: '', fill: '' },
      { row: 2, column: 2, text: 'Pass', font: 'Aptos', font_size_pt: 13, bold: false, color: '', fill: '' },
    ],
  });
  assert.notEqual(result.status, 0, 'table style drift was accepted');
  assert.match(`${result.stdout}\n${result.stderr}`, /table header fill/);
});

test('native PPT package binding rejects picture alt drift', () => {
  const result = packageBindingResult({
    shape_id: 'S01-picture',
    kind: 'picture',
    semantic_kind: 'picture',
    alt: 'Expected description',
    crop: { left: 0, top: 0, right: 0, bottom: 0 },
    source_payload_sha256: 'a'.repeat(64),
  }, {
    name: 'S01-picture',
    kind: 'picture',
    alt: 'Wrong description',
    crop: { left: 0, top: 0, right: 0, bottom: 0 },
    embedded_sha256: 'a'.repeat(64),
    relationship_type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
    relationship_resolved: true,
    content_type: 'image/png',
  });
  assert.notEqual(result.status, 0, 'picture alt drift was accepted');
  assert.match(`${result.stdout}\n${result.stderr}`, /picture alt/);
});

test('native PPT package binding rejects picture crop drift', () => {
  const result = packageBindingResult({
    shape_id: 'S01-picture',
    kind: 'picture',
    semantic_kind: 'picture',
    alt: 'Expected description',
    crop: { left: 0, top: 0, right: 0, bottom: 0 },
    source_payload_sha256: 'a'.repeat(64),
  }, {
    name: 'S01-picture',
    kind: 'picture',
    alt: 'Expected description',
    crop: { left: 5, top: 0, right: 0, bottom: 0 },
    embedded_sha256: 'a'.repeat(64),
    relationship_type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
    relationship_resolved: true,
    content_type: 'image/png',
  });
  assert.notEqual(result.status, 0, 'picture crop drift was accepted');
  assert.match(`${result.stdout}\n${result.stderr}`, /picture crop/);
});

test('native PPT package binding rejects picture source payload substitution', () => {
  const result = packageBindingResult({
    shape_id: 'S01-picture',
    kind: 'picture',
    semantic_kind: 'picture',
    alt: 'Expected description',
    crop: { left: 0, top: 0, right: 0, bottom: 0 },
    source_payload_sha256: 'a'.repeat(64),
  }, {
    name: 'S01-picture',
    kind: 'picture',
    alt: 'Expected description',
    crop: { left: 0, top: 0, right: 0, bottom: 0 },
    embedded_sha256: 'b'.repeat(64),
    relationship_type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
    relationship_resolved: true,
    content_type: 'image/png',
  });
  assert.notEqual(result.status, 0, 'picture source payload substitution was accepted');
  assert.match(`${result.stdout}\n${result.stderr}`, /picture source payload SHA/);
});

test('native PPT package binding rejects missing picture source payload SHA evidence', () => {
  const result = packageBindingResult({
    shape_id: 'S01-picture',
    kind: 'picture',
    semantic_kind: 'picture',
    alt: 'Expected description',
    crop: { left: 0, top: 0, right: 0, bottom: 0 },
  }, {
    name: 'S01-picture',
    kind: 'picture',
    alt: 'Expected description',
    crop: { left: 0, top: 0, right: 0, bottom: 0 },
    embedded_sha256: 'a'.repeat(64),
    relationship_type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
    relationship_resolved: true,
    content_type: 'image/png',
  });
  assert.notEqual(result.status, 0, 'missing picture source payload SHA evidence was accepted');
  assert.match(`${result.stdout}\n${result.stderr}`, /picture source payload SHA evidence missing/);
});

test('native PPT picture source payload hashing canonicalizes files and data URIs', () => {
  const { pictureFile, pictureDataUri } = createNativeObjectWorkspace('redcube-native-picture-digest-');
  const python = resolveTestPythonCommand();
  const stdout = execFileSync(python.command, [...(python.args || []), '-c', `
import json
import sys
from redcube_ai.native_helpers.ppt_deck.native_package import source_payload_sha256

print(json.dumps([source_payload_sha256(value) for value in sys.argv[1:]]))
`, pictureFile, pictureDataUri, 'data:text/plain,RedCube%20AI%21'], {
    cwd: process.cwd(),
    env: pythonTestEnv(),
    encoding: 'utf-8',
  });
  const [fileDigest, base64Digest, percentDigest] = JSON.parse(stdout);
  assert.equal(fileDigest, base64Digest);
  assert.equal(fileDigest, createHash('sha256').update(readFileSync(pictureFile)).digest('hex'));
  assert.equal(percentDigest, createHash('sha256').update('RedCube AI!').digest('hex'));
});

test('native PPT package binding rejects ordered group child substitution with the same count', () => {
  const result = packageBindingResult({
    shape_id: 'S01-group',
    kind: 'group',
    semantic_kind: 'group',
    child_object_count: 2,
    children: [
      { shape_id: 'S01-group-a', kind: 'rect', semantic_kind: 'rect', text: '' },
      { shape_id: 'S01-group-b', kind: 'oval', semantic_kind: 'oval', text: '' },
    ],
  }, {
    name: 'S01-group',
    kind: 'group',
    child_object_count: 2,
    children: [
      { name: 'S01-group-a', kind: 'rect', text: '' },
      { name: 'S01-group-substitute', kind: 'oval', text: '' },
    ],
  });
  assert.notEqual(result.status, 0, 'same-count group child substitution was accepted');
  assert.match(`${result.stdout}\n${result.stderr}`, /group child identity/);
});

test('native PPT package binding accepts nested group descendant text without comparing aggregate group text', () => {
  const result = packageBindingResult({
    shape_id: 'S01-outer',
    kind: 'group',
    semantic_kind: 'group',
    children: [{
      shape_id: 'S01-inner',
      kind: 'group',
      semantic_kind: 'group',
      text: '',
      children: [{ shape_id: 'S01-label', kind: 'text_box', semantic_kind: 'text_box', text: 'Hello' }],
    }],
  }, {
    name: 'S01-outer',
    kind: 'group',
    text: 'Hello',
    children: [{
      name: 'S01-inner',
      kind: 'group',
      text: 'Hello',
      children: [{ name: 'S01-label', kind: 'text_box', text: 'Hello' }],
    }],
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

test('native PPT object fixtures use marked user-scoped test workspaces', () => {
  const { workspaceRoot } = createNativeObjectWorkspace('redcube-native-object-marker-');
  const markerFile = path.join(workspaceRoot, '.redcube-test-workspace.json');
  assert.equal(existsSync(markerFile), true);
  const marker = JSON.parse(readFileSync(markerFile, 'utf-8'));
  assert.equal(marker.owner, 'redcube-ai');
  assert.equal(marker.purpose, 'test-workspace');
  assert.equal(path.resolve(workspaceRoot).startsWith('/private/'), false);
});

test('typed native pictures are structural visuals without role-name disguise', () => {
  const python = resolveTestPythonCommand();
  const stdout = execFileSync(python.command, [...(python.args || []), '-c', `
import json
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.rules import structural_visual_shape

print(json.dumps({
    kind: structural_visual_shape({'kind': kind, 'role': 'evidence_picture', 'quality_role': 'structural'})
    for kind in ['picture', 'image']
}))
`], {
    cwd: process.cwd(),
    env: pythonTestEnv(),
    encoding: 'utf-8',
  });
  assert.deepEqual(JSON.parse(stdout), { picture: true, image: true });
});

test('real build_deck preserves native table metrics and body font size in the manifest', () => {
  const slide = createAiSlide({ slideId: 'S01', layoutFamily: 'multi_zone_compare', slotCount: 2 });
  slide.native_shapes = slide.native_shapes.filter((item) => item.shape_id !== 'S01-slot-1-panel');
  slide.native_shapes.push(shape('S01-table-proof', 'table', bounds(1.15, 3.2, 6.15, 2.68), {
    role: 'compare_panel',
    quality_role: 'content',
    layout_zone_id: 'matrix_zone',
    materialization_intent: 'native_data_object',
    data: [['Metric', 'Value'], ['Quality', 'Pass']],
    body_font_size: 16,
    metrics: { max_cell_blank_ratio: 0.12 },
  }));

  const result = runNativeMaterializer(materializerPayload([slide]), 'redcube-native-object-build-deck-');
  const table = result.slides[0].native_shapes.find((item) => item.shape_id === 'S01-table-proof');
  assert.equal(table.body_font_size, 16);
  assert.equal(table.metrics.min_font_pt, 16);
  assert.equal(table.metrics.max_cell_blank_ratio, 0.12);
  assert.deepEqual(table.data, [['Metric', 'Value'], ['Quality', 'Pass']]);
});

test('native PPT materializer writes distinct editable objects and semantic package readback', () => {
  const { workspaceRoot } = createNativeObjectWorkspace();
  const pictureFile = path.resolve('assets/branding/redcube-ai-logo.png');
  const result = runNativeObjectMaterializer({
    workspaceRoot,
    payload: {
      slides: [{
        slide_id: 'S01',
        background: '#FFFFFF',
        speaker_notes: 'Explain the object families, then reveal the data chart.',
        transition: {
          type: 'push',
          direction: 'left',
          duration_ms: 650,
          advance_time_ms: 4000,
          advance_click: false,
        },
        animation_timeline: [{
          target_shape_id: 'S01-title',
          effect: 'fade',
          class: 'entrance',
          trigger: 'afterPrevious',
          duration_ms: 450,
          delay_ms: 100,
        }],
        _editable_native_shapes: [
          shape('S01-title', 'text_box', bounds(0.7, 0.25, 6.4, 1.3), {
            role: 'title',
            quality_role: 'content',
            paragraphs: [{
              text: 'Native object package proof',
              runs: [
                { text: 'Native object', bold: true, color: '#17324D' },
                { text: ' package proof', color: '#17324D' },
              ],
            }, {
              text: 'Editable OOXML objects remain distinct.',
              bullet: true,
            }],
            font_size: 26,
            fill: 'none',
            line: 'none',
          }),
          shape('S01-diamond', 'shape', bounds(0.8, 1.75, 1.5, 1.0), {
            preset: 'diamond', fill: '#D7E8F5', line: '#17324D',
          }),
          shape('S01-picture', 'picture', bounds(3.8, 1.65, 1.6, 1.25), {
            source_file: pictureFile, alt: 'RedCube AI logo', crop: '0,0,0,0',
          }),
          shape('S01-chart', 'chart', bounds(0.8, 3.0, 4.8, 2.6), {
            materialization_intent: 'native_data_object',
            chart_type: 'column',
            categories: ['North, East', 'South'],
            series: [{ name: 'Actual', values: [3, 8], color: '#2563EB' }],
            title: 'Quarterly result',
          }),
          shape('S01-table', 'table', bounds(6.0, 3.0, 3.3, 2.4), {
            materialization_intent: 'native_data_object',
            data: [['Metric', 'Value'], ['Quality', 'Pass'], ['Objects', '8']],
            first_row: true,
            header_fill: '#17324D',
            header_color: '#FFFFFF',
            header_font: 'Aptos Display',
            header_font_size: 15,
            body_font_size: 13,
          }),
          shape('S01-group', 'group', bounds(6.0, 1.65, 3.3, 1.1), {
            children: [
              shape('S01-group-a', 'rect', bounds(6.0, 1.65, 1.45, 1.0), { fill: '#E2E8F0', line: 'none' }),
              shape('S01-group-b', 'oval', bounds(7.8, 1.65, 1.0, 1.0), { fill: '#F59E0B', line: 'none' }),
            ],
          }),
          shape('S01-path', 'path', bounds(9.75, 1.65, 2.1, 1.2), {
            fill: '#DCFCE7', line: '#166534',
            path_points: [[0, 1], [0.5, 0], [1, 1], [0.75, 0.72], [0.25, 0.72]],
            closed: true,
          }),
          shape('S01-connector', 'connector', bounds(2.45, 2.2, 7.1, 0.08), {
            line: '#17324D', tail_end: 'triangle',
            from_shape_id: 'S01-diamond',
            to_shape_id: 'S01-path',
          }),
        ],
      }],
    },
  });

  assert.equal(result.package_readback.slide_count, 1);
  for (const kind of ['text_box', 'shape', 'connector', 'picture', 'chart', 'table', 'group', 'path']) {
    assert.ok(result.package_readback.object_type_counts[kind] >= 1, `${kind} missing: ${JSON.stringify(result.package_readback)}`);
  }
  assert.equal(result.package_readback.notes_slide_count, 1);
  assert.equal(result.package_readback.transition_count, 1);
  assert.equal(result.package_readback.animation_count, 1);
  assert.ok(result.package_readback.timing_node_count >= 1);
  assert.equal(result.package_readback.relationship_type_counts.chart, 1);
  assert.equal(result.package_readback.relationship_type_counts.image, 1);
  assert.equal(result.package_readback.relationship_type_counts.notesSlide, 1);
  assert.ok(result.package_readback.part_counts.chart >= 1);
  assert.ok(result.package_readback.part_counts.media >= 1);
  assert.ok(result.package_readback.part_counts.notes >= 1);
  assert.equal(result.package_readback.slides[0].speaker_notes.includes('object families'), true);
  assert.equal(result.package_readback.slides[0].transition.type, 'push');
  assert.equal(result.package_readback.slides[0].transition.direction, 'left');
  assert.equal(result.package_readback.slides[0].transition.duration_ms, 650);
  assert.equal(result.package_readback.slides[0].animation_targets.includes('S01-title'), true);
  const titleObject = result.package_readback.slides[0].objects.find((item) => item.name === 'S01-title');
  assert.deepEqual(result.package_readback.slides[0].animations, [{
    target_object_id: titleObject.object_id,
    target_shape_name: 'S01-title',
    effect: 'fade',
    class: 'entrance',
    trigger: 'afterPrevious',
    duration_ms: 450,
    delay_ms: 100,
    preset_id: 10,
  }]);
  assert.ok(titleObject.paragraph_count >= 2);
  assert.ok(titleObject.run_count >= 2);
  assert.equal(titleObject.bullet_count, 1);
  const byName = Object.fromEntries(result.package_readback.slides[0].objects.map((item) => [item.name, item]));
  assert.equal(byName['S01-chart'].series_count, 1);
  assert.equal(byName['S01-chart'].category_count, 2);
  assert.equal(byName['S01-chart'].chart_type, 'column');
  assert.deepEqual(byName['S01-chart'].categories, ['North, East', 'South']);
  assert.deepEqual(byName['S01-chart'].series, [{ name: 'Actual', values: [3, 8] }]);
  assert.equal(byName['S01-table'].row_count, 3);
  assert.equal(byName['S01-table'].column_count, 2);
  assert.deepEqual(byName['S01-table'].data, [['Metric', 'Value'], ['Quality', 'Pass'], ['Objects', '8']]);
  assert.deepEqual(byName['S01-table'].cells[0], {
    row: 1,
    column: 1,
    text: 'Metric',
    font: 'Aptos Display',
    font_size_pt: 15,
    bold: true,
    color: '#FFFFFF',
    fill: '#17324D',
  });
  assert.equal(byName['S01-table'].cells[2].font_size_pt, 13);
  assert.ok(byName['S01-picture'].embedded_size_bytes > 0);
  assert.equal(
    byName['S01-picture'].embedded_sha256,
    createHash('sha256').update(readFileSync(pictureFile)).digest('hex'),
  );
  assert.equal(byName['S01-picture'].alt, 'RedCube AI logo');
  assert.equal(byName['S01-picture'].alt_text, 'RedCube AI logo');
  assert.equal(byName['S01-picture'].has_alt, true);
  assert.deepEqual(byName['S01-picture'].crop, { left: 0, top: 0, right: 0, bottom: 0 });
  assert.equal(byName['S01-group'].child_object_count, 2);
  assert.deepEqual(
    byName['S01-group'].children.map((child) => ({ name: child.name, kind: child.kind, text: child.text })),
    [
      { name: 'S01-group-a', kind: 'rect', text: '' },
      { name: 'S01-group-b', kind: 'oval', text: '' },
    ],
  );
  assert.ok(byName['S01-path'].path_segment_count >= 5);
  assert.equal(byName['S01-connector'].tail_end, 'triangle');
  assert.equal(byName['S01-connector'].from_shape_name, 'S01-diamond');
  assert.equal(byName['S01-connector'].to_shape_name, 'S01-path');

  relocateRelationshipBackedParts(result.outputPptx);
  assert.equal(validatePptx(result.outputPptx).success, true);
  const relocated = runPackageReadback(result.outputPptx);
  assert.equal(relocated.schema_version, 1);
  assert.equal(relocated.evidence_source, 'pptx_package_readback');
  assert.match(relocated.pptx_sha256, /^[a-f0-9]{64}$/);
  assert.equal(relocated.slides[0].slide_part, 'ppt/scenes/semantic-slide.xml');
  assert.equal(relocated.slides[0].notes_part, 'ppt/speakerNotes/semantic-notes.xml');
  assert.equal(relocated.notes_slide_count, 1);
  assert.equal(relocated.transition_count, 1);
  assert.equal(relocated.animation_count, 1);
  assert.ok(relocated.timing_node_count >= 1);
  assert.equal(relocated.relationship_type_counts.chart, 1);
  assert.equal(relocated.relationship_type_counts.image, 1);
  assert.equal(relocated.relationship_type_counts.notesSlide, 1);
  assert.equal(relocated.slides[0].notes_relationship_resolved, true);
  assert.match(relocated.slides[0].notes_content_type, /presentationml\.notesSlide/);
  const relocatedByName = Object.fromEntries(relocated.slides[0].objects.map((item) => [item.name, item]));
  assert.equal(relocatedByName['S01-chart'].relationship_target, 'ppt/dataObjects/semantic-chart.xml');
  assert.match(relocatedByName['S01-chart'].content_type, /drawingml\.chart/);
  assert.equal(relocatedByName['S01-chart'].series_count, 1);
  assert.equal(relocatedByName['S01-picture'].relationship_target.startsWith('ppt/assets/'), true);
  assert.match(relocatedByName['S01-picture'].content_type, /^image\//);
  assert.equal(relocatedByName['S01-connector'].from_shape_name, 'S01-diamond');
  assert.equal(relocatedByName['S01-connector'].to_shape_name, 'S01-path');
  for (const kind of ['text_box', 'shape', 'connector', 'picture', 'chart', 'table', 'group', 'path']) {
    assert.ok(relocated.object_type_counts[kind] >= 1, `relocated ${kind} missing`);
  }
});

test('stable DrawingML chart and table animations fail before PPTX materialization', () => {
  const { workspaceRoot } = createNativeObjectWorkspace('redcube-native-stable-drawing-animation-');
  const outputPptx = path.join(workspaceRoot, 'stable-drawing-animation.pptx');
  const failure = runNativeObjectMaterializerFailure({
    workspaceRoot,
    outputPptx,
    payload: {
      slides: [{
        slide_id: 'S01',
        animation_timeline: [
          { target_shape_id: 'S01-stable-chart', effect: 'fade', class: 'entrance', trigger: 'onClick' },
          { target_shape_id: 'S01-stable-table', effect: 'fade', class: 'entrance', trigger: 'afterPrevious' },
        ],
        _editable_native_shapes: [
          shape('S01-stable-chart', 'chart', bounds(0.8, 1.0, 5.3, 3.0), {
            materialization_intent: 'stable_drawingml',
            drawingml_shapes: [
              shape('S01-stable-chart-axis', 'rect', bounds(1.0, 3.5, 4.6, 0.08), { fill: '#17324D', line: 'none' }),
              shape('S01-stable-chart-bar', 'rect', bounds(2.0, 1.8, 1.1, 1.7), { fill: '#2563EB', line: 'none' }),
            ],
          }),
          shape('S01-stable-table', 'table', bounds(6.6, 1.0, 5.4, 3.0), {
            materialization_intent: 'stable_drawingml',
            drawingml_shapes: [
              shape('S01-stable-table-header', 'rect', bounds(6.8, 1.3, 4.8, 0.65), { fill: '#17324D', line: 'none' }),
              shape('S01-stable-table-row', 'rect', bounds(6.8, 2.1, 4.8, 0.65), { fill: '#E2E8F0', line: 'none' }),
            ],
          }),
        ],
      }],
    },
  });
  assert.notEqual(failure.status, 0);
  assert.match(`${failure.stdout}\n${failure.stderr}`, /animation target preflight failed/);
  assert.equal(existsSync(outputPptx), false);
});

test('native PPT build_deck rejects animation targets before writing SVG IR or PPTX output', () => {
  const { workspaceRoot } = createNativeObjectWorkspace('redcube-native-build-deck-animation-');
  const outputPptx = path.join(workspaceRoot, 'build-deck-animation.pptx');
  const svgIrDir = path.join(workspaceRoot, 'svg-ir');
  const slide = createAiSlide();
  slide.animation_timeline = [{ target_shape_id: 'S01-missing', effect: 'fade' }];
  const payload = materializerPayload([slide]);
  const python = resolveTestPythonCommand();
  const failure = spawnSync(python.command, [...(python.args || []), '-c', `
import json
import sys
from pathlib import Path
from redcube_ai.native_helpers.ppt_deck.native import evaluate_native_slide_quality, normalize_slide_data
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.materializer import build_deck

slides = normalize_slide_data(json.loads(sys.argv[1]))
build_deck(slides, Path(sys.argv[2]), Path(sys.argv[3]), set(), evaluate_native_slide_quality)
`, JSON.stringify(payload), outputPptx, svgIrDir], {
    cwd: process.cwd(),
    env: pythonTestEnv(),
    encoding: 'utf-8',
  });
  assert.notEqual(failure.status, 0);
  assert.match(`${failure.stdout}\n${failure.stderr}`, /animation target preflight failed/);
  assert.equal(existsSync(outputPptx), false);
  assert.equal(existsSync(svgIrDir), false);
});

for (const fixture of [
  {
    label: 'missing',
    targetId: 'S01-missing',
    buildShapes: () => [],
    expectedReason: 'animation_target_missing',
  },
  {
    label: 'group child',
    targetId: 'S01-group-child',
    buildShapes: () => [shape('S01-group', 'group', bounds(1, 1, 3, 2), {
      children: [shape('S01-group-child', 'rect', bounds(1, 1, 2, 1), { fill: '#E2E8F0', line: 'none' })],
    })],
    expectedReason: 'animation_target_group_child',
  },
  {
    label: 'group',
    targetId: 'S01-target',
    buildShapes: () => [shape('S01-target', 'group', bounds(1, 1, 3, 2), {
      children: [shape('S01-group-child', 'rect', bounds(1, 1, 2, 1), { fill: '#E2E8F0', line: 'none' })],
    })],
    expectedReason: 'animation_target_kind_unsupported',
  },
  {
    label: 'native table',
    targetId: 'S01-target',
    buildShapes: () => [shape('S01-target', 'table', bounds(1, 1, 4, 2), {
      materialization_intent: 'native_data_object',
      data: [['Metric', 'Value'], ['Quality', 'Pass']],
    })],
    expectedReason: 'animation_target_kind_unsupported',
  },
  {
    label: 'native metric grid',
    targetId: 'S01-target',
    buildShapes: () => [shape('S01-target', 'metric_grid', bounds(1, 1, 4, 2), {
      materialization_intent: 'native_data_object',
      data: [['Metric', 'Value'], ['Quality', 'Pass']],
    })],
    expectedReason: 'animation_target_kind_unsupported',
  },
  {
    label: 'picture',
    targetId: 'S01-target',
    buildShapes: (pictureFile) => [shape('S01-target', 'picture', bounds(1, 1, 3, 2), {
      source_file: pictureFile,
      alt: 'Target picture',
    })],
    expectedReason: 'animation_target_kind_unsupported',
  },
  {
    label: 'line',
    targetId: 'S01-target',
    buildShapes: () => [shape('S01-target', 'line', bounds(1, 1, 3, 0.08), {
      line: '#17324D',
      tail_end: 'triangle',
    })],
    expectedReason: 'animation_target_kind_unsupported',
  },
  {
    label: 'connector',
    targetId: 'S01-target',
    buildShapes: () => [shape('S01-target', 'connector', bounds(1, 1, 3, 0.08), {
      line: '#17324D',
      tail_end: 'triangle',
    })],
    expectedReason: 'animation_target_kind_unsupported',
  },
]) {
  test(`native PPT ${fixture.label} animation target fails before creating an output`, () => {
    const { workspaceRoot, pictureFile } = createNativeObjectWorkspace(`redcube-native-animation-${fixture.label.replaceAll(' ', '-')}-`);
    const outputPptx = path.join(workspaceRoot, 'animation-target.pptx');
    const failure = runNativeObjectMaterializerFailure({
      workspaceRoot,
      outputPptx,
      payload: {
        slides: [{
          slide_id: 'S01',
          animation_timeline: [{ target_shape_id: fixture.targetId, effect: 'fade' }],
          _editable_native_shapes: fixture.buildShapes(pictureFile),
        }],
      },
    });
    assert.notEqual(failure.status, 0);
    assert.match(`${failure.stdout}\n${failure.stderr}`, /animation target preflight failed/);
    assert.match(`${failure.stdout}\n${failure.stderr}`, new RegExp(fixture.expectedReason));
    assert.equal(existsSync(outputPptx), false);
  });
}

test('native PPT charts reject series whose value count does not match categories', () => {
  const { workspaceRoot } = createNativeObjectWorkspace('redcube-native-chart-length-');
  const failure = runNativeObjectMaterializerFailure({
    workspaceRoot,
    payload: {
      slides: [{
        slide_id: 'S01',
        _editable_native_shapes: [shape('S01-chart', 'chart', bounds(1, 1, 8, 4), {
          materialization_intent: 'native_data_object',
          categories: ['A', 'B'],
          series: [{ name: 'Actual', values: [1] }],
        })],
      }],
    },
  });

  assert.notEqual(failure.status, 0);
  assert.match(`${failure.stdout}\n${failure.stderr}`, /series 1 value count must match categories/);
});

test('native PPT materializer fails fast instead of degrading unknown kinds to rectangles', () => {
  const { workspaceRoot } = createNativeObjectWorkspace('redcube-native-object-unknown-');
  const failure = runNativeObjectMaterializerFailure({
    workspaceRoot,
    payload: {
      slides: [{
        slide_id: 'S01',
        _editable_native_shapes: [shape('S01-unknown', 'magic_widget', bounds(1, 1, 2, 1), { fill: '#FF0000' })],
      }],
    },
  });
  assert.notEqual(failure.status, 0);
  assert.match(`${failure.stdout}\n${failure.stderr}`, /unsupported native PPT object kind: magic_widget/);
});
