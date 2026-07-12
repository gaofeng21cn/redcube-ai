import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { evaluateNativePptBenchmark } from '../tools/native-ppt-proof/evaluate-quality.ts';

const PARITY_CONTRACT_PATH = 'contracts/runtime-program/ppt-master-parity-benchmark.json';
const PARITY_EVALUATOR_PATH = 'tools/native-ppt-proof/ppt-master-parity.ts';

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

test('ppt-master parity contract pins the upstream and fail-closed blind benchmark boundary', () => {
  assert.equal(existsSync(PARITY_CONTRACT_PATH), true, 'parity contract must exist');
  const contract = readJson(PARITY_CONTRACT_PATH);

  assert.equal(contract.external_source.repository, 'https://github.com/hugohe3/ppt-master.git');
  assert.equal(contract.external_source.commit, 'b0beba5b659c664bdbf0c07227fbdee313698dd7');
  assert.deepEqual(contract.benchmark_protocol.same_source_lock.required_fields, [
    'material_bundle_ref',
    'material_bundle_sha256',
    'page_count',
    'audience',
    'brand_constraints',
    'edit_requirements',
  ]);
  assert.deepEqual(contract.review_protocol.dimensions, [
    'professionality',
    'aesthetics',
    'stability',
    'editability',
  ]);
  assert.equal(contract.acceptance.noninferiority_margin_percentage_points, 5);
  assert.equal(contract.acceptance.noninferiority_method, 'paired_mean_difference_conservative_student_t_lower_bound');
  assert.equal(contract.acceptance.confidence_multiplier, 2.776);
  assert.equal(contract.acceptance.critical_defect_rate_policy, 'candidate_lte_reference');
  assert.equal(contract.acceptance.candidate_edit_requirements_policy, 'all_passed');
  assert.deepEqual(contract.benchmark_protocol.reviewer_visible_output_fields, [
    'slot_id',
    'artifact_ref',
    'pptx_sha256',
    'render_manifest_ref',
    'package_readback_ref',
  ]);
  assert.deepEqual(contract.evidence_boundary.allowed_outcomes, [
    'pass_candidate',
    'route_back_candidate',
    'blocked',
  ]);
  assert.equal(contract.evidence_boundary.insufficient_evidence_outcome, 'blocked');
  assert.equal(contract.authority.can_sign_owner_receipt, false);
  assert.equal(contract.authority.owner_receipt_signer, 'RedCube AI');
});

function parityContract() {
  return readJson(PARITY_CONTRACT_PATH);
}

function anonymousPairManifest() {
  return {
    schema_version: 1,
    pair_manifest_kind: 'rca_ppt_same_source_anonymous_pair',
    pair_id: 'blind-pair-001',
    source_lock: {
      material_bundle_ref: 'source:benchmark:capital-brief',
      material_bundle_sha256: '1'.repeat(64),
      page_count: 6,
      audience: 'investment committee',
      brand_constraints: ['16:9', 'neutral institutional palette', 'English'],
      edit_requirements: [
        { task_id: 'edit-data', requirement: 'change the Q4 value and refresh the chart' },
        { task_id: 'edit-text', requirement: 'replace the executive takeaway' },
        { task_id: 'edit-color', requirement: 'change the accent color' },
        { task_id: 'edit-node', requirement: 'move one relationship node' },
        { task_id: 'edit-notes', requirement: 'update speaker notes' },
      ],
    },
    anonymous_outputs: [
      {
        slot_id: 'output_alpha',
        artifact_ref: 'artifact:blind-output-alpha',
        pptx_sha256: 'a'.repeat(64),
        render_manifest_ref: 'artifact:blind-render-alpha',
        package_readback_ref: 'artifact:blind-package-alpha',
      },
      {
        slot_id: 'output_beta',
        artifact_ref: 'artifact:blind-output-beta',
        pptx_sha256: 'b'.repeat(64),
        render_manifest_ref: 'artifact:blind-render-beta',
        package_readback_ref: 'artifact:blind-package-beta',
      },
    ],
  };
}

async function parityEvaluator() {
  assert.equal(existsSync(PARITY_EVALUATOR_PATH), true, 'parity evaluator must exist');
  return import(path.resolve(PARITY_EVALUATOR_PATH));
}

test('blind parity review packet carries the shared lock without provider identity', async () => {
  const { buildBlindParityReviewPacket } = await parityEvaluator();
  const contract = parityContract();
  const packet = buildBlindParityReviewPacket({
    contract,
    pairManifest: anonymousPairManifest(),
  });

  assert.equal(packet.pair_id, 'blind-pair-001');
  assert.deepEqual(packet.source_lock, anonymousPairManifest().source_lock);
  assert.deepEqual(packet.anonymous_outputs.map((output) => output.slot_id), [
    'output_alpha',
    'output_beta',
  ]);
  assert.match(packet.review_packet_sha256, /^[a-f0-9]{64}$/);
  assert.equal('identity_binding' in packet, false);
  const serialized = JSON.stringify(packet).toLowerCase();
  for (const token of contract.benchmark_protocol.forbidden_reviewer_identity_tokens) {
    assert.equal(serialized.includes(token), false, token);
  }
});

function parityIdentityBinding(packet, reviews, hashBlindParityReviewSet) {
  return {
    pair_id: packet.pair_id,
    review_packet_sha256: packet.review_packet_sha256,
    sealed_binding_ref: 'binding:blind-pair-001',
    revealed_after_scoring: true,
    review_set_sha256: hashBlindParityReviewSet(reviews),
    candidate_slot_id: 'output_alpha',
    reference_slot_id: 'output_beta',
  };
}

function blindReviews(packet, count, {
  candidateScore = 82,
  referenceScore = 84,
  candidateCriticalReviewers = [],
  referenceCriticalReviewers = [],
} = {}) {
  const dimensions = parityContract().review_protocol.dimensions;
  return Array.from({ length: count }, (_, index) => {
    const reviewerId = `reviewer-${index + 1}`;
    const alphaScore = Array.isArray(candidateScore) ? candidateScore[index] : candidateScore;
    const betaScore = Array.isArray(referenceScore) ? referenceScore[index] : referenceScore;
    return {
      review_id: `blind-review-${index + 1}`,
      reviewer_id: reviewerId,
      review_packet_sha256: packet.review_packet_sha256,
      attestations: {
        independent: true,
        provider_identity_unseen: true,
      },
      scores: {
        output_alpha: Object.fromEntries(dimensions.map((dimension) => [dimension, alphaScore])),
        output_beta: Object.fromEntries(dimensions.map((dimension) => [dimension, betaScore])),
      },
      critical_defects: {
        output_alpha: candidateCriticalReviewers.includes(index) ? [`critical-alpha-${index + 1}`] : [],
        output_beta: referenceCriticalReviewers.includes(index) ? [`critical-beta-${index + 1}`] : [],
      },
    };
  });
}

function editResults(status = 'passed') {
  return anonymousPairManifest().source_lock.edit_requirements.map((requirement, index) => ({
    slot_id: 'output_alpha',
    task_id: requirement.task_id,
    status,
    edited_artifact_sha256: String(index + 2).repeat(64).slice(0, 64),
  }));
}

test('blind parity evaluation blocks insufficient independent scoring without issuing a receipt', async () => {
  const {
    buildBlindParityReviewPacket,
    evaluateBlindPptParity,
    hashBlindParityReviewSet,
  } = await parityEvaluator();
  assert.equal(typeof evaluateBlindPptParity, 'function');
  assert.equal(typeof hashBlindParityReviewSet, 'function');
  const contract = parityContract();
  const pairManifest = anonymousPairManifest();
  const packet = buildBlindParityReviewPacket({ contract, pairManifest });
  const reviews = blindReviews(packet, 2);
  const verdict = evaluateBlindPptParity({
    contract,
    pairManifest,
    identityBinding: parityIdentityBinding(packet, reviews, hashBlindParityReviewSet),
    reviews,
    editTaskResults: editResults(),
  });

  assert.equal(verdict.status, 'blocked');
  assert.equal(verdict.evidence_state, 'pending_independent_scoring');
  assert.equal(verdict.blockers.some((item) => item.code === 'insufficient_independent_reviewers'), true);
  assert.equal(verdict.authority.owner_verdict_claimed, false);
  assert.equal(verdict.authority.can_sign_owner_receipt, false);
  assert.equal(verdict.authority.owner_receipt_ref, null);
  assert.equal('owner_receipt' in verdict, false);
});

async function evaluateParity({ reviews, edits = editResults() }) {
  const {
    buildBlindParityReviewPacket,
    evaluateBlindPptParity,
    hashBlindParityReviewSet,
  } = await parityEvaluator();
  const contract = parityContract();
  const pairManifest = anonymousPairManifest();
  const packet = buildBlindParityReviewPacket({ contract, pairManifest });
  const reviewSet = reviews(packet);
  return evaluateBlindPptParity({
    contract,
    pairManifest,
    identityBinding: parityIdentityBinding(packet, reviewSet, hashBlindParityReviewSet),
    reviews: reviewSet,
    editTaskResults: edits,
  });
}

test('paired four-dimension lower bounds can produce a non-authoritative pass candidate', async () => {
  const verdict = await evaluateParity({
    reviews: (packet) => blindReviews(packet, 5, {
      candidateScore: [83, 81, 82, 84, 80],
      referenceScore: [84, 84, 84, 84, 84],
    }),
  });

  assert.equal(verdict.status, 'pass_candidate');
  assert.equal(verdict.evidence_state, 'complete_candidate_evidence');
  assert.deepEqual(Object.keys(verdict.dimension_results), parityContract().review_protocol.dimensions);
  for (const result of Object.values(verdict.dimension_results)) {
    assert.equal(result.sample_count, 5);
    assert.equal(result.mean_difference_percentage_points, -2);
    assert.ok(result.lower_confidence_bound_percentage_points > -5);
    assert.equal(result.status, 'passed');
  }
  assert.deepEqual(verdict.critical_defect_rates, { candidate: 0, reference: 0, status: 'passed' });
  assert.equal(verdict.edit_requirements.status, 'passed');
  assert.equal(verdict.authority.can_sign_owner_receipt, false);
  assert.equal(verdict.authority.owner_receipt_ref, null);
});

test('a dimension below the five-point noninferiority lower bound routes back', async () => {
  const verdict = await evaluateParity({
    reviews: (packet) => blindReviews(packet, 5, {
      candidateScore: [80, 78, 79, 77, 76],
      referenceScore: [84, 84, 84, 84, 84],
    }),
  });

  assert.equal(verdict.status, 'route_back_candidate');
  assert.equal(Object.values(verdict.dimension_results).every((result) => result.status === 'failed'), true);
  assert.equal(verdict.failures.some((item) => item.code === 'noninferiority_lower_bound_not_met'), true);
});

test('candidate critical defect rate above reference routes back', async () => {
  const verdict = await evaluateParity({
    reviews: (packet) => blindReviews(packet, 5, {
      candidateCriticalReviewers: [0],
    }),
  });

  assert.equal(verdict.status, 'route_back_candidate');
  assert.deepEqual(verdict.critical_defect_rates, { candidate: 0.2, reference: 0, status: 'failed' });
  assert.equal(verdict.failures.some((item) => item.code === 'candidate_critical_defect_rate_exceeds_reference'), true);
});

test('explicit candidate edit task failure routes back', async () => {
  const edits = editResults();
  edits[2].status = 'failed';
  const verdict = await evaluateParity({
    reviews: (packet) => blindReviews(packet, 5),
    edits,
  });

  assert.equal(verdict.status, 'route_back_candidate');
  assert.equal(verdict.edit_requirements.status, 'failed');
  assert.deepEqual(verdict.edit_requirements.failed_task_ids, ['edit-color']);
  assert.equal(verdict.failures.some((item) => item.code === 'candidate_edit_requirement_failed'), true);
});

test('missing candidate edit evidence blocks instead of becoming a parity verdict', async () => {
  const verdict = await evaluateParity({
    reviews: (packet) => blindReviews(packet, 5),
    edits: editResults().slice(0, -1),
  });

  assert.equal(verdict.status, 'blocked');
  assert.equal(verdict.evidence_state, 'pending_edit_task_evidence');
  assert.equal(verdict.blockers.some((item) => item.code === 'missing_edit_task_evidence'), true);
  assert.equal(verdict.authority.owner_receipt_ref, null);
});

test('provider identity in reviewer-visible output metadata is rejected', async () => {
  const { buildBlindParityReviewPacket } = await parityEvaluator();
  const pairManifest = anonymousPairManifest();
  pairManifest.anonymous_outputs[0].provider_identity = 'anonymous-vendor';

  assert.throws(
    () => buildBlindParityReviewPacket({ contract: parityContract(), pairManifest }),
    /reviewer-visible output field provider_identity is not allowed/,
  );
});

test('provider identity in the reviewer-visible source lock is rejected', async () => {
  const { buildBlindParityReviewPacket } = await parityEvaluator();
  const pairManifest = anonymousPairManifest();
  pairManifest.source_lock.provider_identity = 'vendor-alpha';

  assert.throws(
    () => buildBlindParityReviewPacket({ contract: parityContract(), pairManifest }),
    /source_lock field provider_identity is not allowed/,
  );
});

test('blind review records reject undeclared provider metadata', async () => {
  const {
    buildBlindParityReviewPacket,
    evaluateBlindPptParity,
    hashBlindParityReviewSet,
  } = await parityEvaluator();
  const contract = parityContract();
  const pairManifest = anonymousPairManifest();
  const packet = buildBlindParityReviewPacket({ contract, pairManifest });
  const reviews = blindReviews(packet, 5);
  reviews[0].provider_identity = 'vendor-alpha';

  const verdict = evaluateBlindPptParity({
    contract,
    pairManifest,
    identityBinding: parityIdentityBinding(packet, reviews, hashBlindParityReviewSet),
    reviews,
    editTaskResults: editResults(),
  });

  assert.equal(verdict.status, 'blocked');
  assert.equal(verdict.evidence_state, 'invalid_blind_review_evidence');
  assert.equal(verdict.blockers.some((item) => item.code === 'invalid_or_identity_exposing_review_record'), true);
  assert.equal(verdict.authority.owner_receipt_ref, null);
});

test('private provider mapping must bind the exact completed blind review set', async () => {
  const {
    buildBlindParityReviewPacket,
    evaluateBlindPptParity,
    hashBlindParityReviewSet,
  } = await parityEvaluator();
  const contract = parityContract();
  const pairManifest = anonymousPairManifest();
  const packet = buildBlindParityReviewPacket({ contract, pairManifest });
  const reviews = blindReviews(packet, 5);
  const identityBinding = parityIdentityBinding(packet, reviews, hashBlindParityReviewSet);
  reviews[0].scores.output_alpha.professionality = 100;

  const verdict = evaluateBlindPptParity({
    contract,
    pairManifest,
    identityBinding,
    reviews,
    editTaskResults: editResults(),
  });

  assert.equal(verdict.status, 'blocked');
  assert.equal(verdict.evidence_state, 'pending_private_identity_binding');
  assert.equal(verdict.blockers.some((item) => item.code === 'review_set_binding_mismatch'), true);
  assert.equal(verdict.authority.owner_receipt_ref, null);
});

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
    schema_version: 2,
    evidence_source: 'officecli_structured_readback',
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
