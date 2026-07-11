import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

import { resolveRedCubePythonCommand } from '../scripts/run-test-group-lib.ts';

function bounds(left, top, width, height) {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

function evaluate(shapes, primaryPoints = 2) {
  const python = resolveRedCubePythonCommand();
  const script = `
import json
import sys
from redcube_ai.native_helpers.ppt_deck.native import evaluate_native_slide_quality

payload = json.loads(sys.stdin.read())
print(json.dumps(evaluate_native_slide_quality(payload['shapes'], payload['primary_points']), ensure_ascii=False))
`;
  return JSON.parse(execFileSync(
    python.command,
    [...(python.args || []), '-c', script],
    {
      cwd: path.resolve('.'),
      env: {
        ...process.env,
        PYTHONPATH: path.resolve('python'),
        PYTHONDONTWRITEBYTECODE: '1',
      },
      input: JSON.stringify({ shapes, primary_points: primaryPoints }),
      encoding: 'utf-8',
    },
  ));
}

function cardSlideWith(structuralShapes) {
  return [
    {
      shape_id: 'title',
      kind: 'text_box',
      role: 'title',
      quality_role: 'content',
      text: 'Decision evidence',
      font_size: 44,
      bounds: bounds(80, 40, 1000, 80),
    },
    {
      shape_id: 'panel-a',
      kind: 'rounded_rect',
      role: 'compare_panel',
      quality_role: 'content',
      bounds: bounds(80, 250, 450, 300),
    },
    {
      shape_id: 'panel-b',
      kind: 'rounded_rect',
      role: 'compare_panel',
      quality_role: 'content',
      bounds: bounds(600, 250, 450, 300),
    },
    {
      shape_id: 'point-a',
      kind: 'text_box',
      role: 'point_text',
      quality_role: 'content',
      text: 'Evidence one carries complete audience meaning.',
      font_size: 18,
      bounds: bounds(110, 300, 380, 120),
    },
    {
      shape_id: 'point-b',
      kind: 'text_box',
      role: 'point_text',
      quality_role: 'content',
      text: 'Evidence two carries complete audience meaning.',
      font_size: 18,
      bounds: bounds(630, 300, 380, 120),
    },
    ...structuralShapes,
    {
      shape_id: 'page',
      kind: 'text_box',
      role: 'page_number',
      quality_role: 'auxiliary',
      text: '01',
      font_size: 12,
      bounds: bounds(1100, 650, 40, 20),
    },
  ];
}

test('decorative primitives and typed objects cannot satisfy native PPT semantic visual or anti-card gates', () => {
  const falsePositiveShapes = [
    {
      shape_id: 'decorative-line',
      kind: 'line',
      role: 'decorative_line',
      quality_role: 'decorative',
      bounds: bounds(100, 620, 900, 6),
    },
    {
      shape_id: 'accent-dot',
      kind: 'oval',
      role: 'accent_dot',
      quality_role: 'decorative',
      bounds: bounds(1000, 610, 24, 24),
    },
    {
      shape_id: 'brand-logo',
      kind: 'picture',
      role: 'visual_accent',
      quality_role: 'decorative',
      bounds: bounds(1000, 40, 80, 80),
    },
    {
      shape_id: 'decorative-group',
      kind: 'group',
      role: 'decorative_group',
      quality_role: 'decorative',
      bounds: bounds(100, 600, 120, 40),
    },
    {
      shape_id: 'decorative-path',
      kind: 'path',
      role: 'decorative_path',
      quality_role: 'decorative',
      bounds: bounds(980, 600, 80, 40),
    },
  ];

  for (const shape of falsePositiveShapes) {
    const result = evaluate(cardSlideWith([shape]));
    assert.equal(result.checks.visual_structure_present, false, shape.shape_id);
    assert.equal(result.checks.non_text_visual_specific_ok, false, shape.shape_id);
    assert.equal(result.checks.mechanical_card_template_absent, false, shape.shape_id);
    assert.match(result.issues.join('\n'), /native_visual_structure_missing/);
    assert.match(result.issues.join('\n'), /native_non_text_visual_too_generic/);
    assert.match(result.issues.join('\n'), /native_mechanical_card_template_detected/);
  }
});

test('decorative role names and disconnected lines cannot forge relationship evidence', () => {
  const result = evaluate(cardSlideWith([
    {
      shape_id: 'decorative-node-a',
      kind: 'oval',
      role: 'dependency_node',
      quality_role: 'decorative',
      bounds: bounds(180, 560, 60, 60),
    },
    {
      shape_id: 'decorative-node-b',
      kind: 'oval',
      role: 'dependency_node',
      quality_role: 'decorative',
      bounds: bounds(545, 560, 60, 60),
    },
    {
      shape_id: 'decorative-node-c',
      kind: 'oval',
      role: 'dependency_node',
      quality_role: 'decorative',
      bounds: bounds(910, 560, 60, 60),
    },
    {
      shape_id: 'decorative-edge-a',
      kind: 'line',
      role: 'dependency_connector',
      quality_role: 'decorative',
      bounds: bounds(240, 587, 305, 6),
    },
    {
      shape_id: 'decorative-edge-b',
      kind: 'line',
      role: 'dependency_connector',
      quality_role: 'decorative',
      bounds: bounds(605, 587, 305, 6),
    },
  ]));

  assert.equal(result.checks.visual_structure_present, false);
  assert.equal(result.checks.non_text_visual_specific_ok, false);
  assert.equal(result.checks.mechanical_card_template_absent, false);
  assert.equal(result.metrics.semantic_visual_evidence_count, 0);
});

test('all semantic flow families require bound directed connectors', () => {
  const forgeries = [
    {
      family: 'comparison_flow',
      shapes: [
        { shape_id: 'compare-edge-a', kind: 'connector', role: 'comparison_connector', quality_role: 'structural', bounds: bounds(530, 360, 70, 6) },
        { shape_id: 'compare-edge-b', kind: 'connector', role: 'comparison_connector', quality_role: 'structural', bounds: bounds(530, 440, 70, 6) },
      ],
    },
    {
      family: 'system_map',
      shapes: [
        { shape_id: 'map-node-a', kind: 'rounded_rect', role: 'axis_panel', quality_role: 'content', bounds: bounds(120, 560, 180, 80) },
        { shape_id: 'map-node-b', kind: 'rounded_rect', role: 'axis_panel', quality_role: 'content', bounds: bounds(480, 560, 180, 80) },
        { shape_id: 'map-node-c', kind: 'rounded_rect', role: 'axis_panel', quality_role: 'content', bounds: bounds(840, 560, 180, 80) },
        { shape_id: 'map-edge', kind: 'connector', role: 'route_flow_connector', quality_role: 'structural', bounds: bounds(300, 598, 540, 6) },
      ],
    },
    {
      family: 'signal_composition',
      shapes: [
        { shape_id: 'signal-node-a', kind: 'oval', role: 'signal_hub', quality_role: 'structural', bounds: bounds(420, 560, 80, 80) },
        { shape_id: 'signal-node-b', kind: 'rounded_rect', role: 'signal_panel', quality_role: 'content', bounds: bounds(650, 550, 220, 100) },
        { shape_id: 'signal-edge', kind: 'connector', role: 'signal_connector', quality_role: 'structural', bounds: bounds(500, 598, 150, 6) },
      ],
    },
  ];

  const forgedFamilies = forgeries
    .filter(({ family, shapes }) => (
      evaluate(cardSlideWith(shapes)).metrics.semantic_visual_families.includes(family)
    ))
    .map(({ family }) => family);

  assert.deepEqual(forgedFamilies, []);
});

test('semantic connectors require bound endpoints, direction, and graph connectivity', () => {
  const result = evaluate(cardSlideWith([
    {
      shape_id: 'node-a',
      kind: 'oval',
      role: 'dependency_node',
      quality_role: 'structural',
      bounds: bounds(180, 560, 60, 60),
    },
    {
      shape_id: 'node-b',
      kind: 'oval',
      role: 'dependency_node',
      quality_role: 'structural',
      bounds: bounds(545, 560, 60, 60),
    },
    {
      shape_id: 'node-c',
      kind: 'oval',
      role: 'dependency_node',
      quality_role: 'structural',
      bounds: bounds(910, 560, 60, 60),
    },
    {
      shape_id: 'edge-a',
      kind: 'connector',
      role: 'dependency_connector',
      quality_role: 'structural',
      from_shape_id: 'node-a',
      to_shape_id: 'node-b',
      bounds: bounds(240, 587, 305, 6),
    },
    {
      shape_id: 'edge-b',
      kind: 'connector',
      role: 'dependency_connector',
      quality_role: 'structural',
      from_shape_id: 'node-a',
      to_shape_id: 'node-b',
      tail_end: 'triangle',
      bounds: bounds(605, 587, 305, 6),
    },
  ]));

  assert.equal(result.metrics.semantic_visual_evidence_count, 0);
  assert.equal(result.checks.mechanical_card_template_absent, false);
});

test('a relationship graph with directed connectors carries specific semantic evidence', () => {
  const result = evaluate(cardSlideWith([
    {
      shape_id: 'node-a',
      kind: 'oval',
      role: 'dependency_node',
      quality_role: 'structural',
      bounds: bounds(200, 570, 80, 80),
    },
    {
      shape_id: 'node-b',
      kind: 'oval',
      role: 'dependency_node',
      quality_role: 'structural',
      bounds: bounds(520, 570, 80, 80),
    },
    {
      shape_id: 'node-c',
      kind: 'oval',
      role: 'dependency_node',
      quality_role: 'structural',
      bounds: bounds(840, 570, 80, 80),
    },
    {
      shape_id: 'edge-a-b',
      kind: 'connector',
      role: 'dependency_connector',
      quality_role: 'structural',
      from_shape_id: 'node-a',
      to_shape_id: 'node-b',
      tail_end: 'triangle',
      bounds: bounds(280, 605, 240, 6),
    },
    {
      shape_id: 'edge-b-c',
      kind: 'connector',
      role: 'dependency_connector',
      quality_role: 'structural',
      from_shape_id: 'node-b',
      to_shape_id: 'node-c',
      tail_end: 'triangle',
      bounds: bounds(600, 605, 240, 6),
    },
  ]));

  assert.equal(result.checks.visual_structure_present, true);
  assert.equal(result.checks.non_text_visual_specific_ok, true);
  assert.equal(result.checks.mechanical_card_template_absent, true);
  assert.equal(result.metrics.semantic_visual_evidence_count >= 1, true);
  assert.deepEqual(result.metrics.semantic_visual_families, ['relationship_graph']);
});

function statusFlowShapes() {
  const hubId = 'status-input-hub';
  const panelIds = ['status-panel-a', 'status-panel-b', 'status-panel-c'];
  return [
    {
      shape_id: 'title',
      kind: 'text_box',
      role: 'title',
      quality_role: 'content',
      text: 'One input reaches three verified outcomes',
      font_size: 44,
      bounds: bounds(80, 40, 1000, 80),
    },
    {
      shape_id: hubId,
      kind: 'rounded_rect',
      role: 'input_hub',
      quality_role: 'structural',
      bounds: bounds(250, 180, 650, 90),
    },
    ...panelIds.map((shapeId, index) => ({
      shape_id: shapeId,
      kind: 'rounded_rect',
      role: 'content_panel',
      quality_role: 'content',
      bounds: bounds(80 + (index * 360), 420, 300, 150),
    })),
    ...panelIds.map((shapeId, index) => ({
      shape_id: `status-text-${index + 1}`,
      kind: 'text_box',
      role: 'point_text',
      quality_role: 'content',
      text: `Outcome ${index + 1} carries concrete audience evidence.`,
      font_size: 18,
      bounds: bounds(110 + (index * 360), 455, 240, 70),
    })),
    ...panelIds.map((shapeId, index) => ({
      shape_id: `status-flow-${index + 1}`,
      kind: 'connector',
      role: 'flow_connector',
      quality_role: 'structural',
      from_shape_id: hubId,
      to_shape_id: shapeId,
      tail_end: 'triangle',
      bounds: bounds(300 + (index * 250), 280, 10, 130),
    })),
    {
      shape_id: 'page',
      kind: 'text_box',
      role: 'page_number',
      quality_role: 'auxiliary',
      text: '01',
      font_size: 12,
      bounds: bounds(1100, 650, 40, 20),
    },
  ];
}

test('canonical three-branch status flow carries endpoint-bound semantic evidence', () => {
  const result = evaluate(statusFlowShapes(), 3);

  assert.equal(result.checks.visual_structure_present, true);
  assert.equal(result.checks.non_text_visual_specific_ok, true);
  assert.equal(result.checks.mechanical_card_template_absent, true);
  assert.deepEqual(result.metrics.semantic_visual_families, ['status_flow']);
});

test('status flow without every endpoint-bound branch remains a mechanical card template', () => {
  const shapes = statusFlowShapes();
  delete shapes.find((shape) => shape.shape_id === 'status-flow-3').to_shape_id;
  const result = evaluate(shapes, 3);

  assert.equal(result.checks.visual_structure_present, false);
  assert.equal(result.checks.non_text_visual_specific_ok, false);
  assert.equal(result.checks.mechanical_card_template_absent, false);
});

test('timeline short labels satisfy semantic layout slots without legacy point text cards', () => {
  const result = evaluate([
    {
      shape_id: 'title',
      kind: 'text_box',
      role: 'title',
      quality_role: 'content',
      text: 'Four milestones move source to proof',
      font_size: 40,
      bounds: bounds(80, 40, 1000, 80),
    },
    {
      shape_id: 'core',
      kind: 'text_box',
      role: 'core_sentence',
      quality_role: 'content',
      text: 'Each node owns one observable output and one restart point.',
      font_size: 20,
      bounds: bounds(80, 135, 900, 70),
    },
    {
      shape_id: 'timeline-panel',
      kind: 'rounded_rect',
      role: 'timeline_panel',
      quality_role: 'content',
      bounds: bounds(80, 250, 1000, 260),
    },
    {
      shape_id: 'milestone-a',
      kind: 'oval',
      role: 'milestone_node',
      quality_role: 'structural',
      bounds: bounds(180, 330, 60, 60),
    },
    {
      shape_id: 'milestone-b',
      kind: 'oval',
      role: 'milestone_node',
      quality_role: 'structural',
      bounds: bounds(545, 330, 60, 60),
    },
    {
      shape_id: 'milestone-c',
      kind: 'oval',
      role: 'milestone_node',
      quality_role: 'structural',
      bounds: bounds(910, 330, 60, 60),
    },
    {
      shape_id: 'timeline-edge-a',
      kind: 'connector',
      role: 'timeline_connector',
      quality_role: 'structural',
      from_shape_id: 'milestone-a',
      to_shape_id: 'milestone-b',
      tail_end: 'triangle',
      bounds: bounds(240, 357, 305, 6),
    },
    {
      shape_id: 'timeline-edge-b',
      kind: 'connector',
      role: 'timeline_connector',
      quality_role: 'structural',
      from_shape_id: 'milestone-b',
      to_shape_id: 'milestone-c',
      tail_end: 'triangle',
      bounds: bounds(605, 357, 305, 6),
    },
    {
      shape_id: 'label-a',
      kind: 'text_box',
      role: 'point_text_short',
      quality_role: 'content',
      text: 'Source lock',
      font_size: 18,
      bounds: bounds(130, 410, 160, 50),
    },
    {
      shape_id: 'label-b',
      kind: 'text_box',
      role: 'point_text_short',
      quality_role: 'content',
      text: 'Story plan',
      font_size: 18,
      bounds: bounds(495, 410, 160, 50),
    },
    {
      shape_id: 'label-c',
      kind: 'text_box',
      role: 'point_text_short',
      quality_role: 'content',
      text: 'Render proof',
      font_size: 18,
      bounds: bounds(860, 410, 160, 50),
    },
  ], 1);

  assert.equal(result.metrics.layout_variant, 'timeline_band');
  assert.equal(result.checks.slot_fill_ok, true);
  assert.deepEqual(result.metrics.semantic_visual_families, ['timeline']);
});

test('semantic evidence supplies layout slots and distinct composition signatures without legacy panels', () => {
  const titleAndCore = [
    {
      shape_id: 'title',
      kind: 'text_box',
      role: 'title',
      quality_role: 'content',
      text: 'Semantic composition proof',
      font_size: 40,
      bounds: bounds(80, 40, 1000, 80),
    },
    {
      shape_id: 'core',
      kind: 'text_box',
      role: 'core_sentence',
      quality_role: 'content',
      text: 'The quality gate must consume the same semantic evidence it reports.',
      font_size: 20,
      bounds: bounds(80, 135, 900, 70),
    },
  ];
  const graph = evaluate([
    { shape_id: 'bg', kind: 'rect', role: 'background', quality_role: 'decorative', bounds: bounds(0, 0, 1152, 648) },
    ...titleAndCore,
    { shape_id: 'node-a', kind: 'rounded_rect', role: 'dependency_node', quality_role: 'content', text: 'Source owner', font_size: 18, bounds: bounds(100, 280, 220, 90) },
    { shape_id: 'node-b', kind: 'rounded_rect', role: 'dependency_node', quality_role: 'content', text: 'Stage owner', font_size: 18, bounds: bounds(465, 430, 220, 90) },
    { shape_id: 'node-c', kind: 'rounded_rect', role: 'dependency_node', quality_role: 'content', text: 'Artifact owner', font_size: 18, bounds: bounds(830, 280, 220, 90) },
    { shape_id: 'edge-a', kind: 'connector', role: 'dependency_connector', quality_role: 'structural', from_shape_id: 'node-a', to_shape_id: 'node-b', tail_end: 'triangle', bounds: bounds(320, 335, 145, 80) },
    { shape_id: 'edge-b', kind: 'connector', role: 'dependency_connector', quality_role: 'structural', from_shape_id: 'node-b', to_shape_id: 'node-c', tail_end: 'triangle', bounds: bounds(685, 335, 145, 80) },
  ], 1);
  const chart = evaluate([
    { shape_id: 'bg', kind: 'rect', role: 'background', quality_role: 'decorative', bounds: bounds(0, 0, 1152, 648) },
    ...titleAndCore,
    { shape_id: 'chart', kind: 'chart', role: 'data_chart', quality_role: 'structural', bounds: bounds(80, 240, 900, 320) },
  ], 1);

  assert.equal(graph.metrics.layout_variant, 'relationship_graph');
  assert.equal(graph.checks.slot_fill_ok, true);
  assert.equal(graph.checks.layout_richness_ok, true);
  assert.equal(chart.checks.slot_fill_ok, false);
  assert.notEqual(graph.metrics.composition_signature, chart.metrics.composition_signature);
});

test('typed native pictures remain structural in manifest quality telemetry', () => {
  const result = evaluate(cardSlideWith([{
    shape_id: 'evidence-picture',
    kind: 'picture',
    role: 'evidence_picture',
    quality_role: 'structural',
    bounds: bounds(160, 520, 832, 100),
  }]));

  assert.equal(result.metrics.structural_visual_count, 1);
  assert.deepEqual(result.metrics.structural_visual_roles, ['evidence_picture']);
  assert.deepEqual(result.metrics.semantic_visual_families, ['image_evidence']);
});
