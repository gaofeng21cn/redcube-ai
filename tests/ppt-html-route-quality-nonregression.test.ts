// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { createPptDeckRenderRevisionParts } from '../packages/redcube-runtime-family-ppt/dist/ppt-deck-runtime-family-parts/render-revision.js';

const CONTRACT_REF = 'contracts/runtime-program/ppt-html-route-quality-nonregression.json';
const RENDER_SOURCE_REF = 'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/render.ts';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function assertForbiddenAuthorityBoundary(boundary) {
  assert.equal(boundary.no_forbidden_authority_flags, true);
  assert.equal(boundary.opl_agent_lab_can_write_rca_visual_truth, false);
  assert.equal(boundary.opl_agent_lab_can_write_artifact_blob, false);
  assert.equal(boundary.opl_agent_lab_can_write_memory_body, false);
  assert.equal(boundary.opl_agent_lab_can_authorize_quality_verdict, false);
  assert.equal(boundary.opl_agent_lab_can_authorize_exportable, false);
  assert.equal(boundary.opl_agent_lab_can_claim_visual_ready, false);
  assert.equal(boundary.agent_lab_score_is_rca_visual_verdict, false);
}

function makeRenderRevisionParts() {
  return createPptDeckRenderRevisionParts({
    PAGE_FIX_ROUTE: 'fix_html',
    chunkArray: (items, size) => {
      const chunks = [];
      for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
      return chunks;
    },
    collectSlidesNeedingTargetedRevision: () => [],
    currentHtmlStageId: () => 'render_html',
    loadOperatorRevisionBrief: () => null,
    normalizeInlineText: (value) => String(value || '').trim(),
    readStageArtifact: () => null,
    readdirSync: () => [],
    requireText: (value, label) => {
      const text = String(value ?? '').trim();
      if (!text) throw new Error(`Missing ${label}`);
      return text;
    },
    safeArray: (value) => Array.isArray(value) ? value : [],
    safeFileMtimeMs: () => 0,
    safeText: (value, fallback = '') => {
      const text = String(value ?? '').trim();
      return text || fallback;
    },
    stageArtifactPath: (_contract, _paths, stageId) => `${stageId}.json`,
  });
}

test('ppt HTML route quality contract keeps HTML explicit and preserves review/export gates', () => {
  const contract = readJson(CONTRACT_REF);

  assert.equal(contract.contract_id, 'ppt_html_route_quality_nonregression_v1');
  assert.equal(contract.deliverable_family, 'ppt_deck');
  assert.equal(contract.current_default_visual_route, 'author_image_pages');
  assert.equal(contract.html_route_policy.status, 'production_selectable_optional');
  assert.equal(contract.html_route_policy.explicit_selection_required, true);
  assert.equal(contract.html_route_policy.default_enabled, false);
  assert.deepEqual(contract.html_route_policy.routes, ['render_html', 'fix_html']);
  assert.equal(contract.html_route_policy.default_executor_changed, false);
  assert.deepEqual(contract.gate_non_regression.required_gates, [
    'visual_director_review',
    'screenshot_review',
    'export_pptx',
  ]);
  assert.equal(contract.gate_non_regression.visual_director_review_may_be_lowered, false);
  assert.equal(contract.gate_non_regression.screenshot_review_may_be_lowered, false);
  assert.equal(contract.gate_non_regression.export_pptx_may_be_lowered, false);
});

test('ppt HTML route quality contract describes blocked-slide-only fix_html and Agent Lab refs-only input', () => {
  const contract = readJson(CONTRACT_REF);

  assert.equal(contract.fix_html_policy.route, 'fix_html');
  assert.equal(contract.fix_html_policy.requires_prior_current_html_artifact, true);
  assert.equal(contract.fix_html_policy.target_scope, 'blocked_slide_ids_only');
  assert.deepEqual(contract.fix_html_policy.consumes_review_refs, [
    'visual_director_review',
    'screenshot_review',
    'operator_revision_brief',
  ]);
  assert.equal(contract.fix_html_policy.passed_pages_must_be_reused, true);
  assert.equal(contract.fix_html_policy.full_regeneration_allowed_without_stale_upstream_or_missing_prior_html, false);

  assert.equal(contract.agent_lab_suite_input_refs.consumer, 'opl_agent_lab');
  assert.equal(contract.agent_lab_suite_input_refs.suite_kind, 'standard');
  assert.equal(contract.agent_lab_suite_input_refs.refs_only, true);
  assert.equal(contract.agent_lab_suite_input_refs.domain_specific_suite_kind_required, false);
  assert.equal(contract.agent_lab_suite_input_refs.claims_visual_ready, false);
  assert.equal(contract.agent_lab_suite_input_refs.claims_exportable, false);
  assert.equal(contract.agent_lab_suite_input_refs.score_authority.agent_lab_score_is_rca_visual_verdict, false);
  assertForbiddenAuthorityBoundary(contract.authority_boundary);
});

test('ppt HTML route runtime exposes refs-only quality companion without verdict authority', () => {
  const contract = readJson(CONTRACT_REF);
  const parts = makeRenderRevisionParts();
  const companion = parts.htmlRouteQualityCompanion({});

  assert.equal(companion.companion_id, 'ppt_html_route_quality_nonregression_companion_v1');
  assert.equal(companion.contract_ref, CONTRACT_REF);
  assert.equal(companion.refs_only, true);
  assert.equal(companion.read_only, true);
  assert.equal(companion.current_default_visual_route, 'author_image_pages');
  assert.equal(companion.html_route_explicit_selection_required, true);
  assert.deepEqual(companion.routes, ['render_html', 'fix_html']);
  assert.deepEqual(companion.quality_gate_refs, contract.gate_non_regression.required_gates);
  assert.equal(companion.agent_lab_suite_input_ref, `${CONTRACT_REF}#/agent_lab_suite_input_refs`);
  assertForbiddenAuthorityBoundary(companion.authority_boundary);
});

test('ppt render_html source wires the HTML quality companion into stage context and artifacts', () => {
  const source = readFileSync(RENDER_SOURCE_REF, 'utf-8');

  assert.match(source, /htmlRouteQualityCompanion\(contract\)/);
  assert.match(source, /html_route_quality_companion:\s*htmlQualityCompanion/);
  assert.match(source, /html_route_quality_companion:\s*renderPlan\.html_route_quality_companion/);
});
