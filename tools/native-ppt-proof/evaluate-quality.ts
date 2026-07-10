#!/usr/bin/env node
// @ts-nocheck
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const REQUIRED_SEMANTIC_FAMILIES = [
  'relationship_graph',
  'timeline',
  'decision_ladder',
  'data_chart',
  'data_table',
  'image_evidence',
];

const PACKAGE_OBJECT_KINDS = ['chart', 'table', 'picture', 'connector', 'group', 'path'];

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function roleMatches(slide, fragments, kinds = null) {
  return safeArray(slide?.native_shapes).filter((shape) => {
    const role = String(shape?.role || '').toLowerCase();
    const kind = String(shape?.kind || '').toLowerCase();
    const qualityRole = String(shape?.quality_role || '').toLowerCase();
    return fragments.some((fragment) => role.includes(fragment))
      && ['content', 'structural'].includes(qualityRole)
      && (!kinds || kinds.includes(kind));
  });
}

function hasDirection(shape) {
  return [shape?.head_end, shape?.tail_end]
    .some((value) => value && String(value).toLowerCase() !== 'none');
}

function connectedDirectedEdges(nodes, edges) {
  const nodeIds = new Set(nodes.map((shape) => shape.shape_id).filter(Boolean));
  const validEdges = edges.filter((shape) => (
    String(shape?.kind || '') === 'connector'
    && nodeIds.has(shape?.from_shape_id)
    && nodeIds.has(shape?.to_shape_id)
    && shape.from_shape_id !== shape.to_shape_id
    && hasDirection(shape)
  ));
  if (nodeIds.size === 0 || validEdges.length === 0) return [];
  const adjacency = new Map([...nodeIds].map((nodeId) => [nodeId, new Set()]));
  for (const edge of validEdges) {
    adjacency.get(edge.from_shape_id).add(edge.to_shape_id);
    adjacency.get(edge.to_shape_id).add(edge.from_shape_id);
  }
  const pending = [[...nodeIds][0]];
  const visited = new Set();
  while (pending.length > 0) {
    const nodeId = pending.pop();
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    pending.push(...[...adjacency.get(nodeId)].filter((next) => !visited.has(next)));
  }
  return visited.size === nodeIds.size ? validEdges : [];
}

function objectSpec(shape) {
  return {
    name: shape.shape_id,
    kind: shape.kind,
    ...(String(shape?.kind || '') === 'connector' ? {
      from_shape_name: shape.from_shape_id,
      to_shape_name: shape.to_shape_id,
      directional: true,
    } : {}),
  };
}

function semanticCompositionEvidence(slide) {
  const family = String(slide?.semantic_composition || '');
  if (family === 'data_chart') {
    const objects = roleMatches(slide, ['chart', 'data'], ['chart']);
    return { ok: objects.length >= 1, family, evidence_count: objects.length, object_ids: objects.map((shape) => shape.shape_id).filter(Boolean), objects: objects.map(objectSpec) };
  }
  if (family === 'data_table') {
    const objects = roleMatches(slide, ['table', 'data'], ['table']);
    return { ok: objects.length >= 1, family, evidence_count: objects.length, object_ids: objects.map((shape) => shape.shape_id).filter(Boolean), objects: objects.map(objectSpec) };
  }
  if (family === 'image_evidence') {
    const objects = safeArray(slide?.native_shapes).filter((shape) => {
      const role = String(shape?.role || '').toLowerCase();
      const qualityRole = String(shape?.quality_role || '').toLowerCase();
      return String(shape?.kind || '') === 'picture'
        && ['content', 'structural'].includes(qualityRole)
        && ['evidence', 'screenshot', 'photo', 'diagram', 'visual'].some((fragment) => role.includes(fragment));
    });
    return { ok: objects.length >= 1, family, evidence_count: objects.length, object_ids: objects.map((shape) => shape.shape_id).filter(Boolean), objects: objects.map(objectSpec) };
  }

  const nodeKinds = ['rect', 'rounded_rect', 'oval', 'circle'];
  const edgeKinds = ['connector'];
  const familyRules = {
    relationship_graph: {
      nodes: roleMatches(slide, ['dependency_node', 'relationship_node', 'map_node'], nodeKinds),
      edge_candidates: roleMatches(slide, ['dependency_connector', 'relationship_connector', 'map_connector'], edgeKinds),
      minimum_nodes: 3,
      minimum_edges: 2,
    },
    timeline: {
      nodes: roleMatches(slide, ['milestone', 'timeline_node'], nodeKinds),
      edge_candidates: roleMatches(slide, ['timeline_connector'], edgeKinds),
      minimum_nodes: 3,
      minimum_edges: 1,
    },
    decision_ladder: {
      nodes: roleMatches(slide, ['decision_step', 'judgement_step', 'gate_step'], nodeKinds),
      edge_candidates: roleMatches(slide, ['decision_connector', 'gate_connector'], edgeKinds),
      minimum_nodes: 3,
      minimum_edges: 1,
    },
  };
  const rule = familyRules[family];
  if (!rule) {
    return { ok: false, family, reason: 'semantic_composition_not_supported' };
  }
  const edges = connectedDirectedEdges(rule.nodes, rule.edge_candidates);
  return {
    ok: rule.nodes.length >= rule.minimum_nodes && edges.length >= rule.minimum_edges,
    family,
    object_ids: [...rule.nodes, ...edges].map((shape) => shape.shape_id).filter(Boolean),
    objects: [...rule.nodes, ...edges].map(objectSpec),
    node_count: rule.nodes.length,
    edge_count: edges.length,
    minimum_nodes: rule.minimum_nodes,
    minimum_edges: rule.minimum_edges,
  };
}

function packageSemanticCompositionEvidence(family, readback, authored, manifestSlide) {
  const requirements = {
    relationship_graph: ['connector', 2],
    timeline: ['connector', 2],
    decision_ladder: ['connector', 2],
    data_chart: ['chart', 1],
    data_table: ['table', 1],
    image_evidence: ['picture', 1],
  };
  const [kind, minimum] = requirements[family] || ['', Number.POSITIVE_INFINITY];
  const objects = safeArray(readback?.objects);
  const actual = objects.filter((object) => String(object?.kind || '') === kind).length;
  const actualByName = new Map(objects.map((object) => [object?.name, object]));
  const manifestByName = new Map(safeArray(manifestSlide?.native_shapes)
    .map((shape) => [shape?.shape_id, shape]));
  const failures = [];
  for (const expected of safeArray(authored?.objects)) {
    const actualObject = actualByName.get(expected.name);
    const materialized = manifestByName.get(expected.name);
    if (!actualObject) {
      failures.push({ name: expected.name, reason: 'authored_object_missing_from_package' });
      continue;
    }
    if (String(actualObject.kind || '') !== String(expected.kind || '')) {
      failures.push({
        name: expected.name,
        reason: 'authored_object_kind_mismatch',
        expected: expected.kind,
        actual: actualObject.kind || null,
      });
    }
    if (!materialized || materialized.package_readback_verified !== true) {
      failures.push({ name: expected.name, reason: 'materialized_object_not_package_verified' });
    } else {
      if (String(materialized.materialized_kind || '') !== String(actualObject.kind || '')) {
        failures.push({ name: expected.name, reason: 'manifest_package_kind_mismatch' });
      }
      if (String(materialized.materialized_object_id || '') !== String(actualObject.object_id || '')) {
        failures.push({ name: expected.name, reason: 'manifest_package_object_id_mismatch' });
      }
    }
    if (expected.directional) {
      if (actualObject.from_shape_name !== expected.from_shape_name
          || actualObject.to_shape_name !== expected.to_shape_name) {
        failures.push({
          name: expected.name,
          reason: 'connector_endpoint_mismatch',
          expected_from: expected.from_shape_name,
          expected_to: expected.to_shape_name,
          actual_from: actualObject.from_shape_name || null,
          actual_to: actualObject.to_shape_name || null,
        });
      }
      if (![actualObject.head_end, actualObject.tail_end]
        .some((value) => value && String(value).toLowerCase() !== 'none')) {
        failures.push({ name: expected.name, reason: 'connector_direction_missing' });
      }
    }
  }
  return {
    ok: actual >= minimum && failures.length === 0,
    kind,
    actual,
    minimum,
    required_object_ids: safeArray(authored?.object_ids),
    failures,
  };
}

function materializedManifestBinding({ suite, packageReadback, shapeManifest }) {
  const expectedSha = String(packageReadback?.pptx_sha256 || '');
  const slides = safeArray(shapeManifest?.slides);
  const expectedSlides = safeArray(suite?.editable_shape_plan?.slides);
  const failures = [];
  if (!expectedSha || String(shapeManifest?.render_proof?.source_pptx_sha256 || '') !== expectedSha) {
    failures.push({ reason: 'manifest_root_pptx_sha_mismatch' });
  }
  if (Number(shapeManifest?.page_count || 0) !== expectedSlides.length
      || Number(shapeManifest?.render_proof?.slide_count || 0) !== expectedSlides.length
      || slides.length !== expectedSlides.length) {
    failures.push({
      reason: 'manifest_page_count_mismatch',
      expected: expectedSlides.length,
      page_count: Number(shapeManifest?.page_count || 0),
      render_slide_count: Number(shapeManifest?.render_proof?.slide_count || 0),
      slides: slides.length,
    });
  }
  for (const [index, expectedSlide] of expectedSlides.entries()) {
    const slide = slides[index];
    if (!slide || slide.slide_id !== expectedSlide.slide_id) {
      failures.push({ reason: 'manifest_slide_identity_mismatch', index, expected: expectedSlide.slide_id, actual: slide?.slide_id || null });
      continue;
    }
    if (String(slide?.render_provenance?.source_pptx_sha256 || '') !== expectedSha) {
      failures.push({ reason: 'manifest_slide_pptx_sha_mismatch', slide_id: expectedSlide.slide_id });
    }
    if (!String(slide?.metrics?.composition_signature || '').trim()) {
      failures.push({ reason: 'manifest_composition_signature_missing', slide_id: expectedSlide.slide_id });
    }
    if (safeArray(slide?.native_shapes).length === 0
        || safeArray(slide?.native_shapes).some((shape) => !shape?.bounds)) {
      failures.push({ reason: 'manifest_materialized_bounds_missing', slide_id: expectedSlide.slide_id });
    }
  }
  return {
    ok: failures.length === 0,
    pptx_sha256: expectedSha || null,
    slide_count: slides.length,
    failures,
  };
}

function materializedCompositionSignature(slide) {
  const payload = safeArray(slide?.native_shapes)
    .filter((shape) => ['content', 'structural'].includes(String(shape?.quality_role || '').toLowerCase()))
    .map((shape) => {
      const bounds = shape?.bounds || {};
      const left = Number(bounds.left ?? (Number(bounds.left_in || 0) * 72));
      const top = Number(bounds.top ?? (Number(bounds.top_in || 0) * 72));
      const width = Number(bounds.width ?? (Number(bounds.width_in || 0) * 72));
      const height = Number(bounds.height ?? (Number(bounds.height_in || 0) * 72));
      return {
        kind: String(shape?.materialized_kind || shape?.kind || ''),
        left: Math.round(left / 12),
        top: Math.round(top / 12),
        width: Math.round(width / 12),
        height: Math.round(height / 12),
      };
    })
    .sort((left, right) => (
      left.kind.localeCompare(right.kind)
      || left.top - right.top
      || left.left - right.left
      || left.width - right.width
      || left.height - right.height
    ));
  if (payload.length === 0) return '';
  return `materialized:${createHash('sha256').update(JSON.stringify(payload)).digest('hex')}`;
}

function packageRelationshipIntegrity(packageReadback) {
  const counts = packageReadback?.object_type_counts || {};
  const slides = safeArray(packageReadback?.slides);
  const relatedObjects = slides.flatMap((slide) => safeArray(slide?.objects))
    .filter((item) => ['chart', 'picture'].includes(String(item?.kind || '')));
  const failures = [];
  for (const kind of ['chart', 'picture']) {
    const expected = Number(counts[kind] || 0);
    const objects = relatedObjects.filter((item) => item.kind === kind);
    const contentTypeFragment = kind === 'chart' ? 'drawingml.chart' : 'image/';
    const resolved = objects.filter((item) => (
      item?.relationship_resolved === true
      && String(item?.content_type || '').toLowerCase().includes(contentTypeFragment)
    ));
    if (objects.length !== expected || resolved.length !== expected) {
      failures.push({ kind, expected, objects: objects.length, resolved: resolved.length });
    }
  }
  const expectedNotes = Number(packageReadback?.notes_slide_count || 0);
  const resolvedNotes = slides.filter((slide) => (
    String(slide?.notes_part || '').trim()
    && slide?.notes_relationship_resolved === true
    && String(slide?.notes_content_type || '').toLowerCase().includes('presentationml.notesslide')
  )).length;
  if (resolvedNotes !== expectedNotes) {
    failures.push({ kind: 'notes', expected: expectedNotes, resolved: resolvedNotes });
  }
  const partCounts = packageReadback?.part_counts || {};
  for (const [kind, partKind] of [['chart', 'chart'], ['picture', 'media'], ['notes', 'notes']]) {
    const expected = kind === 'notes' ? expectedNotes : Number(counts[kind] || 0);
    const actual = Number(partCounts[partKind] || 0);
    if (actual < expected) failures.push({ kind: `${kind}_part`, expected, actual });
  }
  return {
    ok: failures.length === 0,
    failures,
  };
}

function normalizedPackageCounts(packageReadback) {
  return {
    ...(packageReadback?.object_type_counts || {}),
    notes: Number(packageReadback?.notes_slide_count || 0),
    transition: Number(packageReadback?.transition_count || 0),
    timing: Number(packageReadback?.animation_count || 0),
  };
}

function pictureEvidencePayload(packageReadback, authoredPictures, minimumBytes) {
  const expectedByName = new Map(safeArray(authoredPictures).map((shape) => [shape?.shape_id, shape]));
  const pictures = safeArray(packageReadback?.slides)
    .flatMap((slide) => safeArray(slide?.objects))
    .filter((item) => String(item?.kind || '') === 'picture')
    .map((item) => ({
      name: item?.name || null,
      embedded_size_bytes: Number(item?.embedded_size_bytes || 0),
      embedded_sha256: String(item?.embedded_sha256 || ''),
      alt_text: String(item?.alt_text || ''),
      has_alt: item?.has_alt === true,
      crop: item?.crop || null,
    }));
  const failures = [];
  for (const item of pictures) {
    const expected = expectedByName.get(item.name);
    if (item.embedded_size_bytes < minimumBytes) {
      failures.push({
        name: item.name,
        reason: 'embedded_picture_too_small',
        actual_bytes: item.embedded_size_bytes,
        minimum_bytes: minimumBytes,
      });
    }
    if (!item.has_alt || !item.alt_text.trim()) {
      failures.push({
        name: item.name,
        reason: 'picture_alt_missing',
      });
    } else if (!expected || item.alt_text !== String(expected.alt || expected.alt_text || '')) {
      failures.push({
        name: item.name,
        reason: 'picture_alt_mismatch',
      });
    }
    if (!expected?.source_sha256 || item.embedded_sha256 !== String(expected.source_sha256)) {
      failures.push({
        name: item.name,
        reason: 'picture_source_sha_mismatch',
        expected_sha256: expected?.source_sha256 || null,
        actual_sha256: item.embedded_sha256 || null,
      });
    }
  }
  return {
    ok: pictures.length === expectedByName.size && pictures.length > 0 && failures.length === 0,
    minimum_bytes: minimumBytes,
    expected_picture_count: expectedByName.size,
    pictures,
    failures,
  };
}

function gate(gateId, passed, evidence, reason) {
  return {
    gate_id: gateId,
    status: passed ? 'passed' : 'failed',
    reason: passed ? null : reason,
    evidence,
  };
}

export function evaluateNativePptBenchmark({ fixture, suite, packageReadback, shapeManifest }) {
  const slides = safeArray(suite?.editable_shape_plan?.slides);
  const packageCounts = normalizedPackageCounts(packageReadback);
  const expectations = suite?.package_expectations || {};
  const requiredObjectCounts = expectations.required_object_counts || {
    chart: 1,
    table: 1,
    picture: 1,
    connector: 4,
  };
  const packageSlides = safeArray(packageReadback?.slides);
  const manifestSlides = safeArray(shapeManifest?.slides);
  const manifestBinding = materializedManifestBinding({ suite, packageReadback, shapeManifest });
  const semanticResults = slides.map((slide, index) => {
    const authored = semanticCompositionEvidence(slide);
    const packageEvidence = packageSemanticCompositionEvidence(
      slide.semantic_composition,
      packageSlides[index],
      authored,
      manifestSlides[index],
    );
    return {
      slide_id: slide.slide_id,
      family: slide.semantic_composition,
      ok: authored.ok && packageEvidence.ok,
      authored,
      package: packageEvidence,
    };
  });
  const semanticFamilies = [...new Set(slides.map((slide) => slide.semantic_composition).filter(Boolean))];
  const signatures = manifestSlides
    .map(materializedCompositionSignature)
    .filter(Boolean);
  const distinctSignatureShare = slides.length > 0 ? new Set(signatures).size / slides.length : 0;
  const minimumDistinctShare = Number(suite?.benchmark_thresholds?.min_distinct_composition_share || 0.83);
  const packageObjectKinds = PACKAGE_OBJECT_KINDS.filter((kind) => Number(packageCounts[kind] || 0) > 0);
  const minimumObjectKinds = Number(expectations.minimum_distinct_object_kinds || 4);
  const objectFailures = Object.entries(requiredObjectCounts)
    .filter(([kind, minimum]) => Number(packageCounts[kind] || 0) < Number(minimum))
    .map(([kind, minimum]) => ({
      kind,
      actual: Number(packageCounts[kind] || 0),
      minimum: Number(minimum),
    }));
  const requiredSemanticFamiliesPresent = REQUIRED_SEMANTIC_FAMILIES.every((family) => semanticFamilies.includes(family));
  const notesMinimum = Number(expectations.minimum_notes_count || slides.length);
  const transitionsMinimum = Number(expectations.minimum_transition_count || 1);
  const relationshipIntegrity = packageRelationshipIntegrity(packageReadback);
  const picturePayload = pictureEvidencePayload(
    packageReadback,
    slides.flatMap((slide) => safeArray(slide?.native_shapes))
      .filter((shape) => String(shape?.kind || '') === 'picture'),
    Number(expectations.minimum_picture_bytes || 4096),
  );
  const notesResults = slides.map((slide, index) => {
    const expected = String(slide?.speaker_notes || '').trim();
    const actual = String(packageSlides[index]?.speaker_notes || '').trim();
    return {
      slide_id: slide?.slide_id || null,
      expected_present: Boolean(expected),
      actual_present: Boolean(actual),
      exact_match: Boolean(expected) && actual === expected,
    };
  });

  const gates = [
    gate(
      'package_readback_source',
      packageReadback?.schema_version === 1
        && packageReadback?.evidence_source === 'pptx_package_readback',
      {
        schema_version: packageReadback?.schema_version || null,
        evidence_source: packageReadback?.evidence_source || null,
      },
      'quality evidence must come from PPTX package readback',
    ),
    gate(
      'page_count',
      Number(packageReadback?.slide_count || 0) === Number(suite?.expected_page_count || slides.length),
      { actual: Number(packageReadback?.slide_count || 0), expected: Number(suite?.expected_page_count || slides.length) },
      'package page count does not match the benchmark suite',
    ),
    gate(
      'materialized_manifest_binding',
      manifestBinding.ok,
      manifestBinding,
      'materialized shape evidence must be bound to the same PPTX SHA and slide identities',
    ),
    gate(
      'package_relationship_integrity',
      relationshipIntegrity.ok,
      relationshipIntegrity,
      'chart, picture, and notes counts must be backed by resolved OOXML relationships and content types',
    ),
    gate(
      'picture_evidence_payload',
      picturePayload.ok,
      picturePayload,
      'picture evidence must contain a non-placeholder embedded payload',
    ),
    gate(
      'semantic_page_composition',
      requiredSemanticFamiliesPresent && semanticResults.every((item) => item.ok),
      { required_families: REQUIRED_SEMANTIC_FAMILIES, actual_families: semanticFamilies, slides: semanticResults },
      'page labels are not backed by the required semantic object composition',
    ),
    gate(
      'composition_diversity',
      manifestBinding.ok && signatures.length === slides.length && distinctSignatureShare >= minimumDistinctShare,
      { signature_count: signatures.length, distinct_count: new Set(signatures).size, distinct_share: distinctSignatureShare, minimum_distinct_share: minimumDistinctShare },
      'composition signatures repeat beyond the benchmark silhouette budget',
    ),
    gate(
      'package_object_diversity',
      packageObjectKinds.length >= minimumObjectKinds,
      { object_kinds: packageObjectKinds, actual: packageObjectKinds.length, minimum: minimumObjectKinds },
      'PPTX package contains too few distinct native object families',
    ),
    gate(
      'package_required_objects',
      objectFailures.length === 0,
      { required_object_counts: requiredObjectCounts, failures: objectFailures },
      'PPTX package is missing required chart, table, picture, or connector objects',
    ),
    gate(
      'speaker_notes_readback',
      Number(packageCounts.notes || 0) >= notesMinimum
        && notesResults.every((item) => item.exact_match),
      { actual: Number(packageCounts.notes || 0), minimum: notesMinimum, slides: notesResults },
      'speaker notes were not preserved in the PPTX package',
    ),
    gate(
      'transition_readback',
      Number(packageCounts.transition || 0) >= transitionsMinimum,
      { actual: Number(packageCounts.transition || 0), minimum: transitionsMinimum },
      'slide transitions were not preserved in the PPTX package',
    ),
  ];
  const failed = gates.filter((item) => item.status === 'failed');
  return {
    schema_version: 1,
    verdict_kind: 'native_ppt_quality_candidate',
    status: failed.length > 0 ? 'route_back_candidate' : 'pass_candidate',
    fixture_id: fixture?.fixture_id || null,
    suite_id: suite?.suite_id || null,
    gates,
    failures: failed.map((item) => ({ gate_id: item.gate_id, reason: item.reason })),
    evidence: {
      source: 'pptx_package_readback',
      pptx_sha256: packageReadback?.pptx_sha256 || null,
      package_counts: packageCounts,
      relationship_integrity: relationshipIntegrity,
      materialized_manifest_binding: manifestBinding,
      semantic_families: semanticFamilies,
      distinct_composition_share: distinctSignatureShare,
    },
    progress: {
      requires_human_gate: false,
      recommended_action: failed.length > 0 ? 'repair_pptx_native' : 'continue_visual_review',
      package_gate_evaluation_complete: true,
      terminal_quality_evaluation: false,
    },
    visual_review: {
      status: failed.length > 0 ? 'route_back_candidate' : 'candidate_pending_independent_review',
      owner_verdict: null,
    },
    authority: {
      owner: 'RedCube AI',
      owner_verdict_claimed: false,
      can_sign_owner_receipt: false,
      candidate_only: true,
    },
  };
}

function cliArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function runCli() {
  const fixtureFile = cliArg('--fixture');
  const suiteId = cliArg('--suite-id');
  const readbackFile = cliArg('--package-readback');
  const shapeManifestFile = cliArg('--shape-manifest');
  const outputFile = cliArg('--output');
  if (!fixtureFile || !readbackFile || !shapeManifestFile || !outputFile) {
    throw new Error('Usage: evaluate-quality.ts --fixture <benchmark.json> --suite-id <id> --package-readback <readback.json> --shape-manifest <manifest.json> --output <verdict.json>');
  }
  const fixture = JSON.parse(fs.readFileSync(path.resolve(fixtureFile), 'utf-8'));
  const suite = safeArray(fixture.suites).find((item) => item.suite_id === suiteId) || safeArray(fixture.suites)[0];
  if (!suite) throw new Error('Benchmark fixture does not contain a suite');
  const packageReadback = JSON.parse(fs.readFileSync(path.resolve(readbackFile), 'utf-8'));
  const shapeManifest = JSON.parse(fs.readFileSync(path.resolve(shapeManifestFile), 'utf-8'));
  const verdict = evaluateNativePptBenchmark({ fixture, suite, packageReadback, shapeManifest });
  fs.writeFileSync(path.resolve(outputFile), `${JSON.stringify(verdict, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(verdict, null, 2)}\n`);
  if (verdict.status !== 'pass_candidate') process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli();
}
