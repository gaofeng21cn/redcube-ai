// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const CONTRACT_PATH = 'contracts/runtime-program/opl-family-contract-adoption.json';
const DOC_PATH = 'docs/references/opl_family_contract_adoption.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function contract() {
  return JSON.parse(read(CONTRACT_PATH));
}

test('RCA declares thin OPL family contract adoption', () => {
  const payload = contract();
  const doc = read(DOC_PATH);

  assert.equal(payload.contract_kind, 'rca_opl_family_contract_adoption.v1');
  assert.equal(payload.domain_id, 'redcube-ai');
  assert.equal(payload.opl_role, 'family-level projection consumer only');
  assert.match(doc, /不把 `OPL` 变成 RedCube visual truth owner/);
});

test('RCA runtime projection maps to visual deliverable runtime surfaces', () => {
  const payload = contract();
  const doc = read(DOC_PATH);
  const attempt = payload.attempt_projection;

  for (const surface of ['product-entry session', 'runtimeWatch', 'artifact inventory', 'runtime health']) {
    assert.ok(attempt.source_surfaces.includes(surface));
    assert.match(doc, new RegExp(surface.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.equal(attempt.maps_to_opl_contract, 'opl_family_runtime_attempt_contract.v1');
  assert.match(attempt.owner_boundary, /RCA owns visual deliverable runtime/);
});

test('RCA quality projection keeps visual proof owner and excludes other domain gates', () => {
  const payload = contract();
  const doc = read(DOC_PATH);
  const quality = payload.quality_projection;

  for (const surface of [
    'content-fit review',
    'visual_director_review',
    'screenshot_review',
    'render proof',
    'export proof',
    'getReviewState',
    'getPublicationProjection',
  ]) {
    assert.ok(quality.source_surfaces.includes(surface));
    assert.match(doc, new RegExp(surface.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.equal(quality.maps_to_opl_contract, 'opl_family_domain_quality_projection_contract.v1');
  assert.equal(quality.claim_only_ready_forbidden, true);
  for (const forbidden of [
    'claim-only ready',
    'generic persona QA',
    'medical publication gate',
    'grant fundability gate',
    'OPL projection-only',
  ]) {
    assert.match(doc, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('RCA operator and incident projection require source refs and RCA closure', () => {
  const payload = contract();
  const doc = read(DOC_PATH);
  const incident = payload.incident_projection;
  const operator = payload.operator_projection;

  assert.equal(incident.maps_to_opl_contract, 'opl_family_incident_learning_loop.v1');
  assert.match(incident.closure_rule, /RCA-owned closure ref/);
  for (const field of ['source_refs', 'freshness', 'owner_split', 'next_surface_ref', 'human_gate_reason']) {
    assert.ok(operator.required_fields.includes(field));
    assert.match(doc, new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  for (const nonGoal of [
    'OPL owns RedCube visual truth',
    'OPL owns canonical artifacts',
    'OPL owns review/export judgment',
    'medical publication gate',
    'grant fundability gate',
  ]) {
    assert.ok(payload.non_goals.includes(nonGoal));
  }
});

