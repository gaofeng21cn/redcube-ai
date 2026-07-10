// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { evaluateNativePptBenchmark } from '../tools/native-ppt-proof/evaluate-quality.ts';

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

function canonicalBenchmark() {
  const fixture = readJson('tests/fixtures/ppt-native-visual-benchmark/benchmark.json');
  const suite = fixture.suites.find((item) => item.suite_id === 'data_charts') || fixture.suites[0];
  return { fixture, suite };
}

function passingReadback(suite) {
  const slides = suite.editable_shape_plan.slides.map((slide, index) => {
    const objectCounts = {};
    for (const shape of slide.native_shapes) {
      objectCounts[shape.kind] = Number(objectCounts[shape.kind] || 0) + 1;
    }
    return {
      slide_index: index + 1,
      slide_part: `ppt/slides/slide${index + 1}.xml`,
      object_counts: objectCounts,
      object_names: slide.native_shapes.map((shape) => shape.shape_id),
      objects: slide.native_shapes.map((shape, shapeIndex) => ({
        kind: shape.kind,
        name: shape.shape_id,
        object_id: String((index + 1) * 1000 + shapeIndex),
        ...(shape.kind === 'connector' ? {
          from_shape_name: shape.from_shape_id || '',
          to_shape_name: shape.to_shape_id || '',
          head_end: shape.head_end || 'none',
          tail_end: shape.tail_end || 'none',
        } : {}),
        ...(shape.kind === 'chart' ? {
          relationship_resolved: true,
          content_type: 'application/vnd.openxmlformats-officedocument.drawingml.chart+xml',
        } : {}),
        ...(shape.kind === 'picture' ? {
          relationship_resolved: true,
          content_type: 'image/png',
          embedded_size_bytes: 65536,
          embedded_sha256: shape.source_sha256,
          alt_text: shape.alt,
          has_alt: true,
          crop: { left: 0, top: 0, right: 0, bottom: 0 },
        } : {}),
      })),
      speaker_notes: slide.speaker_notes,
      notes_part: `ppt/notesSlides/notesSlide${index + 1}.xml`,
      notes_relationship_resolved: true,
      notes_content_type: 'application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml',
      transition: slide.transition || {},
      animation_count: safeArray(slide.animation_timeline).length,
    };
  });
  const objectTypeCounts = {};
  for (const slide of slides) {
    for (const [kind, count] of Object.entries(slide.object_counts)) {
      objectTypeCounts[kind] = Number(objectTypeCounts[kind] || 0) + Number(count);
    }
  }
  return {
    schema_version: 1,
    evidence_source: 'pptx_package_readback',
    pptx_file: '/tmp/complex-native-proof.pptx',
    pptx_sha256: 'ba5e4f56f245376f54c8443247172d26034ea9a9a652c1b84f2c7b0aa848f134',
    slide_count: slides.length,
    object_type_counts: objectTypeCounts,
    notes_slide_count: slides.length,
    transition_count: slides.filter((slide) => Object.keys(slide.transition).length > 0).length,
    animation_count: slides.reduce((total, slide) => total + slide.animation_count, 0),
    part_counts: { chart: 1, media: 1, notes: slides.length },
    slides,
  };
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function passingShapeManifest(suite, packageReadback) {
  const slides = suite.editable_shape_plan.slides.map((slide, index) => {
    const packageSlide = packageReadback.slides[index];
    const objectByName = new Map(packageSlide.objects.map((object) => [object.name, object]));
    const signaturePayload = slide.native_shapes.map((shape) => ({
      name: shape.shape_id,
      kind: objectByName.get(shape.shape_id)?.kind || null,
      bounds: shape.bounds || null,
    }));
    return {
      slide_id: slide.slide_id,
      metrics: {
        composition_signature: `materialized:${createHash('sha256').update(JSON.stringify(signaturePayload)).digest('hex')}`,
      },
      native_shapes: slide.native_shapes.map((shape) => {
        const object = objectByName.get(shape.shape_id);
        return {
          shape_id: shape.shape_id,
          kind: shape.kind,
          role: shape.role,
          quality_role: shape.quality_role,
          bounds: shape.bounds,
          materialized_kind: object?.kind || null,
          materialized_object_id: object?.object_id || null,
          package_readback_verified: Boolean(object),
        };
      }),
      render_provenance: {
        source_pptx_sha256: packageReadback.pptx_sha256,
      },
    };
  });
  return {
    page_count: slides.length,
    render_proof: {
      source_pptx_sha256: packageReadback.pptx_sha256,
      slide_count: slides.length,
    },
    slides,
  };
}

function evaluateBenchmark({ fixture, suite, packageReadback, shapeManifest = null }) {
  return evaluateNativePptBenchmark({
    fixture,
    suite,
    packageReadback,
    shapeManifest: shapeManifest || passingShapeManifest(suite, packageReadback),
  });
}

test('six-page 116-shape textbox-only proof is rejected by native PPT package gates', () => {
  const { fixture, suite } = canonicalBenchmark();
  const readback = readJson('tests/fixtures/ppt-native-quality/degraded-6-page-116-shapes-readback.json');
  const verdict = evaluateBenchmark({ fixture, suite, packageReadback: readback });

  assert.equal(verdict.status, 'route_back_candidate');
  assert.equal(verdict.progress.requires_human_gate, false);
  assert.equal(verdict.progress.recommended_action, 'repair_pptx_native');
  assert.equal(verdict.authority.owner_verdict_claimed, false);
  assert.equal(verdict.authority.can_sign_owner_receipt, false);
  const failedGateIds = verdict.gates.filter((gate) => gate.status === 'failed').map((gate) => gate.gate_id);
  for (const gateId of [
    'semantic_page_composition',
    'package_object_diversity',
    'package_required_objects',
    'speaker_notes_readback',
    'transition_readback',
  ]) {
    assert.equal(failedGateIds.includes(gateId), true, gateId);
  }
  assert.equal(verdict.evidence.package_counts.text_box, 80);
  assert.equal(verdict.evidence.package_counts.chart, undefined);
  assert.equal(verdict.evidence.package_counts.notes, 0);
});

test('heterogeneous package evidence produces a candidate pass without owner authority claims', () => {
  const { fixture, suite } = canonicalBenchmark();
  const verdict = evaluateBenchmark({
    fixture,
    suite,
    packageReadback: passingReadback(suite),
  });

  assert.equal(verdict.status, 'pass_candidate');
  assert.equal(verdict.gates.every((gate) => gate.status === 'passed'), true, JSON.stringify(verdict, null, 2));
  assert.deepEqual(verdict.evidence.semantic_families, [
    'relationship_graph',
    'timeline',
    'decision_ladder',
    'data_chart',
    'data_table',
    'image_evidence',
  ]);
  assert.equal(verdict.progress.requires_human_gate, false);
  assert.equal(verdict.progress.recommended_action, 'continue_visual_review');
  assert.equal(verdict.progress.package_gate_evaluation_complete, true);
  assert.equal(verdict.progress.terminal_quality_evaluation, false);
  assert.equal(verdict.visual_review.status, 'candidate_pending_independent_review');
  assert.equal(verdict.visual_review.owner_verdict, null);
  assert.equal(verdict.authority.owner_verdict_claimed, false);
  assert.equal(verdict.authority.can_sign_owner_receipt, false);
});

test('decorative pictures cannot satisfy authored image evidence semantics', () => {
  const { fixture, suite } = canonicalBenchmark();
  const imageSlide = suite.editable_shape_plan.slides
    .find((slide) => slide.semantic_composition === 'image_evidence');
  const picture = imageSlide.native_shapes.find((shape) => shape.kind === 'picture');
  picture.role = 'visual_accent';
  picture.quality_role = 'decorative';

  const verdict = evaluateBenchmark({
    fixture,
    suite,
    packageReadback: passingReadback(suite),
  });
  const semanticGate = verdict.gates.find((gate) => gate.gate_id === 'semantic_page_composition');

  assert.equal(verdict.status, 'route_back_candidate');
  assert.equal(semanticGate.status, 'failed');
});

test('package semantic evidence binds authored IDs to actual kinds and directed connector endpoints', () => {
  const { fixture, suite } = canonicalBenchmark();
  const readback = passingReadback(suite);
  const manifest = passingShapeManifest(suite, readback);
  const relationshipSlide = readback.slides[0];
  for (const object of relationshipSlide.objects) {
    if (['D01-owner', 'D01-stage', 'D01-helper'].includes(object.name)) {
      object.kind = 'text_box';
    }
    if (object.kind === 'connector') {
      object.from_shape_name = '';
      object.to_shape_name = '';
      object.tail_end = 'none';
    }
  }
  for (const shape of manifest.slides[0].native_shapes) {
    const object = relationshipSlide.objects.find((item) => item.name === shape.shape_id);
    shape.materialized_kind = object?.kind || null;
  }

  const verdict = evaluateBenchmark({ fixture, suite, packageReadback: readback, shapeManifest: manifest });
  const semanticGate = verdict.gates.find((gate) => gate.gate_id === 'semantic_page_composition');

  assert.equal(verdict.status, 'route_back_candidate');
  assert.equal(semanticGate.status, 'failed');
});

test('composition diversity uses materialized signatures bound to the PPTX SHA', () => {
  const { fixture, suite } = canonicalBenchmark();
  const readback = passingReadback(suite);
  const manifest = passingShapeManifest(suite, readback);
  const repeatedShapes = JSON.parse(JSON.stringify(manifest.slides[0].native_shapes));
  for (const slide of manifest.slides) {
    slide.native_shapes = JSON.parse(JSON.stringify(repeatedShapes));
  }

  const verdict = evaluateBenchmark({ fixture, suite, packageReadback: readback, shapeManifest: manifest });
  const diversityGate = verdict.gates.find((gate) => gate.gate_id === 'composition_diversity');

  assert.equal(verdict.status, 'route_back_candidate');
  assert.equal(diversityGate.status, 'failed');
});

test('materialized manifest must be bound to the same PPTX package SHA', () => {
  const { fixture, suite } = canonicalBenchmark();
  const readback = passingReadback(suite);
  const manifest = passingShapeManifest(suite, readback);
  manifest.render_proof.source_pptx_sha256 = '0'.repeat(64);

  const verdict = evaluateBenchmark({ fixture, suite, packageReadback: readback, shapeManifest: manifest });
  const bindingGate = verdict.gates.find((gate) => gate.gate_id === 'materialized_manifest_binding');

  assert.equal(verdict.status, 'route_back_candidate');
  assert.equal(bindingGate.status, 'failed');
});

test('tiny embedded picture payload cannot pass as inspectable visual evidence', () => {
  const { fixture, suite } = canonicalBenchmark();
  const readback = passingReadback(suite);
  const picture = readback.slides.flatMap((slide) => slide.objects)
    .find((item) => item.kind === 'picture');
  picture.embedded_size_bytes = 78;

  const verdict = evaluateBenchmark({ fixture, suite, packageReadback: readback });
  const pictureGate = verdict.gates.find((gate) => gate.gate_id === 'picture_evidence_payload');

  assert.equal(verdict.status, 'route_back_candidate');
  assert.equal(pictureGate.status, 'failed');
  assert.deepEqual(pictureGate.evidence.failures, [{
    name: picture.name,
    reason: 'embedded_picture_too_small',
    actual_bytes: 78,
    minimum_bytes: 4096,
  }]);
});

test('picture object without alternative text cannot pass as inspectable evidence', () => {
  const { fixture, suite } = canonicalBenchmark();
  const readback = passingReadback(suite);
  const picture = readback.slides.flatMap((slide) => slide.objects)
    .find((item) => item.kind === 'picture');
  picture.alt_text = '';
  picture.has_alt = false;

  const verdict = evaluateBenchmark({ fixture, suite, packageReadback: readback });
  const pictureGate = verdict.gates.find((gate) => gate.gate_id === 'picture_evidence_payload');

  assert.equal(verdict.status, 'route_back_candidate');
  assert.deepEqual(pictureGate.evidence.failures, [{
    name: picture.name,
    reason: 'picture_alt_missing',
  }]);
});

test('picture payload must match the authored source asset SHA', () => {
  const { fixture, suite } = canonicalBenchmark();
  const readback = passingReadback(suite);
  const picture = readback.slides.flatMap((slide) => slide.objects)
    .find((item) => item.kind === 'picture');
  picture.embedded_sha256 = '0'.repeat(64);

  const verdict = evaluateBenchmark({ fixture, suite, packageReadback: readback });
  const pictureGate = verdict.gates.find((gate) => gate.gate_id === 'picture_evidence_payload');

  assert.equal(verdict.status, 'route_back_candidate');
  assert.equal(pictureGate.status, 'failed');
  assert.equal(pictureGate.evidence.failures.some((item) => item.reason === 'picture_source_sha_mismatch'), true);
});

test('declared chart and picture counts cannot pass when package relationships are unresolved', () => {
  const { fixture, suite } = canonicalBenchmark();
  const readback = passingReadback(suite);
  for (const slide of readback.slides) {
    for (const object of slide.objects) {
      if (['chart', 'picture'].includes(object.kind)) object.relationship_resolved = false;
    }
  }
  const verdict = evaluateBenchmark({ fixture, suite, packageReadback: readback });
  const relationshipGate = verdict.gates.find((gate) => gate.gate_id === 'package_relationship_integrity');

  assert.equal(verdict.status, 'route_back_candidate');
  assert.equal(relationshipGate.status, 'failed');
  assert.deepEqual(relationshipGate.evidence.failures.map((item) => item.kind), ['chart', 'picture']);
});

test('declared notes cannot pass without a resolved notes relationship and content type', () => {
  const { fixture, suite } = canonicalBenchmark();
  const readback = passingReadback(suite);
  readback.slides[0].notes_relationship_resolved = false;
  readback.slides[1].notes_content_type = 'application/xml';
  const verdict = evaluateBenchmark({ fixture, suite, packageReadback: readback });
  const relationshipGate = verdict.gates.find((gate) => gate.gate_id === 'package_relationship_integrity');

  assert.equal(verdict.status, 'route_back_candidate');
  assert.equal(relationshipGate.status, 'failed');
  assert.deepEqual(relationshipGate.evidence.failures, [{
    kind: 'notes',
    expected: readback.notes_slide_count,
    resolved: readback.notes_slide_count - 2,
  }]);
});
